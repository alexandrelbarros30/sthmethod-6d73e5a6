import { useEffect, useMemo, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Lock, Sparkles, Upload, X, RotateCcw, Wand2, FlipHorizontal2, FlipVertical2, ArrowRight, Crop } from "lucide-react";
import InteractiveCropper from "@/components/shared/InteractiveCropper";
import evolutionFrame from "@/assets/evolution-frame.png";

const CANVAS_WIDTH = 1080;
const CANVAS_HEIGHT = 1350;

interface Slot {
  file?: File;
  preview?: string;
  imgEl?: HTMLImageElement;
  /** dataURL da imagem ORIGINAL enviada pelo usuário (preservado para permitir
   *  recortes não-destrutivos: cada novo recorte parte sempre desta fonte). */
  originalDataUrl?: string;
}

interface Transform {
  zoom: number;
  rotation: number;
  flipH: boolean;
  flipV: boolean;
  // Offset as percentage of box size (-1 to 1), applied AFTER cover-fit
  offsetX: number;
  offsetY: number;
  // Recorte manual da imagem fonte para uma proporção alvo (largura/altura).
  // null = usar imagem original sem recorte.
  aspectRatio: number | null;
}

const DEFAULT_T: Transform = { zoom: 1, rotation: 0, flipH: false, flipV: false, offsetX: 0, offsetY: 0, aspectRatio: null };

function loadImage(url: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error("Falha ao carregar"));
    img.src = url;
  });
}

function drawWithTransform(
  ctx: CanvasRenderingContext2D,
  img: HTMLImageElement,
  box: { x: number; y: number; w: number; h: number },
  t: Transform
) {
  const { x, y, w, h } = box;
  ctx.save();
  ctx.beginPath();
  ctx.rect(x, y, w, h);
  ctx.clip();

  // Recorte manual: define a janela source da imagem com base em aspectRatio.
  let srcX = 0, srcY = 0, srcW = img.width, srcH = img.height;
  if (t.aspectRatio && t.aspectRatio > 0) {
    const imgRatio = img.width / img.height;
    if (imgRatio > t.aspectRatio) {
      srcW = Math.round(img.height * t.aspectRatio);
      srcX = Math.round((img.width - srcW) / 2);
    } else {
      srcH = Math.round(img.width / t.aspectRatio);
      srcY = Math.round((img.height - srcH) / 2);
    }
  }

  // Cover-fit base size considering rotation (sobre o recorte)
  const rotated = t.rotation % 180 !== 0;
  const effW = rotated ? srcH : srcW;
  const effH = rotated ? srcW : srcH;
  const imgRatio = effW / effH;
  const boxRatio = w / h;
  let dw: number, dh: number;
  if (imgRatio > boxRatio) { dh = h; dw = h * imgRatio; } else { dw = w; dh = w / imgRatio; }
  // Apply zoom
  dw *= t.zoom;
  dh *= t.zoom;

  // Compute offset in pixels (clamped so image always covers the box)
  const maxOffX = Math.max(0, (dw - w) / 2);
  const maxOffY = Math.max(0, (dh - h) / 2);
  const offX = t.offsetX * maxOffX;
  const offY = t.offsetY * maxOffY;

  ctx.translate(x + w / 2 + offX, y + h / 2 + offY);
  ctx.rotate((t.rotation * Math.PI) / 180);
  if (t.flipH) ctx.scale(-1, 1);
  if (t.flipV) ctx.scale(1, -1);

  // After rotation, draw the image centered. Since dw/dh were derived from the
  // rotated bounding box, swap them back to the source orientation when rotated.
  const drawW = rotated ? dh : dw;
  const drawH = rotated ? dw : dh;
  ctx.drawImage(img, srcX, srcY, srcW, srcH, -drawW / 2, -drawH / 2, drawW, drawH);
  ctx.restore();
}

async function fileToDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => resolve(r.result as string);
    r.onerror = reject;
    r.readAsDataURL(file);
  });
}

