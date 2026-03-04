import { useNavigate } from "react-router-dom";
import DashboardLayout from "@/components/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, UserCheck, AlertCircle, Clock, Bell, CheckCircle, ExternalLink, Check, CreditCard, DollarSign } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import AdminReminders from "@/components/admin/AdminReminders";
import { toast } from "sonner";
import { getPlanTier, getPlanTierClasses } from "@/lib/plan-colors";

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

  // Recent completed onboardings (onboarding_complete + active subscription in last 7 days)
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
      
      // Fetch profiles separately
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

  return (
    <DashboardLayout role="admin" title="Dashboard" subtitle="Visão geral da consultoria.">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4 mb-8">
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

      {/* Onboarding Alerts */}
      {recentOnboardings && recentOnboardings.length > 0 && (
        <Card className="mb-6 border-primary/20 bg-primary/5">
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-display flex items-center gap-2">
              <Bell className="w-4 h-4 text-primary" /> Novos Cadastros Completos
              <Badge variant="default" className="ml-2">{recentOnboardings.length}</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {recentOnboardings.map((s: any) => (
              <div key={s.id} className="flex items-center justify-between py-2 border-b border-border/50 last:border-0">
                <div className="flex items-center gap-3">
                  <CheckCircle className="w-4 h-4 text-primary" />
                  <div>
                    <p className="text-sm font-medium">{(s as any).profiles?.full_name || "Aluno"}</p>
                    <p className="text-xs text-muted-foreground">
                      {(s as any).plans?.name} • Cadastro completo em {new Date(s.created_at).toLocaleDateString("pt-BR")}
                    </p>
                  </div>
                </div>
                <Badge variant="outline" className="text-xs">Ativo</Badge>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      <AdminReminders />

      <RecentStudents profiles={profiles} subscriptions={subscriptions} navigate={navigate} queryClient={queryClient} />

      <PendingPayments />
    </DashboardLayout>
  );
};

const RecentStudents = ({ profiles, subscriptions, navigate, queryClient }: { profiles: any[] | undefined; subscriptions: any[] | undefined; navigate: any; queryClient: any }) => {
  const now = Date.now();
  const recentProfiles = profiles?.filter((p) => {
    const days = Math.floor((now - new Date(p.created_at).getTime()) / 86400000);
    return days <= 3 && !p.admin_confirmed;
  }) || [];

  // Map user_id -> subscription with plan info
  const subMap = new Map(
    (subscriptions || []).map((s: any) => [s.user_id, s])
  );

  // Also fetch recent payments to show chosen plan even before subscription is created
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

  // Map user_id -> most recent payment with plan
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
    <Card className="mt-6">
      <CardHeader>
        <CardTitle className="font-display flex items-center gap-2">
          Alunos recentes
          <Badge variant="default" className="ml-2">{recentProfiles.length}</Badge>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {recentProfiles.map((p) => {
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
      </CardContent>
    </Card>
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
      const { data: profilesData } = await supabase
        .from("profiles")
        .select("user_id, full_name, email")
        .in("user_id", userIds);
      const profileMap = new Map((profilesData || []).map((p: any) => [p.user_id, p]));
      return data.map((p: any) => ({ ...p, profile: profileMap.get(p.user_id) }));
    },
  });

  if (!pendingPayments || pendingPayments.length === 0) return null;

  return (
    <Card className="mt-6 border-warning/20 bg-warning/5">
      <CardHeader className="pb-2">
        <CardTitle className="text-base font-display flex items-center gap-2">
          <DollarSign className="w-4 h-4 text-warning" /> Pagamentos Pendentes
          <Badge variant="default" className="ml-2 bg-warning text-warning-foreground">{pendingPayments.length}</Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
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
      </CardContent>
    </Card>
  );
};

export default AdminDashboard;
