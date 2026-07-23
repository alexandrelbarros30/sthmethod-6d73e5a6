import { useMemo, useRef, useState } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2, Sparkles, Stethoscope, AlertTriangle, ClipboardList, History, Trash2, Upload, FileText, ImagePlus, X, Camera, Save } from "lucide-react";
import ClinicalExportDialog from "@/components/admin/ClinicalExportDialog";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { normalizeSearch } from "@/lib/utils";
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
};

export default function AdminStudentAnalysis() {
  const qc = useQueryClient();
  const [search, setSearch] = useState("");
  const [studentId, setStudentId] = useState<string | null>(null);
  const [focus, setFocus] = useState("full");
  const [examText, setExamText] = useState("");
  const [consultantNotes, setConsultantNotes] = useState("");
  const [current, setCurrent] = useState<Analysis | null>(null);
  const [selectedBodyIds, setSelectedBodyIds] = useState<string[]>([]);
  const [extraImagePaths, setExtraImagePaths] = useState<{ path: string; name: string }[]>([]);
  const [extraExamPaths, setExtraExamPaths] = useState<{ path: string; name: string }[]>([]);
  const [uploading, setUploading] = useState(false);
  const [exportOpen, setExportOpen] = useState(false);
  const examInputRef = useRef<HTMLInputElement | null>(null);
  const imageInputRef = useRef<HTMLInputElement | null>(null);

  const { data: students = [] } = useQuery({
    queryKey: ["students-min"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("profiles")
        .select("user_id, full_name, email")
        .order("full_name", { ascending: true })
        .limit(1000);
      if (error) throw error;
      return (data ?? []) as Student[];
    },
  });

  const filtered = useMemo(() => {
    const q = normalizeSearch(search);
    if (!q) return students.slice(0, 40);
    return students
      .filter((s) => normalizeSearch(`${s.full_name ?? ""} ${s.email ?? ""}`).includes(q))
      .slice(0, 40);
  }, [students, search]);

  const { data: history = [], refetch: refetchHistory } = useQuery({
    queryKey: ["clinical-analyses", studentId],
    enabled: !!studentId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("student_clinical_analyses")
        .select("id, user_id, title, scope, summary, report_html, red_flags, recommendations, markers, visual_composition, created_at")
        .eq("user_id", studentId!)
        .order("created_at", { ascending: false })
        .limit(30);
      if (error) throw error;
      return (data ?? []) as Analysis[];
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
      const { data, error } = await supabase.functions.invoke("sthia-clinical-analysis", {
        body: {
          studentId,
          examText,
          consultantNotes,
          focus,
          save: true,
          bodyImageIds: selectedBodyIds.length ? selectedBodyIds : null,
          extraImagePaths: extraImagePaths.map((f) => f.path),
          extraExamPaths: extraExamPaths.map((f) => f.path),
        },
      });
      if (error) throw error;
      if ((data as any)?.error) throw new Error((data as any).error);
      return data as Analysis;
    },
    onSuccess: (data) => {
      toast.success("Parecer STHIA gerado");
      setCurrent(data);
      setExamText("");
      setConsultantNotes("");
      setExtraExamPaths([]);
      setExtraImagePaths([]);
      setSelectedBodyIds([]);
      qc.invalidateQueries({ queryKey: ["clinical-analyses", studentId] });
    },
    onError: (e: any) => toast.error(e?.message || "Falha ao gerar parecer"),
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

  const selectedStudent = students.find((s) => s.user_id === studentId);

  return (
    <DashboardLayout
      role="admin"
      title="Central de Análise · STHIA"
      subtitle="Leitura e interpretação de exames, composição visual, parecer clínico e recomendações personalizadas."
    >
      <div className="grid gap-4 lg:grid-cols-[320px_1fr]">
        {/* Seleção de aluno + histórico */}
        <div className="space-y-3">
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
              <CardContent className="space-y-1 max-h-[320px] overflow-y-auto">
                {history.length === 0 && <p className="text-xs text-muted-foreground">Nenhuma análise anterior</p>}
                {history.map((h) => (
                  <div key={h.id} className={`flex items-center gap-1 rounded-md text-xs ${current?.id === h.id ? "bg-primary/10" : "hover:bg-muted"}`}>
                    <button className="flex-1 text-left px-2 py-1.5" onClick={() => setCurrent(h)}>
                      <div className="font-medium truncate">{h.title}</div>
                      <div className="opacity-70">{new Date(h.created_at).toLocaleString("pt-BR")}</div>
                    </button>
                    <Button size="icon" variant="ghost" className="w-7 h-7" onClick={() => removeAnalysis.mutate(h.id)} aria-label="Excluir">
                      <Trash2 className="w-3.5 h-3.5" />
                    </Button>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}
        </div>

        {/* Área principal */}
        <div className="space-y-4">
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
                <div className="grid md:grid-cols-[220px_1fr] gap-3">
                  <div className="space-y-1">
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
                    <Input
                      placeholder="Ex: aluno relatou queda de libido, dor lombar leve, sono ruim…"
                      value={consultantNotes}
                      onChange={(e) => setConsultantNotes(e.target.value)}
                    />
                  </div>
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

              <Card>
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between gap-2">
                    <CardTitle className="text-sm">Parecer completo</CardTitle>
                    <Button size="sm" variant="outline" className="gap-1.5" onClick={() => setExportOpen(true)}>
                      <Save className="w-3.5 h-3.5" /> Salvar / Exportar
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  <div
                    className="prose prose-sm dark:prose-invert max-w-none [&_table]:w-full [&_table]:text-xs [&_th]:border [&_th]:border-border [&_th]:p-1.5 [&_th]:bg-muted [&_td]:border [&_td]:border-border [&_td]:p-1.5"
                    dangerouslySetInnerHTML={{ __html: current.report_html }}
                  />
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