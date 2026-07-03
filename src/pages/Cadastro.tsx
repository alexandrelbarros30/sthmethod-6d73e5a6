import { useState, useEffect } from "react";
import { useNavigate, Link, useLocation } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";

import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Slider } from "@/components/ui/slider";
import {
  ArrowLeft, ArrowRight, Check, Mail, Lock, User, Phone, Loader2,
  CheckCircle, Calculator,
  Eye, EyeOff, HelpCircle, MessageCircle, ShieldCheck, Sparkles,
} from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import { toast } from "sonner";

import DynamicCheckoutDialog from "@/components/DynamicCheckoutDialog";
import BodyImageUpload from "@/components/shared/BodyImageUpload";
import DocumentUpload from "@/components/shared/DocumentUpload";
import { calculateAge, calculateMacros, type MacroResult } from "@/lib/macro-calculator";
import {
  objectiveLabels, activityLabels,
  trainingIntensityOptions, cardioIntensityOptions,
  physicalActivityLevelOptions,
} from "@/lib/form-constants";

// Small helper: didactic "Why are we asking this?" tooltip
const WhyTip = ({ children }: { children: React.ReactNode }) => (
  <Popover>
    <PopoverTrigger asChild>
      <button
        type="button"
        aria-label="Por que pedimos isso?"
        className="inline-flex items-center gap-1 text-[11px] text-primary/80 hover:text-primary transition-colors ml-1"
      >
        <HelpCircle className="w-3.5 h-3.5" />
        <span className="hidden sm:inline">Por quê?</span>
      </button>
    </PopoverTrigger>
    <PopoverContent className="w-72 text-xs font-body leading-relaxed">
      {children}
    </PopoverContent>
  </Popover>
);

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

const isValidCpf = (cpf: string): boolean => {
  const d = cpf.replace(/\D/g, "");
  if (d.length !== 11 || /^(\d)\1{10}$/.test(d)) return false;
  let sum = 0;
  for (let i = 0; i < 9; i++) sum += parseInt(d[i]) * (10 - i);
  let rem = (sum * 10) % 11;
  if (rem === 10) rem = 0;
  if (rem !== parseInt(d[9])) return false;
  sum = 0;
  for (let i = 0; i < 10; i++) sum += parseInt(d[i]) * (11 - i);
  rem = (sum * 10) % 11;
  if (rem === 10) rem = 0;
  return rem === parseInt(d[10]);
};

const steps = [
  { n: 1, label: "Conta" },
  { n: 2, label: "Perfil" },
  { n: 3, label: "Fotos" },
  { n: 4, label: "Plano" },
];

const CADASTRO_DRAFT_KEY = "sth:cadastro-draft:v2";

