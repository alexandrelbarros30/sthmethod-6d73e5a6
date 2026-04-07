import { useState } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Plus, Pencil, Trash2, Megaphone, Calendar, Users, Eye } from "lucide-react";
import { format } from "date-fns";

const WELCOME_TEMPLATES = [
  "👋 Bem-vindo(a) à plataforma! Estamos muito felizes em ter você aqui. Explore todas as funcionalidades e conte com a gente!",
  "🎉 Seja bem-vindo(a)! Sua jornada de transformação começa agora. Acompanhe sua dieta, treinos e protocolos tudo em um só lugar!",
  "🚀 Olá! Você acaba de desbloquear o acesso completo. Comece explorando sua dieta personalizada e seu plano de treinos!",
  "💪 Bem-vindo(a) ao time! Aqui você encontra tudo que precisa para alcançar seus objetivos. Vamos juntos!",
  "🌟 Que bom ter você aqui! Aproveite ao máximo sua experiência — sua saúde e seus resultados merecem o melhor!",
];

const ROUTE_OPTIONS = [
  { value: "", label: "Sem botão" },
  { value: "/dashboard", label: "Visão Geral" },
  { value: "/dashboard/diet", label: "Dieta" },
  { value: "/dashboard/training", label: "Treino" },
  { value: "/dashboard/protocol", label: "Protocolo" },
  { value: "/dashboard/metabolic", label: "Painel Metabólico" },
  { value: "/dashboard/evolution", label: "Atualização" },
  { value: "/dashboard/bioimpedance", label: "Bioimpedância" },
  { value: "/dashboard/content", label: "Conteúdo" },
  { value: "/dashboard/subscription", label: "Assinatura" },
  { value: "/dashboard/hub", label: "Hub" },
  { value: "/dashboard/recipes", label: "Receitas" },
  { value: "/dashboard/profile", label: "Perfil" },
];

interface PopupForm {
  title: string;
  message: string;
  button_text: string;
  button_route: string;
  start_date: string;
  end_date: string;
  target_type: string;
  target_user_id: string;
  active: boolean;
}

const emptyForm: PopupForm = {
  title: "",
  message: "",
  button_text: "",
  button_route: "",
  start_date: new Date().toISOString().split("T")[0],
  end_date: "",
  target_type: "all_active",
  target_user_id: "",
  active: true,
};

