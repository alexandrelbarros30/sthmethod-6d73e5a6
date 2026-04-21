import { useState, useRef, useEffect, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { ImagePlus, Download, Loader2, ZoomIn, RotateCcw, Move } from "lucide-react";
import evolutionFrame from "@/assets/evolution-frame.png";
import { getSecureFileUrl, extractStoragePath } from "@/lib/secure-file-url";

interface BodyImage {
  id: string;
  type: string;
  image_url: string;
  storage_path?: string | null;
  uploaded_at: string;
  is_current: boolean;
}

interface EvolutionGeneratorProps {
  allImages: BodyImage[];
  studentName: string;
}

const TYPE_LABELS: Record<string, string> = { front: "Frente", back: "Costas", profile: "Perfil" };
const IMAGE_TYPES = ["front", "back", "profile"] as const;
type ImageType = typeof IMAGE_TYPES[number];

// Canvas dimensions matching the frame aspect ratio
const CANVAS_WIDTH = 1080;
const CANVAS_HEIGHT = 1350;

function groupByDate(images: BodyImage[]): { date: string; label: string; images: BodyImage[] }[] {
  const grouped: Record<string, BodyImage[]> = {};
  images.forEach((img) => {
    const date = img.uploaded_at.split("T")[0];
    if (!grouped[date]) grouped[date] = [];
    grouped[date].push(img);
  });
  return Object.entries(grouped)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([date, imgs]) => ({
      date,
      label: new Date(date + "T12:00:00").toLocaleDateString("pt-BR"),
      images: imgs,
    }));
}

function loadImage(url: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error("Falha ao carregar imagem"));
    img.src = url;
  });
}

/**
 * Draws an image inside a box with a "cover" base + user transforms (zoom, offsetX, offsetY).
 * Zoom 1 = contain (full body visible). Higher zoom = ampliar (cortar bordas). offsets em % do box.
 */
function drawImageWithTransform(
  ctx: CanvasRenderingContext2D,
  img: HTMLImageElement,
  box: { x: number; y: number; w: number; h: number },
  transform: { zoom: number; offsetX: number; offsetY: number }
) {
  const { x, y, w, h } = box;
  const { zoom, offsetX, offsetY } = transform;

  // Base size = contain
  const imgRatio = img.width / img.height;
  const boxRatio = w / h;
  let baseW: number, baseH: number;
  if (imgRatio > boxRatio) {
    baseW = w;
    baseH = w / imgRatio;
  } else {
    baseH = h;
    baseW = h * imgRatio;
  }

  const dw = baseW * zoom;
  const dh = baseH * zoom;
  const dx = x + (w - dw) / 2 + (offsetX / 100) * w;
  const dy = y + (h - dh) / 2 + (offsetY / 100) * h;

  ctx.save();
  ctx.beginPath();
  ctx.rect(x, y, w, h);
  ctx.clip();
  ctx.drawImage(img, dx, dy, dw, dh);
  ctx.restore();
}

interface PhotoTransform {
  zoom: number;     // 0.5 - 3
  offsetX: number;  // -50 - 50 (% do box)
  offsetY: number;  // -50 - 50 (% do box)
}

const DEFAULT_TRANSFORM: PhotoTransform = { zoom: 1, offsetX: 0, offsetY: 0 };

type TransformKey = `${"old" | "new"}_${ImageType}`;
type TransformMap = Record<TransformKey, PhotoTransform>;

function makeKey(side: "old" | "new", type: ImageType): TransformKey {
  return `${side}_${type}` as TransformKey;
}

