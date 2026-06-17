import { useEffect, useMemo, useRef, useState } from "react";
import DashboardSidebar from "@/components/DashboardSidebar";
import { useIsMobile } from "@/hooks/use-mobile";
import { supabase } from "@/integrations/supabase/client";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Send, Search, Plus, Sparkles, Loader2, MessageSquare, Smile, Paperclip,
  Image as ImageIcon, FileText, UserCog, Info, X, BellRing, BellOff, Check, CheckCheck,
} from "lucide-react";
import { formatPhoneBR, normalizePhone } from "@/lib/phone";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/contexts/AuthContext";
import StudentDossier from "@/components/admin/crm/StudentDossier";
import { toast } from "@/hooks/use-toast";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import EmojiPicker, { EmojiStyle, Theme } from "emoji-picker-react";

type Provider = "zapi" | "wapi" | "wapi_sucesso";

interface Conv {
  id: string;
  phone: string;
  display_name: string | null;
  last_message_at: string | null;
  last_message_preview: string | null;
  unread_count: number;
  status: string;
  channel: string | null;
  provider: string | null;
  queue_type: string | null;
  assigned_to: string | null;
  pipeline_stage: string | null;
  human_handoff: boolean;
}

interface Msg {
  id: string;
  conversation_id: string;
  direction: "in" | "out";
  body: string | null;
  media_url: string | null;
  media_type: string | null;
  created_at: string;
  source: string;
  status: string;
}

interface Tpl { id: string; name: string; body: string; channel: string; }

const CHANNELS: { id: Provider; label: string; color: string; accent: string; phone: string }[] = [
  { id: "zapi",         label: "Comercial",       color: "#25D366", accent: "emerald", phone: "55 21 99849-6289" },
  { id: "wapi",         label: "Fale com o Nutri", color: "#10b981", accent: "teal",    phone: "55 21 99898-4153" },
  { id: "wapi_sucesso", label: "Sucesso do Aluno", color: "#a78bfa", accent: "violet",  phone: "—" },
];

function convProvider(c: { provider: string | null; queue_type: string | null; channel: string | null }): Provider {
  const p = (c.provider || "").toLowerCase();
  if (p === "zapi" || p === "wapi" || p === "wapi_sucesso") return p as Provider;
  if (c.queue_type === "sucesso") return "wapi_sucesso";
  if (c.queue_type === "comercial" || c.queue_type === "financeiro") return "zapi";
  return "wapi";
}

function fmtTime(s: string | null) {
  if (!s) return "";
  const d = new Date(s);
  const today = new Date();
  if (d.toDateString() === today.toDateString())
    return d.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });
  const y = new Date(today); y.setDate(y.getDate() - 1);
  if (d.toDateString() === y.toDateString()) return "Ontem";
  return d.toLocaleDateString("pt-BR");
}

// WhatsApp-like background pattern (subtle SVG data URL)
const WA_BG = `url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='40' height='40' viewBox='0 0 40 40'><circle cx='20' cy='20' r='1' fill='%23ffffff' opacity='0.04'/></svg>")`;

// Beep using WebAudio (no asset needed)
function playBeep() {
  try {
    const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
    const o = ctx.createOscillator();
    const g = ctx.createGain();
    o.connect(g); g.connect(ctx.destination);
    o.type = "sine"; o.frequency.value = 880;
    g.gain.setValueAtTime(0.0001, ctx.currentTime);
    g.gain.exponentialRampToValueAtTime(0.18, ctx.currentTime + 0.02);
    g.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.35);
    o.start(); o.stop(ctx.currentTime + 0.4);
  } catch {}
}

