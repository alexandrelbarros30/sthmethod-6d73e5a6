import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import {
  ClipboardList,
  Pencil,
  Save,
  Trash2,
  X,
  Plus,
  Calendar as CalendarIcon,
  Eye,
  Sparkles,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import RichTextEditor from "@/components/shared/RichTextEditor";
import RichContentRenderer from "@/components/shared/RichContentRenderer";
import { toast } from "sonner";

interface DietPlanningPanelProps {
  targetUserId: string;
  readOnly?: boolean;
}

const DietPlanningPanel = ({ targetUserId, readOnly = false }: DietPlanningPanelProps) => {
  const { user, role } = useAuth();
  const qc = useQueryClient();
  const canEdit = !readOnly && (role === "admin" || role === "consultor");

  const [viewing, setViewing] = useState(false);
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
    setViewing(true);
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
      setViewing(false);
      qc.invalidateQueries({ queryKey: ["diet-planning", targetUserId] });
    } catch (e: any) {
      toast.error(e.message || "Erro ao excluir.");
    } finally {
      setSaving(false);
    }
  };

  if (isLoading) return null;
  if (!planning && !canEdit) return null;

  const hasContent = !!(planning?.content_html && planning.content_html.trim());
  const formattedDate = planning?.plan_date
    ? format(new Date(planning.plan_date + "T00:00:00"), "dd 'de' MMMM 'de' yyyy", { locale: ptBR })
    : null;

  return (
    <>
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="relative overflow-hidden rounded-2xl border border-emerald-500/20 bg-card/80 backdrop-blur-sm p-4 sm:p-5 group hover:shadow-lg shadow-emerald-500/10 transition-all duration-500"
      >
        {/* Ambient glows */}
        <div className="absolute -top-12 -right-12 w-32 h-32 bg-gradient-to-br from-emerald-500 to-teal-500 opacity-[0.07] rounded-full blur-2xl group-hover:opacity-[0.12] transition-opacity duration-500" />
        <div className="absolute -bottom-8 -left-8 w-24 h-24 bg-gradient-to-br from-emerald-500 to-teal-500 opacity-[0.04] rounded-full blur-xl" />

        <div className="relative z-10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-emerald-500 to-teal-500 flex items-center justify-center shadow-lg shadow-emerald-500/20">
              <ClipboardList className="w-5 h-5 text-white" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-[10px] font-semibold tracking-[0.25em] uppercase text-emerald-400/90 inline-flex items-center gap-1">
                <Sparkles className="w-3 h-3" /> Destaque
              </p>
              <h3 className="font-display font-semibold text-sm sm:text-base text-foreground leading-tight">
                Planejamento
              </h3>
              {formattedDate && (
                <p className="text-[10px] text-muted-foreground mt-0.5 inline-flex items-center gap-1 font-body">
                  <CalendarIcon className="w-3 h-3" /> {formattedDate}
                </p>
              )}
            </div>
            <div className="flex items-center gap-1.5 shrink-0">
              {canEdit && (
                <button
                  type="button"
                  onClick={startEdit}
                  className="inline-flex items-center justify-center w-8 h-8 rounded-lg border border-emerald-500/20 bg-emerald-500/10 text-foreground/70 hover:text-foreground hover:scale-105 transition-all duration-300"
                  title={planning?.id ? "Editar planejamento" : "Criar planejamento"}
                >
                  {planning?.id ? <Pencil className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
                </button>
              )}
              {hasContent && (
                <button
                  type="button"
                  onClick={() => { setEditing(false); setViewing(true); }}
                  className="inline-flex items-center justify-center w-8 h-8 rounded-lg bg-gradient-to-br from-emerald-500 to-teal-500 text-white shadow-md hover:shadow-lg hover:scale-105 transition-all duration-300"
                  title="Ver planejamento"
                >
                  <Eye className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>

          {!hasContent && (
            <p className="text-xs text-muted-foreground ml-[52px] mt-2 italic font-body">
              {canEdit
                ? "Nenhum planejamento cadastrado ainda."
                : "Aguarde seu consultor publicar o planejamento."}
            </p>
          )}
          {hasContent && !canEdit && (
            <p className="text-xs text-muted-foreground ml-[52px] mt-1 font-body">
              Toque no <Eye className="w-3 h-3 inline-block mx-0.5" /> para visualizar
            </p>
          )}
        </div>
      </motion.div>

      <Dialog
        open={viewing}
        onOpenChange={(o) => {
          if (!o) {
            setViewing(false);
            setEditing(false);
          }
        }}
      >
        <DialogContent className="max-w-lg max-h-[85dvh] overflow-hidden !flex !flex-col">
          <DialogHeader>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-emerald-500 to-teal-500 flex items-center justify-center shadow-lg shadow-emerald-500/20">
                <ClipboardList className="w-5 h-5 text-white" />
              </div>
              <div className="flex-1 min-w-0 text-left">
                <p className="text-[10px] font-semibold tracking-[0.25em] uppercase text-emerald-400/90">
                  Destaque
                </p>
                <DialogTitle className="text-base font-display font-semibold text-foreground">
                  Planejamento
                </DialogTitle>
                {formattedDate && !editing && (
                  <p className="text-[11px] text-muted-foreground mt-0.5 inline-flex items-center gap-1 font-body">
                    <CalendarIcon className="w-3 h-3" /> {formattedDate}
                  </p>
                )}
              </div>
            </div>
          </DialogHeader>

          <div className="flex-1 overflow-y-auto pt-2">
            {editing ? (
              <div className="space-y-3">
                <div>
                  <label className="text-[10px] font-semibold tracking-[0.2em] uppercase text-muted-foreground">
                    Data
                  </label>
                  <Input
                    type="date"
                    value={draftDate}
                    onChange={(e) => setDraftDate(e.target.value)}
                    className="mt-1"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-semibold tracking-[0.2em] uppercase text-muted-foreground">
                    Conteúdo
                  </label>
                  <div className="mt-1">
                    <RichTextEditor
                      value={draftHtml}
                      onChange={setDraftHtml}
                      placeholder="Escreva o planejamento da dieta..."
                    />
                  </div>
                </div>
              </div>
            ) : hasContent ? (
              <div className="rounded-lg border border-emerald-500/15 bg-emerald-500/5 p-3">
                <RichContentRenderer content={planning!.content_html} />
              </div>
            ) : (
              <p className="text-sm text-muted-foreground italic">Sem conteúdo.</p>
            )}
          </div>

          {canEdit && (
            <div className="flex flex-wrap gap-2 pt-3 border-t border-border/40">
              {editing ? (
                <>
                  <Button size="sm" onClick={handleSave} disabled={saving}>
                    <Save className="w-4 h-4 mr-1" /> Salvar
                  </Button>
                  <Button size="sm" variant="ghost" onClick={() => setEditing(false)} disabled={saving}>
                    <X className="w-4 h-4 mr-1" /> Cancelar
                  </Button>
                  {planning?.id && (
                    <Button
                      size="sm"
                      variant="destructive"
                      className="ml-auto"
                      onClick={handleDelete}
                      disabled={saving}
                    >
                      <Trash2 className="w-4 h-4 mr-1" /> Excluir
                    </Button>
                  )}
                </>
              ) : (
                <>
                  <Button size="sm" variant="outline" onClick={() => setEditing(true)}>
                    {planning?.id ? (
                      <><Pencil className="w-4 h-4 mr-1" /> Editar</>
                    ) : (
                      <><Plus className="w-4 h-4 mr-1" /> Criar planejamento</>
                    )}
                  </Button>
                  {planning?.id && (
                    <Button
                      size="sm"
                      variant="ghost"
                      className="text-destructive hover:text-destructive ml-auto"
                      onClick={handleDelete}
                      disabled={saving}
                    >
                      <Trash2 className="w-4 h-4 mr-1" /> Excluir
                    </Button>
                  )}
                </>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
};

export default DietPlanningPanel;
