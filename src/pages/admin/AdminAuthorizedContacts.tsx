import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { Check, X, ShieldCheck, Loader2, Phone, User, Clock, Mail, MailCheck } from "lucide-react";
import { MessageCircle, Send, Search } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { formatPhoneBR } from "@/lib/phone";
import DashboardLayout from "@/components/DashboardLayout";
import { useAuth } from "@/contexts/AuthContext";

type Row = {
  id: string;
  user_id: string;
  holder_name: string;
  phone: string;
  relationship: string;
  reason: string | null;
  status: "pending" | "awaiting_student" | "approved" | "rejected";
  review_notes: string | null;
  reviewed_at: string | null;
  created_at: string;
  verification_sent_at?: string | null;
  verification_expires_at?: string | null;
  identity_verified_at?: string | null;
  student_confirmed_at?: string | null;
};

const relLabels: Record<string, string> = {
  marido: "Marido",
  esposa: "Esposa",
  parceiro: "Parceiro(a)",
  pai_mae: "Pai / Mãe",
  filho_filha: "Filho(a)",
  responsavel: "Responsável legal",
  outro: "Outro",
};

const statusColors: Record<string, string> = {
  pending: "bg-amber-500/15 text-amber-600 border-amber-500/30",
  awaiting_student: "bg-sky-500/15 text-sky-600 border-sky-500/30",
  approved: "bg-emerald-500/15 text-emerald-600 border-emerald-500/30",
  rejected: "bg-rose-500/15 text-rose-600 border-rose-500/30",
};

const statusLabels: Record<string, string> = {
  pending: "Pendente",
  awaiting_student: "Aguardando aluno",
  approved: "Autorizado",
  rejected: "Rejeitado",
};

