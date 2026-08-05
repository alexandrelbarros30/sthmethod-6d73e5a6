import { useAiApp, AiKind } from "@/hooks/useAiApp";
import AiShell from "@/components/ai/AiShell";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { History, Search, ArrowRight, Salad, Dumbbell, BrainCircuit, Camera, TrendingUp } from "lucide-react";
import { useEffect, useState, useMemo } from "react";
import { Input } from "@/components/ui/input";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAiProgress } from "@/hooks/useAiProgress";

type HistoryKind = AiKind | "body_image" | "measurement";

const KIND_ICONS: Record<HistoryKind, any> = {
  diet: Salad,
  workout: Dumbbell,
  analysis: BrainCircuit,
  body_image: Camera,
  measurement: TrendingUp,
};

const KIND_LABELS: Record<HistoryKind, string> = {
  diet: "Cardápio",
  workout: "Treino",
  analysis: "Análise",
  body_image: "Imagem Corporal",
  measurement: "Medidas e Peso",
};

const KIND_ROUTES: Record<HistoryKind, string> = {
  diet: "/ai/app/cardapio",
  workout: "/ai/app/treino",
  analysis: "/ai/app/analise",
  body_image: "/ai/app/imagens",
  measurement: "/ai/app/progresso",
};

interface HistoryItem {
  id: string;
  kind: HistoryKind;
  title: string;
  subtitle: string;
  date: Date;
  route: string;
  meta?: string;
}

export default function AiHistory() {
  const { generations, user } = useAiApp();
  const { measurements } = useAiProgress();
  const [search, setSearch] = useState("");
  const [bodyImages, setBodyImages] = useState<any[]>([]);

  useEffect(() => {
    if (!user?.id) return;
    supabase
      .from("body_images")
      .select("id, type, uploaded_at")
      .eq("user_id", user.id)
      .order("uploaded_at", { ascending: false })
      .then(({ data }) => setBodyImages(data ?? []));
  }, [user?.id]);

  const items = useMemo(() => {
    const all: HistoryItem[] = [];

    // 1. Gerações de IA (Cardápios, Treinos, Análises)
    generations.forEach((g) => {
      all.push({
        id: g.id,
        kind: g.kind,
        title: KIND_LABELS[g.kind],
        subtitle: `Versão ${g.revisions + 1}`,
        date: new Date(g.created_at),
        route: `${KIND_ROUTES[g.kind]}?version=${g.id}`,
        meta: g.content,
      });
    });

    // 2. Imagens Corporais
    bodyImages.forEach((img) => {
      all.push({
        id: img.id,
        kind: "body_image",
        title: "Foto Evolução",
        subtitle: img.type === "front" ? "Frente" : img.type === "side" ? "Lado" : img.type === "back" ? "Costas" : "Registro",
        date: new Date(img.uploaded_at),
        route: "/ai/app/imagens",
      });
    });

    // 3. Medidas e Peso
    measurements.forEach((m) => {
      all.push({
        id: m.id,
        kind: "measurement",
        title: "Medidas e Peso",
        subtitle: m.weight_kg ? `${m.weight_kg}kg registrados` : "Medidas registradas",
        date: new Date(m.measured_on + "T12:00:00"),
        route: "/ai/app/progresso",
      });
    });

    return all.sort((a, b) => b.date.getTime() - a.date.getTime());
  }, [generations, bodyImages, measurements]);

  const filtered = items.filter((item) => {
    const dateStr = format(item.date, "PPP", { locale: ptBR });
    const match = (val?: string) => val?.toLowerCase().includes(search.toLowerCase());
    return (
      match(item.title) ||
      match(item.subtitle) ||
      match(dateStr) ||
      match(item.meta)
    );
  });

  return (
    <AiShell title="Histórico STHIA" subtitle="Acompanhe sua jornada: treinos, dietas, fotos e evolução.">
      <div className="relative mb-6">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="Buscar (ex: data, fotos, cardápio, treino...)"
          className="pl-9"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {filtered.length === 0 ? (
        <Card className="flex flex-col items-center justify-center p-12 text-center">
          <History className="mb-4 h-12 w-12 text-muted-foreground/20" />
          <p className="text-sm text-muted-foreground">
            {search ? "Nenhum registro encontrado para essa busca." : "Você ainda não possui registros no histórico."}
          </p>
        </Card>
      ) : (
        <div className="space-y-3">
          {filtered.map((item) => {
            const Icon = KIND_ICONS[item.kind] || History;
            return (
              <Link key={item.id} to={item.route}>
                <Card className="group flex items-center justify-between p-4 transition-all hover:border-primary/40 hover:bg-accent/50">
                  <div className="flex items-center gap-4">
                    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                      <Icon className="h-6 w-6" />
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-bold uppercase tracking-tight">
                          {item.title}
                        </span>
                        {item.kind !== "body_image" && item.kind !== "measurement" && (
                          <Badge variant="outline" className="text-[10px]">
                            {item.subtitle}
                          </Badge>
                        )}
                      </div>
                      <p className="mt-0.5 text-xs text-muted-foreground">
                        {item.kind === "body_image" || item.kind === "measurement" ? item.subtitle + " · " : ""}
                        {format(item.date, "dd 'de' MMMM", { locale: ptBR })} às {format(item.date, "HH:mm")}
                      </p>
                    </div>
                  </div>
                  <ArrowRight className="h-4 w-4 text-muted-foreground transition-transform group-hover:translate-x-0.5 group-hover:text-primary" />
                </Card>
              </Link>
            );
          })}
        </div>
      )}
    </AiShell>
  );
}
