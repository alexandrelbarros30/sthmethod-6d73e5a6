import { useState, useRef, useEffect, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { ImagePlus, Download, Loader2, ZoomIn, RotateCcw, Move, Link2, Crop, EyeOff, X, Send, Database } from "lucide-react";
import evolutionFrame from "@/assets/evolution-frame.png";
import { getSecureFileUrl, extractStoragePath } from "@/lib/secure-file-url";
import { supabase } from "@/integrations/supabase/client";
import InteractiveCropper from "@/components/shared/InteractiveCropper";

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
  userId?: string;
  phone?: string | null;
}

const TYPE_LABELS: Record<string, string> = { front: "Frente", back: "Costas", profile: "Perfil" };
const IMAGE_TYPES = ["front", "back", "profile"] as const;
type ImageType = typeof IMAGE_TYPES[number];

// Aspect ratios disponíveis para redimensionar cada foto individualmente
const ASPECT_RATIOS: { label: string; value: string; ratio: number | null }[] = [
  { label: "Original", value: "original", ratio: null },
  { label: "1:1", value: "1:1", ratio: 1 / 1 },
  { label: "2:3", value: "2:3", ratio: 2 / 3 },
  { label: "3:4", value: "3:4", ratio: 3 / 4 },
  { label: "4:5", value: "4:5", ratio: 4 / 5 },
  { label: "3:5", value: "3:5", ratio: 3 / 5 },
  { label: "5:7", value: "5:7", ratio: 5 / 7 },
  { label: "9:16", value: "9:16", ratio: 9 / 16 },
  { label: "16:9", value: "16:9", ratio: 16 / 9 },
  { label: "3:2", value: "3:2", ratio: 3 / 2 },
  { label: "4:3", value: "4:3", ratio: 4 / 3 },
  { label: "5:4", value: "5:4", ratio: 5 / 4 },
  { label: "7:5", value: "7:5", ratio: 7 / 5 },
  { label: "5:3", value: "5:3", ratio: 5 / 3 },
];

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

function loadImageElement(url: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    // crossOrigin não deve ser definido para data: URLs ou blob: URLs —
    // alguns navegadores móveis disparam onerror nesse caso, fazendo o
    // recorte aplicado "voltar ao original" silenciosamente.
    if (!/^(data:|blob:)/i.test(url)) {
      img.crossOrigin = "anonymous";
    }
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error("Falha ao carregar imagem"));
    img.src = url;
  });
}

async function loadImage(url: string): Promise<HTMLImageElement> {
  try {
    return await loadImageElement(url);
  } catch (firstError) {
    // Alguns uploads antigos do iPhone foram gravados como HEIC, mas com
    // extensão .jpg. O navegador não renderiza HEIC em <img>/canvas; então,
    // quando a URL assinada falha, baixamos o blob e convertemos para JPEG.
    try {
      const res = await fetch(url, { cache: "no-store" });
      if (!res.ok) throw firstError;
      const blob = await res.blob();
      const isHeic = /hei[cf]/i.test(blob.type || "") || /\.hei[cf](\?|$)/i.test(url);
      let displayBlob = blob;
      if (isHeic) {
        const { default: heic2any } = await import("heic2any");
        const converted = await heic2any({ blob, toType: "image/jpeg", quality: 0.92 });
        displayBlob = Array.isArray(converted) ? converted[0] : converted;
      }
      const objectUrl = URL.createObjectURL(displayBlob);
      return await loadImageElement(objectUrl);
    } catch {
      throw firstError;
    }
  }
}

/**
 * Draws an image inside a box with a "cover" base + user transforms (zoom, offsetX, offsetY).
 * Zoom 1 = contain (full body visible). Higher zoom = ampliar (cortar bordas). offsets em % do box.
 */
function drawImageWithTransform(
  ctx: CanvasRenderingContext2D,
  img: HTMLImageElement,
  box: { x: number; y: number; w: number; h: number },
  transform: { zoom: number; offsetX: number; offsetY: number; aspectRatio?: number | null }
) {
  const { x, y, w, h } = box;
  const { zoom, offsetX, offsetY, aspectRatio } = transform;

  // Recorte manual da imagem fonte para a proporção escolhida (centralizado).
  let srcX = 0, srcY = 0, srcW = img.width, srcH = img.height;
  if (aspectRatio && aspectRatio > 0) {
    const r = img.width / img.height;
    if (r > aspectRatio) {
      srcW = Math.round(img.height * aspectRatio);
      srcX = Math.round((img.width - srcW) / 2);
    } else {
      srcH = Math.round(img.width / aspectRatio);
      srcY = Math.round((img.height - srcH) / 2);
    }
  }

  // Base size = contain (sobre o recorte)
  const imgRatio = srcW / srcH;
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
  ctx.drawImage(img, srcX, srcY, srcW, srcH, dx, dy, dw, dh);
  ctx.restore();
}

