import { useEffect, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { ChevronDown, ClipboardList, Pencil, Save, Trash2, X, Plus, Calendar as CalendarIcon } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import RichTextEditor from "@/components/shared/RichTextEditor";
import RichContentRenderer from "@/components/shared/RichContentRenderer";
import { toast } from "sonner";

interface DietPlanningPanelProps {
  targetUserId: string;
}

const DietPlanningPanel = ({ targetUserId }: DietPlanningPanelProps) => {
  const { user, role } = useAuth();
  const qc = useQueryClient();
  const canEdit = role === "admin" || role === "consultor";

  const [open, setOpen] = useState(true);
  const [editing, setEditing] = useState(false);
  const [draftHtml, setDraftHtml] = useState("");
  const [draftDate, setDraftDate] = useState<string>(format(new Date(), "yyyy-MM-dd"));
  const [saving, setSaving] = useState(false);

  const { data: planning, isLoading } = useQuery({
    queryKey: ["diet-planning", targetUserId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("diet_planning")
        .select("id, plan_date, content_html, updated_at")
        .eq("user_id", targetUserId)
        .order("updated_at", { ascending: false })
        .limit(1)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
    enabled: !!targetUserId,
  });

  useEffect(() => {
    if (editing && planning) {
      setDraftHtml(planning.content_html || "");
      setDraftDate(planning.plan_date || format(new Date(), "yyyy-MM-dd"));
    }
  }, [editing, planning]);

  const startEdit = () => {
    setDraftHtml(planning?.content_html || "");
    setDraftDate(planning?.plan_date || format(new Date(), "yyyy-MM-dd"));
    setEditing(true);
    setOpen(true);
  };

  const handleSave = async () => {
    if (!draftDate) {
      toast.error("Informe a data do planejamento.");
      return;
    }
    setSaving(true);
    try {
      if (planning?.id) {
        const { error } = await supabase
          .from("diet_planning")
          .update({ content_html: draftHtml, plan_date: draftDate })
          .eq("id", planning.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("diet_planning").insert({
          user_id: targetUserId,
          content_html: draftHtml,
          plan_date: draftDate,
          created_by: user?.id,
        });
        if (error) throw error;
      }
      toast.success("Planejamento salvo.");
      setEditing(false);
      qc.invalidateQueries({ queryKey: ["diet-planning", targetUserId] });
    } catch (e: any) {
      toast.error(e.message || "Erro ao salvar planejamento.");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!planning?.id) return;
    if (!confirm("Excluir o planejamento deste aluno?")) return;
    setSaving(true);
    try {
      const { error } = await supabase.from("diet_planning").delete().eq("id", planning.id);
      if (error) throw error;
      toast.success("Planejamento excluído.");
      setEditing(false);
      qc.invalidateQueries({ queryKey: ["diet-planning", targetUserId] });
    } catch (e: any) {
      toast.error(e.message || "Erro ao excluir.");
    } finally {
      setSaving(false);
    }
  };

  if (isLoading) return null;

  // Hide entirely for student when no planning exists
  if (!planning && !canEdit) return null;

  const hasContent = !!(planning?.content_html && planning.content_html.trim());
  const formattedDate = planning?.plan_date
    ? format(new Date(planning.plan_date + "T00:00:00"), "dd 'de' MMMM 'de' yyyy", { locale: ptBR })
    : null;

  return (
    <div className="rounded-2xl border border-emerald-400/30 bg-gradient-to-br from-emerald-500/[0.08] via-white/[0.03] to-white/[0.02] backdrop-blur-xl overflow-hidden animate-fade-in shadow-[0_0_40px_-12px_hsl(142_70%_45%/0.35)]">
      <Collapsible open={open} onOpenChange={setOpen}>
        <div className="flex items-center justify-between gap-2 px-5 py-4">
          <CollapsibleTrigger asChild>
            <button type="button" className="flex items-center gap-3 flex-1 text-left">
              <div className="w-9 h-9 rounded-xl bg-emerald-400/15 border border-emerald-400/30 flex items-center justify-center">
                <ClipboardList className="w-4 h-4 text-emerald-300" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[10px] font-semibold tracking-[0.3em] uppercase text-emerald-300/90">Destaque</p>
                <h3 className="text-base font-display font-bold uppercase text-foreground tracking-tight">Planejamento</h3>
                {formattedDate && (
                  <p className="text-[11px] text-muted-foreground mt-0.5 flex items-center gap-1">
                    <CalendarIcon className="w-3 h-3" /> {formattedDate}
                  </p>
                )}
              </div>
              <ChevronDown className={`w-4 h-4 text-muted-foreground transition-transform ${open ? "rotate-180" : ""}`} />
            </button>
          </CollapsibleTrigger>
        </div>

        <CollapsibleContent>
          <div className="px-5 pb-5 space-y-3">
            {editing ? (
              <>
                <div>
                  <label className="text-[10px] font-semibold tracking-[0.2em] uppercase text-muted-foreground">Data</label>
                  <Input
                    type="date"
                    value={draftDate}
                    onChange={(e) => setDraftDate(e.target.value)}
                    className="mt-1"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-semibold tracking-[0.2em] uppercase text-muted-foreground">Conteúdo</label>
                  <div className="mt-1">
                    <RichTextEditor
                      value={draftHtml}
                      onChange={setDraftHtml}
                      placeholder="Escreva o planejamento da dieta (HTML formatado)..."
                    />
                  </div>
                </div>
                <div className="flex flex-wrap gap-2 pt-1">
                  <Button size="sm" onClick={handleSave} disabled={saving}>
                    <Save className="w-4 h-4 mr-1" /> Salvar
                  </Button>
                  <Button size="sm" variant="ghost" onClick={() => setEditing(false)} disabled={saving}>
                    <X className="w-4 h-4 mr-1" /> Cancelar
                  </Button>
                  {planning?.id && (
                    <Button size="sm" variant="destructive" className="ml-auto" onClick={handleDelete} disabled={saving}>
                      <Trash2 className="w-4 h-4 mr-1" /> Excluir
                    </Button>
                  )}
                </div>
              </>
            ) : (
              <>
                {hasContent ? (
                  <RichContentRenderer content={planning!.content_html} />
                ) : (
                  <p className="text-xs text-muted-foreground italic">
                    {canEdit ? "Nenhum planejamento cadastrado ainda." : "Aguarde seu consultor publicar o planejamento."}
                  </p>
                )}
                {canEdit && (
                  <div className="flex gap-2 pt-2 border-t border-white/5">
                    <Button size="sm" variant="outline" onClick={startEdit}>
                      {planning?.id ? <><Pencil className="w-4 h-4 mr-1" /> Editar</> : <><Plus className="w-4 h-4 mr-1" /> Criar planejamento</>}
                    </Button>
                    {planning?.id && (
                      <Button size="sm" variant="ghost" className="text-destructive hover:text-destructive" onClick={handleDelete} disabled={saving}>
                        <Trash2 className="w-4 h-4 mr-1" /> Excluir
                      </Button>
                    )}
                  </div>
                )}
              </>
            )}
          </div>
        </CollapsibleContent>
      </Collapsible>
    </div>
  );
};

export default DietPlanningPanel;