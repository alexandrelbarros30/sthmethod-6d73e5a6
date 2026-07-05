import { useEffect, useMemo, useState } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { toast } from "@/hooks/use-toast";
import { Copy, Plus, MessageCircle, RefreshCcw, CheckCircle2, XCircle, Clock, ImageIcon, Pencil, Eye, Search, Download, FileText, ShieldCheck } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";

type Consent = {
  id: string;
  token: string;
  user_id: string | null;
  payer_name: string;
  payer_email: string | null;
  payer_phone: string | null;
  authorized: boolean | null;
  allow_tagging: boolean | null;
  social_handle: string | null;
  signature_name: string | null;
  responded_at: string | null;
  notes: string | null;
  created_at: string;
};
type Student = { user_id: string; full_name: string | null; email: string | null; phone: string | null };

type AcceptanceRow = {
  id: string;
  user_id: string | null;
  email: string | null;
  document_type: "terms" | "privacy" | "program_nature" | "marketing" | "image_use";
  document_version: string;
  accepted: boolean;
  option_value: string | null;
  accepted_at: string;
  context: string | null;
};

type StudentReport = {
  student: Student;
  terms?: AcceptanceRow;
  privacy?: AcceptanceRow;
  program_nature?: AcceptanceRow;
  marketing?: AcceptanceRow;
  image_use?: AcceptanceRow;
  consent?: Consent;
};

const IMAGE_LABEL: Record<string, string> = {
  nao_autorizo: "Não autoriza",
  sem_identificacao: "Sem identificação",
  com_identificacao: "Com identificação",
};

const onlyDigits = (s: string) => s.replace(/\D/g, "");

