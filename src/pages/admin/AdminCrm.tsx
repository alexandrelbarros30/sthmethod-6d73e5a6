import { useEffect, useMemo, useState } from "react";
import DashboardSidebar from "@/components/DashboardSidebar";
import { useIsMobile } from "@/hooks/use-mobile";
import { supabase } from "@/integrations/supabase/client";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Send, Search, Plus, Sparkles, Loader2, MessageSquare, Tag as TagIcon, UserCog, TrendingUp, X } from "lucide-react";
import { formatPhoneBR, normalizePhone } from "@/lib/phone";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/contexts/AuthContext";
import StudentDossier from "@/components/admin/crm/StudentDossier";
import { toast } from "@/hooks/use-toast";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Checkbox } from "@/components/ui/checkbox";
import { BellOff } from "lucide-react";

interface Conv {
  id: string;
  phone: string;
  display_name: string | null;
  last_message_at: string | null;
  last_message_preview: string | null;
  unread_count: number;
  status: string;
  channel: string | null;
  assigned_to: string | null;
  pipeline_stage: string | null;
}

interface Msg {
  id: string;
  conversation_id: string;
  direction: "in" | "out";
  body: string | null;
  created_at: string;
  source: string;
  status: string;
}

interface Tag { id: string; name: string; color: string; }
interface StaffMember { user_id: string; full_name: string | null; role: string; }

const STAGES = [
  { id: "novo_lead",  label: "Novo Lead" },
  { id: "contato",    label: "Contato" },
  { id: "interesse",  label: "Interesse" },
  { id: "cadastro",   label: "Cadastro" },
  { id: "pagamento",  label: "Pagamento" },
  { id: "convertido", label: "Convertido" },
];

function fmtTime(s: string | null) {
  if (!s) return "";
  const d = new Date(s);
  const today = new Date();
  if (d.toDateString() === today.toDateString()) return d.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });
  return d.toLocaleDateString("pt-BR");
}

