import { useState, useEffect, useRef } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import {
  User, CheckCircle, AlertCircle, CalendarDays, Camera, Shield,
  FileText, CreditCard, ChevronRight, Scale, TrendingUp, Activity,
  Flame, Zap, Target, BellOff
} from "lucide-react";
import { Link } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import ChangePasswordDialog from "@/components/student/ChangePasswordDialog";
import StudentProfileForm, { profileFromDb, getPendingFields, type ProfileFormData } from "@/components/student/StudentProfileForm";
import AccessibilityThemeCard from "@/components/student/AccessibilityThemeCard";
import DocumentUpload from "@/components/shared/DocumentUpload";
import ImageConsentChoice from "@/components/legal/ImageConsentChoice";
import type { ImageConsent } from "@/components/legal/LegalAcceptanceBlock";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import SignedImage from "@/components/shared/SignedImage";
import { calculateAge } from "@/lib/macro-calculator";
import { getPlanTier, getPlanTierClasses } from "@/lib/plan-colors";
import {
  objectiveLabels, activityLabels,
  trainingIntensityOptions, cardioIntensityOptions,
  physicalActivityLevelOptions,
} from "@/lib/form-constants";
import { processAndUpload, validateImageFile } from "@/lib/image-upload";
import { toast } from "sonner";
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, CartesianGrid } from "recharts";
import MacroProgressBar from "@/components/student/MacroProgressBar";

