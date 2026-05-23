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
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { SystemTemplateKey, getSystemTemplate, renderTemplate, buildWhatsAppUrl } from "@/lib/system-templates";
import { Send, CheckCircle2, Clock, AlertTriangle, RefreshCcw, Pencil, Paperclip, X, FileText, Image as ImageIcon, Loader2, History, TrendingUp, DollarSign, Bell } from "lucide-react";

type RoleArea = "admin" | "consultor" | "financeiro";
interface Props { area: RoleArea }

type CampaignStatus = "active" | "paused" | "renewed" | "ignored" | "reactivated";

const STAGE_TEMPLATES: Record<number, { key: SystemTemplateKey; label: string }> = {
  1: { key: "renewal_soft" as SystemTemplateKey, label: "1ª — Amigável" },
  2: { key: "renewal_objective" as SystemTemplateKey, label: "2ª — Retorno leve" },
  3: { key: "renewal_recovery" as SystemTemplateKey, label: "3ª — Cupom oportunidade" },
  4: { key: "renewal_last_contact" as SystemTemplateKey, label: "4ª — Último contato" },
  5: { key: "renewal_reactivation" as SystemTemplateKey, label: "5ª — Reativação" },
};

const STAGE_COLORS: Record<number, string> = {
  1: "bg-cyan-500/15 text-cyan-400 border-cyan-500/30",
  2: "bg-blue-500/15 text-blue-400 border-blue-500/30",
  3: "bg-amber-500/15 text-amber-400 border-amber-500/30",
  4: "bg-violet-500/15 text-violet-400 border-violet-500/30",
  5: "bg-pink-500/15 text-pink-400 border-pink-500/30",
};

const STATUS_BADGE: Record<CampaignStatus, { label: string; cls: string }> = {
  active: { label: "Ativa", cls: "bg-emerald-500/15 text-emerald-400 border-emerald-500/30" },
  paused: { label: "Pausada", cls: "bg-zinc-500/15 text-zinc-400 border-zinc-500/30" },
  renewed: { label: "Renovado", cls: "bg-emerald-500/20 text-emerald-300 border-emerald-500/40" },
  ignored: { label: "Ignorado", cls: "bg-zinc-500/15 text-zinc-400 border-zinc-500/30" },
  reactivated: { label: "Reativação enviada", cls: "bg-pink-500/15 text-pink-300 border-pink-500/30" },
};

const parsePrice = (p?: string | null): number => {
  if (!p) return 0;
  const n = parseFloat(String(p).replace(/[^\d,.-]/g, "").replace(/\./g, "").replace(",", "."));
  return isNaN(n) ? 0 : n;
};

const daysSince = (date: string): number => {
  const d = new Date(date + "T00:00:00");
  return Math.floor((Date.now() - d.getTime()) / 86400000);
};

const isValidPhone = (phone?: string | null): boolean => {
  if (!phone) return false;
  const digits = phone.replace(/\D/g, "");
  if (digits.length < 10 || digits.length > 13) return false;
  const local = digits.startsWith("55") ? digits.slice(2) : digits;
  if (/^(\d)\1+$/.test(local.slice(2))) return false;
  if (/^(\d)\1{7,}$/.test(local)) return false;
  return true;
};

const planPriority = (planName: string): number => {
  const n = planName.toLowerCase();
  if (n.includes("180")) return 3;
  if (n.includes("90")) return 2;
  return 1;
};

type TabKey = "queue" | "waiting" | "buckets" | "history" | "renewed" | "ignored" | "all";

const DAY_BUCKETS: Array<{ key: string; label: string; min: number; max: number; color: string }> = [
  { key: "b1", label: "1 a 7 dias", min: 1, max: 7, color: "bg-cyan-500/15 text-cyan-400 border-cyan-500/30" },
  { key: "b2", label: "8 a 15 dias", min: 8, max: 15, color: "bg-blue-500/15 text-blue-400 border-blue-500/30" },
  { key: "b3", label: "16 a 30 dias", min: 16, max: 30, color: "bg-amber-500/15 text-amber-400 border-amber-500/30" },
  { key: "b4", label: "31 a 60 dias", min: 31, max: 60, color: "bg-violet-500/15 text-violet-400 border-violet-500/30" },
  { key: "b5", label: "61 a 90 dias", min: 61, max: 90, color: "bg-pink-500/15 text-pink-400 border-pink-500/30" },
  { key: "b6", label: "90+ dias", min: 91, max: 99999, color: "bg-red-500/15 text-red-400 border-red-500/30" },
];

