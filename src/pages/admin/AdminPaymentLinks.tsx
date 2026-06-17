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
import { toast } from "@/hooks/use-toast";
import { Copy, Plus, Link2, CheckCircle2, RefreshCcw } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";

type Link = { id: string; code: string; label: string; amount: number; description: string | null; max_uses: number; current_uses: number; expires_at: string | null; active: boolean; notes: string | null; created_at: string; student_user_id: string | null };
type Payment = { id: string; link_id: string; payer_name: string; payer_email: string | null; payer_phone: string | null; amount: number; method: string; status: string; reconciled: boolean; reconciled_plan_id: string | null; reconciled_at: string | null; reconciled_notes: string | null; mp_payment_id: string | null; created_at: string };
type Plan = { id: string; name: string };
type Student = { user_id: string; full_name: string | null; email: string | null };

const fmt = (n: number) => Number(n).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
const randomCode = () => Math.random().toString(36).slice(2, 8);

export default function AdminPaymentLinks() {
  const { role } = useAuth();
  const layoutRole = (role === "financeiro" ? "financeiro" : "admin") as "admin" | "financeiro";

  const [links, setLinks] = useState<Link[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [plans, setPlans] = useState<Plan[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);

  const [showNew, setShowNew] = useState(false);
  const [form, setForm] = useState({ code: randomCode(), label: "", amount: "", description: "", max_uses: "1", expires_at: "", notes: "", student_user_id: "" });

  const [reconciling, setReconciling] = useState<Payment | null>(null);
  const [reconcilePlanId, setReconcilePlanId] = useState<string>("");
  const [reconcileNotes, setReconcileNotes] = useState<string>("");

  async function load() {
    setLoading(true);
    const [l, p, pl, st] = await Promise.all([
      supabase.from("custom_payment_links").select("*").order("created_at", { ascending: false }),
      supabase.from("custom_payments").select("*").order("created_at", { ascending: false }).limit(100),
      supabase.from("plans").select("id, name").order("name"),
      supabase.from("profiles").select("user_id, full_name, email").order("full_name").limit(2000),
    ]);
    setLinks((l.data as any) || []);
    setPayments((p.data as any) || []);
    setPlans((pl.data as any) || []);
    setStudents((st.data as any) || []);
    setLoading(false);
  }
  useEffect(() => { load(); }, []);

  const linkByCode = useMemo(() => new Map(links.map((l) => [l.id, l])), [links]);
  const studentById = useMemo(() => new Map(students.map((s) => [s.user_id, s])), [students]);

  async function handleCreate() {
    if (!form.label.trim() || !form.amount) { toast({ title: "Preencha label e valor" }); return; }
    const amount = Number(String(form.amount).replace(",", "."));
    if (!(amount > 0)) { toast({ title: "Valor inválido" }); return; }
    const code = (form.code || randomCode()).toLowerCase().replace(/[^a-z0-9-]/g, "");
    if (!form.student_user_id) { toast({ title: "Selecione o aluno vinculado" }); return; }
    const { error } = await supabase.from("custom_payment_links").insert({
      code, label: form.label.trim(), amount, description: form.description.trim() || null,
      max_uses: Number(form.max_uses) || 0, expires_at: form.expires_at || null, notes: form.notes.trim() || null,
      student_user_id: form.student_user_id,
    });
    if (error) { toast({ title: "Erro", description: error.message }); return; }
    toast({ title: "Link criado" });
    setShowNew(false);
    setForm({ code: randomCode(), label: "", amount: "", description: "", max_uses: "1", expires_at: "", notes: "", student_user_id: "" });
    load();
  }

  async function toggleActive(l: Link) {
    await supabase.from("custom_payment_links").update({ active: !l.active }).eq("id", l.id);
    load();
  }

  function copyLink(code: string) {
    const url = `${window.location.origin}/pagar/${code}`;
    navigator.clipboard.writeText(url);
    toast({ title: "Link copiado", description: url });
  }

  async function handleReconcile() {
    if (!reconciling) return;
    if (!reconcilePlanId) { toast({ title: "Selecione o plano" }); return; }
    const { error } = await supabase.from("custom_payments").update({
      reconciled: true,
      reconciled_plan_id: reconcilePlanId,
      reconciled_notes: reconcileNotes.trim() || null,
      reconciled_at: new Date().toISOString(),
    }).eq("id", reconciling.id);
    if (error) { toast({ title: "Erro", description: error.message }); return; }
    toast({ title: "Pagamento reconciliado" });
    setReconciling(null); setReconcilePlanId(""); setReconcileNotes("");
    load();
  }

  return (
    <DashboardLayout role={layoutRole} title="Links de pagamento" subtitle="Cobrança Pix avulsa vinculada ao aluno · reconciliação manual com o plano combinado">
      <div className="flex items-center justify-between mb-4">
        <p className="text-sm text-muted-foreground">{loading ? "Carregando..." : `${links.length} link(s) · ${payments.length} pagamento(s)`}</p>
        <div className="flex gap-2">
          <Button variant="ghost" size="sm" onClick={load}><RefreshCcw className="w-4 h-4 mr-1" />Atualizar</Button>
          <Button size="sm" onClick={() => setShowNew(true)}><Plus className="w-4 h-4 mr-1" />Novo link</Button>
        </div>
      </div>

      {/* Lista de links */}
      <Card className="p-0 mb-8 overflow-hidden">
        <div className="px-4 py-3 border-b bg-muted/30 text-xs font-medium text-muted-foreground uppercase tracking-wider">Links ativos</div>
        <div className="divide-y">
          {links.map((l) => (
            <div key={l.id} className="px-4 py-3 flex flex-wrap items-center gap-3">
              <div className="flex-1 min-w-[200px]">
                <div className="flex items-center gap-2">
                  <p className="font-medium text-sm">{l.label}</p>
                  {!l.active && <Badge variant="secondary" className="text-[10px]">inativo</Badge>}
                  {l.expires_at && new Date(l.expires_at) < new Date() && <Badge variant="destructive" className="text-[10px]">expirado</Badge>}
                </div>
                <p className="text-[11px] text-muted-foreground font-mono">/pagar/{l.code}</p>
                {l.student_user_id && (
                  <p className="text-[11px] text-muted-foreground">Aluno: {studentById.get(l.student_user_id)?.full_name || studentById.get(l.student_user_id)?.email || l.student_user_id.slice(0, 8)}</p>
                )}
              </div>
              <div className="text-right">
                <p className="font-semibold text-sm">{fmt(l.amount)}</p>
                <p className="text-[10px] text-muted-foreground">{l.current_uses}{l.max_uses > 0 ? `/${l.max_uses}` : ""} usos</p>
              </div>
              <div className="flex gap-1">
                <Button size="sm" variant="ghost" onClick={() => copyLink(l.code)} title="Copiar link"><Copy className="w-3.5 h-3.5" /></Button>
                <Button size="sm" variant="ghost" onClick={() => window.open(`/pagar/${l.code}`, "_blank")} title="Abrir"><Link2 className="w-3.5 h-3.5" /></Button>
                <Button size="sm" variant="ghost" onClick={() => toggleActive(l)}>{l.active ? "Pausar" : "Ativar"}</Button>
              </div>
            </div>
          ))}
          {links.length === 0 && !loading && <div className="px-4 py-8 text-center text-sm text-muted-foreground">Nenhum link criado ainda.</div>}
        </div>
      </Card>

      {/* Pagamentos */}
      <Card className="p-0 overflow-hidden">
        <div className="px-4 py-3 border-b bg-muted/30 text-xs font-medium text-muted-foreground uppercase tracking-wider">Pagamentos recebidos</div>
        <div className="divide-y">
          {payments.map((p) => {
            const link = linkByCode.get(p.link_id);
            const plan = plans.find((pl) => pl.id === p.reconciled_plan_id);
            return (
              <div key={p.id} className="px-4 py-3 flex flex-wrap items-center gap-3">
                <div className="flex-1 min-w-[220px]">
                  <p className="text-sm font-medium">
                    {p.payer_name}
                    {link?.student_user_id && (
                      <span className="ml-1 text-[10px] uppercase tracking-wider text-emerald-600">vinculado</span>
                    )}
                    <span className="text-muted-foreground font-normal"> · {link?.label || "—"}</span>
                  </p>
                  <p className="text-[11px] text-muted-foreground">{[p.payer_email, p.payer_phone].filter(Boolean).join(" · ") || "sem contato"}</p>
                  {link?.student_user_id && (
                    <p className="text-[10px] text-muted-foreground">→ {studentById.get(link.student_user_id)?.full_name || studentById.get(link.student_user_id)?.email || link.student_user_id.slice(0,8)}</p>
                  )}
                  <p className="text-[10px] text-muted-foreground">{new Date(p.created_at).toLocaleString("pt-BR")}</p>
                </div>
                <div className="text-right min-w-[110px]">
                  <p className="font-semibold text-sm">{fmt(Number(p.amount))}</p>
                  <p className="text-[10px] text-muted-foreground">{p.method.toUpperCase()}</p>
                </div>
                <div className="min-w-[100px] text-center">
                  <Badge variant={p.status === "approved" ? "default" : (p.status === "pending" ? "secondary" : "destructive")}>{p.status}</Badge>
                </div>
                <div className="min-w-[180px]">
                  {p.reconciled ? (
                    <div className="flex items-center gap-1 text-emerald-600 text-xs">
                      <CheckCircle2 className="w-3.5 h-3.5" /> {plan?.name || "Reconciliado"}
                    </div>
                  ) : (
                    <Button size="sm" variant="outline" disabled={p.status !== "approved"}
                      onClick={() => { setReconciling(p); setReconcilePlanId(""); setReconcileNotes(""); }}>
                      Reconciliar com plano
                    </Button>
                  )}
                </div>
              </div>
            );
          })}
          {payments.length === 0 && !loading && <div className="px-4 py-8 text-center text-sm text-muted-foreground">Nenhum pagamento ainda.</div>}
        </div>
      </Card>

      {/* Novo link */}
      <Dialog open={showNew} onOpenChange={setShowNew}>
        <DialogContent>
          <DialogHeader><DialogTitle>Novo link de pagamento</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div>
              <Label>Aluno vinculado</Label>
              <Select value={form.student_user_id} onValueChange={(v) => setForm({ ...form, student_user_id: v })}>
                <SelectTrigger><SelectValue placeholder="Selecione o aluno" /></SelectTrigger>
                <SelectContent className="max-h-72">
                  {students.map((s) => (
                    <SelectItem key={s.user_id} value={s.user_id}>
                      {s.full_name || s.email || s.user_id.slice(0, 8)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-[11px] text-muted-foreground mt-1">O Pix será registrado como saldo na conta deste aluno. O plano é definido depois pelo financeiro.</p>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div><Label>Código (URL)</Label><Input value={form.code} onChange={(e) => setForm({ ...form, code: e.target.value })} /></div>
              <div><Label>Valor (R$)</Label><Input value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} placeholder="ex: 297,00" /></div>
            </div>
            <div><Label>Título</Label><Input value={form.label} onChange={(e) => setForm({ ...form, label: e.target.value })} placeholder="Ex: Adesão consultoria personalizada" /></div>
            <div><Label>Descrição (opcional)</Label><Textarea rows={2} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="Aparece para o aluno" /></div>
            <div className="grid grid-cols-2 gap-2">
              <div><Label>Limite de usos (0 = ilimitado)</Label><Input type="number" value={form.max_uses} onChange={(e) => setForm({ ...form, max_uses: e.target.value })} /></div>
              <div><Label>Expira em (opcional)</Label><Input type="datetime-local" value={form.expires_at} onChange={(e) => setForm({ ...form, expires_at: e.target.value })} /></div>
            </div>
            <div><Label>Notas internas (opcional)</Label><Textarea rows={2} value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} placeholder="Só admin vê" /></div>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setShowNew(false)}>Cancelar</Button>
            <Button onClick={handleCreate}>Criar link</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Reconciliar */}
      <Dialog open={!!reconciling} onOpenChange={(o) => !o && setReconciling(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>Reconciliar pagamento com plano</DialogTitle></DialogHeader>
          {reconciling && (
            <div className="space-y-3 text-sm">
              <p><strong>{reconciling.payer_name}</strong> pagou <strong>{fmt(Number(reconciling.amount))}</strong> em {reconciling.method.toUpperCase()}.</p>
              <div>
                <Label>Plano associado</Label>
                <Select value={reconcilePlanId} onValueChange={setReconcilePlanId}>
                  <SelectTrigger><SelectValue placeholder="Escolha o plano" /></SelectTrigger>
                  <SelectContent>
                    {plans.map((p) => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div><Label>Anotação (opcional)</Label><Textarea rows={2} value={reconcileNotes} onChange={(e) => setReconcileNotes(e.target.value)} /></div>
              <p className="text-[11px] text-muted-foreground">Esta ação marca o pagamento como reconciliado. A ativação do plano para o aluno ainda é feita manualmente na tela de pagamentos.</p>
            </div>
          )}
          <DialogFooter>
            <Button variant="ghost" onClick={() => setReconciling(null)}>Cancelar</Button>
            <Button onClick={handleReconcile}>Confirmar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
}
