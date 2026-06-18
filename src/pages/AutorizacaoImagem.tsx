import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "@/hooks/use-toast";
import { Loader2, CheckCircle2, ShieldCheck } from "lucide-react";

type Consent = {
  id: string;
  token: string;
  payer_name: string;
  payer_email: string | null;
  payer_phone: string | null;
  authorized: boolean | null;
  allow_tagging: boolean | null;
  social_handle: string | null;
  signature_name: string | null;
  responded_at: string | null;
  has_user: boolean;
};

export default function AutorizacaoImagem() {
  const { token } = useParams<{ token: string }>();
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [consent, setConsent] = useState<Consent | null>(null);
  const [notFound, setNotFound] = useState(false);

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [authorized, setAuthorized] = useState<"yes" | "no" | "">("");
  const [allowTagging, setAllowTagging] = useState(false);
  const [socialHandle, setSocialHandle] = useState("");
  const [signature, setSignature] = useState("");

  useEffect(() => {
    (async () => {
      if (!token) return;
      const { data, error } = await supabase.rpc("get_image_consent_by_token", { _token: token });
      if (error || !data || (Array.isArray(data) && data.length === 0)) {
        setNotFound(true);
      } else {
        const c = (Array.isArray(data) ? data[0] : data) as Consent;
        setConsent(c);
        setName(c.payer_name || "");
        setEmail(c.payer_email || "");
        setPhone(c.payer_phone || "");
        if (c.authorized !== null) setAuthorized(c.authorized ? "yes" : "no");
        if (c.allow_tagging) setAllowTagging(true);
        setSocialHandle(c.social_handle || "");
        setSignature(c.signature_name || "");
      }
      setLoading(false);
    })();
  }, [token]);

  async function handleSubmit() {
    if (!authorized) { toast({ title: "Selecione se autoriza ou não" }); return; }
    if (signature.trim().length < 3) { toast({ title: "Assinatura obrigatória", description: "Digite seu nome completo." }); return; }
    if (!name.trim()) { toast({ title: "Informe seu nome completo" }); return; }
    setSubmitting(true);
    const { error } = await supabase.rpc("submit_image_consent", {
      _token: token!,
      _payer_name: name.trim(),
      _payer_email: email.trim() || null,
      _payer_phone: phone.trim() || null,
      _authorized: authorized === "yes",
      _allow_tagging: authorized === "yes" ? allowTagging : false,
      _social_handle: authorized === "yes" && allowTagging ? socialHandle.trim() : null,
      _signature_name: signature.trim(),
      _ip_address: null,
      _user_agent: navigator.userAgent.slice(0, 500),
    });
    setSubmitting(false);
    if (error) { toast({ title: "Erro ao enviar", description: error.message }); return; }
    setConsent((c) => c ? { ...c, authorized: authorized === "yes", responded_at: new Date().toISOString() } : c);
    toast({ title: "Resposta registrada", description: "Obrigado!" });
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="w-6 h-6 animate-spin text-primary" />
      </div>
    );
  }

  if (notFound) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <Card className="max-w-md w-full">
          <CardHeader><CardTitle>Link inválido</CardTitle></CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">Este link de autorização não foi encontrado ou expirou. Entre em contato com a STH METHOD.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const alreadyResponded = !!consent?.responded_at;

  return (
    <div className="min-h-screen bg-background py-10 px-4">
      <div className="max-w-2xl mx-auto">
        <div className="flex items-center gap-2 mb-6">
          <ShieldCheck className="w-6 h-6 text-primary" />
          <h1 className="text-xl font-semibold">Autorização de uso de imagem · STH METHOD</h1>
        </div>

        {alreadyResponded && (
          <Card className="mb-4 border-emerald-500/40 bg-emerald-500/5">
            <CardContent className="pt-6 flex items-start gap-3">
              <CheckCircle2 className="w-5 h-5 text-emerald-500 mt-0.5" />
              <div className="text-sm">
                <p className="font-medium">Resposta já registrada em {new Date(consent!.responded_at!).toLocaleString("pt-BR")}.</p>
                <p className="text-muted-foreground mt-1">Você pode atualizar sua decisão a qualquer momento abaixo.</p>
              </div>
            </CardContent>
          </Card>
        )}

        <Card>
          <CardHeader>
            <CardTitle className="text-base leading-relaxed">
              O(a) Sr.(a) autoriza a STH Method a utilizar suas fotos e imagens de evolução para divulgação em nossas redes sociais e materiais institucionais?
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-5">
            <p className="text-sm text-muted-foreground leading-relaxed">
              As imagens poderão ser publicadas <strong>sem identificação pessoal e sem marcação do seu perfil</strong>. Caso deseje ser identificado(a) ou marcado(a), isso será feito somente mediante sua autorização expressa abaixo.
            </p>

            <div className="grid sm:grid-cols-2 gap-3">
              <div>
                <Label>Nome completo *</Label>
                <Input value={name} onChange={(e) => setName(e.target.value)} />
              </div>
              <div>
                <Label>E-mail</Label>
                <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
              </div>
              <div className="sm:col-span-2">
                <Label>WhatsApp</Label>
                <Input value={phone} onChange={(e) => setPhone(e.target.value)} />
              </div>
            </div>

            <div className="space-y-2 pt-2">
              <Label>Sua decisão *</Label>
              <div className="grid sm:grid-cols-2 gap-2">
                <button type="button"
                  onClick={() => setAuthorized("yes")}
                  className={`p-4 rounded-xl border text-left transition ${authorized === "yes" ? "border-primary bg-primary/5" : "border-border hover:border-primary/40"}`}>
                  <p className="font-medium text-sm">✅ Autorizo a divulgação</p>
                  <p className="text-xs text-muted-foreground mt-1">Sem identificação por padrão.</p>
                </button>
                <button type="button"
                  onClick={() => setAuthorized("no")}
                  className={`p-4 rounded-xl border text-left transition ${authorized === "no" ? "border-destructive bg-destructive/5" : "border-border hover:border-destructive/40"}`}>
                  <p className="font-medium text-sm">❌ Não autorizo</p>
                  <p className="text-xs text-muted-foreground mt-1">Minhas imagens não serão usadas em redes sociais.</p>
                </button>
              </div>
            </div>

            {authorized === "yes" && (
              <div className="space-y-3 rounded-xl border p-4 bg-muted/30">
                <div className="flex items-start gap-2">
                  <Checkbox id="tag" checked={allowTagging} onCheckedChange={(v) => setAllowTagging(!!v)} className="mt-0.5" />
                  <div className="flex-1">
                    <Label htmlFor="tag" className="cursor-pointer">Autorizo também ser identificado(a) / marcado(a) nas publicações</Label>
                    <p className="text-xs text-muted-foreground mt-1">Opcional. Sem essa marcação as imagens são publicadas anonimamente.</p>
                  </div>
                </div>
                {allowTagging && (
                  <div>
                    <Label>@perfil para marcação (Instagram)</Label>
                    <Input placeholder="@seuperfil" value={socialHandle} onChange={(e) => setSocialHandle(e.target.value)} />
                  </div>
                )}
              </div>
            )}

            <div className="pt-2">
              <Label>Assinatura (digite seu nome completo) *</Label>
              <Input value={signature} onChange={(e) => setSignature(e.target.value)} placeholder="Confirme digitando seu nome completo" />
              <p className="text-[11px] text-muted-foreground mt-1">Ao enviar, você confirma a decisão acima e fica registrado data, IP e dispositivo.</p>
            </div>

            <Button className="w-full" size="lg" onClick={handleSubmit} disabled={submitting}>
              {submitting ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
              {alreadyResponded ? "Atualizar resposta" : "Enviar resposta"}
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}