import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { History } from "lucide-react";

interface Props {
  allImages: any[];
}

const labels: Record<string, string> = { front: "Frente", back: "Costas", profile: "Perfil" };

const EvolutionImageHistory = ({ allImages }: Props) => {
  const imagesByDate = allImages.reduce((acc: Record<string, any[]>, img: any) => {
    const date = new Date(img.uploaded_at).toLocaleDateString("pt-BR");
    if (!acc[date]) acc[date] = [];
    acc[date].push(img);
    return acc;
  }, {});

  if (!Object.keys(imagesByDate).length) return null;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base font-display flex items-center gap-2">
          <History className="w-4 h-4" /> Histórico de Fotos Corporais
        </CardTitle>
        <p className="text-xs text-muted-foreground">Todas as suas fotos são preservadas para acompanhamento da evolução.</p>
      </CardHeader>
      <CardContent>
        {Object.entries(imagesByDate).map(([date, imgs]) => (
          <div key={date} className="mb-5 last:mb-0">
            <div className="flex items-center gap-2 mb-2">
              <p className="text-xs font-semibold text-muted-foreground">{date}</p>
              <p className="text-[10px] text-muted-foreground/70">
                {new Date((imgs as any[])[0]?.uploaded_at).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}
              </p>
              {(imgs as any[])[0]?.is_current && <Badge variant="secondary" className="text-[10px]">Atual</Badge>}
            </div>
            <div className="grid grid-cols-3 gap-2">
              {["front", "back", "profile"].map((type) => {
                const img = (imgs as any[]).find((i: any) => i.type === type);
                return (
                  <div key={type} className="text-center">
                    <p className="text-[10px] text-muted-foreground mb-0.5">{labels[type]}</p>
                    {img ? (
                      <img src={img.image_url} alt={labels[type]} className="w-full aspect-[3/4] object-cover rounded border" />
                    ) : (
                      <div className="w-full aspect-[3/4] bg-muted rounded flex items-center justify-center text-muted-foreground text-[10px]">—</div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
};

export default EvolutionImageHistory;
