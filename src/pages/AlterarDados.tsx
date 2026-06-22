import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { ShieldCheck, Mail, Phone, Lock, CheckCircle2, KeyRound, ArrowRight } from "lucide-react";

type ChangeType = "email" | "phone" | "password";
type Step = "intro" | "kba" | "code" | "done";

export default function AlterarDados() {
  const [step, setStep] = useState<Step>("intro");
  const [email, setEmail] = useState("");
  const [changeType, setChangeType] = useState<ChangeType>("email");
  const [newValue, setNewValue] = useState("");
  const [token, setToken] = useState<string | null>(null);
  const [birthDate, setBirthDate] = useState("");
  const [cpf, setCpf] = useState("");
  const [code, setCode] = useState("");
  const [recipient, setRecipient] = useState("");
  const [attemptsLeft, setAttemptsLeft] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);

  const call = async (action: string, payload: any) => {
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("self-service-identity", {
        body: { action, ...payload },
      });
      if (error) throw new Error(error.message);
      if (data?.error) throw new Error(data.error);
      return data;
    } finally { setLoading(false); }
  };

  const start = async () => {
    if (!email.includes("@")) return toast.error("Informe seu e-mail cadastrado");
    if (changeType !== "password" && !newValue) return toast.error("Informe o novo valor");
    if (changeType === "email" && !newValue.includes("@")) return toast.error("Novo e-mail inválido");
    try {
      const d = await call("start", { email, change_type: changeType, new_value: newValue || null });
      setToken(d.token);
      setStep("kba");
    } catch (e: any) { toast.error(e.message); }
  };

  const submitKba = async () => {
    if (!birthDate || cpf.replace(/\D/g, "").length < 4) return toast.error("Preencha data e 4 dígitos do CPF");
    try {
      const d = await call("verify_kba", { token, birth_date: birthDate, cpf_last4: cpf.replace(/\D/g, "").slice(-4) });
      if (!d.ok) {
        setAttemptsLeft(d.attempts_left);
        toast.error(`Dados não conferem. Tentativas restantes: ${d.attempts_left}`);
        if (d.attempts_left === 0) setStep("intro");
        return;
      }
      // Send code immediately
      const s = await call("send_code", { token });
      setRecipient(s.recipient_masked);
      setStep("code");
    } catch (e: any) { toast.error(e.message); setStep("intro"); }
  };

  const submitCode = async () => {
    if (code.replace(/\D/g, "").length !== 6) return toast.error("Código deve ter 6 dígitos");
    try {
      const d = await call("verify_code", { token, code: code.replace(/\D/g, "") });
      if (!d.ok) {
        toast.error(`Código incorreto. Tentativas restantes: ${d.attempts_left}`);
        return;
      }
      setStep("done");
    } catch (e: any) { toast.error(e.message); }
  };

  const Icon = changeType === "email" ? Mail : changeType === "phone" ? Phone : Lock;
  const labelByType = { email: "E-mail", phone: "Telefone/WhatsApp", password: "Senha" }[changeType];

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mb-2">
            <ShieldCheck className="w-6 h-6 text-primary" />
          </div>
          <CardTitle>Alterar meus dados</CardTitle>
          <p className="text-sm text-muted-foreground">Autoatendimento seguro · STH METHOD</p>
        </CardHeader>
        <CardContent className="space-y-4">
          {step === "intro" && (
            <>
              <div className="space-y-2">
                <Label>O que deseja alterar?</Label>
                <div className="grid grid-cols-3 gap-2">
                  {(["email", "phone", "password"] as ChangeType[]).map((t) => {
                    const I = t === "email" ? Mail : t === "phone" ? Phone : Lock;
                    const lbl = t === "email" ? "E-mail" : t === "phone" ? "Telefone" : "Senha";
                    return (
                      <button key={t} type="button" onClick={() => { setChangeType(t); setNewValue(""); }}
                        className={`p-3 rounded-lg border text-xs flex flex-col items-center gap-1 transition ${changeType === t ? "border-primary bg-primary/5" : "border-border"}`}>
                        <I className="w-4 h-4" /> {lbl}
                      </button>
                    );
                  })}
                </div>
              </div>
              <div className="space-y-2">
                <Label>Seu e-mail cadastrado</Label>
                <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)}
                  placeholder="email@exemplo.com" autoComplete="email" />
              </div>
              {changeType !== "password" && (
                <div className="space-y-2">
                  <Label>Novo {labelByType}</Label>
                  <Input type={changeType === "email" ? "email" : "tel"} value={newValue}
                    onChange={(e) => setNewValue(e.target.value)}
                    placeholder={changeType === "email" ? "novo@email.com" : "(11) 99999-9999"} />
                </div>
              )}
              <Button className="w-full" onClick={start} disabled={loading}>
                Continuar <ArrowRight className="w-4 h-4 ml-1" />
              </Button>
              <p className="text-xs text-muted-foreground text-center">
                Para sua segurança, vamos confirmar sua identidade antes de qualquer alteração.
              </p>
            </>
          )}

          {step === "kba" && (
            <>
              <Badge variant="secondary" className="w-full justify-center py-2">
                <Icon className="w-3.5 h-3.5 mr-1" /> Verificação de identidade
              </Badge>
              <div className="space-y-2">
                <Label>Data de nascimento</Label>
                <Input type="date" value={birthDate} onChange={(e) => setBirthDate(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>Últimos 4 dígitos do seu CPF</Label>
                <Input inputMode="numeric" maxLength={4} value={cpf}
                  onChange={(e) => setCpf(e.target.value.replace(/\D/g, "").slice(0, 4))}
                  placeholder="0000" />
              </div>
              <Button className="w-full" onClick={submitKba} disabled={loading}>Verificar</Button>
              {attemptsLeft !== null && (
                <p className="text-xs text-center text-muted-foreground">Tentativas restantes: {attemptsLeft}</p>
              )}
            </>
          )}

          {step === "code" && (
            <>
              <Badge variant="secondary" className="w-full justify-center py-2">
                <KeyRound className="w-3.5 h-3.5 mr-1" /> Código enviado para {recipient}
              </Badge>
              <div className="space-y-2">
                <Label>Código de 6 dígitos</Label>
                <Input inputMode="numeric" maxLength={6} value={code}
                  onChange={(e) => setCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
                  className="text-center text-2xl tracking-[0.5em] font-mono" placeholder="------" />
              </div>
              <Button className="w-full" onClick={submitCode} disabled={loading}>Confirmar alteração</Button>
              <p className="text-xs text-muted-foreground text-center">Código expira em 15 minutos.</p>
            </>
          )}

          {step === "done" && (
            <div className="text-center py-6 space-y-3">
              <CheckCircle2 className="w-14 h-14 text-emerald-500 mx-auto" />
              <h3 className="font-semibold text-lg">Alteração concluída!</h3>
              <p className="text-sm text-muted-foreground">
                {changeType === "password"
                  ? "Enviamos uma senha temporária para o seu e-mail atual. Faça login e troque-a no perfil."
                  : `Seu ${labelByType.toLowerCase()} foi atualizado com sucesso.`}
              </p>
              <Button variant="outline" className="w-full" onClick={() => window.location.href = "/login"}>
                Ir para login
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}