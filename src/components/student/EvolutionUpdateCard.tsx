import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { TrendingUp, Scale, Camera, ChevronDown, ChevronUp, Sparkles, Trophy, CheckCircle2, Activity, MessageCircle, HelpCircle } from "lucide-react";
import { Target, Info, Zap } from "lucide-react";
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
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import BodyImageUpload from "@/components/shared/BodyImageUpload";
import { calculateAge, calculateMacros } from "@/lib/macro-calculator";
import EvolutionActivityChange, { ActivityData } from "@/components/student/EvolutionActivityChange";
import { createEvolutionSnapshot } from "@/lib/evolution-snapshot";
import { notifyStudentSelfUpdate } from "@/lib/notify-student-self-update";
import EvolutionTour from "@/components/student/EvolutionTour";
import EvolutionTutorialVideoDialog from "@/components/student/EvolutionTutorialVideoDialog";

interface EvolutionUpdateCardProps {
  userId: string;
  currentWeight?: number | null;
  existingImages: { type: string; image_url: string; id: string }[];
  onComplete: () => void;
  profile?: any;
}

const EvolutionUpdateCard = ({ userId, currentWeight, existingImages, onComplete, profile }: EvolutionUpdateCardProps) => {
  // Etapas independentes — cada uma abre, edita, confirma e salva sozinha.
  const [openStages, setOpenStages] = useState<Record<1 | 2 | 3, boolean>>({ 1: true, 2: false, 3: false });
  const [stage1Done, setStage1Done] = useState(false);
  const [stage2Done, setStage2Done] = useState(false);
  const [stage3Done, setStage3Done] = useState(false);

  const [weight, setWeight] = useState("");
  const [notes, setNotes] = useState("");
  const [activityChange, setActivityChange] = useState<ActivityData | null>(null);

  const [savingStage, setSavingStage] = useState<0 | 1 | 2 | 3>(0);
  const [confirmStage, setConfirmStage] = useState<0 | 1 | 2 | 3>(0);

  const [draftReady, setDraftReady] = useState(false);
  const [tourOpen, setTourOpen] = useState(false);
  const [videoOpen, setVideoOpen] = useState(false);
  const tourSeenKey = `sth:evolution-tour-seen:v1:${userId}`;
  const draftKey = `sth:evolution-card-draft:v3:${userId}`;
  const imageDraftKey = `sth:evolution-card-images:v3:${userId}`;

  useEffect(() => {
    try {
      if (!localStorage.getItem(tourSeenKey)) {
        const t = setTimeout(() => setTourOpen(true), 600);
        return () => clearTimeout(t);
      }
    } catch {}
  }, [tourSeenKey]);

  const handleCloseTour = () => {
    setTourOpen(false);
    try { localStorage.setItem(tourSeenKey, "1"); } catch {}
  };

  const toggleStage = (n: 1 | 2 | 3) => setOpenStages((s) => ({ ...s, [n]: !s[n] }));

  const completedCount = [stage1Done, stage2Done, stage3Done].filter(Boolean).length;
  const progressPct = (completedCount / 3) * 100;

  useEffect(() => {
    try {
      const raw = localStorage.getItem(draftKey);
      if (raw) {
        const draft = JSON.parse(raw);
        setWeight(draft.weight || "");
        setNotes(draft.notes || "");
        setActivityChange(draft.activityChange || null);
        if (draft.weight || draft.notes || draft.activityChange) {
          toast.info("Rascunho da evolução restaurado.");
        }
      }
    } catch (err) {
      console.warn("[evolution-card-draft] restore failed", err);
    } finally {
      setDraftReady(true);
    }
  }, [draftKey]);

  useEffect(() => {
    if (!draftReady) return;
    const draft = { weight, notes, activityChange, updatedAt: new Date().toISOString() };
    if (weight || notes || activityChange) localStorage.setItem(draftKey, JSON.stringify(draft));
    else localStorage.removeItem(draftKey);
  }, [draftKey, draftReady, weight, notes, activityChange]);

  const timestampBR = () => new Date().toLocaleString("pt-BR", { timeZone: "America/Sao_Paulo" });

  // ────────────────────────── Etapa 1: peso + mensagem ──────────────────────────
  const canSubmitStage1 = Boolean(weight) || Boolean(notes.trim());

  const handleSaveStage1 = async () => {
    setSavingStage(1);
    try {
      const hasNewWeight = Boolean(weight);
      const currentStoredWeight = profile?.weight ? Number(profile.weight) : null;
      const newWeight = hasNewWeight ? Number(weight) : currentStoredWeight;

      if (hasNewWeight) {
        const { error } = await supabase.from("weight_logs").insert({
          user_id: userId,
          weight: newWeight,
          notes: notes || "",
        });
        if (error) throw error;
        void notifyStudentSelfUpdate(userId, "weight");
      }

      let macroUpdate: Record<string, any> = hasNewWeight ? { weight: newWeight } : {};

      if (hasNewWeight && profile?.birth_date && profile?.height && profile?.gender && typeof newWeight === "number" && Number.isFinite(newWeight)) {
        const age = calculateAge(profile.birth_date);
        const macros = calculateMacros({
          gender: profile.gender as "masculino" | "feminino",
          age,
          weight: newWeight,
          height: Number(profile.height),
          activityType: profile.activity_type || "nenhuma",
          doesCardio: profile.does_cardio || false,
          objective: profile.objective || "manter_peso",
          physicalActivityLevel: profile.physical_activity_level || "sedentario",
          trainingDaysPerWeek: profile.training_days_per_week ?? undefined,
          trainingDurationMinutes: profile.training_duration_minutes ?? undefined,
          trainingIntensity: profile.training_intensity ?? undefined,
          cardioDaysPerWeek: profile.cardio_days_per_week ?? undefined,
          cardioDurationMinutes: profile.cardio_duration_minutes ?? undefined,
          cardioIntensity: profile.cardio_intensity ?? undefined,
        });
        macroUpdate = {
          ...macroUpdate,
          bmr: macros.bmr,
          tdee: macros.tdee,
          daily_calories: macros.dailyCalories,
          protein_g: macros.proteinG,
          carbs_g: macros.carbsG,
          fat_g: macros.fatG,
        };
      }

      if (Object.keys(macroUpdate).length > 0) {
        await supabase.from("profiles").update(macroUpdate).eq("user_id", userId);
      }

      const prevWeight = currentWeight ? Number(currentWeight) : null;
      const weightDiff = hasNewWeight && prevWeight ? (Number(newWeight) - prevWeight).toFixed(1) : null;
      const dir = weightDiff && Number(weightDiff) > 0 ? "+" : "";

      let note = `📊 ETAPA 1 — PESO & MENSAGEM (${timestampBR()})\n\n`;
      if (hasNewWeight && typeof newWeight === "number") {
        note += `⚖️ Peso: ${newWeight.toFixed(1)} kg`;
        if (prevWeight) note += ` (anterior: ${prevWeight.toFixed(1)} kg | variação: ${dir}${weightDiff} kg)`;
        note += "\n";
      }
      if (macroUpdate.bmr) {
        note += `\n🔥 Macros recalculados: ${macroUpdate.daily_calories} kcal | P ${macroUpdate.protein_g}g · C ${macroUpdate.carbs_g}g · G ${macroUpdate.fat_g}g\n`;
      }
      if (notes.trim()) note += `\n💬 Mensagem do aluno: ${notes.trim()}\n`;

      await supabase.from("anamnesis_entries").insert({ user_id: userId, notes: note });
      await createEvolutionSnapshot(userId, "student", note);

      toast.success("Etapa 1 salva! +1 conquista 🏆");
      setStage1Done(true);
      setOpenStages((s) => ({ ...s, 1: false, 2: s[2] || !stage2Done ? true : s[2] }));
      setWeight("");
      setNotes("");
      localStorage.removeItem(draftKey);
      onComplete();
    } catch (err: any) {
      console.error(err);
      toast.error("Erro ao salvar: " + (err.message || "Tente novamente."));
    }
    setSavingStage(0);
    setConfirmStage(0);
  };

  // ────────────────────────── Etapa 3: rotina de atividades ─────────────────────
  const canSubmitStage3 = Boolean(activityChange);

  const handleSaveStage3 = async () => {
    if (!activityChange) return;
    setSavingStage(3);
    try {
      const currentStoredWeight = profile?.weight ? Number(profile.weight) : (currentWeight ? Number(currentWeight) : null);
      let macroUpdate: Record<string, any> = {
        activity_type: activityChange.activityType,
        does_cardio: activityChange.doesCardio,
        physical_activity_level: activityChange.physicalActivityLevel,
        training_days_per_week: activityChange.trainingDaysPerWeek ?? null,
        training_duration_minutes: activityChange.trainingDurationMinutes ?? null,
        training_intensity: activityChange.trainingIntensity ?? null,
        cardio_days_per_week: activityChange.cardioDaysPerWeek ?? null,
        cardio_duration_minutes: activityChange.cardioDurationMinutes ?? null,
        cardio_intensity: activityChange.cardioIntensity ?? null,
      };

      if (profile?.birth_date && profile?.height && profile?.gender && typeof currentStoredWeight === "number" && Number.isFinite(currentStoredWeight)) {
        const age = calculateAge(profile.birth_date);
        const macros = calculateMacros({
          gender: profile.gender as "masculino" | "feminino",
          age,
          weight: currentStoredWeight,
          height: Number(profile.height),
          activityType: activityChange.activityType,
          doesCardio: activityChange.doesCardio,
          objective: profile.objective || "manter_peso",
          physicalActivityLevel: activityChange.physicalActivityLevel,
          trainingDaysPerWeek: activityChange.trainingDaysPerWeek ?? undefined,
          trainingDurationMinutes: activityChange.trainingDurationMinutes ?? undefined,
          trainingIntensity: activityChange.trainingIntensity ?? undefined,
          cardioDaysPerWeek: activityChange.cardioDaysPerWeek ?? undefined,
          cardioDurationMinutes: activityChange.cardioDurationMinutes ?? undefined,
          cardioIntensity: activityChange.cardioIntensity ?? undefined,
        });
        macroUpdate = {
          ...macroUpdate,
          bmr: macros.bmr,
          tdee: macros.tdee,
          daily_calories: macros.dailyCalories,
          protein_g: macros.proteinG,
          carbs_g: macros.carbsG,
          fat_g: macros.fatG,
        };
      }

      await supabase.from("profiles").update(macroUpdate).eq("user_id", userId);

      let note = `📊 ETAPA 3 — ROTINA DE ATIVIDADES (${timestampBR()})\n\n`;
      note += `🏋️ NEAT: ${activityChange.physicalActivityLevel}\n`;
      note += `  • Tipo: ${activityChange.activityType}`;
      if (activityChange.activityType !== "nenhuma") {
        note += ` (${activityChange.trainingDaysPerWeek ?? "?"}x/sem, ${activityChange.trainingDurationMinutes ?? "?"}min, ${activityChange.trainingIntensity ?? "?"})`;
      }
      note += `\n  • Cardio: ${activityChange.doesCardio ? "sim" : "não"}`;
      if (activityChange.doesCardio) {
        note += ` (${activityChange.cardioDaysPerWeek ?? "?"}x/sem, ${activityChange.cardioDurationMinutes ?? "?"}min, ${activityChange.cardioIntensity ?? "?"})`;
      }
      note += "\n";
      if (macroUpdate.bmr) {
        note += `\n🔥 Macros recalculados: ${macroUpdate.daily_calories} kcal | P ${macroUpdate.protein_g}g · C ${macroUpdate.carbs_g}g · G ${macroUpdate.fat_g}g\n`;
      }

      await supabase.from("anamnesis_entries").insert({ user_id: userId, notes: note });
      await createEvolutionSnapshot(userId, "student", note);

      toast.success("Etapa 3 salva! Rotina atualizada 🏋️");
      setStage3Done(true);
      setOpenStages((s) => ({ ...s, 3: false }));
      setActivityChange(null);
      onComplete();
    } catch (err: any) {
      console.error(err);
      toast.error("Erro ao salvar: " + (err.message || "Tente novamente."));
    }
    setSavingStage(0);
    setConfirmStage(0);
  };

  // ────────────────────────── Etapa 2: fotos corporais ──────────────────────────
  const handleStage2Complete = async () => {
    const note = `📊 ETAPA 2 — FOTOS CORPORAIS (${timestampBR()})\n\n📸 Novas fotos de evolução enviadas pelo aluno.\n`;
    try {
      await supabase.from("anamnesis_entries").insert({ user_id: userId, notes: note });
      await createEvolutionSnapshot(userId, "student", note);
    } catch (err) {
      console.warn("[stage2] snapshot failed", err);
    }
    setStage2Done(true);
    setOpenStages((s) => ({ ...s, 2: false }));
    toast.success("Etapa 2 salva! Fotos enviadas 📸");
    onComplete();
  };

  // ────────────────────────── UI helpers ────────────────────────────────────────
  const StageHeader = ({
    n,
    icon,
    title,
    subtitle,
    done,
    open,
    accent,
    xp,
  }: {
    n: 1 | 2 | 3;
    icon: React.ReactNode;
    title: string;
    subtitle: string;
    done: boolean;
    open: boolean;
    accent: string;
    xp: number;
  }) => (
    <button
      type="button"
      onClick={() => toggleStage(n)}
      className="w-full text-left flex items-center gap-3 p-3 rounded-xl transition-colors hover:bg-foreground/[0.04]"
    >
      <div
        className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 relative"
        style={{ background: `hsl(${accent} / 0.12)`, border: `1px solid hsl(${accent} / 0.4)` }}
      >
        {done ? <CheckCircle2 className="w-5 h-5" style={{ color: `hsl(${accent})` }} /> : icon}
        <span
          className="absolute -top-1.5 -right-1.5 text-[10px] font-bold px-1.5 py-0.5 rounded-full"
          style={{ background: `hsl(${accent})`, color: "hsl(0 0% 100%)" }}
        >
          {n}
        </span>
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold truncate flex items-center gap-2">
          {title}
          <span
            className="text-[10px] font-bold px-1.5 py-0.5 rounded-full inline-flex items-center gap-0.5"
            style={{ background: `hsl(${accent} / 0.15)`, color: `hsl(${accent})`, border: `1px solid hsl(${accent} / 0.35)` }}
          >
            <Zap className="w-2.5 h-2.5" /> +{xp} XP
          </span>
          {done && (
            <span className="text-[10px] font-medium px-2 py-0.5 rounded-full" style={{ background: `hsl(${accent} / 0.15)`, color: `hsl(${accent})` }}>
              Concluída
            </span>
          )}
        </p>
        <p className="text-xs text-muted-foreground truncate">{subtitle}</p>
      </div>
      {open ? <ChevronUp className="w-4 h-4 text-muted-foreground" /> : <ChevronDown className="w-4 h-4 text-muted-foreground" />}
    </button>
  );

  const GREEN = "145 60% 42%";
  const BLUE = "210 90% 55%";
  const AMBER = "35 90% 55%";

  return (
    <>
      <Card className="border-foreground/15 bg-foreground/[0.03] overflow-hidden">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base font-display flex items-center gap-2">
              <Trophy className="w-4 h-4" style={{ color: `hsl(${GREEN})` }} />
              Missão Evolução
            </CardTitle>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setTourOpen(true)}
                className="text-[11px] font-medium inline-flex items-center gap-1 px-2 py-1 rounded-full hover:bg-foreground/[0.06] transition-colors"
                style={{ color: `hsl(${GREEN})`, border: `1px solid hsl(${GREEN} / 0.35)` }}
              >
                <HelpCircle className="w-3 h-3" />
                Como funciona?
              </button>
              <span className="text-xs font-medium" style={{ color: `hsl(${GREEN})` }}>
                {completedCount}/3
              </span>
            </div>
          </div>
          <p className="text-xs text-muted-foreground">
            Complete as 3 etapas no seu ritmo. Cada uma salva sozinha — sem pressa, sem ordem obrigatória.
          </p>
          <div className="h-1.5 w-full rounded-full bg-foreground/10 overflow-hidden mt-2">
            <div
              className="h-full rounded-full transition-all duration-500"
              style={{ width: `${progressPct}%`, background: `linear-gradient(90deg, hsl(${GREEN}), hsl(${BLUE}))` }}
            />
          </div>
        </CardHeader>

        <CardContent className="space-y-2">
          {/* ETAPA 1 */}
          <div className="rounded-xl border border-border/60" data-tour="evolution-stage-1">
            <StageHeader
              n={1}
              icon={<Scale className="w-4 h-4" style={{ color: `hsl(${GREEN})` }} />}
              title="Peso & Mensagem"
              subtitle="Registre seu peso atual e envie uma mensagem para seu consultor"
              done={stage1Done}
              open={openStages[1]}
              accent={GREEN}
            />
            {openStages[1] && (
              <div className="px-3 pb-4 space-y-4">
                <div className="rounded-lg p-3 text-xs" style={{ background: `hsl(${GREEN} / 0.06)`, border: `1px dashed hsl(${GREEN} / 0.3)` }}>
                  <p className="font-semibold flex items-center gap-1.5 mb-1" style={{ color: `hsl(${GREEN})` }}>
                    <Sparkles className="w-3.5 h-3.5" /> Por que isso importa?
                  </p>
                  <p className="text-muted-foreground leading-relaxed">
                    Seu peso guia o recálculo automático dos macros. A mensagem é lida pelo consultor para entender como você está se sentindo.
                  </p>
                </div>

                <div className="space-y-2">
                  <Label className="text-sm flex items-center gap-2">
                    <Scale className="w-4 h-4" /> Peso atual (kg)
                  </Label>
                  <Input
                    type="number"
                    step="0.1"
                    placeholder={currentWeight ? `Último: ${currentWeight} kg` : "Ex: 75.5"}
                    value={weight}
                    onChange={(e) => setWeight(e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <Label className="text-sm flex items-center gap-2">
                    <MessageCircle className="w-4 h-4" /> Mensagem ao consultor
                  </Label>
                  <Textarea
                    placeholder="Como você está se sentindo? Alguma queixa, dúvida ou vitória para compartilhar?"
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    rows={3}
                  />
                </div>

                <Button
                  className="w-full"
                  onClick={() => setConfirmStage(1)}
                  disabled={savingStage === 1 || !canSubmitStage1}
                  style={
                    canSubmitStage1 && savingStage !== 1
                      ? { background: `hsl(${GREEN})`, color: "hsl(0 0% 100%)", boxShadow: `0 0 20px hsl(${GREEN} / 0.35)` }
                      : undefined
                  }
                >
                  {savingStage === 1 ? "Salvando..." : "Confirmar & salvar etapa 1"}
                </Button>
              </div>
            )}
          </div>

          {/* ETAPA 2 */}
          <div className="rounded-xl border border-border/60" data-tour="evolution-stage-2">
            <StageHeader
              n={2}
              icon={<Camera className="w-4 h-4" style={{ color: `hsl(${BLUE})` }} />}
              title="Fotos corporais"
              subtitle="Envie novas fotos — as anteriores ficam preservadas para comparação"
              done={stage2Done}
              open={openStages[2]}
              accent={BLUE}
            />
            {openStages[2] && (
              <div className="px-3 pb-4 space-y-3">
                <div className="rounded-lg p-3 text-xs" style={{ background: `hsl(${BLUE} / 0.06)`, border: `1px dashed hsl(${BLUE} / 0.3)` }}>
                  <p className="font-semibold flex items-center gap-1.5 mb-1" style={{ color: `hsl(${BLUE})` }}>
                    <Sparkles className="w-3.5 h-3.5" /> Dica visual
                  </p>
                  <p className="text-muted-foreground leading-relaxed">
                    Boa iluminação, mesmo ângulo e mesma roupa das fotos anteriores. O envio já é confirmado automaticamente ao concluir o upload.
                  </p>
                </div>
                <BodyImageUpload
                  userId={userId}
                  existingImages={existingImages}
                  canDeleteExisting={false}
                  required={false}
                  draftKey={imageDraftKey}
                  onComplete={handleStage2Complete}
                />
              </div>
            )}
          </div>

          {/* ETAPA 3 */}
          <div className="rounded-xl border border-border/60" data-tour="evolution-stage-3">
            <StageHeader
              n={3}
              icon={<Activity className="w-4 h-4" style={{ color: `hsl(${AMBER})` }} />}
              title="Rotina de atividades"
              subtitle="Atualize apenas se houve mudança real na rotina"
              done={stage3Done}
              open={openStages[3]}
              accent={AMBER}
            />
            {openStages[3] && (
              <div className="px-3 pb-4 space-y-4">
                <div className="rounded-lg p-3 text-xs" style={{ background: `hsl(${AMBER} / 0.06)`, border: `1px dashed hsl(${AMBER} / 0.3)` }}>
                  <p className="font-semibold flex items-center gap-1.5 mb-1" style={{ color: `hsl(${AMBER})` }}>
                    <Sparkles className="w-3.5 h-3.5" /> Atualize só se mudou
                  </p>
                  <p className="text-muted-foreground leading-relaxed">
                    Só ative essa etapa se houve mudança real por demanda <strong>social</strong>, <strong>profissional</strong> ou de <strong>saúde</strong> (ex.: novo emprego, lesão, mudança de treino). Alterar sem necessidade recalcula seus macros à toa.
                  </p>
                </div>
                <EvolutionActivityChange profile={profile} value={activityChange} onChange={setActivityChange} />
                <Button
                  className="w-full"
                  onClick={() => setConfirmStage(3)}
                  disabled={savingStage === 3 || !canSubmitStage3}
                  style={
                    canSubmitStage3 && savingStage !== 3
                      ? { background: `hsl(${AMBER})`, color: "hsl(0 0% 100%)", boxShadow: `0 0 20px hsl(${AMBER} / 0.35)` }
                      : undefined
                  }
                >
                  {savingStage === 3 ? "Salvando..." : "Confirmar & salvar etapa 3"}
                </Button>
              </div>
            )}
          </div>

          {completedCount === 3 && (
            <div className="mt-3 rounded-xl p-4 text-center" style={{ background: `hsl(${GREEN} / 0.08)`, border: `1px solid hsl(${GREEN} / 0.3)` }}>
              <Trophy className="w-6 h-6 mx-auto mb-1" style={{ color: `hsl(${GREEN})` }} />
              <p className="text-sm font-semibold" style={{ color: `hsl(${GREEN})` }}>Missão completa!</p>
              <p className="text-xs text-muted-foreground mt-1">Seu consultor já recebeu tudo. Continue firme 💪</p>
            </div>
          )}
        </CardContent>
      </Card>

      <AlertDialog open={confirmStage !== 0} onOpenChange={(o) => !o && setConfirmStage(0)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar envio da etapa {confirmStage}?</AlertDialogTitle>
            <AlertDialogDescription>
              {confirmStage === 1 && (
                <>
                  Vamos registrar: {weight ? <><strong>{Number(weight).toFixed(1)} kg</strong></> : "sem alteração de peso"}
                  {notes.trim() && <> e sua mensagem ao consultor</>}. Os macros serão recalculados se você informou peso novo.
                </>
              )}
              {confirmStage === 3 && activityChange && (
                <>
                  Confirme que sua rotina realmente mudou: <strong>{activityChange.physicalActivityLevel}</strong>, tipo <strong>{activityChange.activityType}</strong>
                  {activityChange.doesCardio ? ", com cardio" : ", sem cardio"}. Isso recalcula seus macros.
                </>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Revisar</AlertDialogCancel>
            <AlertDialogAction onClick={() => (confirmStage === 1 ? handleSaveStage1() : handleSaveStage3())}>
              Confirmar e salvar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <EvolutionTour
        open={tourOpen}
        onClose={handleCloseTour}
        onOpenVideo={() => {
          handleCloseTour();
          setVideoOpen(true);
        }}
      />
      <EvolutionTutorialVideoDialog open={videoOpen} onOpenChange={setVideoOpen} />
    </>
  );
};

export default EvolutionUpdateCard;
