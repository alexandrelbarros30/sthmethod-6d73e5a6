import { useEffect, useState } from "react";
import { useParams, useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { toast } from "@/hooks/use-toast";
import { Loader2, ShieldCheck, CheckCircle2, AlertCircle, Lock, Copy, QrCode } from "lucide-react";

type Link = { id: string; code: string; label: string; amount: number; description: string | null; expires_at: string | null; active: boolean; has_student: boolean };
type StudentInfo = { full_name: string | null; email: string | null; phone: string | null };
type PixData = { qr_code: string | null; qr_code_base64: string | null; ticket_url: string | null; expires_at: string | null };

const fmt = (n: number) => n.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

export default function PagarLink() {
  const { code } = useParams<{ code: string }>();
  const [sp] = useSearchParams();
  const status = sp.get("status");

  const [link, setLink] = useState<Link | null>(null);
  const [student, setStudent] = useState<StudentInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [pix, setPix] = useState<PixData | null>(null);

  useEffect(() => {
    (async () => {
      if (!code) return;
      const { data, error } = await supabase.functions.invoke("get-custom-payment-link", {
        body: { code: code.toLowerCase() },
      });
      if (error) setError(error.message);
      else {
        const l = (data as any)?.link;
        const s = (data as any)?.student as StudentInfo | null;
        if (!l) setError("Link não encontrado.");
        else if (!l.active) setError("Este link está inativo.");
        else if (l.expires_at && new Date(l.expires_at) < new Date()) setError("Este link expirou.");
        else {
          setLink(l);
          if (s) {
            setStudent(s);
            setName(s.full_name || "");
            setEmail(s.email || "");
            setPhone(s.phone || "");
          }
        }
      }
      setLoading(false);
    })();
  }, [code]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!link || submitting) return;
    if (!name.trim() || name.trim().length < 2) {
      toast({ title: "Informe seu nome completo" });
      return;
    }
    setSubmitting(true);
    try {
      const { data, error } = await supabase.functions.invoke("create-custom-pix", {
        body: { code: link.code, payer_name: name.trim(), payer_email: email.trim() || null, payer_phone: phone.replace(/\D/g, "") || null },
      });
      if (error) throw error;
      const d = data as any;
      if (d?.error) throw new Error(d.error);
      if (!d?.qr_code && !d?.ticket_url) throw new Error("Resposta inválida do gateway");
      setPix({
        qr_code: d.qr_code || null,
        qr_code_base64: d.qr_code_base64 || null,
        ticket_url: d.ticket_url || null,
        expires_at: d.expires_at || null,
      });
    } catch (err: any) {
      toast({ title: "Erro", description: err?.message || "Falha ao iniciar pagamento" });
    } finally {
      setSubmitting(false);
    }
  }

  function copyPix() {
    if (!pix?.qr_code) return;
    navigator.clipboard.writeText(pix.qr_code);
    toast({ title: "Código Pix copiado", description: "Cole no app do seu banco." });
  }

  if (loading) {
    return (
      <div className="min-h-screen grid place-items-center bg-background">
        <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (error || !link) {
    return (
      <div className="min-h-screen grid place-items-center bg-background px-6">
        <Card className="max-w-md w-full p-8 text-center space-y-3">
          <AlertCircle className="w-10 h-10 text-destructive mx-auto" />
          <h1 className="text-lg font-semibold">Não foi possível abrir este link</h1>
          <p className="text-sm text-muted-foreground">{error || "Tente novamente mais tarde."}</p>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-4 py-10">
      <Card className="max-w-md w-full p-7 space-y-6 border-border/60">
        <header className="text-center space-y-2">
          <p className="text-[11px] tracking-[0.25em] uppercase text-muted-foreground">STH METHOD</p>
          <h1 className="text-xl font-semibold">{link.label}</h1>
          {link.description && <p className="text-sm text-muted-foreground whitespace-pre-line">{link.description}</p>}
        </header>

        <div className="bg-muted/40 border border-border/50 rounded-2xl p-5 text-center">
          <p className="text-xs text-muted-foreground">Valor a pagar</p>
          <p className="text-3xl font-semibold mt-1">{fmt(link.amount)}</p>
        </div>

        {status === "approved" && (
          <div className="flex items-center gap-2 text-emerald-600 text-sm border border-emerald-500/30 bg-emerald-500/10 rounded-xl px-3 py-2">
            <CheckCircle2 className="w-4 h-4" /> Pix recebido. Em instantes a equipe acerta seu plano com o consultor.
          </div>
        )}
        {status === "pending" && (
          <div className="text-amber-700 text-sm border border-amber-500/30 bg-amber-500/10 rounded-xl px-3 py-2">
            Pagamento em processamento. Você receberá a confirmação em breve.
          </div>
        )}
        {status === "failed" && (
          <div className="text-destructive text-sm border border-destructive/30 bg-destructive/10 rounded-xl px-3 py-2">
            Pagamento não concluído. Tente novamente.
          </div>
        )}

        {pix ? (
          <div className="space-y-4">
            <div className="rounded-2xl border border-emerald-500/30 bg-emerald-500/5 p-4 text-center space-y-3">
              <div className="flex items-center justify-center gap-2 text-[11px] uppercase tracking-wider text-emerald-700">
                <QrCode className="w-3.5 h-3.5" /> Pix gerado · pague agora
              </div>
              {pix.qr_code_base64 && (
                <img
                  src={`data:image/png;base64,${pix.qr_code_base64}`}
                  alt="QR Code Pix"
                  className="mx-auto w-56 h-56 rounded-lg bg-white p-2"
                />
              )}
              {pix.qr_code && (
                <div className="space-y-2">
                  <p className="text-[11px] text-muted-foreground">ou copie o código Pix abaixo</p>
                  <div className="bg-background border border-border/60 rounded-xl p-2 text-[10px] font-mono break-all max-h-24 overflow-auto">
                    {pix.qr_code}
                  </div>
                  <Button type="button" variant="outline" className="w-full" onClick={copyPix}>
                    <Copy className="w-4 h-4 mr-2" /> Copiar código Pix
                  </Button>
                </div>
              )}
              {pix.ticket_url && (
                <a href={pix.ticket_url} target="_blank" rel="noreferrer" className="text-xs text-emerald-700 underline block">
                  Abrir página oficial do Mercado Pago
                </a>
              )}
              {pix.expires_at && (
                <p className="text-[10px] text-muted-foreground">
                  Válido até {new Date(pix.expires_at).toLocaleString("pt-BR")}
                </p>
              )}
            </div>
            <Button type="button" variant="ghost" className="w-full" onClick={() => setPix(null)}>
              Gerar novo Pix
            </Button>
          </div>
        ) : (
        <form onSubmit={handleSubmit} className="space-y-4">
          {link.has_student && student ? (
            <div className="rounded-2xl border border-emerald-500/30 bg-emerald-500/5 p-4 space-y-2">
              <div className="flex items-center gap-2 text-[11px] uppercase tracking-wider text-emerald-700">
                <Lock className="w-3.5 h-3.5" /> Link exclusivo deste aluno
              </div>
              <div className="text-sm">
                <p className="font-semibold text-foreground">{student.full_name || "—"}</p>
                {student.email && <p className="text-xs text-muted-foreground">{student.email}</p>}
                {student.phone && <p className="text-xs text-muted-foreground">{student.phone}</p>}
              </div>
              <p className="text-[11px] text-muted-foreground">
                O Pix será registrado automaticamente na conta deste aluno. Se você não é {student.full_name?.split(" ")[0] || "este aluno"}, não prossiga.
              </p>
            </div>
          ) : (
            <>
              <div>
                <Label htmlFor="name">Nome completo</Label>
                <Input id="name" value={name} onChange={(e) => setName(e.target.value)} required placeholder="Como aparece no documento" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label htmlFor="email">E-mail</Label>
                  <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="(opcional)" />
                </div>
                <div>
                  <Label htmlFor="phone">WhatsApp</Label>
                  <Input id="phone" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="(opcional)" />
                </div>
              </div>
            </>
          )}
          <div className="rounded-xl border border-border/60 bg-muted/30 px-3 py-2 text-center text-xs text-muted-foreground">
            Pagamento exclusivo via <span className="font-semibold text-foreground">Pix</span> — aprovação imediata.
          </div>

          <Button type="submit" disabled={submitting} className="w-full h-11 rounded-xl">
            {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : `Pagar ${fmt(link.amount)} via Pix`}
          </Button>
        </form>
        )}

        <div className="flex items-center gap-2 text-[11px] text-muted-foreground justify-center pt-2">
          <ShieldCheck className="w-3.5 h-3.5" />
          Ambiente seguro Mercado Pago. Nenhum dado de cartão fica conosco.
        </div>
      </Card>
    </div>
  );
}
