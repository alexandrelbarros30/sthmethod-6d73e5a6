import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { PlayCircle } from "lucide-react";
import { useEffect, useState } from "react";

interface Props {
  open: boolean;
  onOpenChange: (o: boolean) => void;
}

export const EvolutionTutorialVideoDialog = ({ open, onOpenChange }: Props) => {
  const [tutorialUrl, setTutorialUrl] = useState<string | null>(null);
  useEffect(() => {
    if (!open || tutorialUrl) return;
    // Verifica se o vídeo tutorial existe em /public. Se ainda não estiver publicado, cai no fallback.
    const url = "/tutorial-missao-evolucao.mp4";
    fetch(url, { method: "HEAD" })
      .then((r) => setTutorialUrl(r.ok ? url : null))
      .catch(() => setTutorialUrl(null));
  }, [open, tutorialUrl]);
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl p-0 overflow-hidden bg-black border-white/10">
        <DialogHeader className="p-4 pb-2">
          <DialogTitle className="text-white flex items-center gap-2">
            <PlayCircle className="w-5 h-5" style={{ color: "hsl(145 60% 42%)" }} />
            Missão Evolução — Como funciona
          </DialogTitle>
        </DialogHeader>
        <div className="aspect-video w-full bg-black">
          {tutorialUrl ? (
            <video
              src={tutorialUrl}
              autoPlay
              controls
              playsInline
              className="w-full h-full object-contain"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-white/70 text-sm p-6 text-center">
              O vídeo ainda está sendo processado. Use o tour interativo enquanto isso — ele cobre exatamente as mesmas etapas.
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default EvolutionTutorialVideoDialog;