import { useEffect, useMemo, useRef, useState } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2, Sparkles, Stethoscope, AlertTriangle, ClipboardList, History, Trash2, Upload, FileText, ImagePlus, X, Camera, Save, Eye, EyeOff } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import ClinicalExportDialog from "@/components/admin/ClinicalExportDialog";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { normalizeSearch } from "@/lib/utils";
import { normalizeClinicalHtml } from "@/lib/clinical-html";
import ClinicalReport from "@/components/shared/ClinicalReport";
import LabInterpretationPanel from "@/components/shared/LabInterpretationPanel";
import { isRealPdf, INVALID_PDF_MESSAGE } from "@/lib/pdf-validate";
import { toast } from "sonner";

type Student = { user_id: string; full_name: string | null; email: string | null };
type Analysis = {
  id: string;
  user_id: string;
  title: string;
  scope: string;
  summary: string | null;
  report_html: string;
  red_flags: string[];
  recommendations: string[];
  markers: any[];
  visual_composition: Record<string, string>;
  created_at: string;
  released_to_student?: boolean;
  released_at?: string | null;
  visibility_settings?: {
    lab_interpretation?: boolean;
    general_summary?: boolean;
    visual_composition?: boolean;
    body_composition?: boolean;
    red_flags?: boolean;
    prioritized_recommendations?: boolean;
  };
};

