import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import DashboardLayout from "@/components/DashboardLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Calendar, Clock, Video, Stethoscope, ExternalLink, FileText } from "lucide-react";
import { format, isToday, isFuture, isPast, addMinutes } from "date-fns";
import { ptBR } from "date-fns/locale";

const STATUS_LABEL: Record<string, string> = {
  scheduled: "Agendada",
  confirmed: "Confirmada",
  in_progress: "Em atendimento",
  completed: "Finalizada",
  cancelled: "Cancelada",
  no_show: "Não compareceu",
};

const StudentConsultas = () => {
  const { user } = useAuth();

  const { data: appts = [], isLoading } = useQuery({
    queryKey: ["my-appointments", user?.id],
    enabled: !!user?.id,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("appointments")
        .select("*")
        .eq("patient_user_id", user!.id)
        .order("scheduled_at", { ascending: false });
      if (error) throw error;
      return data || [];
    },
  });

  const { data: records = [] } = useQuery({
    queryKey: ["my-records", user?.id],
    enabled: !!user?.id,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("medical_records")
        .select("*")
        .eq("patient_user_id", user!.id)
        .order("pinned", { ascending: false })
        .order("created_at", { ascending: false })
        .limit(20);
      if (error) throw error;
      return data || [];
    },
  });

  const upcoming = appts.filter((a: any) => !isPast(addMinutes(new Date(a.scheduled_at), a.duration_min)) && a.status !== "cancelled");
  const past = appts.filter((a: any) => isPast(addMinutes(new Date(a.scheduled_at), a.duration_min)) || a.status === "completed");

  return (
    <DashboardLayout role="student" title="Consultas" subtitle="Seu acompanhamento clínico">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-6 space-y-6">
        {/* Hero */}
        <div className="relative overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-br from-primary/10 via-white/[0.02] to-transparent backdrop-blur-xl p-6">
          <div className="absolute -top-16 -right-10 w-56 h-56 bg-primary/20 rounded-full blur-3xl pointer-events-none" />
          <div className="relative">
            <div className="flex items-center gap-2 text-primary text-xs font-medium tracking-wider uppercase mb-2">
              <Stethoscope className="w-3.5 h-3.5" /> STH Care
            </div>
            <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight">Suas consultas</h1>
            <p className="text-muted-foreground mt-1 text-sm">Próximos atendimentos, histórico e prontuário pessoal.</p>
          </div>
        </div>

        {/* Próximas */}
        <section className="space-y-3">
          <h2 className="text-sm font-medium text-muted-foreground px-1">Próximas consultas</h2>
          {isLoading ? (
            <p className="text-xs text-muted-foreground">Carregando...</p>
          ) : upcoming.length === 0 ? (
            <Card className="bg-white/[0.03] border-white/10 rounded-2xl">
              <CardContent className="py-8 text-center text-xs text-muted-foreground">
                Nenhuma consulta agendada no momento.
              </CardContent>
            </Card>
          ) : (
            upcoming.map((a: any) => (
              <Card key={a.id} className="bg-white/[0.04] border-white/10 backdrop-blur-xl rounded-2xl overflow-hidden">
                <CardContent className="p-4 sm:p-5">
                  <div className="flex items-start justify-between gap-3 flex-wrap">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <Badge className={isToday(new Date(a.scheduled_at)) ? "bg-primary text-primary-foreground" : "bg-white/10 text-white border border-white/15"}>
                          {isToday(new Date(a.scheduled_at)) ? "Hoje" : STATUS_LABEL[a.status]}
                        </Badge>
                        {a.modality === "video" && (
                          <Badge variant="outline" className="border-primary/30 text-primary">
                            <Video className="w-3 h-3 mr-1" /> Vídeo
                          </Badge>
                        )}
                      </div>
                      <div className="text-base font-medium">
                        {format(new Date(a.scheduled_at), "EEEE, dd 'de' MMMM • HH:mm", { locale: ptBR })}
                      </div>
                      <div className="text-[11px] text-muted-foreground flex items-center gap-3 mt-1">
                        <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{a.duration_min} min</span>
                        {a.reason && <span className="truncate">• {a.reason}</span>}
                      </div>
                    </div>
                    {a.video_url && (
                      <Button onClick={() => window.open(a.video_url, "_blank")} className="rounded-full">
                        <Video className="w-4 h-4 mr-2" /> Entrar na consulta
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </section>

        {/* Histórico */}
        {past.length > 0 && (
          <section className="space-y-3">
            <h2 className="text-sm font-medium text-muted-foreground px-1">Histórico</h2>
            {past.slice(0, 10).map((a: any) => (
              <div key={a.id} className="flex items-center justify-between p-3 rounded-xl bg-white/[0.02] border border-white/[0.06]">
                <div>
                  <div className="text-sm">{format(new Date(a.scheduled_at), "dd MMM yyyy • HH:mm", { locale: ptBR })}</div>
                  <div className="text-[11px] text-muted-foreground">{STATUS_LABEL[a.status]}</div>
                </div>
                {a.patient_notes && <div className="text-[11px] text-muted-foreground max-w-xs truncate">{a.patient_notes}</div>}
              </div>
            ))}
          </section>
        )}

        {/* Prontuário (somente leitura) */}
        {records.length > 0 && (
          <section className="space-y-3">
            <h2 className="text-sm font-medium text-muted-foreground px-1 flex items-center gap-1.5">
              <FileText className="w-3.5 h-3.5" /> Seu prontuário
            </h2>
            <Card className="bg-white/[0.03] border-white/10 rounded-2xl">
              <CardContent className="p-4 space-y-3">
                {records.map((r: any) => (
                  <div key={r.id} className="p-3 rounded-xl bg-white/[0.02] border border-white/[0.06]">
                    <div className="flex items-center justify-between gap-2 mb-1">
                      <div className="text-xs text-primary uppercase tracking-wider">{r.section.replace(/_/g, " ")}</div>
                      <div className="text-[10px] text-muted-foreground">{format(new Date(r.created_at), "dd MMM yyyy", { locale: ptBR })}</div>
                    </div>
                    {r.title && <div className="text-sm font-medium">{r.title}</div>}
                    <div className="text-xs text-foreground/80 whitespace-pre-wrap mt-1">{r.content}</div>
                  </div>
                ))}
              </CardContent>
            </Card>
          </section>
        )}
      </div>
    </DashboardLayout>
  );
};

export default StudentConsultas;