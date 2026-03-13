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
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Pencil, Trash2, FileText, Search, Plus, Clock, Eye, EyeOff } from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { ScrollArea } from "@/components/ui/scroll-area";

const AdminProtocol = () => {
  const qc = useQueryClient();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [returnToEdit, setReturnToEdit] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selected, setSelected] = useState<any>(null);

  // New entry form
  const [newTitle, setNewTitle] = useState("Protocolo");
  const [newContent, setNewContent] = useState("");
  const [newPdfFile, setNewPdfFile] = useState<File | null>(null);
  const [showNewForm, setShowNewForm] = useState(false);

  // Edit state
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState("");
  const [editContent, setEditContent] = useState("");
  const [editDate, setEditDate] = useState("");
  const [editTime, setEditTime] = useState("");

  // Preview
  const [previewProtocol, setPreviewProtocol] = useState<any>(null);

  // Delete
  const [confirmDeleteOpen, setConfirmDeleteOpen] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const { data: students } = useQuery({
    queryKey: ["admin-students-protocols"],
    queryFn: async () => {
      const { data: profiles } = await supabase.from("profiles").select("user_id, full_name, email");
      const { data: protocols } = await supabase.from("student_protocols").select("*").order("created_at", { ascending: false });
      return (profiles || []).map((p: any) => {
        const studentProtocols = (protocols as any[])?.filter((d: any) => d.user_id === p.user_id) || [];
        return {
          ...p,
          protocols: studentProtocols,
          protocolCount: studentProtocols.length,
          initials: p.full_name?.split(" ").map((n: string) => n[0]).join("").slice(0, 2).toUpperCase() || "?",
        };
      });
    },
  });

  const { data: studentProtocols, refetch: refetchProtocols } = useQuery({
    queryKey: ["admin-student-protocols-detail", selected?.user_id],
    queryFn: async () => {
      const { data } = await supabase
        .from("student_protocols")
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
        setPreviewProtocol(null);
        setNewTitle("Protocolo");
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
    setPreviewProtocol(null);
    resetNewForm();
    setDialogOpen(true);
  };

  const resetNewForm = () => {
    setNewTitle("Protocolo");
    setNewContent("");
    setNewPdfFile(null);
  };

  const startEdit = (protocol: any) => {
    const d = new Date(protocol.created_at);
    setEditingId(protocol.id);
    setEditTitle(protocol.title || "");
    setEditContent(protocol.content || "");
    setEditDate(d.toISOString().slice(0, 10));
    setEditTime(d.toTimeString().slice(0, 5));
    setPreviewProtocol(null);
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
        const path = `${selected.user_id}/protocol/${Date.now()}_${newPdfFile.name}`;
        await supabase.storage.from("documents").upload(path, newPdfFile, { upsert: true });
        const { data } = supabase.storage.from("documents").getPublicUrl(path);
        pdfUrl = data.publicUrl;
      }
      const payload = {
        user_id: selected.user_id,
        title: newTitle,
        content: newContent,
        pdf_url: pdfUrl,
      };
      await supabase.from("student_protocols").insert(payload);
    },
    onSuccess: () => {
      toast.success("Protocolo adicionado!");
      qc.invalidateQueries({ queryKey: ["admin-students-protocols"] });
      refetchProtocols();
      setShowNewForm(false);
      resetNewForm();
    },
    onError: () => toast.error("Erro ao salvar protocolo"),
  });

  const editMutation = useMutation({
    mutationFn: async () => {
      const newCreatedAt = new Date(`${editDate}T${editTime}:00`).toISOString();
      await supabase
        .from("student_protocols")
        .update({
          title: editTitle,
          content: editContent,
          created_at: newCreatedAt,
        })
        .eq("id", editingId!);
    },
    onSuccess: () => {
      toast.success("Protocolo atualizado!");
      qc.invalidateQueries({ queryKey: ["admin-students-protocols"] });
      refetchProtocols();
      cancelEdit();
    },
    onError: () => toast.error("Erro ao atualizar protocolo"),
  });

  const deleteMutation = useMutation({
    mutationFn: async () => {
      if (deletingId) await supabase.from("student_protocols").delete().eq("id", deletingId);
    },
    onSuccess: () => {
      toast.success("Protocolo removido!");
      qc.invalidateQueries({ queryKey: ["admin-students-protocols"] });
      refetchProtocols();
      setConfirmDeleteOpen(false);
      setDeletingId(null);
    },
  });

  const confirmDelete = (id: string) => {
    setDeletingId(id);
    setConfirmDeleteOpen(true);
  };

  return (
    <DashboardLayout role="admin" title="Gestão de Protocolos" subtitle="Gerencie os protocolos dos alunos com histórico completo.">
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
                <TableHead className="font-body">Protocolos</TableHead>
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
                    <Badge variant={s.protocolCount > 0 ? "secondary" : "outline"} className="text-xs">
                      {s.protocolCount > 0 ? `${s.protocolCount} registro(s)` : "Nenhum"}
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

      {/* Protocol Management Dialog */}
      <Dialog open={dialogOpen} onOpenChange={(o) => {
        setDialogOpen(o);
        if (!o && returnToEdit) {
          navigate(`/admin/students?edit=${returnToEdit}`);
          setReturnToEdit(null);
        }
      }}>
        <DialogContent className="w-[calc(100vw-0.75rem)] max-w-2xl max-h-[94dvh] overflow-hidden flex flex-col p-2 sm:p-6">
          <DialogHeader className="pr-8">
            <DialogTitle className="font-display text-base sm:text-lg">Protocolos — {selected?.full_name}</DialogTitle>
            <DialogDescription className="text-xs sm:text-sm">Edite com clareza no mobile e desktop.</DialogDescription>
          </DialogHeader>

          <ScrollArea className="flex-1 pr-1 sm:pr-4">
            <div className="space-y-4">
              {/* Add new protocol button */}
              {!showNewForm && !editingId && (
                <Button onClick={() => setShowNewForm(true)} className="w-full" variant="outline">
                  <Plus className="w-4 h-4 mr-2" /> Adicionar Novo Protocolo
                </Button>
              )}

              {/* New protocol form */}
              {showNewForm && (
                <Card className="border-primary/30 bg-primary/5">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-display flex items-center gap-2">
                      <Plus className="w-4 h-4" /> Novo Protocolo
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div>
                      <Label className="font-body">Título</Label>
                      <Input value={newTitle} onChange={(e) => setNewTitle(e.target.value)} />
                    </div>
                    <div>
                      <Label className="font-body">Upload PDF</Label>
                      <Input type="file" accept=".pdf" onChange={(e) => setNewPdfFile(e.target.files?.[0] || null)} />
                    </div>
                     <div>
                      <Label className="font-body">Conteúdo</Label>
                      <RichTextEditor value={newContent} onChange={setNewContent} placeholder="Escreva o conteúdo do protocolo aqui..." />
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

              {/* Protocol History */}
              {studentProtocols && studentProtocols.length > 0 ? (
                <div className="space-y-3">
                  <h3 className="text-sm font-semibold text-muted-foreground font-display flex items-center gap-2">
                    <Clock className="w-4 h-4" /> Histórico de Protocolos
                  </h3>
                  {studentProtocols.map((protocol: any) => (
                    <Card key={protocol.id} className="relative">
                      <CardContent className="pt-4 pb-3">
                        {editingId === protocol.id ? (
                          /* Edit mode */
                          <div className="space-y-3">
                            <div>
                              <Label className="font-body text-xs">Título</Label>
                              <Input value={editTitle} onChange={(e) => setEditTitle(e.target.value)} />
                            </div>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                              <div>
                                <Label className="font-body text-xs">Data</Label>
                                <Input type="date" value={editDate} onChange={(e) => setEditDate(e.target.value)} />
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
                            <div className="flex flex-col-reverse sm:flex-row gap-2 sm:justify-end">
                              <Button variant="ghost" size="sm" onClick={cancelEdit} className="w-full sm:w-auto">Cancelar</Button>
                              <Button size="sm" onClick={() => editMutation.mutate()} disabled={editMutation.isPending} className="w-full sm:w-auto">
                                {editMutation.isPending ? "Salvando..." : "Salvar Alterações"}
                              </Button>
                            </div>
                          </div>
                        ) : (
                          /* View mode */
                          <div className="flex items-start justify-between gap-2">
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 mb-1 flex-wrap">
                                <p className="font-medium text-sm font-body">{protocol.title}</p>
                                <Badge variant="outline" className="text-[10px] shrink-0">
                                  {new Date(protocol.created_at).toLocaleDateString("pt-BR")} às {new Date(protocol.created_at).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}
                                </Badge>
                              </div>
                              {protocol.pdf_url && (
                                <a href={protocol.pdf_url} target="_blank" rel="noopener noreferrer" className="text-xs text-primary hover:underline flex items-center gap-1 mb-1">
                                  <FileText className="w-3 h-3" /> Ver PDF
                                </a>
                              )}
                              {protocol.content && (
                                <div className="text-xs text-muted-foreground line-clamp-3">
                                  <RichContentRenderer content={protocol.content} />
                                </div>
                              )}

                              {/* Preview toggle */}
                              {previewProtocol === protocol.id && protocol.content && (
                                <div className="mt-3 p-3 rounded-md bg-muted/50 border border-border">
                                  <p className="text-xs font-semibold text-foreground mb-1">Visualização completa:</p>
                                  <RichContentRenderer content={protocol.content} />
                                </div>
                              )}
                              {previewProtocol === protocol.id && protocol.pdf_url && (
                                <div className="mt-3">
                                  <iframe src={protocol.pdf_url} className="w-full h-[400px] rounded-lg border border-border" title="Protocolo PDF" />
                                </div>
                              )}
                            </div>
                            <div className="flex flex-col gap-1 shrink-0">
                              <Button
                                variant="ghost"
                                size="icon"
                                className="text-muted-foreground hover:text-primary"
                                onClick={() => setPreviewProtocol(previewProtocol === protocol.id ? null : protocol.id)}
                                title="Visualizar"
                              >
                                {previewProtocol === protocol.id ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="text-muted-foreground hover:text-primary"
                                onClick={() => startEdit(protocol)}
                                title="Editar"
                              >
                                <Pencil className="w-4 h-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="text-destructive hover:text-destructive hover:bg-destructive/10"
                                onClick={() => confirmDelete(protocol.id)}
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
                <p className="text-sm text-muted-foreground text-center py-6">Nenhum protocolo cadastrado ainda.</p>
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
              Tem certeza que deseja excluir este protocolo? Esta ação não pode ser desfeita.
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

export default AdminProtocol;
