import { useEffect, useState } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "@/hooks/use-toast";
import { Send, Plus, Loader2 } from "lucide-react";

interface Campaign {
  id: string; name: string; status: string; sent_count: number; failed_count: number; total_count: number;
  created_at: string; scheduled_at: string | null;
}

export default function AdminCrmCampaigns() {
  const { user } = useAuth();
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [name, setName] = useState("");
  const [tpl, setTpl] = useState("");
  const [target, setTarget] = useState<"all_active"|"expiring"|"expired"|"all_leads">("expiring");
  const [loading, setLoading] = useState(false);
  const [dispatching, setDispatching] = useState<string | null>(null);

  async function load() {
    const { data } = await supabase
      .from("crm_campaigns")
      .select("id, name, status, sent_count, failed_count, total_count, created_at, scheduled_at")
      .order("created_at", { ascending: false })
      .limit(50);
    setCampaigns((data ?? []) as Campaign[]);
  }
  useEffect(() => { load(); }, []);

  async function create() {
    if (!name.trim() || !tpl.trim()) { toast({ title: "Preencha nome e mensagem" }); return; }
    setLoading(true);
    const { error } = await supabase.from("crm_campaigns").insert({
      name: name.trim(), message_template: tpl.trim(),
      target_filter: { type: target }, status: "draft", created_by: user?.id,
    });
    setLoading(false);
    if (error) { toast({ title: "Erro", description: error.message }); return; }
    setName(""); setTpl("");
    load();
  }

  async function dispatch(id: string) {
    setDispatching(id);
    try {
      const { error } = await supabase.functions.invoke("crm-campaign-dispatch", { body: { campaign_id: id } });
      if (error) throw error;
      toast({ title: "Campanha enfileirada", description: "Os envios começaram em background." });
      load();
    } catch (e: any) {
      toast({ title: "Erro", description: e?.message || "Falha ao disparar" });
    } finally {
      setDispatching(null);
    }
  }

  return (
    <DashboardLayout role="admin" title="Campanhas WhatsApp" subtitle="Envio em massa para segmentos de alunos">
      <Card className="p-4 space-y-3">
        <h3 className="text-sm font-semibold">Nova campanha</h3>
        <Input placeholder="Nome interno" value={name} onChange={(e) => setName(e.target.value)} />
        <Textarea placeholder="Mensagem (use {nome} para personalizar)" rows={4} value={tpl} onChange={(e) => setTpl(e.target.value)} />
        <div className="flex items-center gap-2">
          <Select value={target} onValueChange={(v: any) => setTarget(v)}>
            <SelectTrigger className="w-56"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all_active">Todos ativos</SelectItem>
              <SelectItem value="expiring">Vencendo em 7 dias</SelectItem>
              <SelectItem value="expired">Vencidos</SelectItem>
              <SelectItem value="all_leads">Leads (sem assinatura)</SelectItem>
            </SelectContent>
          </Select>
          <Button onClick={create} disabled={loading} size="sm">
            {loading ? <Loader2 className="w-3.5 h-3.5 mr-1 animate-spin" /> : <Plus className="w-3.5 h-3.5 mr-1" />} Criar
          </Button>
        </div>
      </Card>

      <div className="mt-6 space-y-2">
        {campaigns.length === 0 && <p className="text-sm text-muted-foreground">Nenhuma campanha.</p>}
        {campaigns.map((c) => (
          <Card key={c.id} className="p-3 flex items-center gap-3">
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium">{c.name}</p>
              <p className="text-[11px] text-muted-foreground">
                Criada em {new Date(c.created_at).toLocaleString("pt-BR")} · {c.sent_count}/{c.total_count} enviadas {c.failed_count > 0 && `· ${c.failed_count} falhas`}
              </p>
            </div>
            <Badge variant="outline" className="text-[10px]">{c.status}</Badge>
            {c.status !== "sending" && c.status !== "done" && (
              <Button size="sm" onClick={() => dispatch(c.id)} disabled={dispatching === c.id}>
                {dispatching === c.id ? <Loader2 className="w-3.5 h-3.5 mr-1 animate-spin" /> : <Send className="w-3.5 h-3.5 mr-1" />} Disparar
              </Button>
            )}
          </Card>
        ))}
      </div>
    </DashboardLayout>
  );
}