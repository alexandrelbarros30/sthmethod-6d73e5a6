import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { EMAIL_TEMPLATES, type EmailTemplateMeta } from "@/lib/email-templates-catalog";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { toast } from "@/hooks/use-toast";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Mail, Send, Save, Edit3, Search, RefreshCw, Plus, Trash2, Calendar as CalendarIcon, Zap, X, Eye, Power, PowerOff } from "lucide-react";

interface Settings {
  template_key: string;
  enabled: boolean;
  auto_send: boolean;
  subject_override: string | null;
  body_html_override: string | null;
  notes: string | null;
  updated_at: string;
  custom_variables?: Array<{ key: string; label?: string; defaultValue?: string }> | null;
  automation_rule?: { type: string; days?: number } | null;
}

interface LogRow {
  id: string;
  message_id: string | null;
  template_name: string | null;
  recipient_email: string | null;
  status: string | null;
  error_message: string | null;
  created_at: string;
}

interface StudentLite {
  user_id: string;
  full_name: string | null;
  email: string | null;
}

interface ScheduledRow {
  id: string;
  template_key: string;
  recipient_email: string;
  recipient_name: string | null;
  scheduled_at: string;
  status: string;
  source: string;
  error_message: string | null;
  processed_at: string | null;
  attempts: number;
}

