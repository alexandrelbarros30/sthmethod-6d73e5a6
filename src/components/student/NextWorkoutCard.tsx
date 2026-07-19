import { Link, useLocation } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Dumbbell, Play, CheckCircle2 } from "lucide-react";

/**
 * Próximo treino do aluno na Jornada.
 * Regra de rotação: última sessão finalizada define o "último treino feito"; o próximo
 * é o assignment com o menor sort_order maior que ele. Se não houver, volta ao primeiro.
 */
const NextWorkoutCard = () => {
  const { user } = useAuth();
  const location = useLocation();
  const previewAs = new URLSearchParams(location.search).get("preview_as");
  const trainingHref = previewAs ? `/dashboard/training?preview_as=${previewAs}` : "/dashboard/training";

  const { data: assignments = [] } = useQuery({
    queryKey: ["next-workout-assignments", user?.id],
    enabled: !!user?.id,
    queryFn: async () => {
      const today = new Date().toISOString().slice(0, 10);
      const { data } = await supabase
        .from("student_workout_assignments")
        .select("id, template_id, start_date, end_date, workout_templates(id, title, subtitle, image_url, sort_order, program_id, released)")
        .eq("user_id", user!.id)
        .eq("active", true)
        .eq("visible", true)
        .or(`start_date.is.null,start_date.lte.${today}`)
        .or(`end_date.is.null,end_date.gte.${today}`);
      const list = (data || []).filter((a: any) => a.workout_templates?.released !== false);
      list.sort(
        (a: any, b: any) => (a.workout_templates?.sort_order || 0) - (b.workout_templates?.sort_order || 0)
      );
      return list;
    },
  });

  const { data: lastSession } = useQuery({
    queryKey: ["next-workout-last-session", user?.id],
    enabled: !!user?.id,
    queryFn: async () => {
      const { data } = await supabase
        .from("student_workout_sessions")
        .select("template_id, finished_at")
        .eq("user_id", user!.id)
        .not("finished_at", "is", null)
        .order("finished_at", { ascending: false })
        .limit(1)
        .maybeSingle();
      return data;
    },
  });

  if (!assignments.length) return null;

  // Determina o próximo por rotação por sort_order
  const lastTemplateId = lastSession?.template_id;
  const lastIdx = lastTemplateId
    ? assignments.findIndex((a: any) => a.template_id === lastTemplateId)
    : -1;
  const nextIdx = lastIdx >= 0 ? (lastIdx + 1) % assignments.length : 0;
  const next: any = assignments[nextIdx];
  const template = next?.workout_templates;
  if (!template) return null;

  // Feito hoje?
  const finishedToday =
    lastSession?.template_id === template.id &&
    lastSession?.finished_at &&
    new Date(lastSession.finished_at).toDateString() === new Date().toDateString();

  return (
    <Link
      to={trainingHref}
      className="block mb-6 rounded-3xl border border-border/40 bg-background overflow-hidden active:scale-[0.99] transition-transform"
    >
      <div className="relative">
        {template.image_url ? (
          <div className="relative h-32 overflow-hidden">
            <img
              src={template.image_url}
              alt={template.title}
              className="w-full h-full object-cover"
              loading="lazy"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-background via-background/40 to-transparent" />
            <div className="absolute top-3 left-4 text-[10px] font-medium tracking-[0.25em] uppercase text-white/90 flex items-center gap-1.5">
              <Dumbbell className="w-3 h-3" /> Próximo treino
            </div>
          </div>
        ) : (
          <div className="px-6 pt-6 text-[10px] font-medium tracking-[0.25em] uppercase text-muted-foreground flex items-center gap-1.5">
            <Dumbbell className="w-3 h-3" /> Próximo treino
          </div>
        )}

        <div className="px-6 pb-6 pt-4">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <h3 className="text-[20px] font-semibold tracking-[-0.03em] leading-tight text-foreground truncate">
                {template.title}
              </h3>
              {template.subtitle && (
                <p className="text-[12px] text-muted-foreground font-light tracking-tight mt-1 line-clamp-1">
                  {template.subtitle}
                </p>
              )}
              {finishedToday && (
                <p className="text-[11px] text-emerald-500 font-medium mt-2 flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3" /> Feito hoje
                </p>
              )}
            </div>
            <span className="shrink-0 w-11 h-11 rounded-full bg-foreground text-background flex items-center justify-center">
              <Play className="w-4 h-4 fill-background" strokeWidth={2} />
            </span>
          </div>
        </div>
      </div>
    </Link>
  );
};

export default NextWorkoutCard;