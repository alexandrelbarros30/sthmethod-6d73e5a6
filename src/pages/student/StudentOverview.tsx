import { useState, useRef, useEffect } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Salad, Dumbbell, FlaskConical, BookOpen, CalendarDays, CheckCircle, AlertCircle, User, FileText, Camera, Save, Loader2 } from "lucide-react";
import { Link, useLocation } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import SubscriptionAlerts from "@/components/student/SubscriptionAlerts";
import BodyImageUpload from "@/components/shared/BodyImageUpload";

const phoneMask = (v: string) => {
  const d = v.replace(/\D/g, "").slice(0, 11);
  if (d.length <= 2) return `(${d}`;
  if (d.length <= 7) return `(${d.slice(0, 2)}) ${d.slice(2)}`;
  return `(${d.slice(0, 2)}) ${d.slice(2, 7)}-${d.slice(7)}`;
};

const modules = [
  { to: "/dashboard/diet", icon: Salad, title: "Dieta", desc: "Plano alimentar", color: "text-success" },
  { to: "/dashboard/training", icon: Dumbbell, title: "Treino", desc: "Periodização", color: "text-info" },
  { to: "/dashboard/protocol", icon: FlaskConical, title: "Protocolo", desc: "Suplementação", color: "text-warning" },
  { to: "/dashboard/content", icon: BookOpen, title: "Conteúdo", desc: "Materiais educativos", color: "text-primary" },
];

