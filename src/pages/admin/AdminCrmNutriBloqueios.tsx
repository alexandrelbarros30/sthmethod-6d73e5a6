import { useEffect, useState } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { toast } from "@/hooks/use-toast";
import { formatPhoneBR } from "@/lib/phone";
import { Shield, ShieldOff, Trash2, Plus, EyeOff, MessageSquare } from "lucide-react";

type BlockLog = {
  id: string;
  contact_phone: string | null;
  created_at: string;
  action_taken: string | null;
  metadata: any;
};

type WhitelistEntry = {
  id: string;
  phone: string;
  note: string | null;
  created_at: string;
};

export default function AdminCrmNutriBloqueios() {
  const [logs, setLogs] = useState<BlockLog[]>([]);
  const [totalToday, setTotalToday] = useState(0);
  const [totalWeek, setTotalWeek] = useState(0);
  const [totalMonth, setTotalMonth] = useState(0);
  const [whitelist, setWhitelist] = useState<WhitelistEntry[]>([]);
  const [newPhone, setNewPhone] = useState("");
  const [newNote, setNewNote] = useState("");
  const [silentMode, setSilentMode] = useState(false);
  const [loading, setLoading] = useState(true);

  async function load() {
    setLoading(true);
    const now = new Date();
    const startToday = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString();
    const startWeek = new Date(Date.now() - 7 * 86400000).toISOString();
    const startMonth = new Date(Date.now() - 30 * 86400000).toISOString();

    const [logsRes, todayRes, weekRes, monthRes, wlRes, modeRes] = await Promise.all([
      supabase
        .from("automation_logs")
        .select("id, contact_phone, created_at, action_taken, metadata")
        .eq("event_type", "nutri_block_redirect")
        .order("created_at", { ascending: false })
        .limit(200),
      supabase.from("automation_logs").select("id", { count: "exact", head: true }).eq("event_type", "nutri_block_redirect").gte("created_at", startToday),
      supabase.from("automation_logs").select("id", { count: "exact", head: true }).eq("event_type", "nutri_block_redirect").gte("created_at", startWeek),
      supabase.from("automation_logs").select("id", { count: "exact", head: true }).eq("event_type", "nutri_block_redirect").gte("created_at", startMonth),
      supabase.from("crm_nutri_whitelist").select("id, phone, note, created_at").order("created_at", { ascending: false }),
      supabase.from("crm_settings").select("value").eq("key", "nutri_block_mode").maybeSingle(),
    ]);

    setLogs((logsRes.data ?? []) as BlockLog[]);
    setTotalToday(todayRes.count ?? 0);
    setTotalWeek(weekRes.count ?? 0);
    setTotalMonth(monthRes.count ?? 0);
    setWhitelist((wlRes.data ?? []) as WhitelistEntry[]);
    setSilentMode(!!(modeRes.data?.value as any)?.silent);
    setLoading(false);
  }

  useEffect(() => { load(); }, []);

  async function toggleSilent(next: boolean) {
    setSilentMode(next);
    const { error } = await supabase
      .from("crm_settings")
      .upsert({ key: "nutri_block_mode", value: { silent: next } }, { onConflict: "key" });
    if (error) {
      toast({ title: "Erro ao salvar", description: error.message, variant: "destructive" });
      setSilentMode(!next);
    } else {
      toast({ title: next ? "Modo silencioso ativado" : "Modo redirecionamento ativado" });
    }
  }

  async function addWhitelist() {
    const digits = newPhone.replace(/\D/g, "");
    if (digits.length < 10) {
      toast({ title: "Telefone inválido", description: "Informe DDD + número", variant: "destructive" });
      return;
    }
    const { error } = await supabase.from("crm_nutri_whitelist").insert({ phone: digits, note: newNote || null });
    if (error) {
      toast({ title: "Erro", description: error.message, variant: "destructive" });
      return;
    }
    setNewPhone(""); setNewNote("");
    toast({ title: "Adicionado à whitelist" });
    load();
  }

  async function removeWhitelist(id: string) {
    const { error } = await supabase.from("crm_nutri_whitelist").delete().eq("id", id);
    if (error) return toast({ title: "Erro", description: error.message, variant: "destructive" });
    toast({ title: "Removido" });
    load();
  }

  return (
    <DashboardLayout role="admin" title="Bloqueios Nutri">
      <div className="max-w-6xl mx-auto p-4 md:p-6 space-y-6">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Shield className="h-6 w-6" /> Bloqueios do Canal Fale com o Nutri
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Auditoria dos redirecionamentos automáticos, modo silencioso e whitelist manual.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <Card className="p-4">
            <div className="text-xs text-muted-foreground">Bloqueios hoje</div>
            <div className="text-3xl font-bold mt-1">{totalToday}</div>
          </Card>
          <Card className="p-4">
            <div className="text-xs text-muted-foreground">Últimos 7 dias</div>
            <div className="text-3xl font-bold mt-1">{totalWeek}</div>
          </Card>
          <Card className="p-4">
            <div className="text-xs text-muted-foreground">Últimos 30 dias</div>
            <div className="text-3xl font-bold mt-1">{totalMonth}</div>
          </Card>
        </div>

        <Card className="p-4">
          <div className="flex items-start justify-between gap-4">
            <div>
              <div className="font-semibold flex items-center gap-2">
                {silentMode ? <EyeOff className="h-4 w-4" /> : <MessageSquare className="h-4 w-4" />}
                Modo silencioso
              </div>
              <p className="text-sm text-muted-foreground mt-1 max-w-xl">
                Quando ativado, contatos bloqueados <b>não recebem nenhuma mensagem</b> (bloqueio 100% mudo).
                Quando desativado, a plataforma envia 1 mensagem única redirecionando para o Comercial e fecha a conversa.
              </p>
            </div>
            <Switch checked={silentMode} onCheckedChange={toggleSilent} />
          </div>
        </Card>

        <Card className="p-4">
          <div className="font-semibold mb-3 flex items-center gap-2">
            <ShieldOff className="h-4 w-4" /> Whitelist manual
          </div>
          <p className="text-xs text-muted-foreground mb-3">
            Números aqui são atendidos normalmente no Fale com o Nutri, mesmo sem consultoria ativa. Use para parceiros, jornalistas, casos especiais.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-[1fr_2fr_auto] gap-2 mb-4">
            <div>
              <Label className="text-xs">Telefone (com DDD)</Label>
              <Input value={newPhone} onChange={(e) => setNewPhone(e.target.value)} placeholder="21999998888" />
            </div>
            <div>
              <Label className="text-xs">Observação (opcional)</Label>
              <Input value={newNote} onChange={(e) => setNewNote(e.target.value)} placeholder="Ex.: Parceiro imprensa Globo" />
            </div>
            <div className="flex items-end">
              <Button onClick={addWhitelist} className="w-full md:w-auto"><Plus className="h-4 w-4 mr-1" /> Adicionar</Button>
            </div>
          </div>
          <div className="space-y-2">
            {whitelist.length === 0 && <div className="text-sm text-muted-foreground">Nenhum número na whitelist.</div>}
            {whitelist.map((w) => (
              <div key={w.id} className="flex items-center justify-between border rounded-lg px-3 py-2">
                <div>
                  <div className="font-mono text-sm">{formatPhoneBR(w.phone) || w.phone}</div>
                  {w.note && <div className="text-xs text-muted-foreground">{w.note}</div>}
                </div>
                <Button variant="ghost" size="sm" onClick={() => removeWhitelist(w.id)}>
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            ))}
          </div>
        </Card>

        <Card className="p-4">
          <div className="font-semibold mb-3">Últimos bloqueios (200)</div>
          {loading && <div className="text-sm text-muted-foreground">Carregando…</div>}
          <div className="space-y-2">
            {logs.map((l) => (
              <div key={l.id} className="flex items-start justify-between gap-3 border rounded-lg px-3 py-2">
                <div className="min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-mono text-sm">{formatPhoneBR(l.contact_phone || "") || l.contact_phone}</span>
                    <Badge variant="outline" className="text-[10px]">
                      {l.metadata?.identified_as || "—"}
                    </Badge>
                    {l.action_taken === "blocked_silent" && (
                      <Badge className="text-[10px] bg-slate-500">silencioso</Badge>
                    )}
                  </div>
                  {l.metadata?.original_message && (
                    <div className="text-xs text-muted-foreground mt-1 truncate">
                      "{l.metadata.original_message}"
                    </div>
                  )}
                </div>
                <div className="text-xs text-muted-foreground whitespace-nowrap">
                  {new Date(l.created_at).toLocaleString("pt-BR")}
                </div>
              </div>
            ))}
            {!loading && logs.length === 0 && (
              <div className="text-sm text-muted-foreground">Nenhum bloqueio registrado ainda.</div>
            )}
          </div>
        </Card>
      </div>
    </DashboardLayout>
  );
}