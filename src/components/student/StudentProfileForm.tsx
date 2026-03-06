import { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import DocumentUpload from "@/components/shared/DocumentUpload";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Slider } from "@/components/ui/slider";
import { Loader2, Save, User, Mail } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { calculateAge, calculateMacros } from "@/lib/macro-calculator";
import {
  objectiveLabels, activityLabels,
  trainingIntensityOptions, cardioIntensityOptions,
  physicalActivityLevelOptions,
} from "@/lib/form-constants";

const phoneMask = (v: string) => {
  const d = v.replace(/\D/g, "").slice(0, 11);
  if (d.length <= 2) return `(${d}`;
  if (d.length <= 7) return `(${d.slice(0, 2)}) ${d.slice(2)}`;
  return `(${d.slice(0, 2)}) ${d.slice(2, 7)}-${d.slice(7)}`;
};

export interface ProfileFormData {
  full_name: string;
  phone: string;
  birth_date: string;
  height: string;
  weight: string;
  gender: string;
  physical_activity_level: string;
  activity_type: string;
  does_cardio: string;
  training_days_per_week: string;
  training_duration_minutes: string;
  training_intensity: string;
  cardio_days_per_week: string;
  cardio_duration_minutes: string;
  cardio_intensity: string;
  objective: string;
  current_protocol: string;
  comorbidities: string;
  additional_info: string;
}

export const emptyProfileForm: ProfileFormData = {
  full_name: "", phone: "", birth_date: "", height: "", weight: "",
  gender: "", physical_activity_level: "", activity_type: "", does_cardio: "",
  training_days_per_week: "", training_duration_minutes: "", training_intensity: "",
  cardio_days_per_week: "", cardio_duration_minutes: "", cardio_intensity: "",
  objective: "", current_protocol: "", comorbidities: "", additional_info: "",
};

export function profileFromDb(p: any): ProfileFormData {
  return {
    full_name: p.full_name || "",
    phone: p.phone || "",
    birth_date: p.birth_date || "",
    height: p.height?.toString() || "",
    weight: p.weight?.toString() || "",
    gender: p.gender || "",
    physical_activity_level: p.physical_activity_level || "",
    activity_type: p.activity_type || "",
    does_cardio: p.does_cardio === true ? "sim" : p.does_cardio === false ? "nao" : "",
    training_days_per_week: p.training_days_per_week?.toString() || "",
    training_duration_minutes: p.training_duration_minutes?.toString() || "",
    training_intensity: p.training_intensity || "",
    cardio_days_per_week: p.cardio_days_per_week?.toString() || "",
    cardio_duration_minutes: p.cardio_duration_minutes?.toString() || "",
    cardio_intensity: p.cardio_intensity || "",
    objective: p.objective || "",
    current_protocol: p.current_protocol || "",
    comorbidities: p.comorbidities || "",
    additional_info: p.additional_info || "",
  };
}

export function getPendingFields(form: ProfileFormData, hasImages: boolean): string[] {
  const pending: string[] = [];
  if (!form.full_name) pending.push("Nome completo");
  if (!form.phone) pending.push("Telefone");
  if (!form.gender) pending.push("Gênero");
  if (!form.birth_date) pending.push("Data de nascimento");
  if (!form.height) pending.push("Altura");
  if (!form.weight) pending.push("Peso");
  if (!form.physical_activity_level) pending.push("Nível de atividade física (NEAT)");
  if (!form.activity_type) pending.push("Tipo de atividade física");
  if (form.activity_type && form.activity_type !== "nenhuma") {
    if (!form.training_days_per_week) pending.push("Dias de treino por semana");
    if (!form.training_duration_minutes) pending.push("Duração do treino");
    if (!form.training_intensity) pending.push("Intensidade do treino");
  }
  if (!form.does_cardio) pending.push("Pratica cardio?");
  if (form.does_cardio === "sim") {
    if (!form.cardio_days_per_week) pending.push("Dias de cardio por semana");
    if (!form.cardio_duration_minutes) pending.push("Duração do cardio");
    if (!form.cardio_intensity) pending.push("Intensidade do cardio");
  }
  if (!form.objective) pending.push("Objetivo");
  if (!form.current_protocol) pending.push("Protocolo atual");
  if (!form.comorbidities) pending.push("Comorbidades");
  if (!hasImages) pending.push("Imagens corporais (3 fotos)");
  return pending;
}

