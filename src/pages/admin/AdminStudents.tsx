import { useState, useRef, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import DashboardLayout from "@/components/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Plus, Pencil, Trash2, CreditCard, Eye, FileText, Upload, Camera, Image, Search, ClipboardList, Download, Calculator, Check, Lock, Link2 } from "lucide-react";
import { getPlanTier, getPlanTierClasses } from "@/lib/plan-colors";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import BodyImageUpload from "@/components/shared/BodyImageUpload";
import ExcelJS from "exceljs";
import { calculateAge, calculateMacros, type MacroResult } from "@/lib/macro-calculator";
import {
  objectiveLabels, activityLabels,
  trainingIntensityOptions, cardioIntensityOptions,
  trainingIntensityLabels, cardioIntensityLabels,
  physicalActivityLevelOptions, physicalActivityLevelLabels,
} from "@/lib/form-constants";

const phoneMask = (v: string) => {
  const d = v.replace(/\D/g, "").slice(0, 11);
  if (d.length <= 2) return `(${d}`;
  if (d.length <= 7) return `(${d.slice(0, 2)}) ${d.slice(2)}`;
  return `(${d.slice(0, 2)}) ${d.slice(2, 7)}-${d.slice(7)}`;
};

const emptyForm = {
  full_name: "", email: "", password: "", phone: "",
  birth_date: "", height: "", weight: "",
  gender: "", activity_type: "", does_cardio: "",
  physical_activity_level: "",
  objective: "", current_protocol: "",
  comorbidities: "", additional_info: "",
  lab_exam_url: "", medical_prescription_url: "",
  // training/cardio detail fields
  training_days_per_week: "", training_duration_minutes: "", training_intensity: "",
  cardio_days_per_week: "", cardio_duration_minutes: "", cardio_intensity: "",
  // macro fields
  bmr: "", tdee: "", daily_calories: "", protein_g: "", carbs_g: "", fat_g: "",
};

const AdminStudents = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const qc = useQueryClient();
  const [createOpen, setCreateOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [subOpen, setSubOpen] = useState(false);
  const [viewOpen, setViewOpen] = useState(false);
  const [imagesOpen, setImagesOpen] = useState(false);
  const [selected, setSelected] = useState<any>(null);
  const [form, setForm] = useState({ ...emptyForm });
  const [subForm, setSubForm] = useState({ plan_id: "", start_date: "", end_date: "", status: "active" });
  const [uploading, setUploading] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [anamneseOpen, setAnamneseOpen] = useState(false);
  const [anamneseText, setAnamneseText] = useState("");
  const [importingStudents, setImportingStudents] = useState(false);
  const [importPreview, setImportPreview] = useState<any[] | null>(null);
  const [importDialogOpen, setImportDialogOpen] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [activeTab, setActiveTab] = useState("dados");
  const [savedTabs, setSavedTabs] = useState<Set<string>>(new Set());
  const [tabSaving, setTabSaving] = useState(false);
  const [passwordReset, setPasswordReset] = useState<{ userId: string; name: string } | null>(null);
  const [newPassword, setNewPassword] = useState("");

  const { data: students, isLoading } = useQuery({
    queryKey: ["admin-students-list"],
    queryFn: async () => {
      const { data: profiles } = await supabase.from("profiles").select("user_id, full_name, email, phone, birth_date, height, weight, physical_activity, objective, current_protocol, comorbidities, lab_exam_url, medical_prescription_url, avatar_url, onboarding_complete, created_at");
      if (!profiles) return [];
      const { data: subs } = await supabase.from("subscriptions").select("*, plans(name, duration_days)");
      return profiles.map((p: any) => {
        const sub = subs?.find((s: any) => s.user_id === p.user_id);
        return {
          ...p,
          plan: (sub as any)?.plans?.name || "—",
          planDurationDays: (sub as any)?.plans?.duration_days || null,
          subscription: sub || null,
          startDate: sub?.start_date || null,
          endDate: sub?.end_date || null,
          status: sub ? (sub.status === "active" && new Date(sub.end_date) > new Date() ? "active" : sub.status === "suspended" ? "suspended" : "expired") : "none",
          initials: p.full_name?.split(" ").map((n: string) => n[0]).join("").slice(0, 2).toUpperCase() || "?",
        };
      });
    },
  });

  const { data: plans } = useQuery({
    queryKey: ["admin-plans-list"],
    queryFn: async () => {
      const { data } = await supabase.from("plans").select("*").eq("active", true).order("duration_days");
      return data || [];
    },
  });

  const { data: selectedBodyImages, refetch: refetchBodyImages } = useQuery({
    queryKey: ["admin-body-images", selected?.user_id],
    queryFn: async () => {
      const { data } = await supabase.from("body_images").select("*").eq("user_id", selected!.user_id).eq("is_current", true);
      return data || [];
    },
    enabled: !!selected?.user_id,
  });

  const { data: anamneseEntries, refetch: refetchAnamnese } = useQuery({
    queryKey: ["admin-anamnese", selected?.user_id],
    queryFn: async () => {
      const { data } = await supabase
        .from("anamnesis_entries")
        .select("*")
        .eq("user_id", selected!.user_id)
        .order("created_at", { ascending: false });
      return data || [];
    },
    enabled: !!selected?.user_id && anamneseOpen,
  });

  const { data: anamneseBodyImages } = useQuery({
    queryKey: ["admin-anamnese-all-images", selected?.user_id],
    queryFn: async () => {
      const { data } = await supabase
        .from("body_images")
        .select("*")
        .eq("user_id", selected!.user_id)
        .order("uploaded_at", { ascending: false });
      return data || [];
    },
    enabled: !!selected?.user_id && anamneseOpen,
  });

  // Fetch full profile with new fields when editing/viewing
  const { data: selectedFullProfile } = useQuery({
    queryKey: ["admin-full-profile", selected?.user_id],
    queryFn: async () => {
      const { data } = await supabase.from("profiles").select("*").eq("user_id", selected!.user_id).single();
      return data;
    },
    enabled: !!selected?.user_id,
  });

  const filteredStudents = students?.filter((s: any) => {
    if (!searchTerm.trim()) return true;
    const term = searchTerm.toLowerCase();
    return (
      s.full_name?.toLowerCase().includes(term) ||
      s.email?.toLowerCase().includes(term) ||
      s.phone?.toLowerCase().includes(term)
    );
  });

  const saveAnamneseMutation = useMutation({
    mutationFn: async () => {
      if (!anamneseText.trim()) { toast.error("Texto da anamnese não pode ser vazio"); throw new Error("empty"); }
      await supabase.from("anamnesis_entries").insert({
        user_id: selected.user_id,
        notes: anamneseText,
      });
    },
    onSuccess: () => {
      toast.success("Anamnese salva!");
      setAnamneseText("");
      refetchAnamnese();
    },
    onError: (e: any) => { if (e.message !== "empty") toast.error("Erro ao salvar anamnese"); },
  });

  const uploadPdf = async (file: File, folder: string): Promise<string> => {
    const ext = file.name.split(".").pop();
    const path = `${folder}/${Date.now()}.${ext}`;
    const { error } = await supabase.storage.from("documents").upload(path, file);
    if (error) throw error;
    const { data } = supabase.storage.from("documents").getPublicUrl(path);
    return data.publicUrl;
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>, field: "lab_exam_url" | "medical_prescription_url") => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.type !== "application/pdf") { toast.error("Apenas arquivos PDF são aceitos."); return; }
    setUploading(field);
    try {
      const url = await uploadPdf(file, field === "lab_exam_url" ? "exames" : "receitas");
      setForm({ ...form, [field]: url });
      toast.success("Arquivo enviado!");
    } catch { toast.error("Erro no upload"); }
    setUploading(null);
  };

  const tabOrder = ["dados", "saude", "macros", "docs"];

  const validateTab = (tab: string, isCreate: boolean): boolean => {
    switch (tab) {
      case "dados":
        if (!form.full_name.trim()) { toast.error("Nome completo é obrigatório"); return false; }
        if (!form.email.trim()) { toast.error("Email é obrigatório"); return false; }
        if (isCreate && form.password.length < 6) { toast.error("Senha deve ter no mínimo 6 caracteres"); return false; }
        if (!form.phone.trim() || form.phone.replace(/\D/g, "").length < 10) { toast.error("Telefone é obrigatório (formato válido)"); return false; }
        if (!form.gender) { toast.error("Gênero é obrigatório"); return false; }
        if (!form.birth_date) { toast.error("Data de nascimento é obrigatória"); return false; }
        if (!form.height || Number(form.height) <= 0) { toast.error("Altura é obrigatória"); return false; }
        if (!form.weight || Number(form.weight) <= 0) { toast.error("Peso é obrigatório"); return false; }
        return true;
      case "saude":
        if (!form.physical_activity_level) { toast.error("Nível de atividade física é obrigatório"); return false; }
        if (!form.activity_type) { toast.error("Tipo de atividade é obrigatório"); return false; }
        if (form.does_cardio === "") { toast.error("Informe se faz cardio"); return false; }
        if (!form.objective) { toast.error("Objetivo é obrigatório"); return false; }
        if (!form.current_protocol.trim()) { toast.error("Protocolo atual é obrigatório"); return false; }
        if (!form.comorbidities.trim()) { toast.error("Comorbidades é obrigatório"); return false; }
        return true;
      case "macros":
        return true;
      case "docs":
        return true;
      default:
        return true;
    }
  };

  const validateForm = (isCreate: boolean) => {
    for (const tab of tabOrder) {
      if (!validateTab(tab, isCreate)) return false;
    }
    return true;
  };

  const isTabUnlocked = (tab: string, isCreate: boolean): boolean => {
    if (!isCreate) return true; // edit mode: all unlocked
    const idx = tabOrder.indexOf(tab);
    if (idx === 0) return true;
    // Previous tab must be saved
    const prevTab = tabOrder[idx - 1];
    return savedTabs.has(prevTab);
  };

  const saveTabData = async (tab: string, isCreate: boolean) => {
    if (!validateTab(tab, isCreate)) return;
    setTabSaving(true);
    try {
      if (isCreate) {
        // For create: on first tab, create the user; subsequent tabs update profile
        if (tab === "dados" && !selected?.user_id) {
          const { data, error } = await supabase.functions.invoke("admin-manage-students", {
            body: { action: "create", email: form.email, password: form.password, full_name: form.full_name },
          });
          if (error) throw error;
          if (data?.error) throw new Error(data.error);
          if (data?.user?.id) {
            await supabase.from("profiles").update(profilePayload()).eq("user_id", data.user.id);
            setSelected({ user_id: data.user.id });
            qc.invalidateQueries({ queryKey: ["admin-students-list"] });
          }
        } else if (selected?.user_id) {
          await supabase.from("profiles").update(profilePayload()).eq("user_id", selected.user_id);
        }
      } else {
        // Edit mode: always update
        await supabase.from("profiles").update(profilePayload()).eq("user_id", selected.user_id);
        qc.invalidateQueries({ queryKey: ["admin-students-list"] });
        qc.invalidateQueries({ queryKey: ["admin-full-profile", selected?.user_id] });
      }
      setSavedTabs(prev => new Set(prev).add(tab));
      const nextIdx = tabOrder.indexOf(tab) + 1;
      if (nextIdx < tabOrder.length) {
        setActiveTab(tabOrder[nextIdx]);
      }
      toast.success(`Página "${tab === "dados" ? "Dados" : tab === "saude" ? "Saúde" : tab === "macros" ? "Macros" : "Docs"}" salva!`);
    } catch (e: any) {
      toast.error(e.message || "Erro ao salvar");
    }
    setTabSaving(false);
  };

  // Recalculate macros from form
  const recalculateMacros = () => {
    const { gender, weight, height, birth_date, activity_type, does_cardio, objective } = form;
    if (gender && weight && height && birth_date && activity_type && does_cardio !== "" && objective) {
      const age = calculateAge(birth_date);
      if (age > 0 && age < 120) {
        const result = calculateMacros({
          gender: gender as "masculino" | "feminino",
          age,
          weight: Number(weight),
          height: Number(height),
          activityType: activity_type,
          doesCardio: does_cardio === "sim",
          objective,
          physicalActivityLevel: form.physical_activity_level || undefined,
          trainingDaysPerWeek: form.training_days_per_week ? Number(form.training_days_per_week) : undefined,
          trainingDurationMinutes: form.training_duration_minutes ? Number(form.training_duration_minutes) : undefined,
          trainingIntensity: form.training_intensity || undefined,
          cardioDaysPerWeek: form.cardio_days_per_week ? Number(form.cardio_days_per_week) : undefined,
          cardioDurationMinutes: form.cardio_duration_minutes ? Number(form.cardio_duration_minutes) : undefined,
          cardioIntensity: form.cardio_intensity || undefined,
        });
        setForm(prev => ({
          ...prev,
          bmr: result.bmr.toString(),
          tdee: result.tdee.toString(),
          daily_calories: result.dailyCalories.toString(),
          protein_g: result.proteinG.toString(),
          carbs_g: result.carbsG.toString(),
          fat_g: result.fatG.toString(),
        }));
        toast.success("Macros recalculados!");
      }
    } else {
      toast.error("Preencha todos os campos para recalcular");
    }
  };

  const profilePayload = () => ({
    full_name: form.full_name,
    email: form.email,
    phone: form.phone,
    birth_date: form.birth_date || null,
    height: form.height ? Number(form.height) : null,
    weight: form.weight ? Number(form.weight) : null,
    gender: form.gender,
    activity_type: form.activity_type,
    physical_activity_level: form.physical_activity_level || null,
    does_cardio: form.does_cardio === "sim",
    physical_activity: `${activityLabels[form.activity_type] || form.activity_type}${form.does_cardio === "sim" ? " + Cardio" : ""}`,
    objective: form.objective,
    current_protocol: form.current_protocol,
    comorbidities: form.comorbidities,
    additional_info: form.additional_info,
    lab_exam_url: form.lab_exam_url,
    medical_prescription_url: form.medical_prescription_url,
    training_days_per_week: form.training_days_per_week ? Number(form.training_days_per_week) : null,
    training_duration_minutes: form.training_duration_minutes ? Number(form.training_duration_minutes) : null,
    training_intensity: form.training_intensity || null,
    cardio_days_per_week: form.cardio_days_per_week ? Number(form.cardio_days_per_week) : null,
    cardio_duration_minutes: form.cardio_duration_minutes ? Number(form.cardio_duration_minutes) : null,
    cardio_intensity: form.cardio_intensity || null,
    bmr: form.bmr ? Number(form.bmr) : null,
    tdee: form.tdee ? Number(form.tdee) : null,
    daily_calories: form.daily_calories ? Number(form.daily_calories) : null,
    protein_g: form.protein_g ? Number(form.protein_g) : null,
    carbs_g: form.carbs_g ? Number(form.carbs_g) : null,
    fat_g: form.fat_g ? Number(form.fat_g) : null,
  });

  const createMutation = useMutation({
    mutationFn: async () => {
      if (!validateForm(true)) throw new Error("Validação falhou");
      const { data, error } = await supabase.functions.invoke("admin-manage-students", {
        body: { action: "create", email: form.email, password: form.password, full_name: form.full_name },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      if (data?.user?.id) {
        await supabase.from("profiles").update(profilePayload()).eq("user_id", data.user.id);
      }
    },
    onSuccess: () => {
      toast.success("Aluno criado com sucesso!");
      qc.invalidateQueries({ queryKey: ["admin-students-list"] });
      setCreateOpen(false);
      setForm({ ...emptyForm });
    },
    onError: (e: any) => { if (e.message !== "Validação falhou") toast.error(e.message || "Erro ao criar aluno"); },
  });

  const editMutation = useMutation({
    mutationFn: async () => {
      if (!validateForm(false)) throw new Error("Validação falhou");
      await supabase.from("profiles").update(profilePayload()).eq("user_id", selected.user_id);
    },
    onSuccess: () => {
      toast.success("Aluno atualizado!");
      qc.invalidateQueries({ queryKey: ["admin-students-list"] });
      qc.invalidateQueries({ queryKey: ["admin-full-profile", selected?.user_id] });
      setEditOpen(false);
    },
    onError: (e: any) => { if (e.message !== "Validação falhou") toast.error("Erro ao atualizar"); },
  });

  const deleteMutation = useMutation({
    mutationFn: async (userId: string) => {
      const { data, error } = await supabase.functions.invoke("admin-manage-students", {
        body: { action: "delete", user_id: userId },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
    },
    onSuccess: () => { toast.success("Aluno excluído!"); qc.invalidateQueries({ queryKey: ["admin-students-list"] }); },
    onError: (e: any) => toast.error(e.message || "Erro ao excluir"),
  });

  const resetPasswordMutation = useMutation({
    mutationFn: async () => {
      if (!passwordReset || newPassword.length < 6) throw new Error("Senha deve ter no mínimo 6 caracteres");
      const { data, error } = await supabase.functions.invoke("admin-manage-students", {
        body: { action: "reset_password", user_id: passwordReset.userId, new_password: newPassword },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
    },
    onSuccess: () => {
      toast.success("Senha alterada com sucesso!");
      setPasswordReset(null);
      setNewPassword("");
    },
    onError: (e: any) => toast.error(e.message || "Erro ao alterar senha"),
  });

  const subMutation = useMutation({
    mutationFn: async () => {
      if (selected?.subscription) {
        await supabase.from("subscriptions").update({
          plan_id: subForm.plan_id, start_date: subForm.start_date, end_date: subForm.end_date, status: subForm.status,
        }).eq("id", selected.subscription.id);
      } else {
        await supabase.from("subscriptions").insert({
          user_id: selected.user_id, plan_id: subForm.plan_id, start_date: subForm.start_date, end_date: subForm.end_date, status: subForm.status,
        });
      }
    },
    onSuccess: () => { toast.success("Assinatura atualizada!"); qc.invalidateQueries({ queryKey: ["admin-students-list"] }); setSubOpen(false); },
    onError: () => toast.error("Erro ao atualizar assinatura"),
  });

  const openEdit = (s: any) => {
    setSelected(s);
    supabase.from("profiles").select("*").eq("user_id", s.user_id).single().then(({ data: p }) => {
      if (p) {
        setForm({
          full_name: p.full_name || "", email: p.email || "", password: "", phone: p.phone || "",
          birth_date: p.birth_date || "", height: p.height?.toString() || "", weight: p.weight?.toString() || "",
          gender: (p as any).gender || "",
          activity_type: (p as any).activity_type || "",
          does_cardio: (p as any).does_cardio === true ? "sim" : (p as any).does_cardio === false ? "nao" : "",
          physical_activity_level: (p as any).physical_activity_level || "",
          objective: p.objective || "",
          current_protocol: p.current_protocol || "", comorbidities: p.comorbidities || "",
          additional_info: (p as any).additional_info || "",
          lab_exam_url: p.lab_exam_url || "", medical_prescription_url: p.medical_prescription_url || "",
          training_days_per_week: (p as any).training_days_per_week?.toString() || "",
          training_duration_minutes: (p as any).training_duration_minutes?.toString() || "",
          training_intensity: (p as any).training_intensity || "",
          cardio_days_per_week: (p as any).cardio_days_per_week?.toString() || "",
          cardio_duration_minutes: (p as any).cardio_duration_minutes?.toString() || "",
          cardio_intensity: (p as any).cardio_intensity || "",
          bmr: (p as any).bmr?.toString() || "",
          tdee: (p as any).tdee?.toString() || "",
          daily_calories: (p as any).daily_calories?.toString() || "",
          protein_g: (p as any).protein_g?.toString() || "",
          carbs_g: (p as any).carbs_g?.toString() || "",
          fat_g: (p as any).fat_g?.toString() || "",
        });
      }
    });
    setActiveTab("dados");
    setSavedTabs(new Set());
    setEditOpen(true);
  };

  // Auto-open edit dialog when ?edit=USER_ID is present
  useEffect(() => {
    const editUserId = searchParams.get("edit");
    if (editUserId && students && students.length > 0) {
      const student = students.find((s: any) => s.user_id === editUserId);
      if (student) {
        openEdit(student);
        searchParams.delete("edit");
        setSearchParams(searchParams, { replace: true });
      }
    }
  }, [students, searchParams]);

  // Auto-open subscription dialog when ?sub=USER_ID is present
  useEffect(() => {
    const subUserId = searchParams.get("sub");
    if (subUserId && students && students.length > 0) {
      const student = students.find((s: any) => s.user_id === subUserId);
      if (student) {
        openSub(student);
        searchParams.delete("sub");
        setSearchParams(searchParams, { replace: true });
      }
    }
  }, [students, searchParams]);

  const openView = (s: any) => { setSelected(s); setViewOpen(true); };

  const openSub = (s: any) => {
    setSelected(s);
    const sub = s.subscription;
    setSubForm({
      plan_id: sub?.plan_id || plans?.[0]?.id || "",
      start_date: sub?.start_date || new Date().toISOString().split("T")[0],
      end_date: sub?.end_date || "",
      status: sub?.status || "active",
    });
    setSubOpen(true);
  };

  const handlePlanChange = (planId: string) => {
    const plan = plans?.find((p) => p.id === planId);
    const start = subForm.start_date || new Date().toISOString().split("T")[0];
    const end = plan ? new Date(new Date(start).getTime() + plan.duration_days * 86400000).toISOString().split("T")[0] : subForm.end_date;
    setSubForm({ ...subForm, plan_id: planId, end_date: end });
  };

  const formAge = form.birth_date ? calculateAge(form.birth_date) : null;

  const tabLabel = (tab: string) => tab === "dados" ? "Dados" : tab === "saude" ? "Saúde" : tab === "macros" ? "Macros" : "Docs";

  const renderTabTrigger = (tab: string, isCreate: boolean) => {
    const unlocked = isTabUnlocked(tab, isCreate);
    const saved = savedTabs.has(tab);
    return (
      <TabsTrigger
        value={tab}
        disabled={!unlocked}
        className="relative gap-1.5"
        onClick={(e) => { if (!unlocked) e.preventDefault(); }}
      >
        {!unlocked && <Lock className="w-3 h-3" />}
        {saved && <Check className="w-3 h-3 text-primary" />}
        {tabLabel(tab)}
      </TabsTrigger>
    );
  };

  const renderSaveTabButton = (tab: string, isCreate: boolean) => (
    <div className="flex justify-end pt-4 border-t border-border/50 mt-4">
      <Button
        onClick={() => saveTabData(tab, isCreate)}
        disabled={tabSaving}
        size="sm"
      >
        {tabSaving ? "Salvando..." : savedTabs.has(tab) ? "Atualizar e avançar" : "Salvar e avançar"}
      </Button>
    </div>
  );

  const renderStudentFormFields = (isCreate = false) => (
    <ScrollArea className="max-h-[70vh] pr-4">
      <Tabs value={activeTab} onValueChange={(v) => { if (isTabUnlocked(v, isCreate)) setActiveTab(v); }} className="w-full">
        <TabsList className="grid grid-cols-4 w-full mb-4">
          {tabOrder.map(tab => renderTabTrigger(tab, isCreate))}
        </TabsList>

        <TabsContent value="dados" className="space-y-3">
          <div><Label className="font-body">Nome completo *</Label><Input value={form.full_name} onChange={(e) => setForm({ ...form, full_name: e.target.value })} /></div>
          <div><Label className="font-body">Email *</Label><Input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} /></div>
          {isCreate && (
            <div><Label className="font-body">Senha *</Label><Input type="password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} placeholder="Mínimo 6 caracteres" /></div>
          )}
          <div><Label className="font-body">Telefone *</Label><Input value={form.phone} onChange={(e) => setForm({ ...form, phone: phoneMask(e.target.value) })} placeholder="(xx) xxxxx-xxxx" /></div>
          
          <div>
            <Label className="font-body">Gênero *</Label>
            <RadioGroup value={form.gender} onValueChange={(v) => setForm({ ...form, gender: v })} className="flex gap-4 mt-1">
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="masculino" id="edit-gender-m" />
                <Label htmlFor="edit-gender-m" className="font-body cursor-pointer">Masculino</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="feminino" id="edit-gender-f" />
                <Label htmlFor="edit-gender-f" className="font-body cursor-pointer">Feminino</Label>
              </div>
            </RadioGroup>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div><Label className="font-body">Data de nascimento *</Label><Input type="date" value={form.birth_date} onChange={(e) => setForm({ ...form, birth_date: e.target.value })} /></div>
            <div><Label className="font-body">Idade</Label><Input value={formAge !== null && formAge > 0 ? `${formAge} anos` : ""} disabled className="bg-muted" /></div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div><Label className="font-body">Altura (cm) *</Label><Input type="number" value={form.height} onChange={(e) => setForm({ ...form, height: e.target.value })} placeholder="Ex: 175" /></div>
            <div><Label className="font-body">Peso (kg) *</Label><Input type="number" value={form.weight} onChange={(e) => setForm({ ...form, weight: e.target.value })} placeholder="Ex: 80" /></div>
          </div>
          {renderSaveTabButton("dados", isCreate)}
        </TabsContent>

        <TabsContent value="saude" className="space-y-3">
          <div>
            <Label className="font-body">Nível de atividade física (sem exercícios) *</Label>
            <Select value={form.physical_activity_level} onValueChange={(v) => setForm({ ...form, physical_activity_level: v })}>
              <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
              <SelectContent>
                {physicalActivityLevelOptions.map(o => (
                  <SelectItem key={o.value} value={o.value}>{o.label} — {o.desc}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label className="font-body">Atividade física *</Label>
            <Select value={form.activity_type} onValueChange={(v) => setForm({ ...form, activity_type: v, ...(v === "nenhuma" ? { training_days_per_week: "", training_duration_minutes: "", training_intensity: "" } : {}) })}>
              <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="musculacao">Musculação</SelectItem>
                <SelectItem value="crossfit">CrossFit</SelectItem>
                <SelectItem value="nenhuma">Nenhuma</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {(form.activity_type === "musculacao" || form.activity_type === "crossfit") && (
            <Card className="border-border/50 bg-muted/30">
              <CardContent className="pt-4 space-y-3">
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Detalhes do treino</p>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label className="font-body text-xs">Dias por semana *</Label>
                    <Select value={form.training_days_per_week} onValueChange={(v) => setForm({ ...form, training_days_per_week: v })}>
                      <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                      <SelectContent>
                        {[1,2,3,4,5,6,7].map(d => <SelectItem key={d} value={d.toString()}>{d}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label className="font-body text-xs">Duração (min) *</Label>
                    <Input type="number" min="10" max="180" value={form.training_duration_minutes} onChange={(e) => setForm({ ...form, training_duration_minutes: e.target.value })} placeholder="60" />
                  </div>
                </div>
                <div>
                  <Label className="font-body text-xs">Intensidade *</Label>
                  <Select value={form.training_intensity} onValueChange={(v) => setForm({ ...form, training_intensity: v })}>
                    <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                    <SelectContent>
                      {trainingIntensityOptions.map(o => (
                        <SelectItem key={o.value} value={o.value}>{o.label} — {o.desc}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>
          )}
          
          <div>
            <Label className="font-body">Faz cardio? *</Label>
            <RadioGroup
              value={form.does_cardio}
              onValueChange={(v) => setForm({ ...form, does_cardio: v, ...(v === "nao" ? { cardio_days_per_week: "", cardio_duration_minutes: "", cardio_intensity: "" } : {}) })}
              className="flex gap-4 mt-1"
            >
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="sim" id="edit-cardio-s" />
                <Label htmlFor="edit-cardio-s" className="font-body cursor-pointer">Sim</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="nao" id="edit-cardio-n" />
                <Label htmlFor="edit-cardio-n" className="font-body cursor-pointer">Não</Label>
              </div>
            </RadioGroup>
          </div>

          {form.does_cardio === "sim" && (
            <Card className="border-border/50 bg-muted/30">
              <CardContent className="pt-4 space-y-3">
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Detalhes do cardio</p>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label className="font-body text-xs">Dias por semana *</Label>
                    <Select value={form.cardio_days_per_week} onValueChange={(v) => setForm({ ...form, cardio_days_per_week: v })}>
                      <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                      <SelectContent>
                        {[1,2,3,4,5,6,7].map(d => <SelectItem key={d} value={d.toString()}>{d}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label className="font-body text-xs">Duração (min) *</Label>
                    <Input type="number" min="10" max="180" value={form.cardio_duration_minutes} onChange={(e) => setForm({ ...form, cardio_duration_minutes: e.target.value })} placeholder="30" />
                  </div>
                </div>
                <div>
                  <Label className="font-body text-xs">Intensidade *</Label>
                  <Select value={form.cardio_intensity} onValueChange={(v) => setForm({ ...form, cardio_intensity: v })}>
                    <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                    <SelectContent>
                      {cardioIntensityOptions.map(o => (
                        <SelectItem key={o.value} value={o.value}>{o.label} — {o.desc}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>
          )}

          <div>
            <Label className="font-body">Objetivo *</Label>
            <Select value={form.objective} onValueChange={(v) => setForm({ ...form, objective: v })}>
              <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="perder_gordura">Perder gordura</SelectItem>
                <SelectItem value="hipertrofia">Hipertrofia</SelectItem>
                <SelectItem value="manter_peso">Manter peso</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label className="font-body">Protocolo Atual (medicamentos/suplementos) *</Label>
            <Textarea value={form.current_protocol} onChange={(e) => setForm({ ...form, current_protocol: e.target.value })} rows={3} placeholder="Liste medicamentos hormonais, peptídeos e suplementos em uso." />
          </div>
          <div>
            <Label className="font-body">Comorbidades *</Label>
            <Textarea value={form.comorbidities} onChange={(e) => setForm({ ...form, comorbidities: e.target.value })} rows={3} placeholder="Informe patologias pré-existentes e condições clínicas relevantes." />
          </div>
          <div>
            <Label className="font-body">Mais informações</Label>
            <Textarea value={form.additional_info} onChange={(e) => setForm({ ...form, additional_info: e.target.value })} rows={3} placeholder="Informações adicionais relevantes (opcional)" />
          </div>
          {renderSaveTabButton("saude", isCreate)}
        </TabsContent>

        <TabsContent value="macros" className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
              <Calculator className="w-4 h-4 text-primary" /> Cálculo de Macronutrientes
            </h3>
            <Button size="sm" variant="outline" onClick={recalculateMacros}>
              <Calculator className="w-3 h-3 mr-1" /> Recalcular
            </Button>
          </div>
          <p className="text-xs text-muted-foreground">
            Os macros são calculados automaticamente com base nos dados do perfil (Mifflin-St Jeor). Você pode editar manualmente abaixo.
          </p>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="font-body text-xs">TMB (kcal)</Label>
              <Input type="number" value={form.bmr} onChange={(e) => setForm({ ...form, bmr: e.target.value })} placeholder="—" />
            </div>
            <div>
              <Label className="font-body text-xs">TDEE (kcal)</Label>
              <Input type="number" value={form.tdee} onChange={(e) => setForm({ ...form, tdee: e.target.value })} placeholder="—" />
            </div>
          </div>
          <div>
            <Label className="font-body text-xs">Calorias diárias (kcal)</Label>
            <Input type="number" value={form.daily_calories} onChange={(e) => setForm({ ...form, daily_calories: e.target.value })} placeholder="—" className="text-lg font-bold" />
          </div>
          <div className="grid grid-cols-3 gap-3">
            <div>
              <Label className="font-body text-xs">Proteína (g)</Label>
              <Input type="number" value={form.protein_g} onChange={(e) => setForm({ ...form, protein_g: e.target.value })} placeholder="—" />
            </div>
            <div>
              <Label className="font-body text-xs">Carboidratos (g)</Label>
              <Input type="number" value={form.carbs_g} onChange={(e) => setForm({ ...form, carbs_g: e.target.value })} placeholder="—" />
            </div>
            <div>
              <Label className="font-body text-xs">Gordura (g)</Label>
              <Input type="number" value={form.fat_g} onChange={(e) => setForm({ ...form, fat_g: e.target.value })} placeholder="—" />
            </div>
          </div>
          {form.objective && (
            <Badge variant="outline" className="text-xs">
              Objetivo: {objectiveLabels[form.objective] || form.objective}
            </Badge>
          )}
          {renderSaveTabButton("macros", isCreate)}
        </TabsContent>

        <TabsContent value="docs" className="space-y-4">
          <div>
            <Label className="font-body">Exames Laboratoriais (PDF, opcional)</Label>
            <div className="flex items-center gap-2 mt-1">
              <label className="flex items-center gap-2 px-3 py-2 border border-input rounded-md cursor-pointer hover:bg-accent text-sm">
                <Upload className="w-4 h-4" />
                {uploading === "lab_exam_url" ? "Enviando..." : "Selecionar PDF"}
                <input type="file" accept=".pdf" className="hidden" onChange={(e) => handleFileUpload(e, "lab_exam_url")} />
              </label>
              {form.lab_exam_url && (
                <a href={form.lab_exam_url} target="_blank" rel="noopener noreferrer" className="text-sm text-primary underline flex items-center gap-1">
                  <FileText className="w-3 h-3" /> Ver arquivo
                </a>
              )}
            </div>
          </div>
          <div>
            <Label className="font-body">Receita Médica (PDF, opcional)</Label>
            <div className="flex items-center gap-2 mt-1">
              <label className="flex items-center gap-2 px-3 py-2 border border-input rounded-md cursor-pointer hover:bg-accent text-sm">
                <Upload className="w-4 h-4" />
                {uploading === "medical_prescription_url" ? "Enviando..." : "Selecionar PDF"}
                <input type="file" accept=".pdf" className="hidden" onChange={(e) => handleFileUpload(e, "medical_prescription_url")} />
              </label>
              {form.medical_prescription_url && (
                <a href={form.medical_prescription_url} target="_blank" rel="noopener noreferrer" className="text-sm text-primary underline flex items-center gap-1">
                  <FileText className="w-3 h-3" /> Ver arquivo
                </a>
              )}
            </div>
          </div>
          {renderSaveTabButton("docs", isCreate)}
        </TabsContent>
      </Tabs>
    </ScrollArea>
  );

  return (
    <DashboardLayout role="admin" title="Gestão de Alunos" subtitle="Crie, edite e gerencie todos os alunos.">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="font-display">Alunos cadastrados</CardTitle>
            <div className="flex gap-2">
              <input
                type="file"
                ref={fileInputRef}
                accept=".xlsx,.xls,.csv"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (!file) return;
                  const reader = new FileReader();
                  reader.onload = async (evt) => {
                    try {
                      const buffer = evt.target?.result as ArrayBuffer;
                      const workbook = new ExcelJS.Workbook();
                      await workbook.xlsx.load(buffer);
                      const sheet = workbook.worksheets[0];
                      if (!sheet) throw new Error("No sheet");
                      
                      const headers: string[] = [];
                      const rows: Record<string, string>[] = [];
                      sheet.eachRow((row, rowNumber) => {
                        if (rowNumber === 1) {
                          row.eachCell((cell, colNumber) => {
                            headers[colNumber] = String(cell.value ?? "");
                          });
                        } else {
                          const obj: Record<string, string> = {};
                          headers.forEach((h, idx) => {
                            if (h) {
                              const cellVal = row.getCell(idx).value;
                              obj[h] = cellVal != null ? String(cellVal) : "";
                            }
                          });
                          rows.push(obj);
                        }
                      });
                      
                      const mapped = rows.map((row) => {
                        const get = (keys: string[]) => {
                          for (const k of keys) {
                            const found = Object.keys(row).find((rk) => rk.toLowerCase().trim() === k.toLowerCase());
                            if (found && row[found] !== "") return String(row[found]);
                          }
                          return "...";
                        };
                        
                        const rawHeight = get(["altura", "height"]);
                        const height = rawHeight !== "..." ? String(parseFloat(rawHeight.replace(",", ".")) || "") : "...";
                        
                        const rawWeight = get(["peso", "weight"]);
                        const weight = rawWeight !== "..." ? String(parseFloat(rawWeight.replace(",", ".")) || "") : "...";

                        let birthDate = get(["data de nascimento", "nascimento", "birth_date", "data nascimento", "dt nascimento"]);
                        if (birthDate !== "...") {
                          const num = Number(birthDate);
                          if (!isNaN(num) && num > 10000) {
                            const d = new Date((num - 25569) * 86400000);
                            birthDate = d.toISOString().split("T")[0];
                          } else {
                            const parts = birthDate.split("/");
                            if (parts.length === 3) {
                              birthDate = `${parts[2]}-${parts[1].padStart(2, "0")}-${parts[0].padStart(2, "0")}`;
                            }
                          }
                        }

                        let phone = get(["telefone", "phone", "celular", "tel"]);
                        if (phone !== "...") {
                          phone = phone.replace(/\D/g, "");
                          if (phone.length === 13 && phone.startsWith("55")) phone = phone.slice(2);
                        }
                        
                        return {
                          full_name: get(["nome completo", "nome", "name", "full_name"]),
                          email: get(["email", "e-mail"]).toLowerCase().trim(),
                          phone,
                          birth_date: birthDate,
                          height,
                          weight,
                        };
                      }).filter((s) => s.email !== "..." && s.email.includes("@"));
                      
                      setImportPreview(mapped);
                      setImportDialogOpen(true);
                    } catch {
                      toast.error("Erro ao ler o arquivo. Verifique o formato.");
                    }
                  };
                  reader.readAsArrayBuffer(file);
                  e.target.value = "";
                }}
              />
              <Button
                size="sm"
                variant="outline"
                disabled={importingStudents}
                onClick={() => fileInputRef.current?.click()}
              >
                <Upload className="w-4 h-4 mr-1" /> {importingStudents ? "Importando..." : "Importar Planilha"}
              </Button>
              <Dialog open={importDialogOpen} onOpenChange={setImportDialogOpen}>
                <DialogContent className="max-w-lg">
                  <DialogHeader>
                    <DialogTitle className="font-display">Importar alunos da planilha?</DialogTitle>
                  </DialogHeader>
                  <p className="text-sm text-muted-foreground">
                    Serão importados <strong>{importPreview?.length || 0}</strong> alunos. Alunos com email já existente serão atualizados. Novos alunos serão criados com senha temporária <code>123456</code>.
                  </p>
                  {importPreview && importPreview.length > 0 && (
                    <ScrollArea className="max-h-48 border rounded-md p-2">
                      <div className="text-xs space-y-1">
                        {importPreview.slice(0, 20).map((s, i) => (
                          <div key={i} className="flex justify-between">
                            <span className="truncate max-w-[200px]">{s.full_name}</span>
                            <span className="text-muted-foreground truncate max-w-[180px]">{s.email}</span>
                          </div>
                        ))}
                        {importPreview.length > 20 && <p className="text-muted-foreground">... e mais {importPreview.length - 20} alunos</p>}
                      </div>
                    </ScrollArea>
                  )}
                  <DialogFooter>
                    <Button variant="outline" onClick={() => setImportDialogOpen(false)}>Cancelar</Button>
                    <Button disabled={importingStudents} onClick={async () => {
                      if (!importPreview) return;
                      setImportingStudents(true);
                      const BATCH_SIZE = 10;
                      let totalCreated = 0, totalUpdated = 0, totalErrors = 0, totalSkipped = 0;
                      try {
                        for (let i = 0; i < importPreview.length; i += BATCH_SIZE) {
                          const batch = importPreview.slice(i, i + BATCH_SIZE);
                          toast.info(`Importando lote ${Math.floor(i / BATCH_SIZE) + 1} de ${Math.ceil(importPreview.length / BATCH_SIZE)}...`);
                          const { data, error } = await supabase.functions.invoke("import-students", {
                            body: { students: batch },
                          });
                          if (error) throw error;
                          if (data?.error) throw new Error(data.error);
                          if (data?.summary) {
                            totalCreated += data.summary.created || 0;
                            totalUpdated += data.summary.updated || 0;
                            totalErrors += data.summary.errors || 0;
                            totalSkipped += data.summary.skipped || 0;
                          }
                        }
                        toast.success(`Importação concluída! ${totalCreated} criados, ${totalUpdated} atualizados, ${totalErrors} erros, ${totalSkipped} ignorados`);
                        qc.invalidateQueries({ queryKey: ["admin-students-list"] });
                        setImportDialogOpen(false);
                        setImportPreview(null);
                      } catch (e: any) {
                        toast.error(e.message || "Erro na importação");
                        if (totalCreated + totalUpdated > 0) {
                          toast.info(`Parcial: ${totalCreated} criados, ${totalUpdated} atualizados antes do erro.`);
                          qc.invalidateQueries({ queryKey: ["admin-students-list"] });
                        }
                      }
                      setImportingStudents(false);
                    }}>
                      {importingStudents ? "Importando..." : "Confirmar Importação"}
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            <Dialog open={createOpen} onOpenChange={(o) => { setCreateOpen(o); if (!o) { setForm({ ...emptyForm }); setActiveTab("dados"); setSavedTabs(new Set()); setSelected(null); } }}>
              <DialogTrigger asChild>
                <Button size="sm"><Plus className="w-4 h-4 mr-1" /> Criar Aluno</Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl">
                <DialogHeader><DialogTitle className="font-display">Novo Aluno</DialogTitle></DialogHeader>
                {renderStudentFormFields(true)}
              </DialogContent>
            </Dialog>
            </div>
          </div>
          {/* Search Filter */}
          <div className="relative mt-3">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Buscar por nome, email ou telefone..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9"
            />
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <p className="text-sm text-muted-foreground font-body">Carregando...</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="font-body">Aluno</TableHead>
                  <TableHead className="font-body">Telefone</TableHead>
                  <TableHead className="font-body">Cadastro</TableHead>
                  <TableHead className="font-body">Plano</TableHead>
                  <TableHead className="font-body">Início</TableHead>
                  <TableHead className="font-body">Vencimento</TableHead>
                  <TableHead className="font-body">Status</TableHead>
                  <TableHead className="font-body text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredStudents?.map((s: any) => (
                  <TableRow key={s.user_id}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                          <span className="text-xs font-bold text-primary">{s.initials}</span>
                        </div>
                        <div>
                          <p className="font-medium text-sm font-body">{s.full_name || "Sem nome"}</p>
                          <p className="text-xs text-muted-foreground font-body">{s.email}</p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="font-body text-sm">{s.phone || "—"}</TableCell>
                    <TableCell className="font-body text-xs text-muted-foreground">
                      {s.created_at ? (
                        <>
                          {new Date(s.created_at).toLocaleDateString("pt-BR")}
                          <br />
                          <span className="text-[10px]">{new Date(s.created_at).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}</span>
                        </>
                      ) : "—"}
                    </TableCell>
                    <TableCell className="font-body text-sm">
                      {s.plan !== "—" ? (
                        <Badge variant="outline" className={`text-xs font-medium ${getPlanTierClasses(getPlanTier(s.planDurationDays)).badge}`}>
                          {s.plan}
                        </Badge>
                      ) : (
                        <span className="text-muted-foreground">—</span>
                      )}
                    </TableCell>
                    <TableCell className="font-body text-sm">{s.startDate ? new Date(s.startDate).toLocaleDateString("pt-BR") : "—"}</TableCell>
                    <TableCell className="font-body text-sm">{s.endDate ? new Date(s.endDate).toLocaleDateString("pt-BR") : "—"}</TableCell>
                    <TableCell>
                      <Badge variant={s.status === "active" ? "secondary" : s.status === "suspended" ? "outline" : "destructive"} className="text-xs">
                        {s.status === "active" ? "Ativo" : s.status === "suspended" ? "Suspenso" : s.status === "expired" ? "Vencido" : "Sem plano"}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Button variant="ghost" size="icon" onClick={() => openView(s)} title="Visualizar"><Eye className="w-4 h-4" /></Button>
                        <Button variant="ghost" size="icon" onClick={() => { setSelected(s); setAnamneseOpen(true); }} title="Anamnese"><ClipboardList className="w-4 h-4" /></Button>
                        <Button variant="ghost" size="icon" onClick={() => { setSelected(s); setImagesOpen(true); }} title="Fotos corporais"><Image className="w-4 h-4" /></Button>
                        <Button variant="ghost" size="icon" onClick={() => openSub(s)} title="Assinatura"><CreditCard className="w-4 h-4" /></Button>
                        <Button variant="ghost" size="icon" onClick={() => openEdit(s)} title="Editar"><Pencil className="w-4 h-4" /></Button>
                        <Button variant="ghost" size="icon" title="Copiar link de renovação" onClick={() => { navigator.clipboard.writeText(`${window.location.origin}/dashboard/renew?uid=${s.user_id}`); toast.success("Link de renovação copiado!"); }}><Link2 className="w-4 h-4" /></Button>
                        <AlertDialog>
                          <AlertDialogTrigger asChild><Button variant="ghost" size="icon" title="Excluir"><Trash2 className="w-4 h-4 text-destructive" /></Button></AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Excluir aluno?</AlertDialogTitle>
                              <AlertDialogDescription>Esta ação é irreversível. Todos os dados de {s.full_name || "este aluno"} serão removidos.</AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancelar</AlertDialogCancel>
                              <AlertDialogAction onClick={() => deleteMutation.mutate(s.user_id)}>Excluir</AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
                {(!filteredStudents || filteredStudents.length === 0) && (
                  <TableRow><TableCell colSpan={8} className="text-center text-muted-foreground font-body">
                    {searchTerm ? "Nenhum aluno encontrado." : "Nenhum aluno cadastrado."}
                  </TableCell></TableRow>
                )}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* View Dialog */}
      <Dialog open={viewOpen} onOpenChange={setViewOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader><DialogTitle className="font-display">Ficha do Aluno</DialogTitle></DialogHeader>
          {selected && (
            <ScrollArea className="max-h-[70vh] pr-4">
              <div className="space-y-6">
                <section>
                  <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3">Dados Pessoais</h3>
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div><span className="text-muted-foreground">Nome:</span> <span className="font-medium">{selected.full_name}</span></div>
                    <div><span className="text-muted-foreground">Email:</span> <span className="font-medium">{selected.email}</span></div>
                    <div><span className="text-muted-foreground">Telefone:</span> <span className="font-medium">{selected.phone || "—"}</span></div>
                    <div><span className="text-muted-foreground">Gênero:</span> <span className="font-medium capitalize">{(selectedFullProfile as any)?.gender || "—"}</span></div>
                    <div><span className="text-muted-foreground">Nascimento:</span> <span className="font-medium">{selected.birth_date ? new Date(selected.birth_date + "T12:00:00").toLocaleDateString("pt-BR") : "—"}</span></div>
                    <div><span className="text-muted-foreground">Idade:</span> <span className="font-medium">{selected.birth_date ? `${calculateAge(selected.birth_date)} anos` : "—"}</span></div>
                    <div><span className="text-muted-foreground">Altura:</span> <span className="font-medium">{selected.height ? `${selected.height} cm` : "—"}</span></div>
                    <div><span className="text-muted-foreground">Peso:</span> <span className="font-medium">{selected.weight ? `${selected.weight} kg` : "—"}</span></div>
                  </div>
                </section>
                <section>
                  <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3">Atividade & Objetivo</h3>
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div className="col-span-2"><span className="text-muted-foreground">Nível atividade (NEAT):</span> <span className="font-medium">{physicalActivityLevelOptions.find(o => o.value === (selectedFullProfile as any)?.physical_activity_level)?.label || "—"}</span></div>
                    <div><span className="text-muted-foreground">Atividade:</span> <span className="font-medium">{activityLabels[(selectedFullProfile as any)?.activity_type] || selected.physical_activity || "—"}</span></div>
                    <div><span className="text-muted-foreground">Cardio:</span> <span className="font-medium">{(selectedFullProfile as any)?.does_cardio === true ? "Sim" : (selectedFullProfile as any)?.does_cardio === false ? "Não" : "—"}</span></div>
                    <div className="col-span-2"><span className="text-muted-foreground">Objetivo:</span> <span className="font-medium">{objectiveLabels[selected.objective] || selected.objective || "—"}</span></div>
                  </div>
                  {/* Training details */}
                  {((selectedFullProfile as any)?.activity_type === "musculacao" || (selectedFullProfile as any)?.activity_type === "crossfit") && (
                    <div className="mt-3 p-3 rounded-lg bg-muted/30 border border-border/50">
                      <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Detalhes do treino</p>
                      <div className="grid grid-cols-3 gap-2 text-sm">
                        <div><span className="text-muted-foreground text-xs">Dias/sem:</span> <span className="font-medium">{(selectedFullProfile as any)?.training_days_per_week || "—"}</span></div>
                        <div><span className="text-muted-foreground text-xs">Duração:</span> <span className="font-medium">{(selectedFullProfile as any)?.training_duration_minutes ? `${(selectedFullProfile as any).training_duration_minutes} min` : "—"}</span></div>
                        <div><span className="text-muted-foreground text-xs">Intensidade:</span> <span className="font-medium">{trainingIntensityOptions.find(o => o.value === (selectedFullProfile as any)?.training_intensity)?.label || "—"}</span></div>
                      </div>
                    </div>
                  )}
                  {/* Cardio details */}
                  {(selectedFullProfile as any)?.does_cardio === true && (
                    <div className="mt-3 p-3 rounded-lg bg-muted/30 border border-border/50">
                      <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Detalhes do cardio</p>
                      <div className="grid grid-cols-3 gap-2 text-sm">
                        <div><span className="text-muted-foreground text-xs">Dias/sem:</span> <span className="font-medium">{(selectedFullProfile as any)?.cardio_days_per_week || "—"}</span></div>
                        <div><span className="text-muted-foreground text-xs">Duração:</span> <span className="font-medium">{(selectedFullProfile as any)?.cardio_duration_minutes ? `${(selectedFullProfile as any).cardio_duration_minutes} min` : "—"}</span></div>
                        <div><span className="text-muted-foreground text-xs">Intensidade:</span> <span className="font-medium">{cardioIntensityOptions.find(o => o.value === (selectedFullProfile as any)?.cardio_intensity)?.label || "—"}</span></div>
                      </div>
                    </div>
                  )}
                </section>

                {/* Macros Section */}
                {(selectedFullProfile as any)?.daily_calories && (
                  <section>
                    <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3 flex items-center gap-2">
                      <Calculator className="w-4 h-4" /> Macronutrientes
                    </h3>
                    <div className="grid grid-cols-3 gap-3">
                      <div className="bg-muted/50 rounded-lg p-3 text-center">
                        <p className="text-xs text-muted-foreground">TMB</p>
                        <p className="font-bold text-sm">{(selectedFullProfile as any)?.bmr || "—"} kcal</p>
                      </div>
                      <div className="bg-muted/50 rounded-lg p-3 text-center">
                        <p className="text-xs text-muted-foreground">TDEE</p>
                        <p className="font-bold text-sm">{(selectedFullProfile as any)?.tdee || "—"} kcal</p>
                      </div>
                      <div className="bg-primary/10 rounded-lg p-3 text-center border border-primary/20">
                        <p className="text-xs text-muted-foreground">Cal/dia</p>
                        <p className="font-bold text-primary">{(selectedFullProfile as any)?.daily_calories || "—"} kcal</p>
                      </div>
                      <div className="bg-muted/50 rounded-lg p-3 text-center">
                        <p className="text-xs text-muted-foreground">Proteína</p>
                        <p className="font-bold text-sm">{(selectedFullProfile as any)?.protein_g || "—"}g</p>
                      </div>
                      <div className="bg-muted/50 rounded-lg p-3 text-center">
                        <p className="text-xs text-muted-foreground">Carbos</p>
                        <p className="font-bold text-sm">{(selectedFullProfile as any)?.carbs_g || "—"}g</p>
                      </div>
                      <div className="bg-muted/50 rounded-lg p-3 text-center">
                        <p className="text-xs text-muted-foreground">Gordura</p>
                        <p className="font-bold text-sm">{(selectedFullProfile as any)?.fat_g || "—"}g</p>
                      </div>
                    </div>
                  </section>
                )}

                <section>
                  <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3">Protocolo Atual</h3>
                  <p className="text-sm whitespace-pre-wrap">{selected.current_protocol || "Não informado"}</p>
                </section>
                <section>
                  <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3">Comorbidades</h3>
                  <p className="text-sm whitespace-pre-wrap">{selected.comorbidities || "Não informado"}</p>
                </section>
                {(selectedFullProfile as any)?.additional_info && (
                  <section>
                    <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3">Mais Informações</h3>
                    <p className="text-sm whitespace-pre-wrap">{(selectedFullProfile as any).additional_info}</p>
                  </section>
                )}
                <section>
                  <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3">Documentos</h3>
                  <div className="flex flex-col gap-2">
                    {selected.lab_exam_url ? (
                      <a href={selected.lab_exam_url} target="_blank" rel="noopener noreferrer" className="text-sm text-primary underline flex items-center gap-1">
                        <FileText className="w-4 h-4" /> Exames Laboratoriais
                      </a>
                    ) : <p className="text-sm text-muted-foreground">Exames: não enviado</p>}
                    {selected.medical_prescription_url ? (
                      <a href={selected.medical_prescription_url} target="_blank" rel="noopener noreferrer" className="text-sm text-primary underline flex items-center gap-1">
                        <FileText className="w-4 h-4" /> Receita Médica
                      </a>
                    ) : <p className="text-sm text-muted-foreground">Receita: não enviada</p>}
                  </div>
                </section>
                {/* Body Images in View */}
                <section>
                  <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3">Imagens Corporais</h3>
                  {selectedBodyImages && selectedBodyImages.length > 0 ? (
                    <div className="grid grid-cols-3 gap-3">
                      {["front", "back", "profile"].map((type) => {
                        const img = selectedBodyImages.find((i: any) => i.type === type);
                        const labels: Record<string, string> = { front: "Frente", back: "Costas", profile: "Perfil" };
                        return (
                          <div key={type} className="text-center">
                            <p className="text-xs text-muted-foreground mb-1">{labels[type]}</p>
                            {img ? (
                              <img src={img.image_url} alt={labels[type]} className="w-full aspect-[3/4] object-cover rounded-lg border" />
                            ) : (
                              <div className="w-full aspect-[3/4] bg-muted rounded-lg flex items-center justify-center text-muted-foreground text-xs">Não enviada</div>
                            )}
                            {img && <p className="text-xs text-muted-foreground mt-1">{new Date(img.uploaded_at).toLocaleDateString("pt-BR")}</p>}
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground">Nenhuma imagem enviada.</p>
                  )}
                </section>
              </div>
            </ScrollArea>
          )}
        </DialogContent>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog open={editOpen} onOpenChange={(o) => { setEditOpen(o); if (!o) { setActiveTab("dados"); setSavedTabs(new Set()); } }}>
        <DialogContent className="max-w-2xl">
          <DialogHeader><DialogTitle className="font-display">Editar Aluno</DialogTitle></DialogHeader>
          {renderStudentFormFields(false)}
        </DialogContent>
      </Dialog>

      {/* Subscription Dialog */}
      <Dialog open={subOpen} onOpenChange={setSubOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle className="font-display">Gerenciar Assinatura</DialogTitle></DialogHeader>
          <p className="text-sm text-muted-foreground font-body">{selected?.full_name}</p>
          <div className="space-y-3">
            <div>
              <Label className="font-body">Plano</Label>
              <Select value={subForm.plan_id} onValueChange={handlePlanChange}>
                <SelectTrigger><SelectValue placeholder="Selecione um plano" /></SelectTrigger>
                <SelectContent>{plans?.map((p) => (<SelectItem key={p.id} value={p.id}>{p.name} — {p.price}</SelectItem>))}</SelectContent>
              </Select>
            </div>
            <div><Label className="font-body">Data de início</Label><Input type="date" value={subForm.start_date} onChange={(e) => setSubForm({ ...subForm, start_date: e.target.value })} /></div>
            <div><Label className="font-body">Data de vencimento</Label><Input type="date" value={subForm.end_date} onChange={(e) => setSubForm({ ...subForm, end_date: e.target.value })} /></div>
            <div>
              <Label className="font-body">Status</Label>
              <Select value={subForm.status} onValueChange={(v) => setSubForm({ ...subForm, status: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">Ativo</SelectItem>
                  <SelectItem value="expired">Vencido</SelectItem>
                  <SelectItem value="suspended">Suspenso</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button onClick={() => subMutation.mutate()} disabled={subMutation.isPending}>
              {subMutation.isPending ? "Salvando..." : "Salvar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Body Images Management Dialog */}
      <Dialog open={imagesOpen} onOpenChange={setImagesOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="font-display flex items-center gap-2">
              <Camera className="w-5 h-5" /> Imagens Corporais — {selected?.full_name}
            </DialogTitle>
          </DialogHeader>
          {selected && (
            <BodyImageUpload
              userId={selected.user_id}
              existingImages={selectedBodyImages || []}
              onComplete={() => {
                refetchBodyImages();
                toast.success("Imagens atualizadas!");
              }}
            />
          )}
        </DialogContent>
      </Dialog>

      {/* Anamnese Dialog */}
      <Dialog open={anamneseOpen} onOpenChange={setAnamneseOpen}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle className="font-display flex items-center gap-2">
              <ClipboardList className="w-5 h-5" /> Anamnese — {selected?.full_name}
            </DialogTitle>
          </DialogHeader>
          {selected && (
            <ScrollArea className="max-h-[75vh] pr-4">
              <div className="space-y-6">
                {/* New entry */}
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-display">Nova Anotação</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <Textarea
                      value={anamneseText}
                      onChange={(e) => setAnamneseText(e.target.value)}
                      rows={4}
                      placeholder="Observações clínicas, evolução, ajustes de protocolo..."
                    />
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        onClick={() => saveAnamneseMutation.mutate()}
                        disabled={saveAnamneseMutation.isPending}
                      >
                        {saveAnamneseMutation.isPending ? "Salvando..." : "Salvar Anotação"}
                      </Button>
                    </div>
                  </CardContent>
                </Card>

                {/* Body Images Upload */}
                <BodyImageUpload
                  userId={selected.user_id}
                  existingImages={selectedBodyImages || []}
                  onComplete={() => {
                    refetchBodyImages();
                    refetchAnamnese();
                    toast.success("Imagens atualizadas!");
                  }}
                />

                {/* Image History */}
                {anamneseBodyImages && anamneseBodyImages.length > 0 && (
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm font-display">Histórico de Imagens</CardTitle>
                    </CardHeader>
                    <CardContent>
                      {(() => {
                        const grouped = anamneseBodyImages.reduce((acc: Record<string, any[]>, img: any) => {
                          const date = new Date(img.uploaded_at).toLocaleDateString("pt-BR");
                          if (!acc[date]) acc[date] = [];
                          acc[date].push(img);
                          return acc;
                        }, {});
                        const labels: Record<string, string> = { front: "Frente", back: "Costas", profile: "Perfil" };
                        return Object.entries(grouped).map(([date, imgs]) => (
                          <div key={date} className="mb-4 last:mb-0">
                            <p className="text-xs font-semibold text-muted-foreground mb-2">{date} {(imgs as any[])[0]?.is_current && <Badge variant="secondary" className="ml-1 text-[10px]">Atual</Badge>}</p>
                            <div className="grid grid-cols-3 gap-2">
                              {["front", "back", "profile"].map((type) => {
                                const img = (imgs as any[]).find((i: any) => i.type === type);
                                return (
                                  <div key={type} className="text-center">
                                    <p className="text-[10px] text-muted-foreground mb-0.5">{labels[type]}</p>
                                    {img ? (
                                      <img src={img.image_url} alt={labels[type]} className="w-full aspect-[3/4] object-cover rounded border" />
                                    ) : (
                                      <div className="w-full aspect-[3/4] bg-muted rounded flex items-center justify-center text-muted-foreground text-[10px]">—</div>
                                    )}
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        ));
                      })()}
                    </CardContent>
                  </Card>
                )}

                {/* Notes History */}
                {anamneseEntries && anamneseEntries.length > 0 && (
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm font-display">Histórico de Anotações</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      {anamneseEntries.map((entry: any) => (
                        <div key={entry.id} className="border-b border-border/50 pb-3 last:border-0 last:pb-0">
                          <p className="text-xs text-muted-foreground mb-1">
                            {new Date(entry.created_at).toLocaleDateString("pt-BR")} às {new Date(entry.created_at).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}
                          </p>
                          <p className="text-sm whitespace-pre-wrap">{entry.notes}</p>
                        </div>
                      ))}
                    </CardContent>
                  </Card>
                )}

                {(!anamneseEntries || anamneseEntries.length === 0) && (!anamneseBodyImages || anamneseBodyImages.length === 0) && (
                  <p className="text-sm text-muted-foreground text-center py-4">Nenhum registro de anamnese ainda.</p>
                )}
              </div>
            </ScrollArea>
          )}
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
};

export default AdminStudents;
