import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Loader2, TrendingUp, Users, Flame, Sparkles, AlertTriangle } from "lucide-react";

interface Row {
  user_id: string;
  plan: string;
  status: string;
  amount: number | null;
  expires_at: string | null;
  created_at: string;
}

export default function AdminAiMetrics() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [subs, setSubs] = useState<Row[]>([]);
  const [profiles, setProfiles] = useState<{ user_id: string; full_name: string | null; phase1_complete: boolean }[]>([]);
  const [checkins, setCheckins] = useState<{ user_id: string; checkin_date: string }[]>([]);
  const [offers, setOffers] = useState<{ id: string; kind: string; status: string; discount_pct: number }[]>([]);

  useEffect(() => {
    (async () => {
      const [{ data: s }, { data: p }, { data: c }, { data: o }] = await Promise.all([
        supabase.from("ai_app_subscriptions").select("user_id, plan, status, amount, expires_at, created_at"),
        supabase.from("ai_app_profiles").select("user_id, full_name, phase1_complete"),
        supabase.from("ai_app_checkins").select("user_id, checkin_date").order("checkin_date", { ascending: false }).limit(3000),
        supabase.from("ai_app_offers").select("id, kind, status, discount_pct"),
      ]);
      setSubs((s ?? []) as Row[]);
      setProfiles((p ?? []) as any);
      setCheckins((c ?? []) as any);
      setOffers((o ?? []) as any);
      setLoading(false);
    })();
  }, []);

  const m = useMemo(() => {
    const now = Date.now();
    const active = subs.filter((s) => s.status === "active" && s.expires_at && new Date(s.expires_at).getTime() > now);
    const expired = subs.filter((s) => s.status === "expired" || (s.status === "active" && s.expires_at && new Date(s.expires_at).getTime() <= now));
    const paid = subs.filter((s) => s.status === "active" || s.status === "expired");
    const revenue = paid.reduce((sum, s) => sum + Number(s.amount ?? 0), 0);
    const churn = paid.length ? Math.round((expired.length / paid.length) * 100) : 0;
    const activeUsers = new Set(active.map((s) => s.user_id));
    const last7 = new Set(
      checkins.filter((c) => (now - new Date(`${c.checkin_date}T00:00:00`).getTime()) / 86_400_000 < 7).map((c) => c.user_id),
    );
    const engaged = [...activeUsers].filter((u) => last7.has(u)).length;
    const atRisk = active.filter((s) => !last7.has(s.user_id));
    const expiring = active.filter(
      (s) => (new Date(s.expires_at!).getTime() - now) / 86_400_000 <= 7,
    );
    const byPlan = ["mensal", "trimestral", "semestral", "anual"].map((plan) => ({
      plan,
      count: active.filter((s) => s.plan === plan).length,
    }));
    return {
      active: active.length,
      churn,
      revenue,
      engaged,
      atRisk,
      expiring,
      byPlan,
      conversion: profiles.length ? Math.round((activeUsers.size / profiles.length) * 100) : 0,
      offersUsed: offers.filter((o) => o.status === "used").length,
      offersActive: offers.filter((o) => o.status === "active").length,
    };
  }, [subs, profiles, checkins, offers]);

  const nameOf = (id: string) => profiles.find((p) => p.user_id === id)?.full_name ?? id.slice(0, 8);
  const fmt = (v: number) => v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

  if (loading) {
    return (
      <div className="grid min-h-screen place-items-center bg-background">
        <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const cards = [
    { label: "Assinaturas ativas", value: String(m.active), icon: Users },
    { label: "Receita acumulada", value: fmt(m.revenue), icon: TrendingUp },
    { label: "Churn", value: `${m.churn}%`, icon: AlertTriangle },
    { label: "Engajados (7d)", value: `${m.engaged}/${m.active}`, icon: Flame },
    { label: "Conversão de perfis", value: `${m.conversion}%`, icon: Sparkles },
    { label: "Ofertas usadas", value: `${m.offersUsed} (${m.offersActive} ativas)`, icon: Sparkles },
  ];

  return (
    <div className="min-h-screen bg-background px-4 py-6">
      <div className="mx-auto max-w-5xl">
        <Button variant="ghost" size="sm" onClick={() => navigate("/admin")} className="mb-4 -ml-2">
          <ArrowLeft className="mr-2 h-4 w-4" /> Voltar
        </Button>
        <h1 className="text-2xl font-semibold tracking-tight">STH METHOD AI · Métricas</h1>
        <p className="mt-1 text-sm text-muted-foreground">Retenção, churn e desempenho das ofertas inteligentes.</p>

        <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {cards.map((c) => (
            <Card key={c.label} className="p-4">
              <div className="flex items-center gap-2 text-muted-foreground">
                <c.icon className="h-4 w-4" />
                <span className="text-xs">{c.label}</span>
              </div>
              <p className="mt-2 text-2xl font-semibold tracking-tight">{c.value}</p>
            </Card>
          ))}
        </div>

        <div className="mt-4 grid gap-4 lg:grid-cols-2">
          <Card className="p-5">
            <h2 className="text-base font-semibold">Distribuição por plano</h2>
            <ul className="mt-3 space-y-2 text-sm">
              {m.byPlan.map((p) => (
                <li key={p.plan} className="flex items-center justify-between">
                  <span className="capitalize text-muted-foreground">{p.plan}</span>
                  <Badge variant="secondary">{p.count}</Badge>
                </li>
              ))}
            </ul>
          </Card>

          <Card className="p-5">
            <h2 className="text-base font-semibold">Risco de churn (sem check-in há 7 dias)</h2>
            {m.atRisk.length === 0 ? (
              <p className="mt-3 text-sm text-muted-foreground">Nenhum assinante em risco.</p>
            ) : (
              <ul className="mt-3 divide-y divide-border/40 text-sm">
                {m.atRisk.slice(0, 10).map((s) => (
                  <li key={s.user_id} className="flex items-center justify-between py-2">
                    <span>{nameOf(s.user_id)}</span>
                    <Badge variant="outline" className="capitalize">{s.plan}</Badge>
                  </li>
                ))}
              </ul>
            )}
          </Card>
        </div>

        <Card className="mt-4 p-5">
          <h2 className="text-base font-semibold">Vencendo em até 7 dias</h2>
          {m.expiring.length === 0 ? (
            <p className="mt-3 text-sm text-muted-foreground">Nenhuma assinatura vencendo nesta semana.</p>
          ) : (
            <ul className="mt-3 divide-y divide-border/40 text-sm">
              {m.expiring.map((s) => (
                <li key={s.user_id + s.created_at} className="flex items-center justify-between py-2">
                  <span>{nameOf(s.user_id)}</span>
                  <span className="text-muted-foreground">
                    {s.expires_at ? new Date(s.expires_at).toLocaleDateString("pt-BR") : "—"}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>
    </div>
  );
}