interface PhotoTransform {
  zoom: number;     // 0.5 - 3
  offsetX: number;  // -50 - 50 (% do box)
  offsetY: number;  // -50 - 50 (% do box)
  aspectRatio: number | null; // recorte manual da imagem fonte
}

const DEFAULT_TRANSFORM: PhotoTransform = { zoom: 1, offsetX: 0, offsetY: 0, aspectRatio: null };

// Região circular de blur, em coordenadas relativas (0..1) ao canvas (CANVAS_WIDTH x CANVAS_HEIGHT)
interface BlurRegion {
  id: string;
  cx: number; // 0..1
  cy: number; // 0..1
  r: number;  // 0..0.5 (raio relativo à largura do canvas)
  intensity: number; // 8..60 (px de blur no canvas)
}

type TransformKey = `${"old" | "new"}_${ImageType}`;
type TransformMap = Record<TransformKey, PhotoTransform>;

function makeKey(side: "old" | "new", type: ImageType): TransformKey {
  return `${side}_${type}` as TransformKey;
}

const EvolutionGenerator = ({ allImages, studentName, userId, phone }: EvolutionGeneratorProps) => {
  const groups = useMemo(() => groupByDate(allImages), [allImages]);
  const [oldDate, setOldDate] = useState("");
  const [newDate, setNewDate] = useState("");
  const [generating, setGenerating] = useState(false);
  const [previews, setPreviews] = useState<string[]>([]);
  const [previewLabels, setPreviewLabels] = useState<ImageType[]>([]);
  const [sending, setSending] = useState(false);
  const [archiving, setArchiving] = useState(false);
  const [transforms, setTransforms] = useState<TransformMap>({} as TransformMap);
  const [loadedImages, setLoadedImages] = useState<Partial<Record<TransformKey, HTMLImageElement>>>({});
  // Mantemos referência da imagem ORIGINAL (URL inicial) por posição, para que
  // recortes manuais sejam SEMPRE feitos a partir da fonte original e possam
  // ser desfeitos sem perda de qualidade.
  const [originalImages, setOriginalImages] = useState<Partial<Record<TransformKey, HTMLImageElement>>>({});
  const [cropperKey, setCropperKey] = useState<TransformKey | null>(null);
  // Toggle do cropper inline por posição (admin)
  const [inlineCropperKey, setInlineCropperKey] = useState<TransformKey | null>(null);
  const [frameImage, setFrameImage] = useState<HTMLImageElement | null>(null);
  const [activeType, setActiveType] = useState<ImageType>("front");
  const [editSide, setEditSide] = useState<"old" | "new">("old");
  const [livePreviews, setLivePreviews] = useState<Partial<Record<ImageType, string>>>({});
  // Manual override: para cada posição (front/back/profile), permite escolher
  // qual imagem específica (id) usar de cada lado. Default = procurar pelo type.
  const [overrides, setOverrides] = useState<Partial<Record<TransformKey, string>>>({});
  // Áreas de blur por tipo (frente/costas/perfil). Coords em fração do canvas (0..1).
  const [blurRegions, setBlurRegions] = useState<Record<ImageType, BlurRegion[]>>({
    front: [], back: [], profile: [],
  });
  const [blurMode, setBlurMode] = useState(false);
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
          const key = makeKey(side, type);
          const overrideId = overrides[key];
          // "__none__" = aluno explicitamente pediu para pular essa posição
          if (overrideId === "__none__") continue;
          const img = overrideId
            ? group.images.find((i) => i.id === overrideId)
            : group.images.find((i) => i.type === type);
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
            next[key] = el;
            initT[key] = { ...DEFAULT_TRANSFORM };
          } catch {}
        }
      }
      if (cancelled) return;
      setLoadedImages((prev) => {
        const merged = { ...next };
        for (const key of Object.keys(next) as TransformKey[]) {
          const current = prev[key];
          const original = next[key];
          if (current && original && current.src !== original.src) {
            merged[key] = current;
          }
        }
        return merged;
      });
      setOriginalImages(next);
      setTransforms((prev) => ({ ...initT, ...prev } as TransformMap));
    })();
    return () => { cancelled = true; };
  }, [oldDate, newDate, oldGroup, newGroup, overrides]);

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

    // Aplicar áreas de blur (ex: rostos) ANTES do header/footer/badge
    const regions = blurRegions[type] || [];
    if (regions.length > 0) {
      for (const reg of regions) {
        const cx = reg.cx * CANVAS_WIDTH;
        const cy = reg.cy * CANVAS_HEIGHT;
        const r = Math.max(8, reg.r * CANVAS_WIDTH);
        const blurPx = Math.max(4, reg.intensity);
        const sx = Math.max(0, cx - r);
        const sy = Math.max(0, cy - r);
        const sw = Math.min(CANVAS_WIDTH - sx, r * 2);
        const sh = Math.min(CANVAS_HEIGHT - sy, r * 2);
        if (sw <= 0 || sh <= 0) continue;
        // Copia região para canvas temporário, aplica filtro blur e redesenha em clip circular.
        const tmp = document.createElement("canvas");
        tmp.width = Math.ceil(sw);
        tmp.height = Math.ceil(sh);
        const tctx = tmp.getContext("2d")!;
        tctx.drawImage(canvas, sx, sy, sw, sh, 0, 0, sw, sh);
        ctx.save();
        ctx.beginPath();
        ctx.arc(cx, cy, r, 0, Math.PI * 2);
        ctx.clip();
        (ctx as any).filter = `blur(${blurPx}px)`;
        ctx.drawImage(tmp, sx, sy, sw, sh);
        (ctx as any).filter = "none";
        ctx.restore();
      }
    }

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
  }, [frameImage, loadedImages, transforms, blurRegions]);

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

  const matchProportions = (type: ImageType, mode: "average" | "old-to-new" | "new-to-old" = "average") => {
    // Iguala zoom + alinhamento vertical entre Antes e Depois para deixar o aluno do mesmo tamanho.
    const tOld = transforms[makeKey("old", type)] || DEFAULT_TRANSFORM;
    const tNew = transforms[makeKey("new", type)] || DEFAULT_TRANSFORM;
    let targetZoom: number;
    let targetOffsetY: number;
    if (mode === "old-to-new") {
      targetZoom = tNew.zoom;
      targetOffsetY = tNew.offsetY;
    } else if (mode === "new-to-old") {
      targetZoom = tOld.zoom;
      targetOffsetY = tOld.offsetY;
    } else {
      targetZoom = (tOld.zoom + tNew.zoom) / 2;
      targetOffsetY = (tOld.offsetY + tNew.offsetY) / 2;
    }
    updateTransform("old", type, { zoom: targetZoom, offsetY: targetOffsetY });
    updateTransform("new", type, { zoom: targetZoom, offsetY: targetOffsetY });
    toast.success("Tamanho e alinhamento igualados.");
  };

  const applyToAllPositions = (type: ImageType) => {
    // Replica os ajustes da posição atual (Antes e Depois) para as outras posições.
    const tOld = transforms[makeKey("old", type)] || DEFAULT_TRANSFORM;
    const tNew = transforms[makeKey("new", type)] || DEFAULT_TRANSFORM;
    setTransforms((prev) => {
      const next = { ...prev };
      for (const t of IMAGE_TYPES) {
        if (loadedImages[makeKey("old", t)]) next[makeKey("old", t)] = { ...tOld };
        if (loadedImages[makeKey("new", t)]) next[makeKey("new", t)] = { ...tNew };
      }
      return next;
    });
    toast.success("Ajustes aplicados a todas as posições.");
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
    setPreviewLabels([]);

    try {
      const results: string[] = [];
      const generated: ImageType[] = [];
      const skipped: ImageType[] = [];
      for (const type of IMAGE_TYPES) {
        const dataUrl = renderPreview(type);
        if (dataUrl) {
          results.push(dataUrl);
          generated.push(type);
        } else {
          skipped.push(type);
        }
      }

      if (results.length === 0) {
        toast.error("Nenhuma posição pôde ser gerada. Use 'Mapear fotos' para escolher manualmente quais imagens comparar.");
      } else {
        setPreviews(results);
        setPreviewLabels(generated);
        if (skipped.length > 0) {
          toast.success(
            `${results.length} gerada(s): ${generated.map((t) => TYPE_LABELS[t]).join(", ")}. Pulada(s): ${skipped.map((t) => TYPE_LABELS[t]).join(", ")} (sem foto correspondente).`,
            { duration: 6000 }
          );
        } else {
          toast.success(`${results.length} imagem(ns) de evolução gerada(s)!`);
        }
      }
    } catch (err: any) {
      console.error("Evolution generation error:", err);
      toast.error("Erro ao gerar evolução: " + (err.message || "Tente novamente."));
    }

    setGenerating(false);
  };

  const handleDownload = (dataUrl: string, index: number) => {
    const link = document.createElement("a");
    const labelType = previewLabels[index] || IMAGE_TYPES[index] || `img_${index}`;
    link.download = `evolucao_${studentName.replace(/\s+/g, "_")}_${labelType}.jpg`;
    link.href = dataUrl;
    link.click();
  };

  const handleDownloadAll = () => {
    previews.forEach((p, i) => handleDownload(p, i));
  };

  const dataUrlToBlob = (dataUrl: string): Blob => {
    const [meta, b64] = dataUrl.split(",");
    const mime = /data:([^;]+)/.exec(meta)?.[1] || "image/jpeg";
    const bin = atob(b64);
    const arr = new Uint8Array(bin.length);
    for (let i = 0; i < bin.length; i++) arr[i] = bin.charCodeAt(i);
    return new Blob([arr], { type: mime });
  };

  const handleSendWhatsApp = async () => {
    if (previews.length === 0) {
      toast.error("Gere a evolução primeiro.");
      return;
    }
    // Resolve telefone
    let targetPhone = (phone || "").replace(/\D/g, "");
    if (!targetPhone && userId) {
      const { data: prof } = await supabase
        .from("profiles")
        .select("phone")
        .eq("user_id", userId)
        .maybeSingle();
      targetPhone = String((prof as any)?.phone || "").replace(/\D/g, "");
    }
    if (!targetPhone) {
      toast.error("Aluno sem telefone cadastrado.");
      return;
    }

    setSending(true);
    try {
      const folder = userId || "anon";
      const ts = Date.now();
      let success = 0;
      let failed = 0;

      for (let i = 0; i < previews.length; i++) {
        const dataUrl = previews[i];
        const labelType = previewLabels[i] || IMAGE_TYPES[i] || `img_${i}`;
        const path = `evolution/${folder}/${ts}_${labelType}.jpg`;
        try {
          const blob = dataUrlToBlob(dataUrl);
          const { error: upErr } = await supabase.storage
            .from("crm-media")
            .upload(path, blob, { upsert: true, contentType: "image/jpeg" });
          if (upErr) throw upErr;
          const { data: pub } = supabase.storage.from("crm-media").getPublicUrl(path);
          const imageUrl = pub?.publicUrl;
          if (!imageUrl) throw new Error("URL pública indisponível");

          const caption =
            i === 0
              ? `Olá ${studentName.split(" ")[0] || ""}! 🌿\n\nSegue sua evolução visual gerada pela equipe STH METHOD. Continue firme! 👊`
              : `Evolução — ${TYPE_LABELS[labelType] || labelType}`;

          const { data, error } = await supabase.functions.invoke("send-wapi", {
            body: { phone: targetPhone, image_url: imageUrl, message: caption },
          });
          if (error || !(data as any)?.ok) throw new Error((data as any)?.error || error?.message || "falha no envio");
          success++;
        } catch (err: any) {
          console.warn("[EvolutionGenerator] send failed", err);
          failed++;
        }
      }

      if (success > 0 && failed === 0) {
        toast.success(`${success} imagem(ns) enviadas pelo Fale com o Nutri!`);
      } else if (success > 0) {
        toast.message(`Enviadas: ${success} • Falharam: ${failed}`);
      } else {
        toast.error("Não foi possível enviar as imagens.");
      }
    } finally {
      setSending(false);
    }
  };

  const handleArchive = async () => {
    if (previews.length === 0) {
      toast.error("Gere a evolução primeiro.");
      return;
    }
    if (!userId) {
      toast.error("Aluno sem ID — não é possível arquivar.");
      return;
    }
    setArchiving(true);
    try {
      const { data: auth } = await supabase.auth.getUser();
      const createdBy = auth?.user?.id || null;
      const ts = Date.now();
      let success = 0;
      let failed = 0;
      for (let i = 0; i < previews.length; i++) {
        const dataUrl = previews[i];
        const labelType = previewLabels[i] || IMAGE_TYPES[i] || `img_${i}`;
        const path = `${userId}/${ts}_${labelType}.jpg`;
        try {
          const blob = dataUrlToBlob(dataUrl);
          const { error: upErr } = await supabase.storage
            .from("evolution-arts")
            .upload(path, blob, { upsert: true, contentType: "image/jpeg" });
          if (upErr) throw upErr;
          const { error: insErr } = await supabase.from("evolution_arts").insert({
            user_id: userId,
            student_name: studentName,
            art_type: labelType,
            storage_path: path,
            before_date: oldDate || null,
            after_date: newDate || null,
            created_by: createdBy,
          });
          if (insErr) throw insErr;
          success++;
        } catch (err: any) {
          console.warn("[EvolutionGenerator] archive failed", err);
          failed++;
        }
      }
      if (success > 0 && failed === 0) {
        toast.success(`${success} arte(s) salva(s) no banco de evoluções.`);
      } else if (success > 0) {
        toast.message(`Arquivadas: ${success} • Falharam: ${failed}`);
      } else {
        toast.error("Não foi possível arquivar as artes.");
      }
      window.dispatchEvent(new CustomEvent("evolution-arts:changed", { detail: { userId } }));
    } finally {
      setArchiving(false);
    }
  };

  return (
    <Card className="overflow-hidden">
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-display flex items-center gap-2">
          <ImagePlus className="w-4 h-4" /> Gerar Evolução
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4 min-w-0 overflow-x-hidden">
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

        {/* Mapeamento manual: permite escolher qual foto da galeria usar para cada posição */}
        {oldGroup && newGroup && (
          <div className="space-y-2 rounded-lg border border-border p-3 bg-muted/30">
            <div className="flex items-center gap-1.5">
              <Link2 className="w-3 h-3 text-muted-foreground" />
              <Label className="text-xs font-semibold">Mapear Fotos (opcional)</Label>
            </div>
            <p className="text-[10px] text-muted-foreground -mt-1">
              Use quando o aluno enviou uma foto fora do padrão (ex: selfie). Escolha manualmente qual imagem usar em cada posição.
            </p>
            {IMAGE_TYPES.map((type) => {
              const oldKey = makeKey("old", type);
              const newKey = makeKey("new", type);
              const defaultOld = oldGroup.images.find((i) => i.type === type)?.id || "";
              const defaultNew = newGroup.images.find((i) => i.type === type)?.id || "";
              return (
                <div key={type} className="grid grid-cols-[60px_1fr_1fr] gap-1.5 items-center">
                  <span className="text-[11px] font-medium text-muted-foreground">{TYPE_LABELS[type]}</span>
                  <Select
                    value={overrides[oldKey] || defaultOld || "__none__"}
                    onValueChange={(v) => setOverrides((p) => ({ ...p, [oldKey]: v }))}
                  >
                    <SelectTrigger className="h-7 text-[10px]"><SelectValue placeholder="Antes" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="__none__" className="text-[10px]">— Nenhuma —</SelectItem>
                      {oldGroup.images.map((img) => (
                        <SelectItem key={img.id} value={img.id} className="text-[10px]">
                          {TYPE_LABELS[img.type] || img.type}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Select
                    value={overrides[newKey] || defaultNew || "__none__"}
                    onValueChange={(v) => setOverrides((p) => ({ ...p, [newKey]: v }))}
                  >
                    <SelectTrigger className="h-7 text-[10px]"><SelectValue placeholder="Depois" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="__none__" className="text-[10px]">— Nenhuma —</SelectItem>
                      {newGroup.images.map((img) => (
                        <SelectItem key={img.id} value={img.id} className="text-[10px]">
                          {TYPE_LABELS[img.type] || img.type}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              );
            })}
          </div>
        )}

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
              <div className="space-y-2">
                <img
                  src={livePreviews[activeType]}
                  alt="Preview ao vivo"
                  className={`w-full rounded border border-border ${blurMode ? "cursor-crosshair ring-2 ring-primary" : ""}`}
                  onClick={(e) => {
                    if (!blurMode) return;
                    const target = e.currentTarget as HTMLImageElement;
                    const rect = target.getBoundingClientRect();
                    const cx = (e.clientX - rect.left) / rect.width;
                    const cy = (e.clientY - rect.top) / rect.height;
                    const id = Math.random().toString(36).slice(2, 9);
                    setBlurRegions((prev) => ({
                      ...prev,
                      [activeType]: [
                        ...prev[activeType],
                        { id, cx, cy, r: 0.07, intensity: 24 },
                      ],
                    }));
                  }}
                />
                <div className="flex items-center justify-between gap-2">
                  <Button
                    type="button"
                    variant={blurMode ? "default" : "outline"}
                    size="sm"
                    className="text-[10px] h-8"
                    onClick={() => setBlurMode((v) => !v)}
                  >
                    <EyeOff className="w-3 h-3 mr-1" />
                    {blurMode ? "Modo borrar ativo — clique no preview" : "Borrar rosto / área"}
                  </Button>
                  {blurRegions[activeType].length > 0 && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="text-[10px] h-8"
                      onClick={() =>
                        setBlurRegions((prev) => ({ ...prev, [activeType]: [] }))
                      }
                    >
                      Limpar todos
                    </Button>
                  )}
                </div>
                {blurRegions[activeType].length > 0 && (
                  <div className="space-y-2 rounded border border-border/60 bg-background/50 p-2">
                    <p className="text-[10px] font-semibold text-muted-foreground">
                      Áreas borradas ({blurRegions[activeType].length})
                    </p>
                    {blurRegions[activeType].map((reg, idx) => (
                      <div key={reg.id} className="space-y-1 border-t border-border/40 pt-2 first:border-t-0 first:pt-0">
                        <div className="flex items-center justify-between">
                          <span className="text-[10px] text-muted-foreground">
                            Área {idx + 1} {reg.cx < 0.5 ? "(Antes)" : "(Depois)"}
                          </span>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            className="h-6 w-6 p-0"
                            onClick={() =>
                              setBlurRegions((prev) => ({
                                ...prev,
                                [activeType]: prev[activeType].filter((r) => r.id !== reg.id),
                              }))
                            }
                          >
                            <X className="w-3 h-3" />
                          </Button>
                        </div>
                        <div className="flex justify-between text-[10px] text-muted-foreground">
                          <span>Tamanho</span><span>{Math.round(reg.r * 100)}%</span>
                        </div>
                        <Slider
                          min={2} max={30} step={1}
                          value={[Math.round(reg.r * 100)]}
                          onValueChange={([v]) =>
                            setBlurRegions((prev) => ({
                              ...prev,
                              [activeType]: prev[activeType].map((r) =>
                                r.id === reg.id ? { ...r, r: v / 100 } : r
                              ),
                            }))
                          }
                        />
                        <div className="flex justify-between text-[10px] text-muted-foreground">
                          <span>Intensidade</span><span>{reg.intensity}px</span>
                        </div>
                        <Slider
                          min={8} max={60} step={2}
                          value={[reg.intensity]}
                          onValueChange={([v]) =>
                            setBlurRegions((prev) => ({
                              ...prev,
                              [activeType]: prev[activeType].map((r) =>
                                r.id === reg.id ? { ...r, intensity: v } : r
                              ),
                            }))
                          }
                        />
                        <div className="grid grid-cols-2 gap-1">
                          <div>
                            <div className="flex justify-between text-[10px] text-muted-foreground">
                              <span>Horizontal</span><span>{Math.round(reg.cx * 100)}%</span>
                            </div>
                            <Slider
                              min={0} max={100} step={1}
                              value={[Math.round(reg.cx * 100)]}
                              onValueChange={([v]) =>
                                setBlurRegions((prev) => ({
                                  ...prev,
                                  [activeType]: prev[activeType].map((r) =>
                                    r.id === reg.id ? { ...r, cx: v / 100 } : r
                                  ),
                                }))
                              }
                            />
                          </div>
                          <div>
                            <div className="flex justify-between text-[10px] text-muted-foreground">
                              <span>Vertical</span><span>{Math.round(reg.cy * 100)}%</span>
                            </div>
                            <Slider
                              min={0} max={100} step={1}
                              value={[Math.round(reg.cy * 100)]}
                              onValueChange={([v]) =>
                                setBlurRegions((prev) => ({
                                  ...prev,
                                  [activeType]: prev[activeType].map((r) =>
                                    r.id === reg.id ? { ...r, cy: v / 100 } : r
                                  ),
                                }))
                              }
                            />
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            <div className="space-y-1.5">
              <p className="text-[10px] text-muted-foreground">Igualar tamanho/altura do aluno entre Antes e Depois:</p>
              <div className="grid grid-cols-3 gap-1.5">
                <Button
                  variant="outline"
                  size="sm"
                  className="text-[10px] h-8 px-1 min-w-0 whitespace-normal leading-tight"
                  onClick={() => matchProportions(activeType, "average")}
                  title="Faz a média do zoom e altura entre as duas fotos"
                >
                  <ZoomIn className="w-3 h-3 mr-1" /> Média
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="text-[10px] h-8 px-1 min-w-0 whitespace-normal leading-tight"
                  onClick={() => matchProportions(activeType, "new-to-old")}
                  title="Aplica o ajuste do Antes também no Depois"
                >
                  Usar Antes
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="text-[10px] h-8 px-1 min-w-0 whitespace-normal leading-tight"
                  onClick={() => matchProportions(activeType, "old-to-new")}
                  title="Aplica o ajuste do Depois também no Antes"
                >
                  Usar Depois
                </Button>
              </div>
              <Button
                variant="ghost"
                size="sm"
                className="w-full text-[10px] h-7"
                onClick={() => applyToAllPositions(activeType)}
                title="Replica zoom e posição para Frente, Costas e Perfil"
              >
                <Link2 className="w-3 h-3 mr-1" /> Aplicar a todas as posições
              </Button>
            </div>

            {(["old", "new"] as const).map((side) => {
              const key = makeKey(side, activeType);
              const t = transforms[key] || DEFAULT_TRANSFORM;
              const exists = !!loadedImages[key];
              if (!exists) return null;
              if (side !== editSide) return null;
              return (
                <div key={side} className="space-y-2 pt-2 border-t border-border/50">
                  <div className="flex items-center justify-between gap-2 flex-wrap">
                    <div className="inline-flex rounded-md border border-border overflow-hidden shrink-0">
                      <button
                        type="button"
                        className={`px-3 py-1 text-[11px] font-semibold uppercase tracking-wide ${editSide === "old" ? "bg-primary text-primary-foreground" : "bg-background text-muted-foreground"}`}
                        onClick={() => setEditSide("old")}
                      >
                        Antes
                      </button>
                      <button
                        type="button"
                        className={`px-3 py-1 text-[11px] font-semibold uppercase tracking-wide ${editSide === "new" ? "bg-primary text-primary-foreground" : "bg-background text-muted-foreground"}`}
                        onClick={() => setEditSide("new")}
                      >
                        Depois
                      </button>
                    </div>
                    <div className="flex items-center gap-1 shrink-0">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-6 px-2 text-[10px]"
                        onClick={() => {
                          const k = makeKey(side, activeType);
                          const el = loadedImages[k];
                          if (!el) {
                            toast.error("Foto não carregada.");
                            return;
                          }
                          try {
                            const c = document.createElement("canvas");
                            c.width = el.naturalWidth || el.width;
                            c.height = el.naturalHeight || el.height;
                            const cx = c.getContext("2d")!;
                            cx.drawImage(el, 0, 0);
                            const dataUrl = c.toDataURL("image/jpeg", 0.95);
                            const a = document.createElement("a");
                            a.href = dataUrl;
                            a.download = `${studentName.replace(/\s+/g, "_")}_${activeType}_${side === "old" ? "antes" : "depois"}.jpg`;
                            document.body.appendChild(a);
                            a.click();
                            document.body.removeChild(a);
                            toast.success("Download iniciado.");
                          } catch {
                            toast.error("Falha ao baixar.");
                          }
                        }}
                        title="Baixar esta foto editada"
                      >
                        <Download className="w-3 h-3 mr-1" /> Baixar
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-6 px-2 text-[10px]"
                        onClick={() => resetTransform(side, activeType)}
                      >
                        <RotateCcw className="w-3 h-3 mr-1" /> Resetar
                      </Button>
                    </div>
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
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full h-7 text-[10px]"
                    onClick={() => {
                      const k = makeKey(side, activeType);
                      setInlineCropperKey((cur) => (cur === k ? null : k));
                    }}
                  >
                    <Crop className="w-3 h-3 mr-1" />
                    {inlineCropperKey === makeKey(side, activeType) ? "Fechar recorte" : "Recortar foto manualmente"}
                  </Button>
                  {originalImages[makeKey(side, activeType)] &&
                    loadedImages[makeKey(side, activeType)] !== originalImages[makeKey(side, activeType)] && (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="w-full h-7 text-[10px]"
                        onClick={() => {
                          const k = makeKey(side, activeType);
                          const orig = originalImages[k];
                          if (!orig) return;
                          setLoadedImages((p) => ({ ...p, [k]: orig }));
                          setTransforms((p) => ({ ...p, [k]: { ...DEFAULT_TRANSFORM } }));
                          toast.success("Foto original restaurada.");
                        }}
                      >
                        <RotateCcw className="w-3 h-3 mr-1" /> Restaurar foto original
                      </Button>
                    )}
                  {inlineCropperKey === makeKey(side, activeType) &&
                    originalImages[makeKey(side, activeType)]?.src && (
                      <div className="pt-2 border-t border-border/50">
                        <p className="text-[10px] text-muted-foreground mb-2">
                          Cada recorte parte sempre da foto <strong>original</strong> — sem perda de qualidade ao refazer.
                        </p>
                        <InteractiveCropper
                          inline
                          imageSrc={originalImages[makeKey(side, activeType)]!.src}
                          onApply={async ({ dataUrl }) => {
                            const k = makeKey(side, activeType);
                            try {
                              const newImg = await loadImage(dataUrl);
                              setLoadedImages((p) => ({ ...p, [k]: newImg }));
                              setTransforms((p) => ({ ...p, [k]: { ...DEFAULT_TRANSFORM } }));
                              setInlineCropperKey(null);
                              toast.success("Recorte aplicado!");
                            } catch {
                              toast.error("Falha ao aplicar recorte.");
                            }
                          }}
                        />
                      </div>
                    )}
                </div>
              );
            })}
          </div>
        )}

        {previews.length > 0 && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <p className="text-xs font-semibold text-muted-foreground">Resultado</p>
              <div className="flex items-center gap-1.5">
                <Button variant="outline" size="sm" onClick={handleDownloadAll}>
                  <Download className="w-3 h-3 mr-1" /> Baixar
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleArchive}
                  disabled={archiving || !userId}
                  title="Salvar as artes geradas no banco de evoluções deste aluno"
                >
                  {archiving ? (
                    <><Loader2 className="w-3 h-3 mr-1 animate-spin" /> Salvando...</>
                  ) : (
                    <><Database className="w-3 h-3 mr-1" /> Salvar no banco</>
                  )}
                </Button>
                <Button
                  size="sm"
                  onClick={handleSendWhatsApp}
                  disabled={sending}
                  className="bg-emerald-600 hover:bg-emerald-600/90 text-white"
                  title="Enviar pelo WhatsApp do Fale com o Nutri"
                >
                  {sending ? (
                    <><Loader2 className="w-3 h-3 mr-1 animate-spin" /> Enviando...</>
                  ) : (
                    <><Send className="w-3 h-3 mr-1" /> Enviar p/ Aluno</>
                  )}
                </Button>
              </div>
            </div>
            <div className="grid grid-cols-1 gap-3">
              {previews.map((src, i) => (
                <div key={i} className="relative group">
                  <img
                    src={src}
                    alt={`Evolução ${TYPE_LABELS[previewLabels[i]] || ""}`}
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

      {cropperKey && (originalImages[cropperKey]?.src || loadedImages[cropperKey]?.src) && (
        <InteractiveCropper
          open={!!cropperKey}
          imageSrc={(originalImages[cropperKey] || loadedImages[cropperKey])!.src}
          title="Recortar foto manualmente"
          onClose={() => setCropperKey(null)}
          onApply={async ({ dataUrl }) => {
            const key = cropperKey!;
            try {
              const newImg = await loadImage(dataUrl);
              setLoadedImages((p) => ({ ...p, [key]: newImg }));
              // Reset transform da posição para refletir o novo recorte
              setTransforms((p) => ({ ...p, [key]: { ...DEFAULT_TRANSFORM } }));
              setCropperKey(null);
              toast.success("Recorte aplicado!");
            } catch {
              toast.error("Falha ao aplicar recorte.");
            }
          }}
        />
      )}
    </Card>
  );
};

export default EvolutionGenerator;