function renderMarkdown(md: string): string {
  // very small md → html (headings, bold, italic, bullets)
  const escape = (s: string) => s.replace(/[&<>]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;" }[c]!));
  const lines = md.split("\n");
  let html = "";
  let inUl = false;
  for (let raw of lines) {
    const line = raw.trimEnd();
    if (/^##\s+/.test(line)) {
      if (inUl) { html += "</ul>"; inUl = false; }
      html += `<h3 class="font-display text-lg mt-5 mb-2">${escape(line.replace(/^##\s+/, ""))}</h3>`;
    } else if (/^[-*]\s+/.test(line)) {
      if (!inUl) { html += '<ul class="space-y-1.5 list-disc pl-5 marker:text-primary">'; inUl = true; }
      html += `<li>${formatInline(escape(line.replace(/^[-*]\s+/, "")))}</li>`;
    } else if (line.trim() === "") {
      if (inUl) { html += "</ul>"; inUl = false; }
    } else {
      if (inUl) { html += "</ul>"; inUl = false; }
      html += `<p class="leading-relaxed">${formatInline(escape(line))}</p>`;
    }
  }
  if (inUl) html += "</ul>";
  return html;
}
function formatInline(s: string) {
  return s
    .replace(/\*\*(.+?)\*\*/g, '<strong class="text-foreground">$1</strong>')
    .replace(/\*(.+?)\*/g, '<em class="text-primary">$1</em>');
}

// Live canvas preview for a single slot — shows the exact final framing (3:4)
function SlotPreview({ slot, t }: { slot: Slot; t: Transform }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !slot.imgEl) return;
    const W = 300;
    const H = 400;
    canvas.width = W;
    canvas.height = H;
    const ctx = canvas.getContext("2d")!;
    ctx.fillStyle = "#000";
    ctx.fillRect(0, 0, W, H);
    drawWithTransform(ctx, slot.imgEl, { x: 0, y: 0, w: W, h: H }, t);
  }, [slot.imgEl, t]);

  return (
    <div className="relative aspect-[3/4] rounded-2xl overflow-hidden bg-black border border-primary/40">
      <canvas ref={canvasRef} className="w-full h-full block" />
      {/* center grid for alignment reference */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute left-1/3 top-0 bottom-0 w-px bg-white/15" />
        <div className="absolute left-2/3 top-0 bottom-0 w-px bg-white/15" />
        <div className="absolute top-1/3 left-0 right-0 h-px bg-white/15" />
        <div className="absolute top-2/3 left-0 right-0 h-px bg-white/15" />
      </div>
    </div>
  );
}

