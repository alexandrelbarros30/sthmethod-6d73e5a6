import { useState, lazy, Suspense } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Microscope, Save, Plus, Pencil, History, ChevronLeft, Trash2, X } from "lucide-react";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent as AlertContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle as AlertTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { toast } from "sonner";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import RichContentRenderer from "@/components/shared/RichContentRenderer";
import { ScrollArea } from "@/components/ui/scroll-area";

const RichTextEditor = lazy(() => import("@/components/shared/RichTextEditor"));

interface AdminMetabolicPanelProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  userId: string;
  userName: string;
}

type ViewMode = "list" | "edit";

const AdminMetabolicPanel = ({ open, onOpenChange, userId, userName }: AdminMetabolicPanelProps) => {
  const qc = useQueryClient();
  const [content, setContent] = useState("");
  const [title, setTitle] = useState("");
  const [visible, setVisible] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<ViewMode>("list");

  const { data: panels = [], isLoading } = useQuery({
    queryKey: ["metabolic-panels-admin", userId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("metabolic_panels")
        .select("*")
        .eq("user_id", userId)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data || [];
    },
    enabled: open && !!userId,
  });

  const startNew = () => {
    setEditingId(null);
    setContent("");
    setTitle("");
    setVisible(false);
    setViewMode("edit");
  };

  const startEdit = (panel: any) => {
    setEditingId(panel.id);
    setContent(panel.content || "");
    setTitle(panel.title || "");
    setVisible(panel.visible || false);
    setViewMode("edit");
  };

  const saveMutation = useMutation({
    mutationFn: async () => {
      if (editingId) {
        const { error } = await supabase
          .from("metabolic_panels")
          .update({ content, title, visible, seen_by_student: false })
          .eq("id", editingId);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from("metabolic_panels")
          .insert({ user_id: userId, content, title, visible, seen_by_student: false });
        if (error) throw error;
      }

      if (content.trim()) {
        const now = new Date();
        const dateStr = now.toLocaleDateString("pt-BR");
        const note = `📊 **Painel Metabólico atualizado em ${dateStr}**\n\n${content}`;
        await supabase.from("anamnesis_entries").insert({ user_id: userId, notes: note });
      }
    },
    onSuccess: () => {
      toast.success("Painel metabólico salvo!");
      qc.invalidateQueries({ queryKey: ["metabolic-panels-admin", userId] });
      qc.invalidateQueries({ queryKey: ["metabolic-panel-student", userId] });
      setViewMode("list");
    },
    onError: () => toast.error("Erro ao salvar painel metabólico"),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("metabolic_panels").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Registro excluído!");
      qc.invalidateQueries({ queryKey: ["metabolic-panels-admin", userId] });
      qc.invalidateQueries({ queryKey: ["metabolic-panel-student", userId] });
    },
    onError: () => toast.error("Erro ao excluir"),
  });

  const handleClose = () => {
    onOpenChange(false);
    setViewMode("list");
    setEditingId(null);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Microscope className="w-5 h-5 text-primary" />
            Painel Metabólico — {userName}
          </DialogTitle>
        </DialogHeader>

        {viewMode === "list" ? (
          <div className="space-y-3">
            <Button onClick={startNew} className="w-full" variant="outline">
              <Plus className="w-4 h-4 mr-2" />
              Nova Análise Metabólica
            </Button>

            {isLoading ? (
              <p className="text-sm text-muted-foreground py-4">Carregando...</p>
            ) : panels.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-6">Nenhum registro encontrado.</p>
            ) : (
              <ScrollArea className="max-h-[55vh]">
                <div className="space-y-2 pr-2">
                  {panels.map((panel: any) => (
                    <div
                      key={panel.id}
                      className="border border-border/50 rounded-lg p-3 bg-muted/20 hover:bg-muted/40 transition-colors"
                    >
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                          <History className="w-3.5 h-3.5" />
                          {format(new Date(panel.created_at), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                        </div>
                        <div className="flex items-center gap-2">
                          <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${panel.visible ? "bg-emerald-500/15 text-emerald-600" : "bg-muted text-muted-foreground"}`}>
                            {panel.visible ? "Liberado" : "Não liberado"}
                          </span>
                          <Button size="sm" variant="ghost" className="h-7 w-7 p-0" onClick={() => startEdit(panel)}>
                            <Pencil className="w-3.5 h-3.5" />
                          </Button>
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button size="sm" variant="ghost" className="h-7 w-7 p-0 text-destructive hover:text-destructive">
                                <Trash2 className="w-3.5 h-3.5" />
                              </Button>
                            </AlertDialogTrigger>
                            <AlertContent>
                              <AlertDialogHeader>
                                <AlertTitle>Excluir registro?</AlertTitle>
                                <AlertDialogDescription>Esta ação não pode ser desfeita.</AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                <AlertDialogAction onClick={() => deleteMutation.mutate(panel.id)} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">Excluir</AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertContent>
                          </AlertDialog>
                        </div>
                      </div>
                      {panel.title && <p className="text-sm font-medium mb-1">{panel.title}</p>}
                      <div className="prose prose-sm dark:prose-invert max-w-none line-clamp-3 text-xs">
                        <RichContentRenderer content={panel.content || ""} />
                      </div>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            )}
          </div>
        ) : (
          <div className="space-y-4">
            <div className="flex items-center justify-between -ml-2">
              <Button variant="ghost" size="sm" onClick={() => setViewMode("list")} className="gap-1">
                <ChevronLeft className="w-4 h-4" />
                Voltar ao histórico
              </Button>
              <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setViewMode("list")}>
                <X className="w-4 h-4" />
              </Button>
            </div>

            <div>
              <Label htmlFor="panel-title" className="text-sm mb-1.5 block">Título</Label>
              <Input id="panel-title" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Ex: Análise laboratorial — Março 2026" />
            </div>

            <Suspense fallback={<div className="h-[220px] rounded-md border border-input bg-background animate-pulse" />}>
              <RichTextEditor
                value={content}
                onChange={setContent}
                placeholder="Descreva a análise metabólica, interpretação de exames laboratoriais, orientações..."
              />
            </Suspense>

            <div className="flex items-center gap-3 p-3 rounded-lg border border-border/50 bg-muted/30">
              <Switch id="visible-toggle" checked={visible} onCheckedChange={setVisible} />
              <Label htmlFor="visible-toggle" className="text-sm cursor-pointer">
                {visible ? "Liberado para o aluno" : "Não liberado ao aluno"}
              </Label>
            </div>

            <Button onClick={() => saveMutation.mutate()} disabled={saveMutation.isPending} className="w-full">
              <Save className="w-4 h-4 mr-2" />
              {saveMutation.isPending ? "Salvando..." : editingId ? "Atualizar Painel" : "Salvar Novo Painel"}
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default AdminMetabolicPanel;
