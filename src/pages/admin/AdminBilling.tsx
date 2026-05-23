import { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import DashboardLayout from "@/components/DashboardLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import { sendSystemTemplate, SystemTemplateKey, getSystemTemplate, renderTemplate, buildWhatsAppUrl } from "@/lib/system-templates";
import { Send, CheckCircle2, Clock, MessageSquare, AlertTriangle, RefreshCcw, Zap, Pencil, Paperclip, X, FileText, Image as ImageIcon, Loader2 } from "lucide-react";

type RoleArea = "admin" | "consultor" | "financeiro";
interface Props { area: RoleArea }

type StatusKey =
  | "overdue" | "awaiting_payment" | "contacted" | "negotiating"
  | "renewed" | "declined" | "inactive" | "ignored";

const STATUS_LABELS: Record<StatusKey, string> = {
  overdue: "Vencido",
  awaiting_payment: "Aguardando pagamento",
  contacted: "Cobrança enviada",
  negotiating: "Em negociação",
  renewed: "Renovado",
  declined: "Não deseja renovar",
  inactive: "Inativo",
  ignored: "Ignorar temporariamente",
};

const STATUS_COLORS: Record<StatusKey, string> = {
  overdue: "bg-red-500/15 text-red-500 border-red-500/30",
  awaiting_payment: "bg-amber-500/15 text-amber-500 border-amber-500/30",
  contacted: "bg-blue-500/15 text-blue-500 border-blue-500/30",
  negotiating: "bg-violet-500/15 text-violet-500 border-violet-500/30",
  renewed: "bg-emerald-500/15 text-emerald-500 border-emerald-500/30",
  declined: "bg-zinc-500/15 text-zinc-500 border-zinc-500/30",
  inactive: "bg-zinc-500/15 text-zinc-500 border-zinc-500/30",
  ignored: "bg-zinc-500/15 text-zinc-500 border-zinc-500/30",
};

const TEMPLATES: Array<{ key: SystemTemplateKey; label: string }> = [
  { key: "renewal_soft" as SystemTemplateKey, label: "Renovação leve" },
  { key: "renewal_objective" as SystemTemplateKey, label: "Renovação objetiva" },
  { key: "renewal_recovery" as SystemTemplateKey, label: "Recuperação" },
  { key: "renewal_last_contact" as SystemTemplateKey, label: "Último contato" },
];

const FILTERS = [
  { key: "all", label: "Todos vencidos", min: 1, max: 99999 },
  { key: "1-7", label: "1 a 7 dias", min: 1, max: 7 },
  { key: "8-15", label: "8 a 15 dias", min: 8, max: 15 },
  { key: "16-30", label: "16 a 30 dias", min: 16, max: 30 },
  { key: "31-60", label: "31 a 60 dias", min: 31, max: 60 },
  { key: "60+", label: "Mais de 60 dias", min: 61, max: 99999 },
];

const parsePrice = (p?: string | null): number => {
  if (!p) return 0;
  const n = parseFloat(String(p).replace(/[^\d,.-]/g, "").replace(/\./g, "").replace(",", "."));
  return isNaN(n) ? 0 : n;
};

const daysSince = (date: string): number => {
  const d = new Date(date + "T00:00:00");
  return Math.floor((Date.now() - d.getTime()) / 86400000);
};

const priorityOf = (days: number): "alta" | "media" | "baixa" => {
  if (days <= 15) return "alta";
  if (days <= 30) return "media";
  return "baixa";
};

/** Detect obviously invalid/test phones (e.g. 22222-2222, 99999-9999). */
const isValidPhone = (phone?: string | null): boolean => {
  if (!phone) return false;
  const digits = phone.replace(/\D/g, "");
  if (digits.length < 10 || digits.length > 13) return false;
  // reject if all digits are the same (e.g. 2122222222)
  const local = digits.startsWith("55") ? digits.slice(2) : digits;
  if (/^(\d)\1+$/.test(local.slice(2))) return false; // body repeated
  if (/^(\d)\1{7,}$/.test(local)) return false;
  return true;
};

const AdminBilling = ({ area }: Props) => {
  const { user } = useAuth();
  const qc = useQueryClient();
  const [filter, setFilter] = useState("all");
  const [customDays, setCustomDays] = useState<string>("");
  const [search, setSearch] = useState("");
  const [selectedTemplate, setSelectedTemplate] = useState<SystemTemplateKey>("renewal_soft" as SystemTemplateKey);
  const [editing, setEditing] = useState<any | null>(null);
  const [autoSend, setAutoSend] = useState(false);
  const [bulkSending, setBulkSending] = useState(false);
  const [bulkProgress, setBulkProgress] = useState<{ done: number; total: number } | null>(null);
  const [composer, setComposer] = useState<{ row: any; message: string; templateId: string; imageUrl: string | null; documentUrl: string | null; documentName: string | null } | null>(null);
  const [composerSending, setComposerSending] = useState(false);
  const [uploadingAttachment, setUploadingAttachment] = useState(false);
  const [profileEdit, setProfileEdit] = useState<{ user_id: string; full_name: string; phone: string; email: string } | null>(null);
  const [profileSaving, setProfileSaving] = useState(false);

  const { data, isLoading } = useQuery({
    queryKey: ["billing-overdue", area, user?.id],
    queryFn: async () => {
      // Get linked students for consultor
      let allowedIds: string[] | null = null;
      if (area === "consultor" && user?.id) {
        const { data: links } = await supabase
          .from("consultant_students")
          .select("student_id")
          .eq("consultant_id", user.id);
        allowedIds = (links || []).map((l) => l.student_id);
        if (allowedIds.length === 0) return { rows: [], recovered: 0 };
      }

      // Latest subscription per user (we'll grab a generous batch and reduce client-side)
      let subQ = supabase
        .from("subscriptions")
        .select("user_id, plan_id, start_date, end_date, status")
        .order("end_date", { ascending: false })
        .limit(1000);
      if (allowedIds) subQ = subQ.in("user_id", allowedIds);
      const { data: subs } = await subQ;

      const latestByUser = new Map<string, any>();
      for (const s of subs || []) {
        if (!latestByUser.has(s.user_id)) latestByUser.set(s.user_id, s);
      }

      const today = new Date(); today.setHours(0, 0, 0, 0);
      // Users with ANY active (non-expired) subscription should NOT appear in billing,
      // even if the LATEST row happens to be expired (paranoid fallback after a payment).
      const hasActiveByUser = new Set<string>();
      for (const s of subs || []) {
        const end = new Date(s.end_date + "T00:00:00");
        if (end.getTime() >= today.getTime()) hasActiveByUser.add(s.user_id);
      }
      const overdue = Array.from(latestByUser.values()).filter((s) => {
        if (hasActiveByUser.has(s.user_id)) return false;
        const end = new Date(s.end_date + "T00:00:00");
        return end.getTime() < today.getTime();
      });

      const userIds = overdue.map((s) => s.user_id);
      const planIds = Array.from(new Set(overdue.map((s) => s.plan_id)));

      const [profilesRes, plansRes, actionsRes, paymentsRes] = await Promise.all([
        userIds.length
          ? supabase.from("profiles").select("user_id, full_name, phone, email").in("user_id", userIds)
          : Promise.resolve({ data: [] as any[] }),
        planIds.length
          ? supabase.from("plans").select("id, name, price").in("id", planIds)
          : Promise.resolve({ data: [] as any[] }),
        userIds.length
          ? supabase.from("billing_actions").select("*").in("user_id", userIds)
          : Promise.resolve({ data: [] as any[] }),
        userIds.length
          ? supabase.from("payments")
              .select("user_id, status, created_at")
              .in("user_id", userIds)
              .eq("status", "approved")
              .gte("created_at", new Date(Date.now() - 7 * 86400000).toISOString())
          : Promise.resolve({ data: [] as any[] }),
      ]);

      const pMap = new Map((profilesRes.data || []).map((p: any) => [p.user_id, p]));
      const planMap = new Map((plansRes.data || []).map((p: any) => [p.id, p]));
      const aMap = new Map((actionsRes.data || []).map((a: any) => [a.user_id, a]));
      // Exclude users with an approved payment in the last 7 days (just renewed).
      const recentlyPaid = new Set((paymentsRes.data || []).map((p: any) => p.user_id));

      const rows = overdue.filter((s) => !recentlyPaid.has(s.user_id)).map((s) => {
        const days = daysSince(s.end_date);
        const profile = pMap.get(s.user_id) || {};
        const plan = planMap.get(s.plan_id) || {};
        const action = aMap.get(s.user_id) || null;
        const stored = action?.status as StatusKey | undefined;
        const status: StatusKey = stored || "overdue";
        return {
          user_id: s.user_id,
          full_name: profile.full_name || "Sem nome",
          phone: profile.phone || "",
          email: profile.email || "",
          plan_name: plan.name || "—",
          plan_price: parsePrice(plan.price),
          start_date: s.start_date,
          end_date: s.end_date,
          days,
          status,
          action,
          priority: priorityOf(days),
          phone_valid: isValidPhone(profile.phone),
        };
      });

      // Renewals recovered this month: count billing_actions w/ status renewed updated this month
      const monthStart = new Date(); monthStart.setDate(1); monthStart.setHours(0, 0, 0, 0);
      let recoveredQ = supabase
        .from("billing_actions")
        .select("user_id", { count: "exact", head: true })
        .eq("status", "renewed")
        .gte("updated_at", monthStart.toISOString());
      if (allowedIds) recoveredQ = recoveredQ.in("user_id", allowedIds);
      const { count: recovered } = await recoveredQ;

      return { rows, recovered: recovered || 0 };
    },
    enabled: !!user,
  });

  const rows = data?.rows || [];

  const filtered = useMemo(() => {
    const f = FILTERS.find((x) => x.key === filter)!;
    let min = f.min, max = f.max;
    const cd = parseInt(customDays);
    if (!isNaN(cd) && cd > 0) { min = cd; max = 99999; }
    return rows.filter((r) => {
      if (r.days < min || r.days > max) return false;
      if (search && !r.full_name.toLowerCase().includes(search.toLowerCase())) return false;
      // Hide ignored entries with active ignore_until in future
      if (r.action?.ignore_until && new Date(r.action.ignore_until) >= new Date()) {
        return filter !== "all" ? false : true;
      }
      return true;
    });
  }, [rows, filter, customDays, search]);

  const summary = useMemo(() => {
    const total = rows.length;
    const d7 = rows.filter(r => r.days >= 1 && r.days <= 7).length;
    const d15 = rows.filter(r => r.days >= 8 && r.days <= 15).length;
    const d30 = rows.filter(r => r.days >= 16 && r.days <= 30).length;
    const d60 = rows.filter(r => r.days > 60).length;
    const openValue = rows.filter(r => r.status !== "renewed" && r.status !== "declined" && r.status !== "inactive")
      .reduce((sum, r) => sum + r.plan_price, 0);
    return { total, d7, d15, d30, d60, openValue };
  }, [rows]);

  const upsertAction = useMutation({
    mutationFn: async (payload: any) => {
      const { error } = await supabase
        .from("billing_actions")
        .upsert({ ...payload, updated_at: new Date().toISOString() }, { onConflict: "user_id" });
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["billing-overdue"] }),
  });

  const handleSendBilling = async (row: any) => {
    if (!row.phone) { toast.error("Aluno sem telefone cadastrado"); return; }
    if (!isValidPhone(row.phone)) {
      toast.error(`Telefone inválido (${row.phone}). Atualize o cadastro antes de enviar.`);
      return;
    }
    const tpl = await getSystemTemplate(selectedTemplate);
    if (!tpl) { toast.error("Template não encontrado"); return; }
    const rendered = renderTemplate(tpl.content, {
      full_name: row.full_name, phone: row.phone, email: row.email,
      user_id: row.user_id, end_date: row.end_date,
    });
    setComposer({ row, message: rendered, templateId: tpl.id, imageUrl: tpl.image_url || null });
  };

  const handleComposerSend = async () => {
    if (!composer) return;
    const { row, message, templateId, imageUrl } = composer;
    if (!message.trim()) { toast.error("Mensagem vazia"); return; }
    setComposerSending(true);
    const AUTO_FOOTER = "\n\n———\n🔔 Comunicação automática STH METHOD\nMensagem enviada automaticamente pelo sistema.\nNão é necessário responder.";
    const finalMessage = message.includes("Comunicação automática STH METHOD") ? message : `${message}${AUTO_FOOTER}`;

    let deliveryStatus: "sent" | "failed" = "sent";
    let autoOk = false;
    try {
      const { data, error } = await supabase.functions.invoke("send-whatsapp", {
        body: { phone: row.phone, message: finalMessage, image_url: imageUrl },
      });
      if (error) throw error;
      if (data?.ok) autoOk = true;
    } catch (err) {
      console.error("send-whatsapp error", err);
    }
    if (!autoOk) {
      deliveryStatus = "failed";
      const url = buildWhatsAppUrl(row.phone, imageUrl ? `${finalMessage}\n\n${imageUrl}` : finalMessage);
      if (url) window.open(url, "_blank");
    }
    try {
      await supabase.from("message_history").insert({
        user_id: row.user_id, content: finalMessage, recipient_phone: row.phone,
        recipient_name: row.full_name, template_id: templateId, image_url: imageUrl,
        status: deliveryStatus, sent_at: new Date().toISOString(),
      });
    } catch (e) { console.error(e); }
    await upsertAction.mutateAsync({
      user_id: row.user_id, status: "contacted", assigned_to: user?.id,
      attempts: (row.action?.attempts || 0) + 1,
      last_template: selectedTemplate,
      last_contact_at: new Date().toISOString(),
    });
    setComposerSending(false);
    setComposer(null);
    toast.success(autoOk
      ? `Cobrança enviada para ${row.full_name.split(" ")[0]}`
      : `Aberto WhatsApp manual para ${row.full_name.split(" ")[0]}`);
  };

  const handleMarkRenewed = async (row: any) => {
    await upsertAction.mutateAsync({ user_id: row.user_id, status: "renewed", assigned_to: user?.id });
    toast.success("Marcado como renovado");
  };

  const handleIgnore = async (row: any) => {
    const until = new Date(); until.setDate(until.getDate() + 7);
    await upsertAction.mutateAsync({
      user_id: row.user_id, status: "ignored",
      ignore_until: until.toISOString().slice(0, 10),
      assigned_to: user?.id,
    });
    toast.success("Ignorado por 7 dias");
  };

  const handleBulkSend = async () => {
    const targets = filtered.filter((r) => r.phone && isValidPhone(r.phone) && r.status !== "renewed" && r.status !== "declined" && r.status !== "inactive");
    if (targets.length === 0) { toast.error("Nenhum aluno elegível no filtro atual."); return; }
    if (!autoSend) {
      toast.error("Ative a chave de envio automático para disparar em massa.");
      return;
    }
    const periodo = FILTERS.find((f) => f.key === filter)?.label || "filtro atual";
    if (!window.confirm(`Enviar cobrança "${TEMPLATES.find(t=>t.key===selectedTemplate)?.label}" para ${targets.length} aluno(s) (${periodo})?`)) return;

    setBulkSending(true);
    setBulkProgress({ done: 0, total: targets.length });
    let ok = 0, fail = 0;
    for (let i = 0; i < targets.length; i++) {
      const row = targets[i];
      try {
        const res = await sendSystemTemplate(selectedTemplate, {
          full_name: row.full_name, phone: row.phone, email: row.email,
          user_id: row.user_id, end_date: row.end_date,
        }, { logHistory: true, mode: "auto" });
        if (res.ok) {
          ok++;
          await upsertAction.mutateAsync({
            user_id: row.user_id, status: "contacted", assigned_to: user?.id,
            attempts: (row.action?.attempts || 0) + 1,
            last_template: selectedTemplate,
            last_contact_at: new Date().toISOString(),
          });
        } else { fail++; }
      } catch { fail++; }
      setBulkProgress({ done: i + 1, total: targets.length });
      // Throttle to avoid Z-API rate limits
      await new Promise((r) => setTimeout(r, 1200));
    }
    setBulkSending(false);
    setBulkProgress(null);
    toast.success(`Envio em massa concluído: ${ok} enviadas, ${fail} falhas.`);
    qc.invalidateQueries({ queryKey: ["billing-overdue"] });
  };

  const role = area === "consultor" ? "consultor" : area === "financeiro" ? "financeiro" : "admin";

  return (
    <DashboardLayout role={role as any} title="Cobranças e Renovações" subtitle="Recupere alunos vencidos com filtros inteligentes e mensagens automáticas">
      <div className="space-y-6">
        {/* Summary cards */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
          {[
            { label: "Total vencidos", value: summary.total, icon: AlertTriangle, color: "text-red-500" },
            { label: "Até 7 dias", value: summary.d7, icon: Clock, color: "text-amber-500" },
            { label: "8 a 15 dias", value: summary.d15, icon: Clock, color: "text-amber-500" },
            { label: "16 a 30 dias", value: summary.d30, icon: Clock, color: "text-orange-500" },
            { label: "60+ dias", value: summary.d60, icon: AlertTriangle, color: "text-zinc-500" },
            { label: "Recuperados/mês", value: data?.recovered || 0, icon: CheckCircle2, color: "text-emerald-500" },
          ].map((c) => (
            <Card key={c.label}><CardContent className="p-4">
              <div className="flex items-center justify-between">
                <p className="text-[11px] uppercase tracking-wide text-muted-foreground">{c.label}</p>
                <c.icon className={`w-4 h-4 ${c.color}`} />
              </div>
              <p className="text-2xl font-semibold mt-1">{c.value}</p>
            </CardContent></Card>
          ))}
        </div>

        <Card><CardContent className="p-4">
          <p className="text-xs text-muted-foreground">Valor estimado em aberto</p>
          <p className="text-3xl font-semibold text-emerald-500">
            R$ {summary.openValue.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </p>
        </CardContent></Card>

        {/* Filters */}
        <Card><CardContent className="p-4 space-y-3">
          <div className="flex flex-wrap gap-2">
            {FILTERS.map((f) => (
              <Button key={f.key} size="sm" variant={filter === f.key ? "default" : "outline"}
                onClick={() => { setFilter(f.key); setCustomDays(""); }}>
                {f.label}
              </Button>
            ))}
          </div>
          <div className="flex flex-wrap gap-2 items-center">
            <Input className="max-w-xs" placeholder="Buscar por nome..." value={search} onChange={(e) => setSearch(e.target.value)} />
            <Input className="max-w-[180px]" type="number" placeholder="Dias mín. (personalizado)"
              value={customDays} onChange={(e) => setCustomDays(e.target.value)} />
            <Select value={selectedTemplate} onValueChange={(v) => setSelectedTemplate(v as SystemTemplateKey)}>
              <SelectTrigger className="max-w-xs"><SelectValue /></SelectTrigger>
              <SelectContent>
                {TEMPLATES.map((t) => (
                  <SelectItem key={t.key} value={t.key}>{t.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button size="sm" variant="ghost" onClick={() => qc.invalidateQueries({ queryKey: ["billing-overdue"] })}>
              <RefreshCcw className="w-4 h-4 mr-1" /> Atualizar
            </Button>
          </div>

          {/* Bulk send */}
          <div className="flex flex-wrap items-center gap-3 pt-3 border-t">
            <div className="flex items-center gap-2">
              <Switch id="auto-send" checked={autoSend} onCheckedChange={setAutoSend} />
              <label htmlFor="auto-send" className="text-sm font-medium cursor-pointer flex items-center gap-1.5">
                <Zap className={`w-4 h-4 ${autoSend ? "text-emerald-500" : "text-muted-foreground"}`} />
                Chave de envio automático
              </label>
            </div>
            <Button
              size="sm"
              variant={autoSend ? "default" : "outline"}
              onClick={handleBulkSend}
              disabled={bulkSending || !autoSend || filtered.length === 0}
            >
              <Send className="w-4 h-4 mr-1" />
              {bulkSending && bulkProgress
                ? `Enviando ${bulkProgress.done}/${bulkProgress.total}...`
                : `Envio em massa (${filtered.filter(r => r.phone).length})`}
            </Button>
            <p className="text-xs text-muted-foreground">
              Dispara o template selecionado para todos os alunos do período filtrado.
            </p>
          </div>
        </CardContent></Card>

        {/* Table */}
        <Card><CardContent className="p-0">
          {isLoading ? (
            <div className="p-10 text-center text-muted-foreground">Carregando...</div>
          ) : filtered.length === 0 ? (
            <div className="p-10 text-center text-muted-foreground">Nenhum aluno encontrado nesse filtro.</div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Aluno</TableHead>
                  <TableHead>Plano</TableHead>
                  <TableHead>Vencimento</TableHead>
                  <TableHead>Dias</TableHead>
                  <TableHead>Prioridade</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Último contato</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((r) => (
                  <TableRow key={r.user_id}>
                    <TableCell>
                      <button
                        type="button"
                        className="font-medium text-left hover:underline hover:text-primary transition-colors"
                        onClick={() => setProfileEdit({ user_id: r.user_id, full_name: r.full_name, phone: r.phone || "", email: r.email || "" })}
                        title="Editar cadastro"
                      >
                        {r.full_name}
                      </button>
                      <div className={`text-xs ${r.phone && !r.phone_valid ? "text-red-500 font-medium" : "text-muted-foreground"}`}>
                        {r.phone ? (r.phone_valid ? r.phone : `⚠ ${r.phone} (inválido)`) : "sem telefone"}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div>{r.plan_name}</div>
                      <div className="text-xs text-muted-foreground">R$ {r.plan_price.toFixed(2)}</div>
                    </TableCell>
                    <TableCell className="text-sm">{new Date(r.end_date + "T00:00:00").toLocaleDateString("pt-BR")}</TableCell>
                    <TableCell className="text-sm font-medium">{r.days}d</TableCell>
                    <TableCell>
                      <Badge variant="outline" className={
                        r.priority === "alta" ? "border-red-500/40 text-red-500"
                        : r.priority === "media" ? "border-amber-500/40 text-amber-500"
                        : "border-zinc-500/40 text-zinc-500"
                      }>{r.priority}</Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className={STATUS_COLORS[r.status]}>{STATUS_LABELS[r.status]}</Badge>
                      {r.action?.attempts ? <span className="ml-2 text-xs text-muted-foreground">{r.action.attempts}x</span> : null}
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground">
                      {r.action?.last_contact_at ? new Date(r.action.last_contact_at).toLocaleDateString("pt-BR") : "—"}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-1">
                        <Button size="sm" variant="default" onClick={() => handleSendBilling(r)} disabled={!r.phone || !r.phone_valid}>
                          <Send className="w-3.5 h-3.5 mr-1" /> Cobrar
                        </Button>
                        <Button size="sm" variant="outline" onClick={() => handleMarkRenewed(r)}>
                          <CheckCircle2 className="w-3.5 h-3.5 mr-1" /> Renovou
                        </Button>
                        <Button size="sm" variant="ghost" onClick={() => handleIgnore(r)}>Ignorar</Button>
                        <Button size="sm" variant="ghost" onClick={() => setEditing(r)}>
                          <MessageSquare className="w-3.5 h-3.5" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent></Card>
      </div>

      {/* Edit dialog */}
      <Dialog open={!!editing} onOpenChange={(o) => !o && setEditing(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>{editing?.full_name}</DialogTitle></DialogHeader>
          {editing && (
            <div className="space-y-3">
              <div>
                <label className="text-xs text-muted-foreground">Status</label>
                <Select
                  value={editing.status}
                  onValueChange={(v) => setEditing({ ...editing, status: v })}
                >
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {(Object.keys(STATUS_LABELS) as StatusKey[]).map((k) => (
                      <SelectItem key={k} value={k}>{STATUS_LABELS[k]}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-xs text-muted-foreground">Observações</label>
                <Textarea
                  rows={4}
                  value={editing.action?.observations || ""}
                  onChange={(e) => setEditing({ ...editing, action: { ...(editing.action || {}), observations: e.target.value } })}
                />
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditing(null)}>Cancelar</Button>
            <Button onClick={async () => {
              if (!editing) return;
              await upsertAction.mutateAsync({
                user_id: editing.user_id,
                status: editing.status,
                observations: editing.action?.observations || "",
                assigned_to: user?.id,
              });
              toast.success("Salvo");
              setEditing(null);
            }}>Salvar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Composer dialog – edit before send */}
      <Dialog open={!!composer} onOpenChange={(o) => !o && !composerSending && setComposer(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Pencil className="w-4 h-4" /> Revisar cobrança — {composer?.row?.full_name}
            </DialogTitle>
          </DialogHeader>
          {composer && (
            <div className="space-y-3">
              <div className="text-xs text-muted-foreground">
                Para: <span className="font-medium text-foreground">{composer.row.phone}</span>
              </div>
              <div>
                <label className="text-xs text-muted-foreground">Template</label>
                <Select
                  value={selectedTemplate}
                  onValueChange={async (v) => {
                    const key = v as SystemTemplateKey;
                    setSelectedTemplate(key);
                    const tpl = await getSystemTemplate(key);
                    if (!tpl || !composer) return;
                    const rendered = renderTemplate(tpl.content, {
                      full_name: composer.row.full_name, phone: composer.row.phone,
                      email: composer.row.email, user_id: composer.row.user_id,
                      end_date: composer.row.end_date,
                    });
                    setComposer({ ...composer, message: rendered, templateId: tpl.id, imageUrl: tpl.image_url || null });
                  }}
                >
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {TEMPLATES.map((t) => (
                      <SelectItem key={t.key} value={t.key}>{t.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <Textarea
                rows={14}
                value={composer.message}
                onChange={(e) => setComposer({ ...composer, message: e.target.value })}
                className="font-mono text-sm"
              />
              <p className="text-[11px] text-muted-foreground">
                O rodapé "🔔 Comunicação automática STH METHOD" será adicionado automaticamente se ainda não estiver no texto.
              </p>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setComposer(null)} disabled={composerSending}>Cancelar</Button>
            <Button onClick={handleComposerSend} disabled={composerSending}>
              <Send className="w-4 h-4 mr-1" />
              {composerSending ? "Enviando..." : "Enviar agora"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Quick profile edit dialog */}
      <Dialog open={!!profileEdit} onOpenChange={(o) => !o && !profileSaving && setProfileEdit(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Atualizar cadastro</DialogTitle>
          </DialogHeader>
          {profileEdit && (
            <div className="space-y-3">
              <div>
                <label className="text-xs text-muted-foreground">Nome completo</label>
                <Input value={profileEdit.full_name} onChange={(e) => setProfileEdit({ ...profileEdit, full_name: e.target.value })} />
              </div>
              <div>
                <label className="text-xs text-muted-foreground">Telefone (WhatsApp)</label>
                <Input
                  value={profileEdit.phone}
                  onChange={(e) => setProfileEdit({ ...profileEdit, phone: e.target.value })}
                  placeholder="(xx) xxxxx-xxxx"
                />
                {profileEdit.phone && !isValidPhone(profileEdit.phone) && (
                  <p className="text-xs text-red-500 mt-1">⚠ Telefone parece inválido</p>
                )}
              </div>
              <div>
                <label className="text-xs text-muted-foreground">Email</label>
                <Input type="email" value={profileEdit.email} onChange={(e) => setProfileEdit({ ...profileEdit, email: e.target.value })} />
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setProfileEdit(null)} disabled={profileSaving}>Cancelar</Button>
            <Button
              onClick={async () => {
                if (!profileEdit) return;
                setProfileSaving(true);
                const { error } = await supabase.from("profiles").update({
                  full_name: profileEdit.full_name,
                  phone: profileEdit.phone,
                  email: profileEdit.email,
                }).eq("user_id", profileEdit.user_id);
                setProfileSaving(false);
                if (error) { toast.error("Erro ao salvar: " + error.message); return; }
                toast.success("Cadastro atualizado");
                setProfileEdit(null);
                qc.invalidateQueries({ queryKey: ["billing-overdue"] });
              }}
              disabled={profileSaving}
            >
              {profileSaving ? "Salvando..." : "Salvar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
};

export default AdminBilling;