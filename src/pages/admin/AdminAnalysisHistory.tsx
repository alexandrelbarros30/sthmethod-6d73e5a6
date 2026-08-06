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

export default function AdminAnalysisHistory() {
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
    if (!q) return students.slice(0, 50);
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
        .order("created_at", { ascending: false })
        .limit(50);
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
      title="Histórico de Análise Clínica · STHIA"
      subtitle="Visualize e gerencie o histórico completo de pareceres clínicos e interpretações de exames de todos os alunos."
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

        {/* Área principal - Histórico Detalhado */}
        <div className="space-y-4 min-w-0">
          {!studentId && (
            <Card>
              <CardContent className="py-24 text-center">
                <History className="w-12 h-12 text-muted-foreground/20 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-foreground">Histórico de Análises</h3>
                <p className="text-sm text-muted-foreground max-w-xs mx-auto mt-2">
                  Selecione um aluno na barra lateral para visualizar todo o histórico de análises clínicas geradas pela STHIA.
                </p>
              </CardContent>
            </Card>
          )}

          {studentId && current && (
            <div className="space-y-4 animate-in fade-in slide-in-from-bottom-2 duration-300">
              <div className="flex items-center justify-between gap-4 flex-wrap">
                <div>
                  <h2 className="text-xl font-bold tracking-tight">{current.title}</h2>
                  <p className="text-sm text-muted-foreground">
                    Gerada em {new Date(current.created_at).toLocaleDateString("pt-BR")} às {new Date(current.created_at).toLocaleTimeString("pt-BR", { hour: '2-digit', minute: '2-digit' })}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                   <Button
                    variant="outline"
                    size="sm"
                    className="gap-2"
                    onClick={() => toggleRelease.mutate(current)}
                    disabled={toggleRelease.isPending}
                  >
                    {current.released_to_student ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    {current.released_to_student ? "Ocultar do Aluno" : "Liberar para Aluno"}
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="gap-2 border-primary/30 text-primary hover:bg-primary/5"
                    onClick={() => setExportOpen(true)}
                  >
                    <Upload className="w-4 h-4" />
                    Exportar / Imprimir
                  </Button>
                </div>
              </div>

              <div className="grid gap-4">
                <ClinicalReport analysis={current} />
                
                {current.markers && current.markers.length > 0 && (
                  <LabInterpretationPanel markers={current.markers} />
                )}
              </div>
            </div>
          )}

          {studentId && !current && history.length > 0 && (
            <Card>
              <CardContent className="py-24 text-center">
                <ClipboardList className="w-12 h-12 text-muted-foreground/20 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-foreground">Análise Selecionada</h3>
                <p className="text-sm text-muted-foreground max-w-xs mx-auto mt-2">
                  Clique em uma das análises no histórico lateral para visualizar o conteúdo completo aqui.
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      <ClinicalExportDialog
        open={exportOpen}
        onOpenChange={setExportOpen}
        analysis={current}
        studentName={selectedStudent?.full_name || ""}
      />
    </DashboardLayout>
  );
}
