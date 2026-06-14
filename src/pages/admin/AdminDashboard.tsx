import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import DashboardLayout from "@/components/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, UserCheck, AlertCircle, Clock, Bell, ExternalLink, Check, CreditCard, Link2, ChevronDown, Search, Settings, Sparkles, UserPlus, Radio, UserX } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { getPlanTier, getPlanTierClasses } from "@/lib/plan-colors";

const getEffectiveSubscriptionMap = (subscriptions: any[] | undefined) => {
  const map = new Map<string, any>();

  (subscriptions || []).forEach((subscription: any) => {
    const current = map.get(subscription.user_id);
    if (!current) {
      map.set(subscription.user_id, subscription);
      return;
    }

    const currentIsActive = current.status === "active" && new Date(current.end_date) > new Date();
    const nextIsActive = subscription.status === "active" && new Date(subscription.end_date) > new Date();

    if (nextIsActive && !currentIsActive) {
      map.set(subscription.user_id, subscription);
      return;
    }

    if (nextIsActive === currentIsActive) {
      const currentEnd = new Date(current.end_date).getTime();
      const nextEnd = new Date(subscription.end_date).getTime();

      if (nextEnd > currentEnd) {
        map.set(subscription.user_id, subscription);
      }
    }
  });

  return map;
};

const copyRenewLink = (userId: string) => {
  const url = `${window.location.origin}/dashboard/renew?uid=${userId}`;
  navigator.clipboard.writeText(url);
  toast.success("Link de renovação copiado!");
};

interface CollapsiblePanelProps {
  title: string;
  icon: React.ReactNode;
  badge?: number;
  badgeClassName?: string;
  defaultOpen?: boolean;
  children: React.ReactNode;
  cardClassName?: string;
}

const CollapsiblePanel = ({ title, icon, badge, badgeClassName, defaultOpen = false, children, cardClassName }: CollapsiblePanelProps) => {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <Collapsible open={open} onOpenChange={setOpen}>
      <Card className={`border-border/40 shadow-none bg-card/40 backdrop-blur-xl rounded-2xl ${cardClassName || ""}`}>
        <CollapsibleTrigger asChild>
          <CardHeader className="pb-3 pt-5 px-5 cursor-pointer hover:bg-muted/20 transition-colors rounded-t-2xl">
            <CardTitle className="text-[15px] font-display font-medium tracking-tight flex items-center gap-2.5 text-foreground/90">
              <span className="text-foreground/50">{icon}</span>
              {title}
              {badge !== undefined && badge > 0 && (
                <Badge variant="secondary" className={`ml-1.5 h-5 px-2 text-[10px] font-medium rounded-full bg-foreground/10 text-foreground/80 border-0 ${badgeClassName || ""}`}>{badge}</Badge>
              )}
              <ChevronDown className={`w-3.5 h-3.5 ml-auto text-muted-foreground/60 transition-transform ${open ? "rotate-180" : ""}`} />
            </CardTitle>
          </CardHeader>
        </CollapsibleTrigger>
        <CollapsibleContent>
          <CardContent className="space-y-1 pt-0 px-5 pb-5">
            {children}
          </CardContent>
        </CollapsibleContent>
      </Card>
    </Collapsible>
  );
};