const StudentProfile = () => {
  const { profile, user } = useAuth();
  const qc = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [editing, setEditing] = useState(false);

  const { data: fullProfile, refetch: refetchProfile } = useQuery({
    queryKey: ["student-full-profile", user?.id],
    queryFn: async () => {
      const { data } = await supabase.from("profiles").select("*").eq("user_id", user!.id).single();
      return data;
    },
    enabled: !!user?.id,
  });

  const { data: subscription } = useQuery({
    queryKey: ["subscription", user?.id],
    queryFn: async () => {
      const { data } = await supabase.from("subscriptions").select("*, plans(*, duration_days)").eq("user_id", user!.id).order("created_at", { ascending: false }).limit(1).single();
      return data;
    },
    enabled: !!user?.id,
  });

  const { data: bodyImages } = useQuery({
    queryKey: ["body-images", user?.id],
    queryFn: async () => {
      const { data } = await supabase.from("body_images").select("*").eq("user_id", user!.id).eq("is_current", true);
      return data || [];
    },
    enabled: !!user?.id,
  });

  const { data: latestWeightLog } = useQuery({
    queryKey: ["latest-weight-log", user?.id],
    queryFn: async () => {
      const { data } = await supabase.from("weight_logs").select("*").eq("user_id", user!.id).order("logged_at", { ascending: false }).limit(1).maybeSingle();
      return data;
    },
    enabled: !!user?.id,
  });

  const { data: weightChartData } = useQuery({
    queryKey: ["weight-chart-overview", user?.id],
    queryFn: async () => {
      const { data } = await supabase.from("weight_logs").select("weight, logged_at").eq("user_id", user!.id).order("logged_at", { ascending: true }).limit(20);
      return (data || []).map((d: any) => ({
        date: new Date(d.logged_at).toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" }),
        peso: Number(d.weight),
      }));
    },
    enabled: !!user?.id,
  });

  const p = fullProfile as any;
  const isOnboarded = p?.onboarding_complete;
  const hasImages = bodyImages && bodyImages.length >= 3;

  const [form, setForm] = useState<ProfileFormData>(profileFromDb({}));
  const [phoneEdit, setPhoneEdit] = useState("");
  const [savingPhone, setSavingPhone] = useState(false);

  useEffect(() => {
    if (p) setForm(profileFromDb(p));
  }, [p]);

  const pendingFields = getPendingFields(form, !!hasImages);
  const allComplete = pendingFields.length === 0;

  useEffect(() => {
    if (allComplete && !isOnboarded && p) {
      supabase.from("profiles").update({ onboarding_complete: true }).eq("user_id", user!.id).then(() => {
        refetchProfile();
        qc.invalidateQueries({ queryKey: ["student-profile-onboard"] });
      });
    }
  }, [allComplete, isOnboarded, p]);

  const isActive = subscription?.status === "active" && new Date(subscription.end_date) > new Date();
  const daysLeft = subscription ? Math.max(0, Math.ceil((new Date(subscription.end_date).getTime() - Date.now()) / 86400000)) : 0;
  const totalDays = (subscription as any)?.plans?.duration_days || 30;
  const progressPercent = totalDays > 0 ? Math.min(100, Math.round(((totalDays - daysLeft) / totalDays) * 100)) : 0;
  const firstName = profile?.full_name?.split(" ")[0] || "Aluno";
  const planDurationDays = (subscription as any)?.plans?.duration_days || null;
  const tierClasses = getPlanTierClasses(getPlanTier(planDurationDays));
  const showEditableForm = !isOnboarded || editing;
  const phoneOnlyEdit = isOnboarded && editing;

  const phoneMask = (v: string) => {
    const d = v.replace(/\D/g, "").slice(0, 11);
    if (d.length <= 2) return `(${d}`;
    if (d.length <= 7) return `(${d.slice(0, 2)}) ${d.slice(2)}`;
    return `(${d.slice(0, 2)}) ${d.slice(2, 7)}-${d.slice(7)}`;
  };

  const handleSavePhone = async () => {
    const clean = phoneEdit.replace(/\D/g, "");
    if (clean.length < 10) {
      toast.error("Telefone inválido");
      return;
    }
    setSavingPhone(true);
    try {
      const { error } = await supabase.from("profiles").update({ phone: phoneEdit }).eq("user_id", user!.id);
      if (error) throw error;
      toast.success("Telefone atualizado!");
      setEditing(false);
      refetchProfile();
    } catch (e: any) {
      toast.error(e.message || "Erro ao salvar telefone");
    } finally {
      setSavingPhone(false);
    }
  };

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user?.id) return;
    const err = validateImageFile(file);
    if (err) { toast.error(err); return; }
    setUploading(true);
    try {
      const path = `${user.id}/avatar.jpg`;
      const url = await processAndUpload(file, "body-images", path);
      await supabase.from("profiles").update({ avatar_url: url }).eq("user_id", user.id);
      refetchProfile();
      qc.invalidateQueries({ queryKey: ["student-full-profile"] });
      toast.success("Foto de perfil atualizada!");
    } catch {
      toast.error("Erro ao enviar foto. Tente novamente.");
    } finally {
      setUploading(false);
    }
  };

  return (
    <DashboardLayout role="student" title="Meu Perfil" subtitle="">
      {/* ===== AVATAR + NOME ===== */}
      <div className="flex flex-col items-center mb-6">
        <div className="relative mb-3">
          <Avatar className="w-24 h-24 border-2 border-foreground/15">
            <AvatarImage src={p?.avatar_url || ""} alt={firstName} />
            <AvatarFallback className="text-2xl font-bold bg-foreground/10 text-foreground">
              {firstName.charAt(0).toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
            className="absolute bottom-0 right-0 w-8 h-8 rounded-full bg-foreground text-background flex items-center justify-center shadow-lg hover:bg-foreground/90 transition-colors"
          >
            <Camera className="w-4 h-4" />
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleAvatarUpload}
          />
        </div>
        <h2 className="text-lg font-bold text-foreground font-display">{p?.full_name || firstName}</h2>
        <p className="text-sm text-muted-foreground">{p?.email}</p>
        {uploading && <p className="text-xs text-foreground mt-1 animate-pulse">Enviando foto...</p>}
      </div>

      {/* ===== ASSINATURA ATIVA ===== */}
      {subscription ? (
        <Card className={`mb-4 ${isActive ? `${tierClasses.border} ${tierClasses.bg}` : "border-destructive/20 bg-destructive/5"}`}>
          <CardContent className="py-4">
            <div className="flex items-center gap-3 mb-2">
              {isActive ? <CheckCircle className={`w-5 h-5 shrink-0 ${tierClasses.text}`} /> : <AlertCircle className="w-5 h-5 shrink-0 text-destructive" />}
              <div className="min-w-0 flex-1">
                <p className="font-semibold text-foreground text-sm">{isActive ? "Assinatura ativa" : "Assinatura vencida"}</p>
                <p className="text-xs text-muted-foreground truncate">
                  Plano {(subscription as any)?.plans?.name} • Vence {new Date(subscription.end_date).toLocaleDateString("pt-BR")}
                </p>
              </div>
              {isActive && (
                <Badge variant="outline" className={`${tierClasses.border} ${tierClasses.text} text-xs shrink-0`}>
                  <CalendarDays className="w-3 h-3 mr-1" /> {daysLeft}d
                </Badge>
              )}
            </div>
            {isActive && (
              <>
                <div className="flex items-center justify-between text-xs text-muted-foreground mb-1">
                  <span>Progresso</span>
                  <span>{progressPercent}%</span>
                </div>
                <Progress value={progressPercent} className="h-2" />
              </>
            )}
            <div className="mt-3 text-center">
              <Link to="/dashboard/subscription">
                <Button variant="outline" size="sm" className="text-xs gap-1">
                  <CreditCard className="w-3 h-3" /> Gerenciar assinatura
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      ) : (
        <Card className="mb-4 border-warning/20 bg-warning/5">
          <CardContent className="py-4 text-center">
            <AlertCircle className="w-5 h-5 text-warning mx-auto mb-2" />
            <p className="font-semibold text-foreground text-sm">Nenhum plano ativo</p>
            <Link to="/cadastro">
              <Button size="sm" variant="outline" className="mt-2 text-xs border-warning/30 text-warning">Escolher plano</Button>
            </Link>
          </CardContent>
        </Card>
      )}

      {/* ===== STATUS CADASTRO ===== */}
      {!allComplete && (
        <Card className="mb-4 border-destructive/20 bg-destructive/5">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-display flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-destructive" /> Cadastro Incompleto
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-1">
              {pendingFields.map((f) => (
                <li key={f} className="text-xs flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-destructive shrink-0" />
                  {f}
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}

      {/* ===== FORMULÁRIO EDITÁVEL ===== */}
      {showEditableForm && !phoneOnlyEdit && (
        <StudentProfileForm
          form={form}
          onChange={setForm}
          userId={user!.id}
          isOnboarded={!!isOnboarded}
          editing={editing}
          email={p?.email || user?.email || ""}
          labExamUrl={p?.lab_exam_url}
          prescriptionUrl={p?.medical_prescription_url}
          onDocumentUploaded={() => refetchProfile()}
          onSaved={() => {
            setEditing(false);
            refetchProfile();
            qc.invalidateQueries({ queryKey: ["student-profile-onboard"] });
          }}
          onCancel={isOnboarded ? () => setEditing(false) : undefined}
        />
      )}

      {/* ===== EDIÇÃO RÁPIDA: APENAS TELEFONE ===== */}
      {phoneOnlyEdit && (
        <Card className="mb-4 animate-fade-in">
          <CardHeader className="pb-3 flex flex-row items-center justify-between">
            <CardTitle className="text-sm font-display flex items-center gap-2">
              <FileText className="w-4 h-4" /> Editar Telefone
            </CardTitle>
            <Button variant="ghost" size="sm" onClick={() => setEditing(false)}>Cancelar</Button>
          </CardHeader>
          <CardContent className="space-y-3">
            <div>
              <Label className="font-body">Telefone *</Label>
              <Input
                value={phoneEdit || p?.phone || ""}
                onChange={(e) => setPhoneEdit(phoneMask(e.target.value))}
                placeholder="(00) 00000-0000"
              />
            </div>
            <Button className="w-full" onClick={handleSavePhone} disabled={savingPhone}>
              {savingPhone ? "Salvando..." : "Salvar telefone"}
            </Button>
            <p className="text-xs text-muted-foreground">
              Demais dados pessoais não podem ser editados aqui. Para alterar nível de atividade, peso e outros, use a tela de <Link to="/dashboard/evolution" className="text-foreground underline">Atualização</Link>.
            </p>
          </CardContent>
        </Card>
      )}

      {/* ===== MINHA FICHA (somente leitura) ===== */}
      {p && isOnboarded && !editing && (
        <Card className="mb-4">
          <CardHeader className="pb-3 flex flex-row items-center justify-between">
            <CardTitle className="text-sm font-display flex items-center gap-2"><FileText className="w-4 h-4" /> Minha Ficha</CardTitle>
            <Button variant="ghost" size="sm" className="text-xs" onClick={() => setEditing(true)}>Editar</Button>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-2 text-sm">
              <div><span className="text-muted-foreground">Nome:</span> <span className="font-medium">{p.full_name}</span></div>
              <div><span className="text-muted-foreground">Email:</span> <span className="font-medium">{p.email}</span></div>
              <div><span className="text-muted-foreground">Telefone:</span> <span className="font-medium">{p.phone || "—"}</span></div>
              <div><span className="text-muted-foreground">Nascimento:</span> <span className="font-medium">{p.birth_date ? new Date(p.birth_date + "T12:00:00").toLocaleDateString("pt-BR") : "—"}{p.birth_date ? ` (${calculateAge(p.birth_date)} anos)` : ""}</span></div>
              <div><span className="text-muted-foreground">Gênero:</span> <span className="font-medium capitalize">{p.gender || "—"}</span></div>
              <div><span className="text-muted-foreground">Altura:</span> <span className="font-medium">{p.height ? `${p.height} cm` : "—"}</span></div>
              <div><span className="text-muted-foreground">Peso:</span> <span className="font-medium">{p.weight ? `${p.weight} kg` : "—"}</span></div>
              <div><span className="text-muted-foreground">Objetivo:</span> <span className="font-medium">{objectiveLabels[p.objective] || p.objective || "—"}</span></div>
            </div>
            <div className="mt-4 border-t pt-4">
              <DocumentUpload userId={p.user_id} />
            </div>
          </CardContent>
        </Card>
      )}

      {/* ===== ÚLTIMA EVOLUÇÃO ===== */}
      {(p?.weight || latestWeightLog || (bodyImages && bodyImages.length > 0)) && (
        <Card className="mb-4">
          <CardHeader className="pb-3 flex flex-row items-center justify-between">
            <CardTitle className="text-sm font-display flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-foreground" /> Última Evolução
            </CardTitle>
            <Link to="/dashboard/evolution">
              <Button variant="outline" size="sm" className="text-xs gap-1">
                <TrendingUp className="w-3 h-3" /> Atualizar
              </Button>
            </Link>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-foreground/10 flex items-center justify-center shrink-0">
                <Scale className="w-5 h-5 text-foreground" />
              </div>
              <div>
                <p className="text-sm font-medium text-foreground">
                  {latestWeightLog ? `${Number(latestWeightLog.weight).toFixed(1)} kg` : p?.weight ? `${Number(p.weight).toFixed(1)} kg` : "—"}
                </p>
                <p className="text-xs text-muted-foreground">
                  {latestWeightLog
                    ? `Registrado em ${new Date(latestWeightLog.logged_at).toLocaleDateString("pt-BR")}`
                    : "Nenhum registro de peso"}
                </p>
              </div>
            </div>
            {weightChartData && weightChartData.length >= 2 && (
              <div className="pt-2">
                <p className="text-xs text-muted-foreground mb-2">Evolução de peso</p>
                <ResponsiveContainer width="100%" height={120}>
                  <AreaChart data={weightChartData} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
                    <defs>
                      <linearGradient id="weightGradientProfile" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="hsl(var(--foreground))" stopOpacity={0.3} />
                        <stop offset="100%" stopColor="hsl(var(--foreground))" stopOpacity={0.02} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
                    <XAxis dataKey="date" tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }} tickLine={false} axisLine={false} />
                    <YAxis domain={["dataMin - 1", "dataMax + 1"]} tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }} tickLine={false} axisLine={false} />
                    <Tooltip
                      contentStyle={{ fontSize: 12, borderRadius: 8, border: "1px solid hsl(var(--border))", background: "hsl(var(--card))" }}
                      formatter={(value: number) => [`${value.toFixed(1)} kg`, "Peso"]}
                    />
                    <Area type="monotone" dataKey="peso" stroke="hsl(var(--foreground))" strokeWidth={2} fill="url(#weightGradientProfile)" dot={{ r: 3, fill: "hsl(var(--foreground))" }} />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            )}
            {bodyImages && bodyImages.length > 0 && (
              <div>
                <p className="text-xs text-muted-foreground mb-2">Fotos corporais atuais</p>
                <div className="grid grid-cols-3 gap-2">
                  {["front", "back", "profile"].map((type) => {
                    const img = bodyImages.find((i: any) => i.type === type);
                    const labels: Record<string, string> = { front: "Frente", back: "Costas", profile: "Perfil" };
                    return (
                      <div key={type} className="text-center">
                        <p className="text-[10px] text-muted-foreground mb-0.5">{labels[type]}</p>
                        {img ? (
                          <SignedImage bucket="body-images" storagePath={img.storage_path} publicUrl={img.image_url} alt={labels[type]} className="w-full aspect-[3/4] object-cover rounded border" />
                        ) : (
                          <div className="w-full aspect-[3/4] bg-muted rounded flex items-center justify-center text-muted-foreground text-[10px]">—</div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* ===== SEGURANÇA DA CONTA ===== */}
      <Card className="mb-4">
        <CardContent className="py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Shield className="w-5 h-5 text-muted-foreground" />
            <div>
              <p className="text-sm font-medium text-foreground">Segurança da conta</p>
              <p className="text-xs text-muted-foreground">Altere sua senha de acesso</p>
            </div>
          </div>
          <ChangePasswordDialog />
        </CardContent>
      </Card>

      {/* ===== PREFERÊNCIAS DE COMUNICAÇÃO ===== */}
      <Card className="mb-4">
        <CardContent className="py-4 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <BellOff className="w-5 h-5 text-muted-foreground shrink-0" />
            <div className="min-w-0">
              <p className="text-sm font-medium text-foreground">Mensagens automáticas via WhatsApp</p>
              <p className="text-xs text-muted-foreground">
                {fullProfile?.whatsapp_opt_out
                  ? "Você não está recebendo mensagens automáticas."
                  : "Você recebe lembretes de evolução, renovação e atualizações de conteúdo."}
              </p>
            </div>
          </div>
          <Button
            variant={fullProfile?.whatsapp_opt_out ? "default" : "outline"}
            size="sm"
            className="shrink-0"
            onClick={async () => {
              const willOptOut = !fullProfile?.whatsapp_opt_out;
              if (willOptOut && !window.confirm(
                "Tem certeza que deseja cancelar o recebimento das mensagens automáticas (lembretes de evolução, renovação, novidades)?"
              )) return;
              const { error } = await supabase.from("profiles").update({
                whatsapp_opt_out: willOptOut,
                whatsapp_opt_out_at: willOptOut ? new Date().toISOString() : null,
                whatsapp_opt_out_reason: willOptOut ? "Solicitação do aluno pelo painel" : null,
              }).eq("user_id", user!.id);
              if (error) { toast.error("Não foi possível salvar."); return; }
              toast.success(willOptOut ? "Envio cancelado." : "Envio reativado.");
              refetchProfile();
            }}
          >
            {fullProfile?.whatsapp_opt_out ? "Reativar envio" : "Cancelar envio"}
          </Button>
        </CardContent>
      </Card>

      {/* ===== ACESSIBILIDADE VISUAL ===== */}
      <AccessibilityThemeCard />

      {/* ===== AUTORIZAÇÃO DE IMAGEM ===== */}
      {user?.id && (
        <div className="mt-4">
          <ImageConsentChoice
            userId={user.id}
            email={(fullProfile as any)?.email || null}
            initialValue={((fullProfile as any)?.image_consent_choice as ImageConsent) || "nao_autorizo"}
            onSaved={() => refetchProfile()}
          />
        </div>
      )}
    </DashboardLayout>
  );
};

export default StudentProfile;
