import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import DashboardLayout from "@/components/DashboardLayout";
import { useAuth } from "@/contexts/AuthContext";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Users, Salad, Dumbbell, FlaskConical, ClipboardList, Scale, Activity, MoreVertical, Search, Settings, Camera } from "lucide-react";
import { Link } from "react-router-dom";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { toast } from "sonner";
import BodyImageUpload from "@/components/shared/BodyImageUpload";
import SignedImage from "@/components/shared/SignedImage";
import AnamnesisEntryItem from "@/components/shared/AnamnesisEntryItem";
import { Input } from "@/components/ui/input";
import WhatsAppBulkSender from "@/components/shared/WhatsAppBulkSender";
import AdminEvolutionUpdate from "@/components/admin/AdminEvolutionUpdate";
import AdminBioimpedance from "@/components/admin/AdminBioimpedance";
import ServiceQueue from "@/components/admin/ServiceQueue";
import { normalizeSearch } from "@/lib/utils";

const ConsultorDashboard = () => {
  const { user } = useAuth();
  const qc = useQueryClient();
  const [anamneseOpen, setAnamneseOpen] = useState(false);
  const [selected, setSelected] = useState<any>(null);
  const [anamneseText, setAnamneseText] = useState("");
  const [bioOpen, setBioOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [manageOpen, setManageOpen] = useState(false);
  const navigate = useNavigate();

  const { data: linkedStudents = [] } = useQuery({
    queryKey: ["consultor-students", user?.id],
    queryFn: async () => {
      const { data: links } = await supabase
        .from("consultant_students")
        .select("student_id")
        .eq("consultant_id", user!.id);
      if (!links?.length) return [];
      const ids = links.map((l) => l.student_id);
      const { data: profiles } = await supabase
        .from("profiles")
        .select("user_id, full_name, email, phone, avatar_url, weight")
        .in("user_id", ids);
      return profiles || [];
    },
    enabled: !!user?.id,
  });

  const filteredStudents = useMemo(() => {
    if (!searchTerm.trim()) return linkedStudents;
    const term = normalizeSearch(searchTerm);
    return linkedStudents.filter((s: any) =>
      normalizeSearch(s.full_name).includes(term) || normalizeSearch(s.email).includes(term)
    );
  }, [searchTerm, linkedStudents]);

  const { data: anamneseEntries, refetch: refetchAnamnese } = useQuery({
    queryKey: ["consultor-anamnese", selected?.user_id],
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

  const { data: bodyImages, refetch: refetchBodyImages } = useQuery({
    queryKey: ["consultor-body-images", selected?.user_id],
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
    queryKey: ["consultor-weight-logs", selected?.user_id],
    queryFn: async () => {
      const { data } = await supabase
        .from("weight_logs")
        .select("*")
        .eq("user_id", selected!.user_id)
        .order("logged_at", { ascending: false });
      return data || [];
    },
    enabled: !!selected?.user_id && anamneseOpen,
  });

  const currentImages = bodyImages?.filter((i: any) => i.is_current) || [];

  const saveAnamneseMutation = useMutation({
    mutationFn: async () => {
      if (!anamneseText.trim()) throw new Error("Preencha a anotação");
      const { error } = await supabase.from("anamnesis_entries").insert({
        user_id: selected!.user_id,
        notes: anamneseText.trim(),
      });
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Anotação salva!");
      setAnamneseText("");
      refetchAnamnese();
    },
    onError: (e: any) => toast.error(e.message),
  });

  const labels: Record<string, string> = { front: "Frente", back: "Costas", profile: "Perfil" };
  const quickStats = [
    { label: "Alunos vinculados", value: linkedStudents.length, icon: Users },
    { label: "Com busca ativa", value: filteredStudents.length, icon: Search },
  ];

  return (
    <DashboardLayout role="consultor" title="Painel do Consultor" subtitle="Gerencie seus alunos vinculados">
      <section className="mb-8 rounded-[28px] border border-border/50 bg-card/40 px-4 py-4 backdrop-blur-3xl sm:px-5 sm:py-5">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div className="space-y-2">
            <p className="text-[11px] uppercase tracking-[0.18em] text-muted-foreground">Consultoria</p>
            <div className="space-y-1">
              <h1 className="text-[30px] leading-none text-foreground">Painel do consultor</h1>
              <p className="max-w-2xl text-sm text-muted-foreground">
                Acompanhamento enxuto dos alunos vinculados, com fila prioritária e atalhos clínicos.
              </p>
            </div>
          </div>

          <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
            <div className="relative min-w-0 flex-1 sm:min-w-[280px]">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground/60" />
              <Input
                placeholder="Pesquisar aluno..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="h-11 rounded-2xl border-border/40 bg-background/70 pl-10 placeholder:text-muted-foreground/50 focus-visible:ring-1 focus-visible:ring-foreground/20"
              />
            </div>
            <Button asChild className="premium-btn h-11 rounded-2xl gap-2 bg-foreground text-background hover:bg-foreground/90">
              <Link to="/admin/students?create=true">
                <Users className="w-4 h-4" /> Novo aluno
              </Link>
            </Button>
          </div>
        </div>
      </section>

      <div className="grid grid-cols-2 gap-2.5 mb-8 lg:grid-cols-4">
        {quickStats.map((stat) => (
          <Card key={stat.label} className="premium-card border-border/40 bg-card/55 backdrop-blur-2xl">
            <CardContent className="px-4 py-5">
              <div className="mb-4 flex items-center justify-between">
                <div className="flex h-9 w-9 items-center justify-center rounded-2xl bg-muted/60">
                  <stat.icon className="w-4 h-4 text-foreground/75" />
                </div>
                <span className="text-[10px] uppercase tracking-[0.16em] text-muted-foreground">Focus</span>
              </div>
              <p className="text-[30px] leading-none font-display font-semibold tracking-tight text-foreground">{stat.value}</p>
              <p className="mt-2 text-[11px] tracking-wide text-muted-foreground">{stat.label}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Fila de Atendimento — prioridade máxima */}
      <div className="mb-6">
        <ServiceQueue
          compact
          manageBasePath="/consultor/students"
          allowedUserIds={linkedStudents.map((s: any) => s.user_id)}
        />
      </div>

      <Card className="premium-card border-border/40 bg-card/55 backdrop-blur-2xl">
        <CardHeader className="pb-3 pt-5 px-5">
          <CardTitle className="text-[15px] font-display font-medium tracking-tight text-foreground/90">Meus Alunos</CardTitle>
        </CardHeader>
        <CardContent className="px-5 pb-5">
          {filteredStudents.length === 0 ? (
            <p className="text-muted-foreground/70 text-sm font-body py-2">
              {searchTerm ? `Nenhum aluno encontrado para "${searchTerm}"` : "Nenhum aluno vinculado ainda."}
            </p>
          ) : (
            <div className="space-y-2">
              {filteredStudents.map((s: any) => (
                <div key={s.user_id} className="flex items-center justify-between rounded-[22px] border border-border/40 bg-background/40 px-3 py-3">
                  <div className="min-w-0 flex-1">
                    <p className="text-[14px] font-medium tracking-tight truncate">{s.full_name?.trim() || s.email}</p>
                    <p className="text-[12px] text-muted-foreground/70 truncate">{s.email}</p>
                  </div>
                  <div className="flex gap-1 items-center">
                    <Button variant="outline" size="sm" className="h-7 px-2 text-xs gap-1" onClick={() => { setSelected(s); setManageOpen(true); }}>
                      <Settings className="w-3.5 h-3.5" /> Gerenciar
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => { setSelected(s); setAnamneseOpen(true); }}
                      title="Anamnese"
                    >
                      <ClipboardList className="w-4 h-4" />
                    </Button>
                    <Button variant="ghost" size="icon" onClick={() => { setSelected(s); setBioOpen(true); }} title="Bioimpedância">
                      <Activity className="w-4 h-4" />
                    </Button>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon">
                          <MoreVertical className="w-4 h-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem asChild>
                          <Link to={`/consultor/diet?student=${s.user_id}`} className="flex items-center gap-2">
                            <Salad className="w-4 h-4" /> Dieta
                          </Link>
                        </DropdownMenuItem>
                        <DropdownMenuItem asChild>
                          <Link to={`/consultor/training?student=${s.user_id}`} className="flex items-center gap-2">
                            <Dumbbell className="w-4 h-4" /> Treino
                          </Link>
                        </DropdownMenuItem>
                        <DropdownMenuItem asChild>
                          <Link to={`/consultor/protocol?student=${s.user_id}`} className="flex items-center gap-2">
                            <FlaskConical className="w-4 h-4" /> Protocolo
                          </Link>
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* WhatsApp em Massa */}
      <WhatsAppBulkSender linkedStudentIds={linkedStudents.map((s: any) => s.user_id)} />

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
                    <Button
                      size="sm"
                      onClick={() => saveAnamneseMutation.mutate()}
                      disabled={saveAnamneseMutation.isPending}
                    >
                      {saveAnamneseMutation.isPending ? "Salvando..." : "Salvar Anotação"}
                    </Button>
                  </CardContent>
                </Card>

                {/* Evolution Update */}
                <AdminEvolutionUpdate
                  userId={selected.user_id}
                  studentName={selected.full_name}
                  currentWeight={selected.weight}
                  onComplete={() => {
                    refetchAnamnese();
                    qc.invalidateQueries({ queryKey: ["consultor-weight-logs", selected.user_id] });
                    qc.invalidateQueries({ queryKey: ["consultor-students"] });
                  }}
                />

                {/* Current Images */}
                <BodyImageUpload
                  userId={selected.user_id}
                  existingImages={currentImages}
                  onComplete={() => {
                    refetchBodyImages();
                    refetchAnamnese();
                    toast.success("Imagens atualizadas!");
                  }}
                />

                {/* Weight History */}
                {weightLogs && weightLogs.length > 0 && (
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm font-display flex items-center gap-2">
                        <Scale className="w-4 h-4" /> Histórico de Peso
                      </CardTitle>
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

                {/* Image History */}
                {bodyImages && bodyImages.length > 0 && (
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm font-display">Histórico de Imagens</CardTitle>
                    </CardHeader>
                    <CardContent>
                      {(() => {
                        const grouped = bodyImages.reduce((acc: Record<string, any[]>, img: any) => {
                          const date = new Date(img.uploaded_at).toLocaleDateString("pt-BR");
                          if (!acc[date]) acc[date] = [];
                          acc[date].push(img);
                          return acc;
                        }, {});
                        return Object.entries(grouped).map(([date, imgs]) => (
                          <div key={date} className="mb-4 last:mb-0">
                            <p className="text-xs font-semibold text-muted-foreground mb-2">
                              {date} {(imgs as any[])[0]?.is_current && <Badge variant="secondary" className="ml-1 text-[10px]">Atual</Badge>}
                            </p>
                            <div className="grid grid-cols-3 gap-2">
                              {["front", "back", "profile"].map((type) => {
                                const img = (imgs as any[]).find((i: any) => i.type === type);
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
                        <AnamnesisEntryItem key={entry.id} entry={entry} onSaved={refetchAnamnese} />
                      ))}
                    </CardContent>
                  </Card>
                )}

                {(!anamneseEntries || anamneseEntries.length === 0) && (!bodyImages || bodyImages.length === 0) && (!weightLogs || weightLogs.length === 0) && (
                  <p className="text-sm text-muted-foreground text-center py-4">Nenhum registro de anamnese ainda.</p>
                )}
              </div>
            </ScrollArea>
          )}
        </DialogContent>
      </Dialog>

      {selected && (
        <AdminBioimpedance
          userId={selected.user_id}
          studentName={selected.full_name || selected.email}
          open={bioOpen}
          onOpenChange={setBioOpen}
        />
      )}

      {/* Manage Panel Dialog */}
      <Dialog open={manageOpen} onOpenChange={setManageOpen}>
        <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="font-display flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                <span className="text-sm font-bold text-primary">
                  {(selected?.full_name || "?").slice(0, 2).toUpperCase()}
                </span>
              </div>
              <div className="min-w-0">
                <p className="truncate">{selected?.full_name?.trim() || "Aluno"}</p>
                <p className="text-xs text-muted-foreground font-normal truncate">{selected?.email}</p>
              </div>
            </DialogTitle>
          </DialogHeader>
          <div className="grid grid-cols-3 gap-2 pt-2">
            {[
              { icon: Salad, label: "Dieta", action: () => { setManageOpen(false); navigate(`/consultor/diet?student=${selected?.user_id}&return=manage`); } },
              { icon: FlaskConical, label: "Protocolo", action: () => { setManageOpen(false); navigate(`/consultor/protocol?student=${selected?.user_id}&return=manage`); } },
              { icon: Dumbbell, label: "Treino", action: () => { setManageOpen(false); navigate(`/consultor/training?student=${selected?.user_id}&return=manage`); } },
              { icon: Camera, label: "Fotos", action: () => { setManageOpen(false); setAnamneseOpen(true); } },
              { icon: Activity, label: "Bioimpedância", action: () => { setManageOpen(false); setBioOpen(true); } },
              { icon: ClipboardList, label: "Anamnese", action: () => { setManageOpen(false); setAnamneseOpen(true); } },
            ].map(({ icon: Icon, label, action }) => (
              <button
                key={label}
                onClick={action}
                className="flex flex-col items-center gap-1.5 p-3 rounded-xl border border-border/50 transition-all duration-200 hover:scale-[1.03] hover:shadow-sm hover:bg-primary/5 hover:border-primary/20"
              >
                <Icon className="w-5 h-5" />
                <span className="text-[10px] font-medium leading-tight text-center">{label}</span>
              </button>
            ))}
          </div>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
};

export default ConsultorDashboard;
