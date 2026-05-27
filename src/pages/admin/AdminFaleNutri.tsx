import { useEffect, useMemo, useState } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useQueryClient, useMutation } from "@tanstack/react-query";
import { toast } from "@/hooks/use-toast";
import {
  Search, Send, Ban, CheckCircle2, Loader2, Plus, Pencil, Trash2, Phone,
  HeartHandshake, Settings2, MessageCircle, RefreshCw, Sparkles, AlertTriangle,
  Users, Clock, BellRing, Calendar, LayoutDashboard, BookOpen, Tag,
} from "lucide-react";

const NUTRI_PHONE = "5521998984153";

const TAG_OPTIONS = [
  "dieta", "treino", "protocolo", "exames",
  "atualizacao-pendente", "urgente", "renovacao", "financeiro",
  "duvida-geral", "alta-demanda", "aguardando-aluno", "aguardando-nutri",
] as const;

const STATUS_LABEL: Record<string, string> = {
  open: "Aberto",
  pending: "Pendente",
  waiting_student: "Aguardando aluno",
  waiting_nutri: "Aguardando Nutri",
  closed: "Encerrado",
};

const PRIORITY_STYLE: Record<string, string> = {
  high: "border-rose-500/50 text-rose-500 bg-rose-500/10",
  medium: "border-amber-500/40 text-amber-500 bg-amber-500/10",
  low: "border-zinc-500/40 text-zinc-400 bg-zinc-500/10",
};

type Profile = { user_id: string; full_name: string; email: string; phone: string };
type ActiveStudent = Profile & {
  plan_name: string;
  end_date: string;
  start_date: string;
  days_left: number;
};

function replaceVars(text: string, ctx: { profile: Profile; plan?: string; start?: string; end?: string; weight?: string; lastUpdate?: string }) {
  const first = ctx.profile.full_name?.split(" ")[0] || "Aluno";
  return text
    .replace(/{nome}/gi, first)
    .replace(/{nome_completo}/gi, ctx.profile.full_name || "Aluno")
    .replace(/{email}/gi, ctx.profile.email || "—")
    .replace(/{telefone}/gi, ctx.profile.phone || "—")
    .replace(/{plano}/gi, ctx.plan || "—")
    .replace(/{data_inicio}/gi, ctx.start || "—")
    .replace(/{data_fim}/gi, ctx.end || "—")
    .replace(/{peso_atual}/gi, ctx.weight || "—")
    .replace(/{ultima_atualizacao}/gi, ctx.lastUpdate || "—")
    .replace(/{link_plataforma}/gi, "https://sthmethod.com.br/login")
    .replace(/{link_fale_com_nutri}/gi, `https://wa.me/${NUTRI_PHONE}`);
}

