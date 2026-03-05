import DashboardLayout from "@/components/DashboardLayout";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Wallet, CreditCard, TrendingUp } from "lucide-react";

const FinanceiroDashboard = () => {
  const { data: stats } = useQuery({
    queryKey: ["financeiro-stats"],
    queryFn: async () => {
      const [paymentsRes, activeSubsRes] = await Promise.all([
        supabase.from("payments").select("amount, status"),
        supabase.from("subscriptions").select("id", { count: "exact", head: true }).eq("status", "active"),
      ]);
      const approved = (paymentsRes.data || []).filter((p) => p.status === "approved");
      const totalRevenue = approved.reduce((sum, p) => sum + Number(p.amount), 0);
      return {
        totalPayments: paymentsRes.data?.length || 0,
        approvedPayments: approved.length,
        totalRevenue,
        activeSubscriptions: activeSubsRes.count || 0,
      };
    },
  });

  return (
    <DashboardLayout role="financeiro" title="Painel Financeiro" subtitle="Pagamentos e assinaturas">
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 mb-8">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium font-body">Receita Total</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              R$ {(stats?.totalRevenue ?? 0).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium font-body">Pagamentos Aprovados</CardTitle>
            <Wallet className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.approvedPayments ?? 0}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium font-body">Total de Pagamentos</CardTitle>
            <CreditCard className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.totalPayments ?? 0}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium font-body">Assinaturas Ativas</CardTitle>
            <CreditCard className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.activeSubscriptions ?? 0}</div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
};

export default FinanceiroDashboard;