export default function AdminCrm({ forcedProvider }: { forcedProvider?: Provider } = {}) {
  const { user } = useAuth();
  const qc = useQueryClient();
  const isMobile = useIsMobile();
  const [channel, setChannel] = useState<Provider>(forcedProvider ?? "zapi");
  useEffect(() => { if (forcedProvider) setChannel(forcedProvider); }, [forcedProvider]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [draft, setDraft] = useState("");
  const [sending, setSending] = useState(false);
  const [aiLoading, setAiLoading] = useState(false);
  const [showDossier, setShowDossier] = useState(false);
  const [soundOn, setSoundOn] = useState<boolean>(() => localStorage.getItem("crm_sound") !== "0");
  const fileRef = useRef<HTMLInputElement>(null);
  const docRef = useRef<HTMLInputElement>(null);
  const msgEndRef = useRef<HTMLDivElement>(null);
  const lastSeenIds = useRef<Set<string>>(new Set());

  useEffect(() => { localStorage.setItem("crm_sound", soundOn ? "1" : "0"); }, [soundOn]);

  const { data: conversations = [] } = useQuery<Conv[]>({
    queryKey: ["crm-conversations-all"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("crm_conversations")
        .select("id, phone, display_name, last_message_at, last_message_preview, unread_count, status, channel, provider, queue_type, assigned_to, pipeline_stage, human_handoff")
        .order("last_message_at", { ascending: false, nullsFirst: false })
        .limit(400);
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
        .select("id, conversation_id, direction, body, media_url, media_type, created_at, source, status")
        .eq("conversation_id", activeId!)
        .order("created_at", { ascending: true })
        .limit(500);
      if (error) throw error;
      return (data ?? []) as Msg[];
    },
  });

  const { data: templates = [] } = useQuery<Tpl[]>({
    queryKey: ["crm-templates-quick"],
    queryFn: async () => {
      const { data } = await supabase
        .from("crm_message_templates")
        .select("id, name, body, channel")
        .eq("active", true).eq("silent_dispatch", false)
        .order("name").limit(50);
      return (data ?? []) as Tpl[];
    },
  });

  // Channel counts
  const counts = useMemo(() => {
    const c: Record<Provider, { total: number; unread: number }> = {
      zapi: { total: 0, unread: 0 }, wapi: { total: 0, unread: 0 }, wapi_sucesso: { total: 0, unread: 0 },
    };
    conversations.forEach((conv) => {
      const p = convProvider(conv);
      c[p].total++;
      if (conv.unread_count > 0) c[p].unread += conv.unread_count;
    });
    return c;
  }, [conversations]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return conversations.filter((c) => {
      if (convProvider(c) !== channel) return false;
      if (q) {
        const m = (c.display_name || "").toLowerCase().includes(q) || c.phone.includes(q.replace(/\D/g, ""));
        if (!m) return false;
      }
      return true;
    });
  }, [conversations, channel, search]);

  const active = useMemo(() => conversations.find((c) => c.id === activeId) || null, [conversations, activeId]);
  const activeChannel = active ? convProvider(active) : channel;
  const chMeta = CHANNELS.find((c) => c.id === activeChannel)!;

  // Filtered templates for current channel
  const channelTemplates = useMemo(() => {
    const ch = activeChannel === "zapi" ? "zapi" : "wapi";
    return templates.filter((t) => t.channel === ch || t.channel === "both");
  }, [templates, activeChannel]);

  // Realtime + sound + badge
  useEffect(() => {
    const ch = supabase
      .channel("crm-realtime-chat")
      .on("postgres_changes", { event: "*", schema: "public", table: "crm_conversations" }, () => {
        qc.invalidateQueries({ queryKey: ["crm-conversations-all"] });
      })
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "crm_messages" }, (p: any) => {
        const m = p.new as Msg;
        qc.invalidateQueries({ queryKey: ["crm-messages", m.conversation_id] });
        qc.invalidateQueries({ queryKey: ["crm-conversations-all"] });
        if (m.direction === "in" && !lastSeenIds.current.has(m.id)) {
          lastSeenIds.current.add(m.id);
          if (soundOn) playBeep();
        }
      })
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [qc, soundOn]);

  // Auto-scroll to bottom on new messages / chat open
  useEffect(() => {
    msgEndRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [messages.length, activeId]);

  // Mark read on open
  useEffect(() => {
    if (!activeId) return;
    supabase.from("crm_conversations").update({ unread_count: 0 }).eq("id", activeId).then(() => {
      qc.invalidateQueries({ queryKey: ["crm-conversations-all"] });
    });
  }, [activeId, qc]);

  // Total unread → tab title
  useEffect(() => {
    const total = conversations.reduce((s, c) => s + (c.unread_count || 0), 0);
    document.title = total > 0 ? `(${total}) CRM · STH METHOD` : "CRM · STH METHOD";
  }, [conversations]);

  async function handleNewConversation() {
    const raw = prompt("Telefone do contato (com DDD):");
    if (!raw) return;
    const phone = normalizePhone(raw);
    if (!phone) { toast({ title: "Telefone inválido" }); return; }
    const { data: existing } = await supabase.from("crm_conversations").select("id").eq("phone", phone).maybeSingle();
    if (existing) { setActiveId(existing.id); return; }
    const provider = channel;
    const queue_type = channel === "zapi" ? "comercial" : (channel === "wapi_sucesso" ? "sucesso" : "nutri");
    const { data, error } = await supabase
      .from("crm_conversations")
      .insert({ phone, channel: "whatsapp", status: "open", provider, queue_type })
      .select("id").single();
    if (error) { toast({ title: "Erro", description: error.message }); return; }
    qc.invalidateQueries({ queryKey: ["crm-conversations-all"] });
    setActiveId(data.id);
  }

  async function uploadToBucket(file: File): Promise<string | null> {
    try {
      const ext = file.name.split(".").pop() || "bin";
      const path = `crm/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
      const { error } = await supabase.storage.from("crm-media").upload(path, file, { contentType: file.type });
      if (error) throw error;
      const { data } = supabase.storage.from("crm-media").getPublicUrl(path);
      return data.publicUrl;
    } catch (e: any) {
      toast({ title: "Falha no upload", description: e?.message || "Tente novamente." });
      return null;
    }
  }

  async function handleSend(extra?: { image_url?: string; document_url?: string; document_name?: string }) {
    if (!active || sending) return;
    if (!draft.trim() && !extra?.image_url && !extra?.document_url) return;
    setSending(true);
    try {
      const { error: invErr } = await supabase.functions.invoke("crm-send-whatsapp", {
        body: {
          conversation_id: active.id,
          phone: active.phone,
          body: draft.trim(),
          provider: convProvider(active),
          ...extra,
        },
      });
      if (invErr) throw invErr;
      setDraft("");
    } catch (e: any) {
      await supabase.from("crm_messages").insert({
        conversation_id: active.id, direction: "out", body: draft.trim(),
        media_url: extra?.image_url || extra?.document_url || null,
        media_type: extra?.image_url ? "image" : (extra?.document_url ? "document" : null),
        source: "manual", sent_by: user?.id, status: "queued",
      });
      setDraft("");
      toast({ title: "Mensagem registrada", description: "Envio externo indisponível, salva localmente." });
    } finally { setSending(false); }
  }

  async function handleAttachImage(f: File | null) {
    if (!f || !active) return;
    const url = await uploadToBucket(f);
    if (url) await handleSend({ image_url: url });
  }
  async function handleAttachDoc(f: File | null) {
    if (!f || !active) return;
    const url = await uploadToBucket(f);
    if (url) await handleSend({ document_url: url, document_name: f.name });
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
      toast({ title: "IA indisponível", description: e?.message || "Tente novamente." });
    } finally { setAiLoading(false); }
  }

  return (
    <div className="min-h-screen bg-background">
      <DashboardSidebar role="admin" />
      <div className={`flex flex-col ${isMobile ? "pt-12 h-screen" : "ml-60 h-screen"}`}>
        {/* Channel tabs */}
        <div className="flex items-center gap-1 px-3 pt-2 pb-1.5 border-b border-border/40 bg-background/95 backdrop-blur">
          {CHANNELS.map((c) => {
            const ct = counts[c.id];
            const isActive = channel === c.id;
            return (
              <button
                key={c.id}
                onClick={() => { setChannel(c.id); setActiveId(null); }}
                className={`relative flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
                  isActive ? "text-white shadow-sm" : "text-muted-foreground hover:bg-accent/50"
                }`}
                style={isActive ? { background: c.color } : undefined}
              >
                <span className="w-1.5 h-1.5 rounded-full" style={{ background: isActive ? "#fff" : c.color }} />
                {c.label}
                <span className={`text-[10px] ${isActive ? "text-white/80" : "text-muted-foreground"}`}>· {ct.total}</span>
                {ct.unread > 0 && (
                  <Badge className="h-4 min-w-4 px-1 text-[10px] bg-red-500 hover:bg-red-500 border-0">{ct.unread}</Badge>
                )}
              </button>
            );
          })}
          <div className="ml-auto flex items-center gap-1">
            <Button size="sm" variant="ghost" onClick={() => setSoundOn(!soundOn)} className="h-7 w-7 p-0"
              title={soundOn ? "Som ativado" : "Som mudo"}>
              {soundOn ? <BellRing className="w-4 h-4 text-emerald-500" /> : <BellOff className="w-4 h-4 text-muted-foreground" />}
            </Button>
          </div>
        </div>

        <div className="flex-1 flex min-h-0">
          {/* Inbox */}
          <div className={`${isMobile && activeId ? "hidden" : "flex"} w-full md:w-80 border-r border-border/50 flex-col`}>
            <div className="p-3 space-y-2 border-b border-border/40">
              <div className="flex items-center justify-between">
                <p className="text-[10px] uppercase tracking-wide text-muted-foreground">{chMeta.phone}</p>
                <Button size="sm" variant="ghost" onClick={handleNewConversation} className="h-7 w-7 p-0">
                  <Plus className="w-4 h-4" />
                </Button>
              </div>
              <div className="relative">
                <Search className="w-3.5 h-3.5 absolute left-2 top-1/2 -translate-y-1/2 text-muted-foreground" />
                <Input value={search} onChange={(e) => setSearch(e.target.value)}
                  placeholder="Buscar conversa..." className="h-8 pl-7 text-xs" />
              </div>
            </div>
            <div className="flex-1 overflow-y-auto">
              {filtered.length === 0 && (
                <div className="p-6 text-xs text-muted-foreground text-center">
                  Nenhuma conversa neste canal.
                </div>
              )}
              {filtered.map((c) => (
                <button
                  key={c.id}
                  onClick={() => setActiveId(c.id)}
                  className={`w-full text-left px-3 py-2.5 border-b border-border/30 hover:bg-accent/40 transition-colors ${activeId === c.id ? "bg-accent/60" : ""}`}
                >
                  <div className="flex items-center gap-2.5">
                    <div className="w-9 h-9 rounded-full flex items-center justify-center text-white text-xs font-semibold shrink-0"
                      style={{ background: chMeta.color }}>
                      {(c.display_name || c.phone).slice(0, 2).toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <p className="text-xs font-medium truncate">{c.display_name || formatPhoneBR(c.phone)}</p>
                        <span className="text-[10px] text-muted-foreground shrink-0">{fmtTime(c.last_message_at)}</span>
                      </div>
                      <div className="flex items-center justify-between gap-2 mt-0.5">
                        <p className="text-[11px] text-muted-foreground truncate">{c.last_message_preview || "—"}</p>
                        {c.unread_count > 0 && (
                          <Badge className="h-4 min-w-4 px-1 text-[10px] border-0 text-white"
                            style={{ background: chMeta.color }}>{c.unread_count}</Badge>
                        )}
                      </div>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Chat */}
          <div className={`${isMobile && !activeId ? "hidden" : "flex"} flex-1 flex-col min-w-0`}>
            {!active ? (
              <div className="flex-1 flex items-center justify-center text-muted-foreground bg-muted/10">
                <div className="text-center">
                  <MessageSquare className="w-12 h-12 mx-auto mb-3 opacity-30" />
                  <p className="text-sm">Selecione uma conversa</p>
                  <p className="text-[11px] mt-1">Canal: {chMeta.label}</p>
                </div>
              </div>
            ) : (
              <>
                {/* Chat header */}
                <div className="px-4 py-2.5 border-b border-border/50 flex items-center gap-3 bg-card/50">
                  {isMobile && (
                    <Button size="sm" variant="ghost" className="h-7 w-7 p-0" onClick={() => setActiveId(null)}>
                      <X className="w-4 h-4" />
                    </Button>
                  )}
                  <div className="w-9 h-9 rounded-full flex items-center justify-center text-white text-xs font-semibold shrink-0"
                    style={{ background: chMeta.color }}>
                    {(active.display_name || active.phone).slice(0, 2).toUpperCase()}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold truncate">{active.display_name || formatPhoneBR(active.phone)}</p>
                    <p className="text-[11px] text-muted-foreground">
                      {formatPhoneBR(active.phone)} · <span style={{ color: chMeta.color }}>{chMeta.label}</span>
                      {active.human_handoff ? " · 🟢 Humano" : " · 🤖 Bot"}
                    </p>
                  </div>
                  <Button size="sm" variant="ghost" className="h-8 w-8 p-0" onClick={() => setShowDossier((v) => !v)}
                    title="Dossiê do aluno">
                    <Info className="w-4 h-4" />
                  </Button>
                </div>

                {/* Messages */}
                <div className="flex-1 overflow-y-auto px-4 py-3 space-y-1.5"
                  style={{ background: "#0b141a", backgroundImage: WA_BG }}>
                  {messages.length === 0 && (
                    <div className="text-center text-xs text-white/40 py-8">Sem mensagens ainda.</div>
                  )}
                  {messages.map((m, i) => {
                    const isOut = m.direction === "out";
                    const prev = messages[i - 1];
                    const sameSide = prev && prev.direction === m.direction;
                    return (
                      <div key={m.id} className={`flex ${isOut ? "justify-end" : "justify-start"} ${sameSide ? "mt-0.5" : "mt-2"}`}>
                        <div className={`max-w-[75%] rounded-lg px-2.5 py-1.5 text-sm shadow-sm ${
                          isOut ? "rounded-tr-sm" : "rounded-tl-sm"
                        }`}
                          style={{
                            background: isOut ? "#005c4b" : "#202c33",
                            color: "#e9edef",
                          }}>
                          {m.media_url && m.media_type === "image" && (
                            <img src={m.media_url} alt="" className="rounded mb-1 max-w-full max-h-60 object-contain" />
                          )}
                          {m.media_url && m.media_type === "document" && (
                            <a href={m.media_url} target="_blank" rel="noopener noreferrer"
                              className="flex items-center gap-2 mb-1 px-2 py-1.5 rounded bg-black/20 hover:bg-black/30">
                              <FileText className="w-4 h-4" />
                              <span className="text-xs truncate">Documento</span>
                            </a>
                          )}
                          {m.body && <p className="whitespace-pre-wrap break-words">{m.body}</p>}
                          <div className="flex items-center justify-end gap-1 mt-0.5">
                            <span className="text-[10px] text-white/50">{fmtTime(m.created_at)}</span>
                            {isOut && (m.status === "sent" ? <CheckCheck className="w-3 h-3 text-white/60" /> : <Check className="w-3 h-3 text-white/40" />)}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                  <div ref={msgEndRef} />
                </div>

                {/* Composer */}
                <div className="border-t border-border/50 bg-card/30">
                  <div className="flex items-end gap-1.5 px-3 py-2">
                    {/* Emoji */}
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button size="sm" variant="ghost" className="h-9 w-9 p-0 shrink-0">
                          <Smile className="w-5 h-5 text-muted-foreground" />
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="p-0 border-0 w-auto" side="top" align="start">
                        <EmojiPicker
                          theme={Theme.DARK}
                          emojiStyle={EmojiStyle.NATIVE}
                          onEmojiClick={(e) => setDraft((d) => d + e.emoji)}
                          width={320} height={380}
                          searchPlaceholder="Buscar emoji..."
                        />
                      </PopoverContent>
                    </Popover>

                    {/* Attach */}
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button size="sm" variant="ghost" className="h-9 w-9 p-0 shrink-0">
                          <Paperclip className="w-5 h-5 text-muted-foreground" />
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-40 p-1.5" side="top" align="start">
                        <button onClick={() => fileRef.current?.click()}
                          className="w-full flex items-center gap-2 px-2 py-1.5 text-xs rounded hover:bg-accent">
                          <ImageIcon className="w-4 h-4 text-emerald-400" /> Imagem
                        </button>
                        <button onClick={() => docRef.current?.click()}
                          className="w-full flex items-center gap-2 px-2 py-1.5 text-xs rounded hover:bg-accent">
                          <FileText className="w-4 h-4 text-blue-400" /> Documento
                        </button>
                      </PopoverContent>
                    </Popover>
                    <input ref={fileRef} type="file" accept="image/*" hidden
                      onChange={(e) => handleAttachImage(e.target.files?.[0] || null)} />
                    <input ref={docRef} type="file" hidden
                      onChange={(e) => handleAttachDoc(e.target.files?.[0] || null)} />

                    {/* Templates */}
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button size="sm" variant="ghost" className="h-9 px-2 shrink-0 text-xs gap-1">
                          <Sparkles className="w-4 h-4 text-amber-400" /> Templates
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-80 p-1.5 max-h-80 overflow-y-auto" side="top" align="start">
                        {channelTemplates.length === 0 && (
                          <p className="text-[11px] text-muted-foreground p-2">Nenhum template para este canal.</p>
                        )}
                        {channelTemplates.map((t) => (
                          <button key={t.id} onClick={() => setDraft(t.body)}
                            className="w-full text-left px-2 py-1.5 rounded hover:bg-accent">
                            <p className="text-xs font-medium truncate">{t.name}</p>
                            <p className="text-[10px] text-muted-foreground line-clamp-2">{t.body}</p>
                          </button>
                        ))}
                      </PopoverContent>
                    </Popover>

                    <textarea
                      value={draft}
                      onChange={(e) => { setDraft(e.target.value); pingTypingLock(); }}
                      onFocus={() => pingTypingLock()}
                      onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSend(); } }}
                      placeholder="Digite uma mensagem..."
                      className="flex-1 resize-none rounded-2xl border border-border/50 bg-background px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-emerald-500 max-h-32 min-h-[36px]"
                      rows={1}
                    />

                    <Button size="sm" variant="ghost" onClick={handleAiSuggest} disabled={aiLoading}
                      className="h-9 w-9 p-0 shrink-0" title="Sugerir com IA">
                      {aiLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4 text-violet-400" />}
                    </Button>

                    <Button size="sm" onClick={() => handleSend()} disabled={sending || !draft.trim()}
                      className="h-9 w-9 p-0 shrink-0 rounded-full"
                      style={{ background: chMeta.color }}>
                      {sending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                    </Button>
                  </div>
                </div>
              </>
            )}
          </div>

          {/* Dossier (toggle) */}
          {showDossier && active && (
            <div className="hidden md:flex w-80 border-l border-border/50 flex-col">
              <div className="px-4 py-3 border-b border-border/50 flex items-center justify-between">
                <p className="text-sm font-semibold">Dossiê do aluno</p>
                <Button size="sm" variant="ghost" className="h-7 w-7 p-0" onClick={() => setShowDossier(false)}>
                  <X className="w-4 h-4" />
                </Button>
              </div>
              <div className="flex-1 overflow-y-auto">
                <StudentDossier phone={active.phone} />
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
