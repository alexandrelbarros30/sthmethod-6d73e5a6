import { useEffect, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Bell, CheckCheck, Eye, UserCog } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useNavigate } from "react-router-dom";

const PaymentNotificationPopup = () => {
  const { user, role } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const [hasShown, setHasShown] = useState(false);

  const { data: unseen = [] } = useQuery({
    queryKey: ["unseen-payment-notifications"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("payment_notifications")
        .select("*")
        .eq("seen", false)
        .order("created_at", { ascending: false })
        .limit(50);
      if (error) throw error;
      const paymentIds = (data || []).map((n: any) => n.payment_id).filter(Boolean);
      let couponByPayment: Record<string, string> = {};
      if (paymentIds.length > 0) {
        const { data: pays } = await supabase
          .from("payments")
          .select("id, coupon_id, coupons(code)")
          .in("id", paymentIds);
        (pays || []).forEach((p: any) => {
          if (p.coupons?.code) couponByPayment[p.id] = p.coupons.code;
        });
      }
      return (data || []).map((n: any) => ({ ...n, coupon_code: couponByPayment[n.payment_id] || null }));
    },
    enabled: !!user && (role === "admin" || role === "consultor" || role === "financeiro"),
    refetchInterval: 30000,
  });

  // Auto-show popup when there are unseen notifications (once per session load)
  useEffect(() => {
    if (unseen.length > 0 && !hasShown) {
      const timer = setTimeout(() => {
        setOpen(true);
        setHasShown(true);
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [unseen.length, hasShown]);

  // Listen for realtime new notifications
  useEffect(() => {
    if (!user || (role !== "admin" && role !== "consultor" && role !== "financeiro")) return;

    const channel = supabase
      .channel("payment-notif-realtime")
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "payment_notifications" }, () => {
        queryClient.invalidateQueries({ queryKey: ["unseen-payment-notifications"] });
        setOpen(true);
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [user, role, queryClient]);

  const markSeen = useMutation({
    mutationFn: async (id: string) => {
      await supabase.from("payment_notifications").update({ seen: true }).eq("id", id);
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["unseen-payment-notifications"] }),
  });

  const markAllSeen = useMutation({
    mutationFn: async () => {
      await supabase.from("payment_notifications").update({ seen: true }).eq("seen", false);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["unseen-payment-notifications"] });
      setOpen(false);
    },
  });

  const actionLabel = (type: string) =>
    type === "new" ? "Novo plano" : type === "upgrade" ? "Atualização" : "Renovação";

  if (!user || (role !== "admin" && role !== "consultor" && role !== "financeiro")) return null;

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-base">
            <Bell className="w-5 h-5 text-primary" />
            Notificações de Pagamento
            <Badge variant="destructive" className="text-xs">{unseen.length}</Badge>
          </DialogTitle>
        </DialogHeader>

        <ScrollArea className="max-h-[60vh]">
          <div className="space-y-2 pr-2">
            {unseen.map((n: any) => (
              <div key={n.id} className="flex items-start justify-between gap-2 p-3 rounded-lg bg-primary/5 border border-primary/20">
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium">
                    {n.payment_status === "approved" ? "✅" : "⏳"} {n.student_name}
                  </p>
                  <div className="flex gap-1 mt-1 flex-wrap">
                    <Badge variant="secondary" className="text-[10px]">{actionLabel(n.action_type)}</Badge>
                    <Badge variant="outline" className="text-[10px]">{n.method?.toUpperCase()}</Badge>
                    {n.coupon_code && (
                      <Badge className="text-[10px] bg-primary/20 text-primary border border-primary/40">
                        🎟️ {n.coupon_code}
                      </Badge>
                    )}
                  </div>
                  <p className="text-[11px] text-muted-foreground mt-1">
                    {n.plan_name} • {Number(n.amount).toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}
                  </p>
                  <p className="text-[10px] text-muted-foreground">
                    {format(new Date(n.created_at), "dd/MM/yyyy HH:mm", { locale: ptBR })}
                  </p>
                </div>
                <div className="flex flex-col gap-1 shrink-0">
                  {(role === "admin" || role === "consultor") && (
                    <Button
                      size="sm"
                      variant="outline"
                      className="text-xs h-7"
                      onClick={() => {
                        const base = role === "consultor" ? "/consultor/students" : "/admin/students";
                        navigate(`${base}?manage=${n.student_user_id}`);
                        setOpen(false);
                      }}
                    >
                      <UserCog className="w-3 h-3 mr-1" /> Cadastro
                    </Button>
                  )}
                  <Button size="sm" variant="ghost" className="text-xs h-7" onClick={() => markSeen.mutate(n.id)}>
                    <Eye className="w-3 h-3 mr-1" /> Visto
                  </Button>
                </div>
              </div>
            ))}
            {unseen.length === 0 && (
              <p className="text-sm text-muted-foreground text-center py-6">Nenhuma notificação pendente 🎉</p>
            )}
          </div>
        </ScrollArea>

        {unseen.length > 0 && (
          <div className="flex justify-end pt-2 border-t">
            <Button size="sm" onClick={() => markAllSeen.mutate()} className="text-xs gap-1.5">
              <CheckCheck className="w-3.5 h-3.5" />
              Marcar todas como vistas
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default PaymentNotificationPopup;
