import { useEffect, useState } from "react";
import { useParams, useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { toast } from "@/hooks/use-toast";
import { Loader2, ShieldCheck, CheckCircle2, AlertCircle } from "lucide-react";

type Link = { id: string; code: string; label: string; amount: number; description: string | null; expires_at: string | null; active: boolean };

const fmt = (n: number) => n.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

export default function PagarLink() {
  const { code } = useParams<{ code: string }>();
  const [sp] = useSearchParams();
  const status = sp.get("status");

  const [link, setLink] = useState<Link | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [method, setMethod] = useState<"pix" | "credit">("pix");

  useEffect(() => {
    (async () => {
      if (!code) return;
      const { data, error } = await supabase
        .from("custom_payment_links")
        .select("id, code, label, amount, description, expires_at, active")
        .eq("code", code.toLowerCase())
        .maybeSingle();
      if (error) setError(error.message);
      else if (!data) setError("Link não encontrado.");
      else if (!data.active) setError("Este link está inativo.");
      else if (data.expires_at && new Date(data.expires_at) < new Date()) setError("Este link expirou.");
      else setLink({ ...data, amount: Number(data.amount) });
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
      const { data, error } = await supabase.functions.invoke("create-custom-payment", {
        body: { code: link.code, payer_name: name.trim(), payer_email: email.trim() || null, payer_phone: phone.replace(/\D/g, "") || null, method },
      });
      if (error) throw error;
      const url = (data as any)?.init_point || (data as any)?.sandbox_init_point;
      if (!url) throw new Error("Resposta inválida do gateway");
      window.location.href = url;
    } catch (err: any) {
      toast({ title: "Erro", description: err?.message || "Falha ao iniciar pagamento" });
      setSubmitting(false);
    }
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
            <CheckCircle2 className="w-4 h-4" /> Pagamento aprovado. Em instantes a equipe acerta seu plano.
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

        <form onSubmit={handleSubmit} className="space-y-4">
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
          <div>
            <Label>Forma de pagamento</Label>
            <div className="grid grid-cols-2 gap-2 mt-1">
              <button type="button" onClick={() => setMethod("pix")} className={`rounded-xl border px-3 py-2 text-sm font-medium transition ${method === "pix" ? "border-foreground bg-foreground text-background" : "border-border/60 hover:bg-muted"}`}>Pix</button>
              <button type="button" onClick={() => setMethod("credit")} className={`rounded-xl border px-3 py-2 text-sm font-medium transition ${method === "credit" ? "border-foreground bg-foreground text-background" : "border-border/60 hover:bg-muted"}`}>Cartão</button>
            </div>
          </div>

          <Button type="submit" disabled={submitting} className="w-full h-11 rounded-xl">
            {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : `Pagar ${fmt(link.amount)} com Mercado Pago`}
          </Button>
        </form>

        <div className="flex items-center gap-2 text-[11px] text-muted-foreground justify-center pt-2">
          <ShieldCheck className="w-3.5 h-3.5" />
          Ambiente seguro Mercado Pago. Nenhum dado de cartão fica conosco.
        </div>
      </Card>
    </div>
  );
}
