import { useAiApp, AiGeneration, AiKind, AI_MODULES } from "@/hooks/useAiApp";
import AiShell from "@/components/ai/AiShell";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Calendar, History, Search, ArrowRight, Salad, Dumbbell, BrainCircuit } from "lucide-react";
import { useState } from "react";
import { Input } from "@/components/ui/input";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Link } from "react-router-dom";

const KIND_ICONS: Record<AiKind, any> = {
  diet: Salad,
  workout: Dumbbell,
  analysis: BrainCircuit,
};

const KIND_LABELS: Record<AiKind, string> = {
  diet: "Cardápio",
  workout: "Treino",
  analysis: "Análise",
};

const KIND_ROUTES: Record<AiKind, string> = {
  diet: "/ai/app/cardapio",
  workout: "/ai/app/treino",
  analysis: "/ai/app/analise",
};

export default function AiHistory() {
  const { generations, loading } = useAiApp();
  const [search, setSearch] = useState("");

  const filtered = generations.filter((g) => {
    const label = KIND_LABELS[g.kind] || "";
    const date = format(new Date(g.created_at), "PPP", { locale: ptBR });
    return (
      label.toLowerCase().includes(search.toLowerCase()) ||
      date.toLowerCase().includes(search.toLowerCase()) ||
      g.content.toLowerCase().includes(search.toLowerCase())
    );
  });

  return (
    <AiShell title="Histórico STHIA" subtitle="Consulte todos os seus cardápios e treinos gerados anteriormente.">
      <div className="relative mb-6">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="Buscar no histórico (ex: data, cardápio, treino...)"
          className="pl-9"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {filtered.length === 0 ? (
        <Card className="flex flex-col items-center justify-center p-12 text-center">
          <History className="mb-4 h-12 w-12 text-muted-foreground/20" />
          <p className="text-sm text-muted-foreground">
            {search ? "Nenhum registro encontrado para essa busca." : "Você ainda não possui gerações no histórico."}
          </p>
        </Card>
      ) : (
        <div className="space-y-3">
          {filtered.map((gen) => {
            const Icon = KIND_ICONS[gen.kind] || History;
            const date = new Date(gen.created_at);
            return (
              <Link key={gen.id} to={`${KIND_ROUTES[gen.kind]}?version=${gen.id}`}>
                <Card className="group flex items-center justify-between p-4 transition-all hover:border-primary/40 hover:bg-accent/50">
                  <div className="flex items-center gap-4">
                    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                      <Icon className="h-6 w-6" />
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-bold uppercase tracking-tight">
                          {KIND_LABELS[gen.kind]}
                        </span>
                        <Badge variant="outline" className="text-[10px]">
                          v{gen.revisions + 1}
                        </Badge>
                      </div>
                      <p className="mt-0.5 text-xs text-muted-foreground">
                        Gerado em {format(date, "PPP", { locale: ptBR })} às {format(date, "HH:mm")}
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
    </AiHistory>
  );
}
