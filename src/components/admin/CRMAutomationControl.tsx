import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";

/**
 * Painel global de controle do CRM Automático.
 * Usado em todos os submenus do menu WhatsApp (Cobranças, Campanhas, Mensagens).
 * Quando desligado, pausa cobranças automáticas E disparos agendados/recorrentes
 * de campanhas do CRM (crm-scheduler também respeita esta flag).
 */
export default function CRMAutomationControl({ compact = false }: { compact?: boolean }) {
  const { user } = useAuth();
  const qc = useQueryClient();

  const { data: automation } = useQuery({
    queryKey: ["billing-automation"],
    queryFn: async () => {
      const { data } = await supabase
        .from("billing_automation")
        .select("enabled")
        .eq("id", 1)
        .maybeSingle();
      return data;
    },
  });

  const toggle = async (enabled: boolean) => {
    const { error } = await supabase
      .from("billing_automation")
      .update({ enabled, updated_at: new Date().toISOString(), updated_by: user?.id })
      .eq("id", 1);
    if (error) {
      toast.error("Falha ao atualizar automação: " + error.message);
      return;
    }
    toast.success(
      enabled
        ? "CRM Automático ATIVADO — cobranças e campanhas serão disparadas conforme agenda"
        : "CRM Automático PAUSADO — nenhum disparo automático será enviado",
    );
    qc.invalidateQueries({ queryKey: ["billing-automation"] });
  };

  const enabled = !!automation?.enabled;

  return (
    <Card
      className={
        enabled
          ? "border-emerald-500/40 bg-emerald-500/5"
          : "border-amber-500/40 bg-amber-500/5"
      }
    >
      <CardContent
        className={`flex flex-wrap items-center justify-between gap-3 ${compact ? "p-3" : "p-4"}`}
      >
        <div className="flex items-center gap-3 min-w-0">
          <div
            className={`w-2.5 h-2.5 rounded-full shrink-0 ${enabled ? "bg-emerald-400 animate-pulse" : "bg-amber-400"}`}
          />
          <div className="min-w-0">
            <p className="text-sm font-semibold">
              {enabled ? "CRM Automático ATIVO" : "CRM Automático PAUSADO"}
            </p>
            <p className="text-xs text-muted-foreground">
              {enabled
                ? "Controla cobranças, campanhas agendadas e automações do WhatsApp."
                : "Disparos automáticos suspensos em todo o menu WhatsApp."}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <span className="text-xs text-muted-foreground">Automação</span>
          <Switch checked={enabled} onCheckedChange={toggle} />
        </div>
      </CardContent>
    </Card>
  );
}