const AdminDashboard = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const { data: profiles } = useQuery({
    queryKey: ["admin-profiles"],
    queryFn: async () => {
      const { data } = await supabase.from("profiles").select("id, user_id, full_name, email, onboarding_complete, admin_confirmed, created_at").order("created_at", { ascending: false });
      return data || [];
    },
  });

  const { data: subscriptions } = useQuery({
    queryKey: ["admin-subscriptions"],
    queryFn: async () => {
      const { data } = await supabase.from("subscriptions").select("*, plans(*)");
      return data || [];
    },
  });

  // Online users (last 5 minutes activity in access_logs, ainda sem logout)
  const { data: onlineData } = useQuery({
    queryKey: ["admin-online-students"],
    queryFn: async () => {
      const fiveMinAgo = new Date(Date.now() - 5 * 60 * 1000).toISOString();
      const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
      const { data: logs } = await supabase
        .from("access_logs")
        .select("user_id, logged_in_at, logged_out_at, duration_seconds")
        .gte("logged_in_at", oneDayAgo)
        .not("user_id", "is", null);
      const activeLogs = (logs || []).filter((l: any) =>
        l.logged_in_at >= fiveMinAgo || (!l.logged_out_at && (!l.duration_seconds || l.duration_seconds <= 0))
      );
      const ids = Array.from(new Set(activeLogs.map((l: any) => l.user_id)));
      if (ids.length === 0) return { ids: [], names: [] as { user_id: string; full_name: string; role: string }[] };
      const [rolesRes, profsRes] = await Promise.all([
        supabase.from("user_roles").select("user_id, role").in("user_id", ids),
        supabase.from("profiles").select("user_id, full_name").in("user_id", ids),
      ]);
      const roleMap = new Map((rolesRes.data || []).map((r: any) => [r.user_id, r.role]));
      const names = (profsRes.data || []).map((p: any) => ({
        ...p,
        role: roleMap.get(p.user_id) || "student",
      }));
      return { ids, names };
    },
    refetchInterval: 30_000,
  });

  const { data: recentOnboardings } = useQuery({
    queryKey: ["admin-recent-onboardings"],
    queryFn: async () => {
      const sevenDaysAgo = new Date(Date.now() - 7 * 86400000).toISOString();
      const { data: subs } = await supabase
        .from("subscriptions")
        .select("*, plans(name)")
        .gte("created_at", sevenDaysAgo)
        .eq("status", "active")
        .order("created_at", { ascending: false });
      if (!subs || subs.length === 0) return [];
      const userIds = subs.map((s: any) => s.user_id);
      const { data: profilesData } = await supabase
        .from("profiles")
        .select("user_id, full_name, email, onboarding_complete")
        .in("user_id", userIds);
      const profileMap = new Map((profilesData || []).map((p: any) => [p.user_id, p]));
      return subs
        .map((s: any) => ({ ...s, profiles: profileMap.get(s.user_id) }))
        .filter((s: any) => s.profiles?.onboarding_complete);
    },
  });

  const { data: incompleteOnboardings } = useQuery({
    queryKey: ["admin-incomplete-onboardings"],
    queryFn: async () => {
      const { data } = await supabase
        .from("profiles")
        .select("id, user_id, full_name, email, onboarding_complete, created_at")
        .eq("onboarding_complete", false)
        .order("created_at", { ascending: false });
      return data || [];
    },
  });

  const { data: freeLeads } = useQuery({
    queryKey: ["admin-free-leads"],
    queryFn: async () => {
      const { data } = await supabase
        .from("free_leads")
        .select("*")
        .eq("converted", false)
        .order("created_at", { ascending: false })
        .limit(50);
      return data || [];
    },
  });

  const effectiveSubscriptionMap = useMemo(() => getEffectiveSubscriptionMap(subscriptions), [subscriptions]);

  // Set of user_ids with active subscriptions (status active + end_date in future)
  const activeSubUserIds = useMemo(() => {
    const now = new Date();
    return new Set(
      Array.from(effectiveSubscriptionMap.values())
        .filter((s: any) => s.status === "active" && new Date(s.end_date) > now)
        .map((s: any) => s.user_id)
    );
  }, [effectiveSubscriptionMap]);

  // Users who completed onboarding but have no active subscription
  const pendingPaymentProfiles = useMemo(() => {
    if (!profiles || !subscriptions) return [];
    return profiles.filter((p: any) => p.onboarding_complete && !activeSubUserIds.has(p.user_id));
  }, [profiles, subscriptions, activeSubUserIds]);

  const totalStudents = profiles?.length || 0;
  const now = new Date();
  const effectiveSubscriptions = Array.from(effectiveSubscriptionMap.values());
  const activeCount = effectiveSubscriptions.filter((s) => s.status === "active" && new Date(s.end_date) > now).length;
  const expiredCount = effectiveSubscriptions.filter((s) => s.status === "expired" || new Date(s.end_date) <= now).length;
  const in7Days = new Date(now.getTime() + 7 * 86400000);
  const expiringCount = effectiveSubscriptions.filter((s) => {
    const end = new Date(s.end_date);
    return s.status === "active" && end > now && end <= in7Days;
  }).length;
  const onlineCount = onlineData?.ids.length || 0;
  const inactiveCount = Math.max(0, totalStudents - activeCount);

  const metrics = [
    { label: "Total de alunos", value: totalStudents, icon: Users },
    { label: "Alunos ativos", value: activeCount, icon: UserCheck },
    { label: "Vencidas", value: expiredCount, icon: AlertCircle },
    { label: "Vencendo em 7 dias", value: expiringCount, icon: Clock },
  ];

  // Filter incomplete onboardings to exclude users with active subscriptions
  const filteredIncompleteOnboardings = useMemo(() => {
    if (!incompleteOnboardings) return [];
    return incompleteOnboardings.filter((p: any) => !activeSubUserIds.has(p.user_id));
  }, [incompleteOnboardings, activeSubUserIds]);

  const incompleteCount = filteredIncompleteOnboardings.length;
  const completedCount = recentOnboardings?.length || 0;

  const [searchTerm, setSearchTerm] = useState("");

  const filteredProfiles = useMemo(() => {
    if (!searchTerm.trim() || !profiles) return null;
    const term = searchTerm.toLowerCase();
    return profiles.filter((p: any) =>
      p.full_name?.toLowerCase().includes(term) || p.email?.toLowerCase().includes(term)
    );
  }, [searchTerm, profiles]);

  return (
    <DashboardLayout role="admin" title="Dashboard" subtitle="Visão geral da consultoria.">
      {/* Pesquisa rápida — destaque no topo */}
      <section className="mb-6">
        <div className="rounded-[28px] border border-border/50 bg-card/60 p-4 sm:p-5 backdrop-blur-3xl">
          <div className="flex items-center gap-2 mb-3">
            <Search className="w-4 h-4 text-foreground/70" />
            <p className="text-[11px] uppercase tracking-[0.18em] text-muted-foreground">Pesquisar aluno</p>
          </div>
          <div className="flex flex-col gap-2 sm:flex-row">
            <div className="relative flex-1">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground/70" />
              <Input
                autoFocus
                placeholder="Digite o nome ou e-mail do aluno..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="h-14 text-base rounded-2xl border-border/40 bg-background/80 pl-12 placeholder:text-muted-foreground/60 focus-visible:ring-2 focus-visible:ring-foreground/30"
              />
            </div>
            <Button onClick={() => navigate("/admin/students")} variant="outline" className="h-14 rounded-2xl gap-2 border-border/40 px-5">
              <Users className="w-4 h-4" /> Ver todos
            </Button>
          </div>
          {filteredProfiles && (
            <div className="mt-4 rounded-2xl border border-border/40 bg-background/60">
              {filteredProfiles.length > 0 ? (
                <ScrollArea className="max-h-[320px]">
                  <div className="p-2">
                    {filteredProfiles.slice(0, 30).map((p: any) => (
                      <div key={p.id} className="flex items-center justify-between gap-2 px-3 py-2 rounded-xl hover:bg-muted/40">
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-medium truncate">{p.full_name || "Sem nome"}</p>
                          <p className="text-xs text-muted-foreground truncate">{p.email}</p>
                        </div>
                        <div className="flex items-center gap-1 shrink-0">
                          <Button variant="ghost" size="sm" className="h-8 px-2 text-xs gap-1" onClick={() => navigate(`/admin/students?manage=${p.user_id}`)}>
                            <Settings className="w-3.5 h-3.5" /> Gerenciar
                          </Button>
                          <Button variant="ghost" size="sm" className="h-8 px-2 text-xs gap-1" onClick={() => navigate(`/admin/students?edit=${p.user_id}`)}>
                            <ExternalLink className="w-3.5 h-3.5" /> Ficha
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              ) : (
                <div className="py-6 text-center text-sm text-muted-foreground">
                  Nenhum aluno encontrado para "{searchTerm}"
                </div>
              )}
            </div>
          )}
        </div>
      </section>

      <section className="mb-8 rounded-[28px] border border-border/50 bg-card/40 px-4 py-4 backdrop-blur-3xl sm:px-5 sm:py-5">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div className="space-y-2">
            <p className="text-[11px] uppercase tracking-[0.18em] text-muted-foreground">Operação</p>
            <div className="space-y-1">
              <h1 className="text-[30px] leading-none text-foreground">Dashboard administrativo</h1>
              <p className="max-w-2xl text-sm text-muted-foreground">
                Visão consolidada de alunos, ativações e sinais de acompanhamento em tempo real.
              </p>
            </div>
          </div>

          <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
            <div className="relative min-w-0 flex-1 sm:min-w-[280px]">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground/60" />
              <Input
                placeholder="Pesquisar aluno..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="h-11 rounded-2xl border-border/40 bg-background/70 pl-10 placeholder:text-muted-foreground/50 focus-visible:ring-1 focus-visible:ring-foreground/20"
              />
            </div>
            <Button onClick={() => navigate("/admin/students?create=true")} className="premium-btn h-11 rounded-2xl gap-2 bg-foreground text-background hover:bg-foreground/90">
              <UserPlus className="w-4 h-4" /> Novo aluno
            </Button>
            <Button variant="outline" onClick={() => navigate("/admin/students")} className="h-11 rounded-2xl gap-2 border-border/40">
              <Search className="w-4 h-4" /> Pesquisar aluno
            </Button>
          </div>
        </div>
      </section>

      {/* Search + quick action */}
      <div className="grid grid-cols-2 gap-2.5 mb-8 lg:grid-cols-4">
        {metrics.map((m, i) => (
          <Card key={i} className="premium-card animate-fade-in border-border/40 bg-card/55 backdrop-blur-2xl" style={{ animationDelay: `${i * 60}ms` }}>
            <CardContent className="px-4 py-5">
              <div className="mb-4 flex items-center justify-between">
                <div className="flex h-9 w-9 items-center justify-center rounded-2xl bg-muted/60">
                  <m.icon className="w-4 h-4 text-foreground/75" />
                </div>
                <span className="text-[10px] uppercase tracking-[0.16em] text-muted-foreground">Live</span>
              </div>
              <p className="text-[30px] leading-none font-display font-semibold tracking-tight text-foreground">{m.value}</p>
              <p className="mt-2 text-[11px] font-body tracking-wide text-muted-foreground">{m.label}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Atividade ao vivo */}
      <Card className="premium-card mb-6 border-border/40 bg-card/55 backdrop-blur-2xl">
        <CardHeader className="pb-3 pt-5 px-5">
          <CardTitle className="text-[15px] font-display font-medium tracking-tight flex items-center gap-2.5 text-foreground/90">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-500 opacity-60"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </span>
            Atividade ao vivo
            <span className="ml-auto text-[10px] text-muted-foreground/50 font-normal tracking-wide">atualiza a cada 30s</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="px-5 pb-5">
          <div className="grid grid-cols-3 gap-px overflow-hidden rounded-[20px] border border-border/40 bg-border/30 mb-4">
            <div className="bg-background/70 p-4 text-center">
              <p className="text-[24px] leading-none font-display font-semibold tracking-tight">{onlineCount}</p>
              <p className="text-[10px] text-muted-foreground/70 mt-1.5 tracking-wide uppercase">Online</p>
            </div>
            <div className="bg-background/70 p-4 text-center">
              <p className="text-[24px] leading-none font-display font-semibold tracking-tight">{activeCount}</p>
              <p className="text-[10px] text-muted-foreground/70 mt-1.5 tracking-wide uppercase">Ativos</p>
            </div>
            <div className="bg-background/70 p-4 text-center">
              <p className="text-[24px] leading-none font-display font-semibold tracking-tight text-muted-foreground/80">{inactiveCount}</p>
              <p className="text-[10px] text-muted-foreground/70 mt-1.5 tracking-wide uppercase">Inativos</p>
            </div>
          </div>
          {onlineCount > 0 && (
            <div className="flex flex-wrap gap-1.5 pt-3 border-t border-border/40">
              {onlineData!.names.slice(0, 12).map((p: any) => (
                <button
                  key={p.user_id}
                  onClick={() => navigate(`/admin/students?manage=${p.user_id}`)}
                  className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-muted/40 hover:bg-muted/70 text-[11px] font-medium transition-colors"
                >
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                  {p.full_name?.split(" ")[0] || "Aluno"}
                </button>
              ))}
              {onlineCount > 12 && (
                <span className="px-2.5 py-1 rounded-full bg-muted/40 text-[11px] text-muted-foreground/70">+{onlineCount - 12}</span>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      <div className="space-y-3">
        {/* 1. Alunos Recentes (moved up) */}
        <RecentStudents profiles={profiles} subscriptions={subscriptions} navigate={navigate} queryClient={queryClient} activeSubUserIds={activeSubUserIds} />

        {/* 2. Leads Free */}
        {(freeLeads?.length || 0) > 0 && (
          <CollapsiblePanel
            title="Leads Free"
            icon={<Sparkles className="w-4 h-4 text-emerald-500" />}
            badge={freeLeads?.length}
            badgeClassName="bg-emerald-500 text-white"
            defaultOpen={true}
            cardClassName="border-emerald-500/20 bg-emerald-500/5"
          >
            {freeLeads!.map((lead: any) => {
              const days = Math.floor((Date.now() - new Date(lead.created_at).getTime()) / 86400000);
              const dayLabel = days === 0 ? "Hoje" : `${days}d atrás`;
              const objLabel = lead.objective === "emagrecimento" ? "Emagrecer" : lead.objective === "hipertrofia" ? "Hipertrofia" : lead.objective === "saude" ? "Saúde" : "";
              return (
                <div key={lead.id} className="flex flex-col gap-1 py-2 border-b border-border/50 last:border-0">
                  <div className="flex items-center gap-2 min-w-0">
                    <Sparkles className="w-4 h-4 text-emerald-500 shrink-0" />
                    <p className="text-sm font-medium truncate flex-1">{lead.full_name || lead.email}</p>
                    <Badge variant="outline" className="text-[10px] text-emerald-600 border-emerald-500/30 shrink-0">Free</Badge>
                  </div>
                  <div className="flex items-center justify-between pl-6">
                    <p className="text-xs text-muted-foreground truncate">
                      {lead.phone} • {objLabel} • {lead.weight}kg • {dayLabel}
                    </p>
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-7 px-2 text-xs gap-1 text-emerald-600 border-emerald-500/30 hover:bg-emerald-500/10 shrink-0"
                      onClick={() => {
                        const phone = lead.phone.replace(/\D/g, "");
                        const msg = encodeURIComponent(`Olá! Vi que você fez a análise gratuita no STH Method. Posso te ajudar a desbloquear seu plano completo?`);
                        window.open(`https://wa.me/55${phone}?text=${msg}`, "_blank");
                      }}
                    >
                      <ExternalLink className="w-3 h-3" /> WhatsApp
                    </Button>
                  </div>
                  <Button
                    size="sm"
                    className="mt-2 ml-auto h-7 px-2 text-[11px] gap-1 bg-emerald-600 hover:bg-emerald-700 text-white"
                    onClick={async () => {
                      const { error } = await supabase.from("free_leads").update({ converted: true }).eq("id", lead.id);
                      if (error) { toast.error("Erro ao marcar como atendido"); return; }
                      toast.success("Lead atendido");
                      queryClient.invalidateQueries({ queryKey: ["admin-free-leads"] });
                    }}
                  >
                    <Check className="w-3.5 h-3.5" /> Atendido
                  </Button>
                </div>
              );
            })}
          </CollapsiblePanel>
        )}

      </div>
    </DashboardLayout>
  );
};

const RecentStudents = ({ profiles, subscriptions, navigate, queryClient, activeSubUserIds }: { profiles: any[] | undefined; subscriptions: any[] | undefined; navigate: any; queryClient: any; activeSubUserIds: Set<string> }) => {
  const [open, setOpen] = useState(false);
  const now = Date.now();
  const recentProfiles = profiles?.filter((p) => {
    const days = Math.floor((now - new Date(p.created_at).getTime()) / 86400000);
    return days <= 3 && !p.admin_confirmed && !activeSubUserIds.has(p.user_id);
  }) || [];

  const subMap = getEffectiveSubscriptionMap(subscriptions);

  const { data: recentPayments } = useQuery({
    queryKey: ["admin-recent-payments-for-students"],
    queryFn: async () => {
      const { data } = await supabase
        .from("payments")
        .select("user_id, plan_id, status, method, plans(name, duration_days)")
        .order("created_at", { ascending: false });
      return data || [];
    },
  });

  const paymentMap = new Map<string, any>();
  (recentPayments || []).forEach((p: any) => {
    if (!paymentMap.has(p.user_id)) paymentMap.set(p.user_id, p);
  });

  const confirmMutation = useMutation({
    mutationFn: async (profileId: string) => {
      const { error } = await supabase.from("profiles").update({ admin_confirmed: true }).eq("id", profileId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-profiles"] });
      toast.success("Aluno confirmado!");
    },
  });

  const getDayColor = (createdAt: string) => {
    const days = Math.floor((now - new Date(createdAt).getTime()) / 86400000);
    if (days <= 0) return { bg: "bg-green-100", text: "text-green-700", border: "border-green-300", label: "Hoje" };
    if (days === 1) return { bg: "bg-green-100", text: "text-green-700", border: "border-green-300", label: "1 dia" };
    if (days === 2) return { bg: "bg-yellow-100", text: "text-yellow-700", border: "border-yellow-300", label: "2 dias" };
    return { bg: "bg-red-100", text: "text-red-700", border: "border-red-300", label: "3 dias" };
  };

  if (recentProfiles.length === 0) return null;

  return (
    <Collapsible open={open} onOpenChange={setOpen}>
      <Card className="premium-card border-border/40 bg-card/55 backdrop-blur-2xl">
        <CollapsibleTrigger asChild>
          <CardHeader className="cursor-pointer rounded-t-2xl transition-colors hover:bg-muted/20">
            <CardTitle className="font-display flex items-center gap-2 text-[15px] tracking-tight">
              Alunos Recentes
              <Badge variant="secondary" className="ml-2 bg-foreground/10 text-foreground">{recentProfiles.length}</Badge>
              <ChevronDown className={`w-4 h-4 ml-auto transition-transform ${open ? "rotate-180" : ""}`} />
            </CardTitle>
          </CardHeader>
        </CollapsibleTrigger>
        <CollapsibleContent>
          <CardContent>
            <ScrollArea className="max-h-[520px]">
              <div className="space-y-3">
                {recentProfiles.slice(0, 10).map((p) => {
                  const color = getDayColor(p.created_at);
                  const sub = subMap.get(p.user_id);
                  const payment = paymentMap.get(p.user_id);
                  const planName = sub?.plans?.name || payment?.plans?.name || null;
                  const durationDays = sub?.plans?.duration_days || payment?.plans?.duration_days || null;
                  const tierClasses = getPlanTierClasses(getPlanTier(durationDays));
                  const paymentStatus = !sub && payment ? payment.status : null;

                  return (
                    <div key={p.id} className="rounded-[22px] border border-border/40 bg-background/40 px-3 py-3 last:border-border/40">
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-center gap-3 min-w-0 flex-1">
                          <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${color.bg}`}>
                            <span className={`text-xs font-bold ${color.text}`}>
                              {p.full_name?.split(" ").map((n: string) => n[0]).join("").slice(0, 2).toUpperCase() || "?"}
                            </span>
                          </div>
                          <div className="min-w-0">
                            <p className={`text-sm font-medium font-body ${color.text} truncate`}>{p.full_name || "Sem nome"}</p>
                            <p className="text-xs text-muted-foreground font-body truncate">{p.email}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-1 shrink-0">
                          <Badge variant="outline" className={`text-[10px] ${color.border} ${color.text}`}>{color.label}</Badge>
                          <Button variant="ghost" size="sm" className="h-7 w-7 p-0" onClick={() => navigate(`/admin/students?edit=${p.user_id}`)}>
                            <ExternalLink className="w-3.5 h-3.5" />
                          </Button>
                          <Button variant="ghost" size="sm" className="h-7 w-7 p-0" title="Copiar link de renovação" onClick={() => copyRenewLink(p.user_id)}>
                            <Link2 className="w-3.5 h-3.5" />
                          </Button>
                          <Button variant="outline" size="sm" className="h-7 w-7 p-0 text-green-600 border-green-300 hover:bg-green-50" onClick={() => confirmMutation.mutate(p.id)} disabled={confirmMutation.isPending} title="Confirmar registro">
                            <Check className="w-3.5 h-3.5" />
                          </Button>
                        </div>
                      </div>
                      {(planName || paymentStatus === "pending") && (
                        <div className="flex items-center gap-2 mt-2 ml-12">
                          {planName && (
                            <Badge variant="outline" className={`text-[10px] font-medium ${tierClasses.badge}`}>
                              {planName}
                            </Badge>
                          )}
                          {paymentStatus === "pending" && (
                            <Badge
                              variant="outline"
                              className="text-[10px] border-warning/30 text-warning cursor-pointer hover:bg-warning/10 transition-colors"
                              onClick={() => navigate(`/admin/students?sub=${p.user_id}`)}
                            >
                              Pgto pendente →
                            </Badge>
                          )}
                        </div>
                      )}
                      <Button
                        size="sm"
                        className="mt-3 ml-auto flex h-8 rounded-xl px-3 text-[11px] gap-1 bg-foreground text-background hover:bg-foreground/90"
                        onClick={() => confirmMutation.mutate(p.id)}
                        disabled={confirmMutation.isPending}
                      >
                        <Check className="w-3.5 h-3.5" /> Atendido
                      </Button>
                    </div>
                  );
                })}
              </div>
            </ScrollArea>
          </CardContent>
        </CollapsibleContent>
      </Card>
    </Collapsible>
  );
};


export default AdminDashboard;
