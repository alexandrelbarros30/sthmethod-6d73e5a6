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
import { Mail, Send, Save, Edit3, Search, RefreshCw } from "lucide-react";

interface Settings {
  template_key: string;
  enabled: boolean;
  auto_send: boolean;
  subject_override: string | null;
  body_html_override: string | null;
  notes: string | null;
  updated_at: string;
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

export default function AdminEmails() {
  const [settings, setSettings] = useState<Record<string, Settings>>({});
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [editing, setEditing] = useState<EmailTemplateMeta | null>(null);
  const [editSubject, setEditSubject] = useState("");
  const [editBody, setEditBody] = useState("");
  const [editNotes, setEditNotes] = useState("");
  const [saving, setSaving] = useState(false);
  const [logs, setLogs] = useState<LogRow[]>([]);
  const [testDialog, setTestDialog] = useState<EmailTemplateMeta | null>(null);
  const [testEmail, setTestEmail] = useState("");
  const [sending, setSending] = useState(false);

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

  useEffect(() => {
    load();
    loadLogs();
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

  function openEdit(t: EmailTemplateMeta) {
    const s = settings[t.key];
    setEditing(t);
    setEditSubject(s?.subject_override ?? "");
    setEditBody(s?.body_html_override ?? "");
    setEditNotes(s?.notes ?? "");
  }

  async function saveEdit() {
    if (!editing) return;
    setSaving(true);
    const { error } = await supabase
      .from("email_template_settings")
      .update({
        subject_override: editSubject.trim() || null,
        body_html_override: editBody.trim() || null,
        notes: editNotes.trim() || null,
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
        <Button variant="outline" size="sm" onClick={() => { load(); loadLogs(); }}>
          <RefreshCw className="h-4 w-4 mr-2" /> Atualizar
        </Button>
      </header>

      <Tabs defaultValue="templates" className="space-y-4">
        <TabsList>
          <TabsTrigger value="templates">Templates</TabsTrigger>
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
      </Tabs>

      <Dialog open={!!editing} onOpenChange={(o) => !o && setEditing(null)}>
        <DialogContent className="max-w-2xl">
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
    </div>
  );
}