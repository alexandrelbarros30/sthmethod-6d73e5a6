import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Plus, Activity, Trash2, Edit2, BarChart3 } from "lucide-react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import StudentBioimpedancePanel from "@/components/student/StudentBioimpedancePanel";

interface Props {
  userId: string;
  studentName: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const emptyForm = {
  total_weight: "", body_fat_pct: "", fat_mass_kg: "", lean_mass_kg: "",
  skeletal_muscle_kg: "", total_water_pct: "", total_water_l: "",
  intracellular_water_l: "", extracellular_water_l: "",
  bmr_kcal: "", metabolic_age: "", visceral_fat: "",
  seg_left_arm: "", seg_right_arm: "", seg_left_leg: "",
  seg_right_leg: "", seg_trunk: "", phase_angle: "", notes: "",
  logged_at: new Date().toISOString().split("T")[0],
};

type FormData = typeof emptyForm;

const fieldGroups = [
  {
    title: "Composição Corporal",
    fields: [
      { key: "total_weight", label: "Peso Total (kg)", step: "0.1" },
      { key: "body_fat_pct", label: "Gordura Corporal (%)", step: "0.1" },
      { key: "fat_mass_kg", label: "Massa de Gordura (kg)", step: "0.1" },
      { key: "lean_mass_kg", label: "Massa Magra (kg)", step: "0.1" },
      { key: "skeletal_muscle_kg", label: "Massa Muscular Esquelética (kg)", step: "0.1" },
    ],
  },
  {
    title: "Água Corporal",
    fields: [
      { key: "total_water_pct", label: "Água Total (%)", step: "0.1" },
      { key: "total_water_l", label: "Água Total (L)", step: "0.1" },
      { key: "intracellular_water_l", label: "Água Intracelular (L)", step: "0.1" },
      { key: "extracellular_water_l", label: "Água Extracelular (L)", step: "0.1" },
    ],
  },
  {
    title: "Indicadores Metabólicos",
    fields: [
      { key: "bmr_kcal", label: "TMB (kcal)", step: "1" },
      { key: "metabolic_age", label: "Idade Metabólica", step: "1" },
      { key: "visceral_fat", label: "Gordura Visceral", step: "0.1" },
    ],
  },
  {
    title: "Análise Segmentar",
    fields: [
      { key: "seg_left_arm", label: "Braço Esquerdo", step: "0.1" },
      { key: "seg_right_arm", label: "Braço Direito", step: "0.1" },
      { key: "seg_left_leg", label: "Perna Esquerda", step: "0.1" },
      { key: "seg_right_leg", label: "Perna Direita", step: "0.1" },
      { key: "seg_trunk", label: "Tronco", step: "0.1" },
    ],
  },
  {
    title: "Clínico",
    fields: [
      { key: "phase_angle", label: "Ângulo de Fase (°)", step: "0.01" },
    ],
  },
];

const AdminBioimpedance = ({ userId, studentName, open, onOpenChange }: Props) => {
  const qc = useQueryClient();
  const [form, setForm] = useState<FormData>({ ...emptyForm });
  const [saving, setSaving] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [profileLoaded, setProfileLoaded] = useState(false);

  const { data: logs, isLoading } = useQuery({
    queryKey: ["bioimpedance-logs", userId],
    queryFn: async () => {
      const { data } = await supabase
        .from("bioimpedance_logs")
        .select("*")
        .eq("user_id", userId)
        .order("logged_at", { ascending: false })
        .limit(20);
      return (data || []) as any[];
    },
    enabled: open && !!userId,
  });

  // Fetch profile to auto-fill weight and BMR
  const { data: studentProfile } = useQuery({
    queryKey: ["bio-profile-autofill", userId],
    queryFn: async () => {
      const { data } = await supabase
        .from("profiles")
        .select("weight, bmr")
        .eq("user_id", userId)
        .single();
      return data;
    },
    enabled: open && !!userId,
  });

  const resetForm = (applyProfile = true) => {
    const base = { ...emptyForm, logged_at: new Date().toISOString().split("T")[0] };
    if (applyProfile && studentProfile) {
      if (studentProfile.weight) base.total_weight = String(studentProfile.weight);
      if (studentProfile.bmr) base.bmr_kcal = String(studentProfile.bmr);
    }
    setForm(base);
    setEditingId(null);
  };

  // Auto-fill on first open when profile loads
  if (studentProfile && !profileLoaded && !editingId && !form.total_weight) {
    setProfileLoaded(true);
    const updated = { ...form };
    if (studentProfile.weight) updated.total_weight = String(studentProfile.weight);
    if (studentProfile.bmr) updated.bmr_kcal = String(studentProfile.bmr);
    setForm(updated);
  }

  const loadForEdit = (log: any) => {
    setEditingId(log.id);
    setForm({
      total_weight: log.total_weight?.toString() || "",
      body_fat_pct: log.body_fat_pct?.toString() || "",
      fat_mass_kg: log.fat_mass_kg?.toString() || "",
      lean_mass_kg: log.lean_mass_kg?.toString() || "",
      skeletal_muscle_kg: log.skeletal_muscle_kg?.toString() || "",
      total_water_pct: log.total_water_pct?.toString() || "",
      total_water_l: log.total_water_l?.toString() || "",
      intracellular_water_l: log.intracellular_water_l?.toString() || "",
      extracellular_water_l: log.extracellular_water_l?.toString() || "",
      bmr_kcal: log.bmr_kcal?.toString() || "",
      metabolic_age: log.metabolic_age?.toString() || "",
      visceral_fat: log.visceral_fat?.toString() || "",
      seg_left_arm: log.seg_left_arm?.toString() || "",
      seg_right_arm: log.seg_right_arm?.toString() || "",
      seg_left_leg: log.seg_left_leg?.toString() || "",
      seg_right_leg: log.seg_right_leg?.toString() || "",
      seg_trunk: log.seg_trunk?.toString() || "",
      phase_angle: log.phase_angle?.toString() || "",
      notes: log.notes || "",
      logged_at: log.logged_at ? new Date(log.logged_at).toISOString().split("T")[0] : "",
    });
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const payload: Record<string, any> = {
        user_id: userId,
        logged_at: form.logged_at ? new Date(form.logged_at).toISOString() : new Date().toISOString(),
        notes: form.notes,
      };

      const numericFields = [
        "total_weight", "body_fat_pct", "fat_mass_kg", "lean_mass_kg",
        "skeletal_muscle_kg", "total_water_pct", "total_water_l",
        "intracellular_water_l", "extracellular_water_l",
        "bmr_kcal", "visceral_fat",
        "seg_left_arm", "seg_right_arm", "seg_left_leg", "seg_right_leg",
        "seg_trunk", "phase_angle",
      ];

      numericFields.forEach((f) => {
        const val = form[f as keyof FormData];
        payload[f] = val ? Number(val) : null;
      });

      payload.metabolic_age = form.metabolic_age ? parseInt(form.metabolic_age) : null;

      if (editingId) {
        const { error } = await supabase.from("bioimpedance_logs")
          .update(payload as any)
          .eq("id", editingId);
        if (error) throw error;
        toast.success("Registro atualizado!");
      } else {
        const { error } = await supabase.from("bioimpedance_logs")
          .insert(payload as any);
        if (error) throw error;
        toast.success("Bioimpedância registrada!");
      }

      qc.invalidateQueries({ queryKey: ["bioimpedance-logs", userId] });
      resetForm();
    } catch (err: any) {
      toast.error("Erro: " + (err.message || "Tente novamente"));
    }
    setSaving(false);
  };

