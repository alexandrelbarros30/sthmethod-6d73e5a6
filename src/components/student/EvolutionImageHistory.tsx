import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { History } from "lucide-react";
import SignedImage from "@/components/shared/SignedImage";

interface Props {
  allImages: any[];
}

const labels: Record<string, string> = { front: "Frente", back: "Costas", profile: "Perfil" };

const EvolutionImageHistory = ({ allImages }: Props) => {
  // Agrupa por sessão (janela de 10 min) para que Frente/Costas/Perfil
  // de um mesmo envio fiquem juntos mesmo cruzando a virada do minuto.
  const SESSION_WINDOW_MS = 10 * 60 * 1000;
  const sorted = [...allImages].sort(
    (a: any, b: any) => new Date(b.uploaded_at).getTime() - new Date(a.uploaded_at).getTime()
  );
  const imagesByDate: Record<string, any[]> = {};
  let currentKey: string | null = null;
  let currentAnchor = 0;
  for (const img of sorted) {
    const t = new Date(img.uploaded_at).getTime();
    if (currentKey === null || Math.abs(currentAnchor - t) > SESSION_WINDOW_MS) {
      currentKey = `${new Date(img.uploaded_at).toLocaleDateString("pt-BR")}__${t}`;
      currentAnchor = t;
      imagesByDate[currentKey] = [];
    }
    imagesByDate[currentKey].push(img);
  }

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
                      <SignedImage bucket="body-images" storagePath={img.storage_path} publicUrl={img.image_url} alt={labels[type]} className="w-full aspect-[3/4] object-cover rounded border" />
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
