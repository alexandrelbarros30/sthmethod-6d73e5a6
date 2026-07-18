import { useState, useRef, useEffect } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
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
import { Plus, Pencil, Trash2, CreditCard, Eye, EyeOff, FileText, Upload, Camera, Image, Search, ClipboardList, Download, Calculator, Check, Lock, Link2, RotateCcw, AlertTriangle, UserX, UserCheck, Dumbbell, Pill, UtensilsCrossed, MessageCircle, MoreVertical, Activity, Microscope, Copy, Layers, ChevronDown, ChevronUp, Zap, ShieldCheck, Sparkles } from "lucide-react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";

import { getPlanTier, getPlanTierClasses } from "@/lib/plan-colors";
import { normalizeSearch } from "@/lib/utils";
import { cn } from "@/lib/utils";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import BodyImageUpload from "@/components/shared/BodyImageUpload";
import DocumentUpload from "@/components/shared/DocumentUpload";
import SignedImage from "@/components/shared/SignedImage";
import { getSecureFileUrl, extractStoragePath } from "@/lib/secure-file-url";
import AdminBodyImageUpload from "@/components/admin/AdminBodyImageUpload";
import AdminImageHistory from "@/components/admin/AdminImageHistory";
import StudentPlanHistory from "@/components/admin/StudentPlanHistory";
import StudentWorkoutAlertCard from "@/components/admin/StudentWorkoutAlertCard";
import AnamnesisEntryItem from "@/components/shared/AnamnesisEntryItem";
import EvolutionComparison from "@/components/shared/EvolutionComparison";
import EvolutionUpdateHistory from "@/components/shared/EvolutionUpdateHistory";
import EvolutionGenerator from "@/components/admin/EvolutionGenerator";
import EvolutionArtsGallery from "@/components/admin/EvolutionArtsGallery";
import AdminEvolutionUpdate from "@/components/admin/AdminEvolutionUpdate";
import ExcelJS from "exceljs";
import AdminBioimpedance from "@/components/admin/AdminBioimpedance";
import WhatsAppPopoverButton from "@/components/shared/WhatsAppPopoverButton";
import NotifyStudentToggle from "@/components/admin/NotifyStudentToggle";
import AdminMetabolicPanel from "@/components/admin/AdminMetabolicPanel";
import AdminFlowStatusDialog from "@/components/admin/AdminFlowStatusDialog";
import PreviewUnlockToggle from "@/components/admin/PreviewUnlockToggle";
import StudentProgramAssignDialog from "@/components/admin/StudentProgramAssignDialog";
import StudentImageConsentCard from "@/components/admin/StudentImageConsentCard";
import StudentImageAuthSummary from "@/components/admin/StudentImageAuthSummary";
import { calculateAge, calculateMacros, type MacroResult } from "@/lib/macro-calculator";
import { normalizePhone } from "@/lib/phone";
import { useAdminReauth, logAdminAccess } from "@/hooks/useAdminReauth";
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

const cpfMask = (v: string) => {
  const d = v.replace(/\D/g, "").slice(0, 11);
  if (d.length <= 3) return d;
  if (d.length <= 6) return `${d.slice(0, 3)}.${d.slice(3)}`;
  if (d.length <= 9) return `${d.slice(0, 3)}.${d.slice(3, 6)}.${d.slice(6)}`;
  return `${d.slice(0, 3)}.${d.slice(3, 6)}.${d.slice(6, 9)}-${d.slice(9)}`;
};

