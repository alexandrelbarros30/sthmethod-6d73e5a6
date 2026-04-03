import { useState } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Pencil, Trash2, Search, Plus, BookOpen, Eye, FlaskConical } from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";
import { useIsMobile } from "@/hooks/use-mobile";
import RichTextEditor from "@/components/shared/RichTextEditor";
import RichContentRenderer from "@/components/shared/RichContentRenderer";
import { ScrollArea } from "@/components/ui/scroll-area";

const AdminProtocolLibrary = () => {
  const qc = useQueryClient();
  const { user } = useAuth();
  const isMobile = useIsMobile();
  const [search, setSearch] = useState("");
  const [formOpen, setFormOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [itemsJson, setItemsJson] = useState<any[]>([]);
  const [previewItem, setPreviewItem] = useState<any>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  // New item form fields
  const [newItemName, setNewItemName] = useState("");
  const [newItemDosage, setNewItemDosage] = useState("");
  const [newItemFrequency, setNewItemFrequency] = useState("");
  const [newItemCategory, setNewItemCategory] = useState("Suporte Endócrino");

  const categories = ["Suporte Endócrino", "Cardiovascular / Hepático / Renal", "Metabólico"];

  const { data: items = [], isLoading } = useQuery({
    queryKey: ["protocol-library"],
    queryFn: async () => {
      const { data } = await supabase
        .from("protocol_library" as any)
        .select("*")
        .order("created_at", { ascending: false });
      return (data || []) as any[];
    },
  });

  const resetForm = () => {
    setTitle("");
    setContent("");
    setItemsJson([]);
    setEditingId(null);
  };

  const openNew = () => { resetForm(); setFormOpen(true); };

  const openEdit = (item: any) => {
    setEditingId(item.id);
    setTitle(item.title);
    setContent(item.content || "");
    setItemsJson(item.items_json || []);
    setFormOpen(true);
  };

  const addItem = () => {
    if (!newItemName.trim()) return;
    setItemsJson(prev => [...prev, {
      name: newItemName.trim(),
      dosage: newItemDosage.trim(),
      frequency: newItemFrequency.trim(),
      category: newItemCategory,
    }]);
    setNewItemName("");
    setNewItemDosage("");
    setNewItemFrequency("");
  };

  const removeItem = (index: number) => {
    setItemsJson(prev => prev.filter((_, i) => i !== index));
  };

  const saveMutation = useMutation({
    mutationFn: async () => {
      const payload = {
        title,
        content,
        items_json: itemsJson,
        created_by: user!.id,
      };
      if (editingId) {
        await supabase.from("protocol_library" as any).update(payload as any).eq("id", editingId);
      } else {
        await supabase.from("protocol_library" as any).insert(payload as any);
      }
    },
    onSuccess: () => {
      toast.success(editingId ? "Modelo atualizado!" : "Modelo criado!");
      qc.invalidateQueries({ queryKey: ["protocol-library"] });
      setFormOpen(false);
      resetForm();
    },
    onError: () => toast.error("Erro ao salvar"),
  });

  const deleteMutation = useMutation({
    mutationFn: async () => {
      if (deleteId) await supabase.from("protocol_library" as any).delete().eq("id", deleteId);
    },
    onSuccess: () => {
      toast.success("Modelo removido!");
      qc.invalidateQueries({ queryKey: ["protocol-library"] });
      setDeleteId(null);
    },
  });

  const filtered = items.filter((i: any) => {
    if (!search.trim()) return true;
    return i.title?.toLowerCase().includes(search.toLowerCase());
  });

  return (
    <DashboardLayout role="admin" title="Biblioteca de Protocolos" subtitle="Modelos reutilizáveis de protocolos para aplicar em alunos.">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between flex-wrap gap-2">
            <CardTitle className="font-display flex items-center gap-2">
              <BookOpen className="w-5 h-5" /> Modelos ({items.length})
            </CardTitle>
            <Button size="sm" onClick={openNew}>
              <Plus className="w-4 h-4 mr-1" /> Novo Modelo
            </Button>
          </div>
          <div className="relative mt-2">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input placeholder="Buscar modelo..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <p className="text-sm text-muted-foreground text-center py-8">Carregando...</p>
          ) : filtered.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-8">Nenhum modelo encontrado.</p>
          ) : isMobile ? (
            <div className="space-y-2">
              {filtered.map((item: any) => (
                <div key={item.id} className="rounded-lg border border-border bg-card p-3 space-y-2">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <p className="font-medium text-sm font-display">{item.title}</p>
                      <p className="text-xs text-muted-foreground">
                        {(item.items_json || []).length} itens • {new Date(item.created_at).toLocaleDateString("pt-BR")}
                      </p>
                    </div>
                  </div>
                  <div className="flex gap-1.5">
                    <Button variant="ghost" size="sm" className="h-7 text-xs" onClick={() => setPreviewItem(item)}>
                      <Eye className="w-3 h-3 mr-1" /> Ver
                    </Button>
                    <Button variant="ghost" size="sm" className="h-7 text-xs" onClick={() => openEdit(item)}>
                      <Pencil className="w-3 h-3 mr-1" /> Editar
                    </Button>
                    <Button variant="ghost" size="sm" className="h-7 text-xs text-destructive" onClick={() => setDeleteId(item.id)}>
                      <Trash2 className="w-3 h-3 mr-1" /> Excluir
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Título</TableHead>
                  <TableHead>Itens</TableHead>
                  <TableHead>Criado em</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((item: any) => (
                  <TableRow key={item.id}>
                    <TableCell className="font-medium font-display">{item.title}</TableCell>
                    <TableCell>
                      <Badge variant="secondary" className="text-xs">{(item.items_json || []).length} itens</Badge>
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground">
                      {new Date(item.created_at).toLocaleDateString("pt-BR")}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex gap-1 justify-end">
                        <Button variant="ghost" size="sm" onClick={() => setPreviewItem(item)}>
                          <Eye className="w-3 h-3" />
                        </Button>
                        <Button variant="ghost" size="sm" onClick={() => openEdit(item)}>
                          <Pencil className="w-3 h-3" />
                        </Button>
                        <Button variant="ghost" size="sm" className="text-destructive" onClick={() => setDeleteId(item.id)}>
                          <Trash2 className="w-3 h-3" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Form Dialog */}
      <Dialog open={formOpen} onOpenChange={(o) => { setFormOpen(o); if (!o) resetForm(); }}>
        <DialogContent className={isMobile
          ? "!inset-0 !left-0 !top-0 !translate-x-0 !translate-y-0 !w-screen !max-w-none !h-[100dvh] !max-h-none rounded-none border-0 p-3 !flex !flex-col overflow-hidden"
          : "max-w-2xl max-h-[90dvh] overflow-hidden !flex !flex-col"
        }>
          <DialogHeader>
            <DialogTitle className="font-display">{editingId ? "Editar Modelo" : "Novo Modelo de Protocolo"}</DialogTitle>
          </DialogHeader>
          <ScrollArea className="flex-1 min-h-0 pr-2">
            <div className="space-y-4 pb-4">
              <div>
                <Label className="font-body">Título *</Label>
                <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Ex: Protocolo TRT Básico" />
              </div>

              {/* Protocol Items */}
              <div className="space-y-2">
                <Label className="font-body flex items-center gap-1.5">
                  <FlaskConical className="w-3.5 h-3.5" /> Itens do Protocolo
                </Label>
                {itemsJson.length > 0 && (
                  <div className="space-y-1.5">
                    {itemsJson.map((item: any, idx: number) => (
                      <div key={idx} className="flex items-center gap-2 p-2 rounded-lg bg-muted/50 border border-border text-xs">
                        <div className="flex-1 min-w-0">
                          <span className="font-semibold">{item.name}</span>
                          {item.dosage && <span className="text-muted-foreground"> • {item.dosage}</span>}
                          {item.frequency && <span className="text-muted-foreground"> • {item.frequency}</span>}
                          <Badge variant="outline" className="ml-1.5 text-[9px]">{item.category}</Badge>
                        </div>
                        <Button variant="ghost" size="icon" className="h-6 w-6 shrink-0" onClick={() => removeItem(idx)}>
                          <Trash2 className="w-3 h-3 text-destructive" />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
                {/* Add item inline form */}
                <div className="rounded-lg border border-dashed border-border p-3 space-y-2 bg-muted/30">
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                    <Input placeholder="Nome *" value={newItemName} onChange={(e) => setNewItemName(e.target.value)} className="text-xs h-8" />
                    <Input placeholder="Dosagem" value={newItemDosage} onChange={(e) => setNewItemDosage(e.target.value)} className="text-xs h-8" />
                    <Input placeholder="Frequência" value={newItemFrequency} onChange={(e) => setNewItemFrequency(e.target.value)} className="text-xs h-8" />
                  </div>
                  <div className="flex items-center gap-2">
                    <select
                      value={newItemCategory}
                      onChange={(e) => setNewItemCategory(e.target.value)}
                      className="text-xs h-8 rounded-md border border-input bg-background px-2 flex-1"
                    >
                      {categories.map(c => <option key={c} value={c}>{c}</option>)}
                    </select>
                    <Button size="sm" variant="outline" className="h-8 text-xs" onClick={addItem} disabled={!newItemName.trim()}>
                      <Plus className="w-3 h-3 mr-1" /> Adicionar
                    </Button>
                  </div>
                </div>
              </div>

              {/* Content */}
              <div>
                <Label className="font-body">Orientações / Conteúdo</Label>
                <RichTextEditor value={content} onChange={setContent} placeholder="Orientações gerais do protocolo..." />
              </div>
            </div>
          </ScrollArea>
          <div className="flex gap-2 justify-end pt-3 border-t">
            <Button variant="ghost" onClick={() => { setFormOpen(false); resetForm(); }}>Cancelar</Button>
            <Button onClick={() => saveMutation.mutate()} disabled={saveMutation.isPending || !title.trim()}>
              {saveMutation.isPending ? "Salvando..." : "Salvar"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Preview Dialog */}
      <Dialog open={!!previewItem} onOpenChange={() => setPreviewItem(null)}>
        <DialogContent className="max-w-lg max-h-[80dvh] overflow-hidden !flex !flex-col">
          <DialogHeader>
            <DialogTitle className="font-display">{previewItem?.title}</DialogTitle>
          </DialogHeader>
          <ScrollArea className="flex-1 min-h-0">
            <div className="space-y-4 pb-4">
              {(previewItem?.items_json || []).length > 0 && (
                <div className="space-y-1.5">
                  <p className="text-xs font-semibold text-muted-foreground">Itens do Protocolo:</p>
                  {categories.map(cat => {
                    const catItems = (previewItem?.items_json || []).filter((i: any) => i.category === cat);
                    if (catItems.length === 0) return null;
                    return (
                      <div key={cat} className="space-y-1">
                        <p className="text-xs font-semibold text-primary">{cat}</p>
                        {catItems.map((item: any, idx: number) => (
                          <div key={idx} className="text-xs p-1.5 rounded bg-muted/50">
                            <span className="font-medium">{item.name}</span>
                            {item.dosage && <span> — {item.dosage}</span>}
                            {item.frequency && <span className="text-muted-foreground"> ({item.frequency})</span>}
                          </div>
                        ))}
                      </div>
                    );
                  })}
                </div>
              )}
              {previewItem?.content && <RichContentRenderer content={previewItem.content} />}
            </div>
          </ScrollArea>
        </DialogContent>
      </Dialog>

      {/* Delete Confirm */}
      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir modelo</AlertDialogTitle>
            <AlertDialogDescription>Tem certeza? Esta ação não pode ser desfeita.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={() => deleteMutation.mutate()} className="bg-destructive text-destructive-foreground">Excluir</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </DashboardLayout>
  );
};

export default AdminProtocolLibrary;
