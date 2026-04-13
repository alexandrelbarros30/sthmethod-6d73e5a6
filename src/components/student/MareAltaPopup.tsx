import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { MessageCircle, X } from "lucide-react";
import mareAlta from "@/assets/performeth/mare-alta-peptideos.png";

const WHATSAPP = "5521993637961";

interface Props {
  open: boolean;
  onClose: () => void;
}

const MareAltaPopup = ({ open, onClose }: Props) => {
  const handleWhatsApp = () => {
    window.open(
      `https://wa.me/${WHATSAPP}?text=Olá! Tenho interesse nos peptídeos da Maré Alta Importados.`,
      "_blank"
    );
  };

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o) onClose(); }}>
      <DialogContent className="max-w-sm p-0 overflow-hidden bg-white border-blue-200 text-gray-900">
        <button
          onClick={onClose}
          className="absolute right-3 top-3 z-20 rounded-full bg-black/10 p-1.5 hover:bg-black/20 transition-colors"
        >
          <X className="w-4 h-4 text-gray-700" />
        </button>

        <div className="text-center pt-4 px-4">
          <Badge className="bg-blue-500/20 text-blue-600 border-blue-500/30 text-[10px] mb-2">
            MARÉ ALTA IMPORTADOS
          </Badge>
          <h3 className="text-sm font-bold text-gray-900 mt-1">Peptídeos</h3>
          <p className="text-[10px] text-gray-500 mt-0.5">Tirzepatida e Retratutida — Diversos Laboratórios</p>
        </div>

        <div className="px-4">
          <div className="mx-auto flex items-center justify-center overflow-hidden rounded-lg">
            <img
              src={mareAlta}
              alt="Maré Alta Importados — Peptídeos"
              className="w-full h-auto object-contain rounded-lg"
            />
          </div>
        </div>

        <div className="px-4 pb-4 pt-2">
          <Button
            onClick={handleWhatsApp}
            className="w-full bg-green-600 hover:bg-green-700 text-white text-xs gap-1.5 h-9"
          >
            <MessageCircle className="w-3.5 h-3.5" /> WhatsApp — 21 99363-7961
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default MareAltaPopup;
