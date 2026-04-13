import { useState } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Plus, Pencil, Trash2, Megaphone, Calendar, ArrowUp, ArrowDown, ImageIcon, MessageCircle } from "lucide-react";
import { format } from "date-fns";
import { processAndUpload, validateImageFile } from "@/lib/image-upload";

interface AdForm {
  title: string;
  description: string;
  image_url: string;
  whatsapp_number: string;
  external_link: string;
  popup_content: string;
  sort_order: number;
  active: boolean;
  start_date: string;
  end_date: string;
  display_duration_seconds: number;
}

const emptyForm: AdForm = {
  title: "",
  description: "",
  image_url: "",
  whatsapp_number: "",
  external_link: "",
  popup_content: "",
  sort_order: 0,
  active: true,
  start_date: new Date().toISOString().split("T")[0],
  end_date: "",
  display_duration_seconds: 0,
};

const AdminAds = () => {
  const queryClient = useQueryClient();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<AdForm>(emptyForm);
  const [uploading, setUploading] = useState(false);

  const { data: ads, isLoading } = useQuery({
    queryKey: ["admin-ads"],
    queryFn: async () => {
      const { data } = await supabase
        .from("ads")
        .select("*")
        .order("sort_order", { ascending: true });
      return data || [];
    },
  });

  const saveMutation = useMutation({
    mutationFn: async () => {
      const payload = {
        title: form.title,
        description: form.description,
        image_url: form.image_url || null,
        whatsapp_number: form.whatsapp_number || null,
        external_link: form.external_link || null,
        popup_content: form.popup_content || null,
        sort_order: form.sort_order,
        active: form.active,
        start_date: form.start_date,
        end_date: form.end_date || null,
        display_duration_seconds: form.display_duration_seconds || 0,
      };
      if (editingId) {
        const { error } = await supabase.from("ads").update(payload).eq("id", editingId);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("ads").insert(payload);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-ads"] });
      queryClient.invalidateQueries({ queryKey: ["student-ads"] });
      toast.success(editingId ? "Propaganda atualizada!" : "Propaganda criada!");
      setDialogOpen(false);
      setEditingId(null);
      setForm(emptyForm);
    },
    onError: () => toast.error("Erro ao salvar propaganda"),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("ads").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-ads"] });
      queryClient.invalidateQueries({ queryKey: ["student-ads"] });
      toast.success("Propaganda excluída!");
    },
  });

  const reorderMutation = useMutation({
    mutationFn: async ({ id, newOrder }: { id: string; newOrder: number }) => {
      const { error } = await supabase.from("ads").update({ sort_order: newOrder }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["admin-ads"] }),
  });

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const err = validateImageFile(file);
    if (err) { toast.error(err); return; }
    setUploading(true);
    try {
      const path = `ads/${Date.now()}-${file.name}`;
      const url = await processAndUpload(file, "landing-assets", path);
      setForm((f) => ({ ...f, image_url: url }));
      toast.success("Imagem enviada!");
    } catch {
      toast.error("Erro ao enviar imagem");
    } finally {
      setUploading(false);
    }
  };

  const openEdit = (ad: any) => {
    setEditingId(ad.id);
    setForm({
      title: ad.title || "",
      description: ad.description || "",
      image_url: ad.image_url || "",
      whatsapp_number: ad.whatsapp_number || "",
      external_link: ad.external_link || "",
      popup_content: ad.popup_content || "",
      sort_order: ad.sort_order || 0,
      active: ad.active ?? true,
      start_date: ad.start_date || "",
      end_date: ad.end_date || "",
      display_duration_seconds: ad.display_duration_seconds || 0,
    });
    setDialogOpen(true);
  };

  const openNew = () => {
    setEditingId(null);
    const nextOrder = (ads?.length || 0);
    setForm({ ...emptyForm, sort_order: nextOrder });
    setDialogOpen(true);
  };

  const moveAd = (ad: any, direction: "up" | "down") => {
    if (!ads) return;
    const idx = ads.findIndex((a: any) => a.id === ad.id);
    const swapIdx = direction === "up" ? idx - 1 : idx + 1;
    if (swapIdx < 0 || swapIdx >= ads.length) return;
    const other = ads[swapIdx];
    reorderMutation.mutate({ id: ad.id, newOrder: other.sort_order });
    reorderMutation.mutate({ id: other.id, newOrder: ad.sort_order });
  };

  const statusBadge = (ad: any) => {
    const now = new Date().toISOString().split("T")[0];
    if (!ad.active) return <Badge variant="secondary">Inativo</Badge>;
    if (ad.end_date && ad.end_date < now) return <Badge variant="outline" className="text-muted-foreground">Encerrado</Badge>;
    if (ad.start_date > now) return <Badge className="bg-amber-500 text-white">Agendado</Badge>;
    return <Badge className="bg-emerald-500 text-white">Ativo</Badge>;
  };

  return (
    <DashboardLayout role="admin" title="Propagandas" subtitle="Crie e gerencie propagandas para os alunos.">
      <div className="flex justify-end mb-4">
        <Button onClick={openNew} className="gap-2">
          <Plus className="w-4 h-4" /> Nova Propaganda
        </Button>
      </div>

      {isLoading ? (
        <p className="text-sm text-muted-foreground text-center py-8">Carregando...</p>
      ) : !ads?.length ? (
        <Card>
          <CardContent className="py-12 text-center">
            <Megaphone className="w-10 h-10 text-muted-foreground/40 mx-auto mb-3" />
            <p className="text-sm text-muted-foreground">Nenhuma propaganda criada ainda.</p>
            <Button variant="outline" className="mt-4 gap-2" onClick={openNew}>
              <Plus className="w-4 h-4" /> Criar Primeira Propaganda
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {ads.map((ad: any, idx: number) => (
            <Card key={ad.id}>
              <CardContent className="py-4">
                <div className="flex items-start gap-3">
                  {ad.image_url && (
                    <img src={ad.image_url} alt={ad.title} className="w-14 h-14 rounded-xl object-cover shrink-0" />
                  )}
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <Megaphone className="w-4 h-4 text-primary shrink-0" />
                      <h3 className="text-sm font-semibold truncate">{ad.title || "Sem título"}</h3>
                      {statusBadge(ad)}
                    </div>
                    <p className="text-xs text-muted-foreground line-clamp-1 mb-1.5">{ad.description}</p>
                    <div className="flex flex-wrap gap-2 text-[10px] text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        {format(new Date(ad.start_date + "T12:00:00"), "dd/MM/yyyy")}
                        {ad.end_date && ` → ${format(new Date(ad.end_date + "T12:00:00"), "dd/MM/yyyy")}`}
                      </span>
                      {ad.whatsapp_number && (
                        <span className="flex items-center gap-1">
                          <MessageCircle className="w-3 h-3" /> {ad.whatsapp_number}
                        </span>
                      )}
                      {ad.display_duration_seconds > 0 && (
                        <Badge variant="outline" className="text-[10px]">{ad.display_duration_seconds}s</Badge>
                      )}
                    </div>
                  </div>
                  <div className="flex flex-col gap-1 shrink-0">
                    <div className="flex gap-1">
                      <Button variant="ghost" size="icon" className="h-7 w-7" disabled={idx === 0} onClick={() => moveAd(ad, "up")}>
                        <ArrowUp className="w-3.5 h-3.5" />
                      </Button>
                      <Button variant="ghost" size="icon" className="h-7 w-7" disabled={idx === ads.length - 1} onClick={() => moveAd(ad, "down")}>
                        <ArrowDown className="w-3.5 h-3.5" />
                      </Button>
                    </div>
                    <div className="flex gap-1">
                      <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => openEdit(ad)}>
                        <Pencil className="w-3.5 h-3.5" />
                      </Button>
                      <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => deleteMutation.mutate(ad.id)}>
                        <Trash2 className="w-3.5 h-3.5" />
                      </Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{editingId ? "Editar Propaganda" : "Nova Propaganda"}</DialogTitle>
          </DialogHeader>
          <ScrollArea className="max-h-[70vh]">
            <div className="space-y-4 pr-2">
              <div>
                <label className="text-xs font-medium mb-1 block">Título</label>
                <Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="Nome da propaganda" />
              </div>

              <div>
                <label className="text-xs font-medium mb-1 block">Descrição</label>
                <Input value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="Descrição curta" />
              </div>

              <div>
                <label className="text-xs font-medium mb-1 block">Imagem</label>
                <div className="flex items-center gap-3">
                  {form.image_url ? (
                    <img src={form.image_url} alt="" className="w-16 h-16 rounded-xl object-cover" />
                  ) : (
                    <div className="w-16 h-16 rounded-xl bg-muted flex items-center justify-center">
                      <ImageIcon className="w-6 h-6 text-muted-foreground/40" />
                    </div>
                  )}
                  <div className="flex-1">
                    <Input type="file" accept="image/*" onChange={handleImageUpload} disabled={uploading} />
                    {form.image_url && (
                      <Button variant="link" size="sm" className="text-xs text-destructive p-0 h-auto mt-1" onClick={() => setForm({ ...form, image_url: "" })}>
                        Remover imagem
                      </Button>
                    )}
                  </div>
                </div>
              </div>

              <div>
                <label className="text-xs font-medium mb-1 block">Conteúdo do Popup</label>
                <Textarea value={form.popup_content} onChange={(e) => setForm({ ...form, popup_content: e.target.value })} rows={4} placeholder="Texto detalhado exibido ao abrir a propaganda..." />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-medium mb-1 block">WhatsApp</label>
                  <Input value={form.whatsapp_number} onChange={(e) => setForm({ ...form, whatsapp_number: e.target.value })} placeholder="5521999999999" />
                </div>
                <div>
                  <label className="text-xs font-medium mb-1 block">Link Externo</label>
                  <Input value={form.external_link} onChange={(e) => setForm({ ...form, external_link: e.target.value })} placeholder="https://..." />
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

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-medium mb-1 block">Ordem</label>
                  <Input type="number" value={form.sort_order} onChange={(e) => setForm({ ...form, sort_order: parseInt(e.target.value) || 0 })} />
                </div>
                <div>
                  <label className="text-xs font-medium mb-1 block">Tempo exibição (seg)</label>
                  <Input type="number" value={form.display_duration_seconds} onChange={(e) => setForm({ ...form, display_duration_seconds: parseInt(e.target.value) || 0 })} placeholder="0 = sem timer" />
                </div>
              </div>

              <div className="flex items-center gap-2">
                <input type="checkbox" checked={form.active} onChange={(e) => setForm({ ...form, active: e.target.checked })} className="rounded border-input" />
                <label className="text-sm">Ativo</label>
              </div>

              <Button className="w-full" onClick={() => saveMutation.mutate()} disabled={!form.title || saveMutation.isPending}>
                {saveMutation.isPending ? "Salvando..." : editingId ? "Atualizar" : "Criar Propaganda"}
              </Button>
            </div>
          </ScrollArea>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
};

export default AdminAds;
