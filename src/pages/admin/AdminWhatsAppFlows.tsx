import { useEffect, useMemo, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import DashboardLayout from "@/components/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { toast } from "@/hooks/use-toast";
import { MessageSquare, Send, Save, Plus, Trash2, Play, RefreshCw, Phone, Tag as TagIcon, Power } from "lucide-react";

type Menu = {
  id: string;
  key: string;
  title: string;
  header_message: string;
  footer_message: string;
  parent_key: string | null;
  active: boolean;
};

type MenuOption = {
  id: string;
  menu_key: string;
  option_number: number;
  label: string;
  response_message: string;
  tag: string | null;
  queue: string | null;
  channel: string;
  requires_active_student: boolean;
  requires_human: boolean;
  ends_session: boolean;
  returns_to_menu: boolean;
  next_menu_key: string | null;
  active: boolean;
  display_order: number;
};

const QUEUES = [
  { value: "none", label: "Sem fila" },
  { value: "comercial", label: "Comercial" },
  { value: "financeiro", label: "Financeiro" },
  { value: "nutri", label: "Fale com o Nutri" },
  { value: "tecnico", label: "Suporte Técnico" },
  { value: "humano", label: "Atendente Humano" },
];

const CHANNELS = [
  { value: "sth_one", label: "STH One (comercial)" },
  { value: "fale_nutri", label: "Fale com o Nutri" },
];

const STATUS_COLORS: Record<string, string> = {
  NOVO: "bg-sky-500/15 text-sky-300 border-sky-500/30",
  EM_TRIAGEM: "bg-amber-500/15 text-amber-300 border-amber-500/30",
  AGUARDANDO_CLIENTE: "bg-zinc-500/15 text-zinc-300 border-zinc-500/30",
  AGUARDANDO_HUMANO: "bg-violet-500/15 text-violet-300 border-violet-500/30",
  EM_ATENDIMENTO: "bg-emerald-500/15 text-emerald-300 border-emerald-500/30",
  PRIORIDADE: "bg-rose-500/15 text-rose-300 border-rose-500/30",
  FINALIZADO: "bg-zinc-500/10 text-zinc-400 border-zinc-500/30",
  TRANSFERIDO: "bg-indigo-500/15 text-indigo-300 border-indigo-500/30",
};

function MenuEditor() {
  const qc = useQueryClient();
  const [selectedKey, setSelectedKey] = useState<string>("main");

  const { data: menus = [] } = useQuery({
    queryKey: ["wa-menus"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("whatsapp_menus")
        .select("*")
        .order("created_at", { ascending: true });
      if (error) throw error;
      return (data || []) as Menu[];
    },
  });

  const { data: options = [] } = useQuery({
    queryKey: ["wa-options", selectedKey],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("whatsapp_menu_options")
        .select("*")
        .eq("menu_key", selectedKey)
        .order("display_order", { ascending: true });
      if (error) throw error;
      return (data || []) as MenuOption[];
    },
    enabled: !!selectedKey,
  });

  const currentMenu = menus.find((m) => m.key === selectedKey);
  const [draftMenu, setDraftMenu] = useState<Menu | null>(null);
  useEffect(() => {
    setDraftMenu(currentMenu || null);
  }, [currentMenu?.id]);

  const saveMenu = async () => {
    if (!draftMenu) return;
    const { error } = await supabase
      .from("whatsapp_menus")
      .update({
        title: draftMenu.title,
        header_message: draftMenu.header_message,
        footer_message: draftMenu.footer_message,
        active: draftMenu.active,
      })
      .eq("id", draftMenu.id);
    if (error) {
      toast({ title: "Erro ao salvar", description: error.message, variant: "destructive" });
      return;
    }
    toast({ title: "Menu salvo" });
    qc.invalidateQueries({ queryKey: ["wa-menus"] });
  };

  return (
    <div className="grid gap-4 lg:grid-cols-[260px_1fr]">
      {/* Menus list */}
      <Card className="border-emerald-500/10">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm uppercase tracking-wider text-emerald-400">Menus</CardTitle>
        </CardHeader>
        <CardContent className="space-y-1 p-2">
          {menus.map((m) => (
            <button
              key={m.id}
              onClick={() => setSelectedKey(m.key)}
              className={`flex w-full items-center justify-between rounded-lg px-3 py-2 text-left text-sm transition ${
                selectedKey === m.key
                  ? "bg-emerald-500/15 text-emerald-300"
                  : "hover:bg-muted/50"
              }`}
            >
              <span>
                <span className="font-medium">{m.title}</span>
                <span className="ml-2 text-xs text-muted-foreground">{m.key}</span>
              </span>
              {!m.active && <Badge variant="outline" className="text-xs">off</Badge>}
            </button>
          ))}
        </CardContent>
      </Card>

      {/* Editor */}
      <div className="space-y-4">
        {draftMenu && (
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>{draftMenu.title}</CardTitle>
              <div className="flex items-center gap-3">
                <Label htmlFor="menu-active" className="text-xs">
                  Ativo
                </Label>
                <Switch
                  id="menu-active"
                  checked={draftMenu.active}
                  onCheckedChange={(v) => setDraftMenu({ ...draftMenu, active: v })}
                />
                <Button size="sm" onClick={saveMenu} className="gap-2">
                  <Save className="h-4 w-4" /> Salvar
                </Button>
              </div>
            </CardHeader>
            <CardContent className="grid gap-3">
              <div>
                <Label className="text-xs">Mensagem de cabeçalho</Label>
                <Textarea
                  rows={3}
                  value={draftMenu.header_message}
                  onChange={(e) => setDraftMenu({ ...draftMenu, header_message: e.target.value })}
                />
              </div>
              <div>
                <Label className="text-xs">Mensagem de rodapé</Label>
                <Input
                  value={draftMenu.footer_message}
                  onChange={(e) => setDraftMenu({ ...draftMenu, footer_message: e.target.value })}
                />
              </div>
            </CardContent>
          </Card>
        )}

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Opções deste menu</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {options.map((opt) => (
              <OptionRow key={opt.id} option={opt} menus={menus} onSaved={() => qc.invalidateQueries({ queryKey: ["wa-options", selectedKey] })} />
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function OptionRow({
  option,
  menus,
  onSaved,
}: {
  option: MenuOption;
  menus: Menu[];
  onSaved: () => void;
}) {
  const [draft, setDraft] = useState<MenuOption>(option);
  useEffect(() => setDraft(option), [option.id]);
  const dirty = JSON.stringify(draft) !== JSON.stringify(option);

  const save = async () => {
    const { error } = await supabase
      .from("whatsapp_menu_options")
      .update({
        label: draft.label,
        response_message: draft.response_message,
        tag: draft.tag,
        queue: draft.queue,
        channel: draft.channel,
        requires_active_student: draft.requires_active_student,
        requires_human: draft.requires_human,
        ends_session: draft.ends_session,
        returns_to_menu: draft.returns_to_menu,
        next_menu_key: draft.next_menu_key,
        active: draft.active,
      })
      .eq("id", draft.id);
    if (error) {
      toast({ title: "Erro", description: error.message, variant: "destructive" });
      return;
    }
    toast({ title: "Opção salva" });
    onSaved();
  };

  return (
    <div className="rounded-xl border border-border/40 bg-card/50 p-4">
      <div className="mb-3 flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="border-emerald-500/40 text-emerald-300">
            {draft.option_number}
          </Badge>
          <Input
            value={draft.label}
            onChange={(e) => setDraft({ ...draft, label: e.target.value })}
            className="h-8 max-w-md"
          />
        </div>
        <div className="flex items-center gap-2">
          <Label className="text-xs">Ativo</Label>
          <Switch checked={draft.active} onCheckedChange={(v) => setDraft({ ...draft, active: v })} />
          {dirty && (
            <Button size="sm" onClick={save} className="gap-1">
              <Save className="h-3 w-3" /> Salvar
            </Button>
          )}
        </div>
      </div>

      <div className="grid gap-3 md:grid-cols-2">
        <div className="md:col-span-2">
          <Label className="text-xs">Mensagem de resposta</Label>
          <Textarea
            rows={4}
            value={draft.response_message}
            onChange={(e) => setDraft({ ...draft, response_message: e.target.value })}
          />
        </div>
        <div>
          <Label className="text-xs">Tag aplicada</Label>
          <Input
            value={draft.tag || ""}
            onChange={(e) => setDraft({ ...draft, tag: e.target.value || null })}
            placeholder="Ex.: INTERESSE_PLANOS"
          />
        </div>
        <div>
          <Label className="text-xs">Fila de destino</Label>
          <Select
            value={draft.queue || "none"}
            onValueChange={(v) => setDraft({ ...draft, queue: v === "none" ? null : v })}
          >
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              {QUEUES.map((q) => (
                <SelectItem key={q.value} value={q.value}>{q.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label className="text-xs">Canal de saída</Label>
          <Select value={draft.channel} onValueChange={(v) => setDraft({ ...draft, channel: v })}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              {CHANNELS.map((c) => (
                <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label className="text-xs">Próximo menu (submenu)</Label>
          <Select
            value={draft.next_menu_key || "none"}
            onValueChange={(v) => setDraft({ ...draft, next_menu_key: v === "none" ? null : v })}
          >
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="none">Nenhum</SelectItem>
              {menus.map((m) => (
                <SelectItem key={m.key} value={m.key}>{m.title} ({m.key})</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="flex flex-wrap items-center gap-4 md:col-span-2">
          <label className="flex items-center gap-2 text-xs">
            <Switch
              checked={draft.requires_active_student}
              onCheckedChange={(v) => setDraft({ ...draft, requires_active_student: v })}
            />
            Exige aluno ativo
          </label>
          <label className="flex items-center gap-2 text-xs">
            <Switch
              checked={draft.requires_human}
              onCheckedChange={(v) => setDraft({ ...draft, requires_human: v })}
            />
            Exige humano
          </label>
          <label className="flex items-center gap-2 text-xs">
            <Switch
              checked={draft.returns_to_menu}
              onCheckedChange={(v) => setDraft({ ...draft, returns_to_menu: v })}
            />
            Volta ao menu
          </label>
          <label className="flex items-center gap-2 text-xs">
            <Switch
              checked={draft.ends_session}
              onCheckedChange={(v) => setDraft({ ...draft, ends_session: v })}
            />
            Encerra atendimento
          </label>
        </div>
      </div>
    </div>
  );
}

function SessionsPanel() {
  const { data: sessions = [], refetch, isFetching } = useQuery({
    queryKey: ["wa-sessions"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("whatsapp_sessions")
        .select("*")
        .order("last_interaction_at", { ascending: false })
        .limit(100);
      if (error) throw error;
      return data || [];
    },
  });

  const stats = useMemo(() => {
    const today = new Date().toISOString().slice(0, 10);
    return {
      total: sessions.length,
      triagem: sessions.filter((s: any) => s.status === "EM_TRIAGEM").length,
      humano: sessions.filter((s: any) => s.status === "AGUARDANDO_HUMANO").length,
      prioridade: sessions.filter((s: any) => s.status === "PRIORIDADE").length,
      finalizadasHoje: sessions.filter(
        (s: any) => s.status === "FINALIZADO" && String(s.updated_at).slice(0, 10) === today,
      ).length,
    };
  }, [sessions]);

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3 md:grid-cols-5">
        {[
          ["Sessões", stats.total],
          ["Em triagem", stats.triagem],
          ["Aguardando humano", stats.humano],
          ["Prioridade", stats.prioridade],
          ["Finalizadas hoje", stats.finalizadasHoje],
        ].map(([k, v]) => (
          <Card key={k as string} className="border-border/40">
            <CardContent className="p-4">
              <p className="text-xs uppercase tracking-wider text-muted-foreground">{k}</p>
              <p className="mt-1 text-2xl font-semibold">{v}</p>
            </CardContent>
          </Card>
        ))}
      </div>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-base">Sessões ativas</CardTitle>
          <Button size="sm" variant="outline" onClick={() => refetch()} disabled={isFetching} className="gap-1">
            <RefreshCw className="h-3 w-3" /> Atualizar
          </Button>
        </CardHeader>
        <CardContent className="space-y-2">
          {sessions.length === 0 && (
            <p className="py-8 text-center text-sm text-muted-foreground">Nenhuma sessão registrada.</p>
          )}
          {sessions.map((s: any) => (
            <div
              key={s.id}
              className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-border/40 p-3"
            >
              <div className="flex items-center gap-3">
                <Phone className="h-4 w-4 text-muted-foreground" />
                <span className="font-mono text-sm">{s.phone}</span>
                <Badge variant="outline" className={STATUS_COLORS[s.status] || ""}>
                  {s.status}
                </Badge>
                {s.assigned_queue && (
                  <Badge variant="outline" className="border-emerald-500/30 text-emerald-300">
                    {s.assigned_queue}
                  </Badge>
                )}
                <span className="text-xs text-muted-foreground">menu: {s.current_menu_key}</span>
              </div>
              <span className="text-xs text-muted-foreground">
                {new Date(s.last_interaction_at).toLocaleString("pt-BR")}
              </span>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}

function FlowTester() {
  const [phone, setPhone] = useState("5521999999999");
  const [input, setInput] = useState("");
  const [log, setLog] = useState<{ from: "user" | "bot"; text: string }[]>([]);
  const [busy, setBusy] = useState(false);

  const send = async () => {
    if (!input.trim()) return;
    setBusy(true);
    const userMsg = input.trim();
    setLog((l) => [...l, { from: "user", text: userMsg }]);
    setInput("");
    try {
      const { data, error } = await supabase.functions.invoke("whatsapp-menu-router", {
        body: { phone, text: userMsg, channel: "sth_one", dryRun: true },
      });
      if (error) throw error;
      const reply = (data as any)?.reply || "(sem resposta — fluxo entregue à IA)";
      setLog((l) => [...l, { from: "bot", text: reply }]);
    } catch (e: any) {
      setLog((l) => [...l, { from: "bot", text: `Erro: ${e.message}` }]);
    } finally {
      setBusy(false);
    }
  };

  const reset = async () => {
    await supabase.from("whatsapp_sessions").delete().eq("phone", phone.replace(/\D/g, ""));
    setLog([]);
    toast({ title: "Sessão de teste limpa" });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Testar fluxo (dry-run, não envia WhatsApp)</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex gap-2">
          <Input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="Telefone simulado" className="max-w-xs" />
          <Button variant="outline" onClick={reset} className="gap-1">
            <RefreshCw className="h-3 w-3" /> Limpar sessão
          </Button>
        </div>
        <div className="h-80 space-y-2 overflow-y-auto rounded-lg border border-border/40 bg-background/50 p-3">
          {log.length === 0 && (
            <p className="text-center text-xs text-muted-foreground">
              Envie "oi", "menu" ou um número para começar.
            </p>
          )}
          {log.map((l, i) => (
            <div
              key={i}
              className={`max-w-[80%] whitespace-pre-wrap rounded-2xl px-3 py-2 text-sm ${
                l.from === "user"
                  ? "ml-auto bg-emerald-500/15 text-emerald-100"
                  : "bg-muted text-foreground"
              }`}
            >
              {l.text}
            </div>
          ))}
        </div>
        <div className="flex gap-2">
          <Input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Digite uma mensagem..."
            onKeyDown={(e) => e.key === "Enter" && send()}
          />
          <Button onClick={send} disabled={busy} className="gap-1">
            <Send className="h-4 w-4" /> Enviar
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

export default function AdminWhatsAppFlows() {
  const [tab, setTab] = useState("menus");
  return (
    <DashboardLayout role="admin" title="Painéis WhatsApp" subtitle="Fluxos STH One, filas, tags e roteamento automático">
      <div className="space-y-6">
        <div>
          <div className="flex items-center gap-2">
            <MessageSquare className="h-5 w-5 text-emerald-400" />
            <span className="text-xs uppercase tracking-[0.18em] text-emerald-400">STH One</span>
          </div>
          <h1 className="mt-1 text-3xl font-semibold tracking-tight">Painéis WhatsApp</h1>
          <p className="max-w-2xl text-sm text-muted-foreground">
            Configure menus interativos, mensagens automáticas, tags, filas de atendimento e regras de
            direcionamento para Comercial, Financeiro, Suporte Técnico e Fale com o Nutri.
          </p>
        </div>

        <Tabs value={tab} onValueChange={setTab}>
          <TabsList>
            <TabsTrigger value="config">Configurações</TabsTrigger>
            <TabsTrigger value="menus">Menus & Opções</TabsTrigger>
            <TabsTrigger value="sessoes">Sessões</TabsTrigger>
            <TabsTrigger value="testar">Testar fluxo</TabsTrigger>
          </TabsList>
          <TabsContent value="config" className="mt-4">
            <FlowSettings />
          </TabsContent>
          <TabsContent value="menus" className="mt-4">
            <MenuEditor />
          </TabsContent>
          <TabsContent value="sessoes" className="mt-4">
            <SessionsPanel />
          </TabsContent>
          <TabsContent value="testar" className="mt-4">
            <FlowTester />
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
}

function FlowSettings() {
  const qc = useQueryClient();
  const { data: settings } = useQuery({
    queryKey: ["wa-settings"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("whatsapp_settings")
        .select("*")
        .eq("id", true)
        .maybeSingle();
      if (error) throw error;
      return data as { enabled: boolean; active_main_menu_key: string } | null;
    },
  });
  const { data: menus = [] } = useQuery({
    queryKey: ["wa-menus-root"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("whatsapp_menus")
        .select("key,title,active,parent_key")
        .is("parent_key", null)
        .order("title");
      if (error) throw error;
      return (data || []) as { key: string; title: string; active: boolean; parent_key: string | null }[];
    },
  });

  const [enabled, setEnabled] = useState<boolean>(true);
  const [activeKey, setActiveKey] = useState<string>("main");
  useEffect(() => {
    if (settings) {
      setEnabled(settings.enabled);
      setActiveKey(settings.active_main_menu_key);
    }
  }, [settings?.enabled, settings?.active_main_menu_key]);

  const save = async () => {
    const { error } = await supabase
      .from("whatsapp_settings")
      .upsert({ id: true, enabled, active_main_menu_key: activeKey, updated_at: new Date().toISOString() });
    if (error) {
      toast({ title: "Erro ao salvar", description: error.message, variant: "destructive" });
      return;
    }
    toast({ title: "Configurações salvas" });
    qc.invalidateQueries({ queryKey: ["wa-settings"] });
  };

  return (
    <div className="grid gap-4 md:grid-cols-2">
      <Card className={enabled ? "border-emerald-500/20" : "border-rose-500/30"}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Power className={`h-4 w-4 ${enabled ? "text-emerald-400" : "text-rose-400"}`} />
            Menu interativo
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between rounded-lg border border-border/40 p-3">
            <div>
              <p className="text-sm font-medium">
                {enabled ? "Ativado" : "Desligado"}
              </p>
              <p className="text-xs text-muted-foreground">
                Quando desligado, mensagens recebidas vão direto para a IA / atendimento humano, sem menu.
              </p>
            </div>
            <Switch checked={enabled} onCheckedChange={setEnabled} />
          </div>
          <Button onClick={save} className="gap-2">
            <Save className="h-4 w-4" /> Salvar configurações
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Fluxo de entrada</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <p className="text-xs text-muted-foreground">
            Escolha qual fluxo (menu raiz) será disparado quando um novo contato chegar.
          </p>
          <Select value={activeKey} onValueChange={setActiveKey}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              {menus.map((m) => (
                <SelectItem key={m.key} value={m.key} disabled={!m.active}>
                  {m.title} {!m.active && "(inativo)"}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <p className="text-xs text-muted-foreground">
            Apenas menus raiz (sem menu pai) aparecem aqui. Submenus são acessados pelas opções de cada fluxo.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
