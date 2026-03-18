import { useState } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { Plus, Edit, Trash2, Copy, Eye, Send, Clock, Search, MessageSquare, Image, Phone, Calendar, Users, Filter, Variable, Save, X } from "lucide-react";

const SYSTEM_VARIABLE_KEYS = ["{nome}", "{plano}", "{vencimento}", "{link}", "{dias_restantes}", "{valor}"];

const replaceVariables = (
  content: string,
  student?: { full_name?: string; user_id?: string; phone?: string },
  subscription?: any,
  plan?: any,
) => {
  let msg = content;
  const name = student?.full_name?.split(" ")[0] || "Aluno";
  msg = msg.replace(/\{nome\}/g, name);
  msg = msg.replace(/\{plano\}/g, plan?.name || "—");
  if (subscription?.end_date) {
    const d = new Date(subscription.end_date);
    msg = msg.replace(/\{vencimento\}/g, d.toLocaleDateString("pt-BR"));
    const diff = Math.max(0, Math.ceil((d.getTime() - Date.now()) / 86400000));
    msg = msg.replace(/\{dias_restantes\}/g, String(diff));
  } else {
    msg = msg.replace(/\{vencimento\}/g, "—");
    msg = msg.replace(/\{dias_restantes\}/g, "—");
  }
  const link = student?.user_id ? `${window.location.origin}/dashboard/renew?uid=${student.user_id}` : "";
  msg = msg.replace(/\{link\}/g, link);
  msg = msg.replace(/\{valor\}/g, plan?.price ? `R$ ${plan.price}` : "—");
  return msg;
};

