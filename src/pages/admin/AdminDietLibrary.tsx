import { useState } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Pencil, Trash2, Search, Plus, BookOpen, Flame, Beef, Wheat, Droplets } from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";
import { ScrollArea } from "@/components/ui/scroll-area";

const AdminDietLibrary = () => {
  const qc = useQueryClient();
  const { user } = useAuth();
  const [search, setSearch] = useState("");
  const [formOpen, setFormOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [kcal, setKcal] = useState("");
  const [protein, setProtein] = useState("");
  const [carbs, setCarbs] = useState("");
  const [fat, setFat] = useState("");
  const [previewId, setPreviewId] = useState<string | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const { data: items, isLoading } = useQuery({
    queryKey: ["diet-library"],
    queryFn: async () => {
      const { data } = await supabase
        .from("diet_library" as any)
        .select("*")
        .order("created_at", { ascending: false });
      return (data || []) as any[];
    },
  });

  const [hydration, setHydration] = useState("");

  const resetForm = () => {
    setTitle("");
    setContent("");
    setKcal("");
    setProtein("");
    setCarbs("");
    setFat("");
    setHydration("");
    setEditingId(null);
  };

  const openNew = () => {
    resetForm();
    setFormOpen(true);
  };

  const openEdit = (item: any) => {
    setEditingId(item.id);
    setTitle(item.title);
    setContent(item.content || "");
    setKcal(String(item.energy_kcal || 0));
    setProtein(String(item.protein_g || 0));
    setCarbs(String(item.carbs_g || 0));
    setFat(String(item.fat_g || 0));
    setHydration(item.hydration_l ? String(item.hydration_l) : "");
    setFormOpen(true);
  };

  const saveMutation = useMutation({
    mutationFn: async () => {
      const payload = {
        title,
        content,
        energy_kcal: parseFloat(kcal) || 0,
        protein_g: parseFloat(protein) || 0,
        carbs_g: parseFloat(carbs) || 0,
        fat_g: parseFloat(fat) || 0,
        hydration_l: parseFloat(hydration) || 0,
        created_by: user!.id,
      };
      if (editingId) {
        await (supabase.from("diet_library" as any) as any).update(payload).eq("id", editingId);
      } else {
        await (supabase.from("diet_library" as any) as any).insert(payload);
      }
    },
    onSuccess: () => {
      toast.success(editingId ? "Dieta atualizada!" : "Dieta adicionada à biblioteca!");
      qc.invalidateQueries({ queryKey: ["diet-library"] });
      setFormOpen(false);
      resetForm();
    },
    onError: () => toast.error("Erro ao salvar"),
  });

  const deleteMutation = useMutation({
    mutationFn: async () => {
      if (deleteId) await (supabase.from("diet_library" as any) as any).delete().eq("id", deleteId);
    },
    onSuccess: () => {
      toast.success("Dieta removida da biblioteca!");
      qc.invalidateQueries({ queryKey: ["diet-library"] });
      setDeleteId(null);
    },
  });

  const filtered = items?.filter((i: any) => {
    if (!search.trim()) return true;
    return i.title?.toLowerCase().includes(search.toLowerCase()) || i.content?.toLowerCase().includes(search.toLowerCase());
  });

  return (
    <DashboardLayout role="admin" title="Biblioteca de Dietas" subtitle="Modelos reutilizáveis de dietas com macros.">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between flex-wrap gap-2">
            <CardTitle className="font-display flex items-center gap-2">
              <BookOpen className="w-5 h-5" /> Biblioteca
            </CardTitle>
            <Button onClick={openNew} size="sm">
              <Plus className="w-4 h-4 mr-1" /> Nova Dieta
            </Button>
          </div>
          <div className="relative mt-2">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input placeholder="Buscar dieta..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <p className="text-sm text-muted-foreground text-center py-6">Carregando...</p>
          ) : filtered && filtered.length > 0 ? (
            <div className="space-y-3">
              {filtered.map((item: any) => (
                <Card key={item.id} className="relative">
                  <CardContent className="pt-4 pb-3">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm font-body mb-1">{item.title}</p>
                        <div className="flex flex-wrap gap-2 mb-2">
                          <Badge variant="outline" className="text-[10px] gap-1">
                            <Flame className="w-2.5 h-2.5" /> {item.energy_kcal} kcal
                          </Badge>
                          <Badge variant="outline" className="text-[10px] gap-1">
                            <Beef className="w-2.5 h-2.5" /> {item.protein_g}g P
                          </Badge>
                          <Badge variant="outline" className="text-[10px] gap-1">
                            <Wheat className="w-2.5 h-2.5" /> {item.carbs_g}g C
                          </Badge>
                          <Badge variant="outline" className="text-[10px] gap-1">
                            <Droplets className="w-2.5 h-2.5" /> {item.fat_g}g G
                          </Badge>
                        </div>
                        {previewId === item.id && item.content && (
                          <div className="mt-2 p-3 rounded-md bg-muted/50 border border-border whitespace-pre-wrap text-xs font-body leading-relaxed">
                            {item.content}
                          </div>
                        )}
                        {item.content && (
                          <button
                            className="text-[10px] text-primary hover:underline"
                            onClick={() => setPreviewId(previewId === item.id ? null : item.id)}
                          >
                            {previewId === item.id ? "Ocultar conteúdo" : "Ver conteúdo"}
                          </button>
                        )}
                      </div>
                      <div className="flex gap-1 shrink-0">
                        <Button variant="ghost" size="icon" onClick={() => openEdit(item)} title="Editar">
                          <Pencil className="w-4 h-4" />
                        </Button>
                        <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive hover:bg-destructive/10" onClick={() => setDeleteId(item.id)} title="Excluir">
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground text-center py-6">Nenhuma dieta na biblioteca ainda.</p>
          )}
        </CardContent>
      </Card>

      {/* Form Dialog */}
      <Dialog open={formOpen} onOpenChange={(o) => { setFormOpen(o); if (!o) resetForm(); }}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-hidden flex flex-col">
          <DialogHeader>
            <DialogTitle className="font-display">{editingId ? "Editar Dieta" : "Nova Dieta na Biblioteca"}</DialogTitle>
          </DialogHeader>
          <ScrollArea className="flex-1 pr-4">
            <div className="space-y-3 pb-2">
              <div>
                <Label className="font-body">Título</Label>
                <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Ex: Dieta Cutting 1800kcal" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label className="font-body text-xs flex items-center gap-1"><Flame className="w-3 h-3" /> Kcal</Label>
                  <Input type="number" value={kcal} onChange={(e) => setKcal(e.target.value)} placeholder="0" />
                </div>
                <div>
                  <Label className="font-body text-xs flex items-center gap-1"><Beef className="w-3 h-3" /> Proteína (g)</Label>
                  <Input type="number" value={protein} onChange={(e) => setProtein(e.target.value)} placeholder="0" />
                </div>
                <div>
                  <Label className="font-body text-xs flex items-center gap-1"><Wheat className="w-3 h-3" /> Carboidratos (g)</Label>
                  <Input type="number" value={carbs} onChange={(e) => setCarbs(e.target.value)} placeholder="0" />
                </div>
                <div>
                   <Label className="font-body text-xs flex items-center gap-1"><Droplets className="w-3 h-3" /> Gorduras (g)</Label>
                   <Input type="number" value={fat} onChange={(e) => setFat(e.target.value)} placeholder="0" />
                 </div>
               </div>
               <div>
                 <Label className="font-body text-xs flex items-center gap-1"><Droplets className="w-3 h-3" /> Hidratação (L)</Label>
                 <Input type="number" step="0.1" value={hydration} onChange={(e) => setHydration(e.target.value)} placeholder="0" />
               </div>
              <div>
                <Label className="font-body">Conteúdo da Dieta</Label>
                <Textarea value={content} onChange={(e) => setContent(e.target.value)} rows={10} placeholder="Escreva o plano alimentar completo aqui..." />
              </div>
              <div className="flex gap-2 justify-end">
                <Button variant="ghost" size="sm" onClick={() => { setFormOpen(false); resetForm(); }}>Cancelar</Button>
                <Button size="sm" onClick={() => saveMutation.mutate()} disabled={saveMutation.isPending || !title.trim()}>
                  {saveMutation.isPending ? "Salvando..." : editingId ? "Salvar Alterações" : "Adicionar"}
                </Button>
              </div>
            </div>
          </ScrollArea>
        </DialogContent>
      </Dialog>

      {/* Delete Confirm */}
      <AlertDialog open={!!deleteId} onOpenChange={(o) => { if (!o) setDeleteId(null); }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar exclusão</AlertDialogTitle>
            <AlertDialogDescription>Tem certeza que deseja excluir esta dieta da biblioteca?</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={() => deleteMutation.mutate()} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">Excluir</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </DashboardLayout>
  );
};

export default AdminDietLibrary;
