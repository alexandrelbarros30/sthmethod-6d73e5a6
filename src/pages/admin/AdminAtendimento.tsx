import { useMemo, useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useSearchParams, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import DashboardLayout from "@/components/DashboardLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import CallBlockPanel from "@/components/admin/CallBlockPanel";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "@/hooks/use-toast";
import {
  Headphones,
  Send,
  Inbox,
  Search,
  Sparkles,
  AlertTriangle,
  Users,
  Clock,
  CheckCircle2,
  Megaphone,
  HeartHandshake,
  LayoutGrid,
  List as ListIcon,
  FileText,
  Tags as TagsIcon,
} from "lucide-react";

type Channel = "sth_one" | "fale_nutri";

const STATUS_BY_CHANNEL: Record<Channel, { id: string; label: string }[]> = {
  sth_one: [
    { id: "novo_lead", label: "Novo Lead" },
    { id: "em_atendimento", label: "Em Atendimento" },
    { id: "checkout_enviado", label: "Checkout Enviado" },
    { id: "pagamento_pendente", label: "Pagamento Pendente" },
    { id: "pagamento_aprovado", label: "Pagamento Aprovado" },
    { id: "convertido", label: "Convertido" },
    { id: "perdido", label: "Perdido" },
  ],
  fale_nutri: [
    { id: "aguardando", label: "Aguardando" },
    { id: "prioridade_sensivel", label: "Prioridade Sensível" },
    { id: "em_acompanhamento", label: "Em Acompanhamento" },
    { id: "aguardando_atualizacao", label: "Aguardando Atualização" },
    { id: "ajuste_solicitado", label: "Ajuste Solicitado" },
    { id: "finalizado", label: "Finalizado" },
  ],
};

const PRIORITY_STYLE: Record<string, string> = {
  sensitive: "bg-rose-500/15 text-rose-400 border-rose-500/30",
  high: "bg-amber-500/15 text-amber-400 border-amber-500/30",
  medium: "bg-sky-500/15 text-sky-400 border-sky-500/30",
  low: "bg-zinc-500/15 text-zinc-400 border-zinc-500/30",
};

const CHANNEL_LABEL: Record<Channel, string> = {
  sth_one: "STH One",
  fale_nutri: "Fale com o Nutri",
};

const CHANNEL_ACCENT: Record<Channel, string> = {
  sth_one: "text-amber-400",
  fale_nutri: "text-emerald-400",
};

/* ---------------------- Dashboard ---------------------- */
const DashboardCards = ({ channel }: { channel: Channel }) => {
  const { data } = useQuery({
    queryKey: ["crm-atendimento-stats", channel],
    queryFn: async () => {
      const today = new Date(); today.setHours(0,0,0,0);
      const [tickets, msgs] = await Promise.all([
        supabase.from("crm_tickets").select("id,status,priority,closed_at,first_message_at,created_at").eq("channel", channel),
        supabase.from("crm_ticket_messages").select("id,direction,created_at").gte("created_at", today.toISOString()),
      ]);
      const list = tickets.data || [];
      const msgList = msgs.data || [];
      const todayIso = today.toISOString();
      const novos = list.filter((t: any) => t.created_at >= todayIso).length;
      const abertos = list.filter((t: any) => !t.closed_at).length;
      const sensiveis = list.filter((t: any) => t.priority === "sensitive" && !t.closed_at).length;
      const finalizados = list.filter((t: any) => t.closed_at && t.closed_at >= todayIso).length;
      const atendidosHoje = msgList.filter((m: any) => m.direction === "in").length;
      const pagamentos = list.filter((t: any) => t.status === "pagamento_pendente").length;
      return { novos, abertos, sensiveis, finalizados, atendidosHoje, pagamentos };
    },
  });

  const cards = [
    { label: "Atendimentos hoje", value: data?.atendidosHoje ?? 0, icon: Inbox },
    { label: channel === "sth_one" ? "Novos leads" : "Novas conversas", value: data?.novos ?? 0, icon: Sparkles },
    { label: "Em aberto", value: data?.abertos ?? 0, icon: Users },
    { label: "Prioridade sensível", value: data?.sensiveis ?? 0, icon: AlertTriangle },
    { label: "Pagamentos pendentes", value: data?.pagamentos ?? 0, icon: Clock },
    { label: "Finalizados hoje", value: data?.finalizados ?? 0, icon: CheckCircle2 },
  ];

  return (
    <div className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-6">
      {cards.map((c) => (
        <Card key={c.label} className="border-border/40">
          <CardContent className="p-4">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-[10px] uppercase tracking-wider text-muted-foreground">{c.label}</p>
                <p className="mt-1.5 text-2xl font-semibold tracking-tight">{c.value}</p>
              </div>
              <c.icon className={`h-4 w-4 ${CHANNEL_ACCENT[channel]}`} />
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};

/* ---------------------- Ticket list + chat ---------------------- */
const TicketsPanel = ({ channel }: { channel: Channel }) => {
  const qc = useQueryClient();
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("open");
  const [reply, setReply] = useState("");
  const [sending, setSending] = useState(false);

  const { data: tickets } = useQuery({
    queryKey: ["crm-tickets", channel, statusFilter, search],
    queryFn: async () => {
      let q = supabase
        .from("crm_tickets")
        .select("id, protocol, status, priority, last_message_at, created_at, closed_at, tags, contact_id, internal_notes")
        .eq("channel", channel)
        .order("last_message_at", { ascending: false })
        .limit(200);
      if (statusFilter === "open") q = q.is("closed_at", null);
      else if (statusFilter === "closed") q = q.not("closed_at", "is", null);
      else if (statusFilter !== "all") q = q.eq("status", statusFilter);
      const { data } = await q;
      const ids = (data || []).map((t: any) => t.contact_id);
      let contacts: any[] = [];
      if (ids.length) {
        const { data: cs } = await supabase
          .from("crm_contacts")
          .select("id, full_name, phone, kind, plan_name, plan_end")
          .in("id", ids);
        contacts = cs || [];
      }
      const byId = new Map(contacts.map((c) => [c.id, c]));
      const enriched = (data || []).map((t: any) => ({ ...t, contact: byId.get(t.contact_id) }));
      if (!search.trim()) return enriched;
      const s = search.toLowerCase();
      return enriched.filter(
        (t: any) =>
          (t.protocol || "").toLowerCase().includes(s) ||
          (t.contact?.full_name || "").toLowerCase().includes(s) ||
          (t.contact?.phone || "").includes(s.replace(/\D/g, "")),
      );
    },
  });

  useEffect(() => {
    if (!selectedId && tickets && tickets.length) setSelectedId(tickets[0].id);
  }, [tickets, selectedId]);

  const selected = useMemo(() => tickets?.find((t: any) => t.id === selectedId), [tickets, selectedId]);

  const { data: messages } = useQuery({
    queryKey: ["crm-ticket-msgs", selectedId],
    enabled: !!selectedId,
    queryFn: async () => {
      const { data } = await supabase
        .from("crm_ticket_messages")
        .select("*")
        .eq("ticket_id", selectedId!)
        .order("created_at", { ascending: true })
        .limit(500);
      return data || [];
    },
    refetchInterval: 6000,
  });

  const sendMessage = async () => {
    if (!selected || !reply.trim()) return;
    setSending(true);
    try {
      const { data: s } = await supabase.auth.getSession();
      const resp = await fetch(
        `https://${import.meta.env.VITE_SUPABASE_PROJECT_ID}.supabase.co/functions/v1/crm-send`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${s.session?.access_token}`,
          },
          body: JSON.stringify({ ticket_id: selected.id, message: reply }),
        },
      );
      const json = await resp.json().catch(() => ({}));
      if (!resp.ok || !json.ok) throw new Error(json?.error || "Falha ao enviar");
      setReply("");
      qc.invalidateQueries({ queryKey: ["crm-ticket-msgs", selected.id] });
      qc.invalidateQueries({ queryKey: ["crm-tickets", channel] });
    } catch (e: any) {
      toast({ title: "Erro ao enviar", description: String(e?.message || e), variant: "destructive" });
    } finally {
      setSending(false);
    }
  };

  const updateTicket = useMutation({
    mutationFn: async (patch: any) => {
      if (!selected) return;
      await supabase.from("crm_tickets").update(patch).eq("id", selected.id);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["crm-tickets", channel] });
    },
  });

  const closeTicket = () => {
    if (!selected) return;
    updateTicket.mutate({ closed_at: new Date().toISOString(), status: channel === "fale_nutri" ? "finalizado" : "convertido" });
  };

  return (
    <div className="grid h-[calc(100vh-22rem)] min-h-[520px] grid-cols-1 gap-3 lg:grid-cols-[320px_1fr_280px]">
      {/* List */}
      <Card className="overflow-hidden border-border/40">
        <div className="border-b border-border/40 p-3 space-y-2">
          <div className="relative">
            <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-muted-foreground" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar nome, telefone ou protocolo"
              className="h-9 pl-8 text-sm"
            />
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="h-9 text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="open">Apenas abertos</SelectItem>
              <SelectItem value="closed">Encerrados</SelectItem>
              <SelectItem value="all">Todos</SelectItem>
              {STATUS_BY_CHANNEL[channel].map((s) => (
                <SelectItem key={s.id} value={s.id}>{s.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <ScrollArea className="h-[calc(100%-7rem)]">
          <div className="divide-y divide-border/40">
            {(tickets || []).map((t: any) => {
              const active = t.id === selectedId;
              return (
                <button
                  key={t.id}
                  onClick={() => setSelectedId(t.id)}
                  className={`w-full px-3 py-2.5 text-left transition ${active ? "bg-foreground/5" : "hover:bg-foreground/[0.03]"}`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="truncate text-sm font-medium">{t.contact?.full_name || t.contact?.phone || "Sem nome"}</span>
                    <Badge variant="outline" className={`text-[9px] ${PRIORITY_STYLE[t.priority] || ""}`}>{t.priority}</Badge>
                  </div>
                  <div className="mt-1 flex items-center justify-between text-[11px] text-muted-foreground">
                    <span className="font-mono">{t.protocol}</span>
                    <span>{new Date(t.last_message_at).toLocaleString("pt-BR", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" })}</span>
                  </div>
                  <div className="mt-1 text-[11px] text-muted-foreground/80">{STATUS_BY_CHANNEL[channel].find((s) => s.id === t.status)?.label || t.status}</div>
                </button>
              );
            })}
            {(tickets || []).length === 0 && (
              <div className="p-6 text-center text-xs text-muted-foreground">Sem atendimentos.</div>
            )}
          </div>
        </ScrollArea>
      </Card>

      {/* Chat */}
      <Card className="flex flex-col overflow-hidden border-border/40">
        {selected ? (
          <>
            <div className="flex items-center justify-between border-b border-border/40 p-3">
              <div>
                <p className="text-sm font-semibold">{selected.contact?.full_name || selected.contact?.phone}</p>
                <p className="text-[11px] text-muted-foreground">
                  <span className="font-mono">{selected.protocol}</span> · {selected.contact?.phone}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <Select value={selected.status} onValueChange={(v) => updateTicket.mutate({ status: v })}>
                  <SelectTrigger className="h-8 w-44 text-xs"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {STATUS_BY_CHANNEL[channel].map((s) => (
                      <SelectItem key={s.id} value={s.id}>{s.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Button variant="outline" size="sm" onClick={closeTicket}>Encerrar</Button>
              </div>
            </div>
            <ScrollArea className="flex-1 px-4 py-3">
              <div className="space-y-3">
                {(messages || []).map((m: any) => (
                  <div key={m.id} className={`flex ${m.direction === "out" ? "justify-end" : "justify-start"}`}>
                    <div className={`max-w-[78%] rounded-2xl px-3 py-2 text-sm ${m.direction === "out" ? "bg-emerald-500/15 text-foreground" : "bg-muted text-foreground"}`}>
                      <p className="whitespace-pre-wrap break-words">{m.body || (m.media_url ? "📎 mídia" : "")}</p>
                      <p className="mt-1 text-[10px] text-muted-foreground">{new Date(m.created_at).toLocaleString("pt-BR")}</p>
                    </div>
                  </div>
                ))}
                {(messages || []).length === 0 && (
                  <p className="py-8 text-center text-xs text-muted-foreground">Sem mensagens ainda.</p>
                )}
              </div>
            </ScrollArea>
            <div className="border-t border-border/40 p-3 space-y-2">
              <Textarea
                value={reply}
                onChange={(e) => setReply(e.target.value)}
                placeholder={channel === "fale_nutri" ? "Escreva com cuidado — fala humanizada com o aluno…" : "Resposta comercial direta…"}
                rows={2}
                className="resize-none text-sm"
              />
              <div className="flex justify-end">
                <Button size="sm" disabled={sending || !reply.trim()} onClick={sendMessage} className="gap-2">
                  <Send className="h-3.5 w-3.5" /> {sending ? "Enviando…" : "Enviar"}
                </Button>
              </div>
            </div>
          </>
        ) : (
          <div className="flex flex-1 items-center justify-center text-sm text-muted-foreground">
            Selecione um atendimento.
          </div>
        )}
      </Card>

      {/* Side panel */}
      <Card className="overflow-hidden border-border/40">
        {selected ? (
          <div className="space-y-3 p-4">
            <div>
              <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Contato</p>
              <p className="text-sm font-medium">{selected.contact?.full_name || "—"}</p>
              <p className="text-xs text-muted-foreground">{selected.contact?.phone}</p>
            </div>
            <div>
              <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Tipo</p>
              <p className="text-sm capitalize">{selected.contact?.kind || "—"}</p>
            </div>
            <div>
              <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Plano</p>
              <p className="text-sm">{selected.contact?.plan_name || "Sem plano"}</p>
              {selected.contact?.plan_end && (
                <p className="text-[11px] text-muted-foreground">Até {new Date(selected.contact.plan_end).toLocaleDateString("pt-BR")}</p>
              )}
            </div>
            <div>
              <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Tags</p>
              <div className="mt-1 flex flex-wrap gap-1">
                {(selected.tags || []).map((t: string) => (
                  <Badge key={t} variant="outline" className="text-[10px]">{t}</Badge>
                ))}
                {(!selected.tags || selected.tags.length === 0) && (
                  <span className="text-[11px] text-muted-foreground">—</span>
                )}
              </div>
            </div>
            <div>
              <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Observações internas</p>
              <Textarea
                rows={4}
                defaultValue={selected.internal_notes || ""}
                onBlur={(e) => updateTicket.mutate({ internal_notes: e.target.value })}
                className="mt-1 resize-none text-xs"
                placeholder="Anote contexto interno…"
              />
            </div>
          </div>
        ) : (
          <div className="flex h-full items-center justify-center p-4 text-xs text-muted-foreground">
            Selecione um atendimento.
          </div>
        )}
      </Card>
    </div>
  );
};

/* ---------------------- Kanban ---------------------- */
const KanbanPanel = ({ channel }: { channel: Channel }) => {
  const qc = useQueryClient();
  const { data: tickets } = useQuery({
    queryKey: ["crm-tickets-kanban", channel],
    queryFn: async () => {
      const { data } = await supabase
        .from("crm_tickets")
        .select("id, protocol, status, priority, last_message_at, contact_id")
        .eq("channel", channel)
        .is("closed_at", null)
        .order("last_message_at", { ascending: false })
        .limit(500);
      const ids = (data || []).map((t: any) => t.contact_id);
      const { data: cs } = ids.length
        ? await supabase.from("crm_contacts").select("id, full_name, phone").in("id", ids)
        : { data: [] as any[] };
      const byId = new Map((cs || []).map((c: any) => [c.id, c]));
      return (data || []).map((t: any) => ({ ...t, contact: byId.get(t.contact_id) }));
    },
  });

  const move = async (id: string, status: string) => {
    await supabase.from("crm_tickets").update({ status }).eq("id", id);
    qc.invalidateQueries({ queryKey: ["crm-tickets-kanban", channel] });
  };

  return (
    <div className="-mx-2 overflow-x-auto px-2">
      <div className="flex gap-3" style={{ minWidth: STATUS_BY_CHANNEL[channel].length * 280 }}>
        {STATUS_BY_CHANNEL[channel].map((col) => {
          const items = (tickets || []).filter((t: any) => t.status === col.id);
          return (
            <div
              key={col.id}
              className="w-[260px] shrink-0 rounded-2xl border border-border/40 bg-card/40 p-3"
              onDragOver={(e) => e.preventDefault()}
              onDrop={(e) => {
                const id = e.dataTransfer.getData("text/plain");
                if (id) move(id, col.id);
              }}
            >
              <div className="mb-2 flex items-center justify-between">
                <p className="text-xs font-semibold">{col.label}</p>
                <Badge variant="outline" className="text-[10px]">{items.length}</Badge>
              </div>
              <div className="space-y-2">
                {items.map((t: any) => (
                  <div
                    key={t.id}
                    draggable
                    onDragStart={(e) => e.dataTransfer.setData("text/plain", t.id)}
                    className="cursor-grab rounded-xl border border-border/40 bg-background/80 p-2.5 text-xs shadow-sm transition hover:border-emerald-500/30"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="truncate font-medium">{t.contact?.full_name || t.contact?.phone || "Sem nome"}</span>
                      <Badge variant="outline" className={`text-[9px] ${PRIORITY_STYLE[t.priority] || ""}`}>{t.priority}</Badge>
                    </div>
                    <p className="mt-1 font-mono text-[10px] text-muted-foreground">{t.protocol}</p>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

/* ---------------------- Templates ---------------------- */
const TemplatesPanel = ({ channel }: { channel: Channel }) => {
  const qc = useQueryClient();
  const { data } = useQuery({
    queryKey: ["crm-op-templates", channel],
    queryFn: async () => {
      const { data } = await supabase
        .from("crm_op_templates")
        .select("*")
        .in("channel", [channel, "both"])
        .order("category", { ascending: true });
      return data || [];
    },
  });

  const [draft, setDraft] = useState({ title: "", category: "boas_vindas", body: "" });

  const add = async () => {
    if (!draft.title || !draft.body) return;
    await supabase.from("crm_op_templates").insert({ ...draft, channel });
    setDraft({ title: "", category: "boas_vindas", body: "" });
    qc.invalidateQueries({ queryKey: ["crm-op-templates", channel] });
  };
  const remove = async (id: string) => {
    await supabase.from("crm_op_templates").delete().eq("id", id);
    qc.invalidateQueries({ queryKey: ["crm-op-templates", channel] });
  };

  return (
    <div className="grid gap-3 lg:grid-cols-[1fr_360px]">
      <Card className="border-border/40">
        <CardContent className="space-y-2 p-4">
          {(data || []).map((t: any) => (
            <div key={t.id} className="rounded-xl border border-border/40 p-3">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-semibold">{t.title}</p>
                  <p className="text-[10px] uppercase tracking-wider text-muted-foreground">{t.category} · {t.channel}</p>
                </div>
                <Button variant="ghost" size="sm" onClick={() => remove(t.id)}>Remover</Button>
              </div>
              <p className="mt-2 whitespace-pre-wrap text-xs text-muted-foreground">{t.body}</p>
            </div>
          ))}
          {(data || []).length === 0 && <p className="py-6 text-center text-xs text-muted-foreground">Sem templates.</p>}
        </CardContent>
      </Card>
      <Card className="border-border/40">
        <CardContent className="space-y-2 p-4">
          <p className="text-sm font-semibold">Novo template</p>
          <Input placeholder="Título" value={draft.title} onChange={(e) => setDraft({ ...draft, title: e.target.value })} />
          <Select value={draft.category} onValueChange={(v) => setDraft({ ...draft, category: v })}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              {["boas_vindas","registrado","pagamento_pendente","aluno_ativo","atualizacao","encerramento","ausencia"].map((c) => (
                <SelectItem key={c} value={c}>{c}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Textarea placeholder="Corpo. Use {protocolo} e {nome}." rows={6} value={draft.body} onChange={(e) => setDraft({ ...draft, body: e.target.value })} />
          <Button onClick={add} className="w-full">Salvar template</Button>
        </CardContent>
      </Card>
    </div>
  );
};

/* ---------------------- Page ---------------------- */
export default function AdminAtendimento() {
  const [sp, setSp] = useSearchParams();
  const channel = (sp.get("channel") as Channel) || "sth_one";
  const tab = sp.get("tab") || "tickets";

  const setChannel = (c: Channel) => {
    sp.set("channel", c);
    setSp(sp, { replace: true });
  };
  const setTab = (t: string) => {
    sp.set("tab", t);
    setSp(sp, { replace: true });
  };

  return (
    <DashboardLayout role="admin" title="Atendimento (CRM)" subtitle="Tickets, filas e protocolos STH METHOD">
      <div className="space-y-5">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div>
            <div className="flex items-center gap-2">
              <Headphones className={`h-5 w-5 ${CHANNEL_ACCENT[channel]}`} />
              <span className="text-[11px] uppercase tracking-[0.2em] text-muted-foreground">Central de Atendimento</span>
            </div>
            <h1 className="mt-1 text-2xl font-semibold tracking-tight">
              {CHANNEL_LABEL[channel]}
            </h1>
            <p className="text-xs text-muted-foreground">
              {channel === "sth_one"
                ? "Canal comercial — leads, planos, pagamentos e onboarding."
                : "Canal sensível — alunos ativos, acompanhamento humanizado."}
            </p>
          </div>
          <div className="inline-flex rounded-full border border-border/60 bg-card/40 p-1">
            <button
              onClick={() => setChannel("sth_one")}
              className={`gap-1.5 rounded-full px-4 py-1.5 text-xs font-medium transition ${channel === "sth_one" ? "bg-foreground text-background" : "text-muted-foreground"}`}
            >
              <Megaphone className="mr-1 inline h-3 w-3" /> STH One
            </button>
            <button
              onClick={() => setChannel("fale_nutri")}
              className={`gap-1.5 rounded-full px-4 py-1.5 text-xs font-medium transition ${channel === "fale_nutri" ? "bg-emerald-500 text-black" : "text-muted-foreground"}`}
            >
              <HeartHandshake className="mr-1 inline h-3 w-3" /> Fale com o Nutri
            </button>
          </div>
        </div>

        <DashboardCards channel={channel} />

        {/* Bloqueio de chamadas — atalho rápido */}
        <CallBlockPanel compact />

        {/* Atalho — Painéis WhatsApp / Fluxos STH One */}
        <Card className="border-emerald-500/20 bg-gradient-to-br from-emerald-500/5 to-transparent">
          <CardContent className="flex flex-wrap items-center justify-between gap-3 py-4">
            <div>
              <p className="text-xs uppercase tracking-[0.18em] text-emerald-400">Painéis WhatsApp</p>
              <p className="text-sm font-medium">Menus interativos STH One — fluxos, filas, tags e roteamento</p>
              <p className="text-xs text-muted-foreground">Configure o menu principal, submenus e direcionamento automático.</p>
            </div>
            <Button asChild className="bg-emerald-500 text-black hover:bg-emerald-400">
              <Link to="/admin/atendimento/fluxos-whatsapp">Abrir painel</Link>
            </Button>
          </CardContent>
        </Card>

        <Tabs value={tab} onValueChange={setTab}>
          <TabsList className="bg-muted/40">
            <TabsTrigger value="tickets" className="gap-1.5"><ListIcon className="h-3.5 w-3.5" /> Tickets</TabsTrigger>
            <TabsTrigger value="kanban" className="gap-1.5"><LayoutGrid className="h-3.5 w-3.5" /> Kanban</TabsTrigger>
            <TabsTrigger value="templates" className="gap-1.5"><FileText className="h-3.5 w-3.5" /> Templates</TabsTrigger>
            <TabsTrigger value="mensagens" className="gap-1.5"><FileText className="h-3.5 w-3.5" /> Mensagens</TabsTrigger>
          </TabsList>
          <TabsContent value="tickets" className="mt-4"><TicketsPanel channel={channel} /></TabsContent>
          <TabsContent value="kanban" className="mt-4"><KanbanPanel channel={channel} /></TabsContent>
          <TabsContent value="templates" className="mt-4"><TemplatesPanel channel={channel} /></TabsContent>
          <TabsContent value="mensagens" className="mt-4">
            <Card>
              <CardContent className="py-10 text-center space-y-4">
                <FileText className="h-10 w-10 mx-auto text-muted-foreground" />
                <div>
                  <h3 className="text-base font-semibold">Central de Mensagens</h3>
                  <p className="text-xs text-muted-foreground max-w-md mx-auto mt-1">
                    Biblioteca completa de templates, mensagens automáticas do sistema, variáveis dinâmicas e histórico de envios.
                  </p>
                </div>
                <Button asChild>
                  <Link to="/admin/messages">Abrir Central de Mensagens</Link>
                </Button>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
}