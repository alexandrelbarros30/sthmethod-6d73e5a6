import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { MessageCircle, ExternalLink, X } from "lucide-react";
import cardioShield from "@/assets/performeth/cardio-shield.png";

const WHATSAPP = "5521998496289";
const SITE = "https://performethlabs.com.br";

interface Props {
  open: boolean;
  onClose: () => void;
}

const CardioShieldPopup = ({ open, onClose }: Props) => {
  const handleWhatsApp = () => {
    window.open(
      `https://wa.me/${WHATSAPP}?text=Olá! Tenho interesse no kit CardioShield — Blindagem Endotelial da Performeth Labs.`,
      "_blank"
    );
  };

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o) onClose(); }}>
      <DialogContent className="max-w-sm p-0 overflow-hidden bg-[#0a0a14] border-[#1a1a2e] text-white">
        <button
          onClick={onClose}
          className="absolute right-3 top-3 z-20 rounded-full bg-white/10 p-1.5 hover:bg-white/20 transition-colors"
        >
          <X className="w-4 h-4 text-white" />
        </button>

        <div className="text-center pt-4 px-4">
          <Badge className="bg-cyan-500/20 text-cyan-400 border-cyan-500/30 text-[10px] mb-2">
            PERFORMETH LABS
          </Badge>
          <h3 className="text-sm font-bold text-white mt-1">CardioShield</h3>
          <p className="text-[10px] text-gray-400 mt-0.5">Blindagem Endotelial</p>
        </div>

        <div className="px-4">
          <div className="mx-auto flex items-center justify-center overflow-hidden rounded-lg">
            <img
              src={cardioShield}
              alt="CardioShield — Blindagem Endotelial"
              className="w-full h-auto object-contain rounded-lg"
            />
          </div>
        </div>

        <div className="px-4 pb-1 space-y-1.5">
          <div className="flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-red-400 shrink-0" />
            <p className="text-[11px] text-gray-300"><span className="text-red-400 font-semibold">Tadalafila 5mg</span> — Circulação e vitalidade</p>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-400 shrink-0" />
            <p className="text-[11px] text-gray-300"><span className="text-amber-400 font-semibold">Omega 3 1000mg</span> — EPA e DHA Ultra Puro</p>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-blue-400 shrink-0" />
            <p className="text-[11px] text-gray-300"><span className="text-blue-400 font-semibold">N-Acetilcisteína 600mg</span> — Proteção antioxidante</p>
          </div>
        </div>

        <div className="px-4 pb-4 flex gap-2">
          <Button
            onClick={handleWhatsApp}
            className="flex-1 bg-green-600 hover:bg-green-700 text-white text-xs gap-1.5 h-9"
          >
            <MessageCircle className="w-3.5 h-3.5" /> WhatsApp
          </Button>
          <Button
            onClick={() => window.open(SITE, "_blank")}
            variant="outline"
            className="flex-1 border-cyan-500/30 text-cyan-400 hover:bg-cyan-500/10 text-xs gap-1.5 h-9"
          >
            <ExternalLink className="w-3.5 h-3.5" /> Site
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default CardioShieldPopup;
