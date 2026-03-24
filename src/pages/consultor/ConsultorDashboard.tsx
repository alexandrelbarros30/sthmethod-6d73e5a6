import { useState } from "react";
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
import { Users, Salad, Dumbbell, FlaskConical, ClipboardList, Scale, Activity, MoreVertical } from "lucide-react";
import { Link } from "react-router-dom";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { toast } from "sonner";
import BodyImageUpload from "@/components/shared/BodyImageUpload";
import WhatsAppBulkSender from "@/components/shared/WhatsAppBulkSender";
import AdminEvolutionUpdate from "@/components/admin/AdminEvolutionUpdate";
import AdminBioimpedance from "@/components/admin/AdminBioimpedance";

const ConsultorDashboard = () => {
  const { user } = useAuth();
  const qc = useQueryClient();
  const [anamneseOpen, setAnamneseOpen] = useState(false);
  const [selected, setSelected] = useState<any>(null);
  const [anamneseText, setAnamneseText] = useState("");
  const [bioOpen, setBioOpen] = useState(false);

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

  return (
    <DashboardLayout role="consultor" title="Painel do Consultor" subtitle="Gerencie seus alunos vinculados">
      {/* Quick action */}
      <div className="flex justify-end mb-4">
        <Button asChild className="gap-2">
          <Link to="/admin/students?create=true">
            <Users className="w-4 h-4" /> Criar Aluno
          </Link>
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 mb-8">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium font-body">Alunos Vinculados</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{linkedStudents.length}</div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="font-display">Meus Alunos</CardTitle>
        </CardHeader>
        <CardContent>
          {linkedStudents.length === 0 ? (
            <p className="text-muted-foreground text-sm font-body">Nenhum aluno vinculado ainda.</p>
          ) : (
            <div className="space-y-3">
              {linkedStudents.map((s: any) => (
                <div key={s.user_id} className="flex items-center justify-between p-3 rounded-lg border">
                  <div>
                    <p className="font-medium font-body">{s.full_name}</p>
                    <p className="text-sm text-muted-foreground font-body">{s.email}</p>
                  </div>
                  <div className="flex gap-1 items-center">
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
    </DashboardLayout>
  );
};

export default ConsultorDashboard;