const AdminBilling = ({ area }: Props) => {
  const { user } = useAuth();
  const qc = useQueryClient();
  const [tab, setTab] = useState<TabKey>("queue");
  const [search, setSearch] = useState("");
  const [composer, setComposer] = useState<{ row: any; message: string; templateKey: SystemTemplateKey; templateId: string; imageUrl: string | null; documentUrl: string | null; documentName: string | null } | null>(null);
  const [composerSending, setComposerSending] = useState(false);
  const [uploadingAttachment, setUploadingAttachment] = useState(false);
  const [profileEdit, setProfileEdit] = useState<{ user_id: string; full_name: string; phone: string; email: string } | null>(null);
  const [profileSaving, setProfileSaving] = useState(false);
  const [historyOf, setHistoryOf] = useState<any | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ["billing-campaigns", area, user?.id],
    queryFn: async () => {
      let allowedIds: string[] | null = null;
      if (area === "consultor" && user?.id) {
        const { data: links } = await supabase
          .from("consultant_students")
          .select("student_id")
          .eq("consultant_id", user.id);
        allowedIds = (links || []).map((l) => l.student_id);
        if (allowedIds.length === 0) return { rows: [], recoveredCount: 0 };
      }

      let subQ = supabase
        .from("subscriptions")
        .select("id, user_id, plan_id, start_date, end_date, status")
        .order("end_date", { ascending: false })
        .limit(2000);
      if (allowedIds) subQ = subQ.in("user_id", allowedIds);
      const { data: subs } = await subQ;

      const today = new Date(); today.setHours(0, 0, 0, 0);
      const hasActiveByUser = new Set<string>();
      const latestByUser = new Map<string, any>();
      for (const s of subs || []) {
        const end = new Date(s.end_date + "T00:00:00");
        if (end.getTime() >= today.getTime()) hasActiveByUser.add(s.user_id);
        if (!latestByUser.has(s.user_id)) latestByUser.set(s.user_id, s);
      }
      const overdue = Array.from(latestByUser.values()).filter((s) => {
        if (hasActiveByUser.has(s.user_id)) return false;
        const end = new Date(s.end_date + "T00:00:00");
        return end.getTime() < today.getTime();
      });

      const overdueIds = overdue.map((s) => s.user_id);
      if (overdueIds.length === 0) return { rows: [], recoveredCount: 0 };

      const [profilesRes, plansRes, campaignsRes, paymentsRes] = await Promise.all([
        supabase.from("profiles").select("user_id, full_name, phone, email").in("user_id", overdueIds),
        supabase.from("plans").select("id, name, price").in("id", Array.from(new Set(overdue.map((s) => s.plan_id).filter(Boolean)))),
        supabase.from("billing_campaigns").select("*").in("user_id", overdueIds),
        supabase.from("payments")
          .select("user_id, status, created_at")
          .in("user_id", overdueIds)
          .eq("status", "approved")
          .gte("created_at", new Date(Date.now() - 7 * 86400000).toISOString()),
      ]);

      const pMap = new Map((profilesRes.data || []).map((p: any) => [p.user_id, p]));
      const planMap = new Map((plansRes.data || []).map((p: any) => [p.id, p]));
      const campMap = new Map((campaignsRes.data || []).map((c: any) => [c.user_id, c]));
      const recentlyPaid = new Set((paymentsRes.data || []).map((p: any) => p.user_id));

      // Auto-mark campaigns as renewed for recently paid users
      const toMarkRenewed = (campaignsRes.data || []).filter((c: any) => recentlyPaid.has(c.user_id) && c.status === "active");
      if (toMarkRenewed.length > 0) {
        await supabase.from("billing_campaigns").update({ status: "renewed", updated_at: new Date().toISOString() })
          .in("id", toMarkRenewed.map((c: any) => c.id));
      }

      // Backfill campaigns for overdue users without one
      const missing = overdue.filter((s) => !campMap.has(s.user_id) && !recentlyPaid.has(s.user_id));
      if (missing.length > 0) {
        const inserts = missing.map((s) => ({
          user_id: s.user_id,
          subscription_id: s.id,
          plan_id: s.plan_id,
          end_date: s.end_date,
          stage: 1,
          status: "active" as const,
          next_due_at: new Date(s.end_date + "T00:00:00").toISOString(),
        }));
        const { data: inserted } = await supabase.from("billing_campaigns").insert(inserts).select();
        for (const c of inserted || []) campMap.set(c.user_id, c);
      }

      const rows = overdue.filter((s) => !recentlyPaid.has(s.user_id)).map((s) => {
        const profile = pMap.get(s.user_id) || {};
        const plan = planMap.get(s.plan_id) || {};
        const camp = campMap.get(s.user_id);
        return {
          user_id: s.user_id,
          subscription_id: s.id,
          full_name: profile.full_name || "Sem nome",
          phone: profile.phone || "",
          email: profile.email || "",
          plan_name: plan.name || "—",
          plan_price: parsePrice(plan.price),
          end_date: s.end_date,
          days: daysSince(s.end_date),
          phone_valid: isValidPhone(profile.phone),
          campaign: camp,
        };
      });

      // Recovered in last 30 days
      const monthAgo = new Date(Date.now() - 30 * 86400000).toISOString();
      const { count: recoveredCount } = await supabase
        .from("billing_campaigns")
        .select("id", { count: "exact", head: true })
        .eq("status", "renewed")
        .gte("updated_at", monthAgo);

      return { rows, recoveredCount: recoveredCount || 0 };
    },
    enabled: !!user,
  });

  const rows = data?.rows || [];

  const now = Date.now();
  const inQueue = (r: any) => r.campaign && r.campaign.status === "active" && new Date(r.campaign.next_due_at).getTime() <= now;
  const inWaiting = (r: any) => r.campaign && r.campaign.status === "active" && new Date(r.campaign.next_due_at).getTime() > now;

  const filtered = useMemo(() => {
    let list = rows;
    if (tab === "queue") list = list.filter(inQueue);
    else if (tab === "waiting") list = list.filter(inWaiting);
    else if (tab === "renewed") list = list.filter((r) => r.campaign?.status === "renewed");
    else if (tab === "ignored") list = list.filter((r) => r.campaign?.status === "ignored");
    if (search) list = list.filter((r) => r.full_name.toLowerCase().includes(search.toLowerCase()));
    // Prioritization: 7-20 days first, then plan priority, then by days desc
    return [...list].sort((a, b) => {
      const aHot = a.days >= 7 && a.days <= 20 ? 1 : 0;
      const bHot = b.days >= 7 && b.days <= 20 ? 1 : 0;
      if (aHot !== bHot) return bHot - aHot;
      const pp = planPriority(b.plan_name) - planPriority(a.plan_name);
      if (pp !== 0) return pp;
      return b.days - a.days;
    });
  }, [rows, tab, search]);

  const summary = useMemo(() => {
    const overdue = rows.length;
    const queue = rows.filter(inQueue).length;
    const waiting = rows.filter(inWaiting).length;
    const today = new Date(); today.setHours(0, 0, 0, 0);
    const todayCharges = rows.filter((r) => r.campaign?.last_charged_at && new Date(r.campaign.last_charged_at).getTime() >= today.getTime()).length;
    const reactivations = rows.filter((r) => r.campaign?.status === "reactivated").length;
    const recoverable = rows
      .filter((r) => r.campaign?.status === "active")
      .reduce((sum, r) => sum + r.plan_price, 0);
    return { overdue, queue, waiting, todayCharges, reactivations, recoverable };
  }, [rows]);

  const openComposer = async (row: any, stageOverride?: number) => {
    if (!row.phone) { toast.error("Aluno sem telefone cadastrado"); return; }
    if (!isValidPhone(row.phone)) { toast.error(`Telefone inválido (${row.phone}). Atualize o cadastro.`); return; }
    const stage = stageOverride ?? row.campaign?.stage ?? 1;
    const tplDef = STAGE_TEMPLATES[stage] || STAGE_TEMPLATES[1];
    const tpl = await getSystemTemplate(tplDef.key);
    if (!tpl) { toast.error("Template não encontrado"); return; }
    const rendered = renderTemplate(tpl.content, {
      full_name: row.full_name, phone: row.phone, email: row.email,
      user_id: row.user_id, end_date: row.end_date,
    });
    setComposer({ row, message: rendered, templateKey: tplDef.key, templateId: tpl.id, imageUrl: tpl.image_url || null, documentUrl: null, documentName: null });
  };

  const onTemplateChange = async (key: SystemTemplateKey) => {
    if (!composer) return;
    const tpl = await getSystemTemplate(key);
    if (!tpl) return;
    const rendered = renderTemplate(tpl.content, {
      full_name: composer.row.full_name, phone: composer.row.phone, email: composer.row.email,
      user_id: composer.row.user_id, end_date: composer.row.end_date,
    });
    setComposer({ ...composer, templateKey: key, templateId: tpl.id, message: rendered, imageUrl: tpl.image_url || null });
  };

  const handleComposerSend = async () => {
    if (!composer) return;
    const { row, message, templateKey, imageUrl, documentUrl, documentName } = composer;
    if (!message.trim()) { toast.error("Mensagem vazia"); return; }
    setComposerSending(true);
    const AUTO_FOOTER = "\n\n———\n🔔 Comunicação automática STH METHOD\nMensagem enviada automaticamente pelo sistema.\nNão é necessário responder.";
    const finalMessage = message.includes("Comunicação automática STH METHOD") ? message : `${message}${AUTO_FOOTER}`;

    let deliveryStatus: "sent" | "failed" = "sent";
    let deliveryError: string | null = null;
    let autoOk = false;
    try {
      const { data: res, error } = await supabase.functions.invoke("send-whatsapp", {
        body: { phone: row.phone, message: finalMessage, image_url: imageUrl, document_url: documentUrl, document_name: documentName },
      });
      if (error) throw error;
      if (res?.ok) autoOk = true; else deliveryError = res?.error || "Falha no envio";
    } catch (err: any) {
      deliveryError = err?.message || String(err);
    }
    if (!autoOk) {
      deliveryStatus = "failed";
      const attachmentUrl = imageUrl || documentUrl;
      const url = buildWhatsAppUrl(row.phone, attachmentUrl ? `${finalMessage}\n\n${attachmentUrl}` : finalMessage);
      if (url) window.open(url, "_blank");
    }

    // Log message_history (legacy compatibility)
    try {
      await supabase.from("message_history").insert({
        user_id: row.user_id, content: finalMessage, recipient_phone: row.phone,
        recipient_name: row.full_name, template_id: composer.templateId, image_url: imageUrl,
        status: deliveryStatus, sent_at: new Date().toISOString(),
      });
    } catch (e) { console.error(e); }

    // Log billing_charges + advance campaign
    const campaign = row.campaign;
    if (campaign) {
      await supabase.from("billing_charges").insert({
        campaign_id: campaign.id,
        user_id: row.user_id,
        stage: campaign.stage,
        template_key: templateKey,
        responsible_user_id: user?.id || null,
        phone: row.phone,
        message: finalMessage,
        image_url: imageUrl,
        document_url: documentUrl,
        document_name: documentName,
        delivery_status: autoOk ? "sent" : "manual",
        delivery_error: deliveryError,
      });
      await supabase.rpc("advance_billing_campaign", { _campaign_id: campaign.id });
    }

    setComposerSending(false);
    setComposer(null);
    toast.success(autoOk
      ? `Cobrança ${campaign?.stage || 1}ª enviada para ${row.full_name.split(" ")[0]} — sai da fila até a próxima data.`
      : `WhatsApp aberto manualmente — cobrança registrada.`);
    qc.invalidateQueries({ queryKey: ["billing-campaigns"] });
  };

  const handleMarkRenewed = async (row: any) => {
    if (!row.campaign) return;
    await supabase.from("billing_campaigns").update({ status: "renewed", updated_at: new Date().toISOString() }).eq("id", row.campaign.id);
    toast.success("Marcado como renovado");
    qc.invalidateQueries({ queryKey: ["billing-campaigns"] });
  };

  const handleIgnore = async (row: any) => {
    if (!row.campaign) return;
    await supabase.from("billing_campaigns").update({ status: "ignored", updated_at: new Date().toISOString() }).eq("id", row.campaign.id);
    toast.success("Removido da fila ativa");
    qc.invalidateQueries({ queryKey: ["billing-campaigns"] });
  };

  const handleReactivate = async (row: any) => {
    if (!row.campaign) return;
    await supabase.from("billing_campaigns").update({ status: "active", next_due_at: new Date().toISOString(), updated_at: new Date().toISOString() }).eq("id", row.campaign.id);
    toast.success("Reativado na fila");
    qc.invalidateQueries({ queryKey: ["billing-campaigns"] });
  };

  const [bulkSending, setBulkSending] = useState<string | null>(null);

  const sendOne = async (row: any, stage: number): Promise<{ ok: boolean; error?: string }> => {
    if (!row.phone || !isValidPhone(row.phone)) return { ok: false, error: "telefone inválido" };
    const tplDef = STAGE_TEMPLATES[stage] || STAGE_TEMPLATES[1];
    const tpl = await getSystemTemplate(tplDef.key);
    if (!tpl) return { ok: false, error: "template não encontrado" };
    const rendered = renderTemplate(tpl.content, {
      full_name: row.full_name, phone: row.phone, email: row.email,
      user_id: row.user_id, end_date: row.end_date,
    });
    const AUTO_FOOTER = "\n\n———\n🔔 Comunicação automática STH METHOD\nMensagem enviada automaticamente pelo sistema.\nNão é necessário responder.";
    const finalMessage = rendered.includes("Comunicação automática STH METHOD") ? rendered : `${rendered}${AUTO_FOOTER}`;
    let autoOk = false;
    let deliveryError: string | null = null;
    try {
      const { data: res, error } = await supabase.functions.invoke("send-whatsapp", {
        body: { phone: row.phone, message: finalMessage, image_url: tpl.image_url || null },
      });
      if (error) throw error;
      if (res?.ok) autoOk = true; else deliveryError = res?.error || "Falha no envio";
    } catch (err: any) {
      deliveryError = err?.message || String(err);
    }
    if (row.campaign) {
      await supabase.from("billing_charges").insert({
        campaign_id: row.campaign.id,
        user_id: row.user_id,
        stage: row.campaign.stage,
        template_key: tplDef.key,
        responsible_user_id: user?.id || null,
        phone: row.phone,
        message: finalMessage,
        image_url: tpl.image_url || null,
        document_url: null,
        document_name: null,
        delivery_status: autoOk ? "sent" : "failed",
        delivery_error: deliveryError,
      });
      await supabase.rpc("advance_billing_campaign", { _campaign_id: row.campaign.id });
    }
    return { ok: autoOk, error: deliveryError || undefined };
  };

  const handleBulkSend = async (bucketKey: string, items: any[], stage: number) => {
    if (items.length === 0) return;
    const valid = items.filter((r) => r.phone && isValidPhone(r.phone));
    if (valid.length === 0) { toast.error("Nenhum aluno com telefone válido nesta faixa."); return; }
    if (!confirm(`Enviar "${STAGE_TEMPLATES[stage].label}" para ${valid.length} aluno(s) desta faixa?`)) return;
    setBulkSending(bucketKey);
    let ok = 0, fail = 0;
    for (const row of valid) {
      const r = await sendOne(row, stage);
      if (r.ok) ok++; else fail++;
    }
    setBulkSending(null);
    toast.success(`Envio em lote — ${ok} enviada(s), ${fail} falha(s).`);
    qc.invalidateQueries({ queryKey: ["billing-campaigns"] });
  };

  const role = area === "consultor" ? "consultor" : area === "financeiro" ? "financeiro" : "admin";

  const tabCounts = {
    queue: rows.filter(inQueue).length,
    waiting: rows.filter(inWaiting).length,
    renewed: rows.filter((r) => r.campaign?.status === "renewed").length,
    ignored: rows.filter((r) => r.campaign?.status === "ignored").length,
    all: rows.length,
  };

  const cards = [
    { label: "Total vencidos", value: summary.overdue, icon: AlertTriangle, color: "text-red-400" },
    { label: "Na fila hoje", value: summary.queue, icon: Bell, color: "text-emerald-400" },
    { label: "Aguardando próx.", value: summary.waiting, icon: Clock, color: "text-amber-400" },
    { label: "Cobranças do dia", value: summary.todayCharges, icon: Send, color: "text-blue-400" },
    { label: "Reativações enviadas", value: summary.reactivations, icon: TrendingUp, color: "text-pink-400" },
    { label: "Renovados (30d)", value: data?.recoveredCount || 0, icon: CheckCircle2, color: "text-emerald-400" },
  ];

  return (
    <DashboardLayout role={role as any} title="Cobranças & Renovações" subtitle="CRM inteligente de renovação — sequência automática, histórico e zero spam">
      <div className="space-y-6">
        {/* Summary cards */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
          {cards.map((c) => (
            <Card key={c.label}><CardContent className="p-4">
              <div className="flex items-center justify-between">
                <p className="text-[11px] uppercase tracking-wide text-muted-foreground">{c.label}</p>
                <c.icon className={`w-4 h-4 ${c.color}`} />
              </div>
              <p className="text-2xl font-semibold mt-1">{c.value}</p>
            </CardContent></Card>
          ))}
        </div>

        <Card><CardContent className="p-4 flex items-center justify-between">
          <div>
            <p className="text-xs text-muted-foreground flex items-center gap-1.5"><DollarSign className="w-3.5 h-3.5" /> Valor estimado recuperável</p>
            <p className="text-3xl font-semibold text-emerald-400 mt-1">
              R$ {summary.recoverable.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </p>
          </div>
          <Button variant="ghost" size="sm" onClick={() => qc.invalidateQueries({ queryKey: ["billing-campaigns"] })}>
            <RefreshCcw className="w-4 h-4 mr-1" /> Atualizar
          </Button>
        </CardContent></Card>

        {/* Tabs + search */}
        <Card><CardContent className="p-4 space-y-3">
          <div className="flex flex-wrap gap-3 items-center justify-between">
            <Tabs value={tab} onValueChange={(v) => setTab(v as TabKey)}>
              <TabsList>
                <TabsTrigger value="queue">Fila ativa ({tabCounts.queue})</TabsTrigger>
                <TabsTrigger value="waiting">Aguardando ({tabCounts.waiting})</TabsTrigger>
                <TabsTrigger value="buckets">Por tempo vencido</TabsTrigger>
                <TabsTrigger value="history">Histórico geral</TabsTrigger>
                <TabsTrigger value="renewed">Renovados ({tabCounts.renewed})</TabsTrigger>
                <TabsTrigger value="ignored">Ignorados ({tabCounts.ignored})</TabsTrigger>
                <TabsTrigger value="all">Todos ({tabCounts.all})</TabsTrigger>
              </TabsList>
            </Tabs>
            {tab !== "history" && (
              <Input className="max-w-xs" placeholder="Buscar por nome..." value={search} onChange={(e) => setSearch(e.target.value)} />
            )}
          </div>
          <p className="text-xs text-muted-foreground">
            {tab === "queue" && "Alunos prontos para cobrança hoje — sequência: 1ª (amigável) → 7d → 2ª → 8d → 3ª (cupom) → 15d → 4ª → 30d → 5ª (reativação)."}
            {tab === "waiting" && "Já foram cobrados recentemente — voltam à fila automaticamente na próxima data."}
            {tab === "buckets" && "Grade de alunos agrupados por tempo de vencimento — envio manual de qualquer etapa, a qualquer momento."}
            {tab === "history" && "Painel coletivo de todas as cobranças realizadas por todos os responsáveis."}
            {tab === "renewed" && "Alunos que renovaram após cobrança."}
            {tab === "ignored" && "Removidos manualmente da fila."}
            {tab === "all" && "Todos os alunos vencidos, independente do estado da campanha."}
          </p>
        </CardContent></Card>

        {tab === "buckets" ? (
          <BucketsView
            rows={rows.filter((r) => !search || r.full_name.toLowerCase().includes(search.toLowerCase()))}
            openComposer={openComposer}
            setHistoryOf={setHistoryOf}
            onBulkSend={handleBulkSend}
            bulkSending={bulkSending}
          />
        ) : tab === "history" ? (
          <GlobalHistoryPanel area={area} userId={user?.id} />
        ) : (
        <Card><CardContent className="p-0">
          {isLoading ? (
            <div className="p-10 text-center text-muted-foreground">Carregando...</div>
          ) : filtered.length === 0 ? (
            <div className="p-10 text-center text-muted-foreground">Nenhum aluno nesta visualização.</div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Aluno</TableHead>
                  <TableHead>Plano</TableHead>
                  <TableHead>Vencimento</TableHead>
                  <TableHead>Dias</TableHead>
                  <TableHead>Etapa</TableHead>
                  <TableHead>Última cobrança</TableHead>
                  <TableHead>Próxima</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((r) => {
                  const camp = r.campaign;
                  const stage = camp?.stage || 1;
                  const status: CampaignStatus = camp?.status || "active";
                  return (
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
                        <Badge variant="outline" className={STAGE_COLORS[stage]}>
                          {stage}ª {stage === 5 ? "Reativ." : "cobrança"}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground">
                        {camp?.last_charged_at ? new Date(camp.last_charged_at).toLocaleDateString("pt-BR") : "—"}
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground">
                        {camp?.next_due_at ? new Date(camp.next_due_at).toLocaleDateString("pt-BR") : "—"}
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className={STATUS_BADGE[status].cls}>{STATUS_BADGE[status].label}</Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-1 flex-wrap">
                          {status === "active" && (
                            <Button size="sm" variant="default" onClick={() => openComposer(r)} disabled={!r.phone || !r.phone_valid}>
                              <Send className="w-3.5 h-3.5 mr-1" /> Enviar
                            </Button>
                          )}
                          {(status === "ignored" || status === "reactivated") && (
                            <Button size="sm" variant="outline" onClick={() => handleReactivate(r)}>
                              <RefreshCcw className="w-3.5 h-3.5 mr-1" /> Reativar
                            </Button>
                          )}
                          {status !== "renewed" && (
                            <Button size="sm" variant="outline" onClick={() => handleMarkRenewed(r)}>
                              <CheckCircle2 className="w-3.5 h-3.5 mr-1" /> Renovou
                            </Button>
                          )}
                          {status === "active" && (
                            <Button size="sm" variant="ghost" onClick={() => handleIgnore(r)}>Ignorar</Button>
                          )}
                          <Button size="sm" variant="ghost" onClick={() => setHistoryOf(r)} title="Histórico">
                            <History className="w-3.5 h-3.5" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent></Card>
        )}
      </div>

      {/* Composer dialog */}
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
                {composer.row.campaign && (
                  <Badge variant="outline" className={`ml-2 ${STAGE_COLORS[composer.row.campaign.stage]}`}>
                    {composer.row.campaign.stage}ª cobrança
                  </Badge>
                )}
              </div>
              <div>
                <label className="text-xs text-muted-foreground">Template (etapa)</label>
                <Select value={composer.templateKey} onValueChange={(v) => onTemplateChange(v as SystemTemplateKey)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {Object.entries(STAGE_TEMPLATES).map(([s, t]) => (
                      <SelectItem key={t.key} value={t.key}>{t.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <Textarea rows={12} value={composer.message} onChange={(e) => setComposer({ ...composer, message: e.target.value })} className="font-mono text-sm" />
              <div className="space-y-2">
                <label className="text-xs text-muted-foreground">Anexo (opcional — JPG, PNG ou PDF)</label>
                {(composer.imageUrl || composer.documentUrl) ? (
                  <div className="flex items-center gap-2 rounded-md border border-border bg-muted/30 px-3 py-2 text-sm">
                    {composer.imageUrl ? <ImageIcon className="w-4 h-4 shrink-0" /> : <FileText className="w-4 h-4 shrink-0" />}
                    <span className="truncate flex-1">{composer.documentName || (composer.imageUrl ? "Imagem anexada" : "Documento anexado")}</span>
                    <Button type="button" variant="ghost" size="sm" onClick={() => setComposer({ ...composer, imageUrl: null, documentUrl: null, documentName: null })} disabled={composerSending || uploadingAttachment}>
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                ) : (
                  <div>
                    <input
                      id="billing-attachment-input"
                      type="file"
                      accept="image/jpeg,image/png,image/jpg,application/pdf,.jpg,.jpeg,.png,.pdf"
                      className="hidden"
                      onChange={async (e) => {
                        const file = e.target.files?.[0];
                        e.target.value = "";
                        if (!file || !composer) return;
                        const lower = file.name.toLowerCase();
                        const isPdf = file.type === "application/pdf" || lower.endsWith(".pdf");
                        const isImg = ["image/jpeg", "image/jpg", "image/png"].includes(file.type) || /\.(jpe?g|png)$/i.test(lower);
                        if (!isPdf && !isImg) { toast.error("Envie apenas JPG, PNG ou PDF"); return; }
                        if (file.size > 16 * 1024 * 1024) { toast.error("Arquivo muito grande (máx. 16MB)"); return; }
                        setUploadingAttachment(true);
                        try {
                          const ext = isPdf ? "pdf" : (lower.match(/\.(jpe?g|png)$/i)?.[0].replace(".", "") || "jpg");
                          const path = `${composer.row.user_id}/${Date.now()}_${Math.random().toString(36).slice(2, 8)}.${ext}`;
                          const { error: upErr } = await supabase.storage.from("billing-attachments")
                            .upload(path, file, { contentType: file.type || (isPdf ? "application/pdf" : "image/jpeg"), upsert: false });
                          if (upErr) throw upErr;
                          const { data: urlData } = supabase.storage.from("billing-attachments").getPublicUrl(path);
                          setComposer({ ...composer, imageUrl: isImg ? urlData.publicUrl : null, documentUrl: isPdf ? urlData.publicUrl : null, documentName: isPdf ? file.name : null });
                          toast.success("Anexo carregado");
                        } catch (err: any) {
                          toast.error(err?.message || "Falha ao enviar anexo");
                        } finally {
                          setUploadingAttachment(false);
                        }
                      }}
                    />
                    <Button type="button" variant="outline" size="sm" disabled={uploadingAttachment || composerSending} onClick={() => document.getElementById("billing-attachment-input")?.click()}>
                      {uploadingAttachment ? (<><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Enviando...</>) : (<><Paperclip className="w-4 h-4 mr-2" /> Anexar arquivo</>)}
                    </Button>
                  </div>
                )}
              </div>
              <p className="text-[11px] text-muted-foreground">
                Após o envio, o aluno sai da fila automaticamente até a próxima data programada.
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

      {/* Profile quick edit */}
      <Dialog open={!!profileEdit} onOpenChange={(o) => !o && !profileSaving && setProfileEdit(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle>Atualizar cadastro</DialogTitle></DialogHeader>
          {profileEdit && (
            <div className="space-y-3">
              <div>
                <label className="text-xs text-muted-foreground">Nome completo</label>
                <Input value={profileEdit.full_name} onChange={(e) => setProfileEdit({ ...profileEdit, full_name: e.target.value })} />
              </div>
              <div>
                <label className="text-xs text-muted-foreground">Telefone (WhatsApp)</label>
                <Input value={profileEdit.phone} onChange={(e) => setProfileEdit({ ...profileEdit, phone: e.target.value })} placeholder="(xx) xxxxx-xxxx" />
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
                  full_name: profileEdit.full_name, phone: profileEdit.phone, email: profileEdit.email,
                }).eq("user_id", profileEdit.user_id);
                setProfileSaving(false);
                if (error) { toast.error("Erro: " + error.message); return; }
                toast.success("Cadastro atualizado");
                setProfileEdit(null);
                qc.invalidateQueries({ queryKey: ["billing-campaigns"] });
              }}
              disabled={profileSaving}
            >
              {profileSaving ? "Salvando..." : "Salvar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* History dialog */}
      <HistoryDialog row={historyOf} onClose={() => setHistoryOf(null)} />
    </DashboardLayout>
  );
};

const HistoryDialog = ({ row, onClose }: { row: any | null; onClose: () => void }) => {
  const { data, isLoading } = useQuery({
    queryKey: ["billing-charges", row?.user_id],
    queryFn: async () => {
      if (!row) return [];
      const { data } = await supabase
        .from("billing_charges")
        .select("*")
        .eq("user_id", row.user_id)
        .order("sent_at", { ascending: false });
      return data || [];
    },
    enabled: !!row,
  });

  return (
    <Dialog open={!!row} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <History className="w-4 h-4" /> Histórico — {row?.full_name}
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-3 max-h-[60vh] overflow-y-auto">
          {isLoading ? (
            <p className="text-sm text-muted-foreground text-center py-6">Carregando...</p>
          ) : !data || data.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-6">Nenhuma cobrança registrada ainda.</p>
          ) : (
            data.map((c: any) => (
              <Card key={c.id}><CardContent className="p-3 space-y-2">
                <div className="flex items-center justify-between gap-2 flex-wrap">
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className={STAGE_COLORS[c.stage] || ""}>{c.stage}ª cobrança</Badge>
                    <Badge variant="outline" className={c.delivery_status === "sent" ? "bg-emerald-500/15 text-emerald-400 border-emerald-500/30" : "bg-amber-500/15 text-amber-400 border-amber-500/30"}>
                      {c.delivery_status === "sent" ? "Entregue" : c.delivery_status === "manual" ? "Envio manual" : "Falhou"}
                    </Badge>
                  </div>
                  <span className="text-xs text-muted-foreground">
                    {new Date(c.sent_at).toLocaleString("pt-BR")}
                  </span>
                </div>
                <pre className="text-xs whitespace-pre-wrap bg-muted/30 p-2 rounded">{c.message}</pre>
                {c.delivery_error && <p className="text-xs text-red-400">Erro: {c.delivery_error}</p>}
              </CardContent></Card>
            ))
          )}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Fechar</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default AdminBilling;

const BucketsView = ({ rows, openComposer, setHistoryOf, onBulkSend, bulkSending }: { rows: any[]; openComposer: (r: any, s?: number) => void; setHistoryOf: (r: any) => void; onBulkSend: (bucketKey: string, items: any[], stage: number) => void; bulkSending: string | null }) => {
  const [bulkStage, setBulkStage] = useState<Record<string, string>>({});
  const groups = DAY_BUCKETS.map((b) => ({
    ...b,
    items: rows.filter((r) => r.days >= b.min && r.days <= b.max).sort((a, b) => b.days - a.days),
  })).filter((g) => g.items.length > 0);

  if (groups.length === 0) {
    return <Card><CardContent className="p-10 text-center text-muted-foreground">Nenhum aluno vencido nas faixas de tempo.</CardContent></Card>;
  }

  return (
    <div className="space-y-4">
      {groups.map((g) => (
        <Card key={g.key}>
          <CardContent className="p-0">
            <div className="flex items-center justify-between px-4 py-3 border-b border-border gap-3 flex-wrap">
              <div className="flex items-center gap-2">
                <Badge variant="outline" className={g.color}>{g.label}</Badge>
                <span className="text-sm text-muted-foreground">{g.items.length} aluno{g.items.length > 1 ? "s" : ""}</span>
              </div>
              <div className="flex items-center gap-2">
                <Select value={bulkStage[g.key] || ""} onValueChange={(v) => setBulkStage((s) => ({ ...s, [g.key]: v }))}>
                  <SelectTrigger className="h-8 w-[200px] text-xs"><SelectValue placeholder="Escolher template..." /></SelectTrigger>
                  <SelectContent>
                    {Object.entries(STAGE_TEMPLATES).map(([s, t]) => (
                      <SelectItem key={s} value={s}>{t.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Button
                  size="sm"
                  disabled={!bulkStage[g.key] || bulkSending === g.key}
                  onClick={() => onBulkSend(g.key, g.items, parseInt(bulkStage[g.key]))}
                >
                  {bulkSending === g.key ? (<><Loader2 className="w-3.5 h-3.5 mr-1 animate-spin" /> Enviando...</>) : (<><Send className="w-3.5 h-3.5 mr-1" /> Enviar para todos</>)}
                </Button>
              </div>
            </div>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Aluno</TableHead>
                  <TableHead>Plano</TableHead>
                  <TableHead>Venc.</TableHead>
                  <TableHead>Dias</TableHead>
                  <TableHead>Etapa atual</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {g.items.map((r) => {
                  const stage = r.campaign?.stage || 1;
                  return (
                    <TableRow key={r.user_id}>
                      <TableCell>
                        <div className="font-medium">{r.full_name}</div>
                        <div className={`text-xs ${r.phone && !r.phone_valid ? "text-red-500" : "text-muted-foreground"}`}>
                          {r.phone || "sem telefone"}
                        </div>
                      </TableCell>
                      <TableCell className="text-sm">
                        <div>{r.plan_name}</div>
                        <div className="text-xs text-muted-foreground">R$ {r.plan_price.toFixed(2)}</div>
                      </TableCell>
                      <TableCell className="text-sm">{new Date(r.end_date + "T00:00:00").toLocaleDateString("pt-BR")}</TableCell>
                      <TableCell className="text-sm font-medium">{r.days}d</TableCell>
                      <TableCell>
                        <Badge variant="outline" className={STAGE_COLORS[stage]}>{stage}ª</Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-1 flex-wrap">
                          <Select onValueChange={(v) => openComposer(r, parseInt(v))}>
                            <SelectTrigger className="h-8 w-[140px] text-xs"><SelectValue placeholder="Enviar etapa..." /></SelectTrigger>
                            <SelectContent>
                              {Object.entries(STAGE_TEMPLATES).map(([s, t]) => (
                                <SelectItem key={s} value={s}>{t.label}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <Button size="sm" variant="ghost" onClick={() => setHistoryOf(r)} title="Histórico">
                            <History className="w-3.5 h-3.5" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};

const GlobalHistoryPanel = ({ area, userId }: { area: RoleArea; userId?: string }) => {
  const { data, isLoading } = useQuery({
    queryKey: ["billing-charges-global", area, userId],
    queryFn: async () => {
      let allowedIds: string[] | null = null;
      if (area === "consultor" && userId) {
        const { data: links } = await supabase.from("consultant_students").select("student_id").eq("consultant_id", userId);
        allowedIds = (links || []).map((l) => l.student_id);
        if (allowedIds.length === 0) return { charges: [], names: new Map(), responsibles: new Map() };
      }
      let q = supabase.from("billing_charges").select("*").order("sent_at", { ascending: false }).limit(200);
      if (allowedIds) q = q.in("user_id", allowedIds);
      const { data: charges } = await q;
      const userIds = Array.from(new Set((charges || []).map((c: any) => c.user_id)));
      const respIds = Array.from(new Set((charges || []).map((c: any) => c.responsible_user_id).filter(Boolean)));
      const [profilesRes, respRes] = await Promise.all([
        userIds.length ? supabase.from("profiles").select("user_id, full_name").in("user_id", userIds) : Promise.resolve({ data: [] as any[] }),
        respIds.length ? supabase.from("profiles").select("user_id, full_name").in("user_id", respIds) : Promise.resolve({ data: [] as any[] }),
      ]);
      const names = new Map((profilesRes.data || []).map((p: any) => [p.user_id, p.full_name]));
      const responsibles = new Map((respRes.data || []).map((p: any) => [p.user_id, p.full_name]));
      return { charges: charges || [], names, responsibles };
    },
    enabled: !!userId || area === "admin",
  });

  if (isLoading) return <Card><CardContent className="p-10 text-center text-muted-foreground">Carregando histórico...</CardContent></Card>;
  if (!data || data.charges.length === 0) {
    return <Card><CardContent className="p-10 text-center text-muted-foreground">Nenhuma cobrança registrada ainda.</CardContent></Card>;
  }

  return (
    <Card><CardContent className="p-0">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Data/Hora</TableHead>
            <TableHead>Aluno</TableHead>
            <TableHead>Etapa</TableHead>
            <TableHead>Template</TableHead>
            <TableHead>Telefone</TableHead>
            <TableHead>Responsável</TableHead>
            <TableHead>Status</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {data.charges.map((c: any) => (
            <TableRow key={c.id}>
              <TableCell className="text-xs">{new Date(c.sent_at).toLocaleString("pt-BR")}</TableCell>
              <TableCell className="text-sm font-medium">{data.names.get(c.user_id) || "—"}</TableCell>
              <TableCell>
                <Badge variant="outline" className={STAGE_COLORS[c.stage] || ""}>{c.stage}ª</Badge>
              </TableCell>
              <TableCell className="text-xs text-muted-foreground">{c.template_key}</TableCell>
              <TableCell className="text-xs">{c.phone}</TableCell>
              <TableCell className="text-xs">{data.responsibles.get(c.responsible_user_id) || "—"}</TableCell>
              <TableCell>
                <Badge variant="outline" className={c.delivery_status === "sent" ? "bg-emerald-500/15 text-emerald-400 border-emerald-500/30" : c.delivery_status === "manual" ? "bg-amber-500/15 text-amber-400 border-amber-500/30" : "bg-red-500/15 text-red-400 border-red-500/30"}>
                  {c.delivery_status === "sent" ? "Entregue" : c.delivery_status === "manual" ? "Manual" : "Falhou"}
                </Badge>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </CardContent></Card>
  );
};