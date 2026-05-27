import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Cpu, Loader2, Save, Send, Webhook } from "lucide-react";

/**
 * Painel único dos DOIS motores globais do CRM:
 *  - Motor de Disparo (billing_automation.enabled): cobranças, campanhas, automações de saída.
 *  - Motor de Resposta (ai_assistant_config.auto_reply_enabled + engine): respostas automáticas inbound.
 *
 * Esta é a fonte da verdade. Outras telas (Billing, Messages, CRM, AIAssistant)
 * passam a apenas linkar para cá.
 */
export default function MotoresGlobaisPanel() {
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

  const { data: cfg } = useQuery({
    queryKey: ["ai-assistant-config", "motores"],
    queryFn: async () => {
      const { data } = await supabase
        .from("ai_assistant_config")
        .select("auto_reply_enabled, engine, fallback_enabled")
        .eq("id", 1)
        .maybeSingle();
      return data;
    },
  });

  const [autoReply, setAutoReply] = useState(false);
  const [engine, setEngine] = useState<"local" | "ai" | "gemini">("local");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (cfg) {
      setAutoReply(!!(cfg as any).auto_reply_enabled);
      setEngine(((cfg as any).engine as "local" | "ai" | "gemini") || "local");
    }
  }, [cfg]);

  const dispatchEnabled = !!automation?.enabled;

  const toggleDispatch = async (enabled: boolean) => {
    const { error } = await supabase
      .from("billing_automation")
      .update({ enabled, updated_at: new Date().toISOString(), updated_by: user?.id })
      .eq("id", 1);
    if (error) return toast.error("Falha: " + error.message);
    toast.success(enabled ? "Motor de Disparo ATIVADO" : "Motor de Disparo PAUSADO");
    qc.invalidateQueries({ queryKey: ["billing-automation"] });
  };

  const saveResponse = async (nextAuto?: boolean, nextEngine?: typeof engine) => {
    setSaving(true);
    const { error } = await supabase
      .from("ai_assistant_config")
      .update({
        auto_reply_enabled: nextAuto ?? autoReply,
        engine: nextEngine ?? engine,
        updated_at: new Date().toISOString(),
        updated_by: user?.id,
      } as any)
      .eq("id", 1);
    setSaving(false);
    if (error) return toast.error("Falha: " + error.message);
    toast.success("Motor de Resposta atualizado");
    qc.invalidateQueries({ queryKey: ["ai-assistant-config", "motores"] });
    qc.invalidateQueries({ queryKey: ["ai-assistant-config"] });
  };

  const engineLabel =
    engine === "local" ? "🟢 Local (gratuito)"
    : engine === "gemini" ? "🟣 Gemini (sua chave)"
    : "🔵 IA Lovable (créditos)";

  return (
    <Card className="border-primary/30 bg-primary/[0.03]">
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center gap-2 tracking-tight">
          <Cpu className="h-4 w-4 text-primary" />
          Motores Globais do CRM
        </CardTitle>
        <p className="text-xs text-muted-foreground">
          Controle único dos dois motores que governam todo o fluxo de atendimento.
        </p>
      </CardHeader>
      <CardContent className="grid gap-3 md:grid-cols-2">
        {/* MOTOR DE DISPARO (saída) */}
        <div className={`rounded-lg border p-4 ${dispatchEnabled ? "border-emerald-500/40 bg-emerald-500/5" : "border-amber-500/40 bg-amber-500/5"}`}>
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <Send className="h-3.5 w-3.5 text-emerald-400" />
                <p className="text-sm font-semibold">Motor de Disparo</p>
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Cobranças automáticas (D-0 a D+30), campanhas agendadas e automações por gatilho.
              </p>
              <Badge variant="outline" className={`mt-2 ${dispatchEnabled ? "border-emerald-500/40 text-emerald-300" : "border-amber-500/40 text-amber-300"}`}>
                {dispatchEnabled ? "ATIVO" : "PAUSADO"}
              </Badge>
            </div>
            <Switch checked={dispatchEnabled} onCheckedChange={toggleDispatch} />
          </div>
        </div>

        {/* MOTOR DE RESPOSTA (entrada) */}
        <div className={`rounded-lg border p-4 ${autoReply ? "border-emerald-500/40 bg-emerald-500/5" : "border-border/40 bg-card/40"}`}>
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <Webhook className="h-3.5 w-3.5 text-primary" />
                <p className="text-sm font-semibold">Motor de Resposta</p>
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Responde automaticamente às mensagens recebidas no WhatsApp.
              </p>
              <Badge variant="outline" className="mt-2 border-border/40">{engineLabel}</Badge>
            </div>
            <Switch
              checked={autoReply}
              onCheckedChange={(v) => { setAutoReply(v); saveResponse(v, engine); }}
            />
          </div>
          <div className="mt-3 flex items-center gap-2">
            <Select
              value={engine}
              onValueChange={(v) => { const e = v as typeof engine; setEngine(e); saveResponse(autoReply, e); }}
            >
              <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="local">🟢 Local (gratuito)</SelectItem>
                <SelectItem value="gemini">🟣 Gemini (sua chave)</SelectItem>
                <SelectItem value="ai">🔵 IA Lovable (créditos)</SelectItem>
              </SelectContent>
            </Select>
            {saving && <Loader2 className="h-3.5 w-3.5 animate-spin text-muted-foreground" />}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}