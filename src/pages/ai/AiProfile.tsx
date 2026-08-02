import { useCallback, useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import AiShell from "@/components/ai/AiShell";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { focusField } from "@/lib/field-focus";
import AiWorkoutBriefing from "@/components/ai/AiWorkoutBriefing";
import { FileText, Loader2, LogOut, Trash2, Upload, Dumbbell, Salad, LineChart, UtensilsCrossed, HeartPulse, Flame, UserRound, Info, ChevronRight, ChevronDown, Camera, CreditCard, ShieldCheck } from "lucide-react";

const HUB = [
  { to: "/ai/app/treino", label: "Treino", desc: "Programa guiado STHIA", icon: Dumbbell },
  { to: "/ai/app/cardapio", label: "Cardápio", desc: "Plano alimentar do ciclo", icon: Salad },
  { to: "/ai/app/analise", label: "Análise", desc: "Anexar exame laboratorial", icon: LineChart },
  { to: "/ai/app/diario", label: "Diário", desc: "Food AI: foto, áudio e rótulo", icon: UtensilsCrossed },
  { to: "/ai/app/saude", label: "Saúde", desc: "Wearables e sinais diários", icon: HeartPulse },
  { to: "/ai/app/progresso", label: "Evolução", desc: "Medidas e constância", icon: Flame },
  { to: "/ai/app/imagens", label: "Imagens corporais", desc: "Fotos para comparação", icon: Camera },
  { to: "/ai/app/coaches", label: "Coaches", desc: "Acompanhamento humano", icon: UserRound },
  { to: "/ai/assinatura", label: "Assinatura", desc: "Planos e renovação", icon: CreditCard },
  { to: "/ai/legal", label: "Documentos e Termos", desc: "Termos de Uso e documentos jurídicos", icon: ShieldCheck },
  { to: "/ai/sobre", label: "Sobre", desc: "Versão e novidades do STH AI", icon: Info },
];

interface Form {
  full_name: string; age: string; sex: string; weight_kg: string; height_cm: string;
  goal: string; training_level: string; routine: string; meals_per_day: string;
  restrictions: string; comorbidities: string; medications: string; dislikes: string; budget: string; training_days: string;
  equipment: string; limitations: string; sleep: string; stress: string;
}

const EMPTY: Form = {
  full_name: "", age: "", sex: "", weight_kg: "", height_cm: "", goal: "", training_level: "",
  routine: "", meals_per_day: "", restrictions: "", comorbidities: "", medications: "", dislikes: "", budget: "",
  training_days: "", equipment: "", limitations: "", sleep: "", stress: "",
};

interface AiFile { id: string; file_name: string | null; storage_path: string; kind: string; created_at: string }

export default function AiProfile() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState<Form>(EMPTY);
  const [sub, setSub] = useState<{ plan: string; status: string; expires_at: string | null } | null>(null);
  const [files, setFiles] = useState<AiFile[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [showFicha, setShowFicha] = useState(false);
  const [showRotina, setShowRotina] = useState(false);
  const [savedAnswers, setSavedAnswers] = useState<Record<string, string>>({});
  const inputRef = useRef<HTMLInputElement>(null);

  const load = useCallback(async () => {
    if (!user?.id) { setLoading(false); return; }
    setLoading(true);
    const [{ data: p }, { data: s }, { data: f }] = await Promise.all([
      supabase.from("ai_app_profiles").select("*").eq("user_id", user.id).maybeSingle(),
      supabase.from("ai_app_subscriptions").select("plan, status, expires_at").eq("user_id", user.id)
        .eq("status", "active").order("expires_at", { ascending: false }).limit(1).maybeSingle(),
      supabase.from("ai_app_files").select("id, file_name, storage_path, kind, created_at")
        .eq("user_id", user.id).eq("kind", "exam").order("created_at", { ascending: false }),
    ]);
    if (p) {
      const a = ((p.answers ?? {}) as Record<string, string>);
      setSavedAnswers(a);
      setForm({
        ...EMPTY,
        full_name: p.full_name ?? "", age: p.age?.toString() ?? "", sex: p.sex ?? "",
        weight_kg: p.weight_kg?.toString() ?? "", height_cm: p.height_cm?.toString() ?? "",
        goal: p.goal ?? "", training_level: p.training_level ?? "",
        comorbidities: (p as any).comorbidities ?? "",
        medications: (p as any).medications ?? "",
        ...a,
      });
    }
    setSub((s as any) ?? null);
    setFiles(((f ?? []) as unknown) as AiFile[]);
    setLoading(false);
  }, [user?.id]);

  useEffect(() => { load(); }, [load]);

  const set = <K extends keyof Form>(k: K, v: string) => setForm((prev) => ({ ...prev, [k]: v }));

  const liveProfile = {
    user_id: user?.id ?? "",
    full_name: form.full_name,
    age: Number(form.age) || null,
    sex: form.sex,
    weight_kg: Number(form.weight_kg) || null,
    height_cm: Number(form.height_cm) || null,
    goal: form.goal,
    training_level: form.training_level,
    comorbidities: form.comorbidities,
    medications: form.medications,
    answers: { ...savedAnswers, ...form },
    step: 2,
    phase1_complete: true,
    phase2_complete: true,
  } as any;

  async function save() {
    if (!user?.id) return;
    if (!form.full_name || !form.age || !form.sex || !form.weight_kg || !form.height_cm || !form.goal || !form.training_level) {
      toast.error("Preencha todos os dados essenciais.");
      return;
    }
    setSaving(true);
    const { error } = await supabase.from("ai_app_profiles").upsert({
      user_id: user.id,
      full_name: form.full_name,
      age: Number(form.age) || null,
      sex: form.sex || null,
      weight_kg: Number(form.weight_kg) || null,
      height_cm: Number(form.height_cm) || null,
      goal: form.goal || null,
      training_level: form.training_level || null,
      comorbidities: form.comorbidities || null,
      medications: form.medications || null,
      answers: {
        routine: form.routine, meals_per_day: form.meals_per_day, restrictions: form.restrictions,
        comorbidities: form.comorbidities, medications: form.medications,
        dislikes: form.dislikes, budget: form.budget, training_days: form.training_days,
        equipment: form.equipment, limitations: form.limitations, sleep: form.sleep, stress: form.stress,
      },
      phase1_complete: true,
      phase2_complete: true,
      step: 2,
    }, { onConflict: "user_id" });
    setSaving(false);
    if (error) { toast.error(error.message); return; }
    toast.success("Perfil atualizado — a IA já usa esses dados no próximo ciclo.");
  }

  async function upload(file: File | null) {
    if (!file || !user?.id) return;
    if (file.size > 15 * 1024 * 1024) { toast.error("Arquivo acima de 15 MB."); return; }
    setUploading(true);
    try {
      const path = `${user.id}/exams/${Date.now()}-${file.name.replace(/[^\w.\-]/g, "_")}`;
      const { error: upErr } = await supabase.storage.from("sth-ai").upload(path, file, { upsert: false });
      if (upErr) throw upErr;
      const { error } = await supabase.from("ai_app_files").insert({
        user_id: user.id, kind: "exam", file_name: file.name, storage_path: path,
      });
      if (error) throw error;
      toast.success("Documento enviado.");
      await load();
    } catch (e) {
      toast.error((e as Error)?.message || "Falha no envio.");
    } finally {
      setUploading(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  }

  async function openFile(f: AiFile) {
    const { data, error } = await supabase.storage.from("sth-ai").createSignedUrl(f.storage_path, 300);
    if (error || !data?.signedUrl) { toast.error("Não foi possível abrir o arquivo."); return; }
    window.open(data.signedUrl, "_blank", "noopener");
  }

  async function removeFile(f: AiFile) {
    await supabase.storage.from("sth-ai").remove([f.storage_path]);
    const { error } = await supabase.from("ai_app_files").delete().eq("id", f.id);
    if (error) { toast.error("Não foi possível excluir."); return; }
    setFiles((prev) => prev.filter((x) => x.id !== f.id));
  }

  async function logout() {
    await supabase.auth.signOut();
    navigate("/ai");
  }

  if (loading) {
    return (
      <div className="grid min-h-screen place-items-center bg-background">
        <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <AiShell title="Perfil" subtitle="Seu organizador: ficha de cadastro, ferramentas do STH AI e documentos.">
      <Card className="mb-5 flex flex-wrap items-center justify-between gap-3 p-5">
        <div>
          <p className="text-xs text-muted-foreground">Assinatura</p>
          <p className="text-sm font-medium capitalize">{sub ? sub.plan : "Sem plano ativo"}</p>
          {sub?.expires_at && (
            <p className="text-xs text-muted-foreground">Válida até {new Date(sub.expires_at).toLocaleDateString("pt-BR")}</p>
          )}
        </div>
        <div className="flex items-center gap-2">
          <Badge variant={sub ? "secondary" : "outline"}>{sub ? "Ativa" : "Inativa"}</Badge>
          <Button variant="outline" size="sm" onClick={() => navigate("/ai/assinatura")}>Gerenciar</Button>
        </div>
      </Card>

      <div className="mb-5 grid grid-cols-2 gap-3">
        {HUB.map((item) => {
          const Icon = item.icon;
          return (
            <button
              key={item.to}
              type="button"
              onClick={() => navigate(item.to)}
              className="flex flex-col items-start gap-2 rounded-2xl border border-border bg-card p-4 text-left transition-colors hover:bg-accent"
            >
              <span className="grid h-9 w-9 place-items-center rounded-xl bg-primary/10 text-primary">
                <Icon className="h-4 w-4" />
              </span>
              <span className="text-sm font-semibold tracking-tight">{item.label}</span>
              <span className="text-[11px] leading-snug text-muted-foreground">{item.desc}</span>
            </button>
          );
        })}
      </div>

      <button
        type="button"
        onClick={() => setShowFicha((v) => !v)}
        className="mb-3 flex w-full items-center justify-between rounded-2xl border border-border bg-card px-4 py-3 text-left"
      >
        <span>
          <span className="block text-sm font-semibold tracking-tight">Ficha de cadastro do aluno</span>
          <span className="block text-[11px] text-muted-foreground">Dados essenciais e perfil avançado usados pela IA</span>
        </span>
        {showFicha ? <ChevronDown className="h-4 w-4 text-muted-foreground" /> : <ChevronRight className="h-4 w-4 text-muted-foreground" />}
      </button>

      {showFicha && (
      <>
      <Card className="space-y-4 p-5">
        <h2 className="text-base font-semibold tracking-tight">Dados essenciais</h2>
        <div id="f-full_name" className="space-y-1.5 scroll-mt-24 p-1">
          <Label>Nome completo</Label>
          <Input value={form.full_name} onChange={(e) => set("full_name", e.target.value)} />
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <div id="f-age" className="space-y-1.5 scroll-mt-24 p-1">
            <Label>Idade</Label>
            <Input inputMode="numeric" value={form.age} onChange={(e) => set("age", e.target.value)} />
          </div>
          <div id="f-sex" className="space-y-1.5 scroll-mt-24 p-1">
            <Label>Sexo</Label>
            <Select value={form.sex} onValueChange={(v) => set("sex", v)}>
              <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="masculino">Masculino</SelectItem>
                <SelectItem value="feminino">Feminino</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div id="f-weight_kg" className="space-y-1.5 scroll-mt-24 p-1">
            <Label>Peso (kg)</Label>
            <Input inputMode="decimal" value={form.weight_kg} onChange={(e) => set("weight_kg", e.target.value)} />
          </div>
          <div id="f-height_cm" className="space-y-1.5 scroll-mt-24 p-1">
            <Label>Altura (cm)</Label>
            <Input inputMode="numeric" value={form.height_cm} onChange={(e) => set("height_cm", e.target.value)} />
          </div>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <div id="f-goal" className="space-y-1.5 scroll-mt-24 p-1">
            <Label>Objetivo</Label>
            <Select value={form.goal} onValueChange={(v) => set("goal", v)}>
              <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="emagrecimento">Emagrecimento</SelectItem>
                <SelectItem value="hipertrofia">Hipertrofia</SelectItem>
                <SelectItem value="recomposicao">Recomposição corporal</SelectItem>
                <SelectItem value="performance">Performance</SelectItem>
                <SelectItem value="saude">Saúde e rotina</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div id="f-training_level" className="space-y-1.5 scroll-mt-24 p-1">
            <Label>Nível de treino</Label>
            <Select value={form.training_level} onValueChange={(v) => set("training_level", v)}>
              <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="iniciante">Iniciante</SelectItem>
                <SelectItem value="intermediario">Intermediário</SelectItem>
                <SelectItem value="avancado">Avançado</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </Card>

      <Card className="mt-5 space-y-4 p-5">
        <h2 className="text-base font-semibold tracking-tight">Perfil avançado</h2>
        <div id="f-routine" className="space-y-1.5 scroll-mt-24 p-1">
          <Label>Rotina do dia a dia</Label>
          <Textarea rows={2} value={form.routine} onChange={(e) => set("routine", e.target.value)} />
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <div id="f-meals_per_day" className="space-y-1.5 scroll-mt-24 p-1">
            <Label>Refeições por dia</Label>
            <Input inputMode="numeric" value={form.meals_per_day} onChange={(e) => set("meals_per_day", e.target.value)} />
          </div>
          <div id="f-training_days" className="space-y-1.5 scroll-mt-24 p-1">
            <Label>Dias de treino por semana</Label>
            <Input inputMode="numeric" value={form.training_days} onChange={(e) => set("training_days", e.target.value)} />
          </div>
        </div>
        <div id="f-restrictions" className="space-y-1.5 scroll-mt-24 p-1">
          <Label>Restrições alimentares / alergias</Label>
          <Input value={form.restrictions} onChange={(e) => set("restrictions", e.target.value)} />
        </div>
        <div id="f-comorbidities" className="space-y-1.5 scroll-mt-24 p-1">
          <Label>Comorbidades (doenças/condições de saúde)</Label>
          <Textarea rows={2} value={form.comorbidities} onChange={(e) => set("comorbidities", e.target.value)} placeholder="Ex.: diabetes, hipertensão, hipotireoidismo. Se não houver, escreva 'Nenhuma'" />
        </div>
        <div id="f-medications" className="space-y-1.5 scroll-mt-24 p-1">
          <Label>Medicamentos em uso</Label>
          <Textarea rows={2} value={form.medications} onChange={(e) => set("medications", e.target.value)} placeholder="Ex.: Metformina 850mg 2x/dia, Losartana 50mg/dia. Se não usa, escreva 'Nenhum'" />
        </div>
        <div id="f-dislikes" className="space-y-1.5 scroll-mt-24 p-1">
          <Label>Alimentos que você não gosta</Label>
          <Input value={form.dislikes} onChange={(e) => set("dislikes", e.target.value)} />
        </div>
        <div id="f-budget" className="space-y-1.5 scroll-mt-24 p-1">
          <Label>Orçamento para alimentação</Label>
          <Select value={form.budget} onValueChange={(v) => set("budget", v)}>
            <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="economico">Econômico</SelectItem>
              <SelectItem value="moderado">Moderado</SelectItem>
              <SelectItem value="livre">Sem restrição</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div id="f-equipment" className="space-y-1.5 scroll-mt-24 p-1">
          <Label>Equipamentos disponíveis</Label>
          <Input value={form.equipment} onChange={(e) => set("equipment", e.target.value)} />
        </div>
        <div id="f-limitations" className="space-y-1.5 scroll-mt-24 p-1">
          <Label>Limitações físicas / lesões</Label>
          <Input value={form.limitations} onChange={(e) => set("limitations", e.target.value)} />
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <div id="f-sleep" className="space-y-1.5 scroll-mt-24 p-1">
            <Label>Horas de sono</Label>
            <Input inputMode="numeric" value={form.sleep} onChange={(e) => set("sleep", e.target.value)} />
          </div>
          <div id="f-stress" className="space-y-1.5 scroll-mt-24 p-1">
            <Label>Nível de estresse</Label>
            <Select value={form.stress} onValueChange={(v) => set("stress", v)}>
              <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="baixo">Baixo</SelectItem>
                <SelectItem value="medio">Médio</SelectItem>
                <SelectItem value="alto">Alto</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        <Button className="w-full" onClick={save} disabled={saving}>
          {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Salvar perfil
        </Button>
      </Card>
      </>
      )}

      <Card className="mt-5 space-y-4 p-5">
        <div>
          <h2 className="text-base font-semibold tracking-tight">Documentos e exames laboratoriais</h2>
          <p className="text-xs text-muted-foreground">
            Arquivos privados. Servem de contexto para a leitura educativa da Central de Análise — nunca para conduta terapêutica.
          </p>
        </div>
        <input
          ref={inputRef}
          type="file"
          accept="application/pdf,image/*"
          className="hidden"
          onChange={(e) => upload(e.target.files?.[0] || null)}
        />
        <Button variant="outline" className="w-full" onClick={() => inputRef.current?.click()} disabled={uploading}>
          {uploading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Upload className="mr-2 h-4 w-4" />}
          Enviar documento
        </Button>
        {files.length > 0 && (
          <ul className="space-y-2">
            {files.map((f) => (
              <li key={f.id} className="flex items-center justify-between gap-3 rounded-xl border border-border px-3 py-2 text-sm">
                <button type="button" className="flex min-w-0 flex-1 items-center gap-2 text-left" onClick={() => openFile(f)}>
                  <FileText className="h-4 w-4 shrink-0 text-muted-foreground" />
                  <span className="truncate">{f.file_name || "Documento"}</span>
                </button>
                <span className="shrink-0 text-xs text-muted-foreground">
                  {new Date(f.created_at).toLocaleDateString("pt-BR")}
                </span>
                <Button variant="ghost" size="icon" onClick={() => removeFile(f)} aria-label="Excluir documento">
                  <Trash2 className="h-4 w-4 text-muted-foreground" />
                </Button>
              </li>
            ))}
          </ul>
        )}
      </Card>

      <Button variant="ghost" className="mt-5 w-full text-muted-foreground" onClick={logout}>
        <LogOut className="mr-2 h-4 w-4" /> Sair da conta
      </Button>
    </AiShell>
  );
}
