import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { History, Pencil, Check, X, Trash2, Download } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import SignedImage from "@/components/shared/SignedImage";
import { getSecureFileUrl, extractStoragePath } from "@/lib/secure-file-url";
import { resolveDisplayableImageFromUrl } from "@/lib/displayable-image";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface Props {
  allImages: any[];
  onUpdate: () => void;
}

const labels: Record<string, string> = { front: "Frente", back: "Costas", profile: "Perfil" };

const AdminImageHistory = ({ allImages, onUpdate }: Props) => {
  const [editingGroup, setEditingGroup] = useState<string | null>(null);
  const [editDateTime, setEditDateTime] = useState("");
  const [saving, setSaving] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<{ type: "group"; groupKey: string; imgs: any[] } | { type: "single"; img: any } | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [repairing, setRepairing] = useState(false);

  // Agrupa uploads por "sessão": fotos enviadas dentro de uma janela curta
  // (10 min) entram no mesmo grupo, mesmo que tenham segundos/minutos
  // diferentes. Isso evita que Frente/Costas/Perfil de um mesmo envio
  // apareçam em cards separados quando o upload cruza a virada do minuto.
  const SESSION_WINDOW_MS = 10 * 60 * 1000;
  const sorted = [...allImages].sort(
    (a: any, b: any) => new Date(b.uploaded_at).getTime() - new Date(a.uploaded_at).getTime()
  );
  const imagesByGroup: Record<string, any[]> = {};
  let currentKey: string | null = null;
  let currentAnchor = 0;
  for (const img of sorted) {
    const t = new Date(img.uploaded_at).getTime();
    if (currentKey === null || Math.abs(currentAnchor - t) > SESSION_WINDOW_MS) {
      const d = new Date(img.uploaded_at);
      currentKey = `${d.getFullYear()}-${(d.getMonth()+1).toString().padStart(2,"0")}-${d.getDate().toString().padStart(2,"0")}T${d.getHours().toString().padStart(2,"0")}:${d.getMinutes().toString().padStart(2,"0")}`;
      currentAnchor = t;
      imagesByGroup[currentKey] = [];
    }
    imagesByGroup[currentKey].push(img);
  }

  if (!Object.keys(imagesByGroup).length) return null;

  const startEdit = (groupKey: string) => {
    setEditingGroup(groupKey);
    setEditDateTime(groupKey);
  };

  const cancelEdit = () => {
    setEditingGroup(null);
    setEditDateTime("");
  };

  const saveEdit = async (groupKey: string, imgs: any[]) => {
    setSaving(true);
    try {
      const newDate = new Date(editDateTime).toISOString();
      const ids = imgs.map((i: any) => i.id);
      for (const id of ids) {
        await supabase.from("body_images").update({ uploaded_at: newDate }).eq("id", id);
      }
      toast.success("Data atualizada!");
      setEditingGroup(null);
      onUpdate();
    } catch {
      toast.error("Erro ao atualizar data.");
    }
    setSaving(false);
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      const imgs = deleteTarget.type === "group" ? deleteTarget.imgs : [deleteTarget.img];

      // Delete from storage — prefer storage_path, fall back to extracting from URL
      const storagePaths = imgs
        .map((i: any) => i.storage_path || extractStoragePath(i.image_url, "body-images"))
        .filter(Boolean) as string[];
      if (storagePaths.length) {
        await supabase.storage.from("body-images").remove(storagePaths);
      }

      // Delete from database
      const ids = imgs.map((i: any) => i.id);
      for (const id of ids) {
        await supabase.from("body_images").delete().eq("id", id);
      }

      toast.success(`${imgs.length} imagem(ns) excluída(s).`);
      setDeleteTarget(null);
      onUpdate();
    } catch (err: any) {
      console.error("[delete-images]", err);
      toast.error("Erro ao excluir imagens.");
    }
    setDeleting(false);
  };

  const repairLegacyHeicImages = async () => {
    setRepairing(true);
    let repaired = 0;
    let checked = 0;
    try {
      for (const img of allImages) {
        const path = img.storage_path || extractStoragePath(img.image_url, "body-images");
        if (!path) continue;
        const signed = await getSecureFileUrl({ bucket: "body-images", storagePath: path, fallbackUrl: img.image_url, expiresIn: 600 });
        if (!signed) continue;
        checked += 1;
        const result = await resolveDisplayableImageFromUrl(signed);
        URL.revokeObjectURL(result.objectUrl);
        if (!result.converted) continue;
        const { error } = await supabase.storage.from("body-images").update(path, result.blob, {
          contentType: "image/jpeg",
          cacheControl: "3600",
          upsert: true,
        });
        if (error) throw error;
        repaired += 1;
      }
      toast.success(repaired > 0 ? `${repaired} foto(s) reparada(s) para JPEG.` : `${checked} foto(s) conferida(s). Nenhuma correção pendente.`);
      onUpdate();
    } catch (err: any) {
      console.error("[repair-heic-images]", err);
      toast.error("Não foi possível reparar todas as fotos. Tente novamente com a sessão ativa.");
    } finally {
      setRepairing(false);
    }
  };

  return (
    <>
      <Card>
        <CardHeader className="pb-2">
          <div className="flex items-start justify-between gap-2">
            <CardTitle className="text-sm font-display flex items-center gap-2">
              <History className="w-4 h-4" /> Galeria de Imagens
            </CardTitle>
            <Button size="sm" variant="outline" className="h-7 px-2 text-[10px]" onClick={repairLegacyHeicImages} disabled={repairing}>
              {repairing ? "Reparando…" : "Reparar fotos"}
            </Button>
          </div>
          <p className="text-[10px] text-muted-foreground">Clique no ícone de edição para alterar a data/hora. Use a lixeira para excluir imagens com erro.</p>
        </CardHeader>
        <CardContent>
          {Object.entries(imagesByGroup).map(([groupKey, imgs]) => {
            const isEditing = editingGroup === groupKey;
            const d = new Date(groupKey);
            const dateStr = d.toLocaleDateString("pt-BR");
            const timeStr = d.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });
            const isCurrent = (imgs as any[])[0]?.is_current;

            return (
              <div key={groupKey} className="mb-5 last:mb-0">
                <div className="flex items-center gap-2 mb-2">
                  {isEditing ? (
                    <>
                      <Input
                        type="datetime-local"
                        value={editDateTime}
                        onChange={(e) => setEditDateTime(e.target.value)}
                        className="h-7 text-xs max-w-[200px]"
                      />
                      <Button size="icon" variant="ghost" className="h-6 w-6" disabled={saving} onClick={() => saveEdit(groupKey, imgs as any[])}>
                        <Check className="w-3 h-3 text-primary" />
                      </Button>
                      <Button size="icon" variant="ghost" className="h-6 w-6" onClick={cancelEdit}>
                        <X className="w-3 h-3 text-muted-foreground" />
                      </Button>
                    </>
                  ) : (
                    <>
                      <p className="text-xs font-semibold text-muted-foreground">{dateStr}</p>
                      <p className="text-[10px] text-muted-foreground/70">{timeStr}</p>
                      {isCurrent && <Badge variant="secondary" className="text-[10px]">Atual</Badge>}
                      <div className="ml-auto flex items-center gap-0.5">
                        <Button size="icon" variant="ghost" className="h-6 w-6" onClick={() => startEdit(groupKey)}>
                          <Pencil className="w-3 h-3 text-muted-foreground" />
                        </Button>
                        <Button
                          size="icon"
                          variant="ghost"
                          className="h-6 w-6"
                          onClick={() => setDeleteTarget({ type: "group", groupKey, imgs: imgs as any[] })}
                        >
                          <Trash2 className="w-3 h-3 text-destructive" />
                        </Button>
                      </div>
                    </>
                  )}
                </div>
                <div className="grid grid-cols-3 gap-2">
                  {["front", "back", "profile"].map((type) => {
                    const img = (imgs as any[]).find((i: any) => i.type === type);
                    return (
                      <div key={type} className="text-center relative group">
                        <p className="text-[10px] text-muted-foreground mb-0.5">{labels[type]}</p>
                        {img ? (
                          <div className="relative">
                            <SignedImage bucket="body-images" storagePath={img.storage_path} publicUrl={img.image_url} alt={labels[type]} className="w-full aspect-[3/4] object-cover rounded border" />
                            <div className="absolute top-1 right-1 flex gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                              <button
                                className="p-1 bg-background/80 backdrop-blur-sm rounded-full border border-border/50 hover:bg-background"
                                onClick={async () => {
                                  const signed = await getSecureFileUrl({
                                    bucket: "body-images",
                                    storagePath: img.storage_path || extractStoragePath(img.image_url, "body-images"),
                                    fallbackUrl: img.image_url,
                                  });
                                  if (!signed) return;
                                  const r = await fetch(signed);
                                  const blob = await r.blob();
                                  const url = URL.createObjectURL(blob);
                                  const a = document.createElement("a");
                                  a.href = url;
                                  a.download = `${type}_${groupKey}.jpg`;
                                  document.body.appendChild(a);
                                  a.click();
                                  document.body.removeChild(a);
                                  URL.revokeObjectURL(url);
                                }}
                                title="Baixar imagem"
                              >
                                <Download className="w-3 h-3" />
                              </button>
                              <button
                                className="p-1 bg-destructive/80 rounded-full text-white hover:bg-destructive"
                                onClick={() => setDeleteTarget({ type: "single", img })}
                                title="Excluir esta imagem"
                              >
                                <X className="w-3 h-3" />
                              </button>
                            </div>
                          </div>
                        ) : (
                          <div className="w-full aspect-[3/4] bg-muted rounded flex items-center justify-center text-muted-foreground text-[10px]">—</div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </CardContent>
      </Card>

      <AlertDialog open={!!deleteTarget} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir {deleteTarget?.type === "group" ? "grupo de imagens" : "imagem"}?</AlertDialogTitle>
            <AlertDialogDescription>
              {deleteTarget?.type === "group"
                ? `Isso removerá ${(deleteTarget as any).imgs.length} imagem(ns) deste grupo permanentemente.`
                : "Essa imagem será removida permanentemente do sistema."}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleting}>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} disabled={deleting} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              {deleting ? "Excluindo..." : "Excluir"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};

export default AdminImageHistory;
