import { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import DashboardLayout from "@/components/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { toast } from "sonner";
import {
  Calendar, Clock, Video, Users, Activity, AlertCircle, Plus, ChevronRight,
  Stethoscope, FileText, Sparkles, Pin, ExternalLink, CheckCircle2, XCircle,
} from "lucide-react";
import { format, isToday, isFuture, isPast, addMinutes } from "date-fns";
import { ptBR } from "date-fns/locale";

type Appt = {
  id: string;
  patient_user_id: string;
  professional_user_id: string;
  scheduled_at: string;
  duration_min: number;
  modality: "video" | "in_person" | "chat";
  status: "scheduled" | "confirmed" | "in_progress" | "completed" | "cancelled" | "no_show";
  video_url: string | null;
  reason: string | null;
  notes: string | null;
  patient_notes: string | null;
};

type Profile = { user_id: string; full_name: string | null; email: string | null };

const SECTIONS: { value: string; label: string }[] = [
  { value: "anamnese", label: "Anamnese" },
  { value: "evolucao_clinica", label: "Evolução clínica" },
  { value: "exames", label: "Exames" },
  { value: "estrategia_nutricional", label: "Estratégia nutricional" },
  { value: "protocolo", label: "Protocolo" },
  { value: "prescricao", label: "Prescrição" },
  { value: "emocoes_humor", label: "Humor / Emoções" },
  { value: "sono", label: "Sono" },
  { value: "performance", label: "Performance" },
  { value: "sintomas", label: "Sintomas" },
  { value: "historico", label: "Histórico" },
  { value: "outros", label: "Outros" },
];

const STATUS_BADGE: Record<string, { label: string; cls: string }> = {
  scheduled: { label: "Agendada", cls: "bg-white/10 text-white border border-white/15" },
  confirmed: { label: "Confirmada", cls: "bg-primary/20 text-primary border border-primary/30" },
  in_progress: { label: "Em atendimento", cls: "bg-primary text-primary-foreground" },
  completed: { label: "Finalizada", cls: "bg-emerald-500/15 text-emerald-300 border border-emerald-500/20" },
  cancelled: { label: "Cancelada", cls: "bg-red-500/10 text-red-300 border border-red-500/20" },
  no_show: { label: "Não compareceu", cls: "bg-amber-500/10 text-amber-300 border border-amber-500/20" },
};

const AdminTeleatendimento = () => {
  const { user } = useAuth();
  const qc = useQueryClient();
  const [tab, setTab] = useState<"overview" | "agenda" | "prontuario">("overview");
  const [selectedPatient, setSelectedPatient] = useState<string | null>(null);
  const [newApptOpen, setNewApptOpen] = useState(false);

  // Patients (todos os alunos da plataforma)
  const { data: patients = [] } = useQuery({
    queryKey: ["tele-patients"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("profiles")
        .select("user_id, full_name, email")
        .order("full_name");
      if (error) throw error;
      return (data || []) as Profile[];
    },
  });

  // Appointments (admin vê todos)
  const { data: appointments = [], isLoading } = useQuery({
    queryKey: ["appointments"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("appointments")
        .select("*")
        .order("scheduled_at", { ascending: true });
      if (error) throw error;
      return (data || []) as Appt[];
    },
  });

  const patientById = useMemo(() => {
    const m = new Map<string, Profile>();
    patients.forEach((p) => m.set(p.user_id, p));
    return m;
  }, [patients]);

  const today = appointments.filter((a) => isToday(new Date(a.scheduled_at)));
  const upcoming = appointments.filter((a) => isFuture(new Date(a.scheduled_at)) && !isToday(new Date(a.scheduled_at))).slice(0, 10);
  const inProgress = appointments.filter((a) => a.status === "in_progress");
  const needsAttention = appointments.filter(
    (a) => a.status === "scheduled" && isPast(addMinutes(new Date(a.scheduled_at), 15))
  );

  const startConsultation = async (a: Appt) => {
    await supabase.from("appointments").update({ status: "in_progress", started_at: new Date().toISOString() }).eq("id", a.id);
    qc.invalidateQueries({ queryKey: ["appointments"] });
    if (a.video_url) window.open(a.video_url, "_blank");
  };

  const finishConsultation = async (a: Appt) => {
    await supabase.from("appointments").update({ status: "completed", ended_at: new Date().toISOString() }).eq("id", a.id);
    qc.invalidateQueries({ queryKey: ["appointments"] });
    toast.success("Consulta finalizada");
  };

  return (
    <DashboardLayout role="admin" title="Teleatendimento" subtitle="Plataforma clínica integrada">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        {/* Hero */}
        <div className="relative overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-br from-white/[0.04] via-white/[0.02] to-transparent backdrop-blur-xl p-6 sm:p-8">
          <div className="absolute -top-20 -right-20 w-72 h-72 bg-primary/20 rounded-full blur-3xl pointer-events-none" />
          <div className="relative flex items-start justify-between gap-4 flex-wrap">
            <div>
              <div className="flex items-center gap-2 text-primary text-xs font-medium tracking-wider uppercase mb-2">
                <Stethoscope className="w-3.5 h-3.5" /> STH Care
              </div>
              <h1 className="text-3xl sm:text-4xl font-semibold tracking-tight">Teleatendimento</h1>
              <p className="text-muted-foreground mt-1 text-sm">Dashboard, agenda inteligente e prontuário modular.</p>
            </div>
            <Button onClick={() => setNewApptOpen(true)} className="rounded-full">
              <Plus className="w-4 h-4 mr-2" /> Nova consulta
            </Button>
          </div>
        </div>

        <Tabs value={tab} onValueChange={(v) => setTab(v as any)}>
          <TabsList className="bg-white/5 border border-white/10 rounded-full p-1">
            <TabsTrigger value="overview" className="rounded-full data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">Visão geral</TabsTrigger>
            <TabsTrigger value="agenda" className="rounded-full data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">Agenda</TabsTrigger>
            <TabsTrigger value="prontuario" className="rounded-full data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">Prontuário</TabsTrigger>
          </TabsList>

          {/* OVERVIEW */}
          <TabsContent value="overview" className="mt-6 space-y-6">
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
              <StatCard icon={Calendar} label="Consultas hoje" value={today.length} />
              <StatCard icon={Video} label="Em atendimento" value={inProgress.length} accent />
              <StatCard icon={Users} label="Pacientes ativos" value={patients.length} />
              <StatCard icon={AlertCircle} label="Aguardando há +15min" value={needsAttention.length} warn={needsAttention.length > 0} />
            </div>

            <div className="grid lg:grid-cols-2 gap-4">
              <PanelCard title="Próximas consultas" icon={Clock}>
                {today.length === 0 && upcoming.length === 0 ? (
                  <Empty text="Nenhuma consulta agendada." />
                ) : (
                  <div className="space-y-2">
                    {[...today, ...upcoming].slice(0, 8).map((a) => (
                      <ApptRow key={a.id} appt={a} patient={patientById.get(a.patient_user_id)} onStart={startConsultation} onFinish={finishConsultation} />
                    ))}
                  </div>
                )}
              </PanelCard>

              <PanelCard title="Atividade recente" icon={Activity}>
                <Empty text="Em breve: histórico de evoluções, exames novos e mensagens." />
              </PanelCard>
            </div>
          </TabsContent>

          {/* AGENDA */}
          <TabsContent value="agenda" className="mt-6">
            <PanelCard title="Todas as consultas" icon={Calendar}>
              {isLoading ? (
                <p className="text-sm text-muted-foreground">Carregando...</p>
              ) : appointments.length === 0 ? (
                <Empty text="Nenhuma consulta cadastrada." />
              ) : (
                <div className="space-y-2">
                  {appointments.map((a) => (
                    <ApptRow key={a.id} appt={a} patient={patientById.get(a.patient_user_id)} onStart={startConsultation} onFinish={finishConsultation} />
                  ))}
                </div>
              )}
            </PanelCard>
          </TabsContent>

          {/* PRONTUÁRIO */}
          <TabsContent value="prontuario" className="mt-6 space-y-4">
            <PanelCard title="Selecione o paciente" icon={Users}>
              <Select value={selectedPatient ?? ""} onValueChange={setSelectedPatient}>
                <SelectTrigger className="bg-white/5 border-white/10">
                  <SelectValue placeholder="Buscar paciente..." />
                </SelectTrigger>
                <SelectContent>
                  {patients.map((p) => (
                    <SelectItem key={p.user_id} value={p.user_id}>{p.full_name || p.email}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </PanelCard>

            {selectedPatient && (
              <ProntuarioPanel patientId={selectedPatient} professionalId={user?.id ?? ""} />
            )}
          </TabsContent>
        </Tabs>
      </div>

      <NewAppointmentDialog
        open={newApptOpen}
        onOpenChange={setNewApptOpen}
        patients={patients}
        professionalId={user?.id ?? ""}
        onCreated={() => qc.invalidateQueries({ queryKey: ["appointments"] })}
      />
    </DashboardLayout>
  );
};

// ============ Subcomponents (rendered outside main to keep focus stable) ============

const StatCard = ({ icon: Icon, label, value, accent, warn }: any) => (
  <div
    className={`rounded-2xl border backdrop-blur-xl p-4 transition-all hover:scale-[1.02] ${
      warn
        ? "border-amber-500/30 bg-amber-500/[0.05]"
        : accent
        ? "border-primary/30 bg-primary/[0.06]"
        : "border-white/10 bg-white/[0.03]"
    }`}
  >
    <div className="flex items-center justify-between mb-2">
      <Icon className={`w-4 h-4 ${accent ? "text-primary" : warn ? "text-amber-300" : "text-muted-foreground"}`} />
    </div>
    <div className="text-2xl font-semibold tracking-tight">{value}</div>
    <div className="text-[11px] text-muted-foreground mt-0.5">{label}</div>
  </div>
);

const PanelCard = ({ title, icon: Icon, children }: any) => (
  <Card className="bg-white/[0.03] border-white/10 backdrop-blur-xl rounded-2xl">
    <CardHeader className="pb-3">
      <CardTitle className="text-sm font-medium flex items-center gap-2 text-muted-foreground">
        <Icon className="w-4 h-4" /> {title}
      </CardTitle>
    </CardHeader>
    <CardContent>{children}</CardContent>
  </Card>
);

const Empty = ({ text }: { text: string }) => (
  <div className="py-6 text-center text-xs text-muted-foreground">{text}</div>
);

const ApptRow = ({
  appt, patient, onStart, onFinish,
}: { appt: Appt; patient?: Profile; onStart: (a: Appt) => void; onFinish: (a: Appt) => void }) => {
  const date = new Date(appt.scheduled_at);
  const s = STATUS_BADGE[appt.status];
  return (
    <div className="flex items-center justify-between gap-3 p-3 rounded-xl bg-white/[0.02] border border-white/[0.06] hover:border-white/15 transition-all">
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2 mb-1">
          <span className="text-sm font-medium truncate">{patient?.full_name || patient?.email || "Paciente"}</span>
          <Badge className={`text-[10px] ${s.cls}`}>{s.label}</Badge>
        </div>
        <div className="text-[11px] text-muted-foreground flex items-center gap-3">
          <span className="flex items-center gap-1"><Calendar className="w-3 h-3" />{format(date, "dd MMM, HH:mm", { locale: ptBR })}</span>
          <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{appt.duration_min}min</span>
          {appt.modality === "video" && <span className="flex items-center gap-1 text-primary"><Video className="w-3 h-3" />Vídeo</span>}
        </div>
      </div>
      <div className="flex items-center gap-1.5 shrink-0">
        {appt.status === "scheduled" || appt.status === "confirmed" ? (
          <Button size="sm" onClick={() => onStart(appt)} className="rounded-full h-8 text-xs">
            <Video className="w-3.5 h-3.5 mr-1.5" /> Iniciar
          </Button>
        ) : appt.status === "in_progress" ? (
          <Button size="sm" variant="secondary" onClick={() => onFinish(appt)} className="rounded-full h-8 text-xs">
            <CheckCircle2 className="w-3.5 h-3.5 mr-1.5" /> Finalizar
          </Button>
        ) : null}
        {appt.video_url && (
          <Button size="sm" variant="ghost" onClick={() => window.open(appt.video_url!, "_blank")} className="rounded-full h-8 w-8 p-0">
            <ExternalLink className="w-3.5 h-3.5" />
          </Button>
        )}
      </div>
    </div>
  );
};

const NewAppointmentDialog = ({
  open, onOpenChange, patients, professionalId, onCreated,
}: any) => {
  const [patientId, setPatientId] = useState("");
  const [date, setDate] = useState("");
  const [time, setTime] = useState("");
  const [duration, setDuration] = useState(30);
  const [modality, setModality] = useState<"video" | "in_person" | "chat">("video");
  const [videoUrl, setVideoUrl] = useState("");
  const [reason, setReason] = useState("");

  const save = async () => {
    if (!patientId || !date || !time) {
      toast.error("Preencha paciente, data e horário");
      return;
    }
    const scheduled_at = new Date(`${date}T${time}`).toISOString();
    const { error } = await supabase.from("appointments").insert({
      patient_user_id: patientId,
      professional_user_id: professionalId,
      scheduled_at,
      duration_min: duration,
      modality,
      video_url: videoUrl || null,
      reason: reason || null,
      created_by: professionalId,
    });
    if (error) {
      toast.error("Erro: " + error.message);
      return;
    }
    toast.success("Consulta agendada");
    onCreated();
    onOpenChange(false);
    setPatientId(""); setDate(""); setTime(""); setVideoUrl(""); setReason("");
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-background/95 backdrop-blur-xl border-white/10 max-w-md">
        <DialogHeader>
          <DialogTitle>Nova consulta</DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          <div>
            <Label>Paciente</Label>
            <Select value={patientId} onValueChange={setPatientId}>
              <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
              <SelectContent>
                {patients.map((p: Profile) => (
                  <SelectItem key={p.user_id} value={p.user_id}>{p.full_name || p.email}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div><Label>Data</Label><Input type="date" value={date} onChange={(e) => setDate(e.target.value)} /></div>
            <div><Label>Hora</Label><Input type="time" value={time} onChange={(e) => setTime(e.target.value)} /></div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Duração (min)</Label>
              <Input type="number" value={duration} onChange={(e) => setDuration(Number(e.target.value))} />
            </div>
            <div>
              <Label>Modalidade</Label>
              <Select value={modality} onValueChange={(v: any) => setModality(v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="video">Vídeo</SelectItem>
                  <SelectItem value="in_person">Presencial</SelectItem>
                  <SelectItem value="chat">Chat</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          {modality === "video" && (
            <div>
              <Label>Link da videochamada (Whereby / Meet)</Label>
              <Input value={videoUrl} onChange={(e) => setVideoUrl(e.target.value)} placeholder="https://..." />
            </div>
          )}
          <div>
            <Label>Motivo / observação</Label>
            <Textarea value={reason} onChange={(e) => setReason(e.target.value)} rows={2} />
          </div>
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)}>Cancelar</Button>
          <Button onClick={save}>Agendar</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

const ProntuarioPanel = ({ patientId, professionalId }: { patientId: string; professionalId: string }) => {
  const qc = useQueryClient();
  const [section, setSection] = useState("anamnese");
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");

  const { data: records = [] } = useQuery({
    queryKey: ["medical-records", patientId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("medical_records")
        .select("*")
        .eq("patient_user_id", patientId)
        .order("pinned", { ascending: false })
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data || [];
    },
    enabled: !!patientId,
  });

  const save = useMutation({
    mutationFn: async () => {
      if (!content.trim()) throw new Error("Conteúdo vazio");
      const { error } = await supabase.from("medical_records").insert({
        patient_user_id: patientId,
        professional_user_id: professionalId,
        section: section as any,
        title: title || null,
        content,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Registro adicionado");
      setTitle(""); setContent("");
      qc.invalidateQueries({ queryKey: ["medical-records", patientId] });
    },
    onError: (e: any) => toast.error(e.message),
  });

  const togglePin = async (id: string, pinned: boolean) => {
    await supabase.from("medical_records").update({ pinned: !pinned }).eq("id", id);
    qc.invalidateQueries({ queryKey: ["medical-records", patientId] });
  };

  const grouped = useMemo(() => {
    const g: Record<string, any[]> = {};
    (records as any[]).forEach((r) => {
      (g[r.section] ||= []).push(r);
    });
    return g;
  }, [records]);

  return (
    <div className="grid lg:grid-cols-3 gap-4">
      {/* Editor */}
      <PanelCard title="Adicionar registro" icon={Plus}>
        <div className="space-y-3">
          <div>
            <Label>Seção</Label>
            <Select value={section} onValueChange={setSection}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {SECTIONS.map((s) => <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>Título (opcional)</Label>
            <Input value={title} onChange={(e) => setTitle(e.target.value)} />
          </div>
          <div>
            <Label>Conteúdo</Label>
            <Textarea value={content} onChange={(e) => setContent(e.target.value)} rows={6} />
          </div>
          <Button onClick={() => save.mutate()} disabled={save.isPending} className="w-full">
            {save.isPending ? "Salvando..." : "Salvar"}
          </Button>
        </div>
      </PanelCard>

      {/* Records timeline */}
      <div className="lg:col-span-2">
        <PanelCard title="Histórico modular" icon={FileText}>
          {records.length === 0 ? (
            <Empty text="Nenhum registro ainda." />
          ) : (
            <Tabs defaultValue={Object.keys(grouped)[0]}>
              <TabsList className="flex flex-wrap h-auto bg-white/5 rounded-xl">
                {Object.keys(grouped).map((sec) => (
                  <TabsTrigger key={sec} value={sec} className="text-[11px] rounded-lg data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
                    {SECTIONS.find((s) => s.value === sec)?.label || sec}
                    <span className="ml-1.5 text-[10px] opacity-60">{grouped[sec].length}</span>
                  </TabsTrigger>
                ))}
              </TabsList>
              {Object.entries(grouped).map(([sec, list]) => (
                <TabsContent key={sec} value={sec} className="mt-3 space-y-2">
                  {list.map((r: any) => (
                    <div key={r.id} className="p-3 rounded-xl bg-white/[0.02] border border-white/[0.06]">
                      <div className="flex items-start justify-between gap-2 mb-1">
                        <div className="min-w-0">
                          {r.title && <div className="text-sm font-medium">{r.title}</div>}
                          <div className="text-[11px] text-muted-foreground">
                            {format(new Date(r.created_at), "dd MMM yyyy, HH:mm", { locale: ptBR })}
                          </div>
                        </div>
                        <Button size="sm" variant="ghost" onClick={() => togglePin(r.id, r.pinned)} className="h-7 w-7 p-0">
                          <Pin className={`w-3.5 h-3.5 ${r.pinned ? "fill-primary text-primary" : ""}`} />
                        </Button>
                      </div>
                      <div className="text-xs whitespace-pre-wrap text-foreground/80">{r.content}</div>
                    </div>
                  ))}
                </TabsContent>
              ))}
            </Tabs>
          )}
        </PanelCard>
      </div>
    </div>
  );
};

export default AdminTeleatendimento;