const emptyForm = {
  full_name: "", email: "", password: "", phone: "", cpf: "",
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
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const qc = useQueryClient();
  const { requireReauth } = useAdminReauth();
  const [createOpen, setCreateOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [subOpen, setSubOpen] = useState(false);
  const [viewOpen, setViewOpen] = useState(false);
  const [notesHistoryOpen, setNotesHistoryOpen] = useState(false);
  const [snapshotsOpen, setSnapshotsOpen] = useState(true);
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
  const [showCreatePassword, setShowCreatePassword] = useState(false);
  const [showResetPassword, setShowResetPassword] = useState(false);
  const [orphanData, setOrphanData] = useState<any>(null);
  const [orphanLoading, setOrphanLoading] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<{ userId: string; name: string } | null>(null);
  const [deleteConfirmText, setDeleteConfirmText] = useState("");
  const [bioOpen, setBioOpen] = useState(false);
  const [manageOpen, setManageOpen] = useState(false);
  const [metabolicOpen, setMetabolicOpen] = useState(false);
  const [flowOpen, setFlowOpen] = useState(false);
  const [programsOpen, setProgramsOpen] = useState(false);

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

  const { data: allBodyImages, refetch: refetchAllBodyImages } = useQuery({
    queryKey: ["admin-all-body-images", selected?.user_id],
    queryFn: async () => {
      const { data } = await supabase.from("body_images").select("*").eq("user_id", selected!.user_id).order("uploaded_at", { ascending: false });
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

  const { data: weightLogs } = useQuery({
    queryKey: ["admin-weight-logs", selected?.user_id],
    queryFn: async () => {
      const { data } = await supabase
        .from("weight_logs")
        .select("*")
        .eq("user_id", selected!.user_id)
        .order("logged_at", { ascending: false });
      return data || [];
    },
    enabled: !!selected?.user_id && (anamneseOpen || viewOpen),
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

  // Merge live profile data over the cached list row so the Ficha view always reflects latest edits
  const selectedMerged: any = selected
    ? { ...selected, ...(selectedFullProfile || {}) }
    : null;

  const filteredStudents = searchTerm.trim().length < 2
    ? []
    : students?.filter((s: any) => {
        const term = normalizeSearch(searchTerm);
        if (normalizeSearch(s.full_name).includes(term)) return true;
        if (normalizeSearch(s.email).includes(term)) return true;
        const termDigits = term.replace(/\D/g, "");
        if (termDigits.length >= 3) {
          const phoneDigits = normalizePhone(s.phone);
          if (phoneDigits.includes(termDigits)) return true;
        }
        return false;
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

  const uploadPdf = async (file: File, ownerUserId: string, type: "lab_exam" | "medical_prescription"): Promise<string> => {
    // Salva sempre dentro da pasta do dono (userId) para casar com as policies de storage privadas
    const path = `${ownerUserId}/${type}_${Date.now()}.pdf`;
    const { error } = await supabase.storage.from("documents").upload(path, file, { upsert: true });
    if (error) throw error;
    const { data } = supabase.storage.from("documents").getPublicUrl(path);
    // Registra também na tabela clinical_documents (com storage_path, para signed URL)
    await supabase.from("clinical_documents").insert({
      user_id: ownerUserId,
      type,
      file_url: data.publicUrl,
      storage_path: path,
    });
    return path;
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>, field: "lab_exam_url" | "medical_prescription_url") => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.type !== "application/pdf") { toast.error("Apenas arquivos PDF são aceitos."); return; }
    const ownerUserId = selected?.user_id;
    if (!ownerUserId) { toast.error("Salve o aluno antes de enviar documentos."); return; }
    setUploading(field);
    try {
      const path = await uploadPdf(file, ownerUserId, field === "lab_exam_url" ? "lab_exam" : "medical_prescription");
      setForm({ ...form, [field]: path });
      toast.success("Arquivo enviado!");
    } catch (err: any) { toast.error(err?.message || "Erro no upload"); }
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
          if (data?.error) {
            if (data.error.includes("já está cadastrado")) {
              await checkOrphan(form.email);
              throw new Error(data.error);
            }
            throw new Error(data.error);
          }
          if (error) throw new Error("Erro ao criar aluno. Tente novamente.");
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
        // If email changed, sync to auth FIRST (so login works with new email)
        const currentEmail = (selected as any)?.email?.toLowerCase?.() || "";
        const newEmail = form.email.trim().toLowerCase();
        if (newEmail && newEmail !== currentEmail) {
          const ok = await requireReauth({
            reason: `Você está alterando o e-mail de login de "${selected?.full_name || currentEmail}". Confirme sua senha para prosseguir.`,
            action: "update_student_email",
            targetLabel: selected?.full_name,
          });
          if (!ok) throw new Error("Alteração de e-mail cancelada.");
          const { data: emailRes, error: emailErr } = await supabase.functions.invoke("admin-manage-students", {
            body: { action: "update_email", user_id: selected.user_id, new_email: newEmail },
          });
          if (emailErr) throw new Error("Erro ao atualizar email de login. Tente novamente.");
          if (emailRes?.error) throw new Error(emailRes.error);
          await logAdminAccess({
            action: "update_student_email",
            resourceType: "profiles",
            targetUserId: selected.user_id,
            targetLabel: selected?.full_name,
            metadata: { from: currentEmail, to: newEmail },
            reauthUsed: true,
          });
        }
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
    cpf: form.cpf.replace(/\D/g, ""),
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
      if (data?.error) {
        if (data.error.includes("já está cadastrado")) {
          await checkOrphan(form.email);
        }
        throw new Error(data.error);
      }
      if (error) throw new Error("Erro ao criar aluno. Tente novamente.");
      if (data?.user?.id) {
        await supabase.from("profiles").update(profilePayload()).eq("user_id", data.user.id);
        // Auto-cadastro no SuperCoach (fire-and-forget) — senha = escolhida pelo admin/consultor (padrão 123456)
        supabase.functions.invoke("supercoach-sync-expiration", {
          body: { action: "create", userId: data.user.id, password: form.password || "123456" },
        }).catch((e) => console.warn("[SuperCoach auto-create]", e));
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
      const currentEmail = (selected as any)?.email?.toLowerCase?.() || "";
      const newEmail = form.email.trim().toLowerCase();
      if (newEmail && newEmail !== currentEmail) {
        const { data: emailRes, error: emailErr } = await supabase.functions.invoke("admin-manage-students", {
          body: { action: "update_email", user_id: selected.user_id, new_email: newEmail },
        });
        if (emailErr) throw new Error("Erro ao atualizar email de login.");
        if (emailRes?.error) throw new Error(emailRes.error);
      }
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

  const checkOrphan = async (email: string) => {
    setOrphanLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("admin-manage-students", {
        body: { action: "check_orphan", email },
      });
      console.log("checkOrphan result:", { data, error });
      if (error) {
        console.error("checkOrphan invoke error:", error);
        // Even if check fails, show orphan dialog with basic info so user can act
        setOrphanData({ orphan: true, email, user_id: null, has_profile: false, has_role: false });
        return;
      }
      if (data?.orphan) {
        setOrphanData(data);
      } else if (data?.user_id) {
        // User exists with complete profile — still show dialog to allow delete+recreate
        setOrphanData({ ...data, orphan: true });
      }
    } catch (e) {
      console.error("checkOrphan error:", e);
      // Show dialog with basic info
      setOrphanData({ orphan: true, email, user_id: null, has_profile: false, has_role: false });
    }
    setOrphanLoading(false);
  };

  const handleOrphanDelete = async () => {
    if (!orphanData?.user_id) return;
    setOrphanLoading(true);
    try {
      const { data } = await supabase.functions.invoke("admin-manage-students", {
        body: { action: "delete", user_id: orphanData.user_id },
      });
      if (data?.error) throw new Error(data.error);
      toast.success("Cadastro órfão removido! Agora você pode cadastrar novamente.");
      setOrphanData(null);
    } catch (e: any) {
      toast.error(e.message || "Erro ao excluir");
    }
    setOrphanLoading(false);
  };

  const handleOrphanRepair = async () => {
    if (!orphanData?.user_id) return;
    setOrphanLoading(true);
    try {
      const { data } = await supabase.functions.invoke("admin-manage-students", {
        body: { action: "repair_orphan", user_id: orphanData.user_id, full_name: form.full_name, email: orphanData.email },
      });
      if (data?.error) throw new Error(data.error);
      toast.success("Cadastro reparado com sucesso! O aluno agora aparecerá na lista.");
      setOrphanData(null);
      setCreateOpen(false);
      qc.invalidateQueries({ queryKey: ["admin-students-list"] });
    } catch (e: any) {
      toast.error(e.message || "Erro ao reparar");
    }
    setOrphanLoading(false);
  };

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
          full_name: p.full_name || "", email: p.email || "", password: "", phone: p.phone || "", cpf: p.cpf ? cpfMask(p.cpf) : "",
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

  // Auto-open create dialog when ?create=true is present
  useEffect(() => {
    const shouldCreate = searchParams.get("create");
    if (shouldCreate === "true") {
      setForm({ ...emptyForm });
      setCreateOpen(true);
      searchParams.delete("create");
      setSearchParams(searchParams, { replace: true });
    }
  }, [searchParams]);

  // Auto-open manage dialog when ?manage=USER_ID is present
  useEffect(() => {
    const manageUserId = searchParams.get("manage");
    if (manageUserId && students && students.length > 0) {
      const student = students.find((s: any) => s.user_id === manageUserId);
      if (student) {
        setSelected(student);
        setManageOpen(true);
        searchParams.delete("manage");
        setSearchParams(searchParams, { replace: true });
      } else {
        // Aluno veio da fila mas não está na lista (perfil ausente / não sincronizado)
        (async () => {
          // Tenta carregar perfil diretamente
          const { data: prof } = await supabase
            .from("profiles")
            .select("user_id, full_name, email, phone, birth_date, height, weight, physical_activity, objective, current_protocol, comorbidities, lab_exam_url, medical_prescription_url, avatar_url, onboarding_complete, created_at")
            .eq("user_id", manageUserId)
            .maybeSingle();
          if (prof) {
            const { data: sub } = await supabase
              .from("subscriptions")
              .select("*, plans(name, duration_days)")
              .eq("user_id", manageUserId)
              .maybeSingle();
            const fallbackStudent: any = {
              ...prof,
              plan: (sub as any)?.plans?.name || "—",
              planDurationDays: (sub as any)?.plans?.duration_days || null,
              subscription: sub || null,
              startDate: sub?.start_date || null,
              endDate: sub?.end_date || null,
              status: sub ? (sub.status === "active" && new Date(sub.end_date) > new Date() ? "active" : sub.status === "suspended" ? "suspended" : "expired") : "none",
              initials: prof.full_name?.split(" ").map((n: string) => n[0]).join("").slice(0, 2).toUpperCase() || "?",
            };
            setSelected(fallbackStudent);
            setManageOpen(true);
            qc.invalidateQueries({ queryKey: ["admin-students-list"] });
          } else {
            toast.error("Aluno não encontrado", {
              description: "O perfil deste aluno ainda não foi criado. Verifique o pagamento ou crie o cadastro manualmente.",
            });
          }
          searchParams.delete("manage");
          setSearchParams(searchParams, { replace: true });
        })();
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
            <div><Label className="font-body">Senha *</Label>
              <div className="relative">
                <Input type={showCreatePassword ? "text" : "password"} value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} placeholder="Mínimo 6 caracteres" className="pr-10" />
                <button type="button" onClick={() => setShowCreatePassword(!showCreatePassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors">
                  {showCreatePassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>
          )}
          <div><Label className="font-body">CPF</Label><Input value={form.cpf} onChange={(e) => setForm({ ...form, cpf: cpfMask(e.target.value) })} placeholder="000.000.000-00" /></div>
          <div>
            <Label className="font-body">Telefone *</Label>
            <div className="flex gap-1.5">
              <Input className="flex-1" value={form.phone} onChange={(e) => setForm({ ...form, phone: phoneMask(e.target.value) })} placeholder="(xx) xxxxx-xxxx" />
              {form.phone && form.phone.replace(/\D/g, "").length >= 10 && (
                <WhatsAppPopoverButton phone={form.phone} name={form.full_name} userId={selected?.user_id} studentProfile={{ full_name: form.full_name, email: form.email, phone: form.phone, weight: form.weight ? Number(form.weight) : null, height: form.height ? Number(form.height) : null, objective: form.objective || null, birth_date: (selected as any)?.birth_date || null }} />
              )}
            </div>
          </div>
          
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
          {!isCreate && selected?.user_id && (
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="outline" size="sm" className="text-destructive border-destructive/30 hover:bg-destructive/10">
                  <RotateCcw className="w-4 h-4 mr-1" /> Limpar dados de saúde
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Limpar dados de saúde?</AlertDialogTitle>
                  <AlertDialogDescription>
                    Isso vai apagar todos os campos de saúde (atividade física, cardio, objetivo, protocolo, comorbidades e informações adicionais) deste aluno. O aluno poderá preencher novamente. Esta ação não pode ser desfeita.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancelar</AlertDialogCancel>
                  <AlertDialogAction
                    className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                    onClick={async () => {
                      try {
                        await supabase.from("profiles").update({
                          physical_activity_level: null,
                          activity_type: null,
                          does_cardio: null,
                          training_days_per_week: null,
                          training_duration_minutes: null,
                          training_intensity: null,
                          cardio_days_per_week: null,
                          cardio_duration_minutes: null,
                          cardio_intensity: null,
                          objective: null,
                          current_protocol: null,
                          comorbidities: null,
                          additional_info: null,
                        }).eq("user_id", selected.user_id);
                        setForm(prev => ({
                          ...prev,
                          physical_activity_level: "", activity_type: "", does_cardio: "",
                          training_days_per_week: "", training_duration_minutes: "", training_intensity: "",
                          cardio_days_per_week: "", cardio_duration_minutes: "", cardio_intensity: "",
                          objective: "", current_protocol: "", comorbidities: "", additional_info: "",
                        }));
                        qc.invalidateQueries({ queryKey: ["admin-students-list"] });
                        qc.invalidateQueries({ queryKey: ["admin-full-profile", selected.user_id] });
                        toast.success("Dados de saúde limpos com sucesso!");
                      } catch {
                        toast.error("Erro ao limpar dados de saúde");
                      }
                    }}
                  >
                    Sim, limpar
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          )}
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
          {selected?.user_id && (
            <DocumentUpload
              userId={selected.user_id}
              onUploaded={() => qc.invalidateQueries({ queryKey: ["admin-students-list"] })}
            />
          )}
          {selected?.user_id && (
            <StudentImageConsentCard
              userId={selected.user_id}
              studentName={selectedMerged?.full_name}
              studentPhone={selectedMerged?.phone}
            />
          )}
          {renderSaveTabButton("docs", isCreate)}
        </TabsContent>
      </Tabs>
    </ScrollArea>
  );

  return (
    <DashboardLayout role="admin" title="Gestão de Alunos" subtitle="Crie, edite e gerencie todos os alunos.">
      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <CardTitle className="font-display text-base sm:text-lg">Alunos cadastrados</CardTitle>
            <div className="flex gap-2 flex-wrap items-center">
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
                className="text-xs"
              >
                <Upload className="w-4 h-4 sm:mr-1" /> <span className="hidden sm:inline">{importingStudents ? "Importando..." : "Importar Planilha"}</span><span className="sm:hidden">{importingStudents ? "..." : "Importar"}</span>
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
                <Button size="sm" className="text-xs"><Plus className="w-4 h-4 sm:mr-1" /> <span className="hidden sm:inline">Criar Aluno</span><span className="sm:hidden">Criar</span></Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
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
        <CardContent className="px-0 sm:px-6">
          {isLoading ? (
            <p className="text-sm text-muted-foreground font-body px-4">Carregando...</p>
          ) : searchTerm.trim().length < 2 ? (
            <p className="text-sm text-muted-foreground text-center py-8 px-4">Digite pelo menos 2 caracteres para buscar alunos.</p>
          ) : (
            <>
              {/* Mobile card list */}
              <div className="sm:hidden space-y-2 px-4">
                {filteredStudents?.map((s: any) => (
                  <div key={s.user_id} className="border border-border rounded-lg p-3 space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 min-w-0 flex-1">
                        <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                          <span className="text-xs font-bold text-primary">{s.initials}</span>
                        </div>
                        <div className="min-w-0">
                          <p className="font-medium text-sm break-words">{s.full_name || "Sem nome"}</p>
                          <p className="text-xs text-muted-foreground break-words">{s.email}</p>
                          {s.phone && <p className="text-[10px] text-muted-foreground">{s.phone}</p>}
                        </div>
                      </div>
                      <div className="flex items-center gap-1.5 shrink-0 ml-2">
                        <Badge variant={s.status === "active" ? "secondary" : s.status === "suspended" ? "outline" : "destructive"} className="text-[10px] whitespace-nowrap">
                          {s.status === "active" ? "Ativo" : s.status === "suspended" ? "Suspenso" : s.status === "expired" ? "Vencido" : "Sem plano"}
                        </Badge>
                        <Button variant="outline" size="sm" className="text-xs h-7 px-2" onClick={() => { setSelected(s); setManageOpen(true); }}>
                          Gerenciar
                        </Button>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground flex-wrap">
                      {s.plan !== "—" && (
                        <Badge variant="outline" className={`text-[10px] ${getPlanTierClasses(getPlanTier(s.planDurationDays)).badge}`}>
                          {s.plan}
                        </Badge>
                      )}
                      {s.endDate && <span>Venc: {new Date(s.endDate).toLocaleDateString("pt-BR")}</span>}
                    </div>
                  </div>
                ))}
                {(!filteredStudents || filteredStudents.length === 0) && (
                  <p className="text-center text-muted-foreground font-body py-8">
                    {searchTerm ? "Nenhum aluno encontrado." : "Nenhum aluno cadastrado."}
                  </p>
                )}
              </div>

              {/* Desktop table */}
              <div className="hidden sm:block">
                <Table className="table-fixed w-full">
                  <TableHeader>
                    <TableRow>
                      <TableHead className="font-body">Aluno</TableHead>
                      <TableHead className="font-body hidden xl:table-cell w-[140px]">Telefone</TableHead>
                      <TableHead className="font-body hidden 2xl:table-cell w-[110px]">Cadastro</TableHead>
                      <TableHead className="font-body w-[110px]">Plano</TableHead>
                      <TableHead className="font-body hidden 2xl:table-cell w-[100px]">Início</TableHead>
                      <TableHead className="font-body hidden lg:table-cell w-[110px]">Vencimento</TableHead>
                      <TableHead className="font-body w-[100px]">Status</TableHead>
                      <TableHead className="font-body text-right w-[120px]">Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredStudents?.map((s: any) => (
                      <TableRow key={s.user_id}>
                        <TableCell className="py-2 pr-2">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                              <span className="text-xs font-bold text-primary">{s.initials}</span>
                            </div>
                            <div className="min-w-0">
                              <p className="font-medium text-sm font-body break-words">{s.full_name || "Sem nome"}</p>
                              <p className="text-xs text-muted-foreground font-body break-words">{s.email}</p>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell className="font-body text-sm hidden xl:table-cell py-2 px-2 break-words">{s.phone || "—"}</TableCell>
                        <TableCell className="font-body text-xs text-muted-foreground hidden 2xl:table-cell py-2 px-2">
                          {s.created_at ? (
                            <>
                              {new Date(s.created_at).toLocaleDateString("pt-BR")}
                              <br />
                              <span className="text-[10px]">{new Date(s.created_at).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}</span>
                            </>
                          ) : "—"}
                        </TableCell>
                        <TableCell className="font-body text-sm py-2 px-2">
                          {s.plan !== "—" ? (
                            <Badge variant="outline" className={`text-xs font-medium ${getPlanTierClasses(getPlanTier(s.planDurationDays)).badge}`}>
                              {s.plan}
                            </Badge>
                          ) : (
                            <span className="text-muted-foreground">—</span>
                          )}
                        </TableCell>
                        <TableCell className="font-body text-sm hidden 2xl:table-cell py-2 px-2">{s.startDate ? new Date(s.startDate).toLocaleDateString("pt-BR") : "—"}</TableCell>
                        <TableCell className="font-body text-sm hidden lg:table-cell py-2 px-2">{s.endDate ? new Date(s.endDate).toLocaleDateString("pt-BR") : "—"}</TableCell>
                        <TableCell className="py-2 px-2">
                          <Badge variant={s.status === "active" ? "secondary" : s.status === "suspended" ? "outline" : "destructive"} className="text-xs">
                            {s.status === "active" ? "Ativo" : s.status === "suspended" ? "Suspenso" : s.status === "expired" ? "Vencido" : "Sem plano"}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right py-2 pl-2">
                          <Button variant="outline" size="sm" className="text-xs whitespace-nowrap" onClick={() => { setSelected(s); setManageOpen(true); }}>
                            Gerenciar
                          </Button>
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
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* View Dialog */}
      <Dialog open={viewOpen} onOpenChange={(o) => { setViewOpen(o); if (!o) setManageOpen(true); }}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-hidden">
          <DialogHeader><DialogTitle className="font-display">Ficha do Aluno</DialogTitle></DialogHeader>
          {selected && (
            <ScrollArea className="max-h-[75vh] pr-2 sm:pr-4">
              <div className="space-y-6">
                <section>
                  <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3">Dados Pessoais</h3>
                  {/* Quick copy buttons */}
                  <div className="flex flex-wrap gap-1.5 mb-3">
                    {[
                      { label: "Nome", value: selectedMerged.full_name },
                      { label: "Email", value: selectedMerged.email },
                      { label: "Tel", value: selectedMerged.phone },
                      { label: "Altura", value: selectedMerged.height ? `${selectedMerged.height} cm` : "" },
                      { label: "Peso", value: selectedMerged.weight ? `${selectedMerged.weight} kg` : "" },
                    ].filter(i => i.value).map(item => (
                      <Button
                        key={item.label}
                        variant="outline"
                        size="sm"
                        className="h-7 text-xs gap-1 px-2"
                        onClick={() => {
                          navigator.clipboard.writeText(item.value!);
                          toast.success(`${item.label} copiado!`);
                        }}
                      >
                        <Copy className="w-3 h-3" />
                        {item.label}
                      </Button>
                    ))}
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
                    <div className="sm:col-span-2"><span className="text-muted-foreground">Nome:</span> <span className="font-medium">{selectedMerged.full_name}</span></div>
                    <div className="break-all"><span className="text-muted-foreground">Email:</span> <span className="font-medium">{selectedMerged.email}</span></div>
                    <div className="flex items-center gap-2">
                      <span className="text-muted-foreground">Telefone:</span>
                      <span className="font-medium">{selectedMerged.phone || "—"}</span>
                      {selectedMerged.phone && selectedMerged.phone.replace(/\D/g, "").length >= 10 && (
                        <WhatsAppPopoverButton phone={selectedMerged.phone} name={selectedMerged.full_name} size="sm" userId={selectedMerged.user_id} studentProfile={{ full_name: selectedMerged.full_name, email: selectedMerged.email, phone: selectedMerged.phone, weight: selectedMerged.weight, height: selectedMerged.height, objective: selectedMerged.objective, birth_date: selectedMerged.birth_date }} />
                      )}
                      {selectedMerged.user_id && (
                        <NotifyStudentToggle userId={selectedMerged.user_id} />
                      )}
                    </div>
                    <div><span className="text-muted-foreground">Gênero:</span> <span className="font-medium capitalize">{selectedMerged.gender || "—"}</span></div>
                    <div><span className="text-muted-foreground">Nascimento:</span> <span className="font-medium">{selectedMerged.birth_date ? new Date(selectedMerged.birth_date + "T12:00:00").toLocaleDateString("pt-BR") : "—"}</span></div>
                    <div><span className="text-muted-foreground">Idade:</span> <span className="font-medium">{selectedMerged.birth_date ? `${calculateAge(selectedMerged.birth_date)} anos` : "—"}</span></div>
                    <div><span className="text-muted-foreground">Altura:</span> <span className="font-medium">{selectedMerged.height ? `${selectedMerged.height} cm` : "—"}</span></div>
                    <div><span className="text-muted-foreground">Peso:</span> <span className="font-medium">{selectedMerged.weight ? `${selectedMerged.weight} kg` : "—"}</span></div>
                    {/* Plan expiry date */}
                    <div><span className="text-muted-foreground">Plano:</span> <span className="font-medium">{selected.plan || "—"}</span></div>
                    <div>
                      <span className="text-muted-foreground">Vencimento:</span>{" "}
                      <span className={cn("font-medium", selected.status === "expired" && "text-destructive", selected.status === "active" && "text-primary")}>
                        {selected.endDate ? new Date(selected.endDate + "T12:00:00").toLocaleDateString("pt-BR") : "—"}
                      </span>
                    </div>
                  </div>
                </section>
                <section>
                  <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3">Histórico de Planos</h3>
                  <StudentPlanHistory userId={selected.user_id} />
                </section>
                {/* Peso: inicial × atual × variação */}
                <section>
                  <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3 flex items-center gap-2">
                    <Calculator className="w-4 h-4" /> Evolução de Peso
                  </h3>
                  {weightLogs && weightLogs.length > 0 ? (() => {
                    const asc = [...weightLogs].sort((a: any, b: any) => new Date(a.logged_at).getTime() - new Date(b.logged_at).getTime());
                    const first = asc[0];
                    const last = asc[asc.length - 1];
                    const initial = Number(first.weight);
                    const current = Number(last.weight);
                    const diff = current - initial;
                    const sign = diff > 0 ? "+" : "";
                    const trendColor = diff > 0 ? "text-destructive" : diff < 0 ? "text-primary" : "text-muted-foreground";
                    return (
                      <div className="grid grid-cols-3 gap-3 text-center">
                        <div className="bg-muted/50 rounded-lg p-3">
                          <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Peso Inicial</p>
                          <p className="font-bold text-sm mt-1">{initial.toFixed(1)} kg</p>
                          <p className="text-[10px] text-muted-foreground/70 mt-0.5">{new Date(first.logged_at).toLocaleDateString("pt-BR")}</p>
                        </div>
                        <div className="bg-muted/50 rounded-lg p-3">
                          <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Peso Atual</p>
                          <p className="font-bold text-sm mt-1">{current.toFixed(1)} kg</p>
                          <p className="text-[10px] text-muted-foreground/70 mt-0.5">{new Date(last.logged_at).toLocaleDateString("pt-BR")}</p>
                        </div>
                        <div className="bg-primary/10 rounded-lg p-3 border border-primary/20">
                          <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Variação</p>
                          <p className={`font-bold text-sm mt-1 ${trendColor}`}>
                            {diff === 0 ? "0.0 kg" : `${sign}${diff.toFixed(1)} kg`}
                          </p>
                          <p className="text-[10px] text-muted-foreground/70 mt-0.5">{asc.length} registro(s)</p>
                        </div>
                      </div>
                    );
                  })() : (
                    <p className="text-sm text-muted-foreground">
                      {selectedMerged.weight ? `Peso cadastrado: ${selectedMerged.weight} kg — nenhuma atualização registrada ainda.` : "Sem registros de peso ainda."}
                    </p>
                  )}
                </section>
                <section>
                  <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3">Treino atribuído</h3>
                  <StudentWorkoutAlertCard
                    userId={selected.user_id}
                    onOpenAssign={() => { setViewOpen(false); setProgramsOpen(true); }}
                  />
                </section>
                <section>
                  <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3">Atividade & Objetivo</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
                    <div className="col-span-1 sm:col-span-2"><span className="text-muted-foreground">Nível atividade (NEAT):</span> <span className="font-medium">{physicalActivityLevelOptions.find(o => o.value === selectedMerged.physical_activity_level)?.label || "—"}</span></div>
                    <div><span className="text-muted-foreground">Atividade:</span> <span className="font-medium">{activityLabels[selectedMerged.activity_type] || selectedMerged.physical_activity || "—"}</span></div>
                    <div><span className="text-muted-foreground">Cardio:</span> <span className="font-medium">{selectedMerged.does_cardio === true ? "Sim" : selectedMerged.does_cardio === false ? "Não" : "—"}</span></div>
                    <div className="col-span-1 sm:col-span-2"><span className="text-muted-foreground">Objetivo:</span> <span className="font-medium">{objectiveLabels[selectedMerged.objective] || selectedMerged.objective || "—"}</span></div>
                  </div>
                  {/* Training details */}
                  {((selectedFullProfile as any)?.activity_type === "musculacao" || (selectedFullProfile as any)?.activity_type === "crossfit") && (
                    <div className="mt-3 p-3 rounded-lg bg-muted/30 border border-border/50">
                      <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Detalhes do treino</p>
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-sm">
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
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-sm">
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
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
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
                  <DocumentUpload
                    userId={selected.user_id}
                    onUploaded={() => qc.invalidateQueries({ queryKey: ["admin-students-list"] })}
                  />
                </section>
                {/* Body Images in View */}
                <section>
                  <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3">Autorização de Imagem</h3>
                  <div className="mb-4">
                    <StudentImageAuthSummary userId={selected.user_id} />
                  </div>
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
                              <div className="relative group">
                                <SignedImage bucket="body-images" storagePath={img.storage_path} publicUrl={img.image_url} alt={labels[type]} className="w-full aspect-[3/4] object-cover rounded-lg border" />
                                <button
                                  type="button"
                                  className="absolute bottom-1 right-1 p-1.5 bg-background/80 backdrop-blur-sm rounded-full border border-border/50 opacity-0 group-hover:opacity-100 transition-opacity hover:bg-background"
                                  title="Baixar imagem"
                                  onClick={async () => {
                                    const signed = await getSecureFileUrl({
                                      bucket: "body-images",
                                      storagePath: img.storage_path || extractStoragePath(img.image_url, "body-images"),
                                      fallbackUrl: img.image_url,
                                    });
                                    if (!signed) return;
                                    const r = await fetch(signed);
                                    const blob = await r.blob();
                                    const url = URL.createObjectURL(blob);
                                    const a = document.createElement("a");
                                    a.href = url;
                                    a.download = `${selected.full_name || "aluno"}_${type}.jpg`;
                                    document.body.appendChild(a);
                                    a.click();
                                    document.body.removeChild(a);
                                    URL.revokeObjectURL(url);
                                  }}
                                >
                                  <Download className="w-3 h-3" />
                                </button>
                              </div>
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

                {/* Comparação de Evolução (inicial × atual) */}
                <section>
                  <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3">Comparação de Evolução</h3>
                  <EvolutionComparison userId={selected.user_id} />
                </section>

                {/* Histórico cronológico de todas as atualizações arquivadas */}
                <section>
                  <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3">Histórico de Atualizações</h3>
                  <EvolutionUpdateHistory userId={selected.user_id} />
                </section>
              </div>
            </ScrollArea>
          )}
        </DialogContent>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog open={editOpen} onOpenChange={(o) => { setEditOpen(o); if (!o) { setActiveTab("dados"); setSavedTabs(new Set()); setManageOpen(true); } }}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="font-display text-base sm:text-lg">Editar Aluno</DialogTitle>
            {selected && (
              <div className="flex items-center gap-1.5 flex-wrap pt-2">
                <Button variant="outline" size="sm" className="h-7 sm:h-8 gap-1 sm:gap-1.5 text-[10px] sm:text-xs px-2 sm:px-3" onClick={() => { setEditOpen(false); navigate(`/admin/training?uid=${selected.user_id}&return=edit`); }}>
                  <Dumbbell className="w-3 sm:w-3.5 h-3 sm:h-3.5" /> Treino
                </Button>
                <Button variant="outline" size="sm" className="h-7 sm:h-8 gap-1 sm:gap-1.5 text-[10px] sm:text-xs px-2 sm:px-3" onClick={() => { setEditOpen(false); navigate(`/admin/diet?uid=${selected.user_id}&return=edit`); }}>
                  <UtensilsCrossed className="w-3 sm:w-3.5 h-3 sm:h-3.5" /> Dieta
                </Button>
                <Button variant="outline" size="sm" className="h-7 sm:h-8 gap-1 sm:gap-1.5 text-[10px] sm:text-xs px-2 sm:px-3" onClick={() => { setEditOpen(false); navigate(`/admin/protocol?uid=${selected.user_id}&return=edit`); }}>
                  <Pill className="w-3 sm:w-3.5 h-3 sm:h-3.5" /> Protocolo
                </Button>
              </div>
            )}
          </DialogHeader>
          {renderStudentFormFields(false)}
        </DialogContent>
      </Dialog>

      {/* Subscription Dialog */}
      <Dialog open={subOpen} onOpenChange={(o) => { setSubOpen(o); if (!o) setManageOpen(true); }}>
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
      <Dialog open={imagesOpen} onOpenChange={(o) => { setImagesOpen(o); if (!o) setManageOpen(true); }}>
        <DialogContent className="max-w-2xl h-[92vh] sm:h-[90vh] flex flex-col p-4 sm:p-6">
          <DialogHeader>
            <DialogTitle className="font-display flex items-center gap-2">
              <Camera className="w-5 h-5" /> Imagens Corporais — {selected?.full_name}
            </DialogTitle>
          </DialogHeader>
          {selected && (
            <ScrollArea className="flex-1 min-h-0 -mr-2 pr-2">
              <div className="space-y-4">
                {/* Admin append-only upload with editable date */}
                <AdminBodyImageUpload
                  userId={selected.user_id}
                  onComplete={() => {
                    refetchBodyImages();
                    refetchAllBodyImages();
                    toast.success("Imagens atualizadas!");
                  }}
                />

                {/* Clear all images button */}
                {allBodyImages && allBodyImages.length > 0 && (
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button variant="outline" size="sm" className="w-full text-destructive border-destructive/30 hover:bg-destructive/10">
                        <Trash2 className="w-4 h-4 mr-1" /> Limpar todas as imagens ({allBodyImages.length})
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Limpar todas as imagens?</AlertDialogTitle>
                        <AlertDialogDescription>
                          Isso vai excluir permanentemente todas as {allBodyImages.length} imagens corporais deste aluno (incluindo histórico). Esta ação não pode ser desfeita.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancelar</AlertDialogCancel>
                        <AlertDialogAction
                          className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                          onClick={async () => {
                            try {
                              const filePaths = allBodyImages
                                .map((img: any) => img.storage_path || extractStoragePath(img.image_url, "body-images"))
                                .filter(Boolean) as string[];
                              if (filePaths.length > 0) {
                                await supabase.storage.from("body-images").remove(filePaths);
                              }
                              await supabase.from("body_images").delete().eq("user_id", selected!.user_id);
                              refetchBodyImages();
                              refetchAllBodyImages();
                              toast.success("Todas as imagens foram excluídas!");
                            } catch {
                              toast.error("Erro ao excluir imagens");
                            }
                          }}
                        >
                          Sim, excluir tudo
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                )}

                {/* Image History with editable dates */}
                {allBodyImages && allBodyImages.length > 0 && (
                  <AdminImageHistory
                    allImages={allBodyImages}
                    onUpdate={() => {
                      refetchBodyImages();
                      refetchAllBodyImages();
                    }}
                  />
                )}

                {/* Evolution Generator — abaixo da edição das imagens */}
                {allBodyImages && allBodyImages.length > 0 && (
                  <div id="evolution-generator-anchor">
                    <EvolutionGenerator
                      allImages={allBodyImages}
                      studentName={selected.full_name}
                      userId={selected.user_id}
                      phone={(selected as any).phone}
                    />
                  </div>
                )}
                {selected.user_id && (
                  <EvolutionArtsGallery userId={selected.user_id} studentName={selected.full_name} />
                )}
              </div>
            </ScrollArea>
          )}
        </DialogContent>
      </Dialog>

      {/* Anamnese Dialog */}
      <Dialog open={anamneseOpen} onOpenChange={(o) => { setAnamneseOpen(o); if (!o) setManageOpen(true); }}>
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

                {/* Evolution Update */}
                <AdminEvolutionUpdate
                  userId={selected.user_id}
                  studentName={selected.full_name}
                  currentWeight={selected.weight}
                  profile={selectedFullProfile}
                  onComplete={() => {
                    refetchAnamnese();
                    qc.invalidateQueries({ queryKey: ["admin-weight-logs", selected.user_id] });
                    qc.invalidateQueries({ queryKey: ["admin-students"] });
                  }}
                />

                {/* Body Images Upload (admin append mode) */}
                <AdminBodyImageUpload
                  userId={selected.user_id}
                  onComplete={() => {
                    refetchBodyImages();
                    refetchAllBodyImages();
                    refetchAnamnese();
                    toast.success("Imagens adicionadas!");
                  }}
                />

                {/* Image History with editable dates */}
                {anamneseBodyImages && anamneseBodyImages.length > 0 && (
                  <AdminImageHistory
                    allImages={anamneseBodyImages}
                    onUpdate={() => {
                      refetchBodyImages();
                      refetchAllBodyImages();
                      refetchAnamnese();
                    }}
                  />
                )}

                {/* Evolution Generator — abaixo da edição das imagens */}
                {anamneseBodyImages && anamneseBodyImages.length > 0 && (
                  <EvolutionGenerator
                    allImages={anamneseBodyImages}
                    studentName={selected.full_name}
                    userId={selected.user_id}
                    phone={(selected as any).phone}
                  />
                )}
                {selected.user_id && (
                  <EvolutionArtsGallery userId={selected.user_id} studentName={selected.full_name} />
                )}

                {/* Weight History */}
                {weightLogs && weightLogs.length > 0 && (
                  <Card>
                    <CardHeader className="pb-2 flex flex-row items-center justify-between">
                      <CardTitle className="text-sm font-display flex items-center gap-2">
                        <Calculator className="w-4 h-4" /> Histórico de Peso
                      </CardTitle>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button variant="outline" size="sm" className="text-destructive border-destructive/30 hover:bg-destructive/10 h-7 text-xs">
                            <Trash2 className="w-3 h-3 mr-1" /> Limpar registros ({weightLogs.length})
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Limpar histórico de peso?</AlertDialogTitle>
                            <AlertDialogDescription>
                              Isso vai excluir permanentemente todos os {weightLogs.length} registros de peso deste aluno. O peso atual no perfil será mantido. Esta ação não pode ser desfeita.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancelar</AlertDialogCancel>
                            <AlertDialogAction
                              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                              onClick={async () => {
                                try {
                                  const { error } = await supabase
                                    .from("weight_logs")
                                    .delete()
                                    .eq("user_id", selected!.user_id);
                                  if (error) throw error;
                                  qc.invalidateQueries({ queryKey: ["admin-weight-logs", selected!.user_id] });
                                  toast.success("Registros de peso limpos com sucesso!");
                                } catch {
                                  toast.error("Erro ao limpar registros de peso");
                                }
                              }}
                            >
                              Sim, limpar
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2">
                        {weightLogs.map((log: any) => (
                          <div key={log.id} className="flex items-center justify-between border-b border-border/50 pb-2 last:border-0 last:pb-0">
                            <div>
                              <p className="text-sm font-bold text-foreground">{Number(log.weight).toFixed(1)} kg</p>
                              {log.notes && <p className="text-xs text-muted-foreground">{log.notes}</p>}
                            </div>
                            <p className="text-xs text-muted-foreground">
                              {new Date(log.logged_at).toLocaleDateString("pt-BR")}
                            </p>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* Notes History */}
                {anamneseEntries && anamneseEntries.length > 0 && (
                  <Card>
                    <CardHeader className="pb-2 cursor-pointer select-none" onClick={() => setNotesHistoryOpen(v => !v)}>
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-sm font-display">
                          Histórico de Anotações ({anamneseEntries.length})
                        </CardTitle>
                        {notesHistoryOpen ? <ChevronUp className="w-4 h-4 text-muted-foreground" /> : <ChevronDown className="w-4 h-4 text-muted-foreground" />}
                      </div>
                    </CardHeader>
                    {notesHistoryOpen && (
                      <CardContent className="space-y-3">
                        {anamneseEntries.map((entry: any) => (
                          <AnamnesisEntryItem key={entry.id} entry={entry} onSaved={refetchAnamnese} />
                        ))}
                      </CardContent>
                    )}
                  </Card>
                )}

                {/* Snapshots de Evolução / Comparação */}
                {selected && (
                  <Card>
                    <CardHeader className="pb-2 cursor-pointer select-none" onClick={() => setSnapshotsOpen(v => !v)}>
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-sm font-display">Comparação de Evolução</CardTitle>
                        {snapshotsOpen ? <ChevronUp className="w-4 h-4 text-muted-foreground" /> : <ChevronDown className="w-4 h-4 text-muted-foreground" />}
                      </div>
                    </CardHeader>
                    {snapshotsOpen && (
                      <CardContent>
                        <EvolutionComparison userId={selected.user_id} />
                        <div className="mt-4">
                          <EvolutionUpdateHistory userId={selected.user_id} />
                        </div>
                      </CardContent>
                    )}
                  </Card>
                )}

                {(!anamneseEntries || anamneseEntries.length === 0) && (!anamneseBodyImages || anamneseBodyImages.length === 0) && (!weightLogs || weightLogs.length === 0) && (
                  <p className="text-sm text-muted-foreground text-center py-4">Nenhum registro de anamnese ainda.</p>
                )}
              </div>
            </ScrollArea>
          )}
        </DialogContent>
      </Dialog>

      {/* Password reset dialog */}
      <Dialog open={!!passwordReset} onOpenChange={(open) => { if (!open) { setPasswordReset(null); setNewPassword(""); setManageOpen(true); } }}>
        <DialogContent>
          <DialogHeader><DialogTitle>Alterar senha</DialogTitle></DialogHeader>
          <p className="text-sm text-muted-foreground">Definir nova senha para <strong>{passwordReset?.name}</strong></p>
          <div className="space-y-2">
            <Label>Nova senha *</Label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input type={showResetPassword ? "text" : "password"} placeholder="Mínimo 6 caracteres" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} className="pl-10 pr-10" minLength={6} />
              <button type="button" onClick={() => setShowResetPassword(!showResetPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors">
                {showResetPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setPasswordReset(null); setNewPassword(""); }}>Cancelar</Button>
            <Button onClick={() => resetPasswordMutation.mutate()} disabled={resetPasswordMutation.isPending || newPassword.length < 6}>
              {resetPasswordMutation.isPending ? "Alterando..." : "Alterar senha"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Orphan user dialog */}
      <Dialog open={!!orphanData} onOpenChange={(open) => { if (!open) setOrphanData(null); }}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-warning">
              <AlertTriangle className="h-5 w-5" /> Cadastro Incompleto Detectado
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-3 text-sm">
            <p className="text-muted-foreground">
              O email <strong className="text-foreground">{orphanData?.email}</strong> existe no sistema de autenticação, mas está com cadastro incompleto (sem perfil ou permissão).
            </p>
            <div className="rounded-lg border border-border p-3 space-y-1 text-xs">
              <p>Perfil: {orphanData?.has_profile ? <Badge variant="outline" className="text-xs">OK</Badge> : <Badge variant="destructive" className="text-xs">Ausente</Badge>}</p>
              <p>Permissão: {orphanData?.has_role ? <Badge variant="outline" className="text-xs">OK</Badge> : <Badge variant="destructive" className="text-xs">Ausente</Badge>}</p>
              <p className="text-muted-foreground">Criado em: {orphanData?.created_at ? new Date(orphanData.created_at).toLocaleDateString("pt-BR") : "—"}</p>
            </div>
            <p className="text-muted-foreground">Escolha uma ação:</p>
          </div>
          <div className="flex flex-col gap-2">
            <Button
              onClick={handleOrphanDelete}
              disabled={orphanLoading}
              variant="destructive"
              className="w-full justify-start gap-2"
            >
              <UserX className="h-4 w-4" />
              {orphanLoading ? "Processando..." : "Excluir e recadastrar do zero"}
            </Button>
            <Button
              onClick={handleOrphanRepair}
              disabled={orphanLoading}
              variant="outline"
              className="w-full justify-start gap-2"
            >
              <UserCheck className="h-4 w-4" />
              {orphanLoading ? "Processando..." : "Reparar cadastro (criar perfil e permissão)"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!deleteTarget} onOpenChange={(v) => { if (!v) { setDeleteTarget(null); setDeleteConfirmText(""); } }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir aluno?</AlertDialogTitle>
            <AlertDialogDescription asChild>
              <div className="space-y-2 text-sm text-muted-foreground">
                <p>Esta ação é irreversível. Todos os dados de <strong>{deleteTarget?.name}</strong> serão removidos permanentemente (dietas, treinos, protocolos, imagens, pagamentos e assinatura).</p>
                <p>Digite <strong className="text-destructive">DELETAR</strong> para confirmar:</p>
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <Input
            value={deleteConfirmText}
            onChange={(e) => setDeleteConfirmText(e.target.value)}
            placeholder="Digite DELETAR"
            className="font-mono tracking-widest"
            autoComplete="off"
          />
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              disabled={deleteConfirmText !== "DELETAR"}
              onClick={() => { if (deleteTarget) { deleteMutation.mutate(deleteTarget.userId); setDeleteTarget(null); setDeleteConfirmText(""); } }}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90 disabled:opacity-50"
            >
              Excluir permanentemente
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {selected && (
        <AdminBioimpedance
          userId={selected.user_id}
          studentName={selected.full_name || selected.email}
          open={bioOpen}
          onOpenChange={(o) => { setBioOpen(o); if (!o) setManageOpen(true); }}
        />
      )}

      {/* Manage Panel Dialog */}
      <Dialog open={manageOpen} onOpenChange={setManageOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="font-display flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                <span className="text-sm font-bold text-primary">{selected?.initials}</span>
              </div>
              <div className="min-w-0">
                <p className="break-words">{selected?.full_name || "Aluno"}</p>
                <p className="text-xs text-muted-foreground font-normal break-words">{selected?.email}</p>
              </div>
            </DialogTitle>
          </DialogHeader>
          {selected && (
            <PreviewUnlockToggle
              userId={selected.user_id}
              studentName={selected.full_name}
              studentPhone={selected.phone}
              onChanged={() => qc.invalidateQueries({ queryKey: ["admin-students-list"] })}
            />
          )}
          <div className="grid grid-cols-3 gap-2 pt-2">
            {[
              { icon: Eye, label: "Visão Geral", action: () => { setManageOpen(false); openView(selected); } },
              { icon: Pencil, label: "Editar", action: () => { setManageOpen(false); openEdit(selected); } },
              { icon: UtensilsCrossed, label: "Dieta", action: () => { setManageOpen(false); navigate(`/admin/diet?uid=${selected?.user_id}&return=manage`); } },
              { icon: Pill, label: "Protocolo", action: () => { setManageOpen(false); navigate(`/admin/protocol?uid=${selected?.user_id}&return=manage`); } },
              { icon: Dumbbell, label: "Treino", action: () => { setManageOpen(false); navigate(`/admin/training?uid=${selected?.user_id}&return=manage`); } },
              { icon: Layers, label: "Programas", action: () => { setManageOpen(false); setProgramsOpen(true); } },
              { icon: Camera, label: "Fotos", action: () => { setManageOpen(false); setImagesOpen(true); } },
              { icon: Activity, label: "Bioimpedância", action: () => { setManageOpen(false); setBioOpen(true); } },
              { icon: ClipboardList, label: "Anamnese", action: () => { setManageOpen(false); setAnamneseOpen(true); } },
              { icon: Microscope, label: "Central de Análise", action: () => { setManageOpen(false); setMetabolicOpen(true); } },
              { icon: Zap, label: "STH Flow", action: () => { setManageOpen(false); setFlowOpen(true); } },
              { icon: CreditCard, label: "Assinatura", action: () => { setManageOpen(false); openSub(selected); } },
              { icon: Lock, label: "Alterar Senha", action: () => { setManageOpen(false); setPasswordReset({ userId: selected?.user_id, name: selected?.full_name || selected?.email }); setNewPassword(""); } },
              { icon: ShieldCheck, label: "Verificar Identidade", action: () => { setManageOpen(false); navigate(`/admin/verificacao-identidade?uid=${selected?.user_id}&name=${encodeURIComponent(selected?.full_name || selected?.email || "")}`); } },
              { icon: Link2, label: "Link Renovação", action: () => { navigator.clipboard.writeText(`${window.location.origin}/dashboard/renew?uid=${selected?.user_id}`); toast.success("Link copiado!"); setManageOpen(false); } },
              { icon: Link2, label: "Link 1ª Adesão", action: () => { navigator.clipboard.writeText(`${window.location.origin}/dashboard/pagar?uid=${selected?.user_id}`); toast.success("Link de pagamento copiado!"); setManageOpen(false); } },
              { icon: Trash2, label: "Excluir", action: () => { setManageOpen(false); setDeleteTarget({ userId: selected?.user_id, name: selected?.full_name || selected?.email }); }, destructive: true },
            ].map(({ icon: Icon, label, action, destructive }) => (
              <button
                key={label}
                onClick={action}
                className={cn(
                  "flex flex-col items-center gap-1.5 p-3 rounded-xl border border-border/50 transition-all duration-200 hover:scale-[1.03] hover:shadow-sm",
                  destructive
                    ? "hover:bg-destructive/10 hover:border-destructive/30 text-destructive"
                    : "hover:bg-primary/5 hover:border-primary/20"
                )}
              >
                <Icon className="w-5 h-5" />
                <span className="text-[10px] font-medium leading-tight text-center">{label}</span>
              </button>
            ))}
          </div>
        </DialogContent>
      </Dialog>

      {selected && (
        <AdminMetabolicPanel
          open={metabolicOpen}
          onOpenChange={(o) => { setMetabolicOpen(o); if (!o) setManageOpen(true); }}
          userId={selected.user_id}
          userName={selected.full_name || selected.email}
          studentPhone={selected.phone}
        />
      )}

      {selected && (
        <AdminFlowStatusDialog
          open={flowOpen}
          onOpenChange={(o) => { setFlowOpen(o); if (!o) setManageOpen(true); }}
          userId={selected.user_id}
          userName={selected.full_name || selected.email}
        />
      )}

      <StudentProgramAssignDialog
        open={programsOpen}
        onOpenChange={(o) => { setProgramsOpen(o); if (!o) setManageOpen(true); }}
        userId={selected?.user_id || null}
        userName={selected?.full_name || selected?.email}
      />

    </DashboardLayout>
  );
};

export default AdminStudents;