  const handleDelete = async (id: string) => {
    try {
      const { error } = await supabase.from("bioimpedance_logs")
        .delete()
        .eq("id", id);
      if (error) throw error;
      qc.invalidateQueries({ queryKey: ["bioimpedance-logs", userId] });
      toast.success("Registro excluído!");
      if (editingId === id) resetForm();
    } catch {
      toast.error("Erro ao excluir registro");
    }
  };

  const setField = (key: string, value: string) => setForm((f) => ({ ...f, [key]: value }));

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) resetForm(); onOpenChange(v); }}>
      <DialogContent className="max-w-2xl max-h-[85dvh] w-[calc(100vw-1rem)] flex flex-col overflow-hidden p-3 sm:p-6">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Activity className="w-5 h-5 text-primary" />
            Bioimpedância — {studentName}
          </DialogTitle>
        </DialogHeader>

        <Tabs defaultValue="visualizar" className="w-full flex-1 flex flex-col min-h-0 overflow-hidden">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="visualizar" className="flex items-center gap-1.5">
              <BarChart3 className="w-3.5 h-3.5" />
              Visualizar
            </TabsTrigger>
            <TabsTrigger value="editar" className="flex items-center gap-1.5">
              <Edit2 className="w-3.5 h-3.5" />
              Editar
            </TabsTrigger>
          </TabsList>

          <TabsContent value="visualizar" className="flex-1 min-h-0 overflow-hidden mt-2">
            <div className="h-full overflow-y-auto pr-1 max-h-[calc(85dvh-8rem)]">
              <StudentBioimpedancePanel userId={userId} />
            </div>
          </TabsContent>

          <TabsContent value="editar" className="flex-1 min-h-0 overflow-hidden mt-2">
            <div className="h-full overflow-y-auto pr-1 max-h-[calc(85dvh-8rem)]">
              <div className="space-y-4">
                {/* Date */}
                <div>
                  <Label className="font-body text-sm">Data da Avaliação</Label>
                  <Input
                    type="date"
                    value={form.logged_at}
                    onChange={(e) => setField("logged_at", e.target.value)}
                  />
                </div>

                {/* Field groups */}
                {fieldGroups.map((group) => (
                  <Card key={group.title} className="border-border/50">
                    <CardHeader className="pb-2 pt-3 px-4">
                      <CardTitle className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                        {group.title}
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="px-4 pb-3">
                      <div className="grid grid-cols-2 gap-3">
                        {group.fields.map((field) => (
                          <div key={field.key}>
                            <Label className="text-xs font-body">{field.label}</Label>
                            <Input
                              type="number"
                              step={field.step}
                              value={form[field.key as keyof FormData]}
                              onChange={(e) => setField(field.key, e.target.value)}
                              placeholder="—"
                              className="h-8 text-sm"
                            />
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                ))}

                {/* Notes */}
                <div>
                  <Label className="text-xs font-body">Observações</Label>
                  <Textarea
                    value={form.notes}
                    onChange={(e) => setField("notes", e.target.value)}
                    rows={2}
                    placeholder="Observações sobre a avaliação..."
                  />
                </div>

                <div className="flex gap-2">
                  <Button onClick={handleSave} disabled={saving} className="flex-1">
                    {saving ? "Salvando..." : editingId ? "Atualizar Registro" : "Salvar Registro"}
                  </Button>
                  {editingId && (
                    <Button variant="outline" onClick={resetForm}>Cancelar edição</Button>
                  )}
                </div>

                {/* History */}
                {logs && logs.length > 0 && (
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm font-display">Histórico de Avaliações</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-2">
                      {logs.map((log: any) => (
                        <div
                          key={log.id}
                          className={`flex items-start justify-between border rounded-lg p-3 text-sm transition-colors ${
                            editingId === log.id ? "border-primary bg-primary/5" : "border-border/50"
                          }`}
                        >
                          <div className="flex-1 min-w-0">
                            <p className="font-semibold text-foreground">
                              {new Date(log.logged_at).toLocaleDateString("pt-BR")}
                            </p>
                            <div className="flex flex-wrap gap-2 mt-1">
                              {log.total_weight && (
                                <span className="text-xs bg-muted px-1.5 py-0.5 rounded">
                                  ⚖️ {Number(log.total_weight).toFixed(1)} kg
                                </span>
                              )}
                              {log.body_fat_pct && (
                                <span className="text-xs bg-destructive/10 text-destructive px-1.5 py-0.5 rounded">
                                  🔥 {Number(log.body_fat_pct).toFixed(1)}% gordura
                                </span>
                              )}
                              {log.lean_mass_kg && (
                                <span className="text-xs bg-primary/10 text-primary px-1.5 py-0.5 rounded">
                                  💪 {Number(log.lean_mass_kg).toFixed(1)} kg magra
                                </span>
                              )}
                              {log.skeletal_muscle_kg && (
                                <span className="text-xs bg-info/10 text-info px-1.5 py-0.5 rounded">
                                  🏋️ {Number(log.skeletal_muscle_kg).toFixed(1)} kg muscular
                                </span>
                              )}
                              {log.visceral_fat != null && (
                                <span className="text-xs bg-destructive/10 text-destructive px-1.5 py-0.5 rounded">
                                  🫀 Visceral: {log.visceral_fat}
                                </span>
                              )}
                            </div>
                            {log.notes && (
                              <p className="text-xs text-muted-foreground mt-1">{log.notes}</p>
                            )}
                          </div>
                          <div className="flex gap-1 ml-2 shrink-0">
                            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => loadForEdit(log)}>
                              <Edit2 className="w-3.5 h-3.5" />
                            </Button>
                            <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => handleDelete(log.id)}>
                              <Trash2 className="w-3.5 h-3.5" />
                            </Button>
                          </div>
                        </div>
                      ))}
                    </CardContent>
                  </Card>
                )}

                {isLoading && <p className="text-sm text-muted-foreground text-center py-4">Carregando...</p>}
                {!isLoading && (!logs || logs.length === 0) && (
                  <p className="text-sm text-muted-foreground text-center py-4">
                    Nenhuma avaliação de bioimpedância registrada.
                  </p>
                )}
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
};

export default AdminBioimpedance;