const AdminAuthorizedContacts = () => {
  const qc = useQueryClient();
  const { role } = useAuth();
  const layoutRole = (role === "consultor" ? "consultor" : "admin") as "admin" | "consultor";
  const [notes, setNotes] = useState<Record<string, string>>({});
  const [reqOpen, setReqOpen] = useState(false);
  const [studentSearch, setStudentSearch] = useState("");
  const [selectedStudent, setSelectedStudent] = useState<any | null>(null);
  const [reqHolder, setReqHolder] = useState("");
  const [reqPhone, setReqPhone] = useState("");
  const [reqRel, setReqRel] = useState("");
  const [reqReason, setReqReason] = useState("");

  const { data: rows = [], isLoading } = useQuery({
    queryKey: ["admin-authorized-contacts"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("authorized_contacts")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data || []) as Row[];
    },
  });

  const userIds = Array.from(new Set(rows.map((r) => r.user_id)));
  const { data: profiles = [] } = useQuery({
    queryKey: ["admin-authorized-contacts-profiles", userIds],
    enabled: userIds.length > 0,
    queryFn: async () => {
      const { data } = await supabase
        .from("profiles")
        .select("user_id, full_name, phone, email")
        .in("user_id", userIds);
      return data || [];
    },
  });
  const profileById = new Map(profiles.map((p: any) => [p.user_id, p]));

  const decide = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: "approved" | "rejected" }) => {
      const { data: session } = await supabase.auth.getSession();
      const { error } = await supabase
        .from("authorized_contacts")
        .update({
          status,
          review_notes: notes[id]?.trim() || null,
          reviewed_by: session.session?.user.id,
          reviewed_at: new Date().toISOString(),
        })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: (_d, vars) => {
      toast.success(vars.status === "approved" ? "Autorizado" : "Rejeitado");
      qc.invalidateQueries({ queryKey: ["admin-authorized-contacts"] });
    },
    onError: (e: any) => toast.error(e.message || "Falha ao atualizar"),
  });

  const sendVerification = useMutation({
    mutationFn: async (id: string) => {
      const { data, error } = await supabase.functions.invoke(
        "send-authorized-contact-verification",
        { body: { authorized_contact_id: id } },
      );
      if (error) throw error;
      return data as { ok: boolean; expires_at: string };
    },
    onSuccess: () => {
      toast.success("E-mail de verificação enviado ao aluno.");
      qc.invalidateQueries({ queryKey: ["admin-authorized-contacts"] });
    },
    onError: (e: any) => toast.error(e.message || "Falha ao enviar verificação"),
  });

  const pending = rows.filter((r) => r.status === "pending" || r.status === "awaiting_student");
  const reviewed = rows.filter((r) => r.status === "approved" || r.status === "rejected");

  const waDigits = (s: string) => {
    const d = (s || "").replace(/\D/g, "");
    return d.startsWith("55") ? d : `55${d}`;
  };
  const openWa = (phone: string, text: string) => {
    const url = `https://wa.me/${waDigits(phone)}?text=${encodeURIComponent(text)}`;
    window.open(url, "_blank", "noopener,noreferrer");
  };

  const { data: searchResults = [] } = useQuery({
    queryKey: ["admin-student-search", studentSearch],
    enabled: reqOpen && studentSearch.trim().length >= 2,
    queryFn: async () => {
      const q = studentSearch.trim();
      const { data } = await supabase
        .from("profiles")
        .select("user_id, full_name, phone, email")
        .or(`full_name.ilike.%${q}%,email.ilike.%${q}%,phone.ilike.%${q}%`)
        .limit(10);
      return data || [];
    },
  });

  const createRequest = useMutation({
    mutationFn: async () => {
      if (!selectedStudent) throw new Error("Selecione o aluno");
      if (!reqHolder.trim()) throw new Error("Nome do titular obrigatório");
      if (reqPhone.replace(/\D/g, "").length < 10) throw new Error("Telefone inválido");
      if (!reqRel) throw new Error("Selecione a relação");
      const { error } = await supabase.from("authorized_contacts").insert({
        user_id: selectedStudent.user_id,
        holder_name: reqHolder.trim(),
        phone: reqPhone.replace(/\D/g, ""),
        relationship: reqRel,
        reason: reqReason.trim() || null,
        status: "pending",
      });
      if (error) throw error;

      const studentMsg = `Olá ${selectedStudent.full_name || ""}! Aqui é da STH METHOD.\n\nRecebemos uma solicitação para autorizar o telefone adicional *${formatPhoneBR(reqPhone)}* (${reqHolder} - ${relLabels[reqRel] || reqRel}) a tratar do seu acompanhamento com nossa equipe.\n\nVocê autoriza? Responda *SIM* ou *NÃO* por aqui.`;
      // Fluxo 100% MANUAL (privacidade): apenas registra e abre WhatsApp
      // pessoal do admin/consultor no canal "Fale com o Nutri".
      if (selectedStudent.phone) {
        openWa(selectedStudent.phone, studentMsg);
      }
      return { studentPhone: selectedStudent.phone as string | null };
    },
    onSuccess: (res) => {
      if (res.studentPhone) {
        toast.success("Solicitação registrada. Envie a mensagem pelo WhatsApp aberto.");
      } else {
        toast.warning("Solicitação registrada, mas o aluno não tem telefone cadastrado.");
      }
      qc.invalidateQueries({ queryKey: ["admin-authorized-contacts"] });
      setReqOpen(false);
      setSelectedStudent(null);
      setStudentSearch("");
      setReqHolder(""); setReqPhone(""); setReqRel(""); setReqReason("");
    },
    onError: (e: any) => toast.error(e.message || "Falha ao criar"),
  });

  const msgToStudent = (r: Row, p: any) =>
    `Olá ${p?.full_name || ""}! Aqui é da STH METHOD. Recebemos uma solicitação para autorizar o telefone adicional ${formatPhoneBR(r.phone)} (${r.holder_name} - ${relLabels[r.relationship] || r.relationship}) a tratar do seu acompanhamento. Você confirma essa autorização? Responda SIM ou NÃO.`;
  const msgToHolder = (r: Row, p: any) =>
    `Olá ${r.holder_name}! Aqui é da STH METHOD. O(a) aluno(a) ${p?.full_name || ""} solicitou autorizar este número como contato adicional para tratar do acompanhamento dele(a). Você confirma que aceita ser esse contato autorizado? Responda SIM ou NÃO.`;

  return (
    <DashboardLayout role={layoutRole} title="Telefones autorizados" subtitle="Solicitações de contato adicional (marido, esposa, responsável)">
      <div className="max-w-5xl mx-auto p-4 sm:p-6 space-y-6">
      <div className="flex items-center gap-3 flex-wrap">
        <ShieldCheck className="w-6 h-6 text-primary" />
        <div className="flex-1 min-w-[200px]">
          <h1 className="text-xl font-display font-bold">Telefones autorizados</h1>
          <p className="text-xs text-muted-foreground font-body">
            Solicitações de alunos para que outro telefone (marido, esposa, responsável) possa tratar do
            acompanhamento.
          </p>
        </div>
        <Dialog open={reqOpen} onOpenChange={setReqOpen}>
          <DialogTrigger asChild>
            <Button size="sm" className="gap-2">
              <Send className="w-4 h-4" /> Solicitar autorização ao aluno
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>Solicitar autorização ao aluno</DialogTitle>
            </DialogHeader>
            <div className="space-y-3">
              <div className="space-y-1">
                <Label className="text-xs">Aluno</Label>
                {selectedStudent ? (
                  <div className="flex items-center justify-between border rounded p-2 text-sm">
                    <div>
                      <div className="font-semibold">{selectedStudent.full_name}</div>
                      <div className="text-xs text-muted-foreground">{selectedStudent.phone ? formatPhoneBR(selectedStudent.phone) : "sem telefone"} · {selectedStudent.email}</div>
                    </div>
                    <Button size="sm" variant="ghost" onClick={() => setSelectedStudent(null)}>Trocar</Button>
                  </div>
                ) : (
                  <>
                    <div className="relative">
                      <Search className="w-3.5 h-3.5 absolute left-2 top-2.5 text-muted-foreground" />
                      <Input className="pl-7" placeholder="Buscar por nome, e-mail ou telefone..." value={studentSearch} onChange={(e) => setStudentSearch(e.target.value)} />
                    </div>
                    {searchResults.length > 0 && (
                      <div className="border rounded max-h-48 overflow-auto">
                        {searchResults.map((s: any) => (
                          <button key={s.user_id} type="button" onClick={() => setSelectedStudent(s)} className="w-full text-left px-2 py-1.5 text-sm hover:bg-muted">
                            <div className="font-medium">{s.full_name}</div>
                            <div className="text-xs text-muted-foreground">{s.phone ? formatPhoneBR(s.phone) : "sem telefone"} · {s.email}</div>
                          </button>
                        ))}
                      </div>
                    )}
                  </>
                )}
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-1">
                  <Label className="text-xs">Nome do titular do outro telefone</Label>
                  <Input value={reqHolder} onChange={(e) => setReqHolder(e.target.value)} placeholder="Ex.: Maria Silva" />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Telefone adicional</Label>
                  <Input value={reqPhone} onChange={(e) => setReqPhone(e.target.value)} placeholder="(11) 99999-9999" />
                </div>
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Relação</Label>
                <Select value={reqRel} onValueChange={setReqRel}>
                  <SelectTrigger><SelectValue placeholder="Selecione..." /></SelectTrigger>
                  <SelectContent>
                    {Object.entries(relLabels).map(([v, l]) => <SelectItem key={v} value={v}>{l}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Motivo (opcional)</Label>
                <Textarea rows={2} value={reqReason} onChange={(e) => setReqReason(e.target.value)} />
              </div>
              <Button className="w-full gap-2" onClick={() => createRequest.mutate()} disabled={createRequest.isPending}>
                <MessageCircle className="w-4 h-4" /> Registrar e abrir WhatsApp do aluno
              </Button>
              <p className="text-[10px] text-muted-foreground">
                Fluxo manual e privado: a solicitação é registrada como pendente e o WhatsApp do aluno abre em nova aba (canal Fale com o Nutri). Envie a mensagem manualmente e, após a confirmação do aluno, aprove aqui.
              </p>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {isLoading && (
        <div className="flex items-center gap-2 text-muted-foreground text-sm">
          <Loader2 className="w-4 h-4 animate-spin" /> Carregando...
        </div>
      )}

      <section className="space-y-3">
        <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
          Pendentes ({pending.length})
        </h2>
        {pending.length === 0 && !isLoading && (
          <p className="text-sm text-muted-foreground font-body">Nenhuma solicitação pendente.</p>
        )}
        {pending.map((r) => {
          const p = profileById.get(r.user_id) as any;
          return (
            <Card key={r.id} className="border-amber-500/30">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-display flex items-center gap-2 flex-wrap">
                  <User className="w-4 h-4 text-primary" />
                  {p?.full_name || "Aluno"}
                  <Badge variant="outline" className="text-[10px]">{p?.email || "—"}</Badge>
                  <Badge className={statusColors[r.status]}>Pendente</Badge>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-sm font-body">
                <div className="grid sm:grid-cols-2 gap-2 text-xs">
                  <div><span className="text-muted-foreground">Titular:</span> <strong>{r.holder_name}</strong></div>
                  <div><span className="text-muted-foreground">Relação:</span> {relLabels[r.relationship] || r.relationship}</div>
                  <div className="flex items-center gap-1"><Phone className="w-3 h-3 text-muted-foreground" /> {formatPhoneBR(r.phone)}</div>
                  <div className="text-muted-foreground">Tel. do aluno: {p?.phone ? formatPhoneBR(p.phone) : "—"}</div>
                </div>
                {r.reason && (
                  <div className="text-xs bg-muted/40 rounded p-2 border border-border">
                    <span className="text-muted-foreground">Motivo:</span> {r.reason}
                  </div>
                )}
                <Textarea
                  placeholder="Observações da revisão (opcional)"
                  value={notes[r.id] || ""}
                  onChange={(e) => setNotes({ ...notes, [r.id]: e.target.value })}
                  rows={2}
                  className="text-xs"
                />
                <div className="flex gap-2 justify-end">
                  <Button
                    size="sm"
                    variant="outline"
                    className="text-emerald-600 border-emerald-500/40 hover:bg-emerald-500/10"
                    onClick={() => openWa(p?.phone || "", msgToStudent(r, p))}
                    disabled={!p?.phone}
                  >
                    <MessageCircle className="w-3.5 h-3.5 mr-1" /> WhatsApp aluno
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    className="text-emerald-600 border-emerald-500/40 hover:bg-emerald-500/10"
                    onClick={() => openWa(r.phone, msgToHolder(r, p))}
                  >
                    <MessageCircle className="w-3.5 h-3.5 mr-1" /> WhatsApp titular
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    className="text-rose-600 border-rose-500/40 hover:bg-rose-500/10"
                    onClick={() => decide.mutate({ id: r.id, status: "rejected" })}
                    disabled={decide.isPending}
                  >
                    <X className="w-3.5 h-3.5 mr-1" /> Rejeitar
                  </Button>
                  <Button
                    size="sm"
                    onClick={() => decide.mutate({ id: r.id, status: "approved" })}
                    disabled={decide.isPending}
                  >
                    <Check className="w-3.5 h-3.5 mr-1" /> Autorizar
                  </Button>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </section>

      <section className="space-y-3">
        <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
          Histórico ({reviewed.length})
        </h2>
        {reviewed.map((r) => {
          const p = profileById.get(r.user_id) as any;
          return (
            <Card key={r.id}>
              <CardContent className="py-3 flex flex-wrap items-center gap-2 text-xs font-body">
                <Badge className={statusColors[r.status]}>
                  {r.status === "approved" ? "Autorizado" : "Rejeitado"}
                </Badge>
                <span className="font-semibold">{p?.full_name || "Aluno"}</span>
                <span className="text-muted-foreground">→ {r.holder_name} ({relLabels[r.relationship]}) · {formatPhoneBR(r.phone)}</span>
                <span className="ml-auto text-muted-foreground flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  {r.reviewed_at ? new Date(r.reviewed_at).toLocaleString("pt-BR") : "—"}
                </span>
                {r.review_notes && (
                  <p className="w-full text-muted-foreground italic mt-1">"{r.review_notes}"</p>
                )}
              </CardContent>
            </Card>
          );
        })}
      </section>
      </div>
    </DashboardLayout>
  );
};

export default AdminAuthorizedContacts;