const EvolucaoPublica = () => {
  const navigate = useNavigate();
  const [slots, setSlots] = useState<{ before: Slot; after: Slot }>({ before: {}, after: {} });
  const [transforms, setTransforms] = useState<{ before: Transform; after: Transform }>({
    before: { ...DEFAULT_T },
    after: { ...DEFAULT_T },
  });
  const [editSide, setEditSide] = useState<"before" | "after">("before");
  const [frameImage, setFrameImage] = useState<HTMLImageElement | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [analysis, setAnalysis] = useState<string | null>(null);
  const [cropperSide, setCropperSide] = useState<"before" | "after" | null>(null);
  // Quando true, o cropper aparece inline na seção de edição (na própria foto).
  const [showInlineCropper, setShowInlineCropper] = useState(false);
  const beforeInput = useRef<HTMLInputElement>(null);
  const afterInput = useRef<HTMLInputElement>(null);

  useEffect(() => {
    loadImage(evolutionFrame).then(setFrameImage).catch(() => {});
    document.title = "Gere sua Evolução • STH METHOD";
  }, []);

  const handleFile = async (side: "before" | "after", e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    if (file.size > 10 * 1024 * 1024) { toast.error("Imagem muito grande. Máx 10MB."); return; }
    if (!file.type.startsWith("image/")) { toast.error("Envie uma imagem (JPG/PNG)."); return; }
    const preview = URL.createObjectURL(file);
    try {
      const dataUrl = await fileToDataUrl(file);
      const imgEl = await loadImage(dataUrl);
      setSlots((p) => ({ ...p, [side]: { file, preview, imgEl, originalDataUrl: dataUrl } }));
      setPreviewUrl(null);
      setAnalysis(null);
    } catch {
      toast.error("Não foi possível ler a imagem.");
    }
  };

  const removeSlot = (side: "before" | "after") => {
    if (slots[side].preview) URL.revokeObjectURL(slots[side].preview!);
    setSlots((p) => ({ ...p, [side]: {} }));
    setTransforms((p) => ({ ...p, [side]: { ...DEFAULT_T } }));
    setPreviewUrl(null);
    setAnalysis(null);
  };

  const updateT = (side: "before" | "after", patch: Partial<Transform>) => {
    setTransforms((p) => ({ ...p, [side]: { ...p[side], ...patch } }));
  };

  const matchSize = () => {
    const z = (transforms.before.zoom + transforms.after.zoom) / 2;
    setTransforms({
      before: { ...transforms.before, zoom: z },
      after: { ...transforms.after, zoom: z },
    });
    toast.success("Tamanho igualado.");
  };

  const renderEvolution = (): string | null => {
    if (!frameImage || !slots.before.imgEl || !slots.after.imgEl) return null;
    const canvas = document.createElement("canvas");
    canvas.width = CANVAS_WIDTH;
    canvas.height = CANVAS_HEIGHT;
    const ctx = canvas.getContext("2d")!;
    ctx.drawImage(frameImage, 0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

    const headerH = Math.round(CANVAS_HEIGHT * 0.19);
    const footerH = Math.round(CANVAS_HEIGHT * 0.05);
    const photoY = headerH;
    const photoH = CANVAS_HEIGHT - headerH - footerH;
    const half = CANVAS_WIDTH / 2;
    const gap = 2;

    drawWithTransform(ctx, slots.before.imgEl, { x: 0, y: photoY, w: half - gap, h: photoH }, transforms.before);
    drawWithTransform(ctx, slots.after.imgEl, { x: half + gap, y: photoY, w: half - gap, h: photoH }, transforms.after);

    // Re-draw frame header/footer over photos
    const headerSrcH = Math.round(frameImage.height * 0.19);
    ctx.drawImage(frameImage, 0, 0, frameImage.width, headerSrcH, 0, 0, CANVAS_WIDTH, headerH);
    const footerSrcY = Math.round(frameImage.height * 0.95);
    ctx.drawImage(
      frameImage,
      0, footerSrcY, frameImage.width, frameImage.height - footerSrcY,
      0, CANVAS_HEIGHT - footerH, CANVAS_WIDTH, footerH
    );

    // Center divider
    ctx.strokeStyle = "rgba(180,180,180,0.5)";
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(half, photoY);
    ctx.lineTo(half, CANVAS_HEIGHT - footerH);
    ctx.stroke();

    // ANTES / DEPOIS labels
    const drawLabel = (text: string, cx: number) => {
      const w = 200, h = 40;
      const x = cx - w / 2;
      const y = photoY + 24;
      ctx.fillStyle = "rgba(0,0,0,0.55)";
      ctx.beginPath();
      ctx.roundRect(x, y, w, h, 6);
      ctx.fill();
      ctx.fillStyle = "#fff";
      ctx.font = "bold 20px Arial, sans-serif";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(text, cx, y + h / 2);
    };
    drawLabel("ANTES", half / 2);
    drawLabel("DEPOIS", half + half / 2);

    // Watermark — protege o asset até o cadastro
    ctx.save();
    ctx.globalAlpha = 0.18;
    ctx.fillStyle = "#ffffff";
    ctx.font = "bold 64px Arial, sans-serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.translate(CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2);
    ctx.rotate(-Math.PI / 6);
    for (let y = -CANVAS_HEIGHT; y < CANVAS_HEIGHT; y += 200) {
      for (let x = -CANVAS_WIDTH; x < CANVAS_WIDTH; x += 500) {
        ctx.fillText("STHMETHOD.COM.BR", x, y);
      }
    }
    ctx.restore();

    return canvas.toDataURL("image/jpeg", 0.9);
  };

  // Live re-render when transforms change
  useEffect(() => {
    if (slots.before.imgEl && slots.after.imgEl && frameImage) {
      const url = renderEvolution();
      if (url) setPreviewUrl(url);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [transforms, slots.before.imgEl, slots.after.imgEl, frameImage]);

  const canGenerate = !!slots.before.file && !!slots.after.file;

  const handleAnalyze = async () => {
    if (!canGenerate) {
      toast.error("Envie as duas fotos primeiro.");
      return;
    }
    // Mensagem fixa em vez de análise por IA
    const mensagemFixa = `Agora imagina isso sendo feito com estratégia aplicada no seu dia a dia…

Não só uma evolução pontual, mas um processo contínuo, ajustado para o seu corpo, sua rotina e seu objetivo.

É exatamente isso que a STH Method faz.`;
    setAnalysis(mensagemFixa);
    toast.success("Análise gerada!");
    setTimeout(() => {
      document.getElementById("analise-result")?.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 100);
  };

  const renderSlot = (side: "before" | "after", label: string) => {
    const slot = slots[side];
    const t = transforms[side];
    const ref = side === "before" ? beforeInput : afterInput;
    return (
      <div className="space-y-2">
        <Label className="text-xs uppercase tracking-wider text-muted-foreground">{label}</Label>
        {!slot.preview ? (
          <div
            className="relative aspect-[3/4] rounded-2xl border-2 border-dashed flex items-center justify-center overflow-hidden cursor-pointer transition-all border-border hover:border-primary/60 bg-muted/30"
            onClick={() => ref.current?.click()}
          >
            <div className="flex flex-col items-center gap-2 text-muted-foreground p-4 text-center">
              <Upload className="w-7 h-7" />
              <span className="text-xs">Toque para enviar</span>
            </div>
            <input ref={ref} type="file" accept="image/*" className="hidden" onChange={(e) => handleFile(side, e)} />
          </div>
        ) : (
          <>
            <SlotPreview slot={slot} t={t} />
            <div className="flex justify-end -mt-1">
              <button
                className="p-1.5 bg-destructive/80 rounded-full text-white hover:bg-destructive"
                onClick={() => removeSlot(side)}
                title="Remover"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
            <input ref={ref} type="file" accept="image/*" className="hidden" onChange={(e) => handleFile(side, e)} />
          </>
        )}
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-background via-background to-muted/40">
      {/* Hero */}
      <header className="border-b border-border/40 backdrop-blur sticky top-0 z-10 bg-background/80">
        <div className="max-w-5xl mx-auto px-4 py-3 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-md bg-primary flex items-center justify-center">
              <span className="text-primary-foreground font-bold text-xs">ST</span>
            </div>
            <span className="font-display text-sm tracking-wide">STH METHOD</span>
          </Link>
          <Button size="sm" variant="ghost" asChild>
            <Link to="/login">Entrar</Link>
          </Button>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 py-8 md:py-12 space-y-8">
        <section className="text-center space-y-3 max-w-2xl mx-auto">
          <Badge variant="secondary" className="gap-1.5"><Sparkles className="w-3 h-3" /> Visualize sua evolução</Badge>
          <h1 className="font-display text-3xl md:text-5xl tracking-tight">
            Veja sua <span className="text-primary">evolução real</span>.
          </h1>
          <p className="text-muted-foreground text-sm md:text-base">
            Envie uma foto antiga e uma atual. Visualize sua transformação e descubra como a STH Method pode acelerar seus resultados.
          </p>
        </section>

        {/* Uploads */}
        <Card className="border-border/60">
          <CardContent className="p-5 md:p-6 space-y-5">
            <div className="grid grid-cols-2 gap-4 md:gap-6">
              {renderSlot("before", "Foto Antes")}
              {renderSlot("after", "Foto Depois")}
            </div>
          </CardContent>
        </Card>

        {/* Visual preview (locked) - aparece automaticamente quando fotos enviadas */}
        {previewUrl && (
          <section className="space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="font-display text-xl">Sua evolução visual</h2>
              <Badge variant="outline" className="gap-1.5"><Lock className="w-3 h-3" /> Bloqueado</Badge>
            </div>
            <div className="relative max-w-md mx-auto">
              {showInlineCropper && slots[editSide].originalDataUrl ? (
                <div className="rounded-2xl border border-primary/40 bg-black/90 p-3 shadow-2xl">
                  <div className="flex items-center justify-between mb-2">
                    <Badge variant="secondary" className="text-[10px]">
                      Editando: {editSide === "before" ? "ANTES" : "DEPOIS"}
                    </Badge>
                    <button
                      className="text-xs text-white/80 hover:text-white inline-flex items-center gap-1"
                      onClick={() => setShowInlineCropper(false)}
                    >
                      <X className="w-3 h-3" /> Fechar
                    </button>
                  </div>
                  <InteractiveCropper
                    inline
                    imageSrc={slots[editSide].originalDataUrl!}
                    onApply={async ({ dataUrl }) => {
                      const side = editSide;
                      try {
                        const newImg = await loadImage(dataUrl);
                        const oldPreview = slots[side].preview;
                        setSlots((p) => ({
                          ...p,
                          [side]: { ...p[side], preview: dataUrl, imgEl: newImg },
                        }));
                        if (oldPreview && oldPreview.startsWith("blob:")) URL.revokeObjectURL(oldPreview);
                        setTransforms((p) => ({ ...p, [side]: { ...DEFAULT_T } }));
                        toast.success("Recorte aplicado!");
                      } catch {
                        toast.error("Falha ao aplicar recorte.");
                      }
                    }}
                  />
                </div>
              ) : (
                <>
                  <img src={previewUrl} alt="Pré-visualização da evolução" className="w-full rounded-2xl shadow-2xl border border-border/40" />
                  <div className="absolute inset-0 rounded-2xl pointer-events-none ring-1 ring-primary/20" />
                </>
              )}
            </div>
            <p className="text-center text-xs text-muted-foreground">
              {showInlineCropper
                ? "Arraste o quadro e os cantos para recortar diretamente sobre a foto."
                : "Pré-visualização com marca d'água. Libere a versão limpa após o cadastro."}
            </p>

            {/* Edit controls under generated photo */}
            <Card className="max-w-md mx-auto border-border/60">
              <CardContent className="p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <Label className="text-xs uppercase tracking-wider text-muted-foreground">Editar foto</Label>
                  <div className="inline-flex rounded-md border border-border overflow-hidden">
                    <button
                      className={`px-3 py-1 text-xs ${editSide === "before" ? "bg-primary text-primary-foreground" : "bg-background"}`}
                      onClick={() => setEditSide("before")}
                    >
                      Antes
                    </button>
                    <button
                      className={`px-3 py-1 text-xs ${editSide === "after" ? "bg-primary text-primary-foreground" : "bg-background"}`}
                      onClick={() => setEditSide("after")}
                    >
                      Depois
                    </button>
                  </div>
                </div>
                {(() => {
                  const t = transforms[editSide];
                  return (
                    <div className="space-y-3">
                      <div>
                        <div className="flex justify-between text-[11px] text-muted-foreground"><span>Zoom</span><span>{t.zoom.toFixed(2)}x</span></div>
                        <Slider value={[t.zoom]} min={1} max={3} step={0.01} onValueChange={([v]) => updateT(editSide, { zoom: v })} />
                      </div>
                      <div>
                        <div className="flex justify-between text-[11px] text-muted-foreground"><span>Horizontal</span><span>{t.offsetX.toFixed(2)}</span></div>
                        <Slider value={[t.offsetX]} min={-1} max={1} step={0.01} onValueChange={([v]) => updateT(editSide, { offsetX: v })} />
                      </div>
                      <div>
                        <div className="flex justify-between text-[11px] text-muted-foreground"><span>Vertical</span><span>{t.offsetY.toFixed(2)}</span></div>
                        <Slider value={[t.offsetY]} min={-1} max={1} step={0.01} onValueChange={([v]) => updateT(editSide, { offsetY: v })} />
                      </div>
                      <div className="grid grid-cols-3 gap-2 pt-1">
                        <Button variant="outline" size="sm" onClick={() => updateT(editSide, { flipH: !t.flipH })}>
                          <FlipHorizontal2 className="w-3.5 h-3.5" /> Espelhar
                        </Button>
                        <Button variant="outline" size="sm" onClick={() => updateT(editSide, { flipV: !t.flipV })}>
                          <FlipVertical2 className="w-3.5 h-3.5" /> Inverter
                        </Button>
                        <Button variant="ghost" size="sm" onClick={() => setTransforms((p) => ({ ...p, [editSide]: { ...DEFAULT_T } }))}>
                          <RotateCcw className="w-3.5 h-3.5" /> Resetar
                        </Button>
                      </div>
                      <Button variant="outline" size="sm" className="w-full" onClick={matchSize}>
                        <Wand2 className="w-3.5 h-3.5" /> Igualar tamanho dos dois
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        className="w-full"
                        onClick={() => setShowInlineCropper((v) => !v)}
                      >
                        <Crop className="w-3.5 h-3.5 mr-1" />
                        {showInlineCropper ? "Fechar recorte" : `Recortar foto ${editSide === "before" ? "Antes" : "Depois"}`}
                      </Button>
                      {slots[editSide].originalDataUrl && slots[editSide].preview !== slots[editSide].originalDataUrl && (
                        <Button
                          variant="ghost"
                          size="sm"
                          className="w-full"
                          onClick={async () => {
                            const side = editSide;
                            const orig = slots[side].originalDataUrl!;
                            try {
                              const newImg = await loadImage(orig);
                              const oldPreview = slots[side].preview;
                              setSlots((p) => ({ ...p, [side]: { ...p[side], preview: orig, imgEl: newImg } }));
                              if (oldPreview && oldPreview.startsWith("blob:")) URL.revokeObjectURL(oldPreview);
                              setTransforms((p) => ({ ...p, [side]: { ...DEFAULT_T } }));
                              toast.success("Foto original restaurada.");
                            } catch {
                              toast.error("Não foi possível restaurar.");
                            }
                          }}
                        >
                          <RotateCcw className="w-3.5 h-3.5 mr-1" /> Restaurar foto original
                        </Button>
                      )}
                      {showInlineCropper && (
                        <p className="text-[11px] text-muted-foreground text-center pt-1">
                          ↑ O recorte está aberto na foto acima. Cada novo recorte parte sempre da imagem original — sem perda de qualidade.
                        </p>
                      )}
                    </div>
                  );
                })()}
              </CardContent>
            </Card>

            {/* Botão Ver minha evolução - agora abaixo da foto gerada e controles */}
            <div className="max-w-md mx-auto">
              <Button
                size="lg"
                className="w-full text-base"
                onClick={handleAnalyze}
              >
                <Sparkles className="w-5 h-5" /> Ver minha evolução
              </Button>
            </div>
          </section>
        )}

        {/* AI Analysis */}
        {analysis && (
          <section id="analise-result" className="space-y-4">
            <Card className="border-primary/20 bg-gradient-to-br from-card to-primary/5">
              <CardContent className="p-5 md:p-7 space-y-2">
                <div className="flex items-center gap-2 mb-1">
                  <Sparkles className="w-4 h-4 text-primary" />
                  <h2 className="font-display text-lg">Sua leitura</h2>
                </div>
                <div
                  className="prose prose-sm max-w-none text-foreground/90"
                  dangerouslySetInnerHTML={{ __html: renderMarkdown(analysis) }}
                />
              </CardContent>
            </Card>

            {/* Strategic block + CTA */}
            <Card className="border-primary/40 bg-primary/5">
              <CardContent className="p-6 md:p-8 text-center space-y-4">
                <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-primary/10 mx-auto">
                  <Lock className="w-5 h-5 text-primary" />
                </div>
                <div className="space-y-2 max-w-md mx-auto">
                  <h3 className="font-display text-xl md:text-2xl">
                    Para liberar sua evolução completa
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    Receba sua estratégia personalizada e baixe sua imagem sem marca d'água. É necessário ativar seu acesso.
                  </p>
                </div>
                <div className="flex flex-col sm:flex-row gap-2 max-w-md mx-auto pt-1">
                  <Button size="lg" className="flex-1" onClick={() => navigate("/cadastro")}>
                    Acessar agora <ArrowRight className="w-4 h-4" />
                  </Button>
                  <Button size="lg" variant="outline" className="flex-1" asChild>
                    <Link to="/como-funciona">Como funciona</Link>
                  </Button>
                </div>
                <p className="text-[11px] text-muted-foreground/80 pt-2">
                  sthmethod.com.br/cadastro
                </p>
              </CardContent>
            </Card>
          </section>
        )}

        {!analysis && !previewUrl && (
          <section className="grid md:grid-cols-3 gap-3 max-w-3xl mx-auto pt-4">
            {[
              { n: "1", t: "Envie 2 fotos", d: "Uma antiga, uma atual." },
              { n: "2", t: "Veja a comparação", d: "Visualize sua transformação lado a lado." },
              { n: "3", t: "Ative seu plano", d: "Estratégia personalizada e download liberado." },
            ].map((s) => (
              <Card key={s.n} className="border-border/40">
                <CardContent className="p-4 space-y-1">
                  <div className="w-7 h-7 rounded-full bg-primary/10 text-primary font-bold text-sm flex items-center justify-center">{s.n}</div>
                  <p className="font-medium text-sm pt-1">{s.t}</p>
                  <p className="text-xs text-muted-foreground">{s.d}</p>
                </CardContent>
              </Card>
            ))}
          </section>
        )}

        <footer className="text-center text-[11px] text-muted-foreground/70 pt-6 pb-4">
          STH METHOD • As fotos são processadas apenas para gerar sua análise e não ficam salvas.
        </footer>
      </main>

      {cropperSide && slots[cropperSide].preview && (
        <InteractiveCropper
          open={!!cropperSide}
          imageSrc={slots[cropperSide].preview!}
          title={`Recortar foto (${cropperSide === "before" ? "Antes" : "Depois"})`}
          onClose={() => setCropperSide(null)}
          onApply={async ({ dataUrl }) => {
            const side = cropperSide!;
            try {
              const newImg = await loadImage(dataUrl);
              // libera o objectURL antigo e usa o dataURL do crop como novo preview
              const oldPreview = slots[side].preview;
              setSlots((p) => ({
                ...p,
                [side]: { ...p[side], preview: dataUrl, imgEl: newImg },
              }));
              if (oldPreview && oldPreview.startsWith("blob:")) URL.revokeObjectURL(oldPreview);
              setTransforms((p) => ({ ...p, [side]: { ...DEFAULT_T } }));
              setCropperSide(null);
              toast.success("Recorte aplicado!");
            } catch {
              toast.error("Falha ao aplicar recorte.");
            }
          }}
        />
      )}
    </div>
  );
};

export default EvolucaoPublica;