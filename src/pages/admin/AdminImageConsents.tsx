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
import { toast } from "@/hooks/use-toast";
import { Copy, Plus, MessageCircle, RefreshCcw, CheckCircle2, XCircle, Clock, ImageIcon, Pencil, Eye } from "lucide-react";
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

const onlyDigits = (s: string) => s.replace(/\D/g, "");

export default function AdminImageConsents() {
  const { role } = useAuth();
  const layoutRole = (role === "consultor" ? "consultor" : "admin") as "admin" | "consultor";

  const [items, setItems] = useState<Consent[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);

  const [showNew, setShowNew] = useState(false);
  const [mode, setMode] = useState<"student" | "avulso">("student");
  const [form, setForm] = useState({ user_id: "", payer_name: "", payer_email: "", payer_phone: "", notes: "" });

  const [editing, setEditing] = useState<Consent | null>(null);
  const [editForm, setEditForm] = useState({ authorized: "" as "" | "yes" | "no", allow_tagging: false, social_handle: "", notes: "" });

  async function load() {
    setLoading(true);
    const [c, s] = await Promise.all([
      supabase.from("image_consents").select("*").order("created_at", { ascending: false }),
      supabase.from("profiles").select("user_id, full_name, email, phone").order("full_name").limit(2000),
    ]);
    setItems((c.data as any) || []);
    setStudents((s.data as any) || []);
    setLoading(false);
  }
  useEffect(() => { load(); }, []);

  const studentById = useMemo(() => new Map(students.map((s) => [s.user_id, s])), [students]);

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
    <DashboardLayout role={layoutRole} title="Autorização de imagens" subtitle="Termo de uso de imagem para redes sociais · alunos ativos, inativos e leads">
      <div className="flex items-center justify-between mb-4">
        <p className="text-sm text-muted-foreground">{loading ? "Carregando..." : `${items.length} solicitação(ões)`}</p>
        <div className="flex gap-2">
          <Button variant="ghost" size="sm" onClick={load}><RefreshCcw className="w-4 h-4 mr-1" />Atualizar</Button>
          <Button size="sm" onClick={() => setShowNew(true)}><Plus className="w-4 h-4 mr-1" />Nova autorização</Button>
        </div>
      </div>

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