export default function AdminImageConsents() {
  const { role } = useAuth();
  const layoutRole = (role === "consultor" ? "consultor" : "admin") as "admin" | "consultor";

  const [items, setItems] = useState<Consent[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [acceptances, setAcceptances] = useState<AcceptanceRow[]>([]);
  const [loading, setLoading] = useState(true);

  const [search, setSearch] = useState("");
  const [termsFilter, setTermsFilter] = useState<"all" | "yes" | "no">("all");
  const [imageFilter, setImageFilter] = useState<"all" | "com" | "sem" | "nao" | "pendente">("all");
  const [detail, setDetail] = useState<StudentReport | null>(null);

  const [showNew, setShowNew] = useState(false);
  const [mode, setMode] = useState<"student" | "avulso">("student");
  const [form, setForm] = useState({ user_id: "", payer_name: "", payer_email: "", payer_phone: "", notes: "" });

  const [editing, setEditing] = useState<Consent | null>(null);
  const [editForm, setEditForm] = useState({ authorized: "" as "" | "yes" | "no", allow_tagging: false, social_handle: "", notes: "" });

  async function load() {
    setLoading(true);
    const [c, s, a] = await Promise.all([
      supabase.from("image_consents").select("*").order("created_at", { ascending: false }),
      supabase.from("profiles").select("user_id, full_name, email, phone").order("full_name").limit(2000),
      supabase.from("legal_acceptances").select("*").order("accepted_at", { ascending: false }).limit(10000),
    ]);
    setItems((c.data as any) || []);
    setStudents((s.data as any) || []);
    setAcceptances((a.data as any) || []);
    setLoading(false);
  }
  useEffect(() => { load(); }, []);

  const studentById = useMemo(() => new Map(students.map((s) => [s.user_id, s])), [students]);

  // Última consent por user_id
  const latestConsentByUser = useMemo(() => {
    const m = new Map<string, Consent>();
    for (const c of items) {
      if (!c.user_id) continue;
      const prev = m.get(c.user_id);
      if (!prev || new Date(c.created_at) > new Date(prev.created_at)) m.set(c.user_id, c);
    }
    return m;
  }, [items]);

  // Relatório consolidado por aluno
  const report = useMemo<StudentReport[]>(() => {
    // Agrupar aceites: mais recente por (user_id, document_type)
    const byUser = new Map<string, Record<string, AcceptanceRow>>();
    for (const a of acceptances) {
      if (!a.user_id) continue;
      const rec = byUser.get(a.user_id) || {};
      const cur = rec[a.document_type];
      if (!cur || new Date(a.accepted_at) > new Date(cur.accepted_at)) rec[a.document_type] = a;
      byUser.set(a.user_id, rec);
    }
    return students.map((s) => {
      const rec = byUser.get(s.user_id) || {};
      return {
        student: s,
        terms: rec.terms,
        privacy: rec.privacy,
        program_nature: rec.program_nature,
        marketing: rec.marketing,
        image_use: rec.image_use,
        consent: latestConsentByUser.get(s.user_id),
      };
    });
  }, [students, acceptances, latestConsentByUser]);

  const filteredReport = useMemo(() => {
    const q = search.trim().toLowerCase();
    return report.filter((r) => {
      if (q) {
        const hay = `${r.student.full_name || ""} ${r.student.email || ""} ${r.student.phone || ""}`.toLowerCase();
        if (!hay.includes(q)) return false;
      }
      if (termsFilter === "yes" && !(r.terms?.accepted)) return false;
      if (termsFilter === "no" && r.terms?.accepted) return false;
      if (imageFilter !== "all") {
        const opt = r.image_use?.option_value || r.consent?.authorized === true
          ? (r.consent?.authorized ? (r.consent?.allow_tagging ? "com_identificacao" : "sem_identificacao") : "nao_autorizo")
          : r.image_use?.option_value;
        const effective = r.image_use?.option_value ?? (r.consent
          ? (r.consent.authorized === true ? (r.consent.allow_tagging ? "com_identificacao" : "sem_identificacao") : r.consent.authorized === false ? "nao_autorizo" : null)
          : null);
        if (imageFilter === "com" && effective !== "com_identificacao") return false;
        if (imageFilter === "sem" && effective !== "sem_identificacao") return false;
        if (imageFilter === "nao" && effective !== "nao_autorizo") return false;
        if (imageFilter === "pendente" && effective) return false;
      }
      return true;
    });
  }, [report, search, termsFilter, imageFilter]);

  const summary = useMemo(() => {
    const total = report.length;
    const termsOk = report.filter((r) => r.terms?.accepted).length;
    const privacyOk = report.filter((r) => r.privacy?.accepted).length;
    const natureOk = report.filter((r) => r.program_nature?.accepted).length;
    const marketingOk = report.filter((r) => r.marketing?.accepted).length;
    const imgAuth = report.filter((r) => {
      const opt = r.image_use?.option_value ?? (r.consent?.authorized === true ? "sem_identificacao" : null);
      return opt === "com_identificacao" || opt === "sem_identificacao";
    }).length;
    return { total, termsOk, privacyOk, natureOk, marketingOk, imgAuth };
  }, [report]);

  function exportCsv() {
    const rows = [
      ["Nome", "Email", "Telefone", "Termo", "Versão termo", "Data termo", "Privacidade", "Versão priv.", "Ciência programa", "Marketing", "Uso de imagem", "Assinatura link", "Data resposta imagem"],
    ];
    for (const r of filteredReport) {
      const opt = r.image_use?.option_value ?? (r.consent?.authorized === true ? (r.consent?.allow_tagging ? "com_identificacao" : "sem_identificacao") : r.consent?.authorized === false ? "nao_autorizo" : "");
      rows.push([
        r.student.full_name || "",
        r.student.email || "",
        r.student.phone || "",
        r.terms?.accepted ? "Sim" : "Não",
        r.terms?.document_version || "",
        r.terms?.accepted_at ? new Date(r.terms.accepted_at).toLocaleString("pt-BR") : "",
        r.privacy?.accepted ? "Sim" : "Não",
        r.privacy?.document_version || "",
        r.program_nature?.accepted ? "Sim" : "Não",
        r.marketing?.accepted ? "Sim" : "Não",
        opt ? IMAGE_LABEL[opt] || opt : "Pendente",
        r.consent?.signature_name || "",
        r.consent?.responded_at ? new Date(r.consent.responded_at).toLocaleString("pt-BR") : "",
      ]);
    }
    const csv = rows.map((r) => r.map((v) => `"${String(v).replace(/"/g, '""')}"`).join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = `contratos-alunos-${new Date().toISOString().slice(0,10)}.csv`; a.click();
    URL.revokeObjectURL(url);
  }

  function yn(v: boolean | undefined) {
    if (v === true) return <Badge className="bg-emerald-500/15 text-emerald-600 border-emerald-500/30">Sim</Badge>;
    if (v === false) return <Badge variant="destructive">Não</Badge>;
    return <Badge variant="secondary">—</Badge>;
  }

  function imageBadge(r: StudentReport) {
    const opt = r.image_use?.option_value ?? (r.consent?.authorized === true ? (r.consent?.allow_tagging ? "com_identificacao" : "sem_identificacao") : r.consent?.authorized === false ? "nao_autorizo" : null);
    if (!opt) return <Badge variant="secondary"><Clock className="w-3 h-3 mr-1" />Pendente</Badge>;
    if (opt === "nao_autorizo") return <Badge variant="destructive"><XCircle className="w-3 h-3 mr-1" />Não autoriza</Badge>;
    if (opt === "sem_identificacao") return <Badge className="bg-amber-500/15 text-amber-700 border-amber-500/30"><CheckCircle2 className="w-3 h-3 mr-1" />Sem ID</Badge>;
    return <Badge className="bg-emerald-500/15 text-emerald-600 border-emerald-500/30"><CheckCircle2 className="w-3 h-3 mr-1" />Com ID</Badge>;
  }

  async function handleCreate() {
    if (mode === "student" && !form.user_id) { toast({ title: "Selecione o aluno" }); return; }
    if (mode === "avulso" && !form.payer_name.trim()) { toast({ title: "Informe o nome" }); return; }
    const student = mode === "student" ? studentById.get(form.user_id) : null;
    const { data, error } = await supabase.from("image_consents").insert({
      user_id: mode === "student" ? form.user_id : null,
      payer_name: mode === "student" ? (student?.full_name || "") : form.payer_name.trim(),
      payer_email: mode === "student" ? (student?.email || null) : (form.payer_email.trim() || null),
      payer_phone: mode === "student" ? (student?.phone || null) : (form.payer_phone.trim() || null),
      notes: form.notes.trim() || null,
    }).select().single();
    if (error) { toast({ title: "Erro", description: error.message }); return; }
    toast({ title: "Link gerado" });
    setShowNew(false);
    setForm({ user_id: "", payer_name: "", payer_email: "", payer_phone: "", notes: "" });
    setMode("student");
    load();
    // copia link
    if (data?.token) {
      const url = `${window.location.origin}/autorizacao-imagem/${data.token}`;
      try { await navigator.clipboard.writeText(url); } catch {}
    }
  }

  function getUrl(token: string) {
    return `${window.location.origin}/autorizacao-imagem/${token}`;
  }

  function copyUrl(token: string) {
    const url = getUrl(token);
    navigator.clipboard.writeText(url);
    toast({ title: "Link copiado", description: url });
  }

  function previewUrl(token: string) {
    window.open(getUrl(token), "_blank", "noopener,noreferrer");
  }

  function sendWhatsapp(c: Consent) {
    const phone = onlyDigits(c.payer_phone || "");
    if (!phone) { toast({ title: "Sem telefone cadastrado" }); return; }
    const fullPhone = phone.startsWith("55") ? phone : `55${phone}`;
    const firstName = (c.payer_name || "").split(" ")[0];
    const url = getUrl(c.token);
    const msg =
      `Olá${firstName ? " " + firstName : ""}! Aqui é a STH METHOD.\n\n` +
      `Estamos solicitando sua autorização para uso de imagens (fotos de evolução) em nossas redes sociais e materiais institucionais.\n\n` +
      `Por padrão, as imagens são publicadas SEM identificação pessoal e SEM marcação do seu perfil. Você pode autorizar (ou não) e, se quiser, permitir a marcação.\n\n` +
      `Acesse e responda em 1 minuto:\n${url}\n\n` +
      `Conte comigo. Bora pra cima 🚀`;
    window.open(`https://wa.me/${fullPhone}?text=${encodeURIComponent(msg)}`, "_blank");
  }

  function openEdit(c: Consent) {
    setEditing(c);
    setEditForm({
      authorized: c.authorized === null ? "" : c.authorized ? "yes" : "no",
      allow_tagging: !!c.allow_tagging,
      social_handle: c.social_handle || "",
      notes: c.notes || "",
    });
  }

  async function saveEdit() {
    if (!editing) return;
    const { error } = await supabase.from("image_consents").update({
      authorized: editForm.authorized === "" ? null : editForm.authorized === "yes",
      allow_tagging: editForm.authorized === "yes" ? editForm.allow_tagging : false,
      social_handle: editForm.authorized === "yes" && editForm.allow_tagging ? (editForm.social_handle.trim() || null) : null,
      notes: editForm.notes.trim() || null,
      responded_at: editForm.authorized === "" ? null : new Date().toISOString(),
    }).eq("id", editing.id);
    if (error) { toast({ title: "Erro", description: error.message }); return; }
    toast({ title: "Autorização atualizada" });
    setEditing(null);
    load();
  }

  function statusBadge(c: Consent) {
    if (c.authorized === true) return <Badge className="bg-emerald-500/15 text-emerald-600 border-emerald-500/30"><CheckCircle2 className="w-3 h-3 mr-1" />Autorizado</Badge>;
    if (c.authorized === false) return <Badge variant="destructive"><XCircle className="w-3 h-3 mr-1" />Não autoriza</Badge>;
    return <Badge variant="secondary"><Clock className="w-3 h-3 mr-1" />Pendente</Badge>;
  }

  return (
    <DashboardLayout role={layoutRole} title="Contratos & Autorizações" subtitle="Relatório de leitura de contrato, ciência do programa e autorização de imagem por aluno">
      <div className="flex items-center justify-between mb-4 gap-2 flex-wrap">
        <p className="text-sm text-muted-foreground">
          {loading ? "Carregando..." : `${summary.total} alunos · ${summary.termsOk} aceitaram termo · ${summary.imgAuth} autorizam imagem`}
        </p>
        <div className="flex gap-2">
          <Button variant="ghost" size="sm" onClick={load}><RefreshCcw className="w-4 h-4 mr-1" />Atualizar</Button>
          <Button variant="outline" size="sm" onClick={exportCsv}><Download className="w-4 h-4 mr-1" />Exportar CSV</Button>
          <Button size="sm" onClick={() => setShowNew(true)}><Plus className="w-4 h-4 mr-1" />Nova autorização</Button>
        </div>
      </div>

      <Tabs defaultValue="relatorio" className="mb-4">
        <TabsList>
          <TabsTrigger value="relatorio"><FileText className="w-4 h-4 mr-1" />Relatório de alunos</TabsTrigger>
          <TabsTrigger value="solicitacoes"><ImageIcon className="w-4 h-4 mr-1" />Solicitações de imagem</TabsTrigger>
        </TabsList>

        <TabsContent value="relatorio" className="mt-4">
          <Card className="p-4 mb-3">
            <div className="grid md:grid-cols-3 gap-3">
              <div className="relative">
                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Buscar por nome, email ou telefone" className="pl-9" />
              </div>
              <Select value={termsFilter} onValueChange={(v) => setTermsFilter(v as any)}>
                <SelectTrigger><SelectValue placeholder="Contrato" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Contrato: todos</SelectItem>
                  <SelectItem value="yes">Aceitaram o contrato</SelectItem>
                  <SelectItem value="no">Não aceitaram / sem registro</SelectItem>
                </SelectContent>
              </Select>
              <Select value={imageFilter} onValueChange={(v) => setImageFilter(v as any)}>
                <SelectTrigger><SelectValue placeholder="Uso de imagem" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Imagem: todos</SelectItem>
                  <SelectItem value="com">Autoriza com identificação</SelectItem>
                  <SelectItem value="sem">Autoriza sem identificação</SelectItem>
                  <SelectItem value="nao">Não autoriza</SelectItem>
                  <SelectItem value="pendente">Pendente</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </Card>

          <Card className="p-0 overflow-hidden">
            <div className="overflow-auto max-h-[70vh]">
              <Table>
                <TableHeader className="sticky top-0 bg-card z-10">
                  <TableRow>
                    <TableHead>Aluno</TableHead>
                    <TableHead className="text-center">Termo</TableHead>
                    <TableHead className="text-center">Privacidade</TableHead>
                    <TableHead className="text-center">Ciência<br/>programa</TableHead>
                    <TableHead className="text-center">Marketing</TableHead>
                    <TableHead className="text-center">Uso de imagem</TableHead>
                    <TableHead>Última resposta</TableHead>
                    <TableHead />
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredReport.map((r) => {
                    const lastDate = [r.terms?.accepted_at, r.privacy?.accepted_at, r.image_use?.accepted_at, r.consent?.responded_at]
                      .filter(Boolean).sort().pop();
                    return (
                      <TableRow key={r.student.user_id} className="cursor-pointer" onClick={() => setDetail(r)}>
                        <TableCell>
                          <div className="font-medium text-sm">{r.student.full_name || "—"}</div>
                          <div className="text-[11px] text-muted-foreground">{r.student.email}</div>
                        </TableCell>
                        <TableCell className="text-center">
                          {yn(r.terms?.accepted)}
                          {r.terms?.document_version && <div className="text-[10px] text-muted-foreground mt-1">{r.terms.document_version}</div>}
                        </TableCell>
                        <TableCell className="text-center">{yn(r.privacy?.accepted)}</TableCell>
                        <TableCell className="text-center">{yn(r.program_nature?.accepted)}</TableCell>
                        <TableCell className="text-center">{yn(r.marketing?.accepted)}</TableCell>
                        <TableCell className="text-center">{imageBadge(r)}</TableCell>
                        <TableCell className="text-[11px] text-muted-foreground">
                          {lastDate ? new Date(lastDate).toLocaleString("pt-BR") : "—"}
                        </TableCell>
                        <TableCell className="text-right">
                          <Button size="sm" variant="ghost" onClick={(e) => { e.stopPropagation(); setDetail(r); }}>
                            <Eye className="w-3.5 h-3.5" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                  {filteredReport.length === 0 && !loading && (
                    <TableRow><TableCell colSpan={8} className="text-center py-10 text-sm text-muted-foreground">Nenhum aluno para os filtros aplicados.</TableCell></TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          </Card>
        </TabsContent>

        <TabsContent value="solicitacoes" className="mt-4">

      <Card className="p-0 overflow-hidden">
        <div className="px-4 py-3 border-b bg-muted/30 text-xs font-medium text-muted-foreground uppercase tracking-wider flex items-center gap-2">
          <ImageIcon className="w-3.5 h-3.5" /> Solicitações
        </div>
        <div className="divide-y">
          {items.map((c) => {
            const student = c.user_id ? studentById.get(c.user_id) : null;
            return (
              <div key={c.id} className="px-4 py-3 flex flex-wrap items-center gap-3">
                <div className="flex-1 min-w-[220px]">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="text-sm font-medium">{student?.full_name || c.payer_name || "—"}</p>
                    {statusBadge(c)}
                    {c.authorized && c.allow_tagging && <Badge variant="outline" className="text-[10px]">marca @{(c.social_handle || "").replace(/^@/, "") || "perfil"}</Badge>}
                    {!c.user_id && <Badge variant="outline" className="text-[10px]">avulso</Badge>}
                  </div>
                  <p className="text-[11px] text-muted-foreground">{[c.payer_email || student?.email, c.payer_phone || student?.phone].filter(Boolean).join(" · ") || "sem contato"}</p>
                  <p className="text-[10px] text-muted-foreground font-mono">/autorizacao-imagem/{c.token.slice(0, 10)}…</p>
                  <p className="text-[10px] text-muted-foreground">
                    Criado em {new Date(c.created_at).toLocaleString("pt-BR")}
                    {c.responded_at && ` · Respondido em ${new Date(c.responded_at).toLocaleString("pt-BR")}`}
                  </p>
                  {c.signature_name && <p className="text-[10px] text-muted-foreground">Assinatura: {c.signature_name}</p>}
                </div>
                <div className="flex gap-1 flex-wrap">
                  <Button size="sm" variant="ghost" onClick={() => copyUrl(c.token)} title="Copiar link"><Copy className="w-3.5 h-3.5" /></Button>
                  <Button size="sm" variant="ghost" onClick={() => previewUrl(c.token)} title="Pré-visualizar link"><Eye className="w-3.5 h-3.5" /></Button>
                  <Button size="sm" variant="outline" onClick={() => sendWhatsapp(c)} disabled={!(c.payer_phone || student?.phone)}>
                    <MessageCircle className="w-3.5 h-3.5 mr-1" />WhatsApp
                  </Button>
                  <Button size="sm" variant="ghost" onClick={() => openEdit(c)}><Pencil className="w-3.5 h-3.5" /></Button>
                </div>
              </div>
            );
          })}
          {items.length === 0 && !loading && <div className="px-4 py-8 text-center text-sm text-muted-foreground">Nenhuma solicitação ainda. Clique em “Nova autorização”.</div>}
        </div>
      </Card>
        </TabsContent>
      </Tabs>

      {/* Detalhe do aluno */}
      <Dialog open={!!detail} onOpenChange={(v) => !v && setDetail(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-primary" />
              {detail?.student.full_name || detail?.student.email}
            </DialogTitle>
          </DialogHeader>
          {detail && (
            <div className="space-y-4 text-sm">
              <div className="text-xs text-muted-foreground">
                {detail.student.email} · {detail.student.phone || "sem telefone"}
              </div>
              {[
                { key: "terms" as const, label: "Termo de Adesão" },
                { key: "privacy" as const, label: "Política de Privacidade (LGPD)" },
                { key: "program_nature" as const, label: "Ciência: Programa por prazo determinado" },
                { key: "marketing" as const, label: "Comunicações comerciais (opcional)" },
                { key: "image_use" as const, label: "Uso de imagem" },
              ].map(({ key, label }) => {
                const row = detail[key];
                return (
                  <div key={key} className="flex items-start justify-between gap-3 border-b border-border pb-2">
                    <div>
                      <p className="font-medium">{label}</p>
                      {row ? (
                        <p className="text-[11px] text-muted-foreground">
                          Versão {row.document_version} · {new Date(row.accepted_at).toLocaleString("pt-BR")}
                          {row.context && ` · ${row.context}`}
                          {row.option_value && ` · ${IMAGE_LABEL[row.option_value] || row.option_value}`}
                        </p>
                      ) : (
                        <p className="text-[11px] text-muted-foreground">Sem registro</p>
                      )}
                    </div>
                    <div>{row ? yn(row.accepted) : <Badge variant="secondary">—</Badge>}</div>
                  </div>
                );
              })}
              {detail.consent && (
                <div className="rounded-lg border p-3 bg-muted/20">
                  <p className="font-medium mb-1">Formulário de autorização de imagem</p>
                  <p className="text-[11px] text-muted-foreground">
                    {detail.consent.responded_at
                      ? `Respondido em ${new Date(detail.consent.responded_at).toLocaleString("pt-BR")}`
                      : "Pendente"}
                    {detail.consent.signature_name && ` · Assinatura: ${detail.consent.signature_name}`}
                    {detail.consent.allow_tagging && detail.consent.social_handle && ` · @${detail.consent.social_handle.replace(/^@/, "")}`}
                  </p>
                </div>
              )}
            </div>
          )}
          <DialogFooter>
            <Button variant="ghost" onClick={() => setDetail(null)}>Fechar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Nova */}
      <Dialog open={showNew} onOpenChange={setShowNew}>
        <DialogContent>
          <DialogHeader><DialogTitle>Nova autorização de imagem</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div className="flex gap-2">
              <Button variant={mode === "student" ? "default" : "outline"} size="sm" onClick={() => setMode("student")}>Aluno cadastrado</Button>
              <Button variant={mode === "avulso" ? "default" : "outline"} size="sm" onClick={() => setMode("avulso")}>Avulso (inativo / lead)</Button>
            </div>
            {mode === "student" ? (
              <div>
                <Label>Aluno</Label>
                <Select value={form.user_id} onValueChange={(v) => setForm({ ...form, user_id: v })}>
                  <SelectTrigger><SelectValue placeholder="Selecione o aluno" /></SelectTrigger>
                  <SelectContent className="max-h-72">
                    {students.map((s) => (
                      <SelectItem key={s.user_id} value={s.user_id}>
                        {s.full_name || s.email || s.user_id.slice(0, 8)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="text-[11px] text-muted-foreground mt-1">Nome, e-mail e telefone serão pré-preenchidos para o aluno.</p>
              </div>
            ) : (
              <div className="space-y-2">
                <div><Label>Nome completo</Label><Input value={form.payer_name} onChange={(e) => setForm({ ...form, payer_name: e.target.value })} /></div>
                <div className="grid grid-cols-2 gap-2">
                  <div><Label>E-mail</Label><Input type="email" value={form.payer_email} onChange={(e) => setForm({ ...form, payer_email: e.target.value })} /></div>
                  <div><Label>WhatsApp</Label><Input value={form.payer_phone} onChange={(e) => setForm({ ...form, payer_phone: e.target.value })} placeholder="55 21 99999-9999" /></div>
                </div>
              </div>
            )}
            <div><Label>Notas internas (opcional)</Label><Textarea rows={2} value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} /></div>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setShowNew(false)}>Cancelar</Button>
            <Button onClick={handleCreate}>Gerar link</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Editar */}
      <Dialog open={!!editing} onOpenChange={(v) => !v && setEditing(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>Atualizar autorização</DialogTitle></DialogHeader>
          {editing && (
            <div className="space-y-3">
              <p className="text-sm">{editing.payer_name}</p>
              <div>
                <Label>Decisão</Label>
                <Select value={editForm.authorized || "pending"} onValueChange={(v) => setEditForm({ ...editForm, authorized: v === "pending" ? "" : (v as any) })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pending">Pendente</SelectItem>
                    <SelectItem value="yes">Autoriza</SelectItem>
                    <SelectItem value="no">Não autoriza</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              {editForm.authorized === "yes" && (
                <div className="space-y-2 rounded-lg border p-3">
                  <div className="flex items-center gap-2">
                    <Checkbox id="tag-edit" checked={editForm.allow_tagging} onCheckedChange={(v) => setEditForm({ ...editForm, allow_tagging: !!v })} />
                    <Label htmlFor="tag-edit" className="cursor-pointer">Permitir marcação no perfil</Label>
                  </div>
                  {editForm.allow_tagging && (
                    <div><Label>@perfil</Label><Input value={editForm.social_handle} onChange={(e) => setEditForm({ ...editForm, social_handle: e.target.value })} placeholder="@seuperfil" /></div>
                  )}
                </div>
              )}
              <div><Label>Notas internas</Label><Textarea rows={3} value={editForm.notes} onChange={(e) => setEditForm({ ...editForm, notes: e.target.value })} /></div>
            </div>
          )}
          <DialogFooter>
            <Button variant="ghost" onClick={() => setEditing(null)}>Cancelar</Button>
            <Button onClick={saveEdit}>Salvar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
}