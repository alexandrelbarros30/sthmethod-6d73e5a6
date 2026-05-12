import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Pencil, Check, X } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface Props {
  entry: { id: string; created_at: string; notes: string };
  onSaved?: () => void;
}

export default function AnamnesisEntryItem({ entry, onSaved }: Props) {
  const [editing, setEditing] = useState(false);
  const [text, setText] = useState(entry.notes || "");
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    if (!text.trim()) {
      toast.error("O texto não pode ficar vazio");
      return;
    }
    setSaving(true);
    const { error } = await supabase
      .from("anamnesis_entries")
      .update({ notes: text })
      .eq("id", entry.id);
    setSaving(false);
    if (error) {
      toast.error("Erro ao salvar: " + error.message);
      return;
    }
    toast.success("Anotação atualizada");
    setEditing(false);
    onSaved?.();
  };

  return (
    <div className="border-b border-border/50 pb-3 last:border-0 last:pb-0">
      <div className="flex items-start justify-between gap-2 mb-1">
        <p className="text-xs text-muted-foreground">
          {new Date(entry.created_at).toLocaleDateString("pt-BR")} às{" "}
          {new Date(entry.created_at).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}
        </p>
        {!editing ? (
          <Button variant="ghost" size="sm" className="h-6 px-2" onClick={() => { setText(entry.notes || ""); setEditing(true); }}>
            <Pencil className="w-3 h-3 mr-1" /> Editar
          </Button>
        ) : (
          <div className="flex gap-1">
            <Button variant="ghost" size="sm" className="h-6 px-2" onClick={handleSave} disabled={saving}>
              <Check className="w-3 h-3 mr-1" /> Salvar
            </Button>
            <Button variant="ghost" size="sm" className="h-6 px-2" onClick={() => setEditing(false)} disabled={saving}>
              <X className="w-3 h-3" />
            </Button>
          </div>
        )}
      </div>
      {editing ? (
        <Textarea value={text} onChange={(e) => setText(e.target.value)} rows={6} className="text-sm" />
      ) : (
        <p className="text-sm whitespace-pre-wrap">{entry.notes}</p>
      )}
    </div>
  );
}