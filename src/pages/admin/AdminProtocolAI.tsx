import { useState } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Sparkles, Loader2, Save, Search, RefreshCw, ClipboardCheck, Wand2, BookOpen, ShieldAlert, Activity } from "lucide-react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { normalizeSearch } from "@/lib/utils";
import GamifiedProtocolPanel from "@/components/student/GamifiedProtocolPanel";
import RichContentRenderer from "@/components/shared/RichContentRenderer";
import { hasSmartProtocolStructure } from "@/lib/protocol-phase-parser";
import { toast } from "sonner";

type GenResult = {
  title: string;
  protocol_html: string;
  summary?: string;
  risks?: string[];
  monitoring?: string[];
  phases_detected?: string[];
  _meta?: { usage?: any; model?: string };
};

type ReviewResult = {
  overall_score: number;
  summary: string;
  issues: string[];
  suggestions: string[];
  revised_protocol?: string;
};

const AdminProtocolAI = () => {
  const { role, user } = useAuth();
  const displayRole = role === "consultor" ? "consultor" : "admin";

  const [studentSearch, setStudentSearch] = useState("");
  const [selectedStudent, setSelectedStudent] = useState<any>(null);

  const [objective, setObjective] = useState("hipertrofia");
  const [phase, setPhase] = useState("off-season");
  const [experience, setExperience] = useState("avancado");
  const [durationWeeks, setDurationWeeks] = useState("12");
  const [currentStack, setCurrentStack] = useState("");
  const [labsNotes, setLabsNotes] = useState("");
  const [restrictions, setRestrictions] = useState("");
  const [freeText, setFreeText] = useState("");

  const [result, setResult] = useState<GenResult | null>(null);
  const [review, setReview] = useState<ReviewResult | null>(null);
  const [saving, setSaving] = useState(false);

  const { data: students = [] } = useQuery({
    queryKey: ["protocol-ai-students", displayRole, user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      let q = supabase.from("profiles").select("user_id, full_name, email, weight, height, birth_date, gender, objective");
      if (displayRole === "consultor") {
        const { data: links } = await supabase.from("consultant_students").select("student_id").eq("consultant_id", user.id);
        const ids = (links || []).map((l: any) => l.student_id);
        if (!ids.length) return [];
        q = q.in("user_id", ids);
      }
      const { data, error } = await q;
      if (error) throw error;
      return data || [];
    },
  });

  const filtered = (students as any[]).filter((s) => {
    const q = normalizeSearch(studentSearch);
    if (!q) return false;
    return normalizeSearch(s.full_name || "").includes(q) || normalizeSearch(s.email || "").includes(q);
  });

  const buildBrief = () => ({
    objetivo: objective,
    fase: phase,
    experiencia: experience,
    duracao_semanas: Number(durationWeeks) || null,
    stack_atual: currentStack,
    exames_recentes: labsNotes,
    restricoes: restrictions,
    aluno: selectedStudent
      ? {
          nome: selectedStudent.full_name,
          peso: selectedStudent.weight,
          altura: selectedStudent.height,
          sexo: selectedStudent.gender,
          nascimento: selectedStudent.birth_date,
          objetivo_perfil: selectedStudent.objective,
        }
      : null,
  });

  const generateMut = useMutation({
    mutationFn: async () => {
      setReview(null);
      const { data, error } = await supabase.functions.invoke("generate-protocol-ai", {
        body: {
          mode: "generate",
          brief: buildBrief(),
          freeText,
          studentId: selectedStudent?.user_id ?? null,
        },
      });
      if (error) throw error;
      if ((data as any)?.error) throw new Error((data as any).error);
      return data as GenResult;
    },
    onSuccess: (data) => {
      setResult(data);
      toast.success("Protocolo gerado pela STHIA Medical Engine");
    },
    onError: (e: any) => toast.error(e?.message || "Falha ao gerar protocolo"),
  });

  const reviewMut = useMutation({
    mutationFn: async () => {
      if (!result?.protocol_html) throw new Error("Gere um protocolo primeiro");
      const { data, error } = await supabase.functions.invoke("generate-protocol-ai", {
        body: { mode: "review", protocolContent: result.protocol_html },
      });
      if (error) throw error;
      if ((data as any)?.error) throw new Error((data as any).error);
      return data as ReviewResult;
    },
    onSuccess: (data) => setReview(data),
    onError: (e: any) => toast.error(e?.message || "Falha ao revisar"),
  });

  const applyRevised = () => {
    if (!review?.revised_protocol) return;
    setResult((r) => (r ? { ...r, protocol_html: review.revised_protocol! } : r));
    toast.success("Versão revisada aplicada");
  };

  const saveToStudent = async () => {
    if (!selectedStudent || !result) return;
    setSaving(true);
    try {
      const { error } = await supabase.from("student_protocols").insert({
        user_id: selectedStudent.user_id,
        title: result.title || "Protocolo STHIA",
        content: result.protocol_html,
        release_date: new Date().toISOString(),
      } as any);
      if (error) throw error;
      toast.success("Protocolo salvo como rascunho para o aluno");
    } catch (e: any) {
      toast.error(e?.message || "Falha ao salvar");
    } finally {
      setSaving(false);
    }
  };

  const saveToLibrary = async () => {
    if (!result) return;
    setSaving(true);
    try {
      const { error } = await supabase.from("protocol_library" as any).insert({
        title: result.title || "Protocolo STHIA",
        content: result.protocol_html,
        category: objective,
        created_by: user?.id ?? null,
      } as any);
      if (error) throw error;
      toast.success("Salvo na Biblioteca de Protocolos");
    } catch (e: any) {
      toast.error(e?.message || "Falha ao salvar na biblioteca");
    } finally {
      setSaving(false);
    }
  };

  const isSmart = !!result && hasSmartProtocolStructure(result.protocol_html);

  return (
    <DashboardLayout role={displayRole} title="Protocolo IA (beta)" subtitle="STHIA Elite Medical Performance Engine">
      <div className="grid grid-cols-1 xl:grid-cols-5 gap-6">
        <div className="xl:col-span-2 space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="font-display flex items-center gap-2 text-base">
                <Search className="w-4 h-4 text-primary" /> Aluno (opcional)
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <Input placeholder="Buscar por nome ou e-mail (2+ letras)" value={studentSearch} onChange={(e) => setStudentSearch(e.target.value)} />
              {studentSearch.trim().length >= 2 && !selectedStudent && (
                <div className="max-h-48 overflow-y-auto space-y-1">
                  {filtered.slice(0, 20).map((s) => (
                    <button key={s.user_id} onClick={() => { setSelectedStudent(s); setStudentSearch(""); }} className="w-full text-left p-2 rounded hover:bg-accent text-sm">
                      <div className="font-medium">{s.full_name || "Sem nome"}</div>
                      <div className="text-xs text-muted-foreground">{s.email}</div>
                    </button>
                  ))}
                  {filtered.length === 0 && <p className="text-xs text-muted-foreground">Nenhum encontrado.</p>}
                </div>
              )}
              {selectedStudent && (
                <div className="p-3 rounded bg-primary/5 border border-primary/20 flex items-center justify-between">
                  <div>
                    <p className="font-medium text-sm">{selectedStudent.full_name}</p>
                    <p className="text-xs text-muted-foreground">
                      {selectedStudent.weight ? `${selectedStudent.weight}kg · ` : ""}{selectedStudent.gender || ""} {selectedStudent.objective || ""}
                    </p>
                  </div>
                  <Button size="sm" variant="ghost" onClick={() => setSelectedStudent(null)}>Trocar</Button>
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="font-display flex items-center gap-2 text-base">
                <Sparkles className="w-4 h-4 text-primary" /> Briefing clínico
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <Label className="text-xs">Objetivo</Label>
                  <Select value={objective} onValueChange={setObjective}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="hipertrofia">Hipertrofia</SelectItem>
                      <SelectItem value="cutting">Cutting</SelectItem>
                      <SelectItem value="recomposicao">Recomposição</SelectItem>
                      <SelectItem value="performance">Performance</SelectItem>
                      <SelectItem value="longevidade">Longevidade</SelectItem>
                      <SelectItem value="trt">TRT / Reposição</SelectItem>
                      <SelectItem value="emagrecimento">Emagrecimento (GLP-1)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label className="text-xs">Fase</Label>
                  <Select value={phase} onValueChange={setPhase}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="off-season">Off-season</SelectItem>
                      <SelectItem value="bulking">Bulking</SelectItem>
                      <SelectItem value="cutting">Cutting</SelectItem>
                      <SelectItem value="pre-contest">Pré-contest</SelectItem>
                      <SelectItem value="ponte">Ponte / TRT</SelectItem>
                      <SelectItem value="tpc">TPC</SelectItem>
                      <SelectItem value="detox">Detox / Descanso</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label className="text-xs">Experiência</Label>
                  <Select value={experience} onValueChange={setExperience}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="iniciante">Iniciante</SelectItem>
                      <SelectItem value="intermediario">Intermediário</SelectItem>
                      <SelectItem value="avancado">Avançado</SelectItem>
                      <SelectItem value="elite">Elite / competidor</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label className="text-xs">Duração (semanas)</Label>
                  <Input type="number" value={durationWeeks} onChange={(e) => setDurationWeeks(e.target.value)} placeholder="12" />
                </div>
              </div>

              <div>
                <Label className="text-xs">Stack atual (hormônios / peptídeos / suplementos)</Label>
                <Textarea rows={3} value={currentStack} onChange={(e) => setCurrentStack(e.target.value)} placeholder="Ex: Testo E 250mg/sem, Trembolona 200mg/sem, GH 4UI/dia, Metformina 850mg 2x..." />
              </div>
              <div>
                <Label className="text-xs">Exames recentes / biomarcadores relevantes</Label>
                <Textarea rows={3} value={labsNotes} onChange={(e) => setLabsNotes(e.target.value)} placeholder="Ex: HDL 32, LDL 145, HCT 52%, TGO 60, TGP 78, Estradiol 68..." />
              </div>
              <div>
                <Label className="text-xs">Restrições / condições clínicas</Label>
                <Input value={restrictions} onChange={(e) => setRestrictions(e.target.value)} placeholder="HAS controlada, gastrite, alergia a lactose..." />
              </div>
              <div>
                <Label className="text-xs">Observações livres (prompt)</Label>
                <Textarea rows={4} value={freeText} onChange={(e) => setFreeText(e.target.value)} placeholder="Ex: montar protocolo off-season 12 semanas com foco em ganho de massa magra e proteção cardiovascular, incluir peptídeos de recuperação..." />
              </div>

              <Button onClick={() => generateMut.mutate()} disabled={generateMut.isPending} className="w-full">
                {generateMut.isPending ? (<><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Gerando protocolo...</>) : (<><Wand2 className="w-4 h-4 mr-2" /> Gerar com STHIA Medical Engine</>)}
              </Button>
            </CardContent>
          </Card>
        </div>

        <div className="xl:col-span-3 space-y-4">
          {!result && (
            <Card>
              <CardContent className="py-16 text-center text-muted-foreground text-sm">
                Preencha o briefing e clique em <span className="font-medium">Gerar com STHIA</span> para começar.
              </CardContent>
            </Card>
          )}

          {result && (
            <>
              <Card>
                <CardHeader>
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <CardTitle className="font-display text-base flex items-center gap-2">
                      <Sparkles className="w-4 h-4 text-primary" /> {result.title}
                    </CardTitle>
                    <div className="flex flex-wrap gap-2">
                      <Button size="sm" variant="outline" onClick={() => generateMut.mutate()} disabled={generateMut.isPending}>
                        <RefreshCw className="w-4 h-4 mr-1" /> Regerar
                      </Button>
                      <Button size="sm" variant="outline" onClick={() => reviewMut.mutate()} disabled={reviewMut.isPending}>
                        {reviewMut.isPending ? <Loader2 className="w-4 h-4 mr-1 animate-spin" /> : <ClipboardCheck className="w-4 h-4 mr-1" />}
                        Revisar com IA
                      </Button>
                      <Button size="sm" variant="outline" onClick={saveToLibrary} disabled={saving}>
                        <BookOpen className="w-4 h-4 mr-1" /> Biblioteca
                      </Button>
                      <Button size="sm" onClick={saveToStudent} disabled={saving || !selectedStudent}>
                        <Save className="w-4 h-4 mr-1" /> {saving ? "Salvando..." : "Salvar p/ aluno"}
                      </Button>
                    </div>
                  </div>
                  {result.summary && <p className="text-xs text-muted-foreground mt-2">{result.summary}</p>}
                  <div className="flex flex-wrap gap-2 mt-3">
                    {result.phases_detected?.map((p) => <Badge key={p} variant="outline">{p}</Badge>)}
                    {isSmart && <Badge variant="outline" className="border-primary/40 text-primary">Smart Protocol ✓</Badge>}
                    {typeof (result as any)?._meta?.images_used === "number" && (
                      <Badge variant="outline" className="border-primary/40 text-primary">
                        📸 {(result as any)._meta.images_used} foto(s) analisada(s)
                      </Badge>
                    )}
                  </div>
                </CardHeader>
                <CardContent>
                  {isSmart ? (
                    <GamifiedProtocolPanel content={result.protocol_html} userId={selectedStudent?.user_id ?? user?.id ?? ""} readOnly />
                  ) : (
                    <div className="rounded-lg border border-border bg-card p-4 max-h-[600px] overflow-y-auto">
                      <RichContentRenderer content={result.protocol_html} showParagraphBullets={false} showZebra={false} />
                    </div>
                  )}

                  {(result.risks?.length || result.monitoring?.length) && (
                    <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-3">
                      {result.risks?.length ? (
                        <div className="rounded border border-destructive/30 bg-destructive/5 p-3">
                          <p className="text-xs font-medium mb-1 flex items-center gap-1 text-destructive"><ShieldAlert className="w-3.5 h-3.5" /> Riscos</p>
                          <ul className="list-disc list-inside space-y-1 text-xs text-muted-foreground">
                            {result.risks.map((r, i) => <li key={i}>{r}</li>)}
                          </ul>
                        </div>
                      ) : null}
                      {result.monitoring?.length ? (
                        <div className="rounded border border-primary/30 bg-primary/5 p-3">
                          <p className="text-xs font-medium mb-1 flex items-center gap-1 text-primary"><Activity className="w-3.5 h-3.5" /> Monitoramento</p>
                          <ul className="list-disc list-inside space-y-1 text-xs text-muted-foreground">
                            {result.monitoring.map((m, i) => <li key={i}>{m}</li>)}
                          </ul>
                        </div>
                      ) : null}
                    </div>
                  )}
                </CardContent>
              </Card>

              {review && (
                <Card>
                  <CardHeader>
                    <CardTitle className="font-display text-base flex items-center gap-2">
                      <ClipboardCheck className="w-4 h-4 text-primary" /> Revisão da IA
                      <Badge>{review.overall_score}/10</Badge>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3 text-sm">
                    <p>{review.summary}</p>
                    {review.issues?.length > 0 && (
                      <div>
                        <p className="font-medium mb-1">Pontos de atenção</p>
                        <ul className="list-disc list-inside space-y-1 text-muted-foreground">
                          {review.issues.map((i, idx) => <li key={idx}>{i}</li>)}
                        </ul>
                      </div>
                    )}
                    {review.suggestions?.length > 0 && (
                      <div>
                        <p className="font-medium mb-1">Sugestões</p>
                        <ul className="list-disc list-inside space-y-1 text-muted-foreground">
                          {review.suggestions.map((s, idx) => <li key={idx}>{s}</li>)}
                        </ul>
                      </div>
                    )}
                    {review.revised_protocol && (
                      <Button size="sm" variant="outline" onClick={applyRevised}>
                        <Wand2 className="w-4 h-4 mr-1" /> Aplicar versão revisada
                      </Button>
                    )}
                  </CardContent>
                </Card>
              )}
            </>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
};

export default AdminProtocolAI;