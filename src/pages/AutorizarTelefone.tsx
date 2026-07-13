import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "sonner";
import { Loader2, ShieldCheck, CheckCircle2, XCircle, Clock, AlertTriangle } from "lucide-react";
import { LEGAL } from "@/lib/legal-version";

const relLabels: Record<string, string> = {
  marido: "Marido", esposa: "Esposa", parceiro: "Parceiro(a)",
  pai_mae: "Pai / Mãe", filho_filha: "Filho(a)",
  responsavel: "Responsável legal", outro: "Outro",
};

type State =
  | { kind: "loading" }
  | { kind: "invalid" }
  | { kind: "expired" }
  | { kind: "answered"; authorized: boolean }
  | { kind: "valid"; data: {
      student_name: string; holder_name: string; phone_masked: string;
      relationship: string; reason: string | null; expires_at: string;
    } }
  | { kind: "done"; authorized: boolean };

export default function AutorizarTelefone() {
  const [sp] = useSearchParams();
  const token = sp.get("token") || "";
  const [state, setState] = useState<State>({ kind: "loading" });
  const [signature, setSignature] = useState("");
  const [agreed, setAgreed] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!token) { setState({ kind: "invalid" }); return; }
    (async () => {
      const { data, error } = await supabase.rpc("get_authorized_contact_by_token", { _token: token });
      if (error || !data) { setState({ kind: "invalid" }); return; }
      const d = data as any;
      if (d.state === "invalid") return setState({ kind: "invalid" });
      if (d.state === "expired") return setState({ kind: "expired" });
      if (d.state === "answered") return setState({ kind: "answered", authorized: !!d.authorized });
      setState({ kind: "valid", data: d });
    })();
  }, [token]);

  const submit = async (authorized: boolean) => {
    if (!signature.trim() || signature.trim().length < 3) {
      toast.error("Digite seu nome completo como assinatura.");
      return;
    }
    if (authorized && !agreed) {
      toast.error("Você precisa confirmar a ciência LGPD.");
      return;
    }
    setSubmitting(true);
    try {
      const ua = navigator.userAgent;
      // IP capturado no servidor via cabeçalho já é ideal, mas RPC não vê req; usamos fallback vazio.
      const { error } = await supabase.rpc("confirm_authorized_contact", {
        _token: token,
        _authorized: authorized,
        _signature_name: signature.trim(),
        _ip: null,
        _user_agent: ua,
        _terms_version: LEGAL.termsVersion,
      });
      if (error) throw error;
      setState({ kind: "done", authorized });
    } catch (e: any) {
      toast.error(e.message || "Falha ao registrar resposta.");
    } finally {
      setSubmitting(false);
    }
  };

  const wrap = (children: React.ReactNode) => (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-lg">{children}</div>
    </div>
  );

  if (state.kind === "loading") {
    return wrap(
      <div className="flex items-center justify-center gap-2 text-muted-foreground">
        <Loader2 className="w-5 h-5 animate-spin" /> Carregando...
      </div>,
    );
  }

  if (state.kind === "invalid") {
    return wrap(
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <XCircle className="w-5 h-5 text-rose-500" /> Link inválido
          </CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground">
          Este link não é válido. Se você recebeu por e-mail, tente clicar novamente ou solicite um novo à nossa equipe.
        </CardContent>
      </Card>,
    );
  }

  if (state.kind === "expired") {
    return wrap(
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Clock className="w-5 h-5 text-amber-500" /> Link expirado
          </CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground">
          Por segurança, o link tem validade de 48 horas. Solicite à nossa equipe o reenvio da autorização.
        </CardContent>
      </Card>,
    );
  }

  if (state.kind === "answered") {
    return wrap(
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <CheckCircle2 className="w-5 h-5 text-emerald-500" /> Já respondido
          </CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground">
          Esta solicitação já foi {state.authorized ? "autorizada" : "recusada"}. Se precisar alterar, fale com nossa equipe.
        </CardContent>
      </Card>,
    );
  }

  if (state.kind === "done") {
    return wrap(
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            {state.authorized ? (
              <><CheckCircle2 className="w-5 h-5 text-emerald-500" /> Autorização registrada</>
            ) : (
              <><XCircle className="w-5 h-5 text-rose-500" /> Recusa registrada</>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground space-y-2">
          <p>
            Obrigado! Sua resposta foi registrada com aceite eletrônico (LGPD).
            Você pode revogar essa autorização a qualquer momento pela plataforma.
          </p>
        </CardContent>
      </Card>,
    );
  }

  const d = state.data;
  const rel = relLabels[d.relationship] || d.relationship;
  const expiresStr = new Date(d.expires_at).toLocaleString("pt-BR");

  return wrap(
    <Card>
      <CardHeader className="space-y-1">
        <div className="flex items-center gap-2 text-xs text-muted-foreground uppercase tracking-widest">
          <ShieldCheck className="w-4 h-4" /> STH METHOD · Autorização
        </div>
        <CardTitle className="text-xl">Autorizar contato adicional</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4 text-sm">
        <p className="text-muted-foreground">
          Olá{d.student_name ? `, ${d.student_name.split(" ")[0]}` : ""}. Você recebeu esta solicitação por ser o titular do cadastro.
          Confirme se autoriza o telefone abaixo a receber informações do seu acompanhamento.
        </p>

        <div className="rounded-lg border bg-muted/40 p-3 space-y-1">
          <div><span className="text-muted-foreground">Titular do telefone:</span> <strong>{d.holder_name}</strong></div>
          <div><span className="text-muted-foreground">Relação:</span> {rel}</div>
          <div><span className="text-muted-foreground">Telefone:</span> {d.phone_masked}</div>
          {d.reason && <div className="text-xs text-muted-foreground italic mt-1">Motivo: {d.reason}</div>}
        </div>

        <div className="rounded-lg border border-amber-500/30 bg-amber-500/5 p-3 flex gap-2 text-xs">
          <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
          <p>
            Ao autorizar, o titular acima poderá tratar informações do seu acompanhamento (dieta, treino, evolução) com nossa equipe.
            Você pode revogar a qualquer momento. Link válido até <strong>{expiresStr}</strong>.
          </p>
        </div>

        <div className="space-y-2">
          <Label htmlFor="sig">Assinatura eletrônica (seu nome completo)</Label>
          <Input id="sig" value={signature} onChange={(e) => setSignature(e.target.value)} placeholder="Nome completo" />
        </div>

        <label className="flex items-start gap-2 text-xs cursor-pointer">
          <Checkbox checked={agreed} onCheckedChange={(v) => setAgreed(!!v)} />
          <span>
            Declaro que sou o titular do cadastro e concordo, nos termos da LGPD, que o telefone acima receba dados do meu acompanhamento.
          </span>
        </label>

        <div className="flex gap-2 pt-2">
          <Button
            variant="outline"
            className="flex-1 text-rose-600 border-rose-500/40 hover:bg-rose-500/10"
            onClick={() => submit(false)}
            disabled={submitting}
          >
            {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <><XCircle className="w-4 h-4 mr-1" /> Recusar</>}
          </Button>
          <Button
            className="flex-1"
            onClick={() => submit(true)}
            disabled={submitting}
          >
            {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <><CheckCircle2 className="w-4 h-4 mr-1" /> Autorizar</>}
          </Button>
        </div>

        <p className="text-[10px] text-muted-foreground text-center pt-2">
          Termo v.{LEGAL.termsVersion} · sthmethod.com.br
        </p>
      </CardContent>
    </Card>,
  );
}