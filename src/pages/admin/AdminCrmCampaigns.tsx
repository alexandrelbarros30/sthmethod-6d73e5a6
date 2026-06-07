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
import { Send, Plus, Loader2, FileText } from "lucide-react";
import { Link } from "react-router-dom";

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
  const [channel, setChannel] = useState<"zapi"|"wapi"|"wapi_sucesso">("zapi");
  const [loading, setLoading] = useState(false);
  const [dispatching, setDispatching] = useState<string | null>(null);
  const [templates, setTemplates] = useState<{ id: string; name: string; body: string; category: string }[]>([]);
  const [selectedTpl, setSelectedTpl] = useState<string>("");

  async function load() {
    const { data } = await supabase
      .from("crm_campaigns")
      .select("id, name, status, sent_count, failed_count, total_count, created_at, scheduled_at")
      .order("created_at", { ascending: false })
      .limit(50);
    setCampaigns((data ?? []) as Campaign[]);
  }
  async function loadTemplates() {
    const { data } = await supabase
      .from("crm_message_templates")
      .select("id, name, body, category")
      .eq("active", true)
      .order("name");
    setTemplates((data ?? []) as any);
  }
  useEffect(() => { load(); loadTemplates(); }, []);

  function applyTemplate(id: string) {
    setSelectedTpl(id);
    const t = templates.find((x) => x.id === id);
    if (t) {
      setTpl(t.body);
      if (!name) setName(t.name);
    }
  }

  async function create() {
    if (!name.trim() || !tpl.trim()) { toast({ title: "Preencha nome e mensagem" }); return; }
    setLoading(true);
    const { error } = await supabase.from("crm_campaigns").insert({
      name: name.trim(), message_template: tpl.trim(),
      target_filter: { type: target }, status: "draft", created_by: user?.id,
      channel: channel,
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
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold">Nova campanha</h3>
          <Link to="/admin/crm/templates" className="text-[11px] text-primary hover:underline flex items-center gap-1">
            <FileText className="w-3 h-3" /> Gerenciar templates
          </Link>
        </div>
        {templates.length > 0 && (
          <Select value={selectedTpl} onValueChange={applyTemplate}>
            <SelectTrigger><SelectValue placeholder="Usar um template salvo (opcional)…" /></SelectTrigger>
            <SelectContent>
              {templates.map((t) => (
                <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}
        <Input placeholder="Nome interno" value={name} onChange={(e) => setName(e.target.value)} />
        <Textarea placeholder="Mensagem (use {nome}, {plano}, {vencimento}, {valor}, {link_renovacao})" rows={5} value={tpl} onChange={(e) => setTpl(e.target.value)} />
        <div className="flex flex-wrap items-center gap-2">
          <div className="space-y-1">
            <Label className="text-[10px] text-muted-foreground uppercase">Canal de envio</Label>
            <Select value={channel} onValueChange={(v: any) => setChannel(v)}>
              <SelectTrigger className="w-56 h-9"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="zapi">STH One — Comercial</SelectItem>
                <SelectItem value="wapi">Fale com o Nutri</SelectItem>
                <SelectItem value="wapi_sucesso">Sucesso do Aluno</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1">
            <Label className="text-[10px] text-muted-foreground uppercase">Público alvo</Label>
            <Select value={target} onValueChange={(v: any) => setTarget(v)}>
              <SelectTrigger className="w-56 h-9"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all_active">Todos ativos</SelectItem>
                <SelectItem value="expiring">Vencendo em 7 dias</SelectItem>
                <SelectItem value="expired">Vencidos</SelectItem>
                <SelectItem value="all_leads">Leads (sem assinatura)</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="pt-5">
            <Button onClick={create} disabled={loading} size="sm">
              {loading ? <Loader2 className="w-3.5 h-3.5 mr-1 animate-spin" /> : <Plus className="w-3.5 h-3.5 mr-1" />} Criar
            </Button>
          </div>
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