interface Props {
  form: ProfileFormData;
  onChange: (form: ProfileFormData) => void;
  userId: string;
  isOnboarded: boolean;
  editing: boolean;
  onSaved: () => void;
  onCancel?: () => void;
  labExamUrl?: string | null;
  prescriptionUrl?: string | null;
  onDocumentUploaded?: () => void;
}

export default function StudentProfileForm({ form, onChange, userId, isOnboarded, editing, onSaved, onCancel, labExamUrl, prescriptionUrl, onDocumentUploaded }: Props) {
  const [saving, setSaving] = useState(false);

  const set = (field: keyof ProfileFormData, value: string) => {
    onChange({ ...form, [field]: value });
  };

  // Reset conditional fields
  useEffect(() => {
    if (form.activity_type === "nenhuma") {
      onChange({ ...form, training_days_per_week: "", training_duration_minutes: "", training_intensity: "" });
    }
  }, [form.activity_type]);

  useEffect(() => {
    if (form.does_cardio === "nao") {
      onChange({ ...form, cardio_days_per_week: "", cardio_duration_minutes: "", cardio_intensity: "" });
    }
  }, [form.does_cardio]);

  const showTrainingDetails = form.activity_type === "musculacao" || form.activity_type === "crossfit";
  const showCardioDetails = form.does_cardio === "sim";
  const age = form.birth_date ? calculateAge(form.birth_date) : null;

  const handleSave = async () => {
    if (!form.full_name) { toast.error("Nome completo é obrigatório"); return; }
    const phoneClean = form.phone.replace(/\D/g, "");
    if (phoneClean.length < 10) { toast.error("Telefone inválido"); return; }
    if (!form.gender) { toast.error("Selecione o gênero"); return; }
    if (!form.birth_date) { toast.error("Data de nascimento é obrigatória"); return; }
    if (!form.height || Number(form.height) <= 0) { toast.error("Altura é obrigatória"); return; }
    if (!form.weight || Number(form.weight) <= 0) { toast.error("Peso é obrigatório"); return; }
    if (!form.physical_activity_level) { toast.error("Selecione o nível de atividade física"); return; }
    if (!form.activity_type) { toast.error("Selecione o tipo de atividade física"); return; }
    if (form.activity_type !== "nenhuma") {
      if (!form.training_days_per_week) { toast.error("Informe os dias de treino"); return; }
      if (!form.training_duration_minutes) { toast.error("Informe a duração do treino"); return; }
      if (!form.training_intensity) { toast.error("Selecione a intensidade do treino"); return; }
    }
    if (!form.does_cardio) { toast.error("Informe se faz cardio"); return; }
    if (form.does_cardio === "sim") {
      if (!form.cardio_days_per_week) { toast.error("Informe os dias de cardio"); return; }
      if (!form.cardio_duration_minutes) { toast.error("Informe a duração do cardio"); return; }
      if (!form.cardio_intensity) { toast.error("Selecione a intensidade do cardio"); return; }
    }
    if (!form.objective) { toast.error("Selecione o objetivo"); return; }
    if (!form.current_protocol.trim()) { toast.error("Protocolo atual é obrigatório"); return; }
    if (!form.comorbidities.trim()) { toast.error("Comorbidades é obrigatório"); return; }

    setSaving(true);
    try {
      const updateData: any = {
        full_name: form.full_name,
        phone: form.phone,
        birth_date: form.birth_date || null,
        height: Number(form.height),
        weight: Number(form.weight),
        gender: form.gender,
        activity_type: form.activity_type,
        does_cardio: form.does_cardio === "sim",
        physical_activity: `${activityLabels[form.activity_type] || form.activity_type}${form.does_cardio === "sim" ? " + Cardio" : ""}`,
        physical_activity_level: form.physical_activity_level || null,
        objective: form.objective,
        current_protocol: form.current_protocol,
        comorbidities: form.comorbidities,
        additional_info: form.additional_info,
        training_days_per_week: form.training_days_per_week ? Number(form.training_days_per_week) : null,
        training_duration_minutes: form.training_duration_minutes ? Number(form.training_duration_minutes) : null,
        training_intensity: form.training_intensity || null,
        cardio_days_per_week: form.cardio_days_per_week ? Number(form.cardio_days_per_week) : null,
        cardio_duration_minutes: form.cardio_duration_minutes ? Number(form.cardio_duration_minutes) : null,
        cardio_intensity: form.cardio_intensity || null,
      };

      // Calculate macros
      if (form.gender && form.weight && form.height && form.birth_date && form.activity_type && form.does_cardio && form.objective) {
        const a = calculateAge(form.birth_date);
        if (a > 0 && a < 120) {
          const macroResult = calculateMacros({
            gender: form.gender as "masculino" | "feminino",
            age: a, weight: Number(form.weight), height: Number(form.height),
            activityType: form.activity_type,
            doesCardio: form.does_cardio === "sim",
            objective: form.objective,
            physicalActivityLevel: form.physical_activity_level || undefined,
            trainingDaysPerWeek: form.training_days_per_week ? Number(form.training_days_per_week) : undefined,
            trainingDurationMinutes: form.training_duration_minutes ? Number(form.training_duration_minutes) : undefined,
            trainingIntensity: form.training_intensity || undefined,
            cardioDaysPerWeek: form.cardio_days_per_week ? Number(form.cardio_days_per_week) : undefined,
            cardioDurationMinutes: form.cardio_duration_minutes ? Number(form.cardio_duration_minutes) : undefined,
            cardioIntensity: form.cardio_intensity || undefined,
          });
          updateData.bmr = macroResult.bmr;
          updateData.tdee = macroResult.tdee;
          updateData.daily_calories = macroResult.dailyCalories;
          updateData.protein_g = macroResult.proteinG;
          updateData.carbs_g = macroResult.carbsG;
          updateData.fat_g = macroResult.fatG;
        }
      }

      const { error } = await supabase.from("profiles").update(updateData).eq("user_id", userId);
      if (error) throw error;
      toast.success("Dados salvos com sucesso!");
      onSaved();
    } catch (e: any) {
      toast.error(e.message || "Erro ao salvar");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Card className="mb-6 animate-fade-in">
      <CardHeader className="pb-3 flex flex-row items-center justify-between">
        <CardTitle className="text-base font-display flex items-center gap-2">
          <User className="w-4 h-4" /> {isOnboarded ? "Editar Minha Ficha" : "Complete seus dados"}
        </CardTitle>
        {isOnboarded && onCancel && (
          <Button variant="ghost" size="sm" onClick={onCancel}>Cancelar</Button>
        )}
      </CardHeader>
      <CardContent className="space-y-5">
        {/* Dados pessoais */}
        <div className="grid md:grid-cols-2 gap-4">
          <div>
            <Label className="font-body">Nome completo *</Label>
            <Input value={form.full_name} onChange={(e) => set("full_name", e.target.value)} />
          </div>
          <div>
            <Label className="font-body">Telefone *</Label>
            <Input value={form.phone} onChange={(e) => set("phone", phoneMask(e.target.value))} placeholder="(00) 00000-0000" />
          </div>
          <div>
            <Label className="font-body">Gênero *</Label>
            <Select value={form.gender} onValueChange={(v) => set("gender", v)}>
              <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="masculino">Masculino</SelectItem>
                <SelectItem value="feminino">Feminino</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label className="font-body">Data de nascimento *{age ? ` (${age} anos)` : ""}</Label>
            <Input type="date" value={form.birth_date} onChange={(e) => set("birth_date", e.target.value)} />
          </div>
          <div>
            <Label className="font-body">Altura (cm) *</Label>
            <Input type="number" value={form.height} onChange={(e) => set("height", e.target.value)} />
          </div>
          <div>
            <Label className="font-body">Peso (kg) *</Label>
            <Input type="number" value={form.weight} onChange={(e) => set("weight", e.target.value)} />
          </div>
        </div>

        {/* Nível de atividade física (NEAT) */}
        <div>
          <Label className="font-body font-semibold">Nível de Atividade Física (NEAT) *</Label>
          <p className="text-xs text-muted-foreground mb-2">Fora dos treinos — sua rotina diária</p>
          <RadioGroup value={form.physical_activity_level} onValueChange={(v) => set("physical_activity_level", v)} className="space-y-2">
            {physicalActivityLevelOptions.map((o) => (
              <div key={o.value} className="flex items-start gap-2">
                <RadioGroupItem value={o.value} id={`pal-${o.value}`} className="mt-1" />
                <label htmlFor={`pal-${o.value}`} className="text-sm cursor-pointer">
                  <span className="font-medium">{o.label}</span>
                  <span className="text-muted-foreground"> — {o.desc}</span>
                </label>
              </div>
            ))}
          </RadioGroup>
        </div>

        {/* Tipo de atividade */}
        <div>
          <Label className="font-body font-semibold">Tipo de atividade física *</Label>
          <RadioGroup value={form.activity_type} onValueChange={(v) => set("activity_type", v)} className="flex gap-4 mt-1">
            {Object.entries(activityLabels).map(([val, lab]) => (
              <div key={val} className="flex items-center gap-2">
                <RadioGroupItem value={val} id={`act-${val}`} />
                <label htmlFor={`act-${val}`} className="text-sm cursor-pointer">{lab}</label>
              </div>
            ))}
          </RadioGroup>
        </div>

        {/* Detalhes treino */}
        {showTrainingDetails && (
          <div className="border rounded-lg p-4 space-y-3 bg-muted/30">
            <p className="text-sm font-semibold">Detalhes do treino</p>
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <Label className="font-body text-xs">Dias por semana *</Label>
                <div className="flex items-center gap-3">
                  <Slider min={1} max={7} step={1} value={[Number(form.training_days_per_week) || 1]}
                    onValueChange={([v]) => set("training_days_per_week", v.toString())} className="flex-1" />
                  <span className="text-sm font-bold w-6 text-center">{form.training_days_per_week || "—"}</span>
                </div>
              </div>
              <div>
                <Label className="font-body text-xs">Duração (min) *</Label>
                <div className="flex items-center gap-3">
                  <Slider min={15} max={180} step={5} value={[Number(form.training_duration_minutes) || 60]}
                    onValueChange={([v]) => set("training_duration_minutes", v.toString())} className="flex-1" />
                  <span className="text-sm font-bold w-10 text-center">{form.training_duration_minutes || "—"}</span>
                </div>
              </div>
            </div>
            <div>
              <Label className="font-body text-xs">Intensidade *</Label>
              <RadioGroup value={form.training_intensity} onValueChange={(v) => set("training_intensity", v)} className="space-y-1 mt-1">
                {trainingIntensityOptions.map((o) => (
                  <div key={o.value} className="flex items-start gap-2">
                    <RadioGroupItem value={o.value} id={`ti-${o.value}`} className="mt-0.5" />
                    <label htmlFor={`ti-${o.value}`} className="text-xs cursor-pointer">
                      <span className="font-medium">{o.label}</span>
                      <span className="text-muted-foreground"> — {o.desc}</span>
                    </label>
                  </div>
                ))}
              </RadioGroup>
            </div>
          </div>
        )}

        {/* Cardio */}
        <div>
          <Label className="font-body font-semibold">Pratica cardio? *</Label>
          <RadioGroup value={form.does_cardio} onValueChange={(v) => set("does_cardio", v)} className="flex gap-4 mt-1">
            <div className="flex items-center gap-2">
              <RadioGroupItem value="sim" id="cardio-sim" />
              <label htmlFor="cardio-sim" className="text-sm cursor-pointer">Sim</label>
            </div>
            <div className="flex items-center gap-2">
              <RadioGroupItem value="nao" id="cardio-nao" />
              <label htmlFor="cardio-nao" className="text-sm cursor-pointer">Não</label>
            </div>
          </RadioGroup>
        </div>

        {showCardioDetails && (
          <div className="border rounded-lg p-4 space-y-3 bg-muted/30">
            <p className="text-sm font-semibold">Detalhes do cardio</p>
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <Label className="font-body text-xs">Dias por semana *</Label>
                <div className="flex items-center gap-3">
                  <Slider min={1} max={7} step={1} value={[Number(form.cardio_days_per_week) || 1]}
                    onValueChange={([v]) => set("cardio_days_per_week", v.toString())} className="flex-1" />
                  <span className="text-sm font-bold w-6 text-center">{form.cardio_days_per_week || "—"}</span>
                </div>
              </div>
              <div>
                <Label className="font-body text-xs">Duração (min) *</Label>
                <div className="flex items-center gap-3">
                  <Slider min={10} max={120} step={5} value={[Number(form.cardio_duration_minutes) || 30]}
                    onValueChange={([v]) => set("cardio_duration_minutes", v.toString())} className="flex-1" />
                  <span className="text-sm font-bold w-10 text-center">{form.cardio_duration_minutes || "—"}</span>
                </div>
              </div>
            </div>
            <div>
              <Label className="font-body text-xs">Intensidade *</Label>
              <RadioGroup value={form.cardio_intensity} onValueChange={(v) => set("cardio_intensity", v)} className="space-y-1 mt-1">
                {cardioIntensityOptions.map((o) => (
                  <div key={o.value} className="flex items-start gap-2">
                    <RadioGroupItem value={o.value} id={`ci-${o.value}`} className="mt-0.5" />
                    <label htmlFor={`ci-${o.value}`} className="text-xs cursor-pointer">
                      <span className="font-medium">{o.label}</span>
                      <span className="text-muted-foreground"> — {o.desc}</span>
                    </label>
                  </div>
                ))}
              </RadioGroup>
            </div>
          </div>
        )}

        {/* Objetivo */}
        <div>
          <Label className="font-body font-semibold">Objetivo *</Label>
          <RadioGroup value={form.objective} onValueChange={(v) => set("objective", v)} className="flex gap-4 mt-1">
            {Object.entries(objectiveLabels).map(([val, lab]) => (
              <div key={val} className="flex items-center gap-2">
                <RadioGroupItem value={val} id={`obj-${val}`} />
                <label htmlFor={`obj-${val}`} className="text-sm cursor-pointer">{lab}</label>
              </div>
            ))}
          </RadioGroup>
        </div>

        {/* Protocolo e comorbidades */}
        <div>
          <Label className="font-body">Protocolo atual *</Label>
          <Textarea value={form.current_protocol} onChange={(e) => set("current_protocol", e.target.value)} rows={2} />
        </div>
        <div>
          <Label className="font-body">Comorbidades *</Label>
          <Textarea value={form.comorbidities} onChange={(e) => set("comorbidities", e.target.value)} rows={2} />
        </div>
        <div>
          <Label className="font-body">Informações adicionais</Label>
          <Textarea value={form.additional_info} onChange={(e) => set("additional_info", e.target.value)} rows={2} placeholder="Alergias, preferências alimentares, etc." />
        </div>

        {/* Document uploads */}
        <DocumentUpload
          userId={userId}
          labExamUrl={labExamUrl}
          prescriptionUrl={prescriptionUrl}
          onUploaded={onDocumentUploaded || (() => {})}
        />

        <Button onClick={handleSave} disabled={saving} className="w-full">
          {saving ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Salvando...</> : <><Save className="w-4 h-4 mr-2" /> Salvar dados</>}
        </Button>
      </CardContent>
    </Card>
  );
}
