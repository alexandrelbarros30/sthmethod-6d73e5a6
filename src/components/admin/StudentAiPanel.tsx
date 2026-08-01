import { useCallback, useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Flame, Sparkles, Download, RefreshCw, Ruler } from "lucide-react";
import { computeStreak } from "@/hooks/useAiProgress";

interface Props {
  userId: string;
}

interface Measurement {
  id: string;
  measured_on: string;
  weight_kg: number | null;
  waist_cm: number | null;
  hip_cm: number | null;
  chest_cm: number | null;
  arm_cm: number | null;
  thigh_cm: number | null;
}

/** Integração reversa: dados do STH METHOD AI exibidos no prontuário do portal. */
export default function StudentAiPanel({ userId }: Props) {
  const { role } = useAuth();
  const [loading, setLoading] = useState(true);
  const [importing, setImporting] = useState(false);
  const [hasProfile, setHasProfile] = useState(false);
  const [plan, setPlan] = useState<{ plan: string; status: string; expires_at: string | null } | null>(null);
  const [dates, setDates] = useState<string[]>([]);
  const [checkinRows, setCheckinRows] = useState<{ checkin_date: string; diet_done: boolean; workout_done: boolean; water_done: boolean }[]>([]);
  const [measurements, setMeasurements] = useState<Measurement[]>([]);

  const load = useCallback(async () => {
    if (!userId) return;
    setLoading(true);
    const [prof, sub, chk, meas] = await Promise.all([
      supabase.from("ai_app_profiles").select("user_id").eq("user_id", userId).maybeSingle(),
      supabase.from("ai_app_subscriptions").select("plan, status, expires_at").eq("user_id", userId).order("created_at", { ascending: false }).limit(1),
      supabase.from("ai_app_checkins").select("checkin_date, diet_done, workout_done, water_done").eq("user_id", userId).order("checkin_date", { ascending: false }).limit(60),
      supabase.from("ai_app_measurements").select("id, measured_on, weight_kg, waist_cm, hip_cm, chest_cm, arm_cm, thigh_cm").eq("user_id", userId).order("measured_on", { ascending: false }).limit(12),
    ]);
    setHasProfile(!!prof.data);
    setPlan((sub.data?.[0] as any) ?? null);
    setCheckinRows((chk.data ?? []) as any);
    setDates((chk.data ?? []).map((c: any) => c.checkin_date));
    setMeasurements((meas.data ?? []) as any);
    setLoading(false);
  }, [userId]);

  useEffect(() => { load(); }, [load]);

  const streak = useMemo(() => computeStreak(dates), [dates]);
  const adherence7 = useMemo(() => {
    const last7 = checkinRows.slice(0, 7);
    if (!last7.length) return 0;
    const done = last7.reduce((acc, c) => acc + [c.diet_done, c.workout_done, c.water_done].filter(Boolean).length, 0);
    return Math.round((done / (last7.length * 3)) * 100);
  }, [checkinRows]);

  const latest = measurements[0] ?? null;

  const importMeasurement = async () => {
    if (!latest?.weight_kg) return;
    setImporting(true);
    const { error } = await supabase.from("weight_logs").insert({
      user_id: userId,
      weight: latest.weight_kg,
      waist_cm: latest.waist_cm,
      hip_cm: latest.hip_cm,
      chest_cm: latest.chest_cm,
      arm_cm: latest.arm_cm,
      thigh_cm: latest.thigh_cm,
      logged_at: new Date(`${latest.measured_on}T12:00:00`).toISOString(),
      notes: "Importado do STH METHOD AI",
    });
    setImporting(false);
    if (error) { toast.error("Falha ao importar: " + error.message); return; }
    toast.success("Medida importada para o prontuário");
  };

  if (loading) {
    return <div className="rounded-lg border border-border/50 bg-muted/20 p-4 text-sm text-muted-foreground">Carregando dados do STH METHOD AI…</div>;
  }

  if (!hasProfile && !checkinRows.length && !measurements.length) {
    return (
      <div className="rounded-lg border border-border/50 bg-muted/20 p-4 text-sm text-muted-foreground">
        Este aluno não possui dados no STH METHOD AI.
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-primary/20 bg-primary/5 p-4 space-y-4">
      <div className="flex items-center justify-between gap-2 flex-wrap">
        <div className="flex items-center gap-2">
          <Sparkles className="h-4 w-4 text-primary" />
          <span className="text-sm font-semibold">STH METHOD AI</span>
          {plan && (
            <Badge variant={plan.status === "active" ? "default" : "secondary"} className="text-[10px] uppercase">
              {plan.plan} · {plan.status}
            </Badge>
          )}
        </div>
        <Button size="sm" variant="ghost" onClick={load} className="h-7 px-2">
          <RefreshCw className="h-3.5 w-3.5" />
        </Button>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        <div className="rounded-lg bg-background/60 p-3">
          <p className="text-[10px] uppercase tracking-wider text-muted-foreground flex items-center gap-1"><Flame className="h-3 w-3" /> Constância</p>
          <p className="font-bold text-sm mt-1">{streak} dia(s)</p>
        </div>
        <div className="rounded-lg bg-background/60 p-3">
          <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Adesão (7d)</p>
          <p className="font-bold text-sm mt-1">{adherence7}%</p>
        </div>
        <div className="rounded-lg bg-background/60 p-3">
          <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Check-ins</p>
          <p className="font-bold text-sm mt-1">{checkinRows.length}</p>
        </div>
      </div>

      {latest && (
        <div className="rounded-lg bg-background/60 p-3 space-y-2">
          <p className="text-[10px] uppercase tracking-wider text-muted-foreground flex items-center gap-1">
            <Ruler className="h-3 w-3" /> Última medida · {new Date(`${latest.measured_on}T12:00:00`).toLocaleDateString("pt-BR")}
          </p>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-sm">
            <div><span className="text-muted-foreground text-xs">Peso:</span> <span className="font-medium">{latest.weight_kg ?? "—"} kg</span></div>
            <div><span className="text-muted-foreground text-xs">Cintura:</span> <span className="font-medium">{latest.waist_cm ?? "—"} cm</span></div>
            <div><span className="text-muted-foreground text-xs">Quadril:</span> <span className="font-medium">{latest.hip_cm ?? "—"} cm</span></div>
            <div><span className="text-muted-foreground text-xs">Peito:</span> <span className="font-medium">{latest.chest_cm ?? "—"} cm</span></div>
            <div><span className="text-muted-foreground text-xs">Braço:</span> <span className="font-medium">{latest.arm_cm ?? "—"} cm</span></div>
            <div><span className="text-muted-foreground text-xs">Coxa:</span> <span className="font-medium">{latest.thigh_cm ?? "—"} cm</span></div>
          </div>
          {role === "admin" && latest.weight_kg && (
            <Button size="sm" variant="outline" onClick={importMeasurement} disabled={importing} className="mt-1">
              <Download className="h-3.5 w-3.5 mr-1.5" />
              {importing ? "Importando…" : "Importar para o prontuário"}
            </Button>
          )}
        </div>
      )}
    </div>
  );
}