const EvolutionGenerator = ({ allImages, studentName }: EvolutionGeneratorProps) => {
  const groups = groupByDate(allImages);
  const [oldDate, setOldDate] = useState("");
  const [newDate, setNewDate] = useState("");
  const [generating, setGenerating] = useState(false);
  const [previews, setPreviews] = useState<string[]>([]);
  const [transforms, setTransforms] = useState<TransformMap>({} as TransformMap);
  const [loadedImages, setLoadedImages] = useState<Partial<Record<TransformKey, HTMLImageElement>>>({});
  const [frameImage, setFrameImage] = useState<HTMLImageElement | null>(null);
  const [activeType, setActiveType] = useState<ImageType>("front");
  const [livePreviews, setLivePreviews] = useState<Partial<Record<ImageType, string>>>({});
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Load frame once
  useEffect(() => {
    loadImage(evolutionFrame).then(setFrameImage).catch(() => {});
  }, []);

  const oldGroup = useMemo(() => groups.find((g) => g.date === oldDate), [groups, oldDate]);
  const newGroup = useMemo(() => groups.find((g) => g.date === newDate), [groups, newDate]);

  // Load images when both dates selected
  useEffect(() => {
    if (!oldGroup || !newGroup) return;
    let cancelled = false;
    (async () => {
      const next: Partial<Record<TransformKey, HTMLImageElement>> = {};
      const initT: Partial<TransformMap> = {};
      for (const type of IMAGE_TYPES) {
        for (const [side, group] of [["old", oldGroup], ["new", newGroup]] as const) {
          const img = group.images.find((i) => i.type === type);
          if (!img) continue;
          const url = await getSecureFileUrl({
            bucket: "body-images",
            storagePath: img.storage_path || extractStoragePath(img.image_url, "body-images"),
            fallbackUrl: img.image_url,
          });
          if (!url) continue;
          try {
            const el = await loadImage(url);
            if (cancelled) return;
            next[makeKey(side, type)] = el;
            initT[makeKey(side, type)] = { ...DEFAULT_TRANSFORM };
          } catch {}
        }
      }
      if (cancelled) return;
      setLoadedImages(next);
      setTransforms((prev) => ({ ...initT, ...prev } as TransformMap));
    })();
    return () => { cancelled = true; };
  }, [oldGroup, newGroup]);

  // Render live preview for a given type
  const renderPreview = (type: ImageType): string | null => {
    if (!frameImage) return null;
    const oldEl = loadedImages[makeKey("old", type)];
    const newEl = loadedImages[makeKey("new", type)];
    if (!oldEl || !newEl) return null;
    const tOld = transforms[makeKey("old", type)] || DEFAULT_TRANSFORM;
    const tNew = transforms[makeKey("new", type)] || DEFAULT_TRANSFORM;

    const canvas = document.createElement("canvas");
    canvas.width = CANVAS_WIDTH;
    canvas.height = CANVAS_HEIGHT;
    const ctx = canvas.getContext("2d")!;

    ctx.drawImage(frameImage, 0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

    const headerHeight = Math.round(CANVAS_HEIGHT * 0.19);
    const footerHeight = Math.round(CANVAS_HEIGHT * 0.05);
    const photoAreaY = headerHeight;
    const photoAreaH = CANVAS_HEIGHT - headerHeight - footerHeight;
    const halfWidth = CANVAS_WIDTH / 2;
    const gap = 2;

    drawImageWithTransform(ctx, oldEl, { x: 0, y: photoAreaY, w: halfWidth - gap, h: photoAreaH }, tOld);
    drawImageWithTransform(ctx, newEl, { x: halfWidth + gap, y: photoAreaY, w: halfWidth - gap, h: photoAreaH }, tNew);

    // Re-draw header and footer
    const headerSrcH = Math.round(frameImage.height * 0.19);
    ctx.drawImage(frameImage, 0, 0, frameImage.width, headerSrcH, 0, 0, CANVAS_WIDTH, headerHeight);
    const footerSrcY = Math.round(frameImage.height * 0.95);
    ctx.drawImage(
      frameImage,
      0, footerSrcY, frameImage.width, frameImage.height - footerSrcY,
      0, CANVAS_HEIGHT - footerHeight, CANVAS_WIDTH, footerHeight
    );

    ctx.strokeStyle = "rgba(180,180,180,0.5)";
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(halfWidth, photoAreaY);
    ctx.lineTo(halfWidth, CANVAS_HEIGHT - footerHeight);
    ctx.stroke();

    const badgeW = 140;
    const badgeH = 32;
    const badgeX = halfWidth - badgeW / 2;
    const badgeY = photoAreaY + photoAreaH - badgeH - 10;
    ctx.fillStyle = "rgba(0,0,0,0.6)";
    ctx.beginPath();
    ctx.roundRect(badgeX, badgeY, badgeW, badgeH, 4);
    ctx.fill();
    ctx.fillStyle = "#ffffff";
    ctx.font = "bold 16px Arial, sans-serif";
    ctx.textAlign = "center";
    ctx.fillText(TYPE_LABELS[type].toUpperCase(), halfWidth, badgeY + badgeH / 2 + 5);

    return canvas.toDataURL("image/jpeg", 0.92);
  };

  // Re-render live preview for active type whenever transforms change
  useEffect(() => {
    if (!frameImage || Object.keys(loadedImages).length === 0) return;
    const updates: Partial<Record<ImageType, string>> = {};
    for (const type of IMAGE_TYPES) {
      const dataUrl = renderPreview(type);
      if (dataUrl) updates[type] = dataUrl;
    }
    setLivePreviews(updates);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [frameImage, loadedImages, transforms]);

  const updateTransform = (side: "old" | "new", type: ImageType, patch: Partial<PhotoTransform>) => {
    setTransforms((prev) => {
      const key = makeKey(side, type);
      const current = prev[key] || DEFAULT_TRANSFORM;
      return { ...prev, [key]: { ...current, ...patch } };
    });
  };

  const resetTransform = (side: "old" | "new", type: ImageType) => {
    updateTransform(side, type, DEFAULT_TRANSFORM);
  };

  const matchProportions = (type: ImageType) => {
    // Iguala o zoom da foto antiga e nova: usa o maior zoom entre os dois para aproximar o aluno proporcionalmente
    const tOld = transforms[makeKey("old", type)] || DEFAULT_TRANSFORM;
    const tNew = transforms[makeKey("new", type)] || DEFAULT_TRANSFORM;
    const avg = (tOld.zoom + tNew.zoom) / 2;
    updateTransform("old", type, { zoom: avg });
    updateTransform("new", type, { zoom: avg });
    toast.success("Proporções igualadas para esta posição.");
  };

  if (groups.length < 2) {
    return (
      <Card>
        <CardContent className="py-6">
          <p className="text-sm text-muted-foreground text-center">
            É necessário pelo menos 2 conjuntos de fotos em datas diferentes para gerar evolução.
          </p>
        </CardContent>
      </Card>
    );
  }

  const handleGenerate = async () => {
    if (!oldDate || !newDate) {
      toast.error("Selecione as datas antiga e nova.");
      return;
    }
    if (oldDate === newDate) {
      toast.error("Selecione datas diferentes.");
      return;
    }

    if (!oldGroup || !newGroup) return;

    setGenerating(true);
    setPreviews([]);

    try {
      const results: string[] = [];
      for (const type of IMAGE_TYPES) {
        const dataUrl = renderPreview(type);
        if (dataUrl) results.push(dataUrl);
      }

      if (results.length === 0) {
        toast.error("Nenhuma posição correspondente encontrada entre as datas.");
      } else {
        setPreviews(results);
        toast.success(`${results.length} imagem(ns) de evolução gerada(s)!`);
      }
    } catch (err: any) {
      console.error("Evolution generation error:", err);
      toast.error("Erro ao gerar evolução: " + (err.message || "Tente novamente."));
    }

    setGenerating(false);
  };

  const handleDownload = (dataUrl: string, index: number) => {
    const link = document.createElement("a");
    link.download = `evolucao_${studentName.replace(/\s+/g, "_")}_${IMAGE_TYPES[index] || index}.jpg`;
    link.href = dataUrl;
    link.click();
  };

  const handleDownloadAll = () => {
    previews.forEach((p, i) => handleDownload(p, i));
  };

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-display flex items-center gap-2">
          <ImagePlus className="w-4 h-4" /> Gerar Evolução
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <Label className="text-xs">Foto Antiga (Antes)</Label>
            <Select value={oldDate} onValueChange={setOldDate}>
              <SelectTrigger className="text-xs">
                <SelectValue placeholder="Selecione a data" />
              </SelectTrigger>
              <SelectContent>
                {groups.map((g) => (
                  <SelectItem key={g.date} value={g.date} className="text-xs">
                    {g.label} ({g.images.length} fotos)
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs">Foto Nova (Depois)</Label>
            <Select value={newDate} onValueChange={setNewDate}>
              <SelectTrigger className="text-xs">
                <SelectValue placeholder="Selecione a data" />
              </SelectTrigger>
              <SelectContent>
                {groups.map((g) => (
                  <SelectItem key={g.date} value={g.date} className="text-xs">
                    {g.label} ({g.images.length} fotos)
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <Button
          className="w-full"
          onClick={handleGenerate}
          disabled={generating || !oldDate || !newDate}
        >
          {generating ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" /> Gerando...
            </>
          ) : (
            <>
              <ImagePlus className="w-4 h-4" /> Gerar Evolução
            </>
          )}
        </Button>

        {/* Editor de fotos ao vivo */}
        {oldDate && newDate && Object.keys(loadedImages).length > 0 && (
          <div className="space-y-3 rounded-lg border border-border p-3 bg-muted/30">
            <div className="flex items-center justify-between gap-2">
              <Label className="text-xs font-semibold flex items-center gap-1">
                <Move className="w-3 h-3" /> Editar Fotos
              </Label>
              <Select value={activeType} onValueChange={(v) => setActiveType(v as ImageType)}>
                <SelectTrigger className="text-xs h-8 w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {IMAGE_TYPES.map((t) => (
                    <SelectItem key={t} value={t} className="text-xs">{TYPE_LABELS[t]}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {livePreviews[activeType] && (
              <img
                src={livePreviews[activeType]}
                alt="Preview ao vivo"
                className="w-full rounded border border-border"
              />
            )}

            <Button
              variant="outline"
              size="sm"
              className="w-full text-xs"
              onClick={() => matchProportions(activeType)}
            >
              <ZoomIn className="w-3 h-3 mr-1" /> Igualar Proporções (Antes/Depois)
            </Button>

            {(["old", "new"] as const).map((side) => {
              const key = makeKey(side, activeType);
              const t = transforms[key] || DEFAULT_TRANSFORM;
              const exists = !!loadedImages[key];
              if (!exists) return null;
              return (
                <div key={side} className="space-y-2 pt-2 border-t border-border/50">
                  <div className="flex items-center justify-between">
                    <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                      {side === "old" ? "Antes" : "Depois"}
                    </p>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-6 px-2 text-[10px]"
                      onClick={() => resetTransform(side, activeType)}
                    >
                      <RotateCcw className="w-3 h-3 mr-1" /> Resetar
                    </Button>
                  </div>
                  <div className="space-y-1">
                    <div className="flex justify-between text-[10px] text-muted-foreground">
                      <span>Zoom</span><span>{t.zoom.toFixed(2)}x</span>
                    </div>
                    <Slider
                      min={0.5} max={3} step={0.05}
                      value={[t.zoom]}
                      onValueChange={([v]) => updateTransform(side, activeType, { zoom: v })}
                    />
                  </div>
                  <div className="space-y-1">
                    <div className="flex justify-between text-[10px] text-muted-foreground">
                      <span>Horizontal</span><span>{t.offsetX.toFixed(0)}%</span>
                    </div>
                    <Slider
                      min={-50} max={50} step={1}
                      value={[t.offsetX]}
                      onValueChange={([v]) => updateTransform(side, activeType, { offsetX: v })}
                    />
                  </div>
                  <div className="space-y-1">
                    <div className="flex justify-between text-[10px] text-muted-foreground">
                      <span>Vertical</span><span>{t.offsetY.toFixed(0)}%</span>
                    </div>
                    <Slider
                      min={-50} max={50} step={1}
                      value={[t.offsetY]}
                      onValueChange={([v]) => updateTransform(side, activeType, { offsetY: v })}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {previews.length > 0 && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <p className="text-xs font-semibold text-muted-foreground">Resultado</p>
              <Button variant="outline" size="sm" onClick={handleDownloadAll}>
                <Download className="w-3 h-3 mr-1" /> Baixar Todas
              </Button>
            </div>
            <div className="grid grid-cols-1 gap-3">
              {previews.map((src, i) => (
                <div key={i} className="relative group">
                  <img
                    src={src}
                    alt={`Evolução ${IMAGE_TYPES[i]}`}
                    className="w-full rounded-lg border border-border"
                  />
                  <Button
                    variant="secondary"
                    size="sm"
                    className="absolute bottom-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity"
                    onClick={() => handleDownload(src, i)}
                  >
                    <Download className="w-3 h-3" />
                  </Button>
                </div>
              ))}
            </div>
          </div>
        )}

        <canvas ref={canvasRef} className="hidden" />
      </CardContent>
    </Card>
  );
};

export default EvolutionGenerator;
