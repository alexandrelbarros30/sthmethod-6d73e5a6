import { useEffect, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Camera, CheckCheck, Eye, MessageSquare } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { ScrollArea } from "@/components/ui/scroll-area";
import { sendSystemTemplate } from "@/lib/system-templates";
import { toast } from "@/hooks/use-toast";

const EvolutionReminderPopup = () => {
  const { user, role } = useAuth();
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const [hasShown, setHasShown] = useState(false);

  const { data: unseen = [] } = useQuery({
    queryKey: ["unseen-evolution-reminders"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("evolution_reminders")
        .select("*")
        .eq("seen", false)
        .order("due_date", { ascending: false })
        .limit(50);
      if (error) throw error;
      return data;
    },
    enabled: !!user && (role === "admin" || role === "consultor"),
    refetchInterval: 60000,
  });

  // Auto-show popup when there are unseen reminders
  useEffect(() => {
    if (unseen.length > 0 && !hasShown) {
      const timer = setTimeout(() => {
        setOpen(true);
        setHasShown(true);
      }, 3500); // slight delay after payment popup
      return () => clearTimeout(timer);
    }
  }, [unseen.length, hasShown]);

  // Listen for realtime inserts
  useEffect(() => {
    if (!user || (role !== "admin" && role !== "consultor")) return;

    const channel = supabase
      .channel("evolution-reminder-realtime")
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "evolution_reminders" }, () => {
        queryClient.invalidateQueries({ queryKey: ["unseen-evolution-reminders"] });
        setOpen(true);
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [user, role, queryClient]);

  const markSeen = useMutation({
    mutationFn: async (id: string) => {
      await supabase.from("evolution_reminders").update({ seen: true }).eq("id", id);
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["unseen-evolution-reminders"] }),
  });

  const markAllSeen = useMutation({
    mutationFn: async () => {
      await supabase.from("evolution_reminders").update({ seen: true }).eq("seen", false);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["unseen-evolution-reminders"] });
      setOpen(false);
    },
  });

  const handleSendWhatsApp = async (reminder: any) => {
    const { data: profile } = await supabase
      .from("profiles")
      .select("phone, full_name")
      .eq("user_id", reminder.student_user_id)
      .single();

    const result = await sendSystemTemplate(
      "evolution_update_reminder",
      {
        full_name: profile?.full_name,
        phone: profile?.phone,
        user_id: reminder.student_user_id,
      },
      { logHistory: true }
    );
    if (!result.ok) {
      toast({ title: "Não foi possível enviar", description: result.reason, variant: "destructive" });
      return;
    }
    markSeen.mutate(reminder.id);
  };

  if (!user || (role !== "admin" && role !== "consultor")) return null;

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-base">
            <Camera className="w-5 h-5 text-primary" />
            Atualizações de Evolução
            {unseen.length > 0 && <Badge variant="destructive" className="text-xs">{unseen.length}</Badge>}
          </DialogTitle>
        </DialogHeader>

        <ScrollArea className="max-h-[60vh]">
          <div className="space-y-2 pr-2">
            {unseen.map((r: any) => (
              <div key={r.id} className="flex items-start justify-between gap-2 p-3 rounded-lg bg-primary/5 border border-primary/20">
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium">📸 {r.student_name}</p>
                  <div className="flex gap-1 mt-1 flex-wrap">
                    <Badge variant="secondary" className="text-[10px]">{r.cycle_number}º Ciclo (29 dias)</Badge>
                  </div>
                  <p className="text-[11px] text-muted-foreground mt-1">
                    Vencimento: {format(new Date(r.due_date + "T12:00:00"), "dd/MM/yyyy", { locale: ptBR })}
                  </p>
                </div>
                <div className="flex flex-col gap-1 shrink-0">
                  <Button size="sm" variant="default" className="text-xs h-7 gap-1" onClick={() => handleSendWhatsApp(r)}>
                    <MessageSquare className="w-3 h-3" /> Enviar
                  </Button>
                  <Button size="sm" variant="ghost" className="text-xs h-7 gap-1" onClick={() => markSeen.mutate(r.id)}>
                    <Eye className="w-3 h-3" /> Visto
                  </Button>
                </div>
              </div>
            ))}
            {unseen.length === 0 && (
              <p className="text-sm text-muted-foreground text-center py-6">Nenhum lembrete pendente 🎉</p>
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

export default EvolutionReminderPopup;