export default function AdminStudentAnalysis() {
  const qc = useQueryClient();
  const [search, setSearch] = useState("");
  const [studentId, setStudentId] = useState<string | null>(null);
  const [focus, setFocus] = useState("full");
  const [examText, setExamText] = useState("");
  const [consultantNotes, setConsultantNotes] = useState("");
  const [protocolText, setProtocolText] = useState("");
  const [protocolTitle, setProtocolTitle] = useState("");
  const [pullingProtocol, setPullingProtocol] = useState(false);
  const [current, setCurrent] = useState<Analysis | null>(null);
  const [selectedBodyIds, setSelectedBodyIds] = useState<string[]>([]);
  const [extraImagePaths, setExtraImagePaths] = useState<{ path: string; name: string }[]>([]);
  const [extraExamPaths, setExtraExamPaths] = useState<{ path: string; name: string }[]>([]);
  const [includeExistingExams, setIncludeExistingExams] = useState(true);
  const [selectedExamIds, setSelectedExamIds] = useState<string[]>([]);
  const [uploading, setUploading] = useState(false);
  const [exportOpen, setExportOpen] = useState(false);
  const [revalCriteria, setRevalCriteria] = useState("");
  const examInputRef = useRef<HTMLInputElement | null>(null);
  const imageInputRef = useRef<HTMLInputElement | null>(null);

  const { data: students = [] } = useQuery({
    queryKey: ["students-min"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("profiles")
        .select("user_id, full_name, email")
        .order("full_name", { ascending: true });
      if (error) throw error;
      return (data ?? []) as Student[];
    },
  });

  const filtered = useMemo(() => {
    const q = normalizeSearch(search);
    if (!q) return students; // Remover o slice(0, 50) para permitir busca em todos os alunos carregados
    return students
      .filter((s) => normalizeSearch(`${s.full_name ?? ""} ${s.email ?? ""}`).includes(q));
  }, [students, search]);

  const { data: history = [], refetch: refetchHistory, isLoading: isLoadingHistory } = useQuery({
    queryKey: ["clinical-analyses", studentId],
    enabled: !!studentId,
    queryFn: async () => {
      console.log("Fetching history for studentId:", studentId);
      const { data, error } = await supabase
        .from("student_clinical_analyses")
        .select("id, user_id, title, scope, summary, report_html, red_flags, recommendations, markers, visual_composition, created_at, released_to_student, released_at, visual_share_enabled, visual_share_expires_at, visibility_settings")
        .eq("user_id", studentId!)
        .order("created_at", { ascending: false }); // Removido o limite para garantir que todo o histórico seja visível
      if (error) throw error;
      console.log("Fetched history count:", data?.length || 0);
      return (data ?? []) as any as Analysis[];
    },
  });

  const { data: bodyImages = [] } = useQuery({
    queryKey: ["body-images-for-analysis", studentId],
    enabled: !!studentId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("body_images")
        .select("id, type, storage_path, image_url, uploaded_at, is_current")
        .eq("user_id", studentId!)
        .order("uploaded_at", { ascending: false })
        .limit(40);
      if (error) throw error;
      return data ?? [];
    },
  });

  const { data: existingExams = [] } = useQuery({
    queryKey: ["clinical-docs-for-analysis", studentId],
    enabled: !!studentId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("clinical_documents")
        .select("id, type, storage_path, file_url, uploaded_at")
        .eq("user_id", studentId!)
        .eq("type", "lab_exam")
        .order("uploaded_at", { ascending: false })
        .limit(10);
      if (error) throw error;
      return data ?? [];
    },
  });

  const { data: bodyImagePreviews = {} } = useQuery({
    queryKey: ["body-image-signed", studentId, bodyImages.map((b: any) => b.id).join(",")],
    enabled: !!studentId && bodyImages.length > 0,
    queryFn: async () => {
      const out: Record<string, string> = {};
      for (const b of bodyImages as any[]) {
        if (b.storage_path) {
          const { data } = await supabase.storage.from("body-images").createSignedUrl(b.storage_path, 60 * 30);
          if (data?.signedUrl) out[b.id] = data.signedUrl;
        } else if (b.image_url) {
          out[b.id] = b.image_url;
        }
      }
      return out;
    },
  });

  const toggleBody = (id: string) =>
    setSelectedBodyIds((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));

  // Por padrão, todos os exames do sistema vêm marcados; admin pode escolher quais usar
  useEffect(() => {
    setSelectedExamIds((existingExams as any[]).map((d) => d.id));
  }, [existingExams]);

  const toggleExam = (id: string) =>
    setSelectedExamIds((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));

  const htmlToPlain = (html: string) =>
    (html || "")
      .replace(/<br\s*\/?>/gi, "\n")
      .replace(/<\/(p|div|li|h[1-6])>/gi, "\n")
      .replace(/<li[^>]*>/gi, "• ")
      .replace(/<[^>]+>/g, "")
      .replace(/&nbsp;/g, " ")
      .replace(/&amp;/g, "&")
      .replace(/\n{3,}/g, "\n\n")
      .trim();

  const pullProtocol = async () => {
    if (!studentId) { toast.error("Selecione um aluno"); return; }
    setPullingProtocol(true);
    try {
      const { data, error } = await supabase
        .from("student_protocols")
        .select("title, content, updated_at")
        .eq("user_id", studentId)
        .order("updated_at", { ascending: false })
        .limit(1)
        .maybeSingle();
      if (error) throw error;
      const plain = htmlToPlain((data as any)?.content || "");
      if (!plain) { toast.message("Este aluno não tem protocolo com conteúdo salvo."); return; }
      setProtocolText(plain.slice(0, 8000));
      setProtocolTitle((data as any)?.title || "Protocolo atual");
      toast.success(`Protocolo puxado: ${(data as any)?.title || "sem título"}`);
    } catch (e: any) {
      toast.error(e?.message || "Falha ao puxar protocolo");
    } finally {
      setPullingProtocol(false);
    }
  };

  const uploadExamFiles = async (files: FileList | null) => {
    if (!files || !studentId) return;
    setUploading(true);
    try {
      const uploaded: { path: string; name: string }[] = [];
      for (const file of Array.from(files)) {
        const ext = (file.name.split(".").pop() || "bin").toLowerCase();
        if (!["pdf", "jpg", "jpeg", "png", "webp"].includes(ext)) {
          toast.error(`Formato não suportado: ${file.name}`);
          continue;
        }
        if (file.size > 15 * 1024 * 1024) {
          toast.error(`${file.name} maior que 15MB`);
          continue;
        }
        if (ext === "pdf" && !(await isRealPdf(file))) {
          toast.error(`${file.name}: ${INVALID_PDF_MESSAGE}`);
          continue;
        }
        const path = `clinical-analysis/${studentId}/${Date.now()}-${file.name.replace(/[^a-zA-Z0-9._-]/g, "_")}`;
        const { error } = await supabase.storage.from("documents").upload(path, file, {
          contentType: file.type || undefined,
          upsert: false,
        });
        if (error) { toast.error(`${file.name}: ${error.message}`); continue; }
        uploaded.push({ path, name: file.name });
      }
      if (uploaded.length) {
        setExtraExamPaths((p) => [...p, ...uploaded]);
        toast.success(`${uploaded.length} exame(s) anexado(s)`);
      }
    } finally {
      setUploading(false);
      if (examInputRef.current) examInputRef.current.value = "";
    }
  };

  const uploadRefImages = async (files: FileList | null) => {
    if (!files || !studentId) return;
    setUploading(true);
    try {
      const uploaded: { path: string; name: string }[] = [];
      for (const file of Array.from(files)) {
        const ext = (file.name.split(".").pop() || "bin").toLowerCase();
        if (!["jpg", "jpeg", "png", "webp"].includes(ext)) {
          toast.error(`Só imagens JPG/PNG/WEBP: ${file.name}`);
          continue;
        }
        if (file.size > 15 * 1024 * 1024) {
          toast.error(`${file.name} maior que 15MB`);
          continue;
        }
        const path = `clinical-analysis/${studentId}/${Date.now()}-${file.name.replace(/[^a-zA-Z0-9._-]/g, "_")}`;
        const { error } = await supabase.storage.from("body-images").upload(path, file, {
          contentType: file.type || undefined,
          upsert: false,
        });
        if (error) { toast.error(`${file.name}: ${error.message}`); continue; }
        uploaded.push({ path, name: file.name });
      }
      if (uploaded.length) {
        setExtraImagePaths((p) => [...p, ...uploaded]);
        toast.success(`${uploaded.length} imagem(ns) anexada(s)`);
      }
    } finally {
      setUploading(false);
      if (imageInputRef.current) imageInputRef.current.value = "";
    }
  };

  const generate = useMutation({
    mutationFn: async () => {
      if (!studentId) throw new Error("Selecione um aluno");
      const existingPaths = includeExistingExams
        ? (existingExams as any[])
            .filter((d) => selectedExamIds.includes(d.id))
            .map((d) => d.storage_path)
            .filter(Boolean)
        : [];
      const mergedExamPaths = Array.from(
        new Set([...existingPaths, ...extraExamPaths.map((f) => f.path)])
      );
      const { data, error } = await supabase.functions.invoke("sthia-clinical-analysis", {
        body: {
          studentId,
          examText,
          consultantNotes,
          protocolText: protocolText.trim() || null,
          protocolTitle: protocolTitle.trim() || null,
          focus,
          save: true,
          bodyImageIds: selectedBodyIds.length ? selectedBodyIds : null,
          extraImagePaths: extraImagePaths.map((f) => f.path),
          extraExamPaths: mergedExamPaths,
        },
      });
      if (error) throw error;
      if ((data as any)?.error) throw new Error((data as any).error);
      return data as Analysis;
    },
    onSuccess: (data) => {
      toast.success("Parecer STHIA gerado e registrado no histórico");
      setCurrent(data);
      setExamText("");
      setConsultantNotes("");
      setProtocolText("");
      setProtocolTitle("");
      setExtraExamPaths([]);
      setExtraImagePaths([]);
      setSelectedBodyIds([]);
      qc.invalidateQueries({ queryKey: ["clinical-analyses", studentId] });
      refetchHistory();
    },
    onError: (e: any) => toast.error(e?.message || "Falha ao gerar parecer"),
  });

  const revalidate = useMutation({
    mutationFn: async () => {
      if (!studentId || !current) throw new Error("Nenhum parecer selecionado");
      const { data, error } = await supabase.functions.invoke("sthia-clinical-analysis", {
        body: {
          studentId,
          examText: "",
          consultantNotes,
          protocolText: protocolText.trim() || null,
          protocolTitle: protocolTitle.trim() || null,
          focus: current.scope || focus,
          save: true,
          previousReportHtml: current.report_html,
          revalidationCriteria: revalCriteria.trim(),
        },
      });
      if (error) throw error;
      if ((data as any)?.error) throw new Error((data as any).error);
      return data as Analysis;
    },
    onSuccess: (data) => {
      toast.success("Parecer revalidado e salvo no histórico");
      setCurrent(data);
      setRevalCriteria("");
      qc.invalidateQueries({ queryKey: ["clinical-analyses", studentId] });
      refetchHistory();
    },
    onError: (e: any) => toast.error(e?.message || "Falha ao revalidar parecer"),
  });

  const removeAnalysis = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("student_clinical_analyses").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Análise removida");
      if (current) setCurrent(null);
      refetchHistory();
    },
  });

  const toggleRelease = useMutation({
    mutationFn: async (a: Analysis) => {
      const next = !a.released_to_student;
      const { error } = await supabase
        .from("student_clinical_analyses")
        .update({ released_to_student: next, released_at: next ? new Date().toISOString() : null })
        .eq("id", a.id);
      if (error) throw error;
      return next;
    },
    onSuccess: (next) => {
      toast.success(next ? "Parecer liberado para o aluno" : "Parecer ocultado do aluno");
      refetchHistory();
      if (current) setCurrent({ ...current, released_to_student: next, released_at: next ? new Date().toISOString() : null });
    },
    onError: (e: any) => toast.error(e?.message || "Falha ao atualizar liberação"),
  });

  const [shareDays, setShareDays] = useState<string>("7");
  const setVisualShare = useMutation({
    mutationFn: async ({ a, enabled, days }: { a: Analysis; enabled: boolean; days: string }) => {
      const expires =
        enabled && days !== "0"
          ? new Date(Date.now() + Number(days) * 86400000).toISOString()
          : null;
      const { error } = await supabase
        .from("student_clinical_analyses")
        .update({ visual_share_enabled: enabled, visual_share_expires_at: expires })
        .eq("id", a.id);
      if (error) throw error;
      return { enabled, expires };
    },
    onSuccess: ({ enabled, expires }) => {
      toast.success(enabled ? "Leitura visual liberada" : "Leitura visual bloqueada");
      refetchHistory();
      if (current) setCurrent({ ...(current as any), visual_share_enabled: enabled, visual_share_expires_at: expires } as any);
    },
    onError: (e: any) => toast.error(e?.message || "Falha ao atualizar liberação da leitura visual"),
  });

  const updateVisibility = useMutation({
    mutationFn: async ({ id, settings }: { id: string, settings: any }) => {
      // Usamos 'as any' para contornar o erro de tipagem temporário enquanto o schema cache do Supabase não atualiza
      const { error } = await supabase
        .from("student_clinical_analyses")
        .update({ visibility_settings: settings } as any)
        .eq("id", id);
      
      if (error) {
        console.error("Supabase update error:", error);
        throw error;
      }
      return settings;
    },
    onSuccess: (settings) => {
      toast.success("Configurações de visibilidade atualizadas");
      qc.invalidateQueries({ queryKey: ["clinical-analyses", studentId] });
      if (current) {
        setCurrent(prev => prev ? { ...prev, visibility_settings: settings } : null);
      }
    },
    onError: (e: any) => {
      console.error("Erro ao atualizar visibilidade:", e);
      toast.error(e?.message || "Falha ao atualizar visibilidade");
    },
  });

  const selectedStudent = students.find((s) => s.user_id === studentId);

  return (
    <DashboardLayout
      role="admin"
      title="Central de Análise · STHIA"
      subtitle="Leitura e interpretação de exames, composição visual, parecer clínico e recomendações personalizadas."
    >
      <div className="grid gap-4 lg:grid-cols-[320px_minmax(0,1fr)] w-full min-w-0">
        {/* Seleção de aluno + histórico */}
        <div className="space-y-3 min-w-0">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm flex items-center gap-2"><Stethoscope className="w-4 h-4" /> Aluno</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <Input
                placeholder="Buscar por nome ou e-mail…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
              <div className="max-h-[280px] overflow-y-auto space-y-1">
                {filtered.map((s) => (
                  <button
                    key={s.user_id}
                    onClick={() => { setStudentId(s.user_id); setCurrent(null); }}
                    className={`w-full text-left px-2 py-1.5 rounded-md text-xs transition ${studentId === s.user_id ? "bg-primary text-primary-foreground" : "hover:bg-muted"}`}
                  >
                    <div className="font-medium truncate">{s.full_name || "Sem nome"}</div>
                    <div className="opacity-70 truncate">{s.email}</div>
                  </button>
                ))}
                {filtered.length === 0 && <p className="text-xs text-muted-foreground p-2">Nenhum aluno encontrado</p>}
              </div>
            </CardContent>
          </Card>

          {studentId && (
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm flex items-center gap-2"><History className="w-4 h-4" /> Histórico</CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <div className="max-h-[500px] overflow-y-auto">
                  {isLoadingHistory ? (
                    <div className="p-8 text-center">
                      <Loader2 className="w-6 h-6 animate-spin mx-auto text-primary/40" />
                      <p className="text-[10px] text-muted-foreground mt-2">Carregando histórico...</p>
                    </div>
                  ) : history.length === 0 ? (
                    <div className="p-8 text-center space-y-2">
                      <History className="w-8 h-8 text-muted-foreground/30 mx-auto" />
                      <p className="text-xs text-muted-foreground italic">Nenhuma análise registrada no histórico para este aluno.</p>
                    </div>
                  ) : (
                    <div className="divide-y divide-border">
                      {history.map((a) => (
                        <div key={a.id} className="p-3 hover:bg-muted/50 transition-colors group">
                          <div className="flex items-center justify-between gap-2 mb-1.5">
                            <button
                              onClick={() => setCurrent(a)}
                              className="text-[13px] font-semibold text-foreground hover:text-primary transition-colors text-left flex-1 truncate"
                            >
                              {a.title}
                            </button>
                            <div className="flex items-center gap-1.5 shrink-0">
                              {a.released_to_student ? (
                                <Badge variant="outline" className="h-4 px-1 text-[9px] uppercase border-emerald-500/40 text-emerald-500 bg-emerald-500/5">
                                  Liberada
                                </Badge>
                              ) : (
                                <Badge variant="outline" className="h-4 px-1 text-[9px] uppercase border-muted-foreground/20 text-muted-foreground">
                                  Privada
                                </Badge>
                              )}
                              <button
                                onClick={() => {
                                  if (confirm("Deseja excluir permanentemente este registro?")) {
                                    removeAnalysis.mutate(a.id);
                                  }
                                }}
                                className="opacity-0 group-hover:opacity-100 p-1 hover:bg-destructive/10 hover:text-destructive rounded transition-all"
                                title="Excluir histórico"
                              >
                                <Trash2 className="w-3 h-3" />
                              </button>
                            </div>
                          </div>
                          
                          <div className="flex items-center justify-between text-[10px] text-muted-foreground">
                            <span className="flex items-center gap-1">
                              <History className="w-3 h-3" />
                              {new Date(a.created_at).toLocaleDateString("pt-BR")} às {new Date(a.created_at).toLocaleTimeString("pt-BR", { hour: '2-digit', minute: '2-digit' })}
                            </span>
                            <Badge variant="secondary" className="h-4 px-1 text-[9px] font-normal lowercase opacity-80">
                              {a.scope}
                            </Badge>
                          </div>
                        </div>
                      ))}
                      {history.length >= 30 && (
                        <p className="text-[10px] text-center text-muted-foreground p-3 border-t border-border/50">
                          Exibindo as últimas 30 análises.
                        </p>
                      )}
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Área principal */}
        <div className="space-y-4 min-w-0">
          {!studentId && (
            <Card><CardContent className="py-12 text-center text-sm text-muted-foreground">Selecione um aluno para começar a análise.</CardContent></Card>
          )}

          {studentId && (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-primary" /> Gerar novo parecer STHIA
                </CardTitle>
                {selectedStudent && (
                  <p className="text-xs text-muted-foreground">
                    Aluno: <strong>{selectedStudent.full_name}</strong> · {selectedStudent.email}
                  </p>
                )}
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="space-y-1 md:max-w-[260px]">
                  <Label className="text-xs">Foco da análise</Label>
                  <Select value={focus} onValueChange={setFocus}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="full">Análise completa</SelectItem>
                      <SelectItem value="labs">Só exames laboratoriais</SelectItem>
                      <SelectItem value="visual">Só composição visual</SelectItem>
                      <SelectItem value="protocol_review">Revisão do protocolo atual</SelectItem>
                      <SelectItem value="diet_review">Revisão da dieta atual</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Observações do consultor (opcional)</Label>
                  <Textarea
                    rows={7}
                    placeholder="Ex: aluno relatou queda de libido, dor lombar leve, sono ruim, queixas recentes, contexto clínico, histórico relevante…"
                    value={consultantNotes}
                    onChange={(e) => setConsultantNotes(e.target.value)}
                    className="min-h-[150px] text-sm leading-relaxed"
                  />
                  <p className="text-[10px] text-muted-foreground">{consultantNotes.length} caracteres</p>
                </div>

                {/* Protocolo atual: puxar do sistema ou descrever livremente (aluno externo) */}
                <div className="space-y-2 rounded-md border border-border p-3">
                  <div className="flex items-center justify-between gap-2 flex-wrap">
                    <Label className="text-xs flex items-center gap-1.5">
                      <ClipboardList className="w-3.5 h-3.5" /> Protocolo atual (opcional)
                    </Label>
                    <div className="flex items-center gap-1.5">
                      <Button size="sm" variant="outline" className="h-7 gap-1.5" disabled={pullingProtocol || !studentId} onClick={pullProtocol}>
                        {pullingProtocol ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5" />}
                        Puxar do sistema
                      </Button>
                      {(protocolText || protocolTitle) && (
                        <Button size="sm" variant="ghost" className="h-7 gap-1.5" onClick={() => { setProtocolText(""); setProtocolTitle(""); }}>
                          <X className="w-3.5 h-3.5" /> Limpar
                        </Button>
                      )}
                    </div>
                  </div>
                  <Input
                    placeholder="Título do protocolo (ex: Protocolo atual / Ciclo externo relatado)"
                    value={protocolTitle}
                    onChange={(e) => setProtocolTitle(e.target.value)}
                    className="h-8 text-xs"
                  />
                  <Textarea
                    rows={8}
                    placeholder={`Puxe do sistema ou descreva livremente (aluno externo). Ex.:\nTestosterona cipionato 250mg/sem (seg/qui)\nOxandrolona 20mg/dia\nHCG 500UI 2x/sem\nTirzepatida 5mg/sem\nSuplementos: creatina 5g, ômega 3, vit D 5000UI`}
                    value={protocolText}
                    onChange={(e) => setProtocolText(e.target.value)}
                    className="min-h-[170px] font-mono text-xs leading-relaxed"
                  />
                  <p className="text-[10px] text-muted-foreground">
                    Quando preenchido, a STHIA usa este protocolo como referência principal — inclusive para alunos externos sem protocolo cadastrado.
                  </p>
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Exames (cole o texto/valores) — opcional</Label>
                  <Textarea
                    rows={6}
                    placeholder={`Cole aqui os resultados dos exames. Ex.:\nTestosterona total: 850 ng/dL (ref 264–916)\nEstradiol: 42 pg/mL\nHematócrito: 51%\nALT: 68 U/L · AST: 55 U/L\nHDL: 32 · LDL: 145 · Triglicerídeos: 210…`}
                    value={examText}
                    onChange={(e) => setExamText(e.target.value)}
                    className="font-mono text-xs"
                  />
                  <p className="text-[10px] text-muted-foreground">
                    A STHIA cruza este texto com o dossiê (bioimpedância, fotos, peso, protocolo/dieta atuais).
                  </p>
                </div>

                {/* Upload de exames laboratoriais (PDF/JPG/PNG) */}
                <div className="space-y-2 rounded-md border border-border p-3">
                  <div className="flex items-center justify-between gap-2">
                    <Label className="text-xs flex items-center gap-1.5">
                      <FileText className="w-3.5 h-3.5" /> Exames laboratoriais (PDF/JPG/PNG)
                    </Label>
                    <Button size="sm" variant="outline" className="h-7 gap-1.5" disabled={uploading} onClick={() => examInputRef.current?.click()}>
                      <Upload className="w-3.5 h-3.5" /> Anexar
                    </Button>
                    <input
                      ref={examInputRef}
                      type="file"
                      accept="application/pdf,image/jpeg,image/png,image/webp"
                      multiple
                      className="hidden"
                      onChange={(e) => uploadExamFiles(e.target.files)}
                    />
                  </div>
                  {(existingExams as any[]).length > 0 && (
                    <div className="rounded-md bg-primary/5 border border-primary/20 p-2 space-y-1.5">
                      <div className="flex items-center justify-between gap-2">
                        <div className="text-[11px] font-medium flex items-center gap-1.5">
                          <FileText className="w-3 h-3 text-primary" />
                          Aluno já possui {(existingExams as any[]).length} exame(s) no sistema
                        </div>
                        <div className="flex items-center gap-1.5">
                          <Switch
                            id="use-existing-exams"
                            checked={includeExistingExams}
                            onCheckedChange={setIncludeExistingExams}
                          />
                          <Label htmlFor="use-existing-exams" className="text-[10px] cursor-pointer">
                            {includeExistingExams ? "Incluir na análise" : "Ignorar"}
                          </Label>
                        </div>
                      </div>
                      {includeExistingExams && (existingExams as any[]).length > 1 && (
                        <div className="flex items-center justify-between gap-2">
                          <span className="text-[10px] text-muted-foreground">
                            {selectedExamIds.length} de {(existingExams as any[]).length} selecionado(s)
                          </span>
                          <div className="flex gap-1">
                            <Button
                              size="sm"
                              variant="ghost"
                              className="h-6 text-[10px] px-2"
                              onClick={() => setSelectedExamIds((existingExams as any[]).map((d) => d.id))}
                            >
                              Todos
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              className="h-6 text-[10px] px-2"
                              onClick={() => setSelectedExamIds([])}
                            >
                              Nenhum
                            </Button>
                          </div>
                        </div>
                      )}
                      <ul className="space-y-0.5 max-h-40 overflow-y-auto pr-1">
                        {(existingExams as any[]).map((d) => (
                          <li key={d.id} className="text-[10px] text-muted-foreground flex items-center gap-2">
                            {includeExistingExams && (
                              <Checkbox
                                checked={selectedExamIds.includes(d.id)}
                                onCheckedChange={() => toggleExam(d.id)}
                                className="h-3.5 w-3.5 shrink-0"
                                aria-label="Usar este exame na análise"
                              />
                            )}
                            <span className="truncate flex-1">
                              {d.storage_path?.split("/").pop() || "exame.pdf"}
                            </span>
                            <span className="opacity-70 shrink-0">
                              {new Date(d.uploaded_at).toLocaleDateString("pt-BR")}
                            </span>
                          </li>
                        ))}
                      </ul>
                      <p className="text-[9px] text-muted-foreground">
                        {!includeExistingExams
                          ? "Estes exames não serão considerados nesta análise."
                          : selectedExamIds.length === 0
                          ? "Nenhum exame marcado — a STHIA usará apenas o texto e anexos novos."
                          : "STHIA fará OCR apenas dos exames marcados."}
                      </p>
                    </div>
                  )}
                  {extraExamPaths.length === 0 ? (
                    <p className="text-[10px] text-muted-foreground">Envie laudos/PDFs — a STHIA fará OCR e integrará todos os marcadores encontrados.</p>
                  ) : (
                    <ul className="space-y-1">
                      {extraExamPaths.map((f, i) => (
                        <li key={f.path} className="flex items-center justify-between gap-2 text-xs bg-muted/50 rounded px-2 py-1">
                          <span className="truncate flex items-center gap-1.5"><FileText className="w-3 h-3" />{f.name}</span>
                          <button onClick={() => setExtraExamPaths((p) => p.filter((_, idx) => idx !== i))} className="opacity-60 hover:opacity-100"><X className="w-3 h-3" /></button>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>

                {/* Seleção de fotos antes/depois do dossiê */}
                <div className="space-y-2 rounded-md border border-border p-3">
                  <Label className="text-xs flex items-center gap-1.5">
                    <Camera className="w-3.5 h-3.5" /> Fotos do aluno para análise visual (antes/depois)
                  </Label>
                  {bodyImages.length === 0 ? (
                    <p className="text-[10px] text-muted-foreground">Aluno não possui fotos cadastradas. Anexe imagens abaixo se quiser análise visual.</p>
                  ) : (
                    <>
                      <p className="text-[10px] text-muted-foreground">
                        {selectedBodyIds.length === 0
                          ? "Nenhuma selecionada → STHIA usa automaticamente as fotos mais recentes (front/back/profile)."
                          : `${selectedBodyIds.length} foto(s) selecionada(s) manualmente.`}
                      </p>
                      <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-2 max-h-[240px] overflow-y-auto">
                        {(bodyImages as any[]).map((b) => {
                          const url = (bodyImagePreviews as Record<string, string>)[b.id];
                          const active = selectedBodyIds.includes(b.id);
                          return (
                            <button
                              key={b.id}
                              type="button"
                              onClick={() => toggleBody(b.id)}
                              className={`relative rounded-md overflow-hidden border-2 transition ${active ? "border-primary ring-2 ring-primary/40" : "border-border hover:border-primary/50"}`}
                            >
                              {url ? (
                                <img src={url} alt={b.type} className="w-full h-24 object-cover" />
                              ) : (
                                <div className="w-full h-24 bg-muted animate-pulse" />
                              )}
                              <div className="absolute bottom-0 inset-x-0 bg-black/60 text-white text-[9px] px-1 py-0.5 flex justify-between">
                                <span className="uppercase">{b.type}</span>
                                <span>{new Date(b.uploaded_at).toLocaleDateString("pt-BR")}</span>
                              </div>
                            </button>
                          );
                        })}
                      </div>
                      {selectedBodyIds.length > 0 && (
                        <Button size="sm" variant="ghost" className="h-6 text-[10px]" onClick={() => setSelectedBodyIds([])}>
                          Limpar seleção
                        </Button>
                      )}
                    </>
                  )}
                </div>

                {/* Upload de imagens adicionais para análise visual */}
                <div className="space-y-2 rounded-md border border-border p-3">
                  <div className="flex items-center justify-between gap-2">
                    <Label className="text-xs flex items-center gap-1.5">
                      <ImagePlus className="w-3.5 h-3.5" /> Imagens adicionais para análise visual (JPG/PNG)
                    </Label>
                    <Button size="sm" variant="outline" className="h-7 gap-1.5" disabled={uploading} onClick={() => imageInputRef.current?.click()}>
                      <Upload className="w-3.5 h-3.5" /> Anexar
                    </Button>
                    <input
                      ref={imageInputRef}
                      type="file"
                      accept="image/jpeg,image/png,image/webp"
                      multiple
                      className="hidden"
                      onChange={(e) => uploadRefImages(e.target.files)}
                    />
                  </div>
                  {extraImagePaths.length === 0 ? (
                    <p className="text-[10px] text-muted-foreground">Envie fotos avulsas (referência, pose, close muscular) que não estão no dossiê oficial.</p>
                  ) : (
                    <ul className="space-y-1">
                      {extraImagePaths.map((f, i) => (
                        <li key={f.path} className="flex items-center justify-between gap-2 text-xs bg-muted/50 rounded px-2 py-1">
                          <span className="truncate flex items-center gap-1.5"><ImagePlus className="w-3 h-3" />{f.name}</span>
                          <button onClick={() => setExtraImagePaths((p) => p.filter((_, idx) => idx !== i))} className="opacity-60 hover:opacity-100"><X className="w-3 h-3" /></button>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>

                <Button onClick={() => generate.mutate()} disabled={generate.isPending} className="gap-2">
                  {generate.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
                  Gerar parecer STHIA
                </Button>
              </CardContent>
            </Card>
          )}

          {current && (
            <div className="space-y-4">
              <Card>
                <CardHeader className="pb-2">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <CardTitle className="text-base">{current.title}</CardTitle>
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="text-[10px] uppercase">{current.scope}</Badge>
                      <Badge
                        variant="outline"
                        className={`text-[10px] ${current.released_to_student ? "border-emerald-500/40 text-emerald-500" : "border-muted-foreground/30 text-muted-foreground"}`}
                      >
                        {current.released_to_student ? "Liberado" : "Não liberado"}
                      </Badge>
                      <Button
                        size="sm"
                        variant="outline"
                        className="h-7 gap-1.5"
                        onClick={() => toggleRelease.mutate(current)}
                        disabled={toggleRelease.isPending}
                      >
                        {current.released_to_student ? <><EyeOff className="w-3.5 h-3.5" /> Ocultar do aluno</> : <><Eye className="w-3.5 h-3.5" /> Liberar para o aluno</>}
                      </Button>
                      <span className="text-xs text-muted-foreground">{new Date(current.created_at).toLocaleString("pt-BR")}</span>
                    </div>
                  </div>
                  {current.summary && <p className="text-sm text-muted-foreground mt-1">{current.summary}</p>}
                </CardHeader>
              </Card>

              {(current.red_flags?.length ?? 0) > 0 && (
                <Card className="border-destructive/40 bg-destructive/5">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm flex items-center gap-2 text-destructive">
                      <AlertTriangle className="w-4 h-4" /> Red flags
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ul className="list-disc list-inside space-y-1 text-sm">
                      {current.red_flags.map((r, i) => <li key={i}>{r}</li>)}
                    </ul>
                  </CardContent>
                </Card>
              )}

              {(current.recommendations?.length ?? 0) > 0 && (
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm flex items-center gap-2">
                      <ClipboardList className="w-4 h-4" /> Recomendações priorizadas
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ol className="list-decimal list-inside space-y-1 text-sm">
                      {current.recommendations.map((r, i) => <li key={i}>{r}</li>)}
                    </ol>
                  </CardContent>
                </Card>
              )}

              <div className="space-y-2 no-print">
                <div className="flex flex-wrap items-center gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    className="h-7 gap-1.5"
                    onClick={() => window.open(`/leitura-laboratorial/${current.id}`, "_blank", "noopener")}
                  >
                    🌐 Abrir no navegador (imprimir)
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    className="h-7 gap-1.5"
                    onClick={() => {
                      const url = `${window.location.origin}/leitura-laboratorial/${current.id}`;
                      navigator.clipboard.writeText(url);
                      toast.success("Link da leitura visual copiado");
                    }}
                  >
                    🔗 Copiar link para o aluno
                  </Button>
                </div>

                <div className="rounded-xl border border-border bg-card/50 p-3 flex flex-wrap items-center gap-2">
                  <span className="text-[11px] uppercase tracking-[0.2em] text-muted-foreground mr-1">
                    Liberação do link
                  </span>
                  <Select value={shareDays} onValueChange={setShareDays}>
                    <SelectTrigger className="h-8 w-[190px]">
                      <SelectValue placeholder="Período" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="1">Visível por 24 horas</SelectItem>
                      <SelectItem value="3">Visível por 3 dias</SelectItem>
                      <SelectItem value="7">Visível por 7 dias</SelectItem>
                      <SelectItem value="15">Visível por 15 dias</SelectItem>
                      <SelectItem value="30">Visível por 30 dias</SelectItem>
                      <SelectItem value="0">Sem prazo (até revogar)</SelectItem>
                    </SelectContent>
                  </Select>
                  <Button
                    size="sm"
                    className="h-8 gap-1.5"
                    disabled={setVisualShare.isPending}
                    onClick={() => setVisualShare.mutate({ a: current, enabled: true, days: shareDays })}
                  >
                    <Eye className="w-3.5 h-3.5" /> Liberar leitura visual
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    className="h-8 gap-1.5"
                    disabled={setVisualShare.isPending}
                    onClick={() => setVisualShare.mutate({ a: current, enabled: false, days: "0" })}
                  >
                    <EyeOff className="w-3.5 h-3.5" /> Bloquear
                  </Button>
                  <span className="text-[11px] text-muted-foreground">
                    {(current as any).visual_share_enabled
                      ? (current as any).visual_share_expires_at
                        ? `Liberada até ${new Date((current as any).visual_share_expires_at).toLocaleString("pt-BR")}`
                        : "Liberada sem prazo"
                      : current.released_to_student
                        ? "Acessível pelo parecer liberado ao aluno"
                        : "Bloqueada — o aluno não consegue abrir o link"}
                  </span>
                </div>

                <LabInterpretationPanel html={current.report_html} />

                {/* Painel de Visibilidade STHIA */}
                <Card className="border-primary/20 bg-primary/[0.02]">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-xs flex items-center gap-2">
                      <Eye className="w-3.5 h-3.5" /> Visibilidade dos Tópicos (Aluno)
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                      {[
                        { id: "lab_interpretation", label: "Interpretação Laboratorial" },
                        { id: "general_summary", label: "Parecer Geral Resumido" },
                        { id: "visual_composition", label: "Composição Visual" },
                        { id: "body_composition", label: "Composição Corporal" },
                        { id: "red_flags", label: "Red Flag" },
                        { id: "prioritized_recommendations", label: "Recomendações Priorizadas" },
                      ].map((topic) => {
                        const settings = current.visibility_settings || {
                          lab_interpretation: true,
                          general_summary: true,
                          visual_composition: true,
                          body_composition: true,
                          red_flags: true,
                          prioritized_recommendations: true
                        };
                        const isChecked = (settings as any)[topic.id] !== false;
                        
                        return (
                          <div key={topic.id} className="flex items-center gap-2">
                            <Switch
                              id={`vis-${topic.id}`}
                              checked={isChecked}
                              onCheckedChange={(checked) => {
                                updateVisibility.mutate({
                                  id: current.id,
                                  settings: { ...settings, [topic.id]: checked }
                                });
                              }}
                              disabled={updateVisibility.isPending}
                            />
                            <Label htmlFor={`vis-${topic.id}`} className="text-[11px] cursor-pointer">
                              {topic.label}
                            </Label>
                          </div>
                        );
                      })}
                    </div>
                  </CardContent>
                </Card>
              </div>

              <Card>
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between gap-2">
                    <CardTitle className="text-sm">Parecer completo</CardTitle>
                    <div className="flex items-center gap-2 no-print">
                      <Button size="sm" variant="outline" className="gap-1.5" onClick={() => window.print()}>
                        🖨️ Imprimir
                      </Button>
                      <Button size="sm" variant="outline" className="gap-1.5" onClick={() => setExportOpen(true)}>
                        <Save className="w-3.5 h-3.5" /> Salvar / Exportar
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="overflow-x-auto clinical-report-print">
                  <div className="mb-4 pb-3 border-b border-border no-print-hide">
                    <p className="text-xs uppercase tracking-wider text-muted-foreground">STHIA · Parecer Clínico</p>
                    <h1 className="text-lg font-semibold mt-1">{current.title}</h1>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {selectedStudent?.full_name ? `Paciente: ${selectedStudent.full_name} · ` : ""}
                      Emitido em {new Date(current.created_at).toLocaleString("pt-BR")}
                    </p>
                  </div>
                  <ClinicalReport html={current.report_html} />
                </CardContent>
              </Card>

              <Card className="no-print border-primary/30">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-primary" /> Revalidar / Reanalisar parecer
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <p className="text-xs text-muted-foreground">
                    A STHIA relê o parecer acima e gera uma nova versão, mantendo o que está correto, corrigindo o que estiver equivocado e destacando "O que mudou nesta revalidação".
                  </p>
                  <div className="space-y-1.5">
                    <Label className="text-xs">Critérios, sugestões ou pedidos livres</Label>
                    <Textarea
                      rows={5}
                      placeholder={"Ex.: revise a interpretação de TSH e ferritina; considere que o aluno está em cutting agressivo; sugira ajustes de dose fracionada; seja mais objetivo nas recomendações..."}
                      value={revalCriteria}
                      onChange={(e) => setRevalCriteria(e.target.value)}
                      className="text-sm"
                    />
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    <Button onClick={() => revalidate.mutate()} disabled={revalidate.isPending} className="gap-2">
                      {revalidate.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
                      Gerar nova análise em cima desta
                    </Button>
                    <span className="text-[11px] text-muted-foreground">
                      O parecer atual permanece salvo no histórico.
                    </span>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {current && (
            <ClinicalExportDialog
              open={exportOpen}
              onOpenChange={setExportOpen}
              reportHtml={current.report_html}
              title={current.title}
              studentName={selectedStudent?.full_name || ""}
              analysisId={current.id}
              createdAt={current.created_at}
              onSaved={() => refetchHistory()}
            />
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}