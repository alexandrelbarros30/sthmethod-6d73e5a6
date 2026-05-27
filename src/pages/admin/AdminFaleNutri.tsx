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
import { Search, Send, Ban, CheckCircle2, Loader2, Plus, Pencil, Trash2, Phone, HeartHandshake, Settings2, MessageCircle, RefreshCw } from "lucide-react";

const NUTRI_PHONE = "5521998984153";

function replaceVars(text: string, profile: { full_name?: string; email?: string; phone?: string }) {
  const first = profile.full_name?.split(" ")[0] || "Aluno";
  return text
    .replace(/{nome}/gi, first)
    .replace(/{nome_completo}/gi, profile.full_name || "Aluno")
    .replace(/{email}/gi, profile.email || "—")
    .replace(/{telefone}/gi, profile.phone || "—");
}

export default function AdminFaleNutri() {
  const qc = useQueryClient();
  const [search, setSearch] = useState("");
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [draft, setDraft] = useState("");
  const [sending, setSending] = useState(false);

  // Active students = subscription end_date >= today, joined with profile
  const { data: activeStudents = [], isLoading: loadingStudents } = useQuery({
    queryKey: ["fale-nutri-active-students"],
    queryFn: async () => {
      const today = new Date().toISOString().slice(0, 10);
      const { data: subs } = await supabase
        .from("subscriptions")
        .select("user_id, end_date, status")
        .gte("end_date", today);
      const ids = Array.from(new Set((subs || []).map((s) => s.user_id)));
      if (ids.length === 0) return [];
      const { data: profiles } = await supabase
        .from("profiles")
        .select("user_id, full_name, email, phone")
        .in("user_id", ids);
      const byId = new Map((profiles || []).map((p) => [p.user_id, p]));
      return ids
        .map((id) => byId.get(id))
        .filter((p): p is { user_id: string; full_name: string; email: string; phone: string } => !!p && !!p.phone);
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

  const filtered = useMemo(() => {
    const q = search.toLowerCase().trim();
    if (!q) return activeStudents;
    return activeStudents.filter(
      (s) =>
        s.full_name?.toLowerCase().includes(q) ||
        s.email?.toLowerCase().includes(q) ||
        s.phone?.includes(q),
    );
  }, [activeStudents, search]);

  const selected = activeStudents.find((s) => s.user_id === selectedUserId);

  const { data: conversation = [], refetch: refetchConv } = useQuery({
    queryKey: ["nutri-conv", selectedUserId],
    enabled: !!selectedUserId,
    queryFn: async () => {
      const { data } = await supabase
        .from("nutri_messages")
        .select("*")
        .eq("user_id", selectedUserId!)
        .order("created_at", { ascending: true })
        .limit(200);
      return data || [];
    },
  });

  // Realtime updates for selected conversation
  useEffect(() => {
    if (!selectedUserId) return;
    const ch = supabase
      .channel(`nutri-msgs-${selectedUserId}`)
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "nutri_messages", filter: `user_id=eq.${selectedUserId}` },
        () => refetchConv(),
      )
      .subscribe();
    return () => {
      supabase.removeChannel(ch);
    };
  }, [selectedUserId, refetchConv]);

  const { data: templates = [] } = useQuery({
    queryKey: ["nutri-templates"],
    queryFn: async () => {
      const { data } = await supabase
        .from("nutri_templates")
        .select("*")
        .eq("active", true)
        .order("title");
      return data || [];
    },
  });

  const toggleOptOut = useMutation({
    mutationFn: async ({ userId, paused }: { userId: string; paused: boolean }) => {
      if (paused) {
        const { data: u } = await supabase.auth.getUser();
        const { error } = await supabase
          .from("nutri_opt_outs")
          .upsert({ user_id: userId, reason: "Interrompido pelo admin", opted_out_by: u.user?.id });
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
    onError: (e: any) => toast({ title: "Erro", description: e.message, variant: "destructive" }),
  });

  const sendMessage = async () => {
    if (!selected || !draft.trim()) return;
    if (optOutSet.has(selected.user_id)) {
      toast({ title: "Aluno pausado", description: "Reative para enviar mensagens.", variant: "destructive" });
      return;
    }
    setSending(true);
    const text = replaceVars(draft, selected);
    try {
      const { data: u } = await supabase.auth.getUser();
      const { data, error } = await supabase.functions.invoke("send-wapi", {
        body: { phone: selected.phone, message: text },
      });
      if (error || !data?.ok) throw new Error(data?.error || error?.message || "Falha no envio");
      await supabase.from("nutri_messages").insert({
        user_id: selected.user_id,
        phone: selected.phone,
        direction: "out",
        body: text,
        status: "sent",
        wapi_message_id: data.messageId ?? null,
        sent_by: u.user?.id ?? null,
      });
      setDraft("");
      refetchConv();
      toast({ title: "Mensagem enviada" });
    } catch (e: any) {
      await supabase.from("nutri_messages").insert({
        user_id: selected.user_id,
        phone: selected.phone,
        direction: "out",
        body: text,
        status: "failed",
        error: String(e?.message || e),
      });
      refetchConv();
      toast({ title: "Falha no envio", description: String(e?.message || e), variant: "destructive" });
    } finally {
      setSending(false);
    }
  };

  return (
    <DashboardLayout role="admin" title="Fale com o Nutri">
      <div className="space-y-4">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <HeartHandshake className="w-6 h-6 text-emerald-500" /> Automação Fale com o Nutri
            </h1>
            <p className="text-sm text-muted-foreground">
              Canal privado bidirecional via W-API — linha {NUTRI_PHONE} (somente alunos ativos).
            </p>
          </div>
          <Badge variant="outline" className="gap-1 border-emerald-500/40 text-emerald-500">
            <Phone className="w-3 h-3" /> {NUTRI_PHONE}
          </Badge>
        </div>

        <Tabs defaultValue="chat" className="space-y-4">
          <TabsList>
            <TabsTrigger value="chat"><MessageCircle className="w-4 h-4 mr-1" />Conversas</TabsTrigger>
            <TabsTrigger value="templates"><Pencil className="w-4 h-4 mr-1" />Templates</TabsTrigger>
            <TabsTrigger value="config"><Settings2 className="w-4 h-4 mr-1" />Configuração</TabsTrigger>
          </TabsList>

          <TabsContent value="chat">
            <div className="grid md:grid-cols-[320px_1fr] gap-4">
              <Card className="p-3 space-y-2">
                <div className="relative">
                  <Search className="w-4 h-4 absolute left-2 top-2.5 text-muted-foreground" />
                  <Input
                    placeholder="Buscar aluno ativo..."
                    className="pl-8 h-9"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                  />
                </div>
                <ScrollArea className="h-[60vh] pr-2">
                  {loadingStudents ? (
                    <div className="flex items-center justify-center py-6">
                      <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
                    </div>
                  ) : filtered.length === 0 ? (
                    <p className="text-xs text-muted-foreground p-4 text-center">Nenhum aluno ativo encontrado.</p>
                  ) : (
                    filtered.map((s) => {
                      const isPaused = optOutSet.has(s.user_id);
                      const isSel = selectedUserId === s.user_id;
                      return (
                        <button
                          key={s.user_id}
                          onClick={() => setSelectedUserId(s.user_id)}
                          className={`w-full text-left p-2 rounded-md transition-colors mb-1 border ${
                            isSel ? "bg-accent border-accent" : "border-transparent hover:bg-accent/50"
                          }`}
                        >
                          <div className="flex items-center justify-between gap-2">
                            <p className="text-sm font-medium truncate">{s.full_name || "Sem nome"}</p>
                            {isPaused && (
                              <Badge variant="outline" className="text-[10px] border-rose-500/40 text-rose-500">
                                Pausado
                              </Badge>
                            )}
                          </div>
                          <p className="text-[11px] text-muted-foreground truncate">{s.phone}</p>
                        </button>
                      );
                    })
                  )}
                </ScrollArea>
              </Card>

              <Card className="p-4 flex flex-col h-[70vh]">
                {!selected ? (
                  <div className="flex-1 flex items-center justify-center text-muted-foreground text-sm">
                    Selecione um aluno ativo para iniciar.
                  </div>
                ) : (
                  <>
                    <div className="flex items-center justify-between pb-3 border-b">
                      <div>
                        <p className="font-semibold">{selected.full_name}</p>
                        <p className="text-xs text-muted-foreground">{selected.phone} · {selected.email}</p>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-muted-foreground">Ativo</span>
                          <Switch
                            checked={!optOutSet.has(selected.user_id)}
                            onCheckedChange={(v) => toggleOptOut.mutate({ userId: selected.user_id, paused: !v })}
                          />
                        </div>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() =>
                            toggleOptOut.mutate({ userId: selected.user_id, paused: !optOutSet.has(selected.user_id) })
                          }
                          className={
                            optOutSet.has(selected.user_id)
                              ? "border-emerald-500/40 text-emerald-500"
                              : "border-rose-500/40 text-rose-500"
                          }
                        >
                          {optOutSet.has(selected.user_id) ? (
                            <><CheckCircle2 className="w-4 h-4 mr-1" /> Retomar</>
                          ) : (
                            <><Ban className="w-4 h-4 mr-1" /> Interromper</>
                          )}
                        </Button>
                        <Button variant="ghost" size="icon" onClick={() => refetchConv()} title="Atualizar">
                          <RefreshCw className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>

                    <ScrollArea className="flex-1 my-3 pr-2">
                      {conversation.length === 0 ? (
                        <p className="text-xs text-muted-foreground text-center py-6">
                          Sem mensagens ainda. Envie a primeira abaixo.
                        </p>
                      ) : (
                        <div className="space-y-2">
                          {conversation.map((m: any) => (
                            <div
                              key={m.id}
                              className={`flex ${m.direction === "out" ? "justify-end" : "justify-start"}`}
                            >
                              <div
                                className={`max-w-[75%] rounded-lg px-3 py-2 text-sm whitespace-pre-wrap ${
                                  m.direction === "out"
                                    ? "bg-emerald-500/15 text-foreground border border-emerald-500/30"
                                    : "bg-muted text-foreground"
                                }`}
                              >
                                {m.body}
                                <div className="text-[10px] opacity-60 mt-1 flex items-center gap-1">
                                  {new Date(m.created_at).toLocaleString("pt-BR")}
                                  {m.status === "failed" && (
                                    <span className="text-rose-500">· falhou</span>
                                  )}
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </ScrollArea>

                    <div className="space-y-2">
                      {templates.length > 0 && (
                        <Select
                          onValueChange={(id) => {
                            const tpl = templates.find((t: any) => t.id === id);
                            if (tpl) setDraft(replaceVars(tpl.content, selected));
                          }}
                        >
                          <SelectTrigger className="h-8 text-xs w-full">
                            <SelectValue placeholder="Inserir template..." />
                          </SelectTrigger>
                          <SelectContent>
                            {templates.map((t: any) => (
                              <SelectItem key={t.id} value={t.id} className="text-xs">
                                {t.title}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      )}
                      <div className="flex gap-2">
                        <Textarea
                          rows={2}
                          placeholder={
                            optOutSet.has(selected.user_id)
                              ? "Aluno pausou o canal. Reative para enviar."
                              : "Digite uma mensagem... use {nome} para personalizar."
                          }
                          value={draft}
                          onChange={(e) => setDraft(e.target.value)}
                          disabled={optOutSet.has(selected.user_id) || sending}
                          className="resize-none"
                          onKeyDown={(e) => {
                            if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) sendMessage();
                          }}
                        />
                        <Button
                          onClick={sendMessage}
                          disabled={!draft.trim() || sending || optOutSet.has(selected.user_id)}
                          className="bg-emerald-500 hover:bg-emerald-600 text-white self-end"
                        >
                          {sending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                        </Button>
                      </div>
                      <p className="text-[10px] text-muted-foreground">Ctrl/⌘+Enter para enviar</p>
                    </div>
                  </>
                )}
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="templates">
            <TemplatesPanel />
          </TabsContent>

          <TabsContent value="config">
            <Card className="p-6 space-y-4 max-w-2xl">
              <h3 className="font-semibold flex items-center gap-2">
                <Settings2 className="w-4 h-4" /> Configuração da API W-API
              </h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between border-b pb-2">
                  <span className="text-muted-foreground">Provedor</span>
                  <span className="font-medium">W-API</span>
                </div>
                <div className="flex justify-between border-b pb-2">
                  <span className="text-muted-foreground">Linha</span>
                  <span className="font-medium">{NUTRI_PHONE} (Nutri)</span>
                </div>
                <div className="flex justify-between border-b pb-2">
                  <span className="text-muted-foreground">Endpoint</span>
                  <span className="font-mono text-xs">api.w-api.app/v1/message</span>
                </div>
                <div className="flex justify-between border-b pb-2">
                  <span className="text-muted-foreground">Edge function</span>
                  <span className="font-mono text-xs">send-wapi</span>
                </div>
                <div className="flex justify-between border-b pb-2">
                  <span className="text-muted-foreground">Webhook entrada</span>
                  <span className="font-mono text-xs break-all">
                    {`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/wapi-inbound-nutri`}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Credenciais</span>
                  <span className="font-medium text-emerald-500">Configuradas</span>
                </div>
              </div>
              <p className="text-xs text-muted-foreground">
                Cole a URL do webhook acima no painel W-API para receber mensagens dos alunos automaticamente.
              </p>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
}

function TemplatesPanel() {
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<any | null>(null);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [category, setCategory] = useState("");

  const { data: templates = [], isLoading } = useQuery({
    queryKey: ["nutri-templates-all"],
    queryFn: async () => {
      const { data } = await supabase.from("nutri_templates").select("*").order("created_at", { ascending: false });
      return data || [];
    },
  });

  const reset = () => {
    setEditing(null);
    setTitle("");
    setContent("");
    setCategory("");
  };

  const save = useMutation({
    mutationFn: async () => {
      if (!title.trim() || !content.trim()) throw new Error("Título e conteúdo obrigatórios");
      const { data: u } = await supabase.auth.getUser();
      if (editing) {
        const { error } = await supabase
          .from("nutri_templates")
          .update({ title, content, category: category || null })
          .eq("id", editing.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from("nutri_templates")
          .insert({ title, content, category: category || null, created_by: u.user?.id });
        if (error) throw error;
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["nutri-templates-all"] });
      qc.invalidateQueries({ queryKey: ["nutri-templates"] });
      setOpen(false);
      reset();
      toast({ title: "Template salvo" });
    },
    onError: (e: any) => toast({ title: "Erro", description: e.message, variant: "destructive" }),
  });

  const remove = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("nutri_templates").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["nutri-templates-all"] });
      qc.invalidateQueries({ queryKey: ["nutri-templates"] });
      toast({ title: "Removido" });
    },
  });

  const toggleActive = useMutation({
    mutationFn: async ({ id, active }: { id: string; active: boolean }) => {
      const { error } = await supabase.from("nutri_templates").update({ active }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["nutri-templates-all"] });
      qc.invalidateQueries({ queryKey: ["nutri-templates"] });
    },
  });

  return (
    <Card className="p-4 space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold">Templates Fale com o Nutri</h3>
        <Dialog
          open={open}
          onOpenChange={(v) => {
            setOpen(v);
            if (!v) reset();
          }}
        >
          <DialogTrigger asChild>
            <Button size="sm" className="bg-emerald-500 hover:bg-emerald-600 text-white">
              <Plus className="w-4 h-4 mr-1" /> Novo template
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{editing ? "Editar template" : "Novo template"}</DialogTitle>
            </DialogHeader>
            <div className="space-y-3">
              <div>
                <Label className="text-xs">Título</Label>
                <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Ex.: Dúvida de dieta" />
              </div>
              <div>
                <Label className="text-xs">Categoria</Label>
                <Input
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  placeholder="Ex.: Dúvidas, Suporte..."
                />
              </div>
              <div>
                <Label className="text-xs">Conteúdo (use {"{nome}"}, {"{email}"}...)</Label>
                <Textarea
                  rows={6}
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  placeholder={"Olá {nome}! Tudo bem? Aqui é o Nutri..."}
                />
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

      {isLoading ? (
        <div className="flex justify-center py-6">
          <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
        </div>
      ) : templates.length === 0 ? (
        <p className="text-sm text-muted-foreground text-center py-6">
          Nenhum template cadastrado. Crie o primeiro para padronizar respostas.
        </p>
      ) : (
        <div className="grid md:grid-cols-2 gap-3">
          {templates.map((t: any) => (
            <Card key={t.id} className="p-3 space-y-2">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-sm">{t.title}</p>
                  {t.category && <p className="text-[11px] text-muted-foreground">{t.category}</p>}
                </div>
                <Switch
                  checked={t.active}
                  onCheckedChange={(v) => toggleActive.mutate({ id: t.id, active: v })}
                />
              </div>
              <p className="text-xs text-muted-foreground line-clamp-3 whitespace-pre-wrap">{t.content}</p>
              <div className="flex gap-2 justify-end">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setEditing(t);
                    setTitle(t.title);
                    setContent(t.content);
                    setCategory(t.category || "");
                    setOpen(true);
                  }}
                >
                  <Pencil className="w-3.5 h-3.5" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    if (confirm("Remover template?")) remove.mutate(t.id);
                  }}
                >
                  <Trash2 className="w-3.5 h-3.5 text-rose-500" />
                </Button>
              </div>
            </Card>
          ))}
        </div>
      )}
    </Card>
  );
}