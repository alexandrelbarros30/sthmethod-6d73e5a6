import { useState, useEffect } from "react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ChevronLeft, ChevronRight, ExternalLink, MessageCircle, X } from "lucide-react";

import alphaBurn from "@/assets/performeth/alpha-burn.png";
import androBlock from "@/assets/performeth/andro-block.png";
import lipoBlast from "@/assets/performeth/lipo-blast.png";
import controlHard from "@/assets/performeth/control-hard.png";
import gestrinona from "@/assets/performeth/gestrinona.jpg";
import testosteronaGel from "@/assets/performeth/testosterona-gel.jpg";
import estradiolGel from "@/assets/performeth/estradiol-gel.png";
import oxandrolona from "@/assets/performeth/oxandrolona.jpg";
import tirzepatida from "@/assets/performeth/tirzepatida-tg.png";

const PRODUCTS = [
  {
    name: "Alpha Burn",
    image: alphaBurn,
    desc: "Aceleração metabólica e redução de gordura",
    ingredients: "Cafeína • Efedrina • Ioimbina • Taurina • L-Teanina • Berberina • Picolinato de Cromo • EGCG",
    qty: "60 cápsulas",
  },
  {
    name: "Andro Block",
    image: androBlock,
    desc: "Equilíbrio hormonal e suporte regulatório",
    ingredients: "Zinco • Biotina • Selênio • Vitamina D • Vitamina C • Saw Palmetto • Espironolactona",
    qty: "60 cápsulas",
  },
  {
    name: "Lipo Blast",
    image: lipoBlast,
    desc: "Aceleração da queima e resposta metabólica",
    ingredients: "Cafeína • Ioimbina • Clembuterol",
    qty: "60 cápsulas",
  },
  {
    name: "Control Hard",
    image: controlHard,
    desc: "Controle de apetite, metabólico e comportamental",
    ingredients: "Bupropiona SR • Naltrexona • Topiramato • Berberina • Myo-inositol • Picolinato de Cromo",
    qty: "60 cápsulas",
  },
  {
    name: "Gestrinona",
    image: gestrinona,
    desc: "Controle hormonal. Definição real.",
    ingredients: "2,5mg / 60 cápsulas — Modulação hormonal, cutting e recomposição",
    qty: "60 cápsulas",
  },
  {
    name: "Testosterona em Gel 5%",
    image: testosteronaGel,
    desc: "Regulação avançada. Resultados reais.",
    ingredients: "Testosterona transdérmica 5%",
    qty: "60g",
  },
  {
    name: "Estradiol em Gel 1mg/g",
    image: estradiolGel,
    desc: "Modulação estrogênica com absorção otimizada",
    ingredients: "Estradiol transdérmico 1mg/g",
    qty: "100g",
  },
  {
    name: "Oxandrolona 3,5mg",
    image: oxandrolona,
    desc: "Força. Performance. Definição.",
    ingredients: "Oxandrolona 3,5mg",
    qty: "100 cápsulas",
  },
  {
    name: "Tirzepatida TG 60mg",
    image: tirzepatida,
    desc: "4 ampolas de 15mg — Controle glicêmico e redução de peso",
    ingredients: "Tirzepatida 15mg/0,5mL • Via subcutânea • À vista R$ 1.520 no Pix • 6x de R$ 297,83",
    qty: "4 frascos-ampola",
  },
];

const WHATSAPP = "5521998496289";
const SITE = "https://performethlabs.com.br";

interface Props {
  open: boolean;
  onClose: () => void;
}

const PerformethLabsPopup = ({ open, onClose }: Props) => {
  const [idx, setIdx] = useState(0);

  useEffect(() => {
    if (!open) return;
    const interval = setInterval(() => setIdx((i) => (i + 1) % PRODUCTS.length), 5000);
    return () => clearInterval(interval);
  }, [open]);

  const product = PRODUCTS[idx];
  const prev = () => setIdx((i) => (i - 1 + PRODUCTS.length) % PRODUCTS.length);
  const next = () => setIdx((i) => (i + 1) % PRODUCTS.length);

  const handleWhatsApp = () => {
    window.open(`https://wa.me/${WHATSAPP}?text=Olá! Tenho interesse no produto ${product.name} da Performeth Labs.`, "_blank");
  };

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o) onClose(); }}>
      <DialogContent className="max-w-sm p-0 overflow-hidden bg-[#0a0a14] border-[#1a1a2e] text-white">
        {/* Close */}
        <button
          onClick={onClose}
          className="absolute right-3 top-3 z-20 rounded-full bg-white/10 p-1.5 hover:bg-white/20 transition-colors"
        >
          <X className="w-4 h-4 text-white" />
        </button>

        {/* Header */}
        <div className="text-center pt-4 px-4">
          <Badge className="bg-cyan-500/20 text-cyan-400 border-cyan-500/30 text-[10px] mb-2">
            PERFORMETH LABS
          </Badge>
          <p className="text-[10px] text-gray-400">Fórmulas exclusivas de alta performance</p>
        </div>

        {/* Product Image */}
        <div className="relative px-4">
          <div className="mx-auto flex items-center justify-center overflow-hidden rounded-lg">
            <img
              src={product.image}
              alt={product.name}
              className="w-full h-auto max-h-[300px] object-contain rounded-lg transition-all duration-500"
            />
          </div>

          {/* Nav arrows */}
          <button onClick={prev} className="absolute left-2 top-1/2 -translate-y-1/2 bg-black/50 rounded-full p-1 hover:bg-black/70">
            <ChevronLeft className="w-4 h-4 text-white" />
          </button>
          <button onClick={next} className="absolute right-2 top-1/2 -translate-y-1/2 bg-black/50 rounded-full p-1 hover:bg-black/70">
            <ChevronRight className="w-4 h-4 text-white" />
          </button>
        </div>

        {/* Info */}
        <div className="px-4 pb-2">
          <h3 className="text-sm font-bold text-white">{product.name}</h3>
          <p className="text-[11px] text-cyan-400 mb-1">{product.desc}</p>
          <p className="text-[10px] text-gray-400 leading-snug">{product.ingredients}</p>
          <p className="text-[10px] text-gray-500 mt-0.5">{product.qty}</p>
        </div>

        {/* Dots */}
        <div className="flex justify-center gap-1 pb-2">
          {PRODUCTS.map((_, i) => (
            <button
              key={i}
              onClick={() => setIdx(i)}
              className={`w-1.5 h-1.5 rounded-full transition-all ${i === idx ? "bg-cyan-400 w-4" : "bg-gray-600"}`}
            />
          ))}
        </div>

        {/* Actions */}
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

export default PerformethLabsPopup;