export default function AdminEmails() {
  const [settings, setSettings] = useState<Record<string, Settings>>({});
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [editing, setEditing] = useState<EmailTemplateMeta | null>(null);
  const [editSubject, setEditSubject] = useState("");
  const [editBody, setEditBody] = useState("");
  const [editNotes, setEditNotes] = useState("");
  const [editVars, setEditVars] = useState<Array<{ key: string; label: string; defaultValue: string }>>([]);
  const [editAutoType, setEditAutoType] = useState<string>("none");
  const [editAutoDays, setEditAutoDays] = useState<number>(7);
  const [saving, setSaving] = useState(false);
  const [logs, setLogs] = useState<LogRow[]>([]);
  const [testDialog, setTestDialog] = useState<EmailTemplateMeta | null>(null);
  const [testEmail, setTestEmail] = useState("");
  const [sending, setSending] = useState(false);

  // Preview
  const [previewTpl, setPreviewTpl] = useState<EmailTemplateMeta | null>(null);
  const [previewHtml, setPreviewHtml] = useState<string>("");
  const [previewSubject, setPreviewSubject] = useState<string>("");
  const [bulkBusy, setBulkBusy] = useState(false);

  // Manual dispatch
  const [students, setStudents] = useState<StudentLite[]>([]);
  const [studentSearch, setStudentSearch] = useState("");
  const [dispatchTemplate, setDispatchTemplate] = useState<string>("");
  const [dispatchStudent, setDispatchStudent] = useState<StudentLite | null>(null);
  const [dispatchData, setDispatchData] = useState<Record<string, string>>({});
  const [dispatchScheduled, setDispatchScheduled] = useState<string>(""); // datetime-local
  const [dispatching, setDispatching] = useState(false);

  // Scheduled list
  const [scheduled, setScheduled] = useState<ScheduledRow[]>([]);

  async function load() {
    setLoading(true);
    const { data } = await supabase.from("email_template_settings").select("*");
    const map: Record<string, Settings> = {};
    (data || []).forEach((row: any) => {
      map[row.template_key] = row;
    });
    setSettings(map);
    setLoading(false);
  }

  async function loadLogs() {
    const { data } = await supabase
      .from("email_send_log")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(100);
    setLogs((data || []) as LogRow[]);
  }

  async function loadScheduled() {
    const { data } = await supabase
      .from("email_scheduled_sends")
      .select("id,template_key,recipient_email,recipient_name,scheduled_at,status,source,error_message,processed_at,attempts")
      .order("scheduled_at", { ascending: false })
      .limit(200);
    setScheduled((data || []) as ScheduledRow[]);
  }

  async function loadStudents() {
    const { data } = await supabase
      .from("profiles")
      .select("user_id, full_name, email")
      .not("email", "is", null)
      .order("full_name", { ascending: true })
      .limit(2000);
    setStudents((data || []) as StudentLite[]);
  }

  useEffect(() => {
    load();
    loadLogs();
    loadScheduled();
    loadStudents();
  }, []);

  async function toggle(key: string, field: "enabled" | "auto_send", value: boolean) {
    setSettings((s) => ({ ...s, [key]: { ...(s[key] || {}), template_key: key, [field]: value } as Settings }));
    const { error } = await supabase
      .from("email_template_settings")
      .update({ [field]: value })
      .eq("template_key", key);
    if (error) {
      toast({ title: "Erro ao salvar", description: error.message, variant: "destructive" });
      load();
    }
  }

  async function toggleAll(value: boolean) {
    setBulkBusy(true);
    try {
      // Ensure a row exists for every template, then update enabled.
      const rows = EMAIL_TEMPLATES.map((t) => ({ template_key: t.key, enabled: value }));
      const { error } = await supabase
        .from("email_template_settings")
        .upsert(rows, { onConflict: "template_key" });
      if (error) throw error;
      toast({ title: value ? "Todos ativados" : "Todos desativados" });
      await load();
    } catch (e: any) {
      toast({ title: "Erro", description: e.message, variant: "destructive" });
    } finally {
      setBulkBusy(false);
    }
  }

  function buildSampleData(t: EmailTemplateMeta): Record<string, string> {
    const base: Record<string, string> = {
      name: "Aluno Exemplo",
      siteName: "STH METHOD",
      siteUrl: "https://sthmethod.com",
      confirmationUrl: "https://sthmethod.com/confirm?token=abc",
      renewUrl: "https://sthmethod.com/renovar",
      recipient: "aluno@exemplo.com",
      email: "aluno@exemplo.com",
      oldEmail: "antigo@exemplo.com",
      newEmail: "novo@exemplo.com",
      token: "123456",
      planName: "Plano Premium 6 meses",
      amount: "R$ 528,90",
      method: "Cartão de crédito",
      paymentDate: new Date().toLocaleDateString("pt-BR"),
      reason: "Cartão recusado pelo emissor",
      expiresAt: new Date(Date.now() + 7 * 86400000).toLocaleDateString("pt-BR"),
      oldPlan: "Plano Mensal",
      newPlan: "Plano Premium 6 meses",
      couponCode: "STH10",
      discount: "10%",
      lastSeenAt: new Date(Date.now() - 14 * 86400000).toLocaleDateString("pt-BR"),
    };
    // include custom variable defaults
    const custom = settings[t.key]?.custom_variables || [];
    custom.forEach((v) => { if (v.defaultValue) base[v.key] = v.defaultValue; });
    return base;
  }

  function interpolate(tpl: string, data: Record<string, string>) {
    return tpl.replace(/\{(\w+)\}/g, (_, k) => data[k] ?? `{${k}}`);
  }

  function openPreview(t: EmailTemplateMeta) {
    const s = settings[t.key];
    const data = buildSampleData(t);
    const subject = (s?.subject_override?.trim() || t.defaultSubject);
    let html: string;
    if (s?.body_html_override?.trim()) {
      html = interpolate(s.body_html_override, data);
    } else {
      // Stub preview when no custom HTML is set
      const rows = t.variables
        .map((v) => `<tr><td style="padding:4px 8px;color:#888;font-size:12px">${v}</td><td style="padding:4px 8px;font-size:13px">${data[v] ?? ""}</td></tr>`)
        .join("");
      html = `
<!doctype html><html><body style="margin:0;padding:24px;background:#f5f5f7;font-family:-apple-system,BlinkMacSystemFont,'SF Pro Display',Inter,Arial,sans-serif;color:#111">
  <div style="max-width:560px;margin:0 auto;background:#fff;border-radius:14px;padding:28px;box-shadow:0 1px 3px rgba(0,0,0,.06)">
    <div style="font-size:11px;letter-spacing:.12em;text-transform:uppercase;color:#6e6e73;margin-bottom:6px">STH METHOD</div>
    <h1 style="margin:0 0 12px;font-size:22px;font-weight:600">${interpolate(subject, data)}</h1>
    <p style="color:#444;font-size:14px;line-height:1.55">Pré-visualização do template padrão <strong>${t.displayName}</strong>. O conteúdo final é renderizado pelo sistema com o React Email no momento do envio.</p>
    <p style="color:#555;font-size:13px;margin-top:18px"><strong>Gatilho:</strong> ${t.trigger}</p>
    <table style="width:100%;border-collapse:collapse;margin-top:14px;background:#fafafa;border-radius:8px;overflow:hidden">
      <thead><tr><th colspan="2" style="text-align:left;padding:8px 8px;font-size:11px;color:#6e6e73;text-transform:uppercase;letter-spacing:.08em">Variáveis</th></tr></thead>
      <tbody>${rows || '<tr><td style="padding:8px;font-size:12px;color:#888">Sem variáveis</td></tr>'}</tbody>
    </table>
    <p style="color:#9a9a9f;font-size:11px;margin-top:24px">Use o botão "Testar" para enviar o template real ao seu e-mail.</p>
  </div>
</body></html>`;
    }
    setPreviewTpl(t);
    setPreviewSubject(interpolate(subject, data));
    setPreviewHtml(html);
  }

  function openEdit(t: EmailTemplateMeta) {
    const s = settings[t.key];
    setEditing(t);
    setEditSubject(s?.subject_override ?? "");
    setEditBody(s?.body_html_override ?? "");
    setEditNotes(s?.notes ?? "");
    setEditVars(
      (s?.custom_variables || []).map((v) => ({
        key: v.key,
        label: v.label || "",
        defaultValue: v.defaultValue || "",
      })),
    );
    setEditAutoType(s?.automation_rule?.type ?? "none");
    setEditAutoDays(Number(s?.automation_rule?.days ?? 7));
  }

  async function saveEdit() {
    if (!editing) return;
    setSaving(true);
    const cleanVars = editVars
      .map((v) => ({ key: v.key.trim(), label: v.label.trim(), defaultValue: v.defaultValue }))
      .filter((v) => v.key.length > 0);
    const automation_rule =
      editAutoType === "none" ? null : { type: editAutoType, days: Number(editAutoDays) || 0 };
    const { error } = await supabase
      .from("email_template_settings")
      .update({
        subject_override: editSubject.trim() || null,
        body_html_override: editBody.trim() || null,
        notes: editNotes.trim() || null,
        custom_variables: cleanVars,
        automation_rule,
      })
      .eq("template_key", editing.key);
    setSaving(false);
    if (error) {
      toast({ title: "Erro", description: error.message, variant: "destructive" });
      return;
    }
    toast({ title: "Salvo", description: editing.displayName });
    setEditing(null);
    load();
  }

  async function sendTest() {
    if (!testDialog || !testEmail) return;
    setSending(true);
    try {
      const { data, error } = await supabase.functions.invoke("send-transactional-email", {
        body: {
          templateName: testDialog.key,
          recipientEmail: testEmail,
          manual: true,
          templateData: {
            name: "Aluno Teste",
            siteName: "STH METHOD",
            siteUrl: "https://sthmethod.com",
            confirmationUrl: "https://sthmethod.com",
            planName: "Plano Premium",
            amount: "R$ 297,00",
            method: "Pix",
          },
        },
      });
      if (error) throw error;
      toast({ title: "Enviado", description: `${testDialog.displayName} → ${testEmail}` });
      setTestDialog(null);
      setTestEmail("");
      setTimeout(loadLogs, 1500);
    } catch (e: any) {
      toast({ title: "Falha no envio", description: e.message, variant: "destructive" });
    } finally {
      setSending(false);
    }
  }

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return EMAIL_TEMPLATES;
    return EMAIL_TEMPLATES.filter(
      (t) =>
        t.displayName.toLowerCase().includes(q) ||
        t.key.toLowerCase().includes(q) ||
        t.description.toLowerCase().includes(q),
    );
  }, [search]);

  const filteredStudents = useMemo(() => {
    const q = studentSearch.trim().toLowerCase();
    if (!q) return students.slice(0, 50);
    return students
      .filter(
        (s) =>
          (s.full_name || "").toLowerCase().includes(q) ||
          (s.email || "").toLowerCase().includes(q),
      )
      .slice(0, 50);
  }, [students, studentSearch]);

  const dispatchMeta = useMemo(
    () => EMAIL_TEMPLATES.find((t) => t.key === dispatchTemplate) || null,
    [dispatchTemplate],
  );

  const dispatchVarKeys = useMemo(() => {
    if (!dispatchMeta) return [] as string[];
    const custom = settings[dispatchMeta.key]?.custom_variables || [];
    return Array.from(new Set([...dispatchMeta.variables, ...custom.map((v) => v.key)]));
  }, [dispatchMeta, settings]);

  async function submitDispatch() {
    if (!dispatchMeta || !dispatchStudent?.email) {
      toast({ title: "Selecione template e aluno", variant: "destructive" });
      return;
    }
    setDispatching(true);
    try {
      const scheduledAt = dispatchScheduled
        ? new Date(dispatchScheduled).toISOString()
        : new Date().toISOString();

      // Merge defaults from custom_variables with admin-typed values
      const customDefaults = (settings[dispatchMeta.key]?.custom_variables || []).reduce(
        (acc, v) => {
          if (v.defaultValue) acc[v.key] = v.defaultValue;
          return acc;
        },
        {} as Record<string, string>,
      );
      const merged = { ...customDefaults, ...dispatchData };

      const { error } = await supabase.from("email_scheduled_sends").insert({
        template_key: dispatchMeta.key,
        recipient_user_id: dispatchStudent.user_id,
        recipient_email: dispatchStudent.email,
        recipient_name: dispatchStudent.full_name,
        template_data: merged,
        scheduled_at: scheduledAt,
        source: "manual",
      });
      if (error) throw error;
      toast({
        title: dispatchScheduled ? "Agendado" : "Na fila",
        description: `${dispatchMeta.displayName} → ${dispatchStudent.email}`,
      });
      setDispatchStudent(null);
      setDispatchData({});
      setDispatchScheduled("");
      loadScheduled();
    } catch (e: any) {
      toast({ title: "Erro", description: e.message, variant: "destructive" });
    } finally {
      setDispatching(false);
    }
  }

  async function runNow() {
    setDispatching(true);
    try {
      const { error } = await supabase.functions.invoke("process-scheduled-emails", { body: {} });
      if (error) throw error;
      toast({ title: "Fila processada" });
      setTimeout(() => {
        loadScheduled();
        loadLogs();
      }, 1500);
    } catch (e: any) {
      toast({ title: "Erro", description: e.message, variant: "destructive" });
    } finally {
      setDispatching(false);
    }
  }

  async function cancelScheduled(id: string) {
    const { error } = await supabase
      .from("email_scheduled_sends")
      .update({ status: "cancelled", processed_at: new Date().toISOString() })
      .eq("id", id)
      .eq("status", "pending");
    if (error) {
      toast({ title: "Erro", description: error.message, variant: "destructive" });
      return;
    }
    toast({ title: "Cancelado" });
    loadScheduled();
  }

  const grouped = useMemo(
    () => ({
      auth: filtered.filter((t) => t.category === "auth"),
      transactional: filtered.filter((t) => t.category === "transactional"),
    }),
    [filtered],
  );

  function statusBadge(s: string | null) {
    const map: Record<string, string> = {
      sent: "bg-emerald-500/20 text-emerald-300 border-emerald-500/30",
      pending: "bg-amber-500/20 text-amber-300 border-amber-500/30",
      failed: "bg-red-500/20 text-red-300 border-red-500/30",
      dlq: "bg-red-500/20 text-red-300 border-red-500/30",
      suppressed: "bg-zinc-500/20 text-zinc-300 border-zinc-500/30",
      bounced: "bg-orange-500/20 text-orange-300 border-orange-500/30",
      complained: "bg-fuchsia-500/20 text-fuchsia-300 border-fuchsia-500/30",
    };
    return <Badge variant="outline" className={map[s || ""] || ""}>{s || "—"}</Badge>;
  }

  const renderRow = (t: EmailTemplateMeta) => {
    const s = settings[t.key];
    const enabled = s?.enabled ?? true;
    const auto = s?.auto_send ?? true;
    const customized = !!(s?.subject_override || s?.body_html_override);
    return (
      <Card key={t.key} className="border-border/50">
        <CardContent className="p-4">
          <div className="flex items-start justify-between gap-4 flex-wrap">
            <div className="flex-1 min-w-[260px]">
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="font-semibold">{t.displayName}</h3>
                <Badge variant="outline" className="text-[10px]">{t.key}</Badge>
                {customized && <Badge className="text-[10px] bg-primary/20 text-primary border-primary/30">Customizado</Badge>}
              </div>
              <p className="text-sm text-muted-foreground mt-1">{t.description}</p>
              <p className="text-xs text-muted-foreground mt-1">
                <span className="opacity-70">Gatilho:</span> {t.trigger}
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                <span className="opacity-70">Assunto:</span> {s?.subject_override || t.defaultSubject}
              </p>
              {t.variables.length > 0 && (
                <div className="flex flex-wrap gap-1 mt-2">
                  {t.variables.map((v) => (
                    <code key={v} className="text-[10px] bg-muted px-1.5 py-0.5 rounded">{`{${v}}`}</code>
                  ))}
                </div>
              )}
            </div>
            <div className="flex flex-col gap-2 min-w-[200px]">
              <div className="flex items-center justify-between gap-3">
                <Label className="text-xs">Ativo</Label>
                <Switch checked={enabled} onCheckedChange={(v) => toggle(t.key, "enabled", v)} />
              </div>
              <div className="flex items-center justify-between gap-3">
                <Label className="text-xs">Disparo automático</Label>
                <Switch checked={auto} onCheckedChange={(v) => toggle(t.key, "auto_send", v)} disabled={!enabled} />
              </div>
              <div className="flex gap-2 mt-1">
                <Button size="sm" variant="outline" onClick={() => openEdit(t)} className="flex-1">
                  <Edit3 className="h-3.5 w-3.5 mr-1" /> Editar
                </Button>
                <Button size="sm" variant="outline" onClick={() => openPreview(t)} className="flex-1">
                  <Eye className="h-3.5 w-3.5 mr-1" /> Preview
                </Button>
                <Button size="sm" variant="outline" onClick={() => setTestDialog(t)} className="flex-1">
                  <Send className="h-3.5 w-3.5 mr-1" /> Testar
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  };

  return (
    <div className="container mx-auto p-4 sm:p-6 space-y-6 max-w-6xl">
      <header className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-primary/10 border border-primary/20">
            <Mail className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">E-mails da plataforma</h1>
            <p className="text-sm text-muted-foreground">
              {EMAIL_TEMPLATES.length} templates · gerencie envio, conteúdo e automação
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <Button
            variant="outline"
            size="sm"
            onClick={() => toggleAll(true)}
            disabled={bulkBusy}
            className="border-emerald-500/40 text-emerald-400 hover:bg-emerald-500/10"
          >
            <Power className="h-4 w-4 mr-2" /> Ativar todos
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => toggleAll(false)}
            disabled={bulkBusy}
            className="border-red-500/40 text-red-400 hover:bg-red-500/10"
          >
            <PowerOff className="h-4 w-4 mr-2" /> Desativar todos
          </Button>
          <Button variant="outline" size="sm" onClick={() => { load(); loadLogs(); }}>
            <RefreshCw className="h-4 w-4 mr-2" /> Atualizar
          </Button>
        </div>
      </header>

      <Tabs defaultValue="templates" className="space-y-4">
        <TabsList>
          <TabsTrigger value="templates">Templates</TabsTrigger>
          <TabsTrigger value="dispatch">Disparo manual</TabsTrigger>
          <TabsTrigger value="scheduled">Agendamentos</TabsTrigger>
          <TabsTrigger value="history">Histórico de envios</TabsTrigger>
        </TabsList>

        <TabsContent value="templates" className="space-y-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar template..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>

          {loading ? (
            <p className="text-sm text-muted-foreground">Carregando...</p>
          ) : (
            <>
              <section>
                <h2 className="text-sm uppercase tracking-wide text-muted-foreground mb-3">
                  Autenticação ({grouped.auth.length})
                </h2>
                <div className="grid gap-3">{grouped.auth.map(renderRow)}</div>
              </section>
              <section>
                <h2 className="text-sm uppercase tracking-wide text-muted-foreground mb-3 mt-6">
                  Transacionais ({grouped.transactional.length})
                </h2>
                <div className="grid gap-3">{grouped.transactional.map(renderRow)}</div>
              </section>
            </>
          )}
        </TabsContent>

        <TabsContent value="history">
          <Card>
            <CardHeader>
              <CardTitle>Últimos 100 envios</CardTitle>
              <CardDescription>Atualizado em tempo real ao clicar em Atualizar.</CardDescription>
            </CardHeader>
            <CardContent className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Quando</TableHead>
                    <TableHead>Template</TableHead>
                    <TableHead>Destinatário</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Erro</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {logs.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center text-muted-foreground">
                        Nenhum envio registrado ainda.
                      </TableCell>
                    </TableRow>
                  )}
                  {logs.map((l) => (
                    <TableRow key={l.id}>
                      <TableCell className="text-xs whitespace-nowrap">
                        {new Date(l.created_at).toLocaleString("pt-BR")}
                      </TableCell>
                      <TableCell className="text-xs">{l.template_name}</TableCell>
                      <TableCell className="text-xs">{l.recipient_email}</TableCell>
                      <TableCell>{statusBadge(l.status)}</TableCell>
                      <TableCell className="text-xs text-red-400 max-w-[280px] truncate">
                        {l.error_message || ""}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="dispatch" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Disparar e-mail para um aluno</CardTitle>
              <CardDescription>
                Envia agora ou agenda para uma data futura. Use as variáveis abaixo para personalizar.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <Label>Template</Label>
                  <Select value={dispatchTemplate} onValueChange={(v) => { setDispatchTemplate(v); setDispatchData({}); }}>
                    <SelectTrigger><SelectValue placeholder="Escolha um template" /></SelectTrigger>
                    <SelectContent>
                      {EMAIL_TEMPLATES.map((t) => (
                        <SelectItem key={t.key} value={t.key}>{t.displayName}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Agendar para (opcional)</Label>
                  <Input
                    type="datetime-local"
                    value={dispatchScheduled}
                    onChange={(e) => setDispatchScheduled(e.target.value)}
                  />
                </div>
              </div>

              <div>
                <Label>Aluno</Label>
                <Input
                  placeholder="Buscar por nome ou e-mail..."
                  value={studentSearch}
                  onChange={(e) => setStudentSearch(e.target.value)}
                />
                {dispatchStudent ? (
                  <div className="mt-2 flex items-center justify-between p-2 rounded-md border border-primary/30 bg-primary/5">
                    <div className="text-sm">
                      <div className="font-medium">{dispatchStudent.full_name || "—"}</div>
                      <div className="text-xs text-muted-foreground">{dispatchStudent.email}</div>
                    </div>
                    <Button size="sm" variant="ghost" onClick={() => setDispatchStudent(null)}>
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ) : (
                  <div className="mt-2 max-h-48 overflow-y-auto border rounded-md divide-y divide-border/40">
                    {filteredStudents.length === 0 && (
                      <div className="p-3 text-xs text-muted-foreground">Nenhum aluno encontrado.</div>
                    )}
                    {filteredStudents.map((s) => (
                      <button
                        key={s.user_id}
                        onClick={() => setDispatchStudent(s)}
                        className="w-full text-left p-2 hover:bg-muted/40 text-sm"
                      >
                        <div className="font-medium">{s.full_name || "—"}</div>
                        <div className="text-xs text-muted-foreground">{s.email}</div>
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {dispatchMeta && dispatchVarKeys.length > 0 && (
                <div className="space-y-2">
                  <Label>Variáveis</Label>
                  <div className="grid sm:grid-cols-2 gap-2">
                    {dispatchVarKeys.map((k) => (
                      <div key={k}>
                        <Label className="text-[11px] text-muted-foreground">{`{${k}}`}</Label>
                        <Input
                          value={dispatchData[k] ?? ""}
                          onChange={(e) => setDispatchData((d) => ({ ...d, [k]: e.target.value }))}
                          placeholder={
                            (settings[dispatchMeta.key]?.custom_variables || []).find((v) => v.key === k)?.defaultValue || ""
                          }
                        />
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="flex gap-2 justify-end">
                <Button variant="outline" onClick={runNow} disabled={dispatching}>
                  <RefreshCw className="h-4 w-4 mr-2" /> Processar fila agora
                </Button>
                <Button onClick={submitDispatch} disabled={dispatching || !dispatchMeta || !dispatchStudent}>
                  {dispatchScheduled ? <CalendarIcon className="h-4 w-4 mr-2" /> : <Send className="h-4 w-4 mr-2" />}
                  {dispatchScheduled ? "Agendar" : "Enviar agora"}
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="scheduled">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Agendamentos e disparos manuais</CardTitle>
                <CardDescription>Inclui envios automáticos via regras de automação.</CardDescription>
              </div>
              <Button size="sm" variant="outline" onClick={loadScheduled}>
                <RefreshCw className="h-4 w-4 mr-2" /> Atualizar
              </Button>
            </CardHeader>
            <CardContent className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Quando</TableHead>
                    <TableHead>Template</TableHead>
                    <TableHead>Destinatário</TableHead>
                    <TableHead>Origem</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {scheduled.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center text-muted-foreground">
                        Nenhum agendamento.
                      </TableCell>
                    </TableRow>
                  )}
                  {scheduled.map((r) => (
                    <TableRow key={r.id}>
                      <TableCell className="text-xs whitespace-nowrap">
                        {new Date(r.scheduled_at).toLocaleString("pt-BR")}
                      </TableCell>
                      <TableCell className="text-xs">{r.template_key}</TableCell>
                      <TableCell className="text-xs">
                        <div>{r.recipient_name || "—"}</div>
                        <div className="text-muted-foreground">{r.recipient_email}</div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className="text-[10px]">{r.source}</Badge>
                      </TableCell>
                      <TableCell>{statusBadge(r.status)}</TableCell>
                      <TableCell>
                        {r.status === "pending" && (
                          <Button size="sm" variant="ghost" onClick={() => cancelScheduled(r.id)}>
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <Dialog open={!!editing} onOpenChange={(o) => !o && setEditing(null)}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editing?.displayName}</DialogTitle>
            <DialogDescription>
              Sobrescreva o assunto e/ou o corpo. Deixe em branco para usar o template padrão.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Assunto</Label>
              <Input
                value={editSubject}
                onChange={(e) => setEditSubject(e.target.value)}
                placeholder={editing?.defaultSubject}
              />
            </div>
            <div>
              <Label>Corpo (HTML) — opcional</Label>
              <Textarea
                value={editBody}
                onChange={(e) => setEditBody(e.target.value)}
                placeholder="Deixe vazio para usar o template padrão. Use {variavel} para inserir dados."
                rows={10}
                className="font-mono text-xs"
              />
              {editing && (
                <p className="text-xs text-muted-foreground mt-1">
                  Variáveis disponíveis:{" "}
                  {editing.variables.map((v) => (
                    <code key={v} className="bg-muted px-1 rounded mr-1">{`{${v}}`}</code>
                  ))}
                </p>
              )}
            </div>

            <div className="space-y-2 border-t border-border/40 pt-4">
              <div className="flex items-center justify-between">
                <Label className="flex items-center gap-2">
                  <Plus className="h-3.5 w-3.5" /> Variáveis customizadas
                </Label>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => setEditVars((v) => [...v, { key: "", label: "", defaultValue: "" }])}
                >
                  + Adicionar
                </Button>
              </div>
              {editVars.length === 0 && (
                <p className="text-xs text-muted-foreground">Nenhuma variável extra. Use as padrões acima.</p>
              )}
              {editVars.map((v, idx) => (
                <div key={idx} className="grid grid-cols-[1fr_1fr_1fr_auto] gap-2 items-center">
                  <Input
                    placeholder="chave (ex: cupom)"
                    value={v.key}
                    onChange={(e) =>
                      setEditVars((arr) => arr.map((x, i) => (i === idx ? { ...x, key: e.target.value } : x)))
                    }
                  />
                  <Input
                    placeholder="rótulo"
                    value={v.label}
                    onChange={(e) =>
                      setEditVars((arr) => arr.map((x, i) => (i === idx ? { ...x, label: e.target.value } : x)))
                    }
                  />
                  <Input
                    placeholder="valor padrão"
                    value={v.defaultValue}
                    onChange={(e) =>
                      setEditVars((arr) => arr.map((x, i) => (i === idx ? { ...x, defaultValue: e.target.value } : x)))
                    }
                  />
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => setEditVars((arr) => arr.filter((_, i) => i !== idx))}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>

            <div className="space-y-2 border-t border-border/40 pt-4">
              <Label className="flex items-center gap-2">
                <Zap className="h-3.5 w-3.5" /> Automação
              </Label>
              <div className="grid grid-cols-[1fr_120px] gap-2">
                <Select value={editAutoType} onValueChange={setEditAutoType}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Sem automação</SelectItem>
                    <SelectItem value="inactivity_days">Após N dias sem login</SelectItem>
                    <SelectItem value="before_expiry_days">N dias antes do vencimento</SelectItem>
                    <SelectItem value="after_expiry_days">N dias após o vencimento</SelectItem>
                  </SelectContent>
                </Select>
                <Input
                  type="number"
                  min={0}
                  value={editAutoDays}
                  onChange={(e) => setEditAutoDays(Number(e.target.value))}
                  disabled={editAutoType === "none"}
                />
              </div>
              <p className="text-[11px] text-muted-foreground">
                O job de automação roda 1x por dia e cria envios na fila de agendamentos.
              </p>
            </div>

            <div>
              <Label>Notas internas</Label>
              <Textarea value={editNotes} onChange={(e) => setEditNotes(e.target.value)} rows={2} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditing(null)}>Cancelar</Button>
            <Button onClick={saveEdit} disabled={saving}>
              <Save className="h-4 w-4 mr-2" /> {saving ? "Salvando..." : "Salvar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={!!testDialog} onOpenChange={(o) => !o && setTestDialog(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Enviar e-mail de teste</DialogTitle>
            <DialogDescription>
              {testDialog?.displayName} será enviado com dados fictícios.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2">
            <Label>E-mail destinatário</Label>
            <Input
              type="email"
              value={testEmail}
              onChange={(e) => setTestEmail(e.target.value)}
              placeholder="voce@exemplo.com"
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setTestDialog(null)}>Cancelar</Button>
            <Button onClick={sendTest} disabled={sending || !testEmail}>
              <Send className="h-4 w-4 mr-2" /> {sending ? "Enviando..." : "Enviar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={!!previewTpl} onOpenChange={(o) => !o && setPreviewTpl(null)}>
        <DialogContent className="max-w-3xl max-h-[92vh] overflow-hidden flex flex-col">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Eye className="h-4 w-4" /> Pré-visualização — {previewTpl?.displayName}
            </DialogTitle>
            <DialogDescription>
              Assunto: <span className="font-medium text-foreground">{previewSubject}</span>
            </DialogDescription>
          </DialogHeader>
          <div className="flex-1 overflow-hidden rounded-md border border-border/40 bg-white">
            <iframe
              title="email-preview"
              srcDoc={previewHtml}
              className="w-full h-[60vh] bg-white"
              sandbox=""
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setPreviewTpl(null)}>Fechar</Button>
            {previewTpl && (
              <Button onClick={() => { const t = previewTpl; setPreviewTpl(null); setTestDialog(t); }}>
                <Send className="h-4 w-4 mr-2" /> Enviar teste
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}