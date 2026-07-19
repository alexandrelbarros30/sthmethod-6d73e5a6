import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Dumbbell, ExternalLink, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import StCoachCredit from "@/components/shared/StCoachCredit";

interface Program {
  id: number | string;
  name: string;
  subtitle: string | null;
  cover_url: string | null;
  weeks: number | null;
  days_per_week: number | null;
  minutes_per_day: number | null;
}

interface Props {
  userId?: string | null;
  email?: string | null;
  name?: string | null;
  compact?: boolean;
  title?: string;
}

/**
 * Busca no ST Coach os programas vinculados ao aluno e apresenta cards
 * com a arte do programa. Silencioso quando não há vínculo (não polui a tela).
 */
const SuperCoachAssignedPrograms = ({ userId, email, name, compact, title }: Props) => {
  const { data, isFetching, refetch, isError } = useQuery({
    queryKey: ["supercoach-programs", userId || email || name],
    enabled: !!(userId || email || name),
    staleTime: 5 * 60_000,
    queryFn: async () => {
      const { data, error } = await supabase.functions.invoke("supercoach-student-programs", {
        body: { userId: userId || undefined, email: email || undefined, name: name || undefined },
      });
      if (error) throw error;
      return data as { ok: boolean; status: string; programs: Program[] };
    },
  });

  const programs = data?.programs || [];
  const status = data?.status;

  // Silencioso quando não há aluno correspondente no ST Coach
  if (status === "not_found") return null;
  if (!isFetching && !programs.length && status !== "empty" && !isError) return null;

  return (
    <Card className="border-foreground/10 bg-card/60">
      <CardContent className="p-4 sm:p-5 space-y-4">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2 min-w-0">
            <Dumbbell className="w-4 h-4 text-primary shrink-0" />
            <h3 className="text-sm font-semibold tracking-tight truncate">
              {title || "Programas vinculados no ST Coach"}
            </h3>
          </div>
          <Button
            variant="ghost" size="sm"
            className="h-7 gap-1 text-xs"
            onClick={() => refetch()}
            disabled={isFetching}
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isFetching ? "animate-spin" : ""}`} />
            Atualizar
          </Button>
        </div>

        {isFetching && !programs.length ? (
          <p className="text-xs text-muted-foreground">Buscando programas no ST Coach…</p>
        ) : programs.length ? (
          <div className={`grid gap-3 ${compact ? "grid-cols-2 sm:grid-cols-3" : "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3"}`}>
            {programs.map((p) => (
              <div
                key={p.id}
                className="group relative overflow-hidden rounded-xl border border-foreground/10 bg-background/60"
              >
                <div className="relative aspect-[16/10] bg-muted">
                  {p.cover_url ? (
                    <img
                      src={p.cover_url}
                      alt={p.name}
                      className="w-full h-full object-cover"
                      loading="lazy"
                    />
                  ) : (
                    <div className="w-full h-full grid place-items-center text-muted-foreground/40">
                      <Dumbbell className="w-8 h-8" />
                    </div>
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-transparent" />
                  <div className="absolute bottom-2 left-2 right-2">
                    <p className="text-[13px] font-semibold text-white leading-tight line-clamp-2">
                      {p.name}
                    </p>
                    {p.subtitle && (
                      <p className="text-[10px] text-white/70 leading-tight line-clamp-1 mt-0.5">
                        {p.subtitle}
                      </p>
                    )}
                  </div>
                </div>
                <div className="px-3 py-2 flex items-center justify-between gap-2 text-[10px] text-muted-foreground">
                  <span className="truncate">
                    {[p.weeks && `${p.weeks} sem`, p.days_per_week && `${p.days_per_week}x/sem`, p.minutes_per_day && `${p.minutes_per_day}min`]
                      .filter(Boolean).join(" · ") || "—"}
                  </span>
                  <ExternalLink className="w-3 h-3 opacity-50" />
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-xs text-muted-foreground">
            Nenhum programa vinculado a este aluno no ST Coach.
          </p>
        )}

        <StCoachCredit />
      </CardContent>
    </Card>
  );
};

export default SuperCoachAssignedPrograms;