export default function AdminFaleNutri() {
  const [engine, setEngine] = useState<"personal" | "template" | "gemini" | "hybrid">(
    () => (localStorage.getItem("nutri-engine") as any) || "personal",
  );
  const [savedEngine, setSavedEngine] = useState(engine);

  const saveEngine = () => {
    localStorage.setItem("nutri-engine", engine);
    setSavedEngine(engine);
    toast({ title: "Motor salvo", description: `Padrão: ${engine}` });
  };

  return (
    <DashboardLayout role="admin" title="Fale com o Nutri">
      <div className="space-y-4">
        <header className="flex items-center justify-between flex-wrap gap-3">
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <HeartHandshake className="w-6 h-6 text-emerald-500" /> Fale com o Nutri — CRM
            </h1>
            <p className="text-sm text-muted-foreground">
              Canal exclusivo de atendimento dos alunos ativos da STH METHOD via W-API ({NUTRI_PHONE}).
            </p>
          </div>
          <Badge variant="outline" className="gap-1 border-emerald-500/40 text-emerald-500">
            <Phone className="w-3 h-3" /> {NUTRI_PHONE}
          </Badge>
        </header>

        <Tabs defaultValue="atendimento" className="space-y-4">
          <div className="overflow-x-auto -mx-2 px-2 [&::-webkit-scrollbar]:hidden [scrollbar-width:none]">
            <TabsList className="w-max flex">
              <TabsTrigger value="dashboard" className="whitespace-nowrap"><LayoutDashboard className="w-4 h-4 mr-1" />Dashboard</TabsTrigger>
              <TabsTrigger value="atendimento" className="whitespace-nowrap"><MessageCircle className="w-4 h-4 mr-1" />Atendimento</TabsTrigger>
              <TabsTrigger value="biblioteca" className="whitespace-nowrap"><BookOpen className="w-4 h-4 mr-1" />Biblioteca</TabsTrigger>
              <TabsTrigger value="config" className="whitespace-nowrap"><Settings2 className="w-4 h-4 mr-1" />Configuração</TabsTrigger>
            </TabsList>
          </div>

          {/* Painel global: Motor de resposta */}
          <Card className="p-3 flex items-center gap-3 flex-wrap border-emerald-500/20 bg-emerald-500/5">
            <div className="flex items-center gap-2 min-w-0">
              <Sparkles className="w-4 h-4 text-emerald-500" />
              <div>
                <p className="text-xs font-semibold">Motor de resposta padrão</p>
                <p className="text-[10px] text-muted-foreground">Aplicado a novas mensagens no Atendimento</p>
              </div>
            </div>
            <Select value={engine} onValueChange={(v: any) => setEngine(v)}>
              <SelectTrigger className="h-9 text-xs w-[220px]"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="personal">✍️ Personalizada</SelectItem>
                <SelectItem value="template">📋 Template</SelectItem>
                <SelectItem value="gemini">✨ Gemini IA</SelectItem>
                <SelectItem value="hybrid">🔀 Híbrida</SelectItem>
              </SelectContent>
            </Select>
            <Button
              size="sm"
              onClick={saveEngine}
              disabled={engine === savedEngine}
              className="bg-emerald-500 hover:bg-emerald-600 text-white h-9"
            >
              <CheckCircle2 className="w-4 h-4 mr-1" /> Salvar
            </Button>
            <Badge variant="outline" className="text-[10px] ml-auto border-emerald-500/40 text-emerald-500">
              Ativo: {savedEngine}
            </Badge>
          </Card>

          <TabsContent value="dashboard"><DashboardPanel /></TabsContent>
          <TabsContent value="atendimento"><AttendancePanel globalEngine={savedEngine} /></TabsContent>
          <TabsContent value="biblioteca"><TemplatesPanel /></TabsContent>
          <TabsContent value="config"><ConfigPanel /></TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
}

/* ============================ DASHBOARD ============================ */
function DashboardPanel() {
  const { data, isLoading } = useQuery({
    queryKey: ["nutri-dashboard"],
    queryFn: async () => {
      const today = new Date().toISOString().slice(0, 10);
      const in7 = new Date(Date.now() + 7 * 86400000).toISOString().slice(0, 10);
      const [subs, convs, recent] = await Promise.all([
        supabase.from("subscriptions").select("user_id, end_date").gte("end_date", today),
        supabase.from("nutri_conversations").select("status, priority, last_inbound_at"),
        supabase.from("nutri_messages").select("user_id, body, direction, created_at").order("created_at", { ascending: false }).limit(8),
      ]);
      const active = new Set((subs.data || []).map((s) => s.user_id)).size;
      const open = (convs.data || []).filter((c) => c.status === "open").length;
      const pending = (convs.data || []).filter((c) => c.status === "pending" || c.status === "waiting_nutri").length;
      const high = (convs.data || []).filter((c) => c.priority === "high").length;
      const fifteen = Date.now() - 15 * 86400000;
      const stale = (convs.data || []).filter((c) => c.last_inbound_at && new Date(c.last_inbound_at).getTime() < fifteen).length;
      const renewing = (subs.data || []).filter((s) => s.end_date <= in7).length;
      return { active, open, pending, high, stale, renewing, recent: recent.data || [] };
    },
  });

  if (isLoading || !data) {
    return <div className="flex justify-center py-12"><Loader2 className="w-6 h-6 animate-spin text-muted-foreground" /></div>;
  }

  const cards = [
    { label: "Alunos ativos", value: data.active, icon: Users, color: "text-emerald-500" },
    { label: "Atendimentos abertos", value: data.open, icon: MessageCircle, color: "text-sky-400" },
    { label: "Pendentes", value: data.pending, icon: Clock, color: "text-amber-500" },
    { label: "Prioridade alta", value: data.high, icon: AlertTriangle, color: "text-rose-500" },
    { label: "Atualizações atrasadas", value: data.stale, icon: BellRing, color: "text-orange-400" },
    { label: "Renovações em 7 dias", value: data.renewing, icon: Calendar, color: "text-violet-400" },
  ];

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        {cards.map((c) => (
          <Card key={c.label} className="p-4 space-y-1">
            <c.icon className={`w-5 h-5 ${c.color}`} />
            <p className="text-2xl font-bold">{c.value}</p>
            <p className="text-xs text-muted-foreground">{c.label}</p>
          </Card>
        ))}
      </div>

      <Card className="p-4">
        <h3 className="font-semibold text-sm mb-3 flex items-center gap-2">
          <MessageCircle className="w-4 h-4 text-emerald-500" /> Últimas mensagens
        </h3>
        {data.recent.length === 0 ? (
          <p className="text-xs text-muted-foreground text-center py-6">Sem mensagens ainda.</p>
        ) : (
          <div className="divide-y divide-border/40">
            {data.recent.map((m: any, i: number) => (
              <div key={i} className="py-2 flex items-start justify-between gap-3 text-sm">
                <div className="flex-1 min-w-0">
                  <p className="truncate">
                    <span className={`text-[10px] uppercase mr-2 ${m.direction === "in" ? "text-sky-400" : "text-emerald-500"}`}>
                      {m.direction === "in" ? "recebida" : "enviada"}
                    </span>
                    {m.body || "—"}
                  </p>
                </div>
                <span className="text-[10px] text-muted-foreground whitespace-nowrap">
                  {new Date(m.created_at).toLocaleString("pt-BR")}
                </span>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}

/* ============================ ATENDIMENTO ============================ */
function AttendancePanel({ globalEngine }: { globalEngine: "personal" | "template" | "gemini" | "hybrid" }) {
  const qc = useQueryClient();
  const [search, setSearch] = useState("");
  const [filterPriority, setFilterPriority] = useState<string>("all");
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [draft, setDraft] = useState("");
  const [hint, setHint] = useState("");
  const [sending, setSending] = useState(false);
  const [aiLoading, setAiLoading] = useState(false);
  const [cadastroOpen, setCadastroOpen] = useState(false);
  const [editName, setEditName] = useState("");
  const [editEmail, setEditEmail] = useState("");
  const [editPhone, setEditPhone] = useState("");
  const engine = globalEngine;

  // Alunos ativos com plano
  const { data: activeStudents = [], isLoading: loadingStudents } = useQuery({
    queryKey: ["fale-nutri-active-students-rich"],
    queryFn: async (): Promise<ActiveStudent[]> => {
      const today = new Date().toISOString().slice(0, 10);
      const { data: subs } = await supabase
        .from("subscriptions")
        .select("user_id, end_date, start_date, plan_id")
        .gte("end_date", today)
        .order("end_date", { ascending: true });
      const ids = Array.from(new Set((subs || []).map((s) => s.user_id)));
      if (ids.length === 0) return [];
      const [{ data: profiles }, { data: plans }] = await Promise.all([
        supabase.from("profiles").select("user_id, full_name, email, phone").in("user_id", ids),
        supabase.from("plans").select("id, name"),
      ]);
      const planById = new Map((plans || []).map((p) => [p.id, p.name]));
      const profileById = new Map((profiles || []).map((p) => [p.user_id, p]));
      const seen = new Set<string>();
      const out: ActiveStudent[] = [];
      for (const s of subs || []) {
        if (seen.has(s.user_id)) continue;
        seen.add(s.user_id);
        const p = profileById.get(s.user_id);
        if (!p || !p.phone) continue;
        const days = Math.max(0, Math.floor((new Date(s.end_date).getTime() - Date.now()) / 86400000));
        out.push({
          ...(p as Profile),
          plan_name: planById.get(s.plan_id) || "—",
          start_date: s.start_date,
          end_date: s.end_date,
          days_left: days,
        });
      }
      return out;
    },
  });

  const { data: optOuts = [] } = useQuery({
    queryKey: ["nutri-opt-outs"],
    queryFn: async () => {
      const { data } = await supabase.from("nutri_opt_outs").select("user_id");
      return (data || []).map((o) => o.user_id);
    },
  });
  const optOutSet = useMemo(() => new Set(optOuts), [optOuts]);

  const { data: conversations = [] } = useQuery({
    queryKey: ["nutri-conversations"],
    queryFn: async () => {
      const { data } = await supabase.from("nutri_conversations").select("*").order("last_message_at", { ascending: false });
      return data || [];
    },
  });
  const convByUser = useMemo(() => new Map(conversations.map((c: any) => [c.user_id, c])), [conversations]);

  useEffect(() => {
    const ch = supabase
      .channel("nutri-conv-list")
      .on("postgres_changes", { event: "*", schema: "public", table: "nutri_conversations" }, () => {
        qc.invalidateQueries({ queryKey: ["nutri-conversations"] });
      })
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "nutri_messages" }, () => {
        qc.invalidateQueries({ queryKey: ["nutri-conversations"] });
      })
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [qc]);

  const filtered = useMemo(() => {
    const q = search.toLowerCase().trim();
    return activeStudents.filter((s) => {
      const c: any = convByUser.get(s.user_id);
      if (filterPriority !== "all" && c?.priority !== filterPriority) return false;
      if (filterStatus !== "all" && c?.status !== filterStatus) return false;
      if (!q) return true;
      return s.full_name?.toLowerCase().includes(q) || s.email?.toLowerCase().includes(q) || s.phone?.includes(q);
    });
  }, [activeStudents, search, filterPriority, filterStatus, convByUser]);

  const selected = activeStudents.find((s) => s.user_id === selectedUserId);
  const selectedConv: any = selected ? convByUser.get(selected.user_id) : null;

  const { data: conversation = [], refetch: refetchConv } = useQuery({
    queryKey: ["nutri-conv", selectedUserId],
    enabled: !!selectedUserId,
    queryFn: async () => {
      const { data } = await supabase
        .from("nutri_messages")
        .select("*")
        .eq("user_id", selectedUserId!)
        .order("created_at", { ascending: true })
        .limit(300);
      return data || [];
    },
  });

  useEffect(() => {
    if (!selectedUserId) return;
    // marca como lido ao abrir
    supabase.from("nutri_conversations").update({ unread_count: 0 }).eq("user_id", selectedUserId).then(() => {
      qc.invalidateQueries({ queryKey: ["nutri-conversations"] });
    });
    const ch = supabase
      .channel(`nutri-msgs-${selectedUserId}`)
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "nutri_messages", filter: `user_id=eq.${selectedUserId}` }, () => refetchConv())
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [selectedUserId, refetchConv, qc]);

  const { data: templates = [] } = useQuery({
    queryKey: ["nutri-templates-active"],
    queryFn: async () => {
      const { data } = await supabase.from("nutri_templates").select("*").eq("active", true).order("category").order("tone");
      return data || [];
    },
  });

  // Última atualização (peso) e fotos do aluno
  const { data: meta } = useQuery({
    queryKey: ["nutri-student-meta", selectedUserId],
    enabled: !!selectedUserId,
    queryFn: async () => {
      const [w, photos] = await Promise.all([
        supabase.from("weight_logs").select("weight, logged_at").eq("user_id", selectedUserId!).order("logged_at", { ascending: false }).limit(1).maybeSingle(),
        supabase.from("body_images").select("created_at").eq("user_id", selectedUserId!).order("created_at", { ascending: false }).limit(1).maybeSingle(),
      ]);
      return {
        weight: w.data?.weight ? `${w.data.weight} kg` : "—",
        weightAt: w.data?.logged_at ? new Date(w.data.logged_at).toLocaleDateString("pt-BR") : "—",
        photosAt: photos.data?.created_at ? new Date(photos.data.created_at).toLocaleDateString("pt-BR") : "—",
      };
    },
  });

  const buildCtx = (s: ActiveStudent) => ({
    profile: s,
    plan: s.plan_name,
    start: s.start_date ? new Date(s.start_date).toLocaleDateString("pt-BR") : "—",
    end: s.end_date ? new Date(s.end_date).toLocaleDateString("pt-BR") : "—",
    weight: meta?.weight || "—",
    lastUpdate: meta?.weightAt || "—",
  });

  const toggleOptOut = useMutation({
    mutationFn: async ({ userId, paused }: { userId: string; paused: boolean }) => {
      if (paused) {
        const { data: u } = await supabase.auth.getUser();
        const { error } = await supabase.from("nutri_opt_outs").upsert({ user_id: userId, reason: "Interrompido pelo admin", opted_out_by: u.user?.id });
        if (error) throw error;
      } else {
        const { error } = await supabase.from("nutri_opt_outs").delete().eq("user_id", userId);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["nutri-opt-outs"] });
      toast({ title: "Atualizado" });
    },
  });

  const updateConv = async (patch: Record<string, any>) => {
    if (!selectedUserId) return;
    const { error } = await supabase.from("nutri_conversations").update(patch).eq("user_id", selectedUserId);
    if (error) { toast({ title: "Erro", description: error.message, variant: "destructive" }); return; }
    qc.invalidateQueries({ queryKey: ["nutri-conversations"] });
  };

  const generateAI = async () => {
    if (!selected) return;
    setAiLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("nutri-ai-reply", {
        body: { user_id: selected.user_id, hint },
      });
      if (error) throw error;
      if (!data?.ok) throw new Error(data?.error || "IA indisponível");
      if (engine === "hybrid" && draft.trim()) {
        setDraft(draft.trim() + "\n\n" + data.reply);
      } else {
        setDraft(data.reply);
      }
      toast({ title: "Sugestão pronta", description: `Origem: ${data.status}` });
    } catch (e: any) {
      toast({ title: "Falha na IA", description: String(e?.message || e), variant: "destructive" });
    } finally {
      setAiLoading(false);
    }
  };

  const sendMessage = async () => {
    if (!selected || !draft.trim()) return;
    if (optOutSet.has(selected.user_id)) {
      toast({ title: "Aluno pausado", description: "Reative para enviar mensagens.", variant: "destructive" });
      return;
    }
    setSending(true);
    const text = replaceVars(draft, buildCtx(selected));
    try {
      const { data: u } = await supabase.auth.getUser();
      const { data, error } = await supabase.functions.invoke("send-wapi", {
        body: { phone: selected.phone, message: text },
      });
      if (error || !data?.ok) throw new Error(data?.error || error?.message || "Falha no envio");
      await supabase.from("nutri_messages").insert({
        user_id: selected.user_id, phone: selected.phone, direction: "out", body: text,
        status: "sent", wapi_message_id: data.messageId ?? null, sent_by: u.user?.id ?? null,
      });
      setDraft("");
      refetchConv();
      toast({ title: "Mensagem enviada" });
    } catch (e: any) {
      await supabase.from("nutri_messages").insert({
        user_id: selected.user_id, phone: selected.phone, direction: "out", body: text,
        status: "failed", error: String(e?.message || e),
      });
      refetchConv();
      toast({ title: "Falha no envio", description: String(e?.message || e), variant: "destructive" });
    } finally {
      setSending(false);
    }
  };

  const addTag = (tag: string) => {
    if (!selectedConv) return;
    const cur: string[] = selectedConv.tags || [];
    if (cur.includes(tag)) return;
    updateConv({ tags: [...cur, tag] });
  };
  const removeTag = (tag: string) => {
    if (!selectedConv) return;
    const cur: string[] = selectedConv.tags || [];
    updateConv({ tags: cur.filter((t) => t !== tag) });
  };

  return (
    <div className="grid lg:grid-cols-[1fr_300px] gap-3">
      {/* LISTA */}
      <Card className="p-3 space-y-2 h-[78vh] flex flex-col">
        <div className="relative">
          <Search className="w-4 h-4 absolute left-2 top-2.5 text-muted-foreground" />
          <Input placeholder="Buscar aluno ativo..." className="pl-8 h-9" value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
        <div className="grid grid-cols-2 gap-2">
          <Select value={filterPriority} onValueChange={setFilterPriority}>
            <SelectTrigger className="h-8 text-xs"><SelectValue placeholder="Prioridade" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas</SelectItem>
              <SelectItem value="high">Alta</SelectItem>
              <SelectItem value="medium">Média</SelectItem>
              <SelectItem value="low">Baixa</SelectItem>
            </SelectContent>
          </Select>
          <Select value={filterStatus} onValueChange={setFilterStatus}>
            <SelectTrigger className="h-8 text-xs"><SelectValue placeholder="Status" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos</SelectItem>
              {Object.entries(STATUS_LABEL).map(([k, v]) => (<SelectItem key={k} value={k}>{v}</SelectItem>))}
            </SelectContent>
          </Select>
        </div>
        <ScrollArea className="flex-1 pr-2">
          {loadingStudents ? (
            <div className="flex items-center justify-center py-6"><Loader2 className="w-5 h-5 animate-spin text-muted-foreground" /></div>
          ) : filtered.length === 0 ? (
            <p className="text-xs text-muted-foreground p-4 text-center">Nenhum aluno encontrado.</p>
          ) : (
            filtered.map((s) => {
              const c: any = convByUser.get(s.user_id);
              const isPaused = optOutSet.has(s.user_id);
              const isSel = selectedUserId === s.user_id;
              return (
                <div key={s.user_id} className={`mb-1 rounded-md border ${isSel ? "border-emerald-500/40 bg-accent/30" : "border-transparent"}`}>
                  <button
                    onClick={() => setSelectedUserId(isSel ? null : s.user_id)}
                    className={`w-full text-left p-2 rounded-md transition-colors ${isSel ? "" : "hover:bg-accent/50"}`}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <p className="text-sm font-medium truncate">{s.full_name || "Sem nome"}</p>
                      <div className="flex items-center gap-1">
                        {c?.unread_count > 0 && (
                          <span className="text-[10px] bg-emerald-500 text-white rounded-full px-1.5 min-w-[18px] text-center">{c.unread_count}</span>
                        )}
                        {c?.priority && (
                          <span className={`text-[9px] uppercase px-1.5 rounded border ${PRIORITY_STYLE[c.priority]}`}>{c.priority}</span>
                        )}
                      </div>
                    </div>
                    <p className="text-[11px] text-muted-foreground truncate">
                      {s.plan_name} · {s.days_left}d · {s.phone}
                    </p>
                    {!isSel && c?.last_message_preview && (
                      <p className="text-[11px] text-muted-foreground/80 truncate mt-0.5">{c.last_message_preview}</p>
                    )}
                    {isPaused && (<Badge variant="outline" className="text-[10px] mt-1 border-rose-500/40 text-rose-500">Pausado</Badge>)}
                  </button>
                  {isSel && selected && (
                    <div className="border-t border-border/40 p-2 space-y-2 bg-background/40">
                      {/* Barra de ações rápidas */}
                      <div className="flex items-center gap-1 flex-wrap">
                        <Button
                          size="sm"
                          variant="outline"
                          className="h-7 text-[11px] border-emerald-500/40 text-emerald-500 hover:bg-emerald-500/10"
                          onClick={() => {
                            setEditName(selected.full_name || "");
                            setEditEmail(selected.email || "");
                            setEditPhone(selected.phone || "");
                            setCadastroOpen(true);
                          }}
                        >
                          <Pencil className="w-3 h-3 mr-1" /> Cadastro rápido
                        </Button>
                        <Select value={selectedConv?.status || "open"} onValueChange={(v) => updateConv({ status: v })}>
                          <SelectTrigger className="h-7 text-[11px] w-[130px]"><SelectValue /></SelectTrigger>
                          <SelectContent>
                            {Object.entries(STATUS_LABEL).map(([k, v]) => (<SelectItem key={k} value={k}>{v}</SelectItem>))}
                          </SelectContent>
                        </Select>
                        <div className="flex items-center gap-1 ml-auto">
                          <Switch
                            checked={!optOutSet.has(selected.user_id)}
                            onCheckedChange={(v) => toggleOptOut.mutate({ userId: selected.user_id, paused: !v })}
                          />
                          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => refetchConv()} title="Atualizar"><RefreshCw className="w-3.5 h-3.5" /></Button>
                        </div>
                      </div>

                      {/* Tags */}
                      <div className="flex items-center gap-1 flex-wrap">
                        <Tag className="w-3 h-3 text-muted-foreground" />
                        {(selectedConv?.tags || []).map((t: string) => (
                          <button key={t} onClick={() => removeTag(t)} className="text-[10px] px-1.5 py-0.5 rounded border border-emerald-500/40 text-emerald-500 hover:bg-rose-500/10 hover:border-rose-500/40 hover:text-rose-500">
                            {t} ×
                          </button>
                        ))}
                        <Select value="" onValueChange={(v) => v && addTag(v)}>
                          <SelectTrigger className="h-6 text-[10px] w-[110px] border-dashed"><SelectValue placeholder="+ tag" /></SelectTrigger>
                          <SelectContent>
                            {TAG_OPTIONS.filter((t) => !(selectedConv?.tags || []).includes(t)).map((t) => (
                              <SelectItem key={t} value={t} className="text-xs">{t}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      {/* Mensagens */}
                      <ScrollArea className="h-[280px] pr-2 rounded border border-border/40 bg-background/60 p-2">
                        {conversation.length === 0 ? (
                          <p className="text-xs text-muted-foreground text-center py-6">Sem mensagens ainda.</p>
                        ) : (
                          <div className="space-y-2">
                            {conversation.map((m: any) => (
                              <div key={m.id} className={`flex ${m.direction === "out" ? "justify-end" : "justify-start"}`}>
                                <div className={`max-w-[80%] rounded-lg px-3 py-2 text-sm whitespace-pre-wrap ${m.direction === "out" ? "bg-emerald-500/15 text-foreground border border-emerald-500/30" : "bg-muted text-foreground"}`}>
                                  {m.body}
                                  <div className="text-[10px] opacity-60 mt-1 flex items-center gap-1">
                                    {new Date(m.created_at).toLocaleString("pt-BR")}
                                    {m.status === "failed" && (<span className="text-rose-500">· falhou</span>)}
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </ScrollArea>

                      {/* Composer */}
                      <div className="space-y-2">
                        <div className="flex items-center gap-2 flex-wrap">
                          <Select onValueChange={(id) => {
                            const tpl: any = templates.find((t: any) => t.id === id);
                            if (tpl && selected) {
                              const filled = replaceVars(tpl.content, buildCtx(selected));
                              setDraft(engine === "hybrid" && draft ? draft + "\n\n" + filled : filled);
                            }
                          }}>
                            <SelectTrigger className="h-7 text-[11px] flex-1 min-w-[160px]"><SelectValue placeholder="Template..." /></SelectTrigger>
                            <SelectContent>
                              {templates.map((t: any) => (
                                <SelectItem key={t.id} value={t.id} className="text-xs">
                                  {t.title} {t.category && <span className="text-muted-foreground">· {t.category}</span>}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <Button size="sm" variant="outline" onClick={generateAI} disabled={aiLoading || !selected} className="h-7 text-[11px] border-emerald-500/40 text-emerald-500 hover:bg-emerald-500/10">
                            {aiLoading ? <Loader2 className="w-3 h-3 animate-spin" /> : <Sparkles className="w-3 h-3" />}
                            <span className="ml-1">IA</span>
                          </Button>
                        </div>

                        {(engine === "gemini" || engine === "hybrid") && (
                          <Input value={hint} onChange={(e) => setHint(e.target.value)} placeholder="Direcionamento opcional para a IA" className="h-7 text-[11px]" />
                        )}

                        <div className="flex gap-2">
                          <Textarea
                            rows={2}
                            placeholder={optOutSet.has(selected.user_id) ? "Aluno pausou o canal." : "Mensagem... {nome} {plano} {data_fim} {peso_atual}"}
                            value={draft}
                            onChange={(e) => setDraft(e.target.value)}
                            disabled={optOutSet.has(selected.user_id) || sending}
                            className="resize-none text-sm"
                            onKeyDown={(e) => { if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) sendMessage(); }}
                          />
                          <Button onClick={sendMessage} disabled={!draft.trim() || sending || optOutSet.has(selected.user_id)} className="bg-emerald-500 hover:bg-emerald-600 text-white self-end">
                            {sending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                          </Button>
                        </div>
                        <p className="text-[10px] text-muted-foreground">Motor: <span className="text-emerald-500 font-semibold uppercase">{engine}</span> · Ctrl/⌘+Enter envia</p>
                      </div>
                    </div>
                  )}
                </div>
              );
            })
          )}
        </ScrollArea>
      </Card>

      {/* FICHA */}
      <Card className="p-4 space-y-3 h-[78vh] overflow-y-auto">
        {!selected ? (
          <p className="text-xs text-muted-foreground text-center py-6">Ficha do aluno aparece aqui.</p>
        ) : (
          <>
            <div>
              <p className="text-xs text-muted-foreground">Aluno</p>
              <p className="font-semibold">{selected.full_name}</p>
              <p className="text-xs">{selected.email}</p>
            </div>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="p-2 rounded border border-border/50">
                <p className="text-muted-foreground">Plano</p>
                <p className="font-medium">{selected.plan_name}</p>
              </div>
              <div className="p-2 rounded border border-border/50">
                <p className="text-muted-foreground">Dias restantes</p>
                <p className="font-medium">{selected.days_left}d</p>
              </div>
              <div className="p-2 rounded border border-border/50">
                <p className="text-muted-foreground">Início</p>
                <p className="font-medium">{selected.start_date ? new Date(selected.start_date).toLocaleDateString("pt-BR") : "—"}</p>
              </div>
              <div className="p-2 rounded border border-border/50">
                <p className="text-muted-foreground">Fim</p>
                <p className="font-medium">{selected.end_date ? new Date(selected.end_date).toLocaleDateString("pt-BR") : "—"}</p>
              </div>
              <div className="p-2 rounded border border-border/50 col-span-2">
                <p className="text-muted-foreground">Último peso</p>
                <p className="font-medium">{meta?.weight} <span className="text-[10px] text-muted-foreground">({meta?.weightAt})</span></p>
              </div>
              <div className="p-2 rounded border border-border/50 col-span-2">
                <p className="text-muted-foreground">Últimas fotos</p>
                <p className="font-medium">{meta?.photosAt}</p>
              </div>
            </div>

            <div>
              <Label className="text-xs">Observações internas</Label>
              <Textarea
                rows={4}
                value={selectedConv?.internal_notes || ""}
                onChange={(e) => {
                  const v = e.target.value;
                  qc.setQueryData(["nutri-conversations"], (old: any) =>
                    (old || []).map((c: any) => c.user_id === selected.user_id ? { ...c, internal_notes: v } : c),
                  );
                }}
                onBlur={(e) => updateConv({ internal_notes: e.target.value })}
                placeholder="Notas privadas sobre o aluno..."
                className="text-xs"
              />
            </div>
          </>
        )}
      </Card>

      {/* Dialog Cadastro do aluno */}
      <Dialog open={cadastroOpen} onOpenChange={setCadastroOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Pencil className="w-4 h-4 text-emerald-500" /> Cadastro do aluno
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div>
              <Label className="text-xs">Nome completo</Label>
              <Input value={editName} onChange={(e) => setEditName(e.target.value)} />
            </div>
            <div>
              <Label className="text-xs">Email</Label>
              <Input value={editEmail} onChange={(e) => setEditEmail(e.target.value)} />
            </div>
            <div>
              <Label className="text-xs">Telefone (WhatsApp)</Label>
              <Input value={editPhone} onChange={(e) => setEditPhone(e.target.value)} placeholder="5521999999999" />
            </div>
            <p className="text-[10px] text-muted-foreground">
              Alterações aqui atualizam o perfil sem sair do Fale com o Nutri.
            </p>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCadastroOpen(false)}>Cancelar</Button>
            <Button
              className="bg-emerald-500 hover:bg-emerald-600 text-white"
              onClick={async () => {
                if (!selected) return;
                const { error } = await supabase
                  .from("profiles")
                  .update({ full_name: editName, email: editEmail, phone: editPhone })
                  .eq("user_id", selected.user_id);
                if (error) {
                  toast({ title: "Erro", description: error.message, variant: "destructive" });
                  return;
                }
                toast({ title: "Cadastro atualizado" });
                setCadastroOpen(false);
                qc.invalidateQueries({ queryKey: ["fale-nutri-active-students-rich"] });
              }}
            >
              <CheckCircle2 className="w-4 h-4 mr-1" /> Salvar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

/* ============================ TEMPLATES ============================ */
function TemplatesPanel() {
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<any | null>(null);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [category, setCategory] = useState("");
  const [tone, setTone] = useState("humanizada");
  const [filterCat, setFilterCat] = useState("all");
  const [filterTone, setFilterTone] = useState("all");

  const { data: templates = [], isLoading } = useQuery({
    queryKey: ["nutri-templates-all"],
    queryFn: async () => {
      const { data } = await supabase.from("nutri_templates").select("*").order("category").order("tone");
      return data || [];
    },
  });

  const cats = Array.from(new Set((templates as any[]).map((t) => t.category).filter(Boolean)));
  const filtered = (templates as any[]).filter((t) =>
    (filterCat === "all" || t.category === filterCat) &&
    (filterTone === "all" || t.tone === filterTone),
  );

  const reset = () => { setEditing(null); setTitle(""); setContent(""); setCategory(""); setTone("humanizada"); };

  const save = useMutation({
    mutationFn: async () => {
      if (!title.trim() || !content.trim()) throw new Error("Título e conteúdo obrigatórios");
      const { data: u } = await supabase.auth.getUser();
      if (editing) {
        const { error } = await supabase.from("nutri_templates").update({ title, content, category: category || null, tone }).eq("id", editing.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("nutri_templates").insert({ title, content, category: category || null, tone, created_by: u.user?.id });
        if (error) throw error;
      }
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["nutri-templates-all"] }); qc.invalidateQueries({ queryKey: ["nutri-templates-active"] }); setOpen(false); reset(); toast({ title: "Template salvo" }); },
    onError: (e: any) => toast({ title: "Erro", description: e.message, variant: "destructive" }),
  });

  const remove = useMutation({
    mutationFn: async (id: string) => { const { error } = await supabase.from("nutri_templates").delete().eq("id", id); if (error) throw error; },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["nutri-templates-all"] }); qc.invalidateQueries({ queryKey: ["nutri-templates-active"] }); toast({ title: "Removido" }); },
  });

  const duplicate = useMutation({
    mutationFn: async (t: any) => {
      const { data: u } = await supabase.auth.getUser();
      const { error } = await supabase.from("nutri_templates").insert({ title: t.title + " (cópia)", content: t.content, category: t.category, tone: t.tone, created_by: u.user?.id });
      if (error) throw error;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["nutri-templates-all"] }); toast({ title: "Duplicado" }); },
  });

  const toggleActive = useMutation({
    mutationFn: async ({ id, active }: { id: string; active: boolean }) => {
      const { error } = await supabase.from("nutri_templates").update({ active }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["nutri-templates-all"] }); qc.invalidateQueries({ queryKey: ["nutri-templates-active"] }); },
  });

  return (
    <Card className="p-4 space-y-3">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <h3 className="font-semibold">Biblioteca de Respostas</h3>
        <div className="flex items-center gap-2 flex-wrap">
          <Select value={filterCat} onValueChange={setFilterCat}>
            <SelectTrigger className="h-8 text-xs w-[160px]"><SelectValue placeholder="Categoria" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas categorias</SelectItem>
              {cats.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
            </SelectContent>
          </Select>
          <Select value={filterTone} onValueChange={setFilterTone}>
            <SelectTrigger className="h-8 text-xs w-[140px]"><SelectValue placeholder="Tom" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos tons</SelectItem>
              <SelectItem value="curta">Curta</SelectItem>
              <SelectItem value="humanizada">Humanizada</SelectItem>
              <SelectItem value="tecnica">Técnica</SelectItem>
              <SelectItem value="motivacional">Motivacional</SelectItem>
            </SelectContent>
          </Select>
          <Dialog open={open} onOpenChange={(v) => { setOpen(v); if (!v) reset(); }}>
            <DialogTrigger asChild>
              <Button size="sm" className="bg-emerald-500 hover:bg-emerald-600 text-white"><Plus className="w-4 h-4 mr-1" />Novo</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader><DialogTitle>{editing ? "Editar template" : "Novo template"}</DialogTitle></DialogHeader>
              <div className="space-y-3">
                <div>
                  <Label className="text-xs">Título</Label>
                  <Input value={title} onChange={(e) => setTitle(e.target.value)} />
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <Label className="text-xs">Categoria</Label>
                    <Input value={category} onChange={(e) => setCategory(e.target.value)} placeholder="dieta, treino..." />
                  </div>
                  <div>
                    <Label className="text-xs">Tom</Label>
                    <Select value={tone} onValueChange={setTone}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="curta">Curta</SelectItem>
                        <SelectItem value="humanizada">Humanizada</SelectItem>
                        <SelectItem value="tecnica">Técnica</SelectItem>
                        <SelectItem value="motivacional">Motivacional</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div>
                  <Label className="text-xs">Conteúdo</Label>
                  <Textarea rows={8} value={content} onChange={(e) => setContent(e.target.value)} placeholder="Use {nome} {plano} {data_fim} {peso_atual} {link_plataforma}..." />
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setOpen(false)}>Cancelar</Button>
                <Button onClick={() => save.mutate()} disabled={save.isPending}>
                  {save.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : "Salvar"}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-6"><Loader2 className="w-5 h-5 animate-spin text-muted-foreground" /></div>
      ) : filtered.length === 0 ? (
        <p className="text-sm text-muted-foreground text-center py-6">Nenhum template encontrado.</p>
      ) : (
        <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-3">
          {filtered.map((t: any) => (
            <Card key={t.id} className="p-3 space-y-2">
              <div className="flex items-center justify-between gap-2">
                <div className="min-w-0">
                  <p className="font-medium text-sm truncate">{t.title}</p>
                  <div className="flex items-center gap-1 mt-0.5">
                    {t.category && <Badge variant="outline" className="text-[9px] uppercase">{t.category}</Badge>}
                    {t.tone && <Badge variant="outline" className="text-[9px] uppercase border-emerald-500/40 text-emerald-500">{t.tone}</Badge>}
                  </div>
                </div>
                <Switch checked={t.active} onCheckedChange={(v) => toggleActive.mutate({ id: t.id, active: v })} />
              </div>
              <p className="text-xs text-muted-foreground line-clamp-4 whitespace-pre-wrap">{t.content}</p>
              <div className="flex gap-1 justify-end">
                <Button variant="ghost" size="sm" onClick={() => duplicate.mutate(t)} title="Duplicar"><Plus className="w-3.5 h-3.5" /></Button>
                <Button variant="ghost" size="sm" onClick={() => { setEditing(t); setTitle(t.title); setContent(t.content); setCategory(t.category || ""); setTone(t.tone || "humanizada"); setOpen(true); }} title="Editar"><Pencil className="w-3.5 h-3.5" /></Button>
                <Button variant="ghost" size="sm" onClick={() => { if (confirm("Remover template?")) remove.mutate(t.id); }} title="Remover"><Trash2 className="w-3.5 h-3.5 text-rose-500" /></Button>
              </div>
            </Card>
          ))}
        </div>
      )}
    </Card>
  );
}

/* ============================ CONFIG ============================ */
function ConfigPanel() {
  const webhook = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/wapi-inbound-nutri`;
  return (
    <Card className="p-6 space-y-4 max-w-2xl">
      <h3 className="font-semibold flex items-center gap-2"><Settings2 className="w-4 h-4" /> Configuração da linha W-API</h3>
      <div className="space-y-2 text-sm">
        <Row k="Provedor" v="W-API" />
        <Row k="Linha" v={`${NUTRI_PHONE} (Nutri)`} />
        <Row k="Endpoint" v="api.w-api.app/v1/message" mono />
        <Row k="Edge function envio" v="send-wapi" mono />
        <Row k="Edge function IA" v="nutri-ai-reply" mono />
        <Row k="Webhook entrada" v={webhook} mono break />
        <Row k="Credenciais" v={<span className="text-emerald-500 font-medium">Configuradas</span>} />
      </div>
      <p className="text-xs text-muted-foreground">
        Cole o webhook acima no painel W-API para receber mensagens dos alunos automaticamente.
        Mensagens vindas de alunos não-ativos são automaticamente ignoradas.
      </p>
      <Button variant="outline" size="sm" onClick={() => { navigator.clipboard.writeText(webhook); toast({ title: "Webhook copiado" }); }}>
        Copiar webhook
      </Button>
    </Card>
  );
}

function Row({ k, v, mono, break: br }: { k: string; v: React.ReactNode; mono?: boolean; break?: boolean }) {
  return (
    <div className="flex justify-between border-b pb-2 gap-3">
      <span className="text-muted-foreground">{k}</span>
      <span className={`${mono ? "font-mono text-xs" : "font-medium"} ${br ? "break-all text-right" : ""}`}>{v}</span>
    </div>
  );
}