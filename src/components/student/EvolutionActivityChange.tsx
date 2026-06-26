import { useState, useEffect } from "react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Activity, Dumbbell, HeartPulse } from "lucide-react";
import {
  physicalActivityLevelOptions,
  activityLabels,
  trainingIntensityOptions,
  cardioIntensityOptions,
} from "@/lib/form-constants";

export interface ActivityData {
  physicalActivityLevel: string;
  activityType: string;
  trainingDaysPerWeek: number | null;
  trainingDurationMinutes: number | null;
  trainingIntensity: string | null;
  doesCardio: boolean;
  cardioDaysPerWeek: number | null;
  cardioDurationMinutes: number | null;
  cardioIntensity: string | null;
}

interface Props {
  profile: any;
  onChange: (data: ActivityData | null) => void;
  value?: ActivityData | null;
}

const EvolutionActivityChange = ({ profile, onChange, value }: Props) => {
  const [changed, setChanged] = useState(() => Boolean(value));
  const [data, setData] = useState<ActivityData>(() => value || {
    physicalActivityLevel: profile?.physical_activity_level || "sedentario",
    activityType: profile?.activity_type || "nenhuma",
    trainingDaysPerWeek: profile?.training_days_per_week ?? null,
    trainingDurationMinutes: profile?.training_duration_minutes ?? null,
    trainingIntensity: profile?.training_intensity ?? null,
    doesCardio: profile?.does_cardio || false,
    cardioDaysPerWeek: profile?.cardio_days_per_week ?? null,
    cardioDurationMinutes: profile?.cardio_duration_minutes ?? null,
    cardioIntensity: profile?.cardio_intensity ?? null,
  });

  useEffect(() => {
    if (!value) return;
    setChanged(true);
    setData(value);
  }, [value]);

  useEffect(() => {
    onChange(changed ? data : null);
  }, [changed, data]);

  const update = (partial: Partial<ActivityData>) => {
    setData((prev) => ({ ...prev, ...partial }));
  };

  const showTrainingDetails = data.activityType !== "nenhuma";

  return (
    <div className="space-y-4 border border-border rounded-lg p-4 bg-muted/30">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Activity className="w-4 h-4 text-foreground" />
          <Label className="font-body font-medium text-sm">Houve alteração na rotina de atividades físicas?</Label>
        </div>
        <Switch checked={changed} onCheckedChange={setChanged} />
      </div>

      {!changed && (
        <p className="text-xs text-muted-foreground">
          Se sua rotina de treinos ou cardio mudou, ative esta opção para atualizar os cálculos.
        </p>
      )}

      {changed && (
        <div className="space-y-4 animate-in fade-in slide-in-from-top-2 duration-300">
          {/* NEAT */}
          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">Nível de Atividade Diária (NEAT)</Label>
            <Select value={data.physicalActivityLevel} onValueChange={(v) => update({ physicalActivityLevel: v })}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {physicalActivityLevelOptions.map((o) => (
                  <SelectItem key={o.value} value={o.value}>{o.label} — {o.desc}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Activity Type */}
          <div className="space-y-1">
            <div className="flex items-center gap-1.5">
              <Dumbbell className="w-3.5 h-3.5 text-foreground" />
              <Label className="text-xs text-muted-foreground">Tipo de Atividade</Label>
            </div>
            <Select value={data.activityType} onValueChange={(v) => update({ activityType: v })}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {Object.entries(activityLabels).map(([k, v]) => (
                  <SelectItem key={k} value={k}>{v}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Training Details */}
          {showTrainingDetails && (
            <div className="grid grid-cols-3 gap-2">
              <div className="space-y-1">
                <Label className="text-xs text-muted-foreground">Dias/semana</Label>
                <Input
                  type="number" min={1} max={7}
                  value={data.trainingDaysPerWeek ?? ""}
                  onChange={(e) => update({ trainingDaysPerWeek: e.target.value ? Number(e.target.value) : null })}
                />
              </div>
              <div className="space-y-1">
                <Label className="text-xs text-muted-foreground">Duração (min)</Label>
                <Input
                  type="number" min={10} max={180}
                  value={data.trainingDurationMinutes ?? ""}
                  onChange={(e) => update({ trainingDurationMinutes: e.target.value ? Number(e.target.value) : null })}
                />
              </div>
              <div className="space-y-1">
                <Label className="text-xs text-muted-foreground">Intensidade</Label>
                <Select value={data.trainingIntensity || ""} onValueChange={(v) => update({ trainingIntensity: v })}>
                  <SelectTrigger><SelectValue placeholder="—" /></SelectTrigger>
                  <SelectContent>
                    {trainingIntensityOptions.map((o) => (
                      <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}

          {/* Cardio toggle */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <HeartPulse className="w-3.5 h-3.5 text-foreground" />
              <Label className="text-xs text-muted-foreground">Pratica cardio?</Label>
            </div>
            <Switch checked={data.doesCardio} onCheckedChange={(v) => update({ doesCardio: v })} />
          </div>

          {/* Cardio Details */}
          {data.doesCardio && (
            <div className="grid grid-cols-3 gap-2">
              <div className="space-y-1">
                <Label className="text-xs text-muted-foreground">Dias/semana</Label>
                <Input
                  type="number" min={1} max={7}
                  value={data.cardioDaysPerWeek ?? ""}
                  onChange={(e) => update({ cardioDaysPerWeek: e.target.value ? Number(e.target.value) : null })}
                />
              </div>
              <div className="space-y-1">
                <Label className="text-xs text-muted-foreground">Duração (min)</Label>
                <Input
                  type="number" min={10} max={180}
                  value={data.cardioDurationMinutes ?? ""}
                  onChange={(e) => update({ cardioDurationMinutes: e.target.value ? Number(e.target.value) : null })}
                />
              </div>
              <div className="space-y-1">
                <Label className="text-xs text-muted-foreground">Intensidade</Label>
                <Select value={data.cardioIntensity || ""} onValueChange={(v) => update({ cardioIntensity: v })}>
                  <SelectTrigger><SelectValue placeholder="—" /></SelectTrigger>
                  <SelectContent>
                    {cardioIntensityOptions.map((o) => (
                      <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default EvolutionActivityChange;