export default function AdminCrm() {
  const { user } = useAuth();
  const qc = useQueryClient();
  const isMobile = useIsMobile();
  const [activeId, setActiveId] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [draft, setDraft] = useState("");
  const [sending, setSending] = useState(false);
  const [aiLoading, setAiLoading] = useState(false);
  const [channelFilter, setChannelFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [newTagName, setNewTagName] = useState("");
  const [silentOpen, setSilentOpen] = useState(false);
  const [silentTemplateId, setSilentTemplateId] = useState<string>("");
  const [silentSelected, setSilentSelected] = useState<Record<string, boolean>>({});
  const [silentSending, setSilentSending] = useState(false);

  const { data: silentTemplates = [] } = useQuery<Array<{ id: string; name: string; body: string; channel: string }>>({
    queryKey: ["crm-silent-templates"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("crm_message_templates")
        .select("id, name, body, channel")
        .eq("silent_dispatch", true)
        .eq("active", true)
        .order("name");
      if (error) throw error;
      return (data ?? []) as any;
    },
  });

  const { data: conversations = [] } = useQuery<Conv[]>({
    queryKey: ["crm-conversations"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("crm_conversations")
        .select("id, phone, display_name, last_message_at, last_message_preview, unread_count, status, channel, assigned_to, pipeline_stage")
        .order("last_message_at", { ascending: false, nullsFirst: false })
        .limit(200);
      if (error) throw error;
      return (data ?? []) as Conv[];
    },
  });

  const { data: messages = [] } = useQuery<Msg[]>({
    queryKey: ["crm-messages", activeId],
    enabled: !!activeId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("crm_messages")
        .select("id, conversation_id, direction, body, created_at, source, status")
        .eq("conversation_id", activeId!)
        .order("created_at", { ascending: true })
        .limit(500);
      if (error) throw error;
      return (data ?? []) as Msg[];
    },
  });

  // Conversas elegíveis para disparo silencioso: contato após 19h (hoje) e inativas há 30+ min
  const silentEligible = useMemo(() => {
    const now = new Date();
    const today19 = new Date(now); today19.setHours(19, 0, 0, 0);
    const cutoff = new Date(now.getTime() - 30 * 60 * 1000);
    return conversations.filter((c) => {
      if (!c.last_message_at) return false;
      if (c.status !== "open") return false;
      const t = new Date(c.last_message_at);
      return t >= today19 && t <= cutoff;
    });
  }, [conversations]);

  function openSilentDialog() {
    const first = silentTemplates[0]?.id || "";
    setSilentTemplateId(first);
    const sel: Record<string, boolean> = {};
    silentEligible.forEach((c) => { sel[c.id] = true; });
    setSilentSelected(sel);
    setSilentOpen(true);
  }

  async function runSilentBroadcast() {
    const tpl = silentTemplates.find((t) => t.id === silentTemplateId);
    if (!tpl) { toast({ title: "Selecione um template silencioso" }); return; }
    const targets = silentEligible.filter((c) => silentSelected[c.id]);
    if (targets.length === 0) { toast({ title: "Nenhuma conversa selecionada" }); return; }
    setSilentSending(true);
    let ok = 0, fail = 0;
    for (const c of targets) {
      try {
        const { data, error } = await supabase.functions.invoke("crm-send-whatsapp", {
          body: { conversation_id: c.id, phone: c.phone, body: tpl.body },
        });
        if (error || data?.ok === false) fail++; else ok++;
      } catch { fail++; }
    }
    setSilentSending(false);
    setSilentOpen(false);
    qc.invalidateQueries({ queryKey: ["crm-conversations"] });
    toast({ title: "Disparo silencioso concluído", description: `${ok} enviadas · ${fail} falhas` });
  }

  // tags
  const { data: allTags = [] } = useQuery<Tag[]>({
    queryKey: ["crm-tags"],
    queryFn: async () => {
      const { data } = await supabase.from("crm_tags").select("id, name, color").order("name");
      return (data ?? []) as Tag[];
    },
  });

  const { data: convTagIds = [] } = useQuery<string[]>({
    queryKey: ["crm-conv-tags", activeId],
    enabled: !!activeId,
    queryFn: async () => {
      const { data } = await supabase.from("crm_conversation_tags").select("tag_id").eq("conversation_id", activeId!);
      return (data ?? []).map((r: any) => r.tag_id);
    },
  });

  // staff list for transfer (admin / consultor / assistente / financeiro)
  const { data: staff = [] } = useQuery<StaffMember[]>({
    queryKey: ["crm-staff"],
    queryFn: async () => {
      const { data: roles } = await supabase
        .from("user_roles")
        .select("user_id, role")
        .in("role", ["admin", "consultor", "assistente", "financeiro"] as any);
      const ids = Array.from(new Set((roles ?? []).map((r: any) => r.user_id)));
      if (!ids.length) return [];
      const { data: profs } = await supabase.from("profiles").select("user_id, full_name").in("user_id", ids);
      const nameMap = new Map((profs ?? []).map((p: any) => [p.user_id, p.full_name]));
      const seen = new Set<string>();
      const out: StaffMember[] = [];
      (roles ?? []).forEach((r: any) => {
        if (seen.has(r.user_id)) return;
        seen.add(r.user_id);
        out.push({ user_id: r.user_id, full_name: nameMap.get(r.user_id) ?? null, role: r.role });
      });
      return out;
    },
  });

  // realtime
  useEffect(() => {
    const ch = supabase
      .channel("crm-realtime")
      .on("postgres_changes", { event: "*", schema: "public", table: "crm_conversations" }, () => {
        qc.invalidateQueries({ queryKey: ["crm-conversations"] });
      })
      .on("postgres_changes", { event: "*", schema: "public", table: "crm_messages" }, (p: any) => {
        qc.invalidateQueries({ queryKey: ["crm-messages", p.new?.conversation_id || p.old?.conversation_id] });
        qc.invalidateQueries({ queryKey: ["crm-conversations"] });
      })
      .on("postgres_changes", { event: "*", schema: "public", table: "crm_conversation_tags" }, () => {
        qc.invalidateQueries({ queryKey: ["crm-conv-tags", activeId] });
      })
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [qc, activeId]);

  const active = useMemo(() => conversations.find((c) => c.id === activeId) || null, [conversations, activeId]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return conversations.filter((c) => {
      if (channelFilter !== "all" && (c.channel || "whatsapp") !== channelFilter) return false;
      if (statusFilter !== "all" && (c.status || "open") !== statusFilter) return false;
      if (q) {
        const matches =
          (c.display_name || "").toLowerCase().includes(q) ||
          c.phone.includes(q.replace(/\D/g, ""));
        if (!matches) return false;
      }
      return true;
    });
  }, [conversations, search, channelFilter, statusFilter]);

  const activeTags = useMemo(
    () => allTags.filter((t) => convTagIds.includes(t.id)),
    [allTags, convTagIds]
  );

  // mark as read when opening
  useEffect(() => {
    if (!activeId) return;
    supabase.from("crm_conversations").update({ unread_count: 0 }).eq("id", activeId).then(() => {
      qc.invalidateQueries({ queryKey: ["crm-conversations"] });
    });
  }, [activeId, qc]);

  async function toggleTag(tagId: string) {
    if (!activeId) return;
    if (convTagIds.includes(tagId)) {
      await supabase.from("crm_conversation_tags").delete().eq("conversation_id", activeId).eq("tag_id", tagId);
    } else {
      await supabase.from("crm_conversation_tags").insert({ conversation_id: activeId, tag_id: tagId });
    }
    qc.invalidateQueries({ queryKey: ["crm-conv-tags", activeId] });
  }

  async function createTag() {
    const name = newTagName.trim();
    if (!name) return;
    const color = "#" + Math.floor(Math.random() * 0xffffff).toString(16).padStart(6, "0");
    const { data, error } = await supabase.from("crm_tags").insert({ name, color }).select("id").single();
    if (error) { toast({ title: "Erro", description: error.message }); return; }
    setNewTagName("");
    qc.invalidateQueries({ queryKey: ["crm-tags"] });
    if (data?.id && activeId) {
      await supabase.from("crm_conversation_tags").insert({ conversation_id: activeId, tag_id: data.id });
      qc.invalidateQueries({ queryKey: ["crm-conv-tags", activeId] });
    }
  }

  async function transferTo(uid: string | null) {
    if (!activeId) return;
    await supabase.from("crm_conversations").update({ assigned_to: uid }).eq("id", activeId);
    qc.invalidateQueries({ queryKey: ["crm-conversations"] });
    toast({ title: uid ? "Atendimento transferido" : "Atendimento liberado" });
  }

  async function setStage(stage: string | null) {
    if (!activeId) return;
    await supabase.from("crm_conversations").update({ pipeline_stage: stage }).eq("id", activeId);
    qc.invalidateQueries({ queryKey: ["crm-conversations"] });
  }

  async function setConvStatus(status: string) {
    if (!activeId) return;
    await supabase.from("crm_conversations").update({ status }).eq("id", activeId);
    qc.invalidateQueries({ queryKey: ["crm-conversations"] });
  }

  async function handleNewConversation() {
    const raw = prompt("Telefone do contato (com DDD):");
    if (!raw) return;
    const phone = normalizePhone(raw);
    if (!phone) { toast({ title: "Telefone inválido" }); return; }
    const { data: existing } = await supabase.from("crm_conversations").select("id").eq("phone", phone).maybeSingle();
    if (existing) { setActiveId(existing.id); return; }
    const { data, error } = await supabase
      .from("crm_conversations")
      .insert({ phone, channel: "whatsapp", status: "open" })
      .select("id")
      .single();
    if (error) { toast({ title: "Erro", description: error.message }); return; }
    qc.invalidateQueries({ queryKey: ["crm-conversations"] });
    setActiveId(data.id);
  }

  async function handleSend() {
    if (!active || !draft.trim() || sending) return;
    setSending(true);
    try {
      const { error: invErr } = await supabase.functions.invoke("crm-send-whatsapp", {
        body: { conversation_id: active.id, phone: active.phone, body: draft.trim() },
      });
      if (invErr) throw invErr;
      setDraft("");
    } catch (e: any) {
      // fallback: registrar localmente como manual
      await supabase.from("crm_messages").insert({
        conversation_id: active.id, direction: "out", body: draft.trim(),
        source: "manual", sent_by: user?.id, status: "queued",
      });
      setDraft("");
      toast({ title: "Mensagem registrada", description: "Envio externo indisponível, mensagem salva localmente." });
    } finally {
      setSending(false);
    }
  }

  async function handleAiSuggest() {
    if (!active) return;
    setAiLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("crm-ai-suggest", {
        body: { conversation_id: active.id, phone: active.phone },
      });
      if (error) throw error;
      if (data?.response) setDraft(data.response);
    } catch (e: any) {
      toast({ title: "IA indisponível", description: e?.message || "Tente novamente em instantes." });
    } finally {
      setAiLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-background">
      <DashboardSidebar role="admin" />
      <div className={`flex ${isMobile ? "pt-12 h-screen" : "ml-60 h-screen"}`}>
        {/* Conversations list */}
        <div className="w-72 border-r border-border/50 flex flex-col">
          <div className="p-3 border-b border-border/50 space-y-2">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-semibold">Conversas</h2>
              <Button size="sm" variant="ghost" onClick={handleNewConversation} className="h-7 w-7 p-0"><Plus className="w-4 h-4" /></Button>
            </div>
            <div className="relative">
              <Search className="w-3.5 h-3.5 absolute left-2 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Buscar..." className="h-8 pl-7 text-xs" />
            </div>
            <div className="grid grid-cols-2 gap-1.5">
              <Select value={channelFilter} onValueChange={setChannelFilter}>
                <SelectTrigger className="h-7 text-[11px]"><SelectValue placeholder="Canal" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos canais</SelectItem>
                  <SelectItem value="whatsapp">WhatsApp</SelectItem>
                  <SelectItem value="instagram">Instagram</SelectItem>
                  <SelectItem value="email">E-mail</SelectItem>
                </SelectContent>
              </Select>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="h-7 text-[11px]"><SelectValue placeholder="Status" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos status</SelectItem>
                  <SelectItem value="open">Abertas</SelectItem>
                  <SelectItem value="snoozed">Adiadas</SelectItem>
                  <SelectItem value="closed">Fechadas</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="flex-1 overflow-y-auto">
            {filtered.length === 0 && (
              <div className="p-4 text-xs text-muted-foreground text-center">Nenhuma conversa.</div>
            )}
            {filtered.map((c) => (
              <button
                key={c.id}
                onClick={() => setActiveId(c.id)}
                className={`w-full text-left px-3 py-2.5 border-b border-border/30 hover:bg-accent/40 transition-colors ${activeId === c.id ? "bg-accent/60" : ""}`}
              >
                <div className="flex items-center justify-between gap-2">
                  <p className="text-xs font-medium truncate">{c.display_name || formatPhoneBR(c.phone)}</p>
                  <span className="text-[10px] text-muted-foreground shrink-0">{fmtTime(c.last_message_at)}</span>
                </div>
                <div className="flex items-center justify-between gap-2 mt-0.5">
                  <p className="text-[11px] text-muted-foreground truncate">{c.last_message_preview || "—"}</p>
                  {c.unread_count > 0 && (
                    <Badge className="h-4 min-w-4 px-1 text-[10px] bg-emerald-500 hover:bg-emerald-500">{c.unread_count}</Badge>
                  )}
                </div>
                {(c.pipeline_stage || c.status !== "open") && (
                  <div className="flex items-center gap-1 mt-1">
                    {c.pipeline_stage && (
                      <span className="text-[9px] uppercase tracking-wide text-emerald-400">
                        {STAGES.find((s) => s.id === c.pipeline_stage)?.label || c.pipeline_stage}
                      </span>
                    )}
                    {c.status !== "open" && (
                      <span className="text-[9px] uppercase tracking-wide text-muted-foreground">· {c.status}</span>
                    )}
                  </div>
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Chat */}
        <div className="flex-1 flex flex-col min-w-0">
          {!active ? (
            <div className="flex-1 flex items-center justify-center text-muted-foreground">
              <div className="text-center">
                <MessageSquare className="w-10 h-10 mx-auto mb-2 opacity-40" />
                <p className="text-sm">Selecione uma conversa</p>
              </div>
            </div>
          ) : (
            <>
              <div className="px-4 py-3 border-b border-border/50 space-y-2">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="text-sm font-semibold truncate">{active.display_name || formatPhoneBR(active.phone)}</p>
                    <p className="text-[11px] text-muted-foreground">{formatPhoneBR(active.phone)} · {active.channel || "whatsapp"}</p>
                  </div>
                  <div className="flex items-center gap-1.5">
                    {/* Transfer */}
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button size="sm" variant="outline" className="h-7 text-[11px]"><UserCog className="w-3 h-3 mr-1" />Transferir</Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-56 p-2 space-y-1">
                        <p className="text-[10px] uppercase text-muted-foreground px-1">Atribuir a</p>
                        <button onClick={() => transferTo(null)} className="w-full text-left px-2 py-1 rounded hover:bg-accent text-[12px]">Ninguém (liberar)</button>
                        {staff.map((s) => (
                          <button key={s.user_id} onClick={() => transferTo(s.user_id)} className="w-full text-left px-2 py-1 rounded hover:bg-accent text-[12px] truncate">
                            {s.full_name || s.user_id.slice(0, 8)} <span className="text-[10px] text-muted-foreground">· {s.role}</span>
                          </button>
                        ))}
                        {staff.length === 0 && <p className="text-[11px] text-muted-foreground px-1">Sem equipe cadastrada.</p>}
                      </PopoverContent>
                    </Popover>
                    {/* Stage */}
                    <Select value={active.pipeline_stage || "none"} onValueChange={(v) => setStage(v === "none" ? null : v)}>
                      <SelectTrigger className="h-7 w-32 text-[11px]"><SelectValue placeholder="Pipeline" /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">— Sem estágio</SelectItem>
                        {STAGES.map((s) => <SelectItem key={s.id} value={s.id}>{s.label}</SelectItem>)}
                      </SelectContent>
                    </Select>
                    {/* Status */}
                    <Select value={active.status || "open"} onValueChange={setConvStatus}>
                      <SelectTrigger className="h-7 w-24 text-[11px]"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="open">Aberta</SelectItem>
                        <SelectItem value="snoozed">Adiada</SelectItem>
                        <SelectItem value="closed">Fechada</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                {/* Tags row */}
                <div className="flex flex-wrap items-center gap-1.5">
                  {activeTags.map((t) => (
                    <Badge key={t.id} variant="outline" className="text-[10px] gap-1 border-0" style={{ background: t.color + "22", color: t.color }}>
                      {t.name}
                      <button onClick={() => toggleTag(t.id)} className="opacity-60 hover:opacity-100"><X className="w-2.5 h-2.5" /></button>
                    </Badge>
                  ))}
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button size="sm" variant="ghost" className="h-6 text-[10px] gap-1"><TagIcon className="w-3 h-3" />+ Tag</Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-56 p-2 space-y-2">
                      <div className="space-y-1 max-h-48 overflow-y-auto">
                        {allTags.length === 0 && <p className="text-[11px] text-muted-foreground">Nenhuma tag criada.</p>}
                        {allTags.map((t) => {
                          const on = convTagIds.includes(t.id);
                          return (
                            <button key={t.id} onClick={() => toggleTag(t.id)} className={`w-full text-left px-2 py-1 rounded text-[12px] flex items-center justify-between hover:bg-accent ${on ? "bg-accent/60" : ""}`}>
                              <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full" style={{ background: t.color }} />{t.name}</span>
                              {on && <span className="text-[10px] text-emerald-400">✓</span>}
                            </button>
                          );
                        })}
                      </div>
                      <div className="flex items-center gap-1 pt-2 border-t border-border/50">
                        <Input value={newTagName} onChange={(e) => setNewTagName(e.target.value)} placeholder="Nova tag" className="h-7 text-[11px]" />
                        <Button size="sm" className="h-7 text-[11px]" onClick={createTag}>+</Button>
                      </div>
                    </PopoverContent>
                  </Popover>
                </div>
              </div>
              <div className="flex-1 overflow-y-auto px-4 py-4 space-y-2 bg-muted/20">
                {messages.map((m) => (
                  <div key={m.id} className={`flex ${m.direction === "out" ? "justify-end" : "justify-start"}`}>
                    <div className={`max-w-[70%] rounded-2xl px-3 py-2 text-sm ${m.direction === "out" ? "bg-emerald-500/20 text-foreground" : "bg-card border border-border/50"}`}>
                      <p className="whitespace-pre-wrap break-words">{m.body}</p>
                      <p className="text-[10px] text-muted-foreground mt-1 text-right">
                        {m.source !== "manual" && <span className="mr-1">[{m.source}]</span>}
                        {fmtTime(m.created_at)}
                      </p>
                    </div>
                  </div>
                ))}
                {messages.length === 0 && (
                  <div className="text-center text-xs text-muted-foreground py-8">Sem mensagens ainda.</div>
                )}
              </div>
              <div className="p-3 border-t border-border/50 space-y-2">
                <textarea
                  value={draft}
                  onChange={(e) => setDraft(e.target.value)}
                  onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSend(); } }}
                  placeholder="Escreva uma mensagem..."
                  className="w-full resize-none rounded-xl border border-border/50 bg-background px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-emerald-500 min-h-[60px]"
                  rows={2}
                />
                <div className="flex items-center justify-between">
                  <Button size="sm" variant="outline" onClick={handleAiSuggest} disabled={aiLoading}>
                    {aiLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin mr-1" /> : <Sparkles className="w-3.5 h-3.5 mr-1" />}
                    Sugerir com IA
                  </Button>
                  <Button size="sm" onClick={handleSend} disabled={sending || !draft.trim()}>
                    {sending ? <Loader2 className="w-3.5 h-3.5 animate-spin mr-1" /> : <Send className="w-3.5 h-3.5 mr-1" />}
                    Enviar
                  </Button>
                </div>
              </div>
            </>
          )}
        </div>

        {/* Dossier */}
        <div className="w-80 border-l border-border/50 flex flex-col">
          <div className="px-4 py-3 border-b border-border/50">
            <p className="text-sm font-semibold">Dossiê do aluno</p>
          </div>
          <div className="flex-1 overflow-y-auto">
            <StudentDossier phone={active?.phone || null} />
          </div>
        </div>
      </div>
    </div>
  );
}