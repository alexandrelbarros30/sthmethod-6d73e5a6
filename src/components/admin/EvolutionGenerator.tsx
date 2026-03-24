import { useState, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { ImagePlus, Download, Loader2 } from "lucide-react";
import evolutionFrame from "@/assets/evolution-frame.png";

interface BodyImage {
  id: string;
  type: string;
  image_url: string;
  uploaded_at: string;
  is_current: boolean;
}

interface EvolutionGeneratorProps {
  allImages: BodyImage[];
  studentName: string;
}

const TYPE_LABELS: Record<string, string> = { front: "Frente", back: "Costas", profile: "Perfil" };
const IMAGE_TYPES = ["front", "back", "profile"] as const;

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

function drawImageCover(ctx: CanvasRenderingContext2D, img: HTMLImageElement, x: number, y: number, w: number, h: number) {
  const imgRatio = img.width / img.height;
  const boxRatio = w / h;
  let sx = 0, sy = 0, sw = img.width, sh = img.height;
  if (imgRatio > boxRatio) {
    sw = img.height * boxRatio;
    sx = (img.width - sw) / 2;
  } else {
    sh = img.width / boxRatio;
    sy = (img.height - sh) / 2;
  }
  ctx.drawImage(img, sx, sy, sw, sh, x, y, w, h);
}

const EvolutionGenerator = ({ allImages, studentName }: EvolutionGeneratorProps) => {
  const groups = groupByDate(allImages);
  const [oldDate, setOldDate] = useState("");
  const [newDate, setNewDate] = useState("");
  const [generating, setGenerating] = useState(false);
  const [previews, setPreviews] = useState<string[]>([]);
  const canvasRef = useRef<HTMLCanvasElement>(null);

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

    const oldGroup = groups.find((g) => g.date === oldDate);
    const newGroup = groups.find((g) => g.date === newDate);
    if (!oldGroup || !newGroup) return;

    setGenerating(true);
    setPreviews([]);

    try {
      // Load the frame image
      const frameImg = await loadImage(evolutionFrame);

      const results: string[] = [];

      for (const type of IMAGE_TYPES) {
        const oldImg = oldGroup.images.find((i) => i.type === type);
        const newImg = newGroup.images.find((i) => i.type === type);

        if (!oldImg || !newImg) continue;

        const [oldEl, newEl] = await Promise.all([
          loadImage(oldImg.image_url),
          loadImage(newImg.image_url),
        ]);

        const canvas = document.createElement("canvas");
        canvas.width = CANVAS_WIDTH;
        canvas.height = CANVAS_HEIGHT;
        const ctx = canvas.getContext("2d")!;

        // Draw the frame as background, scaled to fill canvas
        ctx.drawImage(frameImg, 0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

        // Photo areas match the gray lines in the template
        // Header with logo: ~19% from top
        // Footer with "antes/depois": ~5% from bottom
        const headerHeight = Math.round(CANVAS_HEIGHT * 0.19);
        const footerHeight = Math.round(CANVAS_HEIGHT * 0.05);
        const photoAreaY = headerHeight;
        const photoAreaH = CANVAS_HEIGHT - headerHeight - footerHeight;
        const halfWidth = CANVAS_WIDTH / 2;
        const gap = 2; // thin center divider

        // Draw photos using "contain" approach to keep body proportional
        // This ensures the full body is visible and proportional on both sides
        drawImageContain(ctx, oldEl, 0, photoAreaY, halfWidth - gap, photoAreaH);
        drawImageContain(ctx, newEl, halfWidth + gap, photoAreaY, halfWidth - gap, photoAreaH);

        // Re-draw header and footer over photos to preserve frame elements
        // Header (logo area)
        const headerSrcH = Math.round(frameImg.height * 0.19);
        ctx.drawImage(frameImg, 0, 0, frameImg.width, headerSrcH, 0, 0, CANVAS_WIDTH, headerHeight);
        // Footer ("antes" / "depois" labels)
        const footerSrcY = Math.round(frameImg.height * 0.95);
        ctx.drawImage(
          frameImg,
          0, footerSrcY, frameImg.width, frameImg.height - footerSrcY,
          0, CANVAS_HEIGHT - footerHeight, CANVAS_WIDTH, footerHeight
        );

        // Center divider line matching frame style
        ctx.strokeStyle = "rgba(180,180,180,0.5)";
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(halfWidth, photoAreaY);
        ctx.lineTo(halfWidth, CANVAS_HEIGHT - footerHeight);
        ctx.stroke();

        // Type label badge
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

        results.push(canvas.toDataURL("image/jpeg", 0.92));
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
