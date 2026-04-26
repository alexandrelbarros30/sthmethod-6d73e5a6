import { useEffect, useRef, useState, useCallback } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Crop, RotateCcw, Check, X } from "lucide-react";

export interface AspectGuide {
  label: string;
  value: string;
  ratio: number | null; // null = livre
}

export const DEFAULT_ASPECT_GUIDES: AspectGuide[] = [
  { label: "Livre", value: "free", ratio: null },
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

interface Rect { x: number; y: number; w: number; h: number; } // em coordenadas da imagem (px reais)

interface Props {
  open: boolean;
  imageSrc: string; // dataURL ou URL
  initialRect?: Rect | null;
  onClose: () => void;
  onApply: (cropped: { dataUrl: string; rect: Rect }) => void;
  title?: string;
}

type ResizeHandle = "nw" | "ne" | "sw" | "se" | "n" | "s" | "e" | "w";

type DragMode =
  | { kind: "none" }
  | { kind: "move"; startX: number; startY: number; startRect: Rect }
  | { kind: "resize"; startX: number; startY: number; startRect: Rect; handle: ResizeHandle };

const InteractiveCropper = ({ open, imageSrc, initialRect, onClose, onApply, title = "Recortar foto" }: Props) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const imgRef = useRef<HTMLImageElement>(null);
  const [imgSize, setImgSize] = useState<{ w: number; h: number } | null>(null);
  const [displaySize, setDisplaySize] = useState<{ w: number; h: number }>({ w: 0, h: 0 });
  const [rect, setRect] = useState<Rect | null>(initialRect ?? null);
  const [aspectValue, setAspectValue] = useState<string>("free");
  const [drag, setDrag] = useState<DragMode>({ kind: "none" });

  const aspectRatio = DEFAULT_ASPECT_GUIDES.find((g) => g.value === aspectValue)?.ratio ?? null;

  // Carregar dimensões da imagem
  useEffect(() => {
    if (!open || !imageSrc) return;
    const i = new Image();
    i.crossOrigin = "anonymous";
    i.onload = () => {
      setImgSize({ w: i.naturalWidth, h: i.naturalHeight });
      // Reset rect: centralizado, 80%
      const w = i.naturalWidth * 0.8;
      const h = i.naturalHeight * 0.8;
      setRect(initialRect ?? {
        x: (i.naturalWidth - w) / 2,
        y: (i.naturalHeight - h) / 2,
        w,
        h,
      });
    };
    i.src = imageSrc;
  }, [open, imageSrc, initialRect]);

  // Calcular tamanho de display (fit no container)
  useEffect(() => {
    if (!imgSize || !containerRef.current) return;
    const update = () => {
      const cw = containerRef.current!.clientWidth;
      const ch = Math.min(window.innerHeight * 0.6, 600);
      const ratio = imgSize.w / imgSize.h;
      let w = cw, h = cw / ratio;
      if (h > ch) { h = ch; w = ch * ratio; }
      setDisplaySize({ w, h });
    };
    update();
    window.addEventListener("resize", update);
    return () => window.removeEventListener("resize", update);
  }, [imgSize, open]);

  const scale = imgSize && displaySize.w > 0 ? displaySize.w / imgSize.w : 1;

  // Aplica restrições de proporção e limites
  const constrainRect = useCallback((r: Rect): Rect => {
    if (!imgSize) return r;
    let { x, y, w, h } = r;
    const minSize = 20;
    w = Math.max(minSize, w);
    h = Math.max(minSize, h);
    if (aspectRatio) {
      // ajusta h pelo w mantendo proporção
      h = w / aspectRatio;
    }
    if (w > imgSize.w) w = imgSize.w;
    if (h > imgSize.h) h = imgSize.h;
    if (aspectRatio) {
      if (h > imgSize.h) { h = imgSize.h; w = h * aspectRatio; }
      if (w > imgSize.w) { w = imgSize.w; h = w / aspectRatio; }
    }
    if (x < 0) x = 0;
    if (y < 0) y = 0;
    if (x + w > imgSize.w) x = imgSize.w - w;
    if (y + h > imgSize.h) y = imgSize.h - h;
    return { x, y, w, h };
  }, [aspectRatio, imgSize]);

  // Quando muda aspect, re-constrange
  useEffect(() => {
    if (rect) setRect((r) => (r ? constrainRect(r) : r));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [aspectValue]);

  // Helpers de evento (mouse/touch normalizados)
  const getPoint = (e: React.PointerEvent) => ({ x: e.clientX, y: e.clientY });

  const onPointerDownArea = (e: React.PointerEvent, handle?: ResizeHandle) => {
    if (!rect) return;
    e.preventDefault();
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
    const p = getPoint(e);
    if (handle) {
      setDrag({ kind: "resize", startX: p.x, startY: p.y, startRect: { ...rect }, handle });
    } else {
      setDrag({ kind: "move", startX: p.x, startY: p.y, startRect: { ...rect } });
    }
  };

  const onPointerMove = (e: React.PointerEvent) => {
    if (drag.kind === "none" || !rect || !imgSize) return;
    const p = getPoint(e);
    const dx = (p.x - drag.startX) / scale;
    const dy = (p.y - drag.startY) / scale;
    if (drag.kind === "move") {
      setRect(constrainRect({
        x: drag.startRect.x + dx,
        y: drag.startRect.y + dy,
        w: drag.startRect.w,
        h: drag.startRect.h,
      }));
    } else if (drag.kind === "resize") {
      let { x, y, w, h } = drag.startRect;
      const handle = drag.handle;
      if (handle.includes("e")) w = drag.startRect.w + dx;
      if (handle.includes("s")) h = drag.startRect.h + dy;
      if (handle.includes("w")) { w = drag.startRect.w - dx; x = drag.startRect.x + dx; }
      if (handle.includes("n")) { h = drag.startRect.h - dy; y = drag.startRect.y + dy; }
      // Se aspect fixo, força proporção mantendo o lado oposto ancorado
      if (aspectRatio) {
        const isVertical = handle === "n" || handle === "s";
        if (isVertical) {
          // arrastando borda horizontal: ajusta w pelo h
          const newW = h * aspectRatio;
          x = drag.startRect.x + (drag.startRect.w - newW) / 2;
          w = newW;
        } else {
          // arrastando borda vertical ou canto: ajusta h pelo w
          const newH = w / aspectRatio;
          if (handle.includes("n")) y = drag.startRect.y + (drag.startRect.h - newH);
          else if (!handle.includes("s")) {
            // handles e/w puros: centraliza verticalmente
            y = drag.startRect.y + (drag.startRect.h - newH) / 2;
          }
          h = newH;
        }
      }
      setRect(constrainRect({ x, y, w, h }));
    }
  };

  const onPointerUp = () => setDrag({ kind: "none" });

  const handleReset = () => {
    if (!imgSize) return;
    const w = imgSize.w * 0.8;
    const h = imgSize.h * 0.8;
    setRect(constrainRect({ x: (imgSize.w - w) / 2, y: (imgSize.h - h) / 2, w, h }));
  };

  const handleApply = () => {
    if (!rect || !imgSize) return;
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => {
      const c = document.createElement("canvas");
      c.width = Math.round(rect.w);
      c.height = Math.round(rect.h);
      const ctx = c.getContext("2d")!;
      ctx.drawImage(img, rect.x, rect.y, rect.w, rect.h, 0, 0, rect.w, rect.h);
      onApply({ dataUrl: c.toDataURL("image/jpeg", 0.92), rect });
    };
    img.src = imageSrc;
  };

  // Handles visuais (estilo Samsung Gallery: brackets nos cantos + barras nas bordas)
  const cornerBracket = "absolute w-6 h-6 touch-none pointer-events-auto";
  const edgeBar = "absolute bg-white/95 rounded-full touch-none pointer-events-auto shadow";

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Crop className="w-4 h-4" /> {title}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <Label className="text-xs text-muted-foreground whitespace-nowrap">Guia de proporção:</Label>
            <Select value={aspectValue} onValueChange={setAspectValue}>
              <SelectTrigger className="h-8 text-xs w-40"><SelectValue /></SelectTrigger>
              <SelectContent>
                {DEFAULT_ASPECT_GUIDES.map((g) => (
                  <SelectItem key={g.value} value={g.value} className="text-xs">{g.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button variant="ghost" size="sm" onClick={handleReset} className="h-8 text-xs">
              <RotateCcw className="w-3 h-3 mr-1" /> Resetar
            </Button>
          </div>

          <div ref={containerRef} className="relative w-full bg-black/80 rounded-lg overflow-hidden flex items-center justify-center" style={{ minHeight: 200 }}>
            {imgSize && rect && displaySize.w > 0 && (
              <div
                className="relative select-none touch-none"
                style={{ width: displaySize.w, height: displaySize.h }}
              >
                <img
                  ref={imgRef}
                  src={imageSrc}
                  alt="Recortar"
                  className="absolute inset-0 w-full h-full object-contain pointer-events-none"
                  draggable={false}
                />

                {/* Overlay escurecido fora do crop */}
                <svg className="absolute inset-0 w-full h-full pointer-events-none" viewBox={`0 0 ${displaySize.w} ${displaySize.h}`}>
                  <defs>
                    <mask id="crop-mask">
                      <rect width={displaySize.w} height={displaySize.h} fill="white" />
                      <rect
                        x={rect.x * scale} y={rect.y * scale}
                        width={rect.w * scale} height={rect.h * scale}
                        fill="black"
                      />
                    </mask>
                  </defs>
                  <rect width={displaySize.w} height={displaySize.h} fill="rgba(0,0,0,0.55)" mask="url(#crop-mask)" />
                </svg>

                {/* Retângulo de crop interativo */}
                <div
                  className="absolute border border-white/90 cursor-move touch-none"
                  style={{
                    left: rect.x * scale,
                    top: rect.y * scale,
                    width: rect.w * scale,
                    height: rect.h * scale,
                  }}
                  onPointerDown={(e) => onPointerDownArea(e)}
                  onPointerMove={onPointerMove}
                  onPointerUp={onPointerUp}
                  onPointerCancel={onPointerUp}
                >
                  {/* Linhas guia (regra dos terços) */}
                  <div className="absolute inset-0 pointer-events-none">
                    <div className="absolute left-1/3 top-0 bottom-0 w-px bg-white/50" />
                    <div className="absolute left-2/3 top-0 bottom-0 w-px bg-white/50" />
                    <div className="absolute top-1/3 left-0 right-0 h-px bg-white/50" />
                    <div className="absolute top-2/3 left-0 right-0 h-px bg-white/50" />
                  </div>

                  {/* Brackets em L nos cantos (estilo Samsung Gallery) */}
                  {(["nw", "ne", "sw", "se"] as const).map((h) => {
                    const base: React.CSSProperties = {
                      width: 22, height: 22,
                    };
                    const pos: Record<string, React.CSSProperties> = {
                      nw: { ...base, left: -3, top: -3, cursor: "nwse-resize",
                        borderLeft: "4px solid white", borderTop: "4px solid white" },
                      ne: { ...base, right: -3, top: -3, cursor: "nesw-resize",
                        borderRight: "4px solid white", borderTop: "4px solid white" },
                      sw: { ...base, left: -3, bottom: -3, cursor: "nesw-resize",
                        borderLeft: "4px solid white", borderBottom: "4px solid white" },
                      se: { ...base, right: -3, bottom: -3, cursor: "nwse-resize",
                        borderRight: "4px solid white", borderBottom: "4px solid white" },
                    };
                    return (
                      <div
                        key={h}
                        className={cornerBracket}
                        style={pos[h]}
                        onPointerDown={(e) => { e.stopPropagation(); onPointerDownArea(e, h); }}
                        onPointerMove={onPointerMove}
                        onPointerUp={onPointerUp}
                        onPointerCancel={onPointerUp}
                      />
                    );
                  })}
                  {/* Barras nas bordas (sempre visíveis; em modo aspect fixo arrastam mantendo proporção) */}
                  {(["n", "s", "e", "w"] as const).map((h) => {
                    const horizontal = h === "n" || h === "s";
                    const pos: React.CSSProperties = horizontal
                      ? {
                          left: "50%", transform: "translateX(-50%)",
                          width: 36, height: 4,
                          [h === "n" ? "top" : "bottom"]: -2,
                          cursor: "ns-resize",
                        }
                      : {
                          top: "50%", transform: "translateY(-50%)",
                          width: 4, height: 36,
                          [h === "w" ? "left" : "right"]: -2,
                          cursor: "ew-resize",
                        };
                    return (
                      <div
                        key={h}
                        className={edgeBar}
                        style={pos}
                        onPointerDown={(e) => { e.stopPropagation(); onPointerDownArea(e, h); }}
                        onPointerMove={onPointerMove}
                        onPointerUp={onPointerUp}
                        onPointerCancel={onPointerUp}
                      />
                    );
                  })}

                  {/* Badge de proporção no centro (durante interação ou sempre, leve) */}
                  <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none">
                    <span className="px-2.5 py-1 rounded-full bg-black/55 text-white text-[11px] font-medium tracking-wide">
                      {aspectRatio ? (DEFAULT_ASPECT_GUIDES.find(g => g.value === aspectValue)?.label) : `${Math.round(rect.w)} × ${Math.round(rect.h)}`}
                    </span>
                  </div>
                </div>
              </div>
            )}
          </div>

          <p className="text-[11px] text-muted-foreground">
            Arraste o quadro para reposicionar. Use os pontos azuis para redimensionar. As proporções são apenas guias.
          </p>
        </div>

        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={onClose}>
            <X className="w-4 h-4 mr-1" /> Cancelar
          </Button>
          <Button onClick={handleApply} disabled={!rect}>
            <Check className="w-4 h-4 mr-1" /> Aplicar recorte
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default InteractiveCropper;
