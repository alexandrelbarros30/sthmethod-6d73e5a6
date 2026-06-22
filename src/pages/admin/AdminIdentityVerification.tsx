import { useEffect, useMemo, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import { ArrowLeft, ShieldCheck, ShieldAlert, KeyRound, Mail, Phone, Lock, CheckCircle2, XCircle, Send } from "lucide-react";
import { cn } from "@/lib/utils";

type ChangeType = "email" | "phone" | "password";

export default function AdminIdentityVerification() {
  const navigate = useNavigate();
  const [sp] = useSearchParams();
  const uid = sp.get("uid") || "";
  const initialName = sp.get("name") || "";

  const [changeType, setChangeType] = useState<ChangeType>("email");
  const [newValue, setNewValue] = useState("");

  const [requestId, setRequestId] = useState<string | null>(null);
  const [student, setStudent] = useState<{ name: string; email_masked: string; phone_masked: string } | null>(null);
  const [kbaAvailable, setKbaAvailable] = useState<{ has_birth_date: boolean; has_cpf: boolean } | null>(null);

  const [birthDate, setBirthDate] = useState("");
  const [cpfLast4, setCpfLast4] = useState("");
  const [kbaResult, setKbaResult] = useState<{ ok: boolean; attempts_left: number } | null>(null);

  const [codeSent, setCodeSent] = useState<{ recipient_masked: string; expires_in_minutes: number } | null>(null);
  const [code, setCode] = useState("");
  const [completed, setCompleted] = useState<string | null>(null);

  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!uid) {
      toast.error("Aluno não informado");
      navigate("/admin/students");
    }
  }, [uid, navigate]);

  const reset = () => {
    setRequestId(null); setStudent(null); setKbaAvailable(null);
    setBirthDate(""); setCpfLast4(""); setKbaResult(null);
    setCodeSent(null); setCode(""); setCompleted(null); setNewValue("");
  };

  const invoke = async (action: string, payload: any) => {
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("admin-identity-verification", {
        body: { action, ...payload },
      });
      if (error) throw new Error(error.message);
      if (data?.error) throw new Error(data.error);
      return data;
    } finally { setLoading(false); }
  };

  const startRequest = async () => {
    try {
      const d = await invoke("create", {
        target_user_id: uid, change_type: changeType,
        new_value: changeType === "password" ? null : newValue,
      });
      setRequestId(d.request_id);
      setStudent(d.student);
      setKbaAvailable(d.kba_available);
    } catch (e: any) { toast.error(e.message); }
  };

  const submitKba = async () => {
    if (!birthDate || cpfLast4.replace(/\D/g, "").length !== 4) {
      toast.error("Preencha data de nascimento e 4 dígitos do CPF");
      return;
    }
    try {
      const d = await invoke("verify_kba", { request_id: requestId, birth_date: birthDate, cpf_last4: cpfLast4 });
      setKbaResult({ ok: d.ok, attempts_left: d.attempts_left });
      if (!d.ok) toast.error(`Resposta incorreta. Tentativas restantes: ${d.attempts_left}`);
      else toast.success("Identidade confirmada ✓");
    } catch (e: any) { toast.error(e.message); }
  };

  const sendCode = async () => {
    try {
      const d = await invoke("send_code", { request_id: requestId });
      setCodeSent({ recipient_masked: d.recipient_masked, expires_in_minutes: d.expires_in_minutes });
      toast.success(`Código enviado para ${d.recipient_masked}`);
    } catch (e: any) { toast.error(e.message); }
  };

  const verifyCode = async () => {
    if (code.replace(/\D/g, "").length !== 6) { toast.error("Código deve ter 6 dígitos"); return; }
    try {
      const d = await invoke("verify_code", { request_id: requestId, code });
      if (!d.ok) { toast.error(`Código incorreto. Restantes: ${d.attempts_left}`); return; }
      setCompleted(d.applied);
      toast.success("Alteração concluída com sucesso ✓");
    } catch (e: any) { toast.error(e.message); }
  };

  const cancel = async () => {
    if (requestId) { try { await invoke("cancel", { request_id: requestId, reason: "admin_cancel" }); } catch {} }
    reset();
  };

  const stepLabel = useMemo(() => {
    if (completed) return "Concluído";
    if (codeSent) return "4. Confirmar código";
    if (kbaResult?.ok) return "3. Enviar código";
    if (requestId) return "2. Desafio de identidade";
    return "1. Iniciar solicitação";
  }, [requestId, kbaResult, codeSent, completed]);

  return (
    <div className="container mx-auto py-6 max-w-2xl px-4">
      <Button variant="ghost" size="sm" onClick={() => navigate("/admin/students")} className="mb-4">
        <ArrowLeft className="w-4 h-4 mr-2" /> Voltar
      </Button>

      <Card className="border-2">
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-primary/10"><ShieldCheck className="w-6 h-6 text-primary" /></div>
            <div>
              <CardTitle>Verificação de Identidade</CardTitle>
              <p className="text-sm text-muted-foreground">
                {initialName || "Aluno"} · <Badge variant="secondary">{stepLabel}</Badge>
              </p>
            </div>
          </div>
        </CardHeader>

        <CardContent className="space-y-6">
          <div className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-xs text-amber-900 dark:bg-amber-950/30 dark:text-amber-200 dark:border-amber-800/40">
            🔒 <strong>Sigilo:</strong> nunca diga o e-mail, telefone, data de nascimento ou CPF atuais do aluno no chat. Sempre <strong>peça</strong> a ele e confirme aqui — o sistema valida sem expor o valor correto.
          </div>

          {/* STEP 1 */}
          {!requestId && (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Tipo de alteração</Label>
                <div className="grid grid-cols-3 gap-2">
                  {([
                    { v: "email", icon: Mail, label: "E-mail" },
                    { v: "phone", icon: Phone, label: "Telefone" },
                    { v: "password", icon: Lock, label: "Senha" },
                  ] as const).map(({ v, icon: Icon, label }) => (
                    <button
                      key={v}
                      onClick={() => setChangeType(v)}
                      className={cn(
                        "p-3 rounded-lg border-2 flex flex-col items-center gap-1 transition-all",
                        changeType === v ? "border-primary bg-primary/5" : "border-border hover:border-primary/30"
                      )}
                    >
                      <Icon className="w-5 h-5" />
                      <span className="text-xs font-medium">{label}</span>
                    </button>
                  ))}
                </div>
              </div>

              {changeType !== "password" && (
                <div className="space-y-2">
                  <Label>Novo {changeType === "email" ? "e-mail" : "telefone (DDD + número)"}</Label>
                  <Input
                    type={changeType === "email" ? "email" : "tel"}
                    value={newValue} onChange={(e) => setNewValue(e.target.value)}
                    placeholder={changeType === "email" ? "novo@email.com" : "21999999999"}
                  />
                </div>
              )}
              {changeType === "password" && (
                <p className="text-xs text-muted-foreground">
                  Após verificação, uma <strong>senha temporária</strong> será enviada automaticamente para o e-mail atual do aluno. Ela não aparecerá nesta tela.
                </p>
              )}

              <Button onClick={startRequest} disabled={loading || (changeType !== "password" && !newValue)} className="w-full">
                Iniciar verificação
              </Button>
            </div>
          )}

          {/* STEP 2: KBA */}
          {requestId && !kbaResult?.ok && (
            <div className="space-y-4">
              <div className="rounded-lg bg-muted p-3 text-sm">
                <div className="font-medium mb-1">{student?.name}</div>
                <div className="text-xs text-muted-foreground space-y-0.5">
                  <div>E-mail atual: <span className="font-mono">{student?.email_masked}</span></div>
                  <div>Tel atual: <span className="font-mono">{student?.phone_masked}</span></div>
                </div>
              </div>

              {(!kbaAvailable?.has_birth_date || !kbaAvailable?.has_cpf) && (
                <div className="rounded-lg bg-destructive/10 border border-destructive/30 p-3 text-sm text-destructive">
                  <ShieldAlert className="w-4 h-4 inline mr-1" />
                  Aluno não possui data de nascimento e/ou CPF cadastrados.
                </div>
              )}

              <div className="space-y-3">
                <p className="text-sm font-medium">Pergunte ao aluno e digite as respostas:</p>
                <div className="space-y-2">
                  <Label>Data de nascimento</Label>
                  <Input type="date" value={birthDate} onChange={(e) => setBirthDate(e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label>Últimos 4 dígitos do CPF</Label>
                  <Input inputMode="numeric" maxLength={4} value={cpfLast4}
                    onChange={(e) => setCpfLast4(e.target.value.replace(/\D/g, "").slice(0, 4))}
                    placeholder="0000" />
                </div>
              </div>

              {kbaResult && !kbaResult.ok && (
                <div className="rounded-lg bg-destructive/10 border border-destructive/30 p-3 text-sm text-destructive flex items-center gap-2">
                  <XCircle className="w-4 h-4" /> Resposta incorreta. Tentativas restantes: {kbaResult.attempts_left}
                </div>
              )}

              <div className="flex gap-2">
                <Button onClick={submitKba} disabled={loading} className="flex-1">
                  <ShieldCheck className="w-4 h-4 mr-2" /> Validar respostas
                </Button>
                <Button variant="outline" onClick={cancel} disabled={loading}>Cancelar</Button>
              </div>
            </div>
          )}

          {/* STEP 3: send code */}
          {requestId && kbaResult?.ok && !codeSent && !completed && (
            <div className="space-y-4">
              <div className="rounded-lg bg-emerald-50 border border-emerald-200 p-3 text-sm text-emerald-900 dark:bg-emerald-950/30 dark:text-emerald-200 dark:border-emerald-800/40 flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4" /> Identidade confirmada.
              </div>
              <p className="text-sm">
                {changeType === "email" && <>Será enviado um código de 6 dígitos para o <strong>novo e-mail</strong> informado.</>}
                {changeType === "phone" && <>Será enviado um código de 6 dígitos para o <strong>e-mail atual</strong> do aluno.</>}
                {changeType === "password" && <>Será enviado um código de 6 dígitos para o <strong>e-mail atual</strong> do aluno.</>}
              </p>
              <div className="flex gap-2">
                <Button onClick={sendCode} disabled={loading} className="flex-1">
                  <Send className="w-4 h-4 mr-2" /> Enviar código
                </Button>
                <Button variant="outline" onClick={cancel} disabled={loading}>Cancelar</Button>
              </div>
            </div>
          )}

          {/* STEP 4: verify code */}
          {codeSent && !completed && (
            <div className="space-y-4">
              <div className="rounded-lg bg-muted p-3 text-sm">
                Código enviado para <span className="font-mono font-medium">{codeSent.recipient_masked}</span>. Expira em {codeSent.expires_in_minutes} min.
              </div>
              <div className="space-y-2">
                <Label>Código informado pelo aluno</Label>
                <Input inputMode="numeric" maxLength={6} value={code}
                  onChange={(e) => setCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
                  placeholder="000000"
                  className="text-center text-2xl tracking-[0.4em] font-mono" />
              </div>
              <div className="flex gap-2">
                <Button onClick={verifyCode} disabled={loading || code.length !== 6} className="flex-1">
                  <KeyRound className="w-4 h-4 mr-2" /> Confirmar e aplicar
                </Button>
                <Button variant="outline" onClick={sendCode} disabled={loading}>Reenviar</Button>
                <Button variant="outline" onClick={cancel} disabled={loading}>Cancelar</Button>
              </div>
            </div>
          )}

          {/* DONE */}
          {completed && (
            <div className="space-y-4 text-center py-4">
              <div className="mx-auto w-14 h-14 rounded-full bg-emerald-100 flex items-center justify-center dark:bg-emerald-950/40">
                <CheckCircle2 className="w-7 h-7 text-emerald-600" />
              </div>
              <div>
                <h3 className="font-semibold">Alteração concluída</h3>
                <p className="text-sm text-muted-foreground mt-1">
                  {completed === "email" && "O e-mail de login do aluno foi atualizado e o e-mail antigo foi notificado."}
                  {completed === "phone" && "O telefone do aluno foi atualizado."}
                  {completed === "password" && "Uma senha temporária foi enviada ao e-mail atual do aluno."}
                </p>
              </div>
              <Separator />
              <div className="flex gap-2 justify-center">
                <Button variant="outline" onClick={reset}>Nova verificação</Button>
                <Button onClick={() => navigate("/admin/students")}>Voltar ao painel</Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}