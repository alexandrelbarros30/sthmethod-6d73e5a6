import { useEffect, useMemo, useState } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { TrendingUp, Scale, Camera, CheckCircle2, ChevronLeft, ChevronRight, ClipboardCheck, Activity, AlertCircle, Clock } from "lucide-react";
import { Ruler, MessageSquare } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import BodyImageUpload from "@/components/shared/BodyImageUpload";
import DocumentUpload from "@/components/shared/DocumentUpload";
import { calculateAge, calculateMacros } from "@/lib/macro-calculator";
import EvolutionImageHistory from "@/components/student/EvolutionImageHistory";
import EvolutionActivityChange, { type ActivityData } from "@/components/student/EvolutionActivityChange";
import { createEvolutionSnapshot } from "@/lib/evolution-snapshot";
import { notifyStudentSelfUpdate } from "@/lib/notify-student-self-update";
import { useEvolutionStatus } from "@/hooks/useEvolutionStatus";
import { cn } from "@/lib/utils";

const STEPS = [
  { id: 1, label: "Peso", icon: Scale },
  { id: 2, label: "Fotos", icon: Camera },
  { id: 3, label: "Rotina", icon: Activity },
  { id: 4, label: "Confirmar", icon: ClipboardCheck },
] as const;

const emptyMeasurements = { waist: "", hip: "", chest: "", arm: "", thigh: "", calf: "" };

const hasDraftContent = (draft: {
  weight: string;
  notes: string;
  studentMessage: string;
  measurements: typeof emptyMeasurements;
  activityChange: ActivityData | null;
  imagesSaved: boolean;
  step: number;
}) =>
  Boolean(
    draft.weight ||
      draft.notes.trim() ||
      draft.studentMessage.trim() ||
      Object.values(draft.measurements).some((v) => v.trim()) ||
      draft.activityChange ||
      draft.imagesSaved ||
      draft.step > 1
  );

