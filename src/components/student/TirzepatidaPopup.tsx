import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { MessageCircle, ExternalLink, X } from "lucide-react";
import tirzepatida from "@/assets/performeth/tirzepatida-tg.png";

const WHATSAPP = "5521998496289";
const SITE = "https://performethlabs.com.br";

interface Props {
  open: boolean;
  onClose: () => void;
}

const TirzepatidaPopup = ({ open, onClose }: Props) => {
  const handleWhatsApp = () => {
    window.open(
      `https://wa.me/${WHATSAPP}?text=Olá! Tenho interesse na Tirzepatida TG 60mg da Performeth Labs.`,
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
          <h3 className="text-sm font-bold text-white mt-1">Tirzepatida TG 60mg</h3>
          <p className="text-[10px] text-gray-400 mt-0.5">Controle glicêmico e redução de peso</p>
        </div>

        <div className="px-4">
          <div className="mx-auto flex items-center justify-center overflow-hidden rounded-lg">
            <img
              src={tirzepatida}
              alt="Tirzepatida TG 60mg"
              className="w-full h-auto object-contain rounded-lg"
            />
          </div>
        </div>

        <div className="px-4 pb-1">
          <p className="text-[11px] text-cyan-400 mb-1">4 ampolas de 15mg — Via subcutânea</p>
          <p className="text-[10px] text-gray-400 leading-snug">
            Tirzepatida 15mg/0,5mL • Ação dupla GIP + GLP-1
          </p>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-sm font-bold text-white">R$ 1.520</span>
            <span className="text-[10px] text-gray-500">à vista no Pix</span>
          </div>
          <p className="text-[10px] text-gray-500">ou 6x de R$ 297,83</p>
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

export default TirzepatidaPopup;
