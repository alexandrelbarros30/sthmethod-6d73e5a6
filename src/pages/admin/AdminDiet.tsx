import { useState, useEffect } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import DashboardLayout from "@/components/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import RichTextEditor from "@/components/shared/RichTextEditor";
import RichContentRenderer from "@/components/shared/RichContentRenderer";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Pencil, Trash2, FileText, Search, Plus, Clock, Eye, EyeOff, ToggleLeft, ToggleRight, CalendarClock, BookOpen, Save } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useAuth } from "@/contexts/AuthContext";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const AdminDiet = () => {
  const { user } = useAuth();
  const qc = useQueryClient();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [returnToEdit, setReturnToEdit] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selected, setSelected] = useState<any>(null);

  // New entry form
  const [newTitle, setNewTitle] = useState("Dieta");
  const [newContent, setNewContent] = useState("");
  const [newPdfFile, setNewPdfFile] = useState<File | null>(null);
  const [newReleaseDate, setNewReleaseDate] = useState("");
  const [showNewForm, setShowNewForm] = useState(false);

  // Edit state
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState("");
  const [editContent, setEditContent] = useState("");
  const [editDate, setEditDate] = useState("");
  const [editTime, setEditTime] = useState("");
  const [editReleaseDate, setEditReleaseDate] = useState("");

  // Preview
  const [previewDiet, setPreviewDiet] = useState<any>(null);

  // Delete
  const [confirmDeleteOpen, setConfirmDeleteOpen] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  // Library
  const { data: libraryItems } = useQuery({
    queryKey: ["diet-library"],
    queryFn: async () => {
      const { data } = await supabase.from("diet_library" as any).select("*").order("title");
      return (data || []) as any[];
    },
  });

  const saveToLibraryMutation = useMutation({
    mutationFn: async (diet: any) => {
      await (supabase.from("diet_library" as any) as any).insert({
        title: diet.title,
        content: diet.content || "",
        created_by: user!.id,
      });
    },
    onSuccess: () => {
      toast.success("Dieta salva na biblioteca!");
      qc.invalidateQueries({ queryKey: ["diet-library"] });
    },
    onError: () => toast.error("Erro ao salvar na biblioteca"),
  });

  const applyFromLibrary = (libId: string) => {
    const item = libraryItems?.find((l: any) => l.id === libId);
    if (item) {
      setNewTitle(item.title);
      setNewContent(item.content || "");
      toast.success("Dieta carregada da biblioteca!");
    }
  };

  const { data: students } = useQuery({
    queryKey: ["admin-students-diets"],
    queryFn: async () => {
      const { data: profiles } = await supabase.from("profiles").select("user_id, full_name, email");
      const { data: diets } = await supabase.from("student_diets").select("*").order("created_at", { ascending: false });
      return (profiles || []).map((p: any) => {
        const studentDiets = (diets as any[])?.filter((d: any) => d.user_id === p.user_id) || [];
        return {
          ...p,
          diets: studentDiets,
          dietCount: studentDiets.length,
          initials: p.full_name?.split(" ").map((n: string) => n[0]).join("").slice(0, 2).toUpperCase() || "?",
        };
      });
    },
  });

  const { data: studentDiets, refetch: refetchDiets } = useQuery({
    queryKey: ["admin-student-diets-detail", selected?.user_id],
    queryFn: async () => {
      const { data } = await supabase
        .from("student_diets")
        .select("*")
        .eq("user_id", selected!.user_id)
        .order("created_at", { ascending: false });
      return data || [];
    },
    enabled: !!selected?.user_id && dialogOpen,
  });

  // Auto-select student from URL param
  useEffect(() => {
    const uid = searchParams.get("uid");
    if (uid && students?.length && !selected) {
      const found = students.find((s: any) => s.user_id === uid);
      if (found) {
        const shouldReturn = searchParams.get("return") === "edit";
        if (shouldReturn) setReturnToEdit(uid);
        setSelected(found);
        setShowNewForm(false);
        setEditingId(null);
        setPreviewDiet(null);
        setNewTitle("Dieta");
        setNewContent("");
        setNewPdfFile(null);
        setDialogOpen(true);
        searchParams.delete("uid");
        searchParams.delete("return");
        setSearchParams(searchParams, { replace: true });
      }
    }
  }, [students, searchParams]);

  const openManage = (student: any) => {
    setSelected(student);
    setShowNewForm(false);
    setEditingId(null);
    setPreviewDiet(null);
    resetNewForm();
    setDialogOpen(true);
  };

  const resetNewForm = () => {
    setNewTitle("Dieta");
    setNewContent("");
    setNewPdfFile(null);
    setNewReleaseDate("");
  };

  const startEdit = (diet: any) => {
    const d = new Date(diet.created_at);
    setEditingId(diet.id);
    setEditTitle(diet.title || "");
    setEditContent(diet.content || "");
    setEditDate(d.toISOString().slice(0, 10));
    setEditTime(d.toTimeString().slice(0, 5));
    setEditReleaseDate(diet.release_date ? new Date(diet.release_date).toISOString().slice(0, 10) : "");
    setPreviewDiet(null);
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditTitle("");
    setEditContent("");
    setEditDate("");
    setEditTime("");
  };

  const saveMutation = useMutation({
    mutationFn: async () => {
      let pdfUrl = "";
      if (newPdfFile) {
        const path = `${selected.user_id}/diet/${Date.now()}_${newPdfFile.name}`;
        await supabase.storage.from("documents").upload(path, newPdfFile, { upsert: true });
        const { data } = supabase.storage.from("documents").getPublicUrl(path);
        pdfUrl = data.publicUrl;
      }
      const payload: any = {
        user_id: selected.user_id,
        title: newTitle,
        content: newContent,
        pdf_url: pdfUrl,
        release_date: newReleaseDate ? new Date(newReleaseDate + "T00:00:00").toISOString() : null,
      };
      await supabase.from("student_diets").insert(payload);
    },
    onSuccess: () => {
      toast.success("Dieta adicionada!");
      qc.invalidateQueries({ queryKey: ["admin-students-diets"] });
      refetchDiets();
      setShowNewForm(false);
      resetNewForm();
    },
    onError: () => toast.error("Erro ao salvar dieta"),
  });

  const editMutation = useMutation({
    mutationFn: async () => {
      const newCreatedAt = new Date(`${editDate}T${editTime}:00`).toISOString();
      await supabase
        .from("student_diets")
        .update({
          title: editTitle,
          content: editContent,
          created_at: newCreatedAt,
          release_date: editReleaseDate ? new Date(editReleaseDate + "T00:00:00").toISOString() : null,
        } as any)
        .eq("id", editingId!);
    },
    onSuccess: () => {
      toast.success("Dieta atualizada!");
      qc.invalidateQueries({ queryKey: ["admin-students-diets"] });
      refetchDiets();
      cancelEdit();
    },
    onError: () => toast.error("Erro ao atualizar dieta"),
  });

  const deleteMutation = useMutation({
    mutationFn: async () => {
      if (deletingId) await supabase.from("student_diets").delete().eq("id", deletingId);
    },
    onSuccess: () => {
      toast.success("Dieta removida!");
      qc.invalidateQueries({ queryKey: ["admin-students-diets"] });
      refetchDiets();
      setConfirmDeleteOpen(false);
      setDeletingId(null);
    },
  });

  const confirmDelete = (id: string) => {
    setDeletingId(id);
    setConfirmDeleteOpen(true);
  };

  const toggleVisibility = useMutation({
    mutationFn: async ({ id, visible }: { id: string; visible: boolean }) => {
      await supabase.from("student_diets").update({ visible }).eq("id", id);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin-students-diets"] });
      refetchDiets();
    },
    onError: () => toast.error("Erro ao alterar visibilidade"),
  });

  return (
    <DashboardLayout role="admin" title="Gestão de Dietas" subtitle="Gerencie as dietas dos alunos com histórico completo.">
      <Card>
        <CardHeader>
          <CardTitle className="font-display">Alunos</CardTitle>
          <div className="relative mt-2">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input placeholder="Buscar por nome ou e-mail..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="font-body">Aluno</TableHead>
                <TableHead className="font-body">Dietas</TableHead>
                <TableHead className="font-body text-right">Ação</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {students?.filter((s: any) => {
                if (!search.trim()) return true;
                const q = search.toLowerCase();
                return s.full_name?.toLowerCase().includes(q) || s.email?.toLowerCase().includes(q);
              }).map((s: any) => (
                <TableRow key={s.user_id}>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                        <span className="text-xs font-bold text-primary">{s.initials}</span>
                      </div>
                      <p className="font-medium text-sm font-body">{s.full_name || "Sem nome"}</p>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant={s.dietCount > 0 ? "secondary" : "outline"} className="text-xs">
                      {s.dietCount > 0 ? `${s.dietCount} registro(s)` : "Nenhuma"}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <Button variant="ghost" size="sm" onClick={() => openManage(s)}>
                      <Pencil className="w-3 h-3 mr-1" /> Gerenciar
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Diet Management Dialog */}
      <Dialog open={dialogOpen} onOpenChange={(o) => {
        setDialogOpen(o);
        if (!o && returnToEdit) {
          navigate(`/admin/students?edit=${returnToEdit}`);
          setReturnToEdit(null);
        }
      }}>
        <DialogContent className="max-w-2xl w-[95vw] max-h-[90vh] overflow-hidden flex flex-col p-3 sm:p-6">
          <DialogHeader>
            <DialogTitle className="font-display">Dietas — {selected?.full_name}</DialogTitle>
          </DialogHeader>

          <ScrollArea className="flex-1 pr-2 sm:pr-4">
            <div className="space-y-4">
              {/* Add new diet button */}
              {!showNewForm && !editingId && (
                <Button onClick={() => setShowNewForm(true)} className="w-full" variant="outline">
                  <Plus className="w-4 h-4 mr-2" /> Adicionar Nova Dieta
                </Button>
              )}

              {/* New diet form */}
              {showNewForm && (
                <Card className="border-primary/30 bg-primary/5">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-display flex items-center gap-2">
                      <Plus className="w-4 h-4" /> Nova Dieta
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {/* Use from library */}
                    {libraryItems && libraryItems.length > 0 && (
                      <div>
                        <Label className="font-body flex items-center gap-1"><BookOpen className="w-3.5 h-3.5" /> Usar da Biblioteca</Label>
                        <Select onValueChange={applyFromLibrary}>
                          <SelectTrigger><SelectValue placeholder="Selecionar modelo..." /></SelectTrigger>
                          <SelectContent>
                            {libraryItems.map((lib: any) => (
                              <SelectItem key={lib.id} value={lib.id}>
                                {lib.title} {lib.energy_kcal ? `(${lib.energy_kcal} kcal)` : ""}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    )}
                    <div>
                      <Label className="font-body">Título</Label>
                      <Input value={newTitle} onChange={(e) => setNewTitle(e.target.value)} />
                    </div>
                    <div>
                      <Label className="font-body">Upload PDF</Label>
                      <Input type="file" accept=".pdf" onChange={(e) => setNewPdfFile(e.target.files?.[0] || null)} />
                    </div>
                    <div>
                      <Label className="font-body flex items-center gap-1"><CalendarClock className="w-3.5 h-3.5" /> Data de liberação (opcional)</Label>
                      <Input type="date" value={newReleaseDate} onChange={(e) => setNewReleaseDate(e.target.value)} />
                      <p className="text-[10px] text-muted-foreground mt-1">Se preenchida, o aluno só verá a dieta a partir desta data.</p>
                    </div>
                     <div>
                      <Label className="font-body">Conteúdo</Label>
                      <RichTextEditor value={newContent} onChange={setNewContent} placeholder="Escreva o conteúdo da dieta aqui..." />
                    </div>
                    <div className="flex gap-2 justify-end">
                      <Button variant="ghost" size="sm" onClick={() => { setShowNewForm(false); resetNewForm(); }}>
                        Cancelar
                      </Button>
                      <Button size="sm" onClick={() => saveMutation.mutate()} disabled={saveMutation.isPending}>
                        {saveMutation.isPending ? "Salvando..." : "Salvar"}
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Diet History */}
              {studentDiets && studentDiets.length > 0 ? (
                <div className="space-y-3">
                  <h3 className="text-sm font-semibold text-muted-foreground font-display flex items-center gap-2">
                    <Clock className="w-4 h-4" /> Histórico de Dietas
                  </h3>
                  {studentDiets.map((diet: any) => (
                    <Card key={diet.id} className="relative">
                      <CardContent className="pt-4 pb-3">
                        {editingId === diet.id ? (
                          /* Edit mode */
                          <div className="space-y-3">
                            <div>
                              <Label className="font-body text-xs">Título</Label>
                              <Input value={editTitle} onChange={(e) => setEditTitle(e.target.value)} />
                            </div>
                            <div className="grid grid-cols-2 gap-3">
                              <div>
                                <Label className="font-body text-xs">Data</Label>
                                <Input type="date" value={editDate} onChange={(e) => setEditDate(e.target.value)} />
                            </div>
                            <div>
                              <Label className="font-body text-xs flex items-center gap-1"><CalendarClock className="w-3 h-3" /> Data de liberação</Label>
                              <Input type="date" value={editReleaseDate} onChange={(e) => setEditReleaseDate(e.target.value)} />
                              <p className="text-[10px] text-muted-foreground mt-1">Deixe vazio para liberar imediatamente.</p>
                            </div>
                              <div>
                                <Label className="font-body text-xs">Horário</Label>
                                <Input type="time" value={editTime} onChange={(e) => setEditTime(e.target.value)} />
                              </div>
                            </div>
                            <div>
                              <Label className="font-body text-xs">Conteúdo</Label>
                              <RichTextEditor value={editContent} onChange={setEditContent} />
                            </div>
                            <div className="flex gap-2 justify-end">
                              <Button variant="ghost" size="sm" onClick={cancelEdit}>Cancelar</Button>
                              <Button size="sm" onClick={() => editMutation.mutate()} disabled={editMutation.isPending}>
                                {editMutation.isPending ? "Salvando..." : "Salvar Alterações"}
                              </Button>
                            </div>
                          </div>
                        ) : (
                          /* View mode */
                          <div className="flex items-start justify-between gap-2">
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 mb-1 flex-wrap">
                                <p className="font-medium text-sm font-body">{diet.title}</p>
                                <Badge variant="outline" className="text-[10px] shrink-0">
                                  {new Date(diet.created_at).toLocaleDateString("pt-BR")} às {new Date(diet.created_at).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}
                                </Badge>
                                {!diet.visible && (
                                  <Badge variant="secondary" className="text-[10px] bg-destructive/10 text-destructive">
                                    Oculta
                                  </Badge>
                                )}
                                {diet.release_date && new Date(diet.release_date) > new Date() && (
                                  <Badge variant="secondary" className="text-[10px] bg-amber-500/10 text-amber-600">
                                    <CalendarClock className="w-2.5 h-2.5 mr-0.5" />
                                    Libera em {new Date(diet.release_date).toLocaleDateString("pt-BR")}
                                  </Badge>
                                )}
                                {diet.release_date && new Date(diet.release_date) <= new Date() && (
                                  <Badge variant="secondary" className="text-[10px] bg-green-500/10 text-green-600">
                                    Liberada
                                  </Badge>
                                )}
                              </div>
                              {diet.pdf_url && (
                                <a href={diet.pdf_url} target="_blank" rel="noopener noreferrer" className="text-xs text-primary hover:underline flex items-center gap-1 mb-1">
                                  <FileText className="w-3 h-3" /> Ver PDF
                                </a>
                              )}
                              {diet.content && (
                                <div className="text-xs text-muted-foreground line-clamp-3">
                                  <RichContentRenderer content={diet.content} />
                                </div>
                              )}

                              {/* Preview toggle */}
                              {previewDiet === diet.id && diet.content && (
                                <div className="mt-3 p-3 rounded-md bg-muted/50 border border-border">
                                  <p className="text-xs font-semibold text-foreground mb-1">Visualização completa:</p>
                                  <RichContentRenderer content={diet.content} />
                                </div>
                              )}
                              {previewDiet === diet.id && diet.pdf_url && (
                                <div className="mt-3">
                                  <iframe src={diet.pdf_url} className="w-full h-[400px] rounded-lg border border-border" title="Dieta PDF" />
                                </div>
                              )}
                            </div>
                            <div className="flex flex-col gap-1 shrink-0 items-center">
                              <div className="flex items-center gap-1" title={diet.visible ? "Visível para o aluno" : "Oculta para o aluno"}>
                                <Switch
                                  checked={diet.visible !== false}
                                  onCheckedChange={(checked) => toggleVisibility.mutate({ id: diet.id, visible: checked })}
                                  className="scale-75"
                                />
                              </div>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="text-muted-foreground hover:text-primary"
                                onClick={() => setPreviewDiet(previewDiet === diet.id ? null : diet.id)}
                                title="Visualizar"
                              >
                                {previewDiet === diet.id ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="text-muted-foreground hover:text-primary"
                                onClick={() => startEdit(diet)}
                                title="Editar"
                              >
                                <Pencil className="w-4 h-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="text-muted-foreground hover:text-primary"
                                onClick={() => saveToLibraryMutation.mutate(diet)}
                                title="Salvar na Biblioteca"
                              >
                                <Save className="w-4 h-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="text-destructive hover:text-destructive hover:bg-destructive/10"
                                onClick={() => confirmDelete(diet.id)}
                                title="Excluir"
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </div>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground text-center py-6">Nenhuma dieta cadastrada ainda.</p>
              )}
            </div>
          </ScrollArea>
        </DialogContent>
      </Dialog>

      {/* Confirm Delete */}
      <AlertDialog open={confirmDeleteOpen} onOpenChange={setConfirmDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar exclusão</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir esta dieta? Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={() => deleteMutation.mutate()} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </DashboardLayout>
  );
};

export default AdminDiet;
