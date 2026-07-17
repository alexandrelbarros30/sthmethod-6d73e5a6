import { useRef, useState } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Plus, Pencil, Trash2, Video, Search, Dumbbell, ImageIcon, Upload, X } from "lucide-react";
import { toast } from "sonner";
import ExerciseMediaPreview from "@/components/admin/ExerciseMediaPreview";

const MUSCLE_GROUPS = [
  "Peito", "Costas", "Ombros", "Bíceps", "Tríceps", "Quadríceps",
  "Posterior", "Glúteos", "Panturrilha", "Abdômen", "Cardio", "Outro"
];

interface ExerciseForm {
  name: string;
  description: string;
  muscle_group: string;
  video_url: string;
  image_url: string;
}

const emptyForm: ExerciseForm = { name: "", description: "", muscle_group: "", video_url: "", image_url: "" };

const AdminExerciseLibrary = () => {
  const { role } = useAuth();
  const queryClient = useQueryClient();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<ExerciseForm>(emptyForm);
  const [search, setSearch] = useState("");
  const [filterGroup, setFilterGroup] = useState<string>("all");
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { data: exercises, isLoading } = useQuery({
    queryKey: ["exercise-library"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("exercise_library")
        .select("*")
        .order("muscle_group")
        .order("name");
      if (error) throw error;
      return data || [];
    },
  });

  const saveMutation = useMutation({
    mutationFn: async (data: ExerciseForm & { id?: string }) => {
      if (data.id) {
        const { error } = await supabase.from("exercise_library").update({
          name: data.name, description: data.description,
          muscle_group: data.muscle_group, video_url: data.video_url,
          image_url: data.image_url,
          updated_at: new Date().toISOString(),
        }).eq("id", data.id);
        if (error) {
          const { handleLibraryWriteError } = await import("@/lib/library-write-guard");
          await handleLibraryWriteError(error, {
            table: "exercise_library",
            operation: "update",
            recordId: data.id,
            payload: data as any,
          });
          throw error;
        }
      } else {
        const { error } = await supabase.from("exercise_library").insert({
          name: data.name, description: data.description,
          muscle_group: data.muscle_group, video_url: data.video_url,
          image_url: data.image_url,
        });
        if (error) {
          const { handleLibraryWriteError } = await import("@/lib/library-write-guard");
          await handleLibraryWriteError(error, {
            table: "exercise_library",
            operation: "insert",
            payload: data as any,
          });
          throw error;
        }
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["exercise-library"] });
      toast.success(editingId ? "Exercício atualizado!" : "Exercício adicionado!");
      closeDialog();
    },
    onError: () => {},
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("exercise_library").delete().eq("id", id);
      if (error) {
        const { handleLibraryWriteError } = await import("@/lib/library-write-guard");
        await handleLibraryWriteError(error, {
          table: "exercise_library",
          operation: "delete",
          recordId: id,
        });
        throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["exercise-library"] });
      toast.success("Exercício removido!");
    },
    onError: () => {},
  });

  const closeDialog = () => {
    setDialogOpen(false);
    setEditingId(null);
    setForm(emptyForm);
  };

  const openEdit = (ex: any) => {
    setEditingId(ex.id);
    setForm({ name: ex.name, description: ex.description || "", muscle_group: ex.muscle_group || "", video_url: ex.video_url || "", image_url: ex.image_url || "" });
    setDialogOpen(true);
  };

  const handleSave = () => {
    if (!form.name.trim()) { toast.error("Nome é obrigatório."); return; }
    saveMutation.mutate({ ...form, id: editingId || undefined });
  };

  const handleImageUpload = async (file: File) => {
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) {
      toast.error("Imagem muito grande (máx 2MB).");
      return;
    }
    setUploading(true);
    try {
      const ext = file.name.split(".").pop()?.toLowerCase() || "jpg";
      const path = `library/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
      const { error: upErr } = await supabase.storage.from("workout-images").upload(path, file, { cacheControl: "3600", upsert: false });
      if (upErr) throw upErr;
      const { data } = supabase.storage.from("workout-images").getPublicUrl(path);
      setForm(p => ({ ...p, image_url: data.publicUrl }));
      toast.success("Imagem enviada!");
    } catch (e: any) {
      toast.error("Erro no upload: " + (e.message || ""));
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const filtered = (exercises || []).filter((ex: any) => {
    const matchSearch = !search || ex.name.toLowerCase().includes(search.toLowerCase());
    const matchGroup = filterGroup === "all" || ex.muscle_group === filterGroup;
    return matchSearch && matchGroup;
  });

  return (
    <DashboardLayout role={(role as any) || "admin"} title="Biblioteca de Exercícios" subtitle="Cadastro e gerenciamento de exercícios reutilizáveis.">
      <div className="space-y-4 max-w-5xl">
        {/* Toolbar */}
        <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
          <div className="flex gap-2 flex-1 w-full sm:w-auto">
            <div className="relative flex-1 sm:max-w-xs">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input placeholder="Buscar exercício..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9" />
            </div>
            <Select value={filterGroup} onValueChange={setFilterGroup}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="Grupo muscular" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                {MUSCLE_GROUPS.map(g => <SelectItem key={g} value={g}>{g}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>

          <Dialog open={dialogOpen} onOpenChange={(v) => { if (!v) closeDialog(); else setDialogOpen(true); }}>
            <DialogTrigger asChild>
              <Button onClick={() => { setForm(emptyForm); setEditingId(null); }}>
                <Plus className="w-4 h-4 mr-1" /> Novo Exercício
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-lg">
              <DialogHeader>
                <DialogTitle>{editingId ? "Editar Exercício" : "Novo Exercício"}</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label>Nome *</Label>
                  <Input value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} placeholder="Ex: Supino reto com barra" />
                </div>
                <div>
                  <Label>Grupo Muscular</Label>
                  <Select value={form.muscle_group} onValueChange={v => setForm(p => ({ ...p, muscle_group: v }))}>
                    <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                    <SelectContent>
                      {MUSCLE_GROUPS.map(g => <SelectItem key={g} value={g}>{g}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Descrição / Execução</Label>
                  <Textarea value={form.description} onChange={e => setForm(p => ({ ...p, description: e.target.value }))} placeholder="Descreva a execução do exercício..." rows={3} />
                </div>
                <div>
                  <Label>URL do Vídeo</Label>
                  <Input value={form.video_url} onChange={e => setForm(p => ({ ...p, video_url: e.target.value }))} placeholder="https://youtube.com/watch?v=..." />
                </div>
                {form.video_url && (
                  <ExerciseMediaPreview
                    videoUrl={form.video_url}
                    alt={form.name || "Prévia do vídeo"}
                    mode="player"
                    className="w-full aspect-video"
                    showBadge
                  />
                )}
                <div>
                  <Label>Imagem ilustrativa (fallback do vídeo)</Label>
                  <div className="space-y-2 mt-1">
                    {form.image_url && (
                      <div className="relative w-full aspect-video rounded-lg overflow-hidden border border-border bg-muted">
                        <ExerciseMediaPreview
                          imageUrl={form.image_url}
                          alt="preview"
                          mode="player"
                          className="w-full h-full border-0 rounded-none"
                          showBadge
                        />
                        <Button
                          type="button"
                          size="icon"
                          variant="destructive"
                          className="absolute top-2 right-2 h-7 w-7"
                          onClick={() => setForm(p => ({ ...p, image_url: "" }))}
                        >
                          <X className="w-3.5 h-3.5" />
                        </Button>
                      </div>
                    )}
                    <div className="flex gap-2">
                      <Input
                        value={form.image_url}
                        onChange={e => setForm(p => ({ ...p, image_url: e.target.value }))}
                        placeholder="URL da imagem ou faça upload"
                        className="flex-1"
                      />
                      <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={e => e.target.files?.[0] && handleImageUpload(e.target.files[0])}
                      />
                      <Button
                        type="button"
                        variant="outline"
                        disabled={uploading}
                        onClick={() => fileInputRef.current?.click()}
                      >
                        <Upload className="w-4 h-4 mr-1" /> {uploading ? "Enviando..." : "Upload"}
                      </Button>
                    </div>
                    <p className="text-[11px] text-muted-foreground">
                      Será exibida ao aluno quando o exercício não tiver vídeo cadastrado. Máx 2MB.
                    </p>
                  </div>
                </div>
                <div className="flex gap-2 justify-end">
                  <Button variant="outline" onClick={closeDialog}>Cancelar</Button>
                  <Button onClick={handleSave} disabled={saveMutation.isPending}>
                    {saveMutation.isPending ? "Salvando..." : "Salvar"}
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {/* List */}
        {isLoading ? (
          <p className="text-muted-foreground text-sm">Carregando...</p>
        ) : filtered.length === 0 ? (
          <Card><CardContent className="py-12 text-center">
            <Dumbbell className="w-10 h-10 mx-auto text-muted-foreground/40 mb-3" />
            <p className="text-muted-foreground">Nenhum exercício encontrado.</p>
          </CardContent></Card>
        ) : (
          <div className="grid gap-3">
            {filtered.map((ex: any) => (
              <Card key={ex.id} className="hover:shadow-sm transition-shadow">
                <CardContent className="flex items-center gap-4 py-4">
                  <ExerciseMediaPreview
                    videoUrl={ex.video_url}
                    imageUrl={ex.image_url}
                    alt={ex.name}
                    className="w-16 h-16 shrink-0"
                    showBadge
                  />
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm">{ex.name}</p>
                    <div className="flex gap-2 mt-1 items-center">
                      {ex.muscle_group && <Badge variant="secondary" className="text-xs">{ex.muscle_group}</Badge>}
                      {ex.video_url && <Video className="w-3.5 h-3.5 text-primary" />}
                      {ex.image_url && <ImageIcon className="w-3.5 h-3.5 text-muted-foreground" />}
                    </div>
                    {ex.description && <p className="text-xs text-muted-foreground mt-1 line-clamp-1">{ex.description}</p>}
                  </div>
                  <div className="flex gap-1 shrink-0">
                    <Button size="icon" variant="ghost" onClick={() => openEdit(ex)}><Pencil className="w-4 h-4" /></Button>
                    <Button size="icon" variant="ghost" onClick={() => deleteMutation.mutate(ex.id)}><Trash2 className="w-4 h-4 text-destructive" /></Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
};

export default AdminExerciseLibrary;
