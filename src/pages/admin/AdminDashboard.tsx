import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import DashboardLayout from "@/components/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, UserCheck, AlertCircle, Clock, Bell, CheckCircle, ExternalLink, Check, CreditCard, DollarSign, Link2, ChevronDown, Search, Settings, Sparkles } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import AdminReminders from "@/components/admin/AdminReminders";
import { toast } from "sonner";
import { getPlanTier, getPlanTierClasses } from "@/lib/plan-colors";
import WhatsAppQuickLink from "@/components/admin/WhatsAppQuickLink";
import WhatsAppBulkSender from "@/components/shared/WhatsAppBulkSender";

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
      <Card className={cardClassName}>
        <CollapsibleTrigger asChild>
          <CardHeader className="pb-2 cursor-pointer hover:bg-muted/30 transition-colors rounded-t-lg">
            <CardTitle className="text-base font-display flex items-center gap-2">
              {icon}
              {title}
              {badge !== undefined && badge > 0 && (
                <Badge variant="default" className={`ml-2 ${badgeClassName || ""}`}>{badge}</Badge>
              )}
              <ChevronDown className={`w-4 h-4 ml-auto transition-transform ${open ? "rotate-180" : ""}`} />
            </CardTitle>
          </CardHeader>
        </CollapsibleTrigger>
        <CollapsibleContent>
          <CardContent className="space-y-2 pt-0">
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

  const totalStudents = profiles?.length || 0;
  const now = new Date();
  const activeCount = subscriptions?.filter((s) => s.status === "active" && new Date(s.end_date) > now).length || 0;
  const expiredCount = subscriptions?.filter((s) => s.status === "expired" || new Date(s.end_date) <= now).length || 0;
  const in7Days = new Date(now.getTime() + 7 * 86400000);
  const expiringCount = subscriptions?.filter((s) => {
    const end = new Date(s.end_date);
    return s.status === "active" && end > now && end <= in7Days;
  }).length || 0;

  const metrics = [
    { label: "Total de alunos", value: totalStudents, icon: Users, color: "text-primary" },
    { label: "Alunos ativos", value: activeCount, icon: UserCheck, color: "text-success" },
    { label: "Assinaturas vencidas", value: expiredCount, icon: AlertCircle, color: "text-destructive" },
    { label: "Vencendo em 7 dias", value: expiringCount, icon: Clock, color: "text-warning" },
  ];

  const incompleteCount = incompleteOnboardings?.length || 0;
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
      {/* Quick action */}
      <div className="flex justify-end mb-4">
        <Button onClick={() => navigate("/admin/students?create=true")} className="gap-2">
          <Users className="w-4 h-4" /> Criar Aluno
        </Button>
      </div>

      {/* Search */}
      <div className="relative mb-6">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          placeholder="Pesquisar aluno por nome ou email..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-9"
        />
      </div>

      {/* Search Results */}
      {filteredProfiles && filteredProfiles.length > 0 && (
        <Card className="mb-6">
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-display flex items-center gap-2">
              <Search className="w-4 h-4" /> Resultados ({filteredProfiles.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ScrollArea className="max-h-[300px]">
              <div className="space-y-2">
                {filteredProfiles.map((p: any) => (
                  <div key={p.id} className="flex items-center justify-between py-2 border-b border-border/50 last:border-0">
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium truncate">{p.full_name || "Sem nome"}</p>
                      <p className="text-xs text-muted-foreground truncate">{p.email}</p>
                    </div>
                    <div className="flex items-center gap-1 shrink-0">
                      <Button variant="ghost" size="sm" className="h-7 px-2 text-xs gap-1" onClick={() => navigate(`/admin/students?manage=${p.user_id}`)}>
                        <Settings className="w-3.5 h-3.5" /> Gerenciar
                      </Button>
                      <Button variant="ghost" size="sm" className="h-7 px-2 text-xs gap-1" onClick={() => navigate(`/admin/students?edit=${p.user_id}`)}>
                        <ExternalLink className="w-3.5 h-3.5" /> Ficha
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>
      )}
      {filteredProfiles && filteredProfiles.length === 0 && (
        <Card className="mb-6">
          <CardContent className="py-6 text-center text-sm text-muted-foreground">
            Nenhum aluno encontrado para "{searchTerm}"
          </CardContent>
        </Card>
      )}

      {/* Metrics */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4 mb-6">
        {metrics.map((m, i) => (
          <Card key={i} className="animate-fade-in" style={{ animationDelay: `${i * 80}ms` }}>
            <CardContent className="flex items-center gap-3 py-4 md:py-5">
              <div className="w-9 h-9 md:w-11 md:h-11 rounded-lg bg-secondary flex items-center justify-center shrink-0">
                <m.icon className={`w-4 h-4 md:w-5 md:h-5 ${m.color}`} />
              </div>
              <div className="min-w-0">
                <p className="text-xl md:text-2xl font-bold text-foreground font-body">{m.value}</p>
                <p className="text-xs md:text-sm text-muted-foreground font-body truncate">{m.label}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="space-y-4">
        {/* 1. Alunos Recentes (moved up) */}
        <RecentStudents profiles={profiles} subscriptions={subscriptions} navigate={navigate} queryClient={queryClient} />

        {/* 2. Cadastros Incompletos */}
        {incompleteCount > 0 && (
          <CollapsiblePanel
            title="Cadastros Incompletos"
            icon={<AlertCircle className="w-4 h-4 text-warning" />}
            badge={incompleteCount}
            badgeClassName="bg-warning text-warning-foreground"
            defaultOpen={true}
            cardClassName="border-warning/20 bg-warning/5"
          >
            {incompleteOnboardings!.map((p: any) => {
              const days = Math.floor((Date.now() - new Date(p.created_at).getTime()) / 86400000);
              const dayLabel = days === 0 ? "Hoje" : `${days}d atrás`;
              return (
                <div key={p.id} className="flex items-center justify-between py-2 border-b border-border/50 last:border-0">
                  <div className="flex items-center gap-3 min-w-0 flex-1">
                    <Clock className="w-4 h-4 text-warning shrink-0" />
                    <div className="min-w-0">
                      <p className="text-sm font-medium truncate">{p.full_name?.trim() || p.email || "Sem nome"}</p>
                      <p className="text-xs text-muted-foreground truncate">{p.email} • {dayLabel}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    <Badge variant="outline" className="text-xs text-warning border-warning/30">Incompleto</Badge>
                    <Button variant="ghost" size="sm" className="h-7 px-2 text-xs gap-1" onClick={() => navigate(`/admin/students?manage=${p.user_id}`)}>
                      <Settings className="w-3.5 h-3.5" /> Gerenciar
                    </Button>
                    <Button variant="ghost" size="sm" className="h-7 px-2 text-xs gap-1" onClick={() => navigate(`/admin/students?edit=${p.user_id}`)}>
                      <ExternalLink className="w-3.5 h-3.5" /> Ficha
                    </Button>
                  </div>
                </div>
              );
            })}
          </CollapsiblePanel>
        )}

        {/* 3. Lembretes Inteligentes */}
        <CollapsiblePanel
          title="Lembretes Inteligentes"
          icon={<Bell className="w-4 h-4 text-primary" />}
          defaultOpen={false}
        >
          <AdminReminders />
        </CollapsiblePanel>

        {/* 4. Pagamentos Pendentes */}
        <PendingPayments />

        {/* 5. Cadastros Completos (Alunos) */}
        {completedCount > 0 && (
          <CollapsiblePanel
            title="Cadastros Completos"
            icon={<CheckCircle className="w-4 h-4 text-primary" />}
            badge={completedCount}
            defaultOpen={false}
            cardClassName="border-primary/20 bg-primary/5"
          >
            {recentOnboardings!.map((s: any) => (
              <div key={s.id} className="flex items-center justify-between py-2 border-b border-border/50 last:border-0">
                <div className="flex items-center gap-3 min-w-0 flex-1">
                  <CheckCircle className="w-4 h-4 text-primary shrink-0" />
                  <div className="min-w-0">
                    <p className="text-sm font-medium truncate">{(s as any).profiles?.full_name || "Aluno"}</p>
                    <p className="text-xs text-muted-foreground truncate">
                      {(s as any).plans?.name} • {new Date(s.created_at).toLocaleDateString("pt-BR")}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  <Badge variant="outline" className="text-xs text-primary border-primary/30">Completo</Badge>
                  <Button variant="ghost" size="sm" className="h-7 px-2 text-xs gap-1" onClick={() => navigate(`/admin/students?edit=${s.user_id}`)}>
                    <ExternalLink className="w-3.5 h-3.5" /> Ficha
                  </Button>
                </div>
              </div>
            ))}
          </CollapsiblePanel>
        )}

        {/* WhatsApp em Massa */}
        <WhatsAppBulkSender />

        {/* WhatsApp Quick Link */}
        <WhatsAppQuickLink />
      </div>
    </DashboardLayout>
  );
};

const RecentStudents = ({ profiles, subscriptions, navigate, queryClient }: { profiles: any[] | undefined; subscriptions: any[] | undefined; navigate: any; queryClient: any }) => {
  const [open, setOpen] = useState(false);
  const now = Date.now();
  const recentProfiles = profiles?.filter((p) => {
    const days = Math.floor((now - new Date(p.created_at).getTime()) / 86400000);
    return days <= 3 && !p.admin_confirmed;
  }) || [];

  const subMap = new Map((subscriptions || []).map((s: any) => [s.user_id, s]));

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
      <Card>
        <CollapsibleTrigger asChild>
          <CardHeader className="cursor-pointer hover:bg-muted/30 transition-colors rounded-t-lg">
            <CardTitle className="font-display flex items-center gap-2">
              Alunos Recentes
              <Badge variant="default" className="ml-2">{recentProfiles.length}</Badge>
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
                    <div key={p.id} className="py-3 border-b border-border/50 last:border-0">
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-center gap-3 min-w-0 flex-1">
                          <div className={`w-9 h-9 rounded-full flex items-center justify-center shrink-0 ${color.bg}`}>
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

const PendingPayments = () => {
  const navigate = useNavigate();
  const { data: pendingPayments } = useQuery({
    queryKey: ["admin-pending-payments"],
    queryFn: async () => {
      const sevenDaysAgo = new Date(Date.now() - 7 * 86400000).toISOString();
      const { data } = await supabase
        .from("payments")
        .select("*, plans(name, duration_days)")
        .eq("status", "pending")
        .gte("created_at", sevenDaysAgo)
        .order("created_at", { ascending: false });
      if (!data || data.length === 0) return [];
      const userIds = data.map((p: any) => p.user_id);
      const { data: activeSubs } = await supabase
        .from("subscriptions")
        .select("user_id, status, end_date")
        .in("user_id", userIds)
        .eq("status", "active");
      const activeUserIds = new Set(
        (activeSubs || [])
          .filter((s: any) => new Date(s.end_date) > new Date())
          .map((s: any) => s.user_id)
      );
      const filteredData = data.filter((p: any) => !activeUserIds.has(p.user_id));
      if (filteredData.length === 0) return [];
      const filteredUserIds = filteredData.map((p: any) => p.user_id);
      const { data: profilesData } = await supabase
        .from("profiles")
        .select("user_id, full_name, email")
        .in("user_id", filteredUserIds);
      const profileMap = new Map((profilesData || []).map((p: any) => [p.user_id, p]));
      return filteredData.map((p: any) => ({ ...p, profile: profileMap.get(p.user_id) }));
    },
  });

  if (!pendingPayments || pendingPayments.length === 0) return null;

  return (
    <CollapsiblePanel
      title="Pagamentos Pendentes"
      icon={<DollarSign className="w-4 h-4 text-warning" />}
      badge={pendingPayments.length}
      badgeClassName="bg-warning text-warning-foreground"
      defaultOpen={true}
      cardClassName="border-warning/20 bg-warning/5"
    >
      {pendingPayments.map((p: any) => {
        const tierClasses = getPlanTierClasses(getPlanTier(p.plans?.duration_days));
        return (
          <div key={p.id} className="py-3 border-b border-border/50 last:border-0">
            <div className="flex items-start justify-between gap-2">
              <div className="flex items-center gap-3 min-w-0 flex-1">
                <CreditCard className="w-4 h-4 text-warning shrink-0" />
                <div className="min-w-0">
                  <p className="text-sm font-medium truncate">{p.profile?.full_name || "Aluno"}</p>
                  <p className="text-xs text-muted-foreground truncate">
                    R$ {Number(p.amount).toFixed(2)} • {p.method === "manual" ? "Manual" : p.method}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-1 shrink-0">
                {p.plans?.name && (
                  <Badge variant="outline" className={`text-[10px] font-medium ${tierClasses.badge}`}>
                    {p.plans.name}
                  </Badge>
                )}
                <Badge
                  variant="outline"
                  className="text-[10px] border-warning/30 text-warning cursor-pointer hover:bg-warning/10 transition-colors"
                  onClick={() => navigate(`/admin/students?sub=${p.user_id}`)}
                >
                  Pendente →
                </Badge>
              </div>
            </div>
          </div>
        );
      })}
    </CollapsiblePanel>
  );
};

export default AdminDashboard;