const AdminMessages = () => {
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState("templates");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [editorOpen, setEditorOpen] = useState(false);
  const [sendDialogOpen, setSendDialogOpen] = useState(false);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<any>(null);
  const [sendingTemplate, setSendingTemplate] = useState<any>(null);
  const [previewTemplate, setPreviewTemplate] = useState<any>(null);
  const [historySearch, setHistorySearch] = useState("");

  // Form state
  const [formTitle, setFormTitle] = useState("");
  const [formContent, setFormContent] = useState("");
  const [formCategoryId, setFormCategoryId] = useState("");
  const [formImageUrl, setFormImageUrl] = useState("");
  const [formReusable, setFormReusable] = useState(true);

  // Send form state
  const [sendFilter, setSendFilter] = useState("all");
  const [sendSchedule, setSendSchedule] = useState("now");
  const [sendScheduleDate, setSendScheduleDate] = useState("");
  const [selectedStudents, setSelectedStudents] = useState<string[]>([]);

  // Variable editor state
  const [varEditing, setVarEditing] = useState<string | null>(null);
  const [varNewOpen, setVarNewOpen] = useState(false);
  const [varFormKey, setVarFormKey] = useState("");
  const [varFormLabel, setVarFormLabel] = useState("");
  const [varFormExample, setVarFormExample] = useState("");

  // Queries
  const { data: categories } = useQuery({
    queryKey: ["message-categories"],
    queryFn: async () => {
      const { data } = await supabase.from("message_categories").select("*").order("sort_order");
      return data || [];
    },
  });

  const { data: templates } = useQuery({
    queryKey: ["message-templates"],
    queryFn: async () => {
      const { data } = await supabase.from("message_templates").select("*, message_categories(name)").order("created_at", { ascending: false });
      return data || [];
    },
  });

  const { data: history } = useQuery({
    queryKey: ["message-history"],
    queryFn: async () => {
      const { data } = await supabase.from("message_history").select("*, message_categories(name)").order("created_at", { ascending: false }).limit(100);
      return data || [];
    },
  });

  const { data: profiles } = useQuery({
    queryKey: ["msg-profiles"],
    queryFn: async () => {
      const { data } = await supabase.from("profiles").select("user_id, full_name, email, phone, birth_date, created_at");
      return data || [];
    },
  });

  const { data: subscriptions } = useQuery({
    queryKey: ["msg-subscriptions"],
    queryFn: async () => {
      const { data } = await supabase.from("subscriptions").select("*, plans(name, duration_days)");
      return data || [];
    },
  });

  // Mutations
  const saveMutation = useMutation({
    mutationFn: async () => {
      const payload = {
        title: formTitle,
        content: formContent,
        category_id: formCategoryId,
        image_url: formImageUrl || null,
        is_reusable: formReusable,
      };
      if (editingTemplate) {
        const { error } = await supabase.from("message_templates").update(payload).eq("id", editingTemplate.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("message_templates").insert(payload);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["message-templates"] });
      setEditorOpen(false);
      resetForm();
      toast({ title: editingTemplate ? "Mensagem atualizada!" : "Mensagem criada!" });
    },
    onError: () => toast({ title: "Erro ao salvar", variant: "destructive" }),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("message_templates").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["message-templates"] });
      toast({ title: "Mensagem excluída!" });
    },
  });

  const sendMutation = useMutation({
    mutationFn: async () => {
      if (!sendingTemplate) return;
      const students = getFilteredStudents();
      const targets = selectedStudents.length > 0 
        ? students.filter(s => selectedStudents.includes(s.user_id))
        : students;

      const records = targets.map(s => {
        const sub = subscriptions?.find(sub => sub.user_id === s.user_id);
        const plan = sub ? (sub as any).plans : null;
        const personalizedContent = replaceVariables(sendingTemplate.content, s, sub, plan);
        return {
          template_id: sendingTemplate.id,
          category_id: sendingTemplate.category_id,
          user_id: s.user_id,
          recipient_phone: s.phone || "",
          recipient_name: s.full_name || "",
          content: personalizedContent,
          image_url: sendingTemplate.image_url,
          status: sendSchedule === "now" ? "pending" : "scheduled",
          scheduled_at: sendSchedule === "schedule" && sendScheduleDate ? new Date(sendScheduleDate).toISOString() : null,
        };
      });

      const { error } = await supabase.from("message_history").insert(records);
      if (error) throw error;

      // Generate WhatsApp links for immediate sends
      if (sendSchedule === "now") {
        for (const s of targets) {
          if (s.phone) {
            const phone = s.phone.replace(/\D/g, "");
            const sub = subscriptions?.find(sub => sub.user_id === s.user_id);
            const plan = sub ? (sub as any).plans : null;
            const text = encodeURIComponent(replaceVariables(sendingTemplate.content, s, sub, plan));
            window.open(`https://wa.me/55${phone}?text=${text}`, "_blank");
          }
        }
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["message-history"] });
      setSendDialogOpen(false);
      setSendingTemplate(null);
      setSelectedStudents([]);
      toast({ title: sendSchedule === "now" ? "Mensagens enviadas!" : "Mensagens agendadas!" });
    },
    onError: () => toast({ title: "Erro ao enviar", variant: "destructive" }),
  });

  const resetForm = () => {
    setFormTitle(""); setFormContent(""); setFormCategoryId(""); setFormImageUrl(""); setFormReusable(true); setEditingTemplate(null);
  };

  const openEditor = (template?: any) => {
    if (template) {
      setEditingTemplate(template);
      setFormTitle(template.title);
      setFormContent(template.content);
      setFormCategoryId(template.category_id);
      setFormImageUrl(template.image_url || "");
      setFormReusable(template.is_reusable);
    } else {
      resetForm();
    }
    setEditorOpen(true);
  };

  const duplicateTemplate = (template: any) => {
    resetForm();
    setFormTitle(`${template.title} (cópia)`);
    setFormContent(template.content);
    setFormCategoryId(template.category_id);
    setFormImageUrl(template.image_url || "");
    setFormReusable(true);
    setEditorOpen(true);
  };

  const openSendDialog = (template: any) => {
    setSendingTemplate(template);
    setSendFilter("all");
    setSendSchedule("now");
    setSendScheduleDate("");
    setSelectedStudents([]);
    setSendDialogOpen(true);
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const ext = file.name.split(".").pop();
    const path = `messages/${Date.now()}.${ext}`;
    const { error } = await supabase.storage.from("landing-assets").upload(path, file);
    if (error) { toast({ title: "Erro no upload", variant: "destructive" }); return; }
    const { data: urlData } = supabase.storage.from("landing-assets").getPublicUrl(path);
    setFormImageUrl(urlData.publicUrl);
    toast({ title: "Imagem enviada!" });
  };

  const getFilteredStudents = () => {
    if (!profiles) return [];
    const now = new Date();
    const in7 = new Date(now.getTime() + 7 * 86400000);

    return profiles.filter(p => {
      if (sendFilter === "all") return true;
      const sub = subscriptions?.find(s => s.user_id === p.user_id);
      if (sendFilter === "active") return sub && sub.status === "active" && new Date(sub.end_date) > now;
      if (sendFilter === "expiring") return sub && sub.status === "active" && new Date(sub.end_date) > now && new Date(sub.end_date) <= in7;
      if (sendFilter === "expired") return sub && (sub.status === "expired" || new Date(sub.end_date) <= now);
      if (sendFilter === "new") {
        const created = new Date(p.created_at || "");
        return (now.getTime() - created.getTime()) < 7 * 86400000;
      }
      if (sendFilter === "inactive") return !sub;
      if (sendFilter.startsWith("plan_")) {
        const days = parseInt(sendFilter.split("_")[1]);
        return sub && (sub as any).plans?.duration_days === days;
      }
      return true;
    });
  };

  const filteredTemplates = templates?.filter(t => selectedCategory === "all" || t.category_id === selectedCategory) || [];
  const filteredHistory = history?.filter(h => !historySearch || h.recipient_name?.toLowerCase().includes(historySearch.toLowerCase()) || h.content?.toLowerCase().includes(historySearch.toLowerCase())) || [];

  const statusBadge = (status: string) => {
    const map: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
      pending: { label: "Pendente", variant: "secondary" },
      sent: { label: "Enviado", variant: "default" },
      scheduled: { label: "Agendado", variant: "outline" },
      error: { label: "Erro", variant: "destructive" },
    };
    const s = map[status] || { label: status, variant: "secondary" as const };
    return <Badge variant={s.variant}>{s.label}</Badge>;
  };

  return (
    <DashboardLayout role="admin" title="Mensagens" subtitle="Central de comunicação com alunos.">
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="mb-4">
          <TabsTrigger value="templates"><MessageSquare className="w-4 h-4 mr-1" />Templates</TabsTrigger>
          <TabsTrigger value="history"><Clock className="w-4 h-4 mr-1" />Histórico</TabsTrigger>
        </TabsList>

        {/* TEMPLATES TAB */}
        <TabsContent value="templates">
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 mb-4">
            <Select value={selectedCategory} onValueChange={setSelectedCategory}>
              <SelectTrigger className="w-[220px]"><Filter className="w-4 h-4 mr-1" /><SelectValue placeholder="Categoria" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas as categorias</SelectItem>
                {categories?.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
              </SelectContent>
            </Select>
            <Button onClick={() => openEditor()} className="ml-auto"><Plus className="w-4 h-4 mr-1" />Nova Mensagem</Button>
          </div>

          {filteredTemplates.length === 0 ? (
            <Card><CardContent className="py-12 text-center text-muted-foreground">Nenhuma mensagem criada ainda.</CardContent></Card>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {filteredTemplates.map(t => (
                <Card key={t.id} className="flex flex-col">
                  <CardHeader className="pb-2">
                    <div className="flex items-start justify-between">
                      <div>
                        <CardTitle className="text-sm font-semibold">{t.title}</CardTitle>
                        <Badge variant="outline" className="mt-1 text-xs">{(t as any).message_categories?.name}</Badge>
                      </div>
                      {t.is_reusable && <Badge variant="secondary" className="text-[10px]">Reutilizável</Badge>}
                    </div>
                  </CardHeader>
                  <CardContent className="flex-1 flex flex-col">
                    <p className="text-xs text-muted-foreground line-clamp-3 mb-3 flex-1">{t.content}</p>
                    {t.image_url && <img src={t.image_url} alt="" className="w-full h-24 object-cover rounded mb-3" />}
                    <div className="flex gap-1 flex-wrap">
                      <Button size="sm" variant="ghost" onClick={() => { setPreviewTemplate(t); setPreviewOpen(true); }}><Eye className="w-3 h-3" /></Button>
                      <Button size="sm" variant="ghost" onClick={() => openEditor(t)}><Edit className="w-3 h-3" /></Button>
                      <Button size="sm" variant="ghost" onClick={() => duplicateTemplate(t)}><Copy className="w-3 h-3" /></Button>
                      <Button size="sm" variant="ghost" onClick={() => openSendDialog(t)}><Send className="w-3 h-3" /></Button>
                      <Button size="sm" variant="ghost" className="text-destructive" onClick={() => deleteMutation.mutate(t.id)}><Trash2 className="w-3 h-3" /></Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        {/* HISTORY TAB */}
        <TabsContent value="history">
          <div className="flex items-center gap-3 mb-4">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input placeholder="Buscar por aluno ou conteúdo..." value={historySearch} onChange={e => setHistorySearch(e.target.value)} className="pl-9" />
            </div>
          </div>
          <Card>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Aluno</TableHead>
                    <TableHead>Categoria</TableHead>
                    <TableHead>Conteúdo</TableHead>
                    <TableHead>Data</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredHistory.length === 0 ? (
                    <TableRow><TableCell colSpan={5} className="text-center text-muted-foreground py-8">Nenhuma mensagem enviada.</TableCell></TableRow>
                  ) : filteredHistory.map(h => (
                    <TableRow key={h.id}>
                      <TableCell>
                        <div>
                          <p className="text-sm font-medium">{h.recipient_name || "—"}</p>
                          <p className="text-xs text-muted-foreground">{h.recipient_phone}</p>
                        </div>
                      </TableCell>
                      <TableCell><Badge variant="outline" className="text-xs">{(h as any).message_categories?.name || "—"}</Badge></TableCell>
                      <TableCell className="max-w-[200px]"><p className="text-xs truncate">{h.content}</p></TableCell>
                      <TableCell className="text-xs text-muted-foreground">{h.scheduled_at ? new Date(h.scheduled_at).toLocaleString("pt-BR") : h.sent_at ? new Date(h.sent_at).toLocaleString("pt-BR") : new Date(h.created_at).toLocaleString("pt-BR")}</TableCell>
                      <TableCell>{statusBadge(h.status)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* EDITOR DIALOG */}
      <Dialog open={editorOpen} onOpenChange={setEditorOpen}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingTemplate ? "Editar Mensagem" : "Nova Mensagem"}</DialogTitle>
            <DialogDescription>Preencha os campos abaixo para criar ou editar uma mensagem.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Categoria</Label>
              <Select value={formCategoryId} onValueChange={setFormCategoryId}>
                <SelectTrigger><SelectValue placeholder="Selecione..." /></SelectTrigger>
                <SelectContent>
                  {categories?.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Título interno</Label>
              <Input value={formTitle} onChange={e => setFormTitle(e.target.value)} placeholder="Ex: Cobrança PIX 30 dias" />
            </div>
            <div>
              <Label>Conteúdo da mensagem</Label>
              <Textarea value={formContent} onChange={e => setFormContent(e.target.value)} rows={6} placeholder="Escreva a mensagem aqui..." />
            </div>
            <div>
              <Label>Imagem (opcional)</Label>
              <div className="flex gap-2 items-center">
                <Input type="file" accept=".jpg,.jpeg,.png" onChange={handleImageUpload} />
              </div>
              {formImageUrl && <img src={formImageUrl} alt="" className="mt-2 h-20 rounded object-cover" />}
            </div>
            <div className="flex items-center gap-2">
              <Checkbox checked={formReusable} onCheckedChange={(v) => setFormReusable(!!v)} id="reusable" />
              <Label htmlFor="reusable">Reutilizável para outros alunos</Label>
            </div>
            <div>
              <Label className="text-xs text-muted-foreground flex items-center gap-1 mb-1"><Variable className="w-3 h-3" /> Variáveis disponíveis</Label>
              <div className="flex flex-wrap gap-1">
                {AVAILABLE_VARIABLES.map(v => (
                  <Button key={v.key} type="button" variant="outline" size="sm" className="h-6 text-[10px] px-2 font-mono"
                    onClick={() => setFormContent(prev => prev + v.key)}
                    title={`${v.label} — ex: ${v.example}`}
                  >
                    {v.key}
                  </Button>
                ))}
              </div>
              <p className="text-[10px] text-muted-foreground mt-1">Clique para inserir no final da mensagem. Ex: "Olá {"{nome}"}, seu plano vence em {"{vencimento}"}."</p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditorOpen(false)}>Cancelar</Button>
            <Button onClick={() => saveMutation.mutate()} disabled={!formTitle || !formContent || !formCategoryId}>Salvar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* WHATSAPP PREVIEW DIALOG */}
      <Dialog open={previewOpen} onOpenChange={setPreviewOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2"><Phone className="w-4 h-4" /> Pré-visualização WhatsApp</DialogTitle>
            <DialogDescription>Assim a mensagem aparecerá no WhatsApp.</DialogDescription>
          </DialogHeader>
          <div className="bg-[#e5ddd5] rounded-lg p-4 min-h-[200px]">
            <div className="bg-[#dcf8c6] rounded-lg p-3 shadow-sm max-w-[85%] ml-auto">
              {previewTemplate?.image_url && <img src={previewTemplate.image_url} alt="" className="w-full rounded mb-2" />}
              <p className="text-sm text-[#303030] whitespace-pre-wrap">
                {replaceVariables(
                  previewTemplate?.content || "",
                  { full_name: "Maria Silva", user_id: "demo" },
                  { end_date: new Date(Date.now() + 7 * 86400000).toISOString() },
                  { name: "Plano Premium 90 dias", price: "297,00" },
                )}
              </p>
              <p className="text-[10px] text-[#667781] text-right mt-1">{new Date().toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}</p>
            </div>
          </div>
          <p className="text-[10px] text-muted-foreground text-center">⬆ Pré-visualização com dados de exemplo</p>
        </DialogContent>
      </Dialog>

      {/* SEND DIALOG */}
      <Dialog open={sendDialogOpen} onOpenChange={setSendDialogOpen}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2"><Send className="w-4 h-4" /> Enviar Mensagem</DialogTitle>
            <DialogDescription>Selecione os destinatários e o agendamento.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label className="flex items-center gap-1"><Users className="w-4 h-4" /> Segmentação</Label>
              <Select value={sendFilter} onValueChange={v => { setSendFilter(v); setSelectedStudents([]); }}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos os alunos</SelectItem>
                  <SelectItem value="active">Alunos ativos</SelectItem>
                  <SelectItem value="expiring">Plano vencendo em 7 dias</SelectItem>
                  <SelectItem value="expired">Plano vencido</SelectItem>
                  <SelectItem value="new">Novos cadastros (7 dias)</SelectItem>
                  <SelectItem value="inactive">Alunos inativos</SelectItem>
                  <SelectItem value="plan_30">Plano 30 dias</SelectItem>
                  <SelectItem value="plan_90">Plano 90 dias</SelectItem>
                  <SelectItem value="plan_180">Plano 6 meses</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="border rounded-lg p-3 max-h-40 overflow-y-auto space-y-1">
              <p className="text-xs text-muted-foreground mb-2">{getFilteredStudents().length} aluno(s) encontrado(s) — marque para envio individual</p>
              {getFilteredStudents().map(s => (
                <label key={s.user_id} className="flex items-center gap-2 text-sm cursor-pointer hover:bg-muted/50 px-2 py-1 rounded">
                  <Checkbox
                    checked={selectedStudents.includes(s.user_id)}
                    onCheckedChange={(checked) => {
                      setSelectedStudents(prev => checked ? [...prev, s.user_id] : prev.filter(id => id !== s.user_id));
                    }}
                  />
                  <span>{s.full_name || s.email}</span>
                  {s.phone && <span className="text-xs text-muted-foreground ml-auto">{s.phone}</span>}
                </label>
              ))}
            </div>

            <div>
              <Label className="flex items-center gap-1"><Calendar className="w-4 h-4" /> Agendamento</Label>
              <Select value={sendSchedule} onValueChange={setSendSchedule}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="now">Envio imediato</SelectItem>
                  <SelectItem value="schedule">Agendar data/hora</SelectItem>
                </SelectContent>
              </Select>
              {sendSchedule === "schedule" && (
                <Input type="datetime-local" className="mt-2" value={sendScheduleDate} onChange={e => setSendScheduleDate(e.target.value)} />
              )}
            </div>

            <div className="text-xs text-muted-foreground bg-muted/50 rounded p-3">
              <p className="font-medium mb-1">📲 Número de envio: +55 21 99849-6289</p>
              <p>O envio imediato abrirá o WhatsApp Web para cada destinatário. Para envio automático via API, configure Z-API, Twilio ou Meta Cloud API.</p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setSendDialogOpen(false)}>Cancelar</Button>
            <Button onClick={() => sendMutation.mutate()} disabled={getFilteredStudents().length === 0}>
              {sendSchedule === "now" ? "Enviar agora" : "Agendar"} ({selectedStudents.length > 0 ? selectedStudents.length : getFilteredStudents().length} aluno{(selectedStudents.length > 0 ? selectedStudents.length : getFilteredStudents().length) !== 1 ? "s" : ""})
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
};

export default AdminMessages;