const AdminPopups = () => {
  const queryClient = useQueryClient();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<PopupForm>(emptyForm);

  const { data: popups, isLoading } = useQuery({
    queryKey: ["admin-popups"],
    queryFn: async () => {
      const { data } = await supabase
        .from("custom_popups")
        .select("*")
        .order("created_at", { ascending: false });
      return data || [];
    },
  });

  const { data: dismissalCounts } = useQuery({
    queryKey: ["admin-popup-dismissals"],
    queryFn: async () => {
      const { data } = await supabase.from("popup_dismissals").select("popup_id");
      const counts: Record<string, number> = {};
      (data || []).forEach((d: any) => {
        counts[d.popup_id] = (counts[d.popup_id] || 0) + 1;
      });
      return counts;
    },
  });

  const { data: students } = useQuery({
    queryKey: ["admin-popup-students"],
    queryFn: async () => {
      const { data } = await supabase
        .from("profiles")
        .select("user_id, full_name, email")
        .order("full_name");
      return data || [];
    },
  });

  const saveMutation = useMutation({
    mutationFn: async () => {
      const payload = {
        title: form.title,
        message: form.message,
        button_text: form.button_text || null,
        button_route: form.button_route || null,
        start_date: form.start_date,
        end_date: form.end_date || null,
        target_type: form.target_type,
        target_user_id: form.target_type === "specific" ? form.target_user_id || null : null,
        active: form.active,
      };
      if (editingId) {
        const { error } = await supabase.from("custom_popups").update(payload).eq("id", editingId);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("custom_popups").insert(payload);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-popups"] });
      toast.success(editingId ? "Popup atualizado!" : "Popup criado!");
      setDialogOpen(false);
      setEditingId(null);
      setForm(emptyForm);
    },
    onError: () => toast.error("Erro ao salvar popup"),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("custom_popups").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-popups"] });
      toast.success("Popup excluído!");
    },
  });

  const openEdit = (popup: any) => {
    setEditingId(popup.id);
    setForm({
      title: popup.title || "",
      message: popup.message || "",
      button_text: popup.button_text || "",
      button_route: popup.button_route || "",
      start_date: popup.start_date || "",
      end_date: popup.end_date || "",
      target_type: popup.target_type || "all_active",
      target_user_id: popup.target_user_id || "",
      active: popup.active ?? true,
    });
    setDialogOpen(true);
  };

  const openNew = () => {
    setEditingId(null);
    setForm(emptyForm);
    setDialogOpen(true);
  };

  const applyTemplate = (tpl: string) => {
    setForm((f) => ({ ...f, title: "Boas-Vindas 👋", message: tpl }));
  };

  const targetLabel = (t: string) => {
    if (t === "all_active") return "Todos Ativos";
    if (t === "all_inactive") return "Todos Inativos";
    if (t === "all") return "Todos";
    return "Aluno Específico";
  };

  const statusBadge = (popup: any) => {
    const now = new Date().toISOString().split("T")[0];
    if (!popup.active) return <Badge variant="secondary">Inativo</Badge>;
    if (popup.end_date && popup.end_date < now) return <Badge variant="outline" className="text-muted-foreground">Encerrado</Badge>;
    if (popup.start_date > now) return <Badge className="bg-amber-500 text-white">Agendado</Badge>;
    return <Badge className="bg-emerald-500 text-white">Ativo</Badge>;
  };

  return (
    <DashboardLayout role="admin" title="Popups" subtitle="Crie e gerencie popups personalizados para os alunos.">
      <div className="flex justify-end mb-4">
        <Button onClick={openNew} className="gap-2">
          <Plus className="w-4 h-4" /> Novo Popup
        </Button>
      </div>

      {isLoading ? (
        <p className="text-sm text-muted-foreground text-center py-8">Carregando...</p>
      ) : !popups?.length ? (
        <Card>
          <CardContent className="py-12 text-center">
            <Megaphone className="w-10 h-10 text-muted-foreground/40 mx-auto mb-3" />
            <p className="text-sm text-muted-foreground">Nenhum popup criado ainda.</p>
            <Button variant="outline" className="mt-4 gap-2" onClick={openNew}>
              <Plus className="w-4 h-4" /> Criar Primeiro Popup
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {popups.map((p: any) => (
            <Card key={p.id}>
              <CardContent className="py-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <Megaphone className="w-4 h-4 text-primary shrink-0" />
                      <h3 className="text-sm font-semibold truncate">{p.title || "Sem título"}</h3>
                      {statusBadge(p)}
                    </div>
                    <p className="text-xs text-muted-foreground line-clamp-2 mb-2">{p.message}</p>
                    <div className="flex flex-wrap gap-2 text-[10px] text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Users className="w-3 h-3" /> {targetLabel(p.target_type)}
                      </span>
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3 h-3" /> {format(new Date(p.start_date + "T12:00:00"), "dd/MM/yyyy")}
                        {p.end_date && ` → ${format(new Date(p.end_date + "T12:00:00"), "dd/MM/yyyy")}`}
                      </span>
                      <span className="flex items-center gap-1">
                        <Eye className="w-3 h-3" /> {dismissalCounts?.[p.id] || 0} visualizações
                      </span>
                      {p.button_text && (
                        <Badge variant="outline" className="text-[10px]">Botão: {p.button_text}</Badge>
                      )}
                    </div>
                  </div>
                  <div className="flex gap-1 shrink-0">
                    <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openEdit(p)}>
                      <Pencil className="w-3.5 h-3.5" />
                    </Button>
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => deleteMutation.mutate(p.id)}>
                      <Trash2 className="w-3.5 h-3.5" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Editor Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{editingId ? "Editar Popup" : "Novo Popup"}</DialogTitle>
          </DialogHeader>
          <ScrollArea className="max-h-[70vh]">
            <div className="space-y-4 pr-2">
              {/* Templates */}
              {!editingId && (
                <div>
                  <label className="text-xs font-medium text-muted-foreground mb-1 block">Templates de Boas-Vindas</label>
                  <div className="flex flex-wrap gap-1">
                    {WELCOME_TEMPLATES.map((tpl, i) => (
                      <Button key={i} variant="outline" size="sm" className="text-[10px] h-7" onClick={() => applyTemplate(tpl)}>
                        Template {i + 1}
                      </Button>
                    ))}
                  </div>
                </div>
              )}

              <div>
                <label className="text-xs font-medium mb-1 block">Título</label>
                <Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="Título do popup" />
              </div>

              <div>
                <label className="text-xs font-medium mb-1 block">Mensagem</label>
                <Textarea value={form.message} onChange={(e) => setForm({ ...form, message: e.target.value })} rows={4} placeholder="Mensagem do popup..." />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-medium mb-1 block">Texto do Botão</label>
                  <Input value={form.button_text} onChange={(e) => setForm({ ...form, button_text: e.target.value })} placeholder="Ex: Ver Dieta" />
                </div>
                <div>
                  <label className="text-xs font-medium mb-1 block">Destino do Botão</label>
                  <Select value={form.button_route} onValueChange={(v) => setForm({ ...form, button_route: v })}>
                    <SelectTrigger><SelectValue placeholder="Selecionar tela" /></SelectTrigger>
                    <SelectContent>
                      {ROUTE_OPTIONS.map((r) => (
                        <SelectItem key={r.value} value={r.value || "none"}>{r.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-medium mb-1 block">Data de Início</label>
                  <Input type="date" value={form.start_date} onChange={(e) => setForm({ ...form, start_date: e.target.value })} />
                </div>
                <div>
                  <label className="text-xs font-medium mb-1 block">Data de Encerramento</label>
                  <Input type="date" value={form.end_date} onChange={(e) => setForm({ ...form, end_date: e.target.value })} />
                </div>
              </div>

              <div>
                <label className="text-xs font-medium mb-1 block">Público-Alvo</label>
                <Select value={form.target_type} onValueChange={(v) => setForm({ ...form, target_type: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all_active">Todos os Alunos Ativos</SelectItem>
                    <SelectItem value="all_inactive">Todos os Alunos Inativos</SelectItem>
                    <SelectItem value="all">Todos os Alunos</SelectItem>
                    <SelectItem value="specific">Aluno Específico</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {form.target_type === "specific" && (
                <div>
                  <label className="text-xs font-medium mb-1 block">Selecionar Aluno</label>
                  <Select value={form.target_user_id} onValueChange={(v) => setForm({ ...form, target_user_id: v })}>
                    <SelectTrigger><SelectValue placeholder="Escolher aluno..." /></SelectTrigger>
                    <SelectContent>
                      {students?.map((s: any) => (
                        <SelectItem key={s.user_id} value={s.user_id}>
                          {s.full_name || s.email}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={form.active}
                  onChange={(e) => setForm({ ...form, active: e.target.checked })}
                  className="rounded border-input"
                />
                <label className="text-sm">Ativo</label>
              </div>

              <Button className="w-full" onClick={() => saveMutation.mutate()} disabled={!form.title || !form.message || saveMutation.isPending}>
                {saveMutation.isPending ? "Salvando..." : editingId ? "Atualizar" : "Criar Popup"}
              </Button>
            </div>
          </ScrollArea>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
};

export default AdminPopups;
