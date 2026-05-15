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
  ChevronDown,
  Sparkles,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import RichTextEditor from "@/components/shared/RichTextEditor";
import RichContentRenderer from "@/components/shared/RichContentRenderer";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface DietPlanningPanelProps {
  targetUserId: string;
  readOnly?: boolean;
}

const STH_GREEN = "#14b780";

const DietPlanningPanel = ({ targetUserId, readOnly = false }: DietPlanningPanelProps) => {
  const { user, role } = useAuth();
  const qc = useQueryClient();
  const canEdit = !readOnly && (role === "admin" || role === "consultor");

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
  if (!planning && !canEdit) return null;

  const hasContent = !!(planning?.content_html && planning.content_html.trim());
  const formattedDate = planning?.plan_date
    ? format(new Date(planning.plan_date + "T00:00:00"), "dd 'de' MMMM 'de' yyyy", { locale: ptBR })
    : null;

  // Tipografia premium do Protocolo Inteligente: corpo monoespaçado, leitura ampla,
  // headings em SF Pro/display bold com tracking justo, accents verdes neon.
  // Tipografia minimalista Apple — fonte reduzida, leitura confortável em mobile
  const protocolProseClasses = cn(
    "max-w-none text-foreground/85 tracking-tight",
    "[&_p]:!text-[12.5px] [&_p]:!leading-[1.5] [&_p]:!text-foreground/80 [&_p]:my-1.5",
    "[&_h1]:font-display [&_h1]:!text-[14px] [&_h1]:!font-semibold [&_h1]:!uppercase [&_h1]:tracking-[0.08em] [&_h1]:!text-foreground [&_h1]:mt-3 [&_h1]:mb-1.5",
    "[&_h2]:font-display [&_h2]:!text-[13px] [&_h2]:!font-semibold [&_h2]:!uppercase [&_h2]:tracking-[0.08em] [&_h2]:!text-foreground [&_h2]:mt-2.5 [&_h2]:mb-1.5",
    "[&_h3]:font-display [&_h3]:!text-[10px] [&_h3]:!font-semibold [&_h3]:tracking-[0.25em] [&_h3]:!uppercase [&_h3]:!text-muted-foreground [&_h3]:mt-2 [&_h3]:mb-1",
    "[&_strong]:!text-foreground [&_strong]:font-semibold",
    "[&_em]:italic [&_em]:!text-muted-foreground",
    "[&_u]:underline [&_u]:decoration-emerald-400/50 [&_u]:underline-offset-2",
    "[&_ul]:!list-none [&_ul]:!pl-0 [&_ul]:my-1.5 [&_ul]:space-y-1 [&_ul]:[list-style:none]",
    "[&_ol]:!list-none [&_ol]:!pl-0 [&_ol]:my-1.5 [&_ol]:space-y-1 [&_ol]:[list-style:none]",
    "[&_li]:!text-[12.5px] [&_li]:!leading-[1.5] [&_li]:!text-foreground/80",
    "[&_li]:!list-none [&_li]:[list-style:none] [&_li]:marker:!content-none [&_li]:pl-0",
    "[&_hr]:border-white/10 [&_hr]:my-3",
    "[&_mark]:bg-emerald-400/15 [&_mark]:!text-emerald-300 [&_mark]:px-1 [&_mark]:py-0 [&_mark]:rounded",
    "[&_blockquote]:border-l-2 [&_blockquote]:border-emerald-400/60 [&_blockquote]:pl-2.5 [&_blockquote]:italic [&_blockquote]:!text-foreground/65 [&_blockquote]:my-2 [&_blockquote]:!text-[12.5px]",
    "[&_a]:!text-emerald-300 [&_a]:underline [&_a]:underline-offset-2 [&_a]:decoration-emerald-400/50",
    "[&_code]:!font-mono [&_code]:!text-[11.5px] [&_code]:!text-emerald-300 [&_code]:bg-emerald-400/[0.08] [&_code]:px-1.5 [&_code]:py-0.5 [&_code]:rounded"
  );

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="relative overflow-hidden rounded-2xl border border-emerald-500/20 bg-card/80 backdrop-blur-sm group hover:shadow-lg shadow-emerald-500/10 transition-all duration-500"
    >
      {/* Ambient glows */}
      <div className="absolute -top-12 -right-12 w-32 h-32 bg-gradient-to-br from-emerald-500 to-teal-500 opacity-[0.07] rounded-full blur-2xl group-hover:opacity-[0.12] transition-opacity duration-500 pointer-events-none" />
      <div className="absolute -bottom-8 -left-8 w-24 h-24 bg-gradient-to-br from-emerald-500 to-teal-500 opacity-[0.04] rounded-full blur-xl pointer-events-none" />

      <Collapsible open={open} onOpenChange={setOpen}>
        <div className="relative z-10 flex items-center gap-3 p-4 sm:p-5">
          <CollapsibleTrigger asChild>
            <button type="button" className="flex items-center gap-3 flex-1 text-left">
              <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-emerald-500 to-teal-500 flex items-center justify-center shadow-lg shadow-emerald-500/20 shrink-0">
                <ClipboardList className="w-5 h-5 text-white" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[10px] font-semibold tracking-[0.25em] uppercase text-emerald-400/90 inline-flex items-center gap-1">
                  <Sparkles className="w-3 h-3" /> Destaque
                </p>
                <h3 className="font-display font-semibold text-sm sm:text-base text-foreground leading-tight tracking-tight">
                  Planejamento
                </h3>
                {formattedDate && (
                  <p className="text-[10px] text-muted-foreground mt-0.5 inline-flex items-center gap-1 font-body">
                    <CalendarIcon className="w-3 h-3" /> {formattedDate}
                  </p>
                )}
              </div>
              <ChevronDown
                className={cn(
                  "w-4 h-4 text-muted-foreground transition-transform shrink-0",
                  open && "rotate-180"
                )}
              />
            </button>
          </CollapsibleTrigger>
        </div>

        <CollapsibleContent>
          <div className="relative z-10 px-4 sm:px-5 pb-4 sm:pb-5 space-y-3" style={{ ["--sth-green" as any]: STH_GREEN }}>
            {editing ? (
              <>
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
                <div className="flex flex-wrap gap-2 pt-1">
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
                </div>
              </>
            ) : (
              <>
                {hasContent ? (
                  <div className="rounded-xl border border-emerald-500/15 bg-emerald-500/[0.04] p-3 sm:p-3.5 max-h-[55vh] overflow-y-auto [scrollbar-width:thin] [&::-webkit-scrollbar]:w-1 [&::-webkit-scrollbar-thumb]:bg-emerald-400/30 [&::-webkit-scrollbar-thumb]:rounded-full">
                    <RichContentRenderer
                      content={planning!.content_html}
                      className={protocolProseClasses}
                      showParagraphBullets={false}
                      stripLeadingMarkers
                      showZebra={false}
                    />
                  </div>
                ) : (
                  <p className="text-xs text-muted-foreground italic font-body">
                    {canEdit
                      ? "Nenhum planejamento cadastrado ainda."
                      : "Aguarde seu consultor publicar o planejamento."}
                  </p>
                )}
                {canEdit && (
                  <div className="flex gap-2 pt-2 border-t border-white/5">
                    <Button size="sm" variant="outline" onClick={startEdit}>
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
                  </div>
                )}
              </>
            )}
          </div>
        </CollapsibleContent>
      </Collapsible>
    </motion.div>
  );
};

export default DietPlanningPanel;
