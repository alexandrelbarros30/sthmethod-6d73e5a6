import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Slider } from "@/components/ui/slider";
import {
  ArrowLeft, ArrowRight, Check, Mail, Lock, User, Phone, Loader2,
  QrCode, CreditCard, ExternalLink, Copy, CheckCircle2, CheckCircle, Calculator,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import { toast } from "sonner";
import BodyImageUpload from "@/components/shared/BodyImageUpload";
import { calculateAge, calculateMacros, type MacroResult } from "@/lib/macro-calculator";
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

const steps = [
  { n: 1, label: "Conta" },
  { n: 2, label: "Perfil" },
  { n: 3, label: "Fotos" },
  { n: 4, label: "Plano" },
];

const Cadastro = () => {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);
  const [checkoutOpen, setCheckoutOpen] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<any>(null);
  const [pixCopied, setPixCopied] = useState(false);
  const [macroResult, setMacroResult] = useState<MacroResult | null>(null);

  // Step 1 - Account
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [phoneVal, setPhoneVal] = useState("");

  // Step 2 - Profile
  const [profileForm, setProfileForm] = useState({
    birth_date: "", height: "", weight: "",
    gender: "", activity_type: "", does_cardio: "",
    physical_activity_level: "",
    objective: "", current_protocol: "", comorbidities: "", additional_info: "",
    training_days_per_week: "", training_duration_minutes: "", training_intensity: "",
    cardio_days_per_week: "", cardio_duration_minutes: "", cardio_intensity: "",
  });

  // Step 3 - Body images
  const [imagesComplete, setImagesComplete] = useState(false);

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
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        setUserId(session.user.id);
        supabase.from("profiles").select("*").eq("user_id", session.user.id).single().then(({ data: p }) => {
          if (p) {
            setFullName(p.full_name || "");
            setPhoneVal(p.phone || "");
            setProfileForm({
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
            if (p.onboarding_complete) {
              supabase.from("subscriptions").select("*").eq("user_id", session.user.id).eq("status", "active").limit(1).maybeSingle().then(({ data: sub }) => {
                if (sub && new Date(sub.end_date) > new Date()) {
                  navigate("/dashboard");
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
      }
    });
  }, []);

  const { data: plans } = useQuery({
    queryKey: ["public-plans"],
    queryFn: async () => {
      const { data } = await supabase.from("plans").select("*").eq("active", true).order("duration_days");
      return data || [];
    },
  });

  const { data: paymentLinks } = useQuery({
    queryKey: ["public-payment-links"],
    queryFn: async () => {
      const { data } = await supabase.from("plan_payment_links").select("*");
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

  const getPlanLink = (planId: string) => paymentLinks?.find((l: any) => l.plan_id === planId);

  const copyPixCode = (code: string) => {
    navigator.clipboard.writeText(code);
    setPixCopied(true);
    toast.success("Código PIX copiado!");
    setTimeout(() => setPixCopied(false), 3000);
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
      if (data.user) {
        setUserId(data.user.id);
        await supabase.from("profiles").update({ phone: phoneVal }).eq("user_id", data.user.id);
        toast.success("Conta criada! Vamos ao próximo passo.");
        setStep(2);
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
    const { height, weight, gender, activity_type, does_cardio, objective, current_protocol, comorbidities, birth_date } = profileForm;
    if (!gender) { toast.error("Selecione o gênero"); return; }
    if (!birth_date) { toast.error("Data de nascimento é obrigatória"); return; }
    if (!height || Number(height) <= 0) { toast.error("Altura é obrigatória"); return; }
    if (!weight || Number(weight) <= 0) { toast.error("Peso é obrigatório"); return; }
    if (!activity_type) { toast.error("Selecione o tipo de atividade física"); return; }
    if (!profileForm.physical_activity_level) { toast.error("Selecione o nível de atividade física"); return; }
    // Validate training details if applicable
    if (activity_type !== "nenhuma") {
      if (!profileForm.training_days_per_week) { toast.error("Informe os dias de treino por semana"); return; }
      if (!profileForm.training_duration_minutes) { toast.error("Informe a duração do treino"); return; }
      if (!profileForm.training_intensity) { toast.error("Selecione a intensidade do treino"); return; }
    }
    if (does_cardio === "") { toast.error("Informe se faz cardio"); return; }
    // Validate cardio details if applicable
    if (does_cardio === "sim") {
      if (!profileForm.cardio_days_per_week) { toast.error("Informe os dias de cardio por semana"); return; }
      if (!profileForm.cardio_duration_minutes) { toast.error("Informe a duração do cardio"); return; }
      if (!profileForm.cardio_intensity) { toast.error("Selecione a intensidade do cardio"); return; }
    }
    if (!objective) { toast.error("Selecione o objetivo"); return; }
    if (!current_protocol.trim()) { toast.error("Protocolo atual é obrigatório"); return; }
    if (!comorbidities.trim()) { toast.error("Comorbidades é obrigatório"); return; }

    setLoading(true);
    try {
      const updateData: any = {
        birth_date: birth_date || null,
        height: Number(height),
        weight: Number(weight),
        gender,
        activity_type,
        does_cardio: does_cardio === "sim",
        objective,
        physical_activity: `${activityLabels[activity_type] || activity_type}${does_cardio === "sim" ? " + Cardio" : ""}`,
        current_protocol,
        comorbidities,
        additional_info: profileForm.additional_info,
        physical_activity_level: profileForm.physical_activity_level || null,
        training_days_per_week: profileForm.training_days_per_week ? Number(profileForm.training_days_per_week) : null,
        training_duration_minutes: profileForm.training_duration_minutes ? Number(profileForm.training_duration_minutes) : null,
        training_intensity: profileForm.training_intensity || null,
        cardio_days_per_week: profileForm.cardio_days_per_week ? Number(profileForm.cardio_days_per_week) : null,
        cardio_duration_minutes: profileForm.cardio_duration_minutes ? Number(profileForm.cardio_duration_minutes) : null,
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

      const { error } = await supabase.from("profiles").update(updateData).eq("user_id", userId!);
      if (error) throw error;
      toast.success("Dados salvos!");
      setStep(3);
    } catch (error: any) {
      toast.error(error.message || "Erro ao salvar dados");
    } finally {
      setLoading(false);
    }
  };

  // Step 3 → 4 transition
  const handleImagesComplete = () => {
    setImagesComplete(true);
    refetchImages();
    supabase.from("profiles").update({ onboarding_complete: true }).eq("user_id", userId!);
    toast.success("Fotos enviadas! Agora escolha seu plano.");
    setStep(4);
  };

  const handlePaymentNotified = () => {
    setCheckoutOpen(false);
    toast.success("Pagamento registrado! Seu acesso será liberado após confirmação.");
    setTimeout(() => navigate("/login"), 2000);
  };

  const showTrainingDetails = profileForm.activity_type === "musculacao" || profileForm.activity_type === "crossfit";
  const showCardioDetails = profileForm.does_cardio === "sim";

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
              <span className="text-primary-foreground font-bold text-sm">ST</span>
            </div>
            <span className="font-display text-xl font-bold text-foreground">ST&H</span>
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
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold transition-colors ${
                step > n ? "bg-primary text-primary-foreground" : step === n ? "bg-primary text-primary-foreground ring-2 ring-primary/30 ring-offset-2 ring-offset-background" : "bg-muted text-muted-foreground"
              }`}>
                {step > n ? <Check className="w-4 h-4" /> : n}
              </div>
              <span className={`text-xs sm:text-sm font-body hidden sm:inline ${step >= n ? "text-foreground" : "text-muted-foreground"}`}>{label}</span>
              {n < 4 && <ArrowRight className="w-3 h-3 sm:w-4 sm:h-4 text-muted-foreground" />}
            </div>
          ))}
        </div>

        {/* STEP 1: Create Account */}
        {step === 1 && (
          <Card className="animate-fade-in">
            <CardHeader>
              <CardTitle className="font-display text-xl">Crie sua conta</CardTitle>
              <p className="text-sm text-muted-foreground font-body">
                Preencha seus dados para começar sua jornada na ST&H.
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
                    <Input type="password" value={password} onChange={(e) => setPassword(e.target.value)} className="pl-10" placeholder="Mínimo 6 caracteres" required minLength={6} />
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
          <Card className="animate-fade-in">
            <CardHeader>
              <CardTitle className="font-display text-xl">Complete seu perfil</CardTitle>
              <p className="text-sm text-muted-foreground font-body">
                Essas informações são essenciais para montar seu plano personalizado.
              </p>
            </CardHeader>
            <CardContent className="space-y-4">
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
                  <Label className="font-body">Altura (cm) *</Label>
                  <Input type="number" value={profileForm.height} onChange={(e) => setProfileForm({ ...profileForm, height: e.target.value })} placeholder="175" />
                </div>
                <div>
                  <Label className="font-body">Peso (kg) *</Label>
                  <Input type="number" value={profileForm.weight} onChange={(e) => setProfileForm({ ...profileForm, weight: e.target.value })} placeholder="80" />
                </div>
              </div>

              {/* Physical Activity Level (NEAT) */}
              <div>
                <Label className="font-body">Nível de atividade física (sem exercícios) *</Label>
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
                <Label className="font-body">Atividade física praticada *</Label>
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
                          value={profileForm.training_duration_minutes}
                          onChange={(e) => setProfileForm({ ...profileForm, training_duration_minutes: e.target.value })}
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
                <Label className="font-body">Faz cardio (aeróbico)? *</Label>
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
                          value={profileForm.cardio_duration_minutes}
                          onChange={(e) => setProfileForm({ ...profileForm, cardio_duration_minutes: e.target.value })}
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
                <Label className="font-body">Protocolo atual (medicamentos/suplementos) *</Label>
                <Textarea value={profileForm.current_protocol} onChange={(e) => setProfileForm({ ...profileForm, current_protocol: e.target.value })} rows={2} placeholder="Descreva medicamentos ou suplementos que usa" />
              </div>
              <div>
                <Label className="font-body">Comorbidades *</Label>
                <Textarea value={profileForm.comorbidities} onChange={(e) => setProfileForm({ ...profileForm, comorbidities: e.target.value })} rows={2} placeholder="Possui alguma condição de saúde? Se não, escreva 'Nenhuma'" />
              </div>
              <div>
                <Label className="font-body">Mais informações</Label>
                <Textarea value={profileForm.additional_info} onChange={(e) => setProfileForm({ ...profileForm, additional_info: e.target.value })} rows={2} placeholder="Informações adicionais que queira compartilhar (opcional)" />
              </div>

              <div className="flex gap-3">
                <Button variant="outline" onClick={() => setStep(1)} className="flex-1"><ArrowLeft className="w-4 h-4 mr-2" /> Voltar</Button>
                <Button onClick={handleSaveProfile} disabled={loading} className="flex-1">
                  {loading ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Salvando...</> : <>Continuar <ArrowRight className="w-4 h-4 ml-2" /></>}
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* STEP 3: Body Images */}
        {step === 3 && userId && (
          <div className="animate-fade-in space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="font-display text-xl">Fotos corporais</CardTitle>
                <p className="text-sm text-muted-foreground font-body">
                  Envie 3 fotos obrigatórias: frente, costas e perfil. Aceitos: .jpg e .png
                </p>
              </CardHeader>
              <CardContent>
                <BodyImageUpload
                  userId={userId}
                  existingImages={bodyImages || []}
                  required
                  onComplete={handleImagesComplete}
                />
              </CardContent>
            </Card>
            <Button variant="outline" onClick={() => setStep(2)} className="w-full"><ArrowLeft className="w-4 h-4 mr-2" /> Voltar ao perfil</Button>
          </div>
        )}

        {/* STEP 4: Choose Plan & Pay */}
        {step === 4 && userId && (
          <div className="animate-fade-in space-y-4">
            <Card className="border-primary/20 bg-primary/5">
              <CardContent className="py-4 flex items-center gap-3">
                <CheckCircle className="w-5 h-5 text-primary" />
                <p className="text-sm font-body text-foreground">
                  Cadastro completo! Escolha seu plano para ativar o acesso.
                </p>
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
                      <Button className="w-full" onClick={() => { setSelectedPlan(plan); setPixCopied(false); setCheckoutOpen(true); }}>
                        Assinar agora
                      </Button>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* Checkout Dialog */}
      <Dialog open={checkoutOpen} onOpenChange={setCheckoutOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="font-display">Realizar Pagamento</DialogTitle>
          </DialogHeader>
          {selectedPlan && (() => {
            const link = getPlanLink(selectedPlan.id);
            const hasPix = link?.pix_enabled && link?.pix_code;
            const hasCard = link?.card_enabled && link?.card_link;
            const hasAny = hasPix || hasCard;
            return (
              <div className="space-y-4">
                <div className="text-center p-4 rounded-lg bg-muted/50">
                  <p className="text-sm text-muted-foreground">Plano selecionado</p>
                  <p className="text-lg font-bold text-foreground">{selectedPlan.name}</p>
                  <p className="text-2xl font-bold text-primary mt-1">R$ {calculateFinalPrice(selectedPlan).toFixed(2)}</p>
                </div>
                {!hasAny && <p className="text-sm text-muted-foreground text-center py-4">Nenhum método de pagamento disponível. Entre em contato com o suporte.</p>}
                {hasPix && (
                  <div className="space-y-2 p-3 rounded-lg border border-border">
                    <div className="flex items-center gap-2 mb-2"><QrCode className="w-5 h-5 text-primary" /><span className="text-sm font-medium text-foreground">PIX</span></div>
                    <Button variant="outline" className="w-full" onClick={() => copyPixCode(link!.pix_code!)}>
                      {pixCopied ? <><CheckCircle2 className="w-4 h-4 mr-2 text-primary" />Código Copiado!</> : <><Copy className="w-4 h-4 mr-2" />Copiar código PIX</>}
                    </Button>
                    <p className="text-xs text-muted-foreground text-center">Após o pagamento, seu plano será ativado automaticamente.</p>
                  </div>
                )}
                {hasCard && (
                  <div className="space-y-2 p-3 rounded-lg border border-border">
                    <div className="flex items-center gap-2 mb-2"><CreditCard className="w-5 h-5 text-primary" /><span className="text-sm font-medium text-foreground">Cartão</span></div>
                    <a href={link!.card_link!} target="_blank" rel="noopener noreferrer">
                      <Button className="w-full"><ExternalLink className="w-4 h-4 mr-2" />Pagar com Cartão</Button>
                    </a>
                  </div>
                )}
                <Button variant="outline" className="w-full mt-2" onClick={handlePaymentNotified}>
                  ✅ Já realizei o pagamento
                </Button>
              </div>
            );
          })()}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Cadastro;