const getCadastroDraft = () => {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(CADASTRO_DRAFT_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
};

const defaultProfileForm = (quizData?: any, draft?: any) => ({
  cpf: draft?.cpf || "",
  birth_date: draft?.birth_date || quizData?.birth_date || "",
  height: draft?.height || quizData?.height || "",
  weight: draft?.weight || quizData?.weight || "",
  gender: draft?.gender || quizData?.gender || "",
  activity_type: draft?.activity_type || quizData?.activity_type || "",
  does_cardio: draft?.does_cardio || quizData?.does_cardio || "",
  physical_activity_level: draft?.physical_activity_level || quizData?.physical_activity_level || "",
  objective: draft?.objective || quizData?.objective || "",
  current_protocol: draft?.current_protocol || "",
  comorbidities: draft?.comorbidities || "",
  additional_info: draft?.additional_info || "",
  training_days_per_week: draft?.training_days_per_week || quizData?.training_days_per_week || "",
  training_duration_minutes: draft?.training_duration_minutes || quizData?.training_duration_minutes || "",
  training_intensity: draft?.training_intensity || quizData?.training_intensity || "",
  cardio_days_per_week: draft?.cardio_days_per_week || quizData?.cardio_days_per_week || "",
  cardio_duration_minutes: draft?.cardio_duration_minutes || quizData?.cardio_duration_minutes || "",
  cardio_intensity: draft?.cardio_intensity || quizData?.cardio_intensity || "",
});

const Cadastro = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const quizData = (location.state as any)?.quizData || null;
  const cadastroDraft = getCadastroDraft();
  const [step, setStep] = useState(() => {
    const savedStep = Number(cadastroDraft?.step || 1);
    return [1, 2, 3, 4].includes(savedStep) ? savedStep : 1;
  });
  const [loading, setLoading] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);
  const [checkoutOpen, setCheckoutOpen] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<any>(null);
  const [macroResult, setMacroResult] = useState<MacroResult | null>(null);

  // Step 1 - Account — pre-fill from URL params (admin-shared promo links)
  const initialParams = new URLSearchParams(location.search);
  const [email, setEmail] = useState(initialParams.get("email") || cadastroDraft?.email || "");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState(initialParams.get("name") || cadastroDraft?.fullName || "");
  const [phoneVal, setPhoneVal] = useState(
    initialParams.get("phone") ? phoneMask(initialParams.get("phone")!) : cadastroDraft?.phoneVal || ""
  );
  const [showPassword, setShowPassword] = useState(false);

  // Step 2 - Profile
  const [profileForm, setProfileForm] = useState(() => defaultProfileForm(quizData, cadastroDraft?.profileForm));

  // Step 3 - Body images
  const [imagesComplete, setImagesComplete] = useState(false);

  useEffect(() => {
    const draft = {
      step,
      userId,
      email,
      fullName,
      phoneVal,
      profileForm,
      imagesComplete,
      updatedAt: new Date().toISOString(),
    };
    const hasDraft = Boolean(email || fullName || phoneVal || Object.values(profileForm).some(Boolean) || step > 1 || imagesComplete);
    if (hasDraft) localStorage.setItem(CADASTRO_DRAFT_KEY, JSON.stringify(draft));
    else localStorage.removeItem(CADASTRO_DRAFT_KEY);
  }, [step, email, fullName, phoneVal, profileForm, imagesComplete]);

  // Auto-calculate age
  const age = profileForm.birth_date ? calculateAge(profileForm.birth_date) : null;

  // Reset conditional fields when activity/cardio changes
  useEffect(() => {
    if (profileForm.activity_type === "nenhuma") {
      setProfileForm(prev => ({
        ...prev,
        training_days_per_week: "", training_duration_minutes: "", training_intensity: "",
      }));
    }
  }, [profileForm.activity_type]);

  useEffect(() => {
    if (profileForm.does_cardio === "nao") {
      setProfileForm(prev => ({
        ...prev,
        cardio_days_per_week: "", cardio_duration_minutes: "", cardio_intensity: "",
      }));
    }
  }, [profileForm.does_cardio]);

  // Auto-calculate macros when all required fields are filled
  useEffect(() => {
    const { gender, weight, height, birth_date, activity_type, does_cardio, objective } = profileForm;
    if (gender && weight && height && birth_date && activity_type && does_cardio !== "" && objective) {
      const a = calculateAge(birth_date);
      if (a > 0 && a < 120) {
        const result = calculateMacros({
          gender: gender as "masculino" | "feminino",
          age: a,
          weight: Number(weight),
          height: Number(height),
          activityType: activity_type,
          doesCardio: does_cardio === "sim",
          objective,
          physicalActivityLevel: profileForm.physical_activity_level || undefined,
          trainingDaysPerWeek: profileForm.training_days_per_week ? Number(profileForm.training_days_per_week) : undefined,
          trainingDurationMinutes: profileForm.training_duration_minutes ? Number(profileForm.training_duration_minutes) : undefined,
          trainingIntensity: profileForm.training_intensity || undefined,
          cardioDaysPerWeek: profileForm.cardio_days_per_week ? Number(profileForm.cardio_days_per_week) : undefined,
          cardioDurationMinutes: profileForm.cardio_duration_minutes ? Number(profileForm.cardio_duration_minutes) : undefined,
          cardioIntensity: profileForm.cardio_intensity || undefined,
        });
        setMacroResult(result);
      }
    } else {
      setMacroResult(null);
    }
  }, [profileForm]);

  // Check if user is already logged in
  useEffect(() => {
    // Pre-read redirect param to short-circuit normal flow when present
    const pendingRedirect = new URLSearchParams(location.search).get("redirect");

    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        setUserId(session.user.id);
        if (session.user.email) setEmail(session.user.email);
        supabase.from("profiles").select("*").eq("user_id", session.user.id).single().then(({ data: p }) => {
          if (p) {
            setFullName(p.full_name || "");
            setPhoneVal(p.phone || "");
            if (p.email) setEmail(p.email);
            const savedProfileDraft = getCadastroDraft()?.profileForm;
            setProfileForm(savedProfileDraft ? { ...defaultProfileForm(null), ...savedProfileDraft } : {
              cpf: p.cpf ? cpfMask(p.cpf) : "",
              birth_date: p.birth_date || "",
              height: p.height?.toString() || "",
              weight: p.weight?.toString() || "",
              gender: (p as any).gender || "",
              activity_type: (p as any).activity_type || "",
              does_cardio: (p as any).does_cardio === true ? "sim" : (p as any).does_cardio === false ? "nao" : "",
              physical_activity_level: (p as any).physical_activity_level || "",
              objective: p.objective || "",
              current_protocol: p.current_protocol || "",
              comorbidities: p.comorbidities || "",
              additional_info: (p as any).additional_info || "",
              training_days_per_week: (p as any).training_days_per_week?.toString() || "",
              training_duration_minutes: (p as any).training_duration_minutes?.toString() || "",
              training_intensity: (p as any).training_intensity || "",
              cardio_days_per_week: (p as any).cardio_days_per_week?.toString() || "",
              cardio_duration_minutes: (p as any).cardio_duration_minutes?.toString() || "",
              cardio_intensity: (p as any).cardio_intensity || "",
            });
            const profileDone = p.full_name && p.phone && p.height && p.weight && (p as any).gender && (p as any).activity_type && p.objective && p.current_protocol && p.comorbidities;

            // CRITICAL: if user has redirect (e.g. from /promo/:slug) and onboarding is complete,
            // skip the public-plans step and go straight to the destination (promo checkout)
            if (p.onboarding_complete && pendingRedirect) {
              toast.success("Cadastro completo! Indo ao pagamento da promoção...");
              setTimeout(() => navigate(pendingRedirect), 400);
              return;
            }

            if (p.onboarding_complete) {
              supabase.from("subscriptions").select("*").eq("user_id", session.user.id).eq("status", "active").limit(1).maybeSingle().then(({ data: sub }) => {
                if (sub && new Date(sub.end_date) > new Date()) {
                  // Has active subscription — let them fix profile/photos, start at step 2
                  setStep(2);
                } else {
                  setStep(4);
                }
              });
            } else if (profileDone) {
              setStep(3);
            } else {
              setStep(2);
            }
          } else {
            setStep(2);
          }
        });
      } else if (step > 1) {
        setStep(1);
      }
    });
  }, []);

  const { data: plans } = useQuery({
    queryKey: ["public-plans"],
    queryFn: async () => {
      const { data } = await supabase.from("plans").select("*").eq("active", true).eq("visibility", "public").order("duration_days");
      return data || [];
    },
  });

  const { data: bodyImages, refetch: refetchImages } = useQuery({
    queryKey: ["cadastro-body-images", userId],
    queryFn: async () => {
      const { data } = await supabase.from("body_images").select("*").eq("user_id", userId!).eq("is_current", true);
      return data || [];
    },
    enabled: !!userId,
  });

  const calculateFinalPrice = (plan: any) => {
    const priceStr = plan.price.replace(/[^\d,\.]/g, "").replace(",", ".");
    let amount = parseFloat(priceStr) || 0;
    if (plan.discount_type === "percentage" && plan.discount_value > 0) {
      amount = amount * (1 - plan.discount_value / 100);
    } else if (plan.discount_type === "fixed" && plan.discount_value > 0) {
      amount = Math.max(0, amount - plan.discount_value);
    }
    return Math.round(amount * 100) / 100;
  };

  // Step 1: Create account
  const handleCreateAccount = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullName.trim() || !email.trim() || !password || !phoneVal.trim()) {
      toast.error("Preencha todos os campos obrigatórios");
      return;
    }
    const phoneClean = phoneVal.replace(/\D/g, "");
    if (phoneClean.length < 10) {
      toast.error("Telefone inválido. Use (xx) xxxxx-xxxx");
      return;
    }
    setLoading(true);
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: { full_name: fullName },
          emailRedirectTo: `${window.location.origin}/cadastro`,
        },
      });
      if (error) throw error;
      // Supabase oculta o erro de "email já cadastrado" por padrão (anti-enumeration):
      // retorna user com identities=[] e sem session. Tratamos como duplicado.
      const identities = (data.user as any)?.identities;
      if (data.user && Array.isArray(identities) && identities.length === 0) {
        toast.error("Este email já está cadastrado. Faça login ou recupere sua senha.");
        setTimeout(() => navigate(`/login?email=${encodeURIComponent(email)}`), 1200);
        return;
      }
      if (data.user) {
        setUserId(data.user.id);
        // Wait for handle_new_user trigger to create profile, then save data
        let retries = 0;
        const saveInitialProfile = async () => {
          const updateData: any = { phone: phoneVal, full_name: fullName };
          
          // If quiz data exists, save all profile fields from the quiz
          if (quizData) {
            updateData.birth_date = profileForm.birth_date || null;
            updateData.height = profileForm.height ? Number(profileForm.height) : null;
            updateData.weight = profileForm.weight ? Number(profileForm.weight) : null;
            updateData.gender = profileForm.gender || null;
            updateData.activity_type = profileForm.activity_type || null;
            updateData.does_cardio = profileForm.does_cardio === "sim";
            updateData.objective = profileForm.objective || null;
            updateData.physical_activity_level = profileForm.physical_activity_level || null;
            updateData.physical_activity = `${activityLabels[profileForm.activity_type] || profileForm.activity_type}${profileForm.does_cardio === "sim" ? " + Cardio" : ""}`;
            updateData.training_days_per_week = profileForm.training_days_per_week ? Math.round(Number(profileForm.training_days_per_week)) : null;
            updateData.training_duration_minutes = profileForm.training_duration_minutes ? Math.round(Number(profileForm.training_duration_minutes)) : null;
            updateData.training_intensity = profileForm.training_intensity || null;
            updateData.cardio_days_per_week = profileForm.cardio_days_per_week ? Math.round(Number(profileForm.cardio_days_per_week)) : null;
            updateData.cardio_duration_minutes = profileForm.cardio_duration_minutes ? Math.round(Number(profileForm.cardio_duration_minutes)) : null;
            updateData.cardio_intensity = profileForm.cardio_intensity || null;

            // Calculate and save macros
            if (profileForm.gender && profileForm.weight && profileForm.height && profileForm.birth_date && profileForm.objective) {
              const a = calculateAge(profileForm.birth_date);
              if (a > 0 && a < 120) {
                const macros = calculateMacros({
                  gender: profileForm.gender as "masculino" | "feminino",
                  age: a, weight: Number(profileForm.weight), height: Number(profileForm.height),
                  activityType: profileForm.activity_type,
                  doesCardio: profileForm.does_cardio === "sim",
                  objective: profileForm.objective,
                  physicalActivityLevel: profileForm.physical_activity_level || undefined,
                  trainingDaysPerWeek: profileForm.training_days_per_week ? Number(profileForm.training_days_per_week) : undefined,
                  trainingDurationMinutes: profileForm.training_duration_minutes ? Number(profileForm.training_duration_minutes) : undefined,
                  trainingIntensity: profileForm.training_intensity || undefined,
                  cardioDaysPerWeek: profileForm.cardio_days_per_week ? Number(profileForm.cardio_days_per_week) : undefined,
                  cardioDurationMinutes: profileForm.cardio_duration_minutes ? Number(profileForm.cardio_duration_minutes) : undefined,
                  cardioIntensity: profileForm.cardio_intensity || undefined,
                });
                updateData.bmr = macros.bmr;
                updateData.tdee = macros.tdee;
                updateData.daily_calories = macros.dailyCalories;
                updateData.protein_g = macros.proteinG;
                updateData.carbs_g = macros.carbsG;
                updateData.fat_g = macros.fatG;
              }
            }
          }

          const { data: updated } = await supabase
            .from("profiles")
            .update(updateData)
            .eq("user_id", data.user!.id)
            .select("id");
          if ((!updated || updated.length === 0) && retries < 5) {
            retries++;
            await new Promise(r => setTimeout(r, 500));
            return saveInitialProfile();
          }
        };
        await saveInitialProfile();
        
        if (quizData) {
          toast.success("Conta criada! Dados do questionário salvos. Complete seu cadastro.");
          setStep(3);
        } else {
          toast.success("Conta criada! Vamos ao próximo passo.");
          setStep(2);
        }
      }
    } catch (error: any) {
      if (error.message?.includes("already registered")) {
        toast.error("Este email já está cadastrado. Faça login.");
      } else {
        toast.error(error.message || "Erro ao criar conta");
      }
    } finally {
      setLoading(false);
    }
  };

  // Step 2: Save profile
  const handleSaveProfile = async () => {
    const { height, weight, gender, activity_type, does_cardio, objective, current_protocol, comorbidities, birth_date, physical_activity_level } = profileForm;
    if (!validateContact()) return;
    if (!profileForm.cpf || !isValidCpf(profileForm.cpf)) { toast.error("CPF inválido"); return; }
    if (!gender) { toast.error("Selecione o gênero"); return; }
    if (!birth_date) { toast.error("Data de nascimento é obrigatória"); return; }
    if (!height || Number(height) <= 0) { toast.error("Altura é obrigatória"); return; }
    if (!weight || Number(weight) <= 0) { toast.error("Peso é obrigatório"); return; }
    if (!physical_activity_level) { toast.error("Selecione o nível de atividade física"); return; }
    if (!activity_type) { toast.error("Selecione o tipo de atividade física"); return; }
    if (!does_cardio) { toast.error("Informe se pratica cardio"); return; }
    if (does_cardio === "sim") {
      if (!profileForm.cardio_days_per_week) { toast.error("Informe os dias de cardio por semana"); return; }
      if (!profileForm.cardio_duration_minutes) { toast.error("Informe a duração do cardio"); return; }
      if (!profileForm.cardio_intensity) { toast.error("Selecione a intensidade do cardio"); return; }
    }
    if (showTrainingDetails) {
      if (!profileForm.training_days_per_week) { toast.error("Informe os dias de treino por semana"); return; }
      if (!profileForm.training_duration_minutes) { toast.error("Informe a duração dos treinos"); return; }
      if (!profileForm.training_intensity) { toast.error("Selecione a intensidade dos treinos"); return; }
    }
    if (!objective) { toast.error("Selecione o objetivo"); return; }

    setLoading(true);
    try {
      const updateData: any = {
        cpf: profileForm.cpf.replace(/\D/g, ""),
        phone: phoneVal || undefined,
        birth_date: birth_date || null,
        height: Number(height),
        weight: Number(weight),
        gender,
        activity_type: activity_type || null,
        does_cardio: does_cardio === "sim" ? true : does_cardio === "nao" ? false : null,
        objective,
        physical_activity: activity_type
          ? `${activityLabels[activity_type] || activity_type}${does_cardio === "sim" ? " + Cardio" : ""}`
          : null,
        current_protocol: current_protocol || null,
        comorbidities: comorbidities || null,
        additional_info: profileForm.additional_info,
        physical_activity_level: profileForm.physical_activity_level || null,
        training_days_per_week: profileForm.training_days_per_week ? Math.round(Number(profileForm.training_days_per_week)) : null,
        training_duration_minutes: profileForm.training_duration_minutes ? Math.round(Number(profileForm.training_duration_minutes)) : null,
        training_intensity: profileForm.training_intensity || null,
        cardio_days_per_week: profileForm.cardio_days_per_week ? Math.round(Number(profileForm.cardio_days_per_week)) : null,
        cardio_duration_minutes: profileForm.cardio_duration_minutes ? Math.round(Number(profileForm.cardio_duration_minutes)) : null,
        cardio_intensity: profileForm.cardio_intensity || null,
      };

      // Save macro results
      if (macroResult) {
        updateData.bmr = macroResult.bmr;
        updateData.tdee = macroResult.tdee;
        updateData.daily_calories = macroResult.dailyCalories;
        updateData.protein_g = macroResult.proteinG;
        updateData.carbs_g = macroResult.carbsG;
        updateData.fat_g = macroResult.fatG;
      }

      const { data: upserted, error } = await supabase
        .from("profiles")
        .upsert({ user_id: userId!, ...updateData }, { onConflict: "user_id" })
        .select("id");
      if (error) throw error;
      if (!upserted || upserted.length === 0) {
        throw new Error("Não foi possível salvar seu cadastro. Recarregue a página e tente novamente.");
      }
      toast.success("Dados salvos!");
      setStep(3);
    } catch (error: any) {
      toast.error(error.message || "Erro ao salvar dados");
    } finally {
      setLoading(false);
    }
  };

  // Check if user came from a promo/specific page that should resume after signup
  const redirectAfterSignup = new URLSearchParams(location.search).get("redirect");

  // Step 3 → 4 transition
  const handleImagesComplete = () => {
    if (!validateContact()) return;
    setImagesComplete(true);
    refetchImages();
    supabase.from("profiles").update({ onboarding_complete: true }).eq("user_id", userId!);
    if (redirectAfterSignup) {
      toast.success("Cadastro concluído! Redirecionando para finalizar a promoção...");
      setTimeout(() => navigate(redirectAfterSignup), 800);
      return;
    }
    toast.success("Fotos enviadas! Agora escolha seu plano.");
    setStep(4);
  };

  // Skip images and go directly to plans (or redirect)
  const handleSkipImages = () => {
    if (!validateContact()) return;
    supabase.from("profiles").update({ onboarding_complete: true }).eq("user_id", userId!);
    if (redirectAfterSignup) {
      toast.info("Você pode enviar as fotos depois. Vamos finalizar sua promoção!");
      setTimeout(() => navigate(redirectAfterSignup), 600);
      return;
    }
    toast.info("Você pode enviar as fotos depois. Escolha seu plano!");
    setStep(4);
  };

  const showTrainingDetails = profileForm.activity_type === "musculacao" || profileForm.activity_type === "crossfit";
  const showCardioDetails = profileForm.does_cardio === "sim";

  // Email + phone are mandatory at every step of the public signup
  const isValidEmail = (v: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.trim());
  const validateContact = (): boolean => {
    if (!email.trim() || !isValidEmail(email)) {
      toast.error("E-mail é obrigatório e deve ser válido");
      return false;
    }
    const phoneClean = (phoneVal || "").replace(/\D/g, "");
    if (phoneClean.length < 10) {
      toast.error("Telefone é obrigatório. Use (xx) xxxxx-xxxx");
      return false;
    }
    return true;
  };
  const persistContact = async () => {
    if (!userId) return;
    await supabase.from("profiles").update({ phone: phoneVal, email }).eq("user_id", userId);
  };

  const contactBlock = (
    <Card className="border-primary/20 bg-primary/5 animate-fade-in">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-display">Contato (obrigatório)</CardTitle>
        <p className="text-[11px] text-muted-foreground font-body">
          E-mail e telefone são obrigatórios em todas as etapas — usamos para te enviar acessos, recibos e suporte.
        </p>
      </CardHeader>
      <CardContent className="grid sm:grid-cols-2 gap-3 pt-0">
        <div>
          <Label className="font-body text-xs">E-mail *</Label>
          <div className="relative">
            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              onBlur={persistContact}
              className="pl-10"
              placeholder="seu@email.com"
              disabled={!!userId}
              required
            />
          </div>
        </div>
        <div>
          <Label className="font-body text-xs">Telefone *</Label>
          <div className="relative">
            <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              value={phoneVal}
              onChange={(e) => setPhoneVal(phoneMask(e.target.value))}
              onBlur={persistContact}
              className="pl-10"
              placeholder="(00) 00000-0000"
              required
            />
          </div>
        </div>
      </CardContent>
    </Card>
  );

  // Friendly labels for the pre-checkout summary
  const objectiveLabel = profileForm.objective
    ? (objectiveLabels[profileForm.objective] || profileForm.objective)
    : "—";

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
              <span className="text-primary-foreground font-bold text-sm">ST</span>
            </div>
            <span className="text-xl font-bold text-foreground">STH</span>
          </Link>
          <Link to="/login" className="text-sm text-muted-foreground hover:text-foreground transition-colors font-body">
            Já tem conta? Entrar
          </Link>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 py-8">
        {/* Step indicator */}
        <div className="flex items-center justify-center gap-1 sm:gap-2 mb-8">
          {steps.map(({ n, label }) => (
            <div key={n} className="flex items-center gap-1 sm:gap-2">
              <button
                type="button"
                disabled={n > step}
                onClick={() => { if (n <= step) setStep(n); }}
                className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold transition-colors ${
                  step > n ? "bg-primary text-primary-foreground cursor-pointer hover:ring-2 hover:ring-primary/30 hover:ring-offset-2 hover:ring-offset-background" : step === n ? "bg-primary text-primary-foreground ring-2 ring-primary/30 ring-offset-2 ring-offset-background" : "bg-muted text-muted-foreground cursor-not-allowed"
                }`}
              >
                {step > n ? <Check className="w-4 h-4" /> : n}
              </button>
              <span
                onClick={() => { if (n <= step) setStep(n); }}
                className={`text-xs sm:text-sm font-body hidden sm:inline ${step >= n ? "text-foreground cursor-pointer hover:underline" : "text-muted-foreground"}`}
              >{label}</span>
              {n < 4 && <ArrowRight className="w-3 h-3 sm:w-4 sm:h-4 text-muted-foreground" />}
            </div>
          ))}
        </div>

        {/* STEP 1: Create Account */}
        {step === 1 && (
          <Card className="animate-fade-in">
            <CardHeader>
              <CardTitle className="text-xl">Crie sua conta</CardTitle>
              <p className="text-sm text-muted-foreground font-body">
                Leva menos de 1 minuto. Vamos pedir só o essencial agora — você completa o resto depois, com calma.
              </p>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleCreateAccount} className="space-y-4">
                <div>
                  <Label className="font-body">Nome completo *</Label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input value={fullName} onChange={(e) => setFullName(e.target.value)} className="pl-10" placeholder="Seu nome completo" required />
                  </div>
                </div>
                <div>
                  <Label className="font-body">Email *</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="pl-10" placeholder="seu@email.com" required />
                  </div>
                </div>
                <div>
                  <Label className="font-body">Telefone *</Label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input value={phoneVal} onChange={(e) => setPhoneVal(phoneMask(e.target.value))} className="pl-10" placeholder="(00) 00000-0000" required />
                  </div>
                </div>
                <div>
                  <Label className="font-body">Senha *</Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input type={showPassword ? "text" : "password"} value={password} onChange={(e) => setPassword(e.target.value)} className="pl-10 pr-10" placeholder="Mínimo 6 caracteres" required minLength={6} />
                    <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors">
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
                <Button type="submit" className="w-full" size="lg" disabled={loading}>
                  {loading ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Criando conta...</> : <>Criar conta e continuar <ArrowRight className="w-4 h-4 ml-2" /></>}
                </Button>
              </form>
            </CardContent>
          </Card>
        )}

        {/* STEP 2: Profile Data */}
        {step === 2 && userId && (
          <>
          {contactBlock}
          <Card className="animate-fade-in mt-4">
            <CardHeader>
              <CardTitle className="text-xl">Complete seu perfil</CardTitle>
              <p className="text-sm text-muted-foreground font-body">
                Só o essencial para liberar seu acesso. Os campos marcados como <span className="text-foreground font-semibold">opcionais</span> podem ser preenchidos depois pelo seu painel.
              </p>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* CPF */}
              <div>
                <Label className="font-body inline-flex items-center">
                  CPF *
                  <WhyTip>
                    Usamos seu CPF apenas para emitir o comprovante do pagamento e identificar sua assinatura. Não é compartilhado.
                  </WhyTip>
                </Label>
                <Input
                  value={profileForm.cpf}
                  onChange={(e) => setProfileForm({ ...profileForm, cpf: cpfMask(e.target.value) })}
                  placeholder="000.000.000-00"
                />
              </div>

              {/* Gender */}
              <div>
                <Label className="font-body">Gênero *</Label>
                <RadioGroup
                  value={profileForm.gender}
                  onValueChange={(v) => setProfileForm({ ...profileForm, gender: v })}
                  className="flex gap-4 mt-1"
                >
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="masculino" id="gender-m" />
                    <Label htmlFor="gender-m" className="font-body cursor-pointer">Masculino</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="feminino" id="gender-f" />
                    <Label htmlFor="gender-f" className="font-body cursor-pointer">Feminino</Label>
                  </div>
                </RadioGroup>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="font-body">Data de nascimento *</Label>
                  <Input type="date" value={profileForm.birth_date} onChange={(e) => setProfileForm({ ...profileForm, birth_date: e.target.value })} />
                </div>
                <div>
                  <Label className="font-body">Idade</Label>
                  <Input value={age !== null && age > 0 ? `${age} anos` : ""} disabled className="bg-muted" />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="font-body inline-flex items-center">
                    Altura (cm) *
                    <WhyTip>
                      Altura e peso são usados para calcular suas calorias diárias e seus macros (proteína, carbo, gordura).
                    </WhyTip>
                  </Label>
                  <Input type="number" value={profileForm.height} onChange={(e) => setProfileForm({ ...profileForm, height: e.target.value })} placeholder="175" />
                </div>
                <div>
                  <Label className="font-body inline-flex items-center">
                    Peso (kg) *
                    <WhyTip>
                      Base do cálculo metabólico. Pode atualizar a qualquer momento depois, no seu painel.
                    </WhyTip>
                  </Label>
                  <Input type="number" value={profileForm.weight} onChange={(e) => setProfileForm({ ...profileForm, weight: e.target.value })} placeholder="80" />
                </div>
              </div>

              {/* Physical Activity Level (NEAT) */}
              <div>
                <Label className="font-body inline-flex items-center">
                  Nível de atividade física (sem exercícios) *
                </Label>
                <Select value={profileForm.physical_activity_level} onValueChange={(v) => setProfileForm({ ...profileForm, physical_activity_level: v })}>
                  <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                  <SelectContent>
                    {physicalActivityLevelOptions.map(o => (
                      <SelectItem key={o.value} value={o.value}>{o.label} — {o.desc}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Activity Type */}
              <div>
                <Label className="font-body inline-flex items-center">
                  Atividade física praticada *
                </Label>
                <Select value={profileForm.activity_type} onValueChange={(v) => setProfileForm({ ...profileForm, activity_type: v })}>
                  <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="musculacao">Musculação</SelectItem>
                    <SelectItem value="crossfit">CrossFit</SelectItem>
                    <SelectItem value="nenhuma">Nenhuma</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Conditional Training Details */}
              {showTrainingDetails && (
                <Card className="border-border/50 bg-muted/30">
                  <CardContent className="pt-4 space-y-3">
                    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Detalhes do treino de {activityLabels[profileForm.activity_type]}</p>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <Label className="font-body text-xs">Dias por semana *</Label>
                        <Select value={profileForm.training_days_per_week} onValueChange={(v) => setProfileForm({ ...profileForm, training_days_per_week: v })}>
                          <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                          <SelectContent>
                            {[1,2,3,4,5,6,7].map(d => <SelectItem key={d} value={d.toString()}>{d} {d === 1 ? "dia" : "dias"}</SelectItem>)}
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label className="font-body text-xs">Duração por treino (min) *</Label>
                        <Input
                          type="number"
                          min="10"
                          max="180"
                          step="1"
                          value={profileForm.training_duration_minutes}
                          onChange={(e) => setProfileForm({ ...profileForm, training_duration_minutes: e.target.value.replace(/[^\d]/g, "") })}
                          placeholder="Ex: 60"
                        />
                      </div>
                    </div>
                    <div>
                      <Label className="font-body text-xs">Intensidade dos treinos *</Label>
                      <Select value={profileForm.training_intensity} onValueChange={(v) => setProfileForm({ ...profileForm, training_intensity: v })}>
                        <SelectTrigger><SelectValue placeholder="Selecione a intensidade" /></SelectTrigger>
                        <SelectContent>
                          {trainingIntensityOptions.map(o => (
                            <SelectItem key={o.value} value={o.value}>
                              {o.label} — {o.desc}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Cardio */}
              <div>
                <Label className="font-body inline-flex items-center">
                  Faz cardio (aeróbico)? *
                </Label>
                <RadioGroup
                  value={profileForm.does_cardio}
                  onValueChange={(v) => setProfileForm({ ...profileForm, does_cardio: v })}
                  className="flex gap-4 mt-1"
                >
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="sim" id="cardio-s" />
                    <Label htmlFor="cardio-s" className="font-body cursor-pointer">Sim</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="nao" id="cardio-n" />
                    <Label htmlFor="cardio-n" className="font-body cursor-pointer">Não</Label>
                  </div>
                </RadioGroup>
              </div>

              {/* Conditional Cardio Details */}
              {showCardioDetails && (
                <Card className="border-border/50 bg-muted/30">
                  <CardContent className="pt-4 space-y-3">
                    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Detalhes do cardio</p>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <Label className="font-body text-xs">Dias por semana *</Label>
                        <Select value={profileForm.cardio_days_per_week} onValueChange={(v) => setProfileForm({ ...profileForm, cardio_days_per_week: v })}>
                          <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                          <SelectContent>
                            {[1,2,3,4,5,6,7].map(d => <SelectItem key={d} value={d.toString()}>{d} {d === 1 ? "dia" : "dias"}</SelectItem>)}
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label className="font-body text-xs">Duração por sessão (min) *</Label>
                        <Input
                          type="number"
                          min="10"
                          max="180"
                          step="1"
                          value={profileForm.cardio_duration_minutes}
                          onChange={(e) => setProfileForm({ ...profileForm, cardio_duration_minutes: e.target.value.replace(/[^\d]/g, "") })}
                          placeholder="Ex: 30"
                        />
                      </div>
                    </div>
                    <div>
                      <Label className="font-body text-xs">Intensidade do cardio *</Label>
                      <Select value={profileForm.cardio_intensity} onValueChange={(v) => setProfileForm({ ...profileForm, cardio_intensity: v })}>
                        <SelectTrigger><SelectValue placeholder="Selecione a intensidade" /></SelectTrigger>
                        <SelectContent>
                          {cardioIntensityOptions.map(o => (
                            <SelectItem key={o.value} value={o.value}>
                              {o.label} — {o.desc}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Objective */}
              <div>
                <Label className="font-body">Objetivo *</Label>
                <Select value={profileForm.objective} onValueChange={(v) => setProfileForm({ ...profileForm, objective: v })}>
                  <SelectTrigger><SelectValue placeholder="Selecione seu objetivo" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="perder_gordura">Perder gordura</SelectItem>
                    <SelectItem value="hipertrofia">Hipertrofia</SelectItem>
                    <SelectItem value="manter_peso">Manter peso</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Macros são calculados automaticamente mas não exibidos ao aluno */}

              <div>
                <Label className="font-body inline-flex items-center">
                  Protocolo atual (medicamentos/suplementos)
                  <span className="ml-2 text-[10px] uppercase tracking-wider text-muted-foreground">opcional</span>
                  <WhyTip>
                    Ajuda seu consultor a desenhar uma estratégia segura. Pode preencher depois, com calma, no painel.
                  </WhyTip>
                </Label>
                <Textarea value={profileForm.current_protocol} onChange={(e) => setProfileForm({ ...profileForm, current_protocol: e.target.value })} rows={2} placeholder="Descreva medicamentos ou suplementos que usa" />
              </div>
              <div>
                <Label className="font-body inline-flex items-center">
                  Comorbidades
                  <span className="ml-2 text-[10px] uppercase tracking-wider text-muted-foreground">opcional</span>
                </Label>
                <Textarea value={profileForm.comorbidities} onChange={(e) => setProfileForm({ ...profileForm, comorbidities: e.target.value })} rows={2} placeholder="Possui alguma condição de saúde? Se não, escreva 'Nenhuma'" />
              </div>
              <div>
                <Label className="font-body">Mais informações</Label>
                <Textarea value={profileForm.additional_info} onChange={(e) => setProfileForm({ ...profileForm, additional_info: e.target.value })} rows={2} placeholder="Informações adicionais que queira compartilhar (opcional)" />
              </div>

              {/* Document uploads — opcional */}
              <div className="rounded-lg border border-dashed border-border/60 p-3 bg-muted/20">
                <p className="text-[11px] uppercase tracking-wider text-muted-foreground mb-2">
                  Exames e documentos · opcional
                </p>
                <DocumentUpload userId={userId!} onUploaded={() => {}} />
                <p className="text-xs text-muted-foreground font-body mt-2">
                  Pode enviar agora ou depois pelo seu painel. Não bloqueia o pagamento.
                </p>
              </div>

              <div className="flex gap-3">
                <Button variant="outline" onClick={() => setStep(1)} className="flex-1"><ArrowLeft className="w-4 h-4 mr-2" /> Voltar</Button>
                <Button onClick={handleSaveProfile} disabled={loading} className="flex-1">
                  {loading ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Salvando...</> : <>Continuar <ArrowRight className="w-4 h-4 ml-2" /></>}
                </Button>
              </div>
            </CardContent>
          </Card>
          </>
        )}

        {/* STEP 3: Body Images */}
        {step === 3 && userId && (
          <div className="animate-fade-in space-y-4">
            {contactBlock}
            <Card>
              <CardHeader>
                <CardTitle className="text-xl">Fotos corporais (opcional)</CardTitle>
                <p className="text-sm text-muted-foreground font-body">
                  Servem como ponto de partida para acompanhar sua evolução. Sem pressa — você pode pular agora e enviar depois pelo painel.
                </p>
              </CardHeader>
              <CardContent>
                <div className="mb-4 rounded-lg border border-primary/20 bg-primary/5 p-3 text-xs font-body text-foreground/90 leading-relaxed">
                  <p className="font-medium text-foreground mb-1">Por que enviar suas fotos?</p>
                  <p>
                    O envio não é obrigatório, mas é <span className="font-medium text-foreground">altamente recomendado</span>. As fotos permitem a leitura da sua composição estética — identificamos pontos fortes, assimetrias e áreas a priorizar para montar o <span className="font-medium text-foreground">treino de musculação mais adequado ao seu corpo</span>. Sem elas, o protocolo trabalha só com números.
                  </p>
                </div>
                <BodyImageUpload
                  userId={userId}
                  existingImages={bodyImages || []}
                  onComplete={handleImagesComplete}
                />
              </CardContent>
            </Card>
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setStep(2)} className="flex-1"><ArrowLeft className="w-4 h-4 mr-2" /> Voltar</Button>
              <Button variant="secondary" onClick={handleSkipImages} className="flex-1">Pular por agora <ArrowRight className="w-4 h-4 ml-2" /></Button>
            </div>
          </div>
        )}

        {/* STEP 4: Choose Plan & Pay */}
        {step === 4 && userId && (
          <div className="animate-fade-in space-y-4">
            {contactBlock}
            <Card className="border-primary/20 bg-primary/5">
              <CardContent className="py-4 flex items-center gap-3">
                <CheckCircle className="w-5 h-5 text-primary" />
                <p className="text-sm font-body text-foreground">
                  Quase lá! Confira seus dados e escolha o plano para liberar o acesso.
                </p>
              </CardContent>
            </Card>

            {/* Resumo dos dados antes do pagamento */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base font-display flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-primary" /> Confira seus dados
                </CardTitle>
                <p className="text-xs text-muted-foreground font-body">
                  Tudo certo? Se algo precisar mudar, é só voltar — leva 2 segundos.
                </p>
              </CardHeader>
              <CardContent className="text-sm font-body">
                <dl className="grid grid-cols-2 gap-x-4 gap-y-2">
                  <dt className="text-muted-foreground">Nome</dt>
                  <dd className="text-foreground truncate">{fullName || "—"}</dd>
                  <dt className="text-muted-foreground">Email</dt>
                  <dd className="text-foreground truncate">{email || "—"}</dd>
                  <dt className="text-muted-foreground">Telefone</dt>
                  <dd className="text-foreground">{phoneVal || "—"}</dd>
                  <dt className="text-muted-foreground">Idade</dt>
                  <dd className="text-foreground">{age && age > 0 ? `${age} anos` : "—"}</dd>
                  <dt className="text-muted-foreground">Peso / Altura</dt>
                  <dd className="text-foreground">
                    {profileForm.weight ? `${profileForm.weight} kg` : "—"} · {profileForm.height ? `${profileForm.height} cm` : "—"}
                  </dd>
                  <dt className="text-muted-foreground">Objetivo</dt>
                  <dd className="text-foreground capitalize">{objectiveLabel}</dd>
                </dl>
                <div className="flex gap-2 mt-4">
                  <Button variant="outline" size="sm" onClick={() => setStep(2)} className="flex-1">
                    <ArrowLeft className="w-3.5 h-3.5 mr-1" /> Editar dados
                  </Button>
                </div>
              </CardContent>
            </Card>

            <div className="grid sm:grid-cols-2 gap-4">
              {plans?.map((plan: any, i: number) => {
                const finalPrice = calculateFinalPrice(plan);
                const originalPrice = parseFloat(plan.price.replace(/[^\d,\.]/g, "").replace(",", ".")) || 0;
                const hasDiscount = plan.discount_type !== "none" && plan.discount_value > 0;
                return (
                  <Card key={plan.id} className="animate-fade-in hover:border-primary/30 transition-all" style={{ animationDelay: `${i * 100}ms` }}>
                    <CardHeader className="text-center pb-2 pt-6">
                      <CardTitle className="text-lg font-display">{plan.name}</CardTitle>
                      {plan.subtitle && <p className="text-xs text-muted-foreground font-body">{plan.subtitle}</p>}
                      {hasDiscount && <p className="text-sm line-through text-muted-foreground/60">R$ {originalPrice.toFixed(2)}</p>}
                      <p className="text-2xl font-bold text-foreground mt-1">R$ {finalPrice.toFixed(2)}</p>
                      {hasDiscount && <Badge variant="outline" className="text-xs text-primary border-primary/30">{plan.discount_type === "percentage" ? `${plan.discount_value}% OFF` : `R$ ${plan.discount_value} OFF`}</Badge>}
                      <p className="text-xs text-muted-foreground font-body">{plan.duration}</p>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <ul className="space-y-2">
                        {plan.benefits?.map((b: string, j: number) => (
                          <li key={j} className="flex items-start gap-2 text-sm font-body"><Check className="w-4 h-4 text-primary shrink-0 mt-0.5" /><span className="text-muted-foreground">{b}</span></li>
                        ))}
                      </ul>
                      <Button className="w-full" onClick={() => {
                        if (!validateContact()) return;
                        persistContact();
                        setSelectedPlan(plan);
                        setCheckoutOpen(true);
                      }}>
                        Assinar agora
                      </Button>
                    </CardContent>
                  </Card>
                );
              })}
            </div>

            {/* Reassurance strip */}
            <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground font-body pt-2">
              <ShieldCheck className="w-3.5 h-3.5 text-primary" />
              Pagamento 100% seguro · Pix ou cartão · Acesso liberado após confirmação
            </div>
          </div>
        )}
      </div>

      {/* Floating WhatsApp help button — sempre disponível durante o cadastro */}
      <a
        href="https://wa.me/5521998496289?text=Ol%C3%A1!%20Estou%20fazendo%20meu%20cadastro%20no%20STH%20METHOD%20e%20preciso%20de%20ajuda."
        target="_blank"
        rel="noopener noreferrer"
        className="fixed bottom-5 right-5 z-50 inline-flex items-center gap-2 rounded-full bg-primary text-primary-foreground px-4 py-3 shadow-lg shadow-primary/30 hover:scale-105 transition-transform font-body text-sm"
        style={{ paddingBottom: "calc(0.75rem + env(safe-area-inset-bottom))" }}
      >
        <MessageCircle className="w-4 h-4" />
        <span className="hidden sm:inline">Preciso de ajuda</span>
      </a>

      {/* Checkout Dialog */}
      <DynamicCheckoutDialog
        open={checkoutOpen}
        onOpenChange={setCheckoutOpen}
        selectedPlan={selectedPlan}
        calculateFinalPrice={calculateFinalPrice}
        actionType="new"
        overrideUserId={userId || undefined}
        overrideEmail={email || undefined}
        onPaymentSuccess={() => {
          toast.success("Pagamento registrado! Seu acesso será liberado após confirmação.");
          localStorage.removeItem(CADASTRO_DRAFT_KEY);
          setTimeout(() => navigate("/login"), 2000);
        }}
      />
    </div>
  );
};

export default Cadastro;
