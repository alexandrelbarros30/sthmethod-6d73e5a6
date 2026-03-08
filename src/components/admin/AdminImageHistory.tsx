import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { History, Pencil, Check, X } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface Props {
  allImages: any[];
  onUpdate: () => void;
}

const labels: Record<string, string> = { front: "Frente", back: "Costas", profile: "Perfil" };

const AdminImageHistory = ({ allImages, onUpdate }: Props) => {
  const [editingGroup, setEditingGroup] = useState<string | null>(null);
  const [editDateTime, setEditDateTime] = useState("");
  const [saving, setSaving] = useState(false);

  // Group by uploaded_at timestamp (same second = same group)
  const imagesByGroup = allImages.reduce((acc: Record<string, any[]>, img: any) => {
    // Group by date + time (minute precision)
    const d = new Date(img.uploaded_at);
    const key = `${d.getFullYear()}-${(d.getMonth()+1).toString().padStart(2,"0")}-${d.getDate().toString().padStart(2,"0")}T${d.getHours().toString().padStart(2,"0")}:${d.getMinutes().toString().padStart(2,"0")}`;
    if (!acc[key]) acc[key] = [];
    acc[key].push(img);
    return acc;
  }, {});

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

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-display flex items-center gap-2">
          <History className="w-4 h-4" /> Galeria de Imagens
        </CardTitle>
        <p className="text-[10px] text-muted-foreground">Clique no ícone de edição para alterar a data/hora de um grupo.</p>
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
                    <Button size="icon" variant="ghost" className="h-6 w-6 ml-auto" onClick={() => startEdit(groupKey)}>
                      <Pencil className="w-3 h-3 text-muted-foreground" />
                    </Button>
                  </>
                )}
              </div>
              <div className="grid grid-cols-3 gap-2">
                {["front", "back", "profile"].map((type) => {
                  const img = (imgs as any[]).find((i: any) => i.type === type);
                  return (
                    <div key={type} className="text-center">
                      <p className="text-[10px] text-muted-foreground mb-0.5">{labels[type]}</p>
                      {img ? (
                        <img src={img.image_url} alt={labels[type]} className="w-full aspect-[3/4] object-cover rounded border" />
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
  );
};

export default AdminImageHistory;
