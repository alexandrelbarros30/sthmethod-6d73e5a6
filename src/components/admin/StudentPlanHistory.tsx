import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { CalendarDays, History } from "lucide-react";

const fmtDate = (s?: string | null) => {
  if (!s) return "—";
  try {
    return new Date(s + (s.length === 10 ? "T00:00:00" : "")).toLocaleDateString("pt-BR", {
      day: "2-digit", month: "short", year: "numeric",
    });
  } catch { return "—"; }
};

interface Props { userId: string | null | undefined }

const StudentPlanHistory = ({ userId }: Props) => {
  const { data: planHistory = [], isLoading } = useQuery({
    queryKey: ["admin-plan-history", userId],
    queryFn: async () => {
      const { data: subs } = await supabase
        .from("subscriptions")
        .select("id, plan_id, start_date, end_date, status, created_at")
        .eq("user_id", userId!)
        .order("start_date", { ascending: true });
      const list = subs || [];
      const planIds = Array.from(new Set(list.map((s: any) => s.plan_id).filter(Boolean)));
      let plansMap: Record<string, string> = {};
      if (planIds.length) {
        const { data: plans } = await supabase.from("plans").select("id, name").in("id", planIds);
        plansMap = Object.fromEntries((plans || []).map((p: any) => [p.id, p.name]));
      }
      return list.map((s: any) => ({ ...s, plan_name: plansMap[s.plan_id] || "Plano" }));
    },
    enabled: !!userId,
  });

  if (!userId) return null;
  if (isLoading) {
    return <p className="text-xs text-muted-foreground">Carregando histórico...</p>;
  }
  if (planHistory.length === 0) {
    return <p className="text-xs text-muted-foreground">Nenhuma assinatura registrada.</p>;
  }

  const firstStart = planHistory[0]?.start_date as string | undefined;
  const currentSub = [...planHistory].sort(
    (a: any, b: any) => new Date(b.start_date).getTime() - new Date(a.start_date).getTime(),
  )[0];

  return (
    <div className="rounded-xl border border-border/50 bg-muted/20 p-4">
      <div className="grid grid-cols-2 gap-3 mb-4">
        <div className="rounded-lg border border-border/50 p-3 bg-background">
          <p className="text-[9px] font-medium tracking-[0.2em] uppercase text-muted-foreground flex items-center gap-1">
            <CalendarDays className="w-2.5 h-2.5" /> Plano atual
          </p>
          <p className="text-sm font-semibold mt-1.5 truncate">{currentSub?.plan_name || "—"}</p>
          <p className="text-[11px] text-muted-foreground mt-1">Início: {fmtDate(currentSub?.start_date)}</p>
          <p className="text-[11px] text-muted-foreground">Vence: {fmtDate(currentSub?.end_date)}</p>
        </div>
        <div className="rounded-lg border border-border/50 p-3 bg-background">
          <p className="text-[9px] font-medium tracking-[0.2em] uppercase text-muted-foreground flex items-center gap-1">
            <CalendarDays className="w-2.5 h-2.5" /> Cliente desde
          </p>
          <p className="text-sm font-semibold mt-1.5">{fmtDate(firstStart)}</p>
          <p className="text-[11px] text-muted-foreground mt-1">
            {planHistory.length} {planHistory.length === 1 ? "ciclo" : "ciclos"} contratados
          </p>
        </div>
      </div>

      <p className="text-[10px] font-medium tracking-[0.2em] uppercase text-muted-foreground mb-2 flex items-center gap-1">
        <History className="w-3 h-3" /> Linha do tempo
      </p>
      <div className="relative pl-4">
        <div className="absolute left-[5px] top-1 bottom-1 w-px bg-border/60" />
        <ul className="space-y-2.5">
          {[...planHistory].reverse().map((s: any, idx: number) => {
            const isCurrent = s.id === currentSub?.id;
            const isFirst = idx === planHistory.length - 1;
            return (
              <li key={s.id} className="relative">
                <span className={`absolute -left-4 top-1.5 w-2.5 h-2.5 rounded-full border ${isCurrent ? "bg-foreground border-foreground" : "bg-background border-border"}`} />
                <p className="text-[12.5px] font-medium truncate">
                  {s.plan_name}
                  {isCurrent && <span className="ml-2 text-[9px] uppercase tracking-[0.18em] font-semibold text-emerald-500">· atual</span>}
                  {!isCurrent && isFirst && <span className="ml-2 text-[9px] uppercase tracking-[0.18em] text-muted-foreground">· 1ª adesão</span>}
                  {!isCurrent && !isFirst && <span className="ml-2 text-[9px] uppercase tracking-[0.18em] text-muted-foreground">· renovação</span>}
                </p>
                <p className="text-[10.5px] text-muted-foreground mt-0.5">
                  {fmtDate(s.start_date)} → {fmtDate(s.end_date)}
                </p>
              </li>
            );
          })}
        </ul>
      </div>
    </div>
  );
};

export default StudentPlanHistory;