const StudentOverview = () => {
  const { profile, user } = useAuth();
  const location = useLocation();
  const qc = useQueryClient();
  const statusRef = useRef<HTMLDivElement>(null);

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
      const { data } = await supabase.from("subscriptions").select("*, plans(*)").eq("user_id", user!.id).order("created_at", { ascending: false }).limit(1).single();
      return data;
    },
    enabled: !!user?.id,
  });

  const { data: bodyImages, refetch: refetchImages } = useQuery({
    queryKey: ["body-images", user?.id],
    queryFn: async () => {
      const { data } = await supabase.from("body_images").select("*").eq("user_id", user!.id).eq("is_current", true);
      return data || [];
    },
    enabled: !!user?.id,
  });

  const p = fullProfile as any;
  const isOnboarded = p?.onboarding_complete;
  const hasImages = bodyImages && bodyImages.length >= 3;
  const profileComplete = p?.full_name && p?.phone && p?.height && p?.weight && p?.physical_activity && p?.objective && p?.current_protocol && p?.comorbidities;
  const allComplete = profileComplete && hasImages;

  const isActive = subscription?.status === "active" && new Date(subscription.end_date) > new Date();
  const daysLeft = subscription ? Math.max(0, Math.ceil((new Date(subscription.end_date).getTime() - Date.now()) / 86400000)) : 0;
  const firstName = profile?.full_name?.split(" ")[0] || "Aluno";

  // Form state for editable profile
  const [form, setForm] = useState({
    full_name: "", phone: "", birth_date: "", height: "", weight: "",
    physical_activity: "", objective: "", current_protocol: "", comorbidities: "",
  });
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);

  // Sync form with profile data
  useEffect(() => {
    if (p) {
      setForm({
        full_name: p.full_name || "",
        phone: p.phone || "",
        birth_date: p.birth_date || "",
        height: p.height?.toString() || "",
        weight: p.weight?.toString() || "",
        physical_activity: p.physical_activity || "",
        objective: p.objective || "",
        current_protocol: p.current_protocol || "",
        comorbidities: p.comorbidities || "",
      });
    }
  }, [p]);

  // Scroll to status section when redirected from subscription
  useEffect(() => {
    if (location.hash === "#status-cadastro" && statusRef.current) {
      setTimeout(() => statusRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }), 300);
    }
  }, [location.hash, fullProfile]);

  const pendingFields: string[] = [];
  if (!form.full_name) pendingFields.push("Nome completo");
  if (!form.phone) pendingFields.push("Telefone");
  if (!form.height) pendingFields.push("Altura");
  if (!form.weight) pendingFields.push("Peso");
  if (!form.physical_activity) pendingFields.push("Atividade física");
  if (!form.objective) pendingFields.push("Objetivo");
  if (!form.current_protocol) pendingFields.push("Protocolo atual");
  if (!form.comorbidities) pendingFields.push("Comorbidades");
  if (!hasImages) pendingFields.push("Imagens corporais (3 fotos)");

  const saveProfile = useMutation({
    mutationFn: async () => {
      if (!form.full_name || !form.phone || !form.height || !form.weight || !form.physical_activity || !form.objective || !form.current_protocol || !form.comorbidities) {
        throw new Error("Preencha todos os campos obrigatórios");
      }
      const phoneClean = form.phone.replace(/\D/g, "");
      if (phoneClean.length < 10) throw new Error("Telefone inválido. Use (xx) xxxxx-xxxx");

      const { error } = await supabase.from("profiles").update({
        full_name: form.full_name,
        phone: form.phone,
        birth_date: form.birth_date || null,
        height: Number(form.height),
        weight: Number(form.weight),
        physical_activity: form.physical_activity,
        objective: form.objective,
        current_protocol: form.current_protocol,
        comorbidities: form.comorbidities,
      }).eq("user_id", user!.id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Dados salvos com sucesso!");
      setEditing(false);
      refetchProfile();
      qc.invalidateQueries({ queryKey: ["student-profile-onboard"] });
    },
    onError: (e: any) => toast.error(e.message),
  });

  const handleSave = () => {
    setSaving(true);
    saveProfile.mutate(undefined, { onSettled: () => setSaving(false) });
  };

  // Check if onboarding should be marked complete
  useEffect(() => {
    if (allComplete && !isOnboarded && p) {
      supabase.from("profiles").update({ onboarding_complete: true }).eq("user_id", user!.id).then(() => {
        refetchProfile();
        qc.invalidateQueries({ queryKey: ["student-profile-onboard"] });
      });
    }
  }, [allComplete, isOnboarded, p]);

  const showEditableForm = !isOnboarded || editing;

  return (
    <DashboardLayout role="student" title={`Bem-vindo, ${firstName}!`} subtitle="Acompanhe seu progresso e acesse seus módulos.">
      {/* Expiration / renewal alerts */}
      <SubscriptionAlerts subscription={subscription ? { ...subscription, plans: (subscription as any)?.plans } : null} />

      {/* ===== STATUS DO CADASTRO ===== */}
      <div ref={statusRef} id="status-cadastro">
        {!allComplete ? (
          <Card className="mb-6 border-destructive/20 bg-destructive/5 animate-fade-in">
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-display flex items-center gap-2">
                <AlertCircle className="w-5 h-5 text-destructive" /> Status do Cadastro
              </CardTitle>
              <Badge variant="outline" className="border-destructive/30 text-destructive w-fit">Incompleto</Badge>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground mb-3">
                Complete os itens abaixo para liberar totalmente seu acesso:
              </p>
              <ul className="space-y-1 mb-4">
                {pendingFields.map((f) => (
                  <li key={f} className="text-sm flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-destructive shrink-0" />
                    <span className="text-foreground">{f}</span>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        ) : isOnboarded ? (
          <Card className="mb-6 border-primary/20 bg-primary/5 animate-fade-in">
            <CardContent className="py-4 flex items-center gap-3">
              <CheckCircle className="w-5 h-5 text-primary" />
              <div>
                <p className="font-semibold text-foreground font-body">Cadastro completo</p>
                <p className="text-sm text-muted-foreground font-body">
                  Concluído em {p?.updated_at ? new Date(p.updated_at).toLocaleDateString("pt-BR") : "—"}
                </p>
              </div>
            </CardContent>
          </Card>
        ) : null}
      </div>

      {/* ===== FORMULÁRIO EDITÁVEL ===== */}
      {showEditableForm && (
        <Card className="mb-6 animate-fade-in">
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-display flex items-center gap-2">
              <User className="w-4 h-4" /> {isOnboarded ? "Editar Minha Ficha" : "Complete seus dados"}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <Label className="font-body">Nome completo *</Label>
                <Input value={form.full_name} onChange={(e) => setForm({ ...form, full_name: e.target.value })} />
              </div>
              <div>
                <Label className="font-body">Telefone *</Label>
                <Input value={form.phone} onChange={(e) => setForm({ ...form, phone: phoneMask(e.target.value) })} placeholder="(00) 00000-0000" />
              </div>
              <div>
                <Label className="font-body">Data de nascimento</Label>
                <Input type="date" value={form.birth_date} onChange={(e) => setForm({ ...form, birth_date: e.target.value })} />
              </div>
              <div>
                <Label className="font-body">Altura (cm) *</Label>
                <Input type="number" value={form.height} onChange={(e) => setForm({ ...form, height: e.target.value })} />
              </div>
              <div>
                <Label className="font-body">Peso (kg) *</Label>
                <Input type="number" value={form.weight} onChange={(e) => setForm({ ...form, weight: e.target.value })} />
              </div>
            </div>
            <div>
              <Label className="font-body">Atividade física *</Label>
              <Textarea value={form.physical_activity} onChange={(e) => setForm({ ...form, physical_activity: e.target.value })} rows={2} />
            </div>
            <div>
              <Label className="font-body">Objetivo *</Label>
              <Textarea value={form.objective} onChange={(e) => setForm({ ...form, objective: e.target.value })} rows={2} />
            </div>
            <div>
              <Label className="font-body">Protocolo atual *</Label>
              <Textarea value={form.current_protocol} onChange={(e) => setForm({ ...form, current_protocol: e.target.value })} rows={2} />
            </div>
            <div>
              <Label className="font-body">Comorbidades *</Label>
              <Textarea value={form.comorbidities} onChange={(e) => setForm({ ...form, comorbidities: e.target.value })} rows={2} />
            </div>

            <Button onClick={handleSave} disabled={saving} className="w-full">
              {saving ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Salvando...</> : <><Save className="w-4 h-4 mr-2" /> Salvar dados</>}
            </Button>
          </CardContent>
        </Card>
      )}

      {/* ===== UPLOAD DE IMAGENS ===== */}
      {(!hasImages || !isOnboarded) && (
        <div className="mb-6">
          <BodyImageUpload
            userId={user!.id}
            existingImages={bodyImages || []}
            required
            onComplete={() => {
              refetchImages();
              qc.invalidateQueries({ queryKey: ["body-images"] });
            }}
          />
        </div>
      )}

      {/* Status card (subscription) */}
      {subscription ? (
        <Card className={`mb-6 ${isActive ? "border-primary/20 bg-primary/5" : "border-destructive/20 bg-destructive/5"}`}>
          <CardContent className="flex items-center justify-between py-4">
            <div className="flex items-center gap-3">
              {isActive ? <CheckCircle className="w-5 h-5 text-primary" /> : <AlertCircle className="w-5 h-5 text-destructive" />}
              <div>
                <p className="font-semibold text-foreground font-body">{isActive ? "Assinatura ativa" : "Assinatura vencida"}</p>
                <p className="text-sm text-muted-foreground font-body">
                  Plano {(subscription as any)?.plans?.name} • Vence em {new Date(subscription.end_date).toLocaleDateString("pt-BR")}
                </p>
              </div>
            </div>
            {isActive && (
              <Badge variant="outline" className="border-primary text-primary">
                <CalendarDays className="w-3 h-3 mr-1" /> {daysLeft} dias restantes
              </Badge>
            )}
          </CardContent>
        </Card>
      ) : (
        <Card className="mb-6 border-muted">
          <CardContent className="py-4">
            <p className="text-muted-foreground font-body text-sm">Nenhuma assinatura encontrada. Fale com seu consultor.</p>
          </CardContent>
        </Card>
      )}

      {/* Profile summary (read-only, shown only when onboarded and not editing) */}
      {p && isOnboarded && !editing && (
        <Card className="mb-6">
          <CardHeader className="pb-3 flex flex-row items-center justify-between">
            <CardTitle className="text-base font-display flex items-center gap-2"><User className="w-4 h-4" /> Minha Ficha</CardTitle>
            <Button variant="ghost" size="sm" onClick={() => setEditing(true)}>Editar</Button>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-2 gap-x-8 gap-y-2 text-sm">
              <div><span className="text-muted-foreground">Nome:</span> <span className="font-medium">{p.full_name}</span></div>
              <div><span className="text-muted-foreground">Email:</span> <span className="font-medium">{p.email}</span></div>
              <div><span className="text-muted-foreground">Telefone:</span> <span className="font-medium">{p.phone || "—"}</span></div>
              <div><span className="text-muted-foreground">Nascimento:</span> <span className="font-medium">{p.birth_date ? new Date(p.birth_date + "T12:00:00").toLocaleDateString("pt-BR") : "—"}</span></div>
              <div><span className="text-muted-foreground">Altura:</span> <span className="font-medium">{p.height ? `${p.height} cm` : "—"}</span></div>
              <div><span className="text-muted-foreground">Peso:</span> <span className="font-medium">{p.weight ? `${p.weight} kg` : "—"}</span></div>
            </div>

            {(p.physical_activity || p.objective || p.current_protocol || p.comorbidities) && (
              <div className="mt-4 space-y-3 border-t pt-4">
                {p.physical_activity && <div><p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1">Atividade Física</p><p className="text-sm whitespace-pre-wrap">{p.physical_activity}</p></div>}
                {p.objective && <div><p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1">Objetivo</p><p className="text-sm whitespace-pre-wrap">{p.objective}</p></div>}
                {p.current_protocol && <div><p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1">Protocolo Atual</p><p className="text-sm whitespace-pre-wrap">{p.current_protocol}</p></div>}
                {p.comorbidities && <div><p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1">Comorbidades</p><p className="text-sm whitespace-pre-wrap">{p.comorbidities}</p></div>}
              </div>
            )}

            {(p.lab_exam_url || p.medical_prescription_url) && (
              <div className="mt-4 border-t pt-4 flex gap-4">
                {p.lab_exam_url && <a href={p.lab_exam_url} target="_blank" rel="noopener noreferrer" className="text-sm text-primary underline flex items-center gap-1"><FileText className="w-4 h-4" /> Exames</a>}
                {p.medical_prescription_url && <a href={p.medical_prescription_url} target="_blank" rel="noopener noreferrer" className="text-sm text-primary underline flex items-center gap-1"><FileText className="w-4 h-4" /> Receita</a>}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Module cards */}
      <div className="grid md:grid-cols-2 gap-4">
        {modules.map((mod) => (
          <Link key={mod.to} to={mod.to}>
            <Card className="hover:shadow-card-hover hover:border-primary/20 transition-all duration-300 cursor-pointer group">
              <CardHeader className="flex flex-row items-center gap-4 pb-2">
                <div className="w-10 h-10 rounded-lg bg-secondary flex items-center justify-center group-hover:bg-primary/10 transition-colors">
                  <mod.icon className={`w-5 h-5 ${mod.color}`} />
                </div>
                <div>
                  <CardTitle className="text-base font-display">{mod.title}</CardTitle>
                  <p className="text-sm text-muted-foreground font-body">{mod.desc}</p>
                </div>
              </CardHeader>
            </Card>
          </Link>
        ))}
      </div>
    </DashboardLayout>
  );
};

export default StudentOverview;
