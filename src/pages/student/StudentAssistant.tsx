import { useEffect, useRef, useState } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "@/hooks/use-toast";
import { Loader2, Send, Trash2, Bot, User } from "lucide-react";

interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  ts: number;
}

const STORAGE_KEY = "sth_ai_chat_v1";
const WELCOME: ChatMessage = {
  id: "welcome",
  role: "assistant",
  ts: Date.now(),
  content:
    "Olá! Sou o assistente da STH METHOD. Tenho acesso ao seu dossiê (dieta, treino, protocolo, evolução). Pergunte sobre macros, hidratação, treino, suplementação ou tire dúvidas sobre o método. Para alterar dieta/treino/protocolo, sempre fale com seu consultor humano.",
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

export default function StudentAssistant() {
  const { user } = useAuth();
  const [messages, setMessages] = useState<ChatMessage[]>([WELCOME]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Hydrate from localStorage when user is known
  useEffect(() => {
    if (user?.id) setMessages(loadHistory(user.id));
  }, [user?.id]);

  // Persist
  useEffect(() => {
    if (!user?.id) return;
    try {
      localStorage.setItem(`${STORAGE_KEY}:${user.id}`, JSON.stringify(messages.slice(-50)));
    } catch {}
  }, [messages, user?.id]);

  // Auto-scroll to bottom
  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, loading]);

  // Focus textarea
  useEffect(() => {
    if (!loading) textareaRef.current?.focus();
  }, [loading, messages.length]);

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
      const { data, error } = await supabase.functions.invoke("student-ai-chat", {
        body: { messages: payload },
      });
      if (error) throw error;
      const reply = (data as any)?.response?.trim();
      if (!reply) throw new Error("Resposta vazia");
      setMessages((m) => [
        ...m,
        { id: crypto.randomUUID(), role: "assistant", content: reply, ts: Date.now() },
      ]);
    } catch (e: any) {
      toast({ title: "Erro", description: e?.message || "Falha ao consultar o assistente" });
      setMessages((m) => [
        ...m,
        {
          id: crypto.randomUUID(),
          role: "assistant",
          ts: Date.now(),
          content:
            "Tive um problema para responder agora. Tente novamente em instantes ou fale com o consultor: https://wa.me/5521998496289",
        },
      ]);
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
    <DashboardLayout role="student" title="Assistente IA" subtitle="Tire dúvidas sobre seu plano com base no seu dossiê">
      <div className="flex flex-col h-[calc(100vh-220px)] min-h-[480px] gap-3">
        <div
          ref={scrollRef}
          className="flex-1 overflow-y-auto rounded-2xl border border-border/40 bg-card/30 p-4 space-y-4"
        >
          {messages.map((m) => (
            <div key={m.id} className={`flex gap-2 ${m.role === "user" ? "justify-end" : "justify-start"}`}>
              {m.role === "assistant" && (
                <div className="shrink-0 w-7 h-7 rounded-full bg-primary/15 text-primary grid place-items-center">
                  <Bot className="w-4 h-4" />
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
                <Bot className="w-4 h-4" />
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
            placeholder="Pergunte algo sobre sua dieta, treino, protocolo..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={onKeyDown}
            disabled={loading}
            className="resize-none border-0 focus-visible:ring-0 bg-transparent"
          />
          <div className="flex flex-col gap-1">
            <Button size="icon" onClick={send} disabled={loading || !input.trim()} aria-label="Enviar">
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
            </Button>
            <Button size="icon" variant="ghost" onClick={clearChat} aria-label="Limpar conversa" title="Limpar conversa">
              <Trash2 className="w-4 h-4" />
            </Button>
          </div>
        </Card>
        <p className="text-[10px] text-muted-foreground text-center">
          As respostas são geradas por IA e não substituem orientação do consultor humano.
        </p>
      </div>
    </DashboardLayout>
  );
}