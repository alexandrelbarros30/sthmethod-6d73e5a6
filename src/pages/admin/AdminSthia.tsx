import { useEffect, useRef, useState } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "@/hooks/use-toast";
import { Loader2, Send, Trash2, Brain, User, Sparkles, BookOpen } from "lucide-react";

interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  ts: number;
  learned?: number;
}

const STORAGE_KEY = "sthia_admin_chat_v1";
const WELCOME: ChatMessage = {
  id: "welcome",
  role: "assistant",
  ts: Date.now(),
  content:
    "Sou a STHIA. Modo interno de aprendizado ativo.\n\nMe traga ideias, regras de produto, padrões de copy, decisões de negócio ou fluxos novos — eu organizo, refino e gravo na memória global do projeto.\n\nAcione **Ensinar** quando quiser que eu trate sua mensagem como diretriz oficial.",
};

function loadHistory(userId?: string | null): ChatMessage[] {
  if (typeof window === "undefined" || !userId) return [WELCOME];
  try {
    const raw = localStorage.getItem(`${STORAGE_KEY}:${userId}`);
    if (!raw) return [WELCOME];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) && parsed.length ? parsed : [WELCOME];
  } catch {
    return [WELCOME];
  }
}

export default function AdminSthia() {
  const { user } = useAuth();
  const [messages, setMessages] = useState<ChatMessage[]>([WELCOME]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [teach, setTeach] = useState(true);
  const [memCount, setMemCount] = useState<number | null>(null);
  const [recentMems, setRecentMems] = useState<Array<{ category: string; content: string; created_at: string }>>([]);
  const scrollRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (user?.id) setMessages(loadHistory(user.id));
  }, [user?.id]);

  useEffect(() => {
    if (!user?.id) return;
    try {
      localStorage.setItem(`${STORAGE_KEY}:${user.id}`, JSON.stringify(messages.slice(-100)));
    } catch {}
  }, [messages, user?.id]);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, loading]);

  useEffect(() => {
    if (!loading) textareaRef.current?.focus();
  }, [loading, messages.length]);

  async function refreshMemories() {
    const { data, count } = await supabase
      .from("crm_ai_memory")
      .select("category, content, created_at", { count: "exact" })
      .eq("scope", "global")
      .order("created_at", { ascending: false })
      .limit(8);
    setMemCount(count ?? null);
    setRecentMems((data as any) ?? []);
  }

  useEffect(() => {
    refreshMemories();
  }, []);

  async function send() {
    const text = input.trim();
    if (!text || loading) return;
    const userMsg: ChatMessage = { id: crypto.randomUUID(), role: "user", content: text, ts: Date.now() };
    const next = [...messages, userMsg];
    setMessages(next);
    setInput("");
    setLoading(true);
    try {
      const payload = next
        .filter((m) => m.id !== "welcome")
        .map((m) => ({ role: m.role, content: m.content }));
      const { data, error } = await supabase.functions.invoke("sthia-chat", {
        body: { messages: payload, teach },
      });
      if (error) throw error;
      const reply = (data as any)?.response?.trim();
      const learned = (data as any)?.learned ?? 0;
      if (!reply) throw new Error("Resposta vazia");
      setMessages((m) => [
        ...m,
        { id: crypto.randomUUID(), role: "assistant", content: reply, ts: Date.now(), learned },
      ]);
      if (learned > 0) refreshMemories();
    } catch (e: any) {
      toast({ title: "Erro", description: e?.message || "Falha ao falar com a STHIA" });
    } finally {
      setLoading(false);
    }
  }

  function clearChat() {
    setMessages([WELCOME]);
    if (user?.id) {
      try {
        localStorage.removeItem(`${STORAGE_KEY}:${user.id}`);
      } catch {}
    }
  }

  function onKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      send();
    }
  }

  return (
    <DashboardLayout role="admin" title="STHIA — Cérebro IA" subtitle="Chat interno de aprendizado contínuo da consultoria STH METHOD">
      <div className="grid gap-4 lg:grid-cols-[1fr_320px]">
        {/* Chat */}
        <div className="flex flex-col h-[calc(100vh-220px)] min-h-[520px] gap-3">
          <div
            ref={scrollRef}
            className="flex-1 overflow-y-auto rounded-2xl border border-border/40 bg-card/30 p-4 space-y-4"
          >
            {messages.map((m) => (
              <div key={m.id} className={`flex gap-2 ${m.role === "user" ? "justify-end" : "justify-start"}`}>
                {m.role === "assistant" && (
                  <div className="shrink-0 w-7 h-7 rounded-full bg-primary/15 text-primary grid place-items-center">
                    <Brain className="w-4 h-4" />
                  </div>
                )}
                <div
                  className={
                    m.role === "user"
                      ? "max-w-[80%] rounded-2xl rounded-br-sm bg-primary text-primary-foreground px-3.5 py-2.5 text-sm whitespace-pre-wrap"
                      : "max-w-[85%] text-sm text-foreground whitespace-pre-wrap leading-relaxed"
                  }
                >
                  {m.content}
                  {m.role === "assistant" && (m.learned ?? 0) > 0 && (
                    <div className="mt-2">
                      <Badge variant="outline" className="text-[10px] gap-1">
                        <Sparkles className="w-3 h-3" /> {m.learned} aprendizado{m.learned === 1 ? "" : "s"} salvo{m.learned === 1 ? "" : "s"}
                      </Badge>
                    </div>
                  )}
                </div>
                {m.role === "user" && (
                  <div className="shrink-0 w-7 h-7 rounded-full bg-muted text-muted-foreground grid place-items-center">
                    <User className="w-4 h-4" />
                  </div>
                )}
              </div>
            ))}
            {loading && (
              <div className="flex gap-2 justify-start">
                <div className="shrink-0 w-7 h-7 rounded-full bg-primary/15 text-primary grid place-items-center">
                  <Brain className="w-4 h-4" />
                </div>
                <div className="text-sm text-muted-foreground italic flex items-center gap-2">
                  <Loader2 className="w-3.5 h-3.5 animate-spin" /> pensando...
                </div>
              </div>
            )}
          </div>

          <Card className="p-2 flex items-end gap-2">
            <Textarea
              ref={textareaRef}
              rows={2}
              placeholder={teach ? "Modo Ensinar ativo — escreva regra, ideia ou diretriz..." : "Converse com a STHIA..."}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={onKeyDown}
              disabled={loading}
              className="resize-none border-0 focus-visible:ring-0 bg-transparent"
            />
            <div className="flex flex-col gap-1">
              <Button
                size="sm"
                variant={teach ? "default" : "outline"}
                onClick={() => setTeach((v) => !v)}
                title="Tratar próxima mensagem como diretriz oficial"
                className="gap-1"
              >
                <BookOpen className="w-3.5 h-3.5" /> Ensinar
              </Button>
              <div className="flex gap-1">
                <Button size="icon" onClick={send} disabled={loading || !input.trim()} aria-label="Enviar">
                  {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                </Button>
                <Button size="icon" variant="ghost" onClick={clearChat} aria-label="Limpar conversa" title="Limpar conversa">
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </Card>
          <p className="text-[10px] text-muted-foreground text-center">
            Conversa interna criptografada por sessão. Aprendizados são salvos em <code>crm_ai_memory</code> (escopo global) e usados em todos os canais IA.
          </p>
        </div>

        {/* Memória */}
        <Card className="p-4 h-fit lg:sticky lg:top-4">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-primary" />
              <h3 className="font-semibold text-sm">Memória global</h3>
            </div>
            {memCount !== null && (
              <Badge variant="secondary" className="text-[10px]">{memCount} regras</Badge>
            )}
          </div>
          <div className="space-y-2 max-h-[60vh] overflow-y-auto">
            {recentMems.length === 0 && (
              <p className="text-xs text-muted-foreground">Nenhuma memória global ainda. Comece a ensinar a STHIA.</p>
            )}
            {recentMems.map((m, i) => (
              <div key={i} className="rounded-lg border border-border/40 p-2.5">
                <Badge variant="outline" className="text-[9px] uppercase mb-1.5">{m.category}</Badge>
                <p className="text-xs text-foreground/80 leading-relaxed line-clamp-4">{m.content}</p>
              </div>
            ))}
          </div>
          <Button size="sm" variant="ghost" className="w-full mt-3 text-xs" onClick={refreshMemories}>
            Atualizar
          </Button>
        </Card>
      </div>
    </DashboardLayout>
  );
}