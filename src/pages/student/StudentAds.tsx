import { useState } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { MessageCircle, ExternalLink } from "lucide-react";
import PerformethLabsPopup from "@/components/student/PerformethLabsPopup";
import TirzepatidaPopup from "@/components/student/TirzepatidaPopup";
import CardioShieldPopup from "@/components/student/CardioShieldPopup";

import alphaBurn from "@/assets/performeth/alpha-burn.png";
import tirzepatida from "@/assets/performeth/tirzepatida-tg.png";
import cardioShield from "@/assets/performeth/cardio-shield.png";

const WHATSAPP = "5521972486650";

const ads = [
  { id: "performeth", title: "Performeth Labs", desc: "Fórmulas exclusivas de alta performance", image: alphaBurn },
  { id: "tirzepatida", title: "Tirzepatida TG 60mg", desc: "Controle glicêmico e redução de peso", image: tirzepatida },
  { id: "cardioshield", title: "CardioShield", desc: "Blindagem Endotelial — Omega 3, NAC, Tadalafila", image: cardioShield },
];

const StudentAds = () => {
  const [performethOpen, setPerformethOpen] = useState(false);
  const [tirzepatidaOpen, setTirzepatidaOpen] = useState(false);
  const [cardioShieldOpen, setCardioShieldOpen] = useState(false);

  const openAd = (id: string) => {
    if (id === "performeth") setPerformethOpen(true);
    else if (id === "tirzepatida") setTirzepatidaOpen(true);
    else setCardioShieldOpen(true);
  };

  return (
    <DashboardLayout role="student" title="Propagandas" subtitle="Ofertas e promoções exclusivas">
      <div className="space-y-4">
        {ads.map((ad) => (
          <Card key={ad.id} className="overflow-hidden border-border/50">
            <CardContent className="p-0">
              <div className="flex items-center gap-4 p-4">
                <img src={ad.image} alt={ad.title} className="w-16 h-16 rounded-xl object-cover" />
                <div className="flex-1 min-w-0">
                  <h3 className="text-sm font-bold text-foreground">{ad.title}</h3>
                  <p className="text-xs text-muted-foreground mt-0.5">{ad.desc}</p>
                </div>
                <Button size="sm" variant="outline" className="text-xs shrink-0" onClick={() => openAd(ad.id)}>
                  Ver
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}

        <div className="pt-2 flex gap-2">
          <Button size="sm" className="flex-1 bg-green-600 hover:bg-green-700 text-white text-xs gap-1.5" onClick={() => window.open(`https://wa.me/${WHATSAPP}`, "_blank")}>
            <MessageCircle className="w-3.5 h-3.5" /> WhatsApp
          </Button>
          <Button size="sm" variant="outline" className="flex-1 text-xs gap-1.5" onClick={() => window.open("https://performethlabs.com.br", "_blank")}>
            <ExternalLink className="w-3.5 h-3.5" /> Site
          </Button>
        </div>
      </div>

      <PerformethLabsPopup open={performethOpen} onClose={() => setPerformethOpen(false)} />
      <TirzepatidaPopup open={tirzepatidaOpen} onClose={() => setTirzepatidaOpen(false)} />
      <CardioShieldPopup open={cardioShieldOpen} onClose={() => setCardioShieldOpen(false)} />
    </DashboardLayout>
  );
};

export default StudentAds;
