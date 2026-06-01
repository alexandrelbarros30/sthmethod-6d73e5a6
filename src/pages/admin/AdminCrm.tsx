import { useEffect, useMemo, useState } from "react";
import DashboardSidebar from "@/components/DashboardSidebar";
import { useIsMobile } from "@/hooks/use-mobile";
import { supabase } from "@/integrations/supabase/client";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Send, Search, Plus, Sparkles, Loader2, MessageSquare } from "lucide-react";
import { formatPhoneBR, normalizePhone } from "@/lib/phone";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/contexts/AuthContext";
import StudentDossier from "@/components/admin/crm/StudentDossier";
import { toast } from "@/hooks/use-toast";

interface Conv {
  id: string;
  phone: string;
  display_name: string | null;
  last_message_at: string | null;
  last_message_preview: string | null;
  unread_count: number;
  status: string;
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

  const { data: conversations = [] } = useQuery<Conv[]>({
    queryKey: ["crm-conversations"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("crm_conversations")
        .select("id, phone, display_name, last_message_at, last_message_preview, unread_count, status")
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
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [qc]);

  const active = useMemo(() => conversations.find((c) => c.id === activeId) || null, [conversations, activeId]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return conversations;
    return conversations.filter((c) =>
      (c.display_name || "").toLowerCase().includes(q) ||
      c.phone.includes(q.replace(/\D/g, ""))
    );
  }, [conversations, search]);

  // mark as read when opening
  useEffect(() => {
    if (!activeId) return;
    supabase.from("crm_conversations").update({ unread_count: 0 }).eq("id", activeId).then(() => {
      qc.invalidateQueries({ queryKey: ["crm-conversations"] });
    });
  }, [activeId, qc]);

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
              <div className="px-4 py-3 border-b border-border/50">
                <p className="text-sm font-semibold">{active.display_name || formatPhoneBR(active.phone)}</p>
                <p className="text-[11px] text-muted-foreground">{formatPhoneBR(active.phone)}</p>
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