const StudentEvolution = () => {
  const { user } = useAuth();
  const qc = useQueryClient();
  const [weight, setWeight] = useState("");
  const [notes, setNotes] = useState("");
  const [studentMessage, setStudentMessage] = useState("");
  const [measurements, setMeasurements] = useState<{
    waist: string;
    hip: string;
    chest: string;
    arm: string;
    thigh: string;
    calf: string;
  }>(emptyMeasurements);
  const [saving, setSaving] = useState(false);
  const [imagesSaved, setImagesSaved] = useState(false);
  const [activityChange, setActivityChange] = useState<ActivityData | null>(null);
  const [step, setStep] = useState<1 | 2 | 3 | 4>(1);
  const [draftReady, setDraftReady] = useState(false);
  const draftKey = user?.id ? `sth:evolution-draft:v2:${user.id}` : null;
  const imageDraftKey = user?.id ? `sth:evolution-images:v2:${user.id}` : undefined;
  const hasMeasurements = Object.values(measurements).some((v) => v.trim() !== "");
  const canSubmitUpdate = Boolean(
    weight || activityChange || imagesSaved || notes.trim() || studentMessage.trim() || hasMeasurements
  );

  const { data: status } = useEvolutionStatus();

  useEffect(() => {
    if (!draftKey) return;
    try {
      const raw = localStorage.getItem(draftKey);
      if (raw) {
        const draft = JSON.parse(raw);
        setWeight(draft.weight || "");
        setNotes(draft.notes || "");
        setStudentMessage(draft.studentMessage || "");
        setMeasurements({ ...emptyMeasurements, ...(draft.measurements || {}) });
        setActivityChange(draft.activityChange || null);
        setImagesSaved(Boolean(draft.imagesSaved));
        if ([1, 2, 3, 4].includes(Number(draft.step))) setStep(Number(draft.step) as 1 | 2 | 3 | 4);
        if (hasDraftContent({
          weight: draft.weight || "",
          notes: draft.notes || "",
          studentMessage: draft.studentMessage || "",
          measurements: { ...emptyMeasurements, ...(draft.measurements || {}) },
          activityChange: draft.activityChange || null,
          imagesSaved: Boolean(draft.imagesSaved),
          step: Number(draft.step) || 1,
        })) {
          toast.info("Rascunho da evolução restaurado.");
        }
      }
    } catch (err) {
      console.warn("[evolution-draft] restore failed", err);
    } finally {
      setDraftReady(true);
    }
  }, [draftKey]);

  useEffect(() => {
    if (!draftKey || !draftReady) return;
    const draft = { weight, notes, studentMessage, measurements, activityChange, imagesSaved, step, updatedAt: new Date().toISOString() };
    if (hasDraftContent(draft)) localStorage.setItem(draftKey, JSON.stringify(draft));
    else localStorage.removeItem(draftKey);
  }, [draftKey, draftReady, weight, notes, studentMessage, measurements, activityChange, imagesSaved, step]);

  const { data: fullProfile } = useQuery({
    queryKey: ["student-profile-evo", user?.id],
    queryFn: async () => {
      const { data } = await supabase.from("profiles").select("*").eq("user_id", user!.id).single();
      return data;
    },
    enabled: !!user?.id,
  });

  const { data: currentImages, refetch: refetchImages } = useQuery({
    queryKey: ["body-images-current", user?.id],
    queryFn: async () => {
      const { data } = await supabase
        .from("body_images")
        .select("*")
        .eq("user_id", user!.id)
        .eq("is_current", true);
      return data || [];
    },
    enabled: !!user?.id,
  });

  const { data: weightLogs } = useQuery({
    queryKey: ["student-weight-logs", user?.id],
    queryFn: async () => {
      const { data } = await supabase
        .from("weight_logs")
        .select("*")
        .eq("user_id", user!.id)
        .order("logged_at", { ascending: false })
        .limit(10);
      return data || [];
    },
    enabled: !!user?.id,
  });

  const { data: allImages } = useQuery({
    queryKey: ["body-images-all", user?.id],
    queryFn: async () => {
      const { data } = await supabase
        .from("body_images")
        .select("*")
        .eq("user_id", user!.id)
        .order("uploaded_at", { ascending: false });
      return data || [];
    },
    enabled: !!user?.id,
  });

  const currentWeight = fullProfile?.weight;

  // Preview dos novos macros antes de salvar (etapa de confirmação)
  const previewMacros = useMemo(() => {
    if (!fullProfile?.birth_date || !fullProfile?.height || !fullProfile?.gender) return null;
    const newWeight = weight ? Number(weight) : (fullProfile.weight ? Number(fullProfile.weight) : null);
    if (!newWeight || !Number.isFinite(newWeight)) return null;
    const act = activityChange || {
      physicalActivityLevel: fullProfile.physical_activity_level || "sedentario",
      activityType: fullProfile.activity_type || "nenhuma",
      trainingDaysPerWeek: fullProfile.training_days_per_week ?? undefined,
      trainingDurationMinutes: fullProfile.training_duration_minutes ?? undefined,
      trainingIntensity: fullProfile.training_intensity ?? undefined,
      doesCardio: fullProfile.does_cardio || false,
      cardioDaysPerWeek: fullProfile.cardio_days_per_week ?? undefined,
      cardioDurationMinutes: fullProfile.cardio_duration_minutes ?? undefined,
      cardioIntensity: fullProfile.cardio_intensity ?? undefined,
    };
    const age = calculateAge(fullProfile.birth_date);
    return calculateMacros({
      gender: fullProfile.gender as "masculino" | "feminino",
      age,
      weight: newWeight,
      height: Number(fullProfile.height),
      activityType: act.activityType,
      doesCardio: act.doesCardio,
      objective: fullProfile.objective || "manter_peso",
      physicalActivityLevel: act.physicalActivityLevel,
      trainingDaysPerWeek: act.trainingDaysPerWeek || undefined,
      trainingDurationMinutes: act.trainingDurationMinutes || undefined,
      trainingIntensity: act.trainingIntensity || undefined,
      cardioDaysPerWeek: act.cardioDaysPerWeek || undefined,
      cardioDurationMinutes: act.cardioDurationMinutes || undefined,
      cardioIntensity: act.cardioIntensity || undefined,
    });
  }, [weight, activityChange, fullProfile]);

  const handleSaveWeight = async () => {
    if (!weight && !activityChange) {
      toast.error("Informe seu peso atual ou registre a mudança na rotina.");
      return;
    }

    setSaving(true);
    try {
      const hasNewWeight = Boolean(weight);
      const currentStoredWeight = fullProfile?.weight ? Number(fullProfile.weight) : null;
      const newWeight = hasNewWeight ? Number(weight) : currentStoredWeight;

      if (weight) {
        const { error } = await supabase.from("weight_logs").insert({
          user_id: user!.id,
          weight: newWeight,
          notes: notes || "",
          student_message: studentMessage || "",
          waist_cm: measurements.waist ? Number(measurements.waist) : null,
          hip_cm: measurements.hip ? Number(measurements.hip) : null,
          chest_cm: measurements.chest ? Number(measurements.chest) : null,
          arm_cm: measurements.arm ? Number(measurements.arm) : null,
          thigh_cm: measurements.thigh ? Number(measurements.thigh) : null,
          calf_cm: measurements.calf ? Number(measurements.calf) : null,
        });
        if (error) throw error;
        void notifyStudentSelfUpdate(user!.id, "weight");
      }

      // Use activity change data if provided, otherwise use profile values
      const act = activityChange || {
        physicalActivityLevel: fullProfile?.physical_activity_level || "sedentario",
        activityType: fullProfile?.activity_type || "nenhuma",
        trainingDaysPerWeek: fullProfile?.training_days_per_week ?? undefined,
        trainingDurationMinutes: fullProfile?.training_duration_minutes ?? undefined,
        trainingIntensity: fullProfile?.training_intensity ?? undefined,
        doesCardio: fullProfile?.does_cardio || false,
        cardioDaysPerWeek: fullProfile?.cardio_days_per_week ?? undefined,
        cardioDurationMinutes: fullProfile?.cardio_duration_minutes ?? undefined,
        cardioIntensity: fullProfile?.cardio_intensity ?? undefined,
      };

      let macroUpdate: Record<string, any> = hasNewWeight ? { weight: newWeight } : {};

      // If activity changed, also persist the new activity fields
      if (activityChange) {
        macroUpdate = {
          ...macroUpdate,
          physical_activity_level: activityChange.physicalActivityLevel,
          activity_type: activityChange.activityType,
          training_days_per_week: activityChange.trainingDaysPerWeek,
          training_duration_minutes: activityChange.trainingDurationMinutes,
          training_intensity: activityChange.trainingIntensity,
          does_cardio: activityChange.doesCardio,
          cardio_days_per_week: activityChange.cardioDaysPerWeek,
          cardio_duration_minutes: activityChange.cardioDurationMinutes,
          cardio_intensity: activityChange.cardioIntensity,
        };
      }

      if (fullProfile?.birth_date && fullProfile?.height && fullProfile?.gender && typeof newWeight === "number" && Number.isFinite(newWeight)) {
        const age = calculateAge(fullProfile.birth_date);
        const macros = calculateMacros({
          gender: fullProfile.gender as "masculino" | "feminino",
          age,
          weight: newWeight,
          height: Number(fullProfile.height),
          activityType: act.activityType,
          doesCardio: act.doesCardio,
          objective: fullProfile.objective || "manter_peso",
          physicalActivityLevel: act.physicalActivityLevel,
          trainingDaysPerWeek: act.trainingDaysPerWeek || undefined,
          trainingDurationMinutes: act.trainingDurationMinutes || undefined,
          trainingIntensity: act.trainingIntensity || undefined,
          cardioDaysPerWeek: act.cardioDaysPerWeek || undefined,
          cardioDurationMinutes: act.cardioDurationMinutes || undefined,
          cardioIntensity: act.cardioIntensity || undefined,
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

      await supabase.from("profiles").update(macroUpdate).eq("user_id", user!.id);

      // Anamnesis entry
      const timestamp = new Date().toLocaleString("pt-BR", { timeZone: "America/Sao_Paulo" });
      const prevWeight = currentWeight ? Number(currentWeight) : null;
      const weightDiff = prevWeight ? (newWeight - prevWeight).toFixed(1) : null;
      const weightDirection = weightDiff && Number(weightDiff) > 0 ? "+" : "";

      let anamnesisNote = `📊 ATUALIZAÇÃO DE EVOLUÇÃO — ${timestamp}\n\n`;
      if (hasNewWeight && typeof newWeight === "number" && Number.isFinite(newWeight)) {
        anamnesisNote += `⚖️ Peso: ${newWeight.toFixed(1)} kg`;
      } else {
        anamnesisNote += `⚖️ Peso: sem alteração informada`;
      }
      if (hasNewWeight && prevWeight) {
        anamnesisNote += ` (anterior: ${prevWeight.toFixed(1)} kg | variação: ${weightDirection}${weightDiff} kg)`;
      }
      anamnesisNote += "\n";

      if (activityChange) {
        anamnesisNote += `\n🏃 Rotina de atividade física alterada pelo aluno\n`;
      }

      if (macroUpdate.bmr) {
        anamnesisNote += `\n🔥 Macros recalculados:\n`;
        anamnesisNote += `  • TMB: ${macroUpdate.bmr} kcal\n`;
        anamnesisNote += `  • TDEE: ${macroUpdate.tdee} kcal\n`;
        anamnesisNote += `  • Meta calórica: ${macroUpdate.daily_calories} kcal\n`;
        anamnesisNote += `  • Proteína: ${macroUpdate.protein_g}g | Carbos: ${macroUpdate.carbs_g}g | Gordura: ${macroUpdate.fat_g}g\n`;
      }

      if (notes) {
        anamnesisNote += `\n📝 Observações do aluno: ${notes}\n`;
      }

      if (studentMessage) {
        anamnesisNote += `\n💬 Mensagem direta: ${studentMessage}\n`;
      }

      if (hasMeasurements) {
        anamnesisNote += `\n📏 Medidas (cm):`;
        const m = measurements;
        if (m.waist) anamnesisNote += ` cintura ${m.waist}`;
        if (m.hip) anamnesisNote += ` | quadril ${m.hip}`;
        if (m.chest) anamnesisNote += ` | busto ${m.chest}`;
        if (m.arm) anamnesisNote += ` | braço ${m.arm}`;
        if (m.thigh) anamnesisNote += ` | coxa ${m.thigh}`;
        if (m.calf) anamnesisNote += ` | panturrilha ${m.calf}`;
        anamnesisNote += `\n`;
      }

      if (imagesSaved) {
        anamnesisNote += `\n📸 Novas fotos corporais enviadas.\n`;
      }

      await supabase.from("anamnesis_entries").insert({
        user_id: user!.id,
        notes: anamnesisNote,
      });

      await createEvolutionSnapshot(user!.id, "student", anamnesisNote);

      // Update the evolution notification with photos flag if applicable
      if (imagesSaved) {
        // Get the most recent notification for this user (just created by trigger)
        const { data: recentNotif } = await supabase
          .from("evolution_notifications")
          .select("id")
          .eq("student_user_id", user!.id)
          .order("created_at", { ascending: false })
          .limit(1);
        if (recentNotif && recentNotif.length > 0) {
          await supabase
            .from("evolution_notifications")
            .update({ has_photos: true })
            .eq("id", recentNotif[0].id);
        }
      }

      toast.success("Evolução registrada com sucesso! Macros atualizados.");
      if (draftKey) localStorage.removeItem(draftKey);
      setWeight("");
      setNotes("");
      setStudentMessage("");
      setMeasurements(emptyMeasurements);
      setImagesSaved(false);
      setActivityChange(null);
      qc.invalidateQueries({ queryKey: ["student-weight-logs"] });
      qc.invalidateQueries({ queryKey: ["student-profile-evo"] });
      qc.invalidateQueries({ queryKey: ["student-full-profile"] });
      qc.invalidateQueries({ queryKey: ["evolution-status"] });
      setStep(1);
    } catch (err: any) {
      console.error(err);
      toast.error("Erro ao salvar: " + (err.message || "Tente novamente."));
    }
    setSaving(false);
  };

  // ---------- HEADER STATUS ----------
  const statusBlock = (() => {
    if (!status) return null;
    const cfg = {
      never: { Icon: TrendingUp, label: "Sem registros", desc: "Faça sua primeira atualização" },
      ok: { Icon: CheckCircle2, label: "Em dia", desc: `Próxima em ${status.daysUntilNext} dias` },
      approaching: { Icon: Clock, label: `Faltam ${status.daysUntilNext}d`, desc: "Atualização chegando" },
      due: { Icon: CheckCircle2, label: "Disponível", desc: "Ciclo de 29 dias completo" },
      late: { Icon: AlertCircle, label: `${Math.abs(status.daysUntilNext)}d atrasado`, desc: "Atualize para reajustar macros" },
    }[status.status];
    const Icon = cfg.Icon;
    const lastTxt = status.lastUpdateAt
      ? new Date(status.lastUpdateAt).toLocaleDateString("pt-BR", { day: "2-digit", month: "short", year: "numeric" })
      : "Nunca";
    return (
      <div className="rounded-3xl border border-border/40 bg-background p-5 mb-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-2xl bg-foreground/10 flex items-center justify-center shrink-0">
            <Icon className="w-4 h-4 text-foreground" strokeWidth={1.8} />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-[10px] font-medium tracking-[0.25em] uppercase text-muted-foreground">{cfg.label}</p>
            <p className="text-[13px] font-medium text-foreground tracking-tight mt-0.5">{cfg.desc}</p>
          </div>
          <div className="text-right">
            <p className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground">Última</p>
            <p className="text-[12px] font-medium text-foreground mt-0.5">{lastTxt}</p>
          </div>
        </div>
        {status.recentLogs.length > 0 && (
          <div className="flex gap-2 pt-3 border-t border-border/40">
            {status.recentLogs.slice(0, 3).map((l, i) => (
              <div key={i} className="flex-1 rounded-xl bg-foreground/[0.03] p-2.5 text-center">
                <p className="text-[14px] font-semibold tabular-nums text-foreground tracking-tight">{l.weight.toFixed(1)}<span className="text-[10px] text-muted-foreground font-light ml-0.5">kg</span></p>
                <p className="text-[9px] uppercase tracking-[0.15em] text-muted-foreground mt-1">
                  {new Date(l.logged_at).toLocaleDateString("pt-BR", { day: "2-digit", month: "short" })}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  })();

  // ---------- WIZARD STEPPER ----------
  const stepper = (
    <div className="flex items-center gap-1.5 mb-5">
      {STEPS.map((s) => {
        const isActive = step === s.id;
        const isDone = step > s.id;
        return (
          <button
            key={s.id}
            onClick={() => setStep(s.id as any)}
            className={cn(
              "flex-1 h-1.5 rounded-full transition-colors",
              isDone || isActive ? "bg-foreground" : "bg-foreground/15"
            )}
            aria-label={`Etapa ${s.id} - ${s.label}`}
          />
        );
      })}
    </div>
  );

  const currentStep = STEPS.find((s) => s.id === step)!;

  return (
    <DashboardLayout role="student" title="Atualização" subtitle="Registre seu progresso para acompanhamento profissional.">
      {statusBlock}

      <div className="rounded-3xl border border-border/40 bg-background p-6 mb-6 space-y-5">
        {stepper}
        <div>
          <p className="text-[10px] font-medium tracking-[0.25em] uppercase text-muted-foreground">
            Etapa {step} de {STEPS.length}
          </p>
          <p className="text-[11px] text-muted-foreground mt-1">Salvo automaticamente neste aparelho.</p>
          <h2 className="text-[22px] font-semibold text-foreground tracking-[-0.03em] leading-tight mt-1.5 flex items-center gap-2">
            <currentStep.icon className="w-5 h-5" strokeWidth={1.8} />
            {currentStep.label}
          </h2>
        </div>

        {/* STEP 1 — PESO */}
        {step === 1 && (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label className="font-body font-medium">Peso Atual (kg)</Label>
              <Input
                type="number"
                step="0.1"
                placeholder={currentWeight ? `Último registro: ${currentWeight} kg` : "Ex: 75.5"}
                value={weight}
                onChange={(e) => setWeight(e.target.value)}
                className="text-lg h-12"
              />
              {weight && currentWeight && (
                <p className="text-[12px] text-muted-foreground">
                  Variação: {(Number(weight) - Number(currentWeight)).toFixed(1)} kg em relação ao último registro.
                </p>
              )}
            </div>
            <div className="space-y-2">
              <Label className="font-body text-sm">Como você está se sentindo? (opcional)</Label>
              <Textarea
                placeholder="Energia, sono, treinos, fome..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={3}
              />
            </div>

            {/* Medidas corporais */}
            <div className="space-y-3 pt-2 border-t border-border/40">
              <div className="flex items-center gap-2">
                <Ruler className="w-4 h-4 text-muted-foreground" />
                <Label className="font-body font-medium text-sm">Medidas corporais (cm) — opcional</Label>
              </div>
              <p className="text-[11px] text-muted-foreground -mt-1">
                Use uma fita métrica. Preencha apenas o que conseguir medir.
              </p>
              <div className="grid grid-cols-2 gap-3">
                {([
                  { key: "waist", label: "Cintura" },
                  { key: "hip", label: "Quadril" },
                  { key: "chest", label: "Busto/Tórax" },
                  { key: "arm", label: "Braço" },
                  { key: "thigh", label: "Coxa" },
                  { key: "calf", label: "Panturrilha" },
                ] as const).map((f) => (
                  <div key={f.key} className="space-y-1">
                    <Label className="text-[11px] text-muted-foreground">{f.label}</Label>
                    <Input
                      type="number"
                      step="0.1"
                      inputMode="decimal"
                      placeholder="cm"
                      value={measurements[f.key]}
                      onChange={(e) =>
                        setMeasurements((prev) => ({ ...prev, [f.key]: e.target.value }))
                      }
                    />
                  </div>
                ))}
              </div>
            </div>

            {/* Mensagem direta */}
            <div className="space-y-2 pt-2 border-t border-border/40">
              <div className="flex items-center gap-2">
                <MessageSquare className="w-4 h-4 text-muted-foreground" />
                <Label className="font-body font-medium text-sm">Mensagem direta para a equipe (opcional)</Label>
              </div>
              <Textarea
                placeholder="Algo específico que precisa nos contar? Dúvida, dificuldade, pedido..."
                value={studentMessage}
                onChange={(e) => setStudentMessage(e.target.value)}
                rows={3}
              />
              <p className="text-[10px] text-muted-foreground">
                Sua mensagem chega direto no painel do admin junto com a atualização.
              </p>
            </div>
          </div>
        )}

        {/* STEP 2 — FOTOS */}
        {step === 2 && (
          <div className="space-y-3">
            <p className="text-[12px] text-muted-foreground">
              ⚠️ Suas fotos anteriores são <strong>preservadas</strong> no histórico. Envie 3 fotos atualizadas (frente, costas, lateral).
            </p>
            <BodyImageUpload
              userId={user!.id}
              existingImages={currentImages || []}
              canDeleteExisting={false}
              required={false}
              draftKey={imageDraftKey}
              onComplete={() => {
                setImagesSaved(true);
                refetchImages();
                qc.invalidateQueries({ queryKey: ["body-images-all"] });
                qc.invalidateQueries({ queryKey: ["body-images"] });
                toast.success("Fotos salvas!");
              }}
            />
            {imagesSaved && (
              <div className="flex items-center gap-2 text-sm text-foreground">
                <CheckCircle2 className="w-4 h-4" /> Fotos salvas com sucesso
              </div>
            )}
            <div className="pt-3 border-t border-border/40">
              <DocumentUpload userId={user!.id} />
            </div>
          </div>
        )}

        {/* STEP 3 — ROTINA */}
        {step === 3 && fullProfile && (
          <EvolutionActivityChange profile={fullProfile} value={activityChange} onChange={setActivityChange} />
        )}

        {/* STEP 4 — CONFIRMAÇÃO */}
        {step === 4 && (
          <div className="space-y-4">
            <p className="text-[12px] text-muted-foreground">Revise sua atualização antes de salvar:</p>

            <div className="rounded-2xl border border-border/40 divide-y divide-border/40">
              <div className="flex items-center justify-between p-3.5">
                <span className="text-[12px] text-muted-foreground uppercase tracking-[0.15em]">Peso</span>
                <span className="text-[14px] font-medium text-foreground tabular-nums">
                  {weight ? `${weight} kg` : currentWeight ? `${currentWeight} kg (sem alteração)` : "—"}
                </span>
              </div>
              <div className="flex items-center justify-between p-3.5">
                <span className="text-[12px] text-muted-foreground uppercase tracking-[0.15em]">Fotos</span>
                <span className="text-[14px] font-medium text-foreground">
                  {imagesSaved ? "✓ Novas enviadas" : "Sem novas fotos"}
                </span>
              </div>
              <div className="flex items-center justify-between p-3.5">
                <span className="text-[12px] text-muted-foreground uppercase tracking-[0.15em]">Rotina</span>
                <span className="text-[14px] font-medium text-foreground">
                  {activityChange ? "✓ Atualizada" : "Sem alteração"}
                </span>
              </div>
              <div className="flex items-center justify-between p-3.5">
                <span className="text-[12px] text-muted-foreground uppercase tracking-[0.15em]">Observações</span>
                <span className="text-[14px] font-medium text-foreground truncate max-w-[60%] text-right">
                  {notes.trim() ? notes.trim() : "—"}
                </span>
              </div>
              <div className="flex items-center justify-between p-3.5">
                <span className="text-[12px] text-muted-foreground uppercase tracking-[0.15em]">Medidas</span>
                <span className="text-[14px] font-medium text-foreground">
                  {hasMeasurements ? "✓ Enviadas" : "—"}
                </span>
              </div>
              <div className="flex items-center justify-between p-3.5">
                <span className="text-[12px] text-muted-foreground uppercase tracking-[0.15em]">Mensagem</span>
                <span className="text-[14px] font-medium text-foreground truncate max-w-[60%] text-right">
                  {studentMessage.trim() ? studentMessage.trim() : "—"}
                </span>
              </div>
            </div>

            {previewMacros && (
              <div className="rounded-2xl border border-foreground/20 bg-foreground/[0.04] p-4">
                <p className="text-[10px] font-medium tracking-[0.25em] uppercase text-muted-foreground mb-3">
                  Novos macros calculados
                </p>
                <div className="grid grid-cols-2 gap-3">
                  {[
                    { label: "TDEE", value: `${previewMacros.tdee} kcal` },
                    { label: "Meta calórica", value: `${previewMacros.dailyCalories} kcal` },
                    { label: "Proteína", value: `${previewMacros.proteinG} g` },
                    { label: "Carbos", value: `${previewMacros.carbsG} g` },
                    { label: "Gordura", value: `${previewMacros.fatG} g` },
                    { label: "TMB", value: `${previewMacros.bmr} kcal` },
                  ].map((m, i) => (
                    <div key={i} className="flex items-baseline justify-between">
                      <span className="text-[11px] text-muted-foreground tracking-tight">{m.label}</span>
                      <span className="text-[13px] font-semibold text-foreground tabular-nums">{m.value}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <Button
              className={`w-full h-12 transition-colors ${canSubmitUpdate && !saving ? "bg-foreground text-background hover:bg-foreground/90 shadow-[0_0_20px_hsl(var(--foreground)/0.2)]" : ""}`}
              onClick={handleSaveWeight}
              disabled={saving || !canSubmitUpdate}
            >
              {saving ? "Salvando..." : "Registrar evolução e atualizar macros"}
            </Button>
          </div>
        )}

        {/* NAVEGAÇÃO */}
        <div className="flex items-center justify-between pt-3 border-t border-border/40">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setStep((s) => (s > 1 ? ((s - 1) as any) : s))}
            disabled={step === 1}
            className="gap-1.5"
          >
            <ChevronLeft className="w-4 h-4" /> Voltar
          </Button>
          {step < 4 && (
            <Button
              size="sm"
              onClick={() => setStep((s) => ((s + 1) as any))}
              className="gap-1.5 bg-foreground text-background hover:bg-foreground/90"
            >
              Próximo <ChevronRight className="w-4 h-4" />
            </Button>
          )}
        </div>
      </div>

      <EvolutionImageHistory allImages={allImages || []} />
    </DashboardLayout>
  );
};

export default StudentEvolution;
