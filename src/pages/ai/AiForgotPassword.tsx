import { useState } from "react";
import { Link } from "react-router-dom";
import { ArrowLeft, Brain } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { useSthAiTheme } from "@/hooks/useSthAiTheme";
import { toast } from "sonner";

export default function AiForgotPassword() {
  useSthAiTheme();
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email.trim().toLowerCase(), {
        redirectTo: `${window.location.origin}/ai/redefinir-senha`,
      });
      if (error) throw error;
      setSent(true);
      toast.success("Enviamos um link para seu e-mail. Confira a caixa de entrada (e o spam).");
    } catch (err: any) {
      toast.error(err?.message || "Não foi possível enviar. Tente novamente.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="mx-auto flex max-w-5xl items-center justify-between px-4 py-5">
        <Link to="/ai/login" className="flex items-center gap-1.5 text-[12px] text-muted-foreground hover:text-foreground">
          <ArrowLeft className="h-3.5 w-3.5" /> Entrar
        </Link>
        <span className="grid h-8 w-8 place-items-center rounded-xl bg-primary/15 text-primary">
          <Brain className="h-4 w-4" />
        </span>
      </header>

      <section className="mx-auto max-w-md px-4 pb-24 pt-8">
        <h1 className="text-3xl font-semibold tracking-tight">Recuperar acesso</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Informe o e-mail cadastrado no STH AI e enviaremos um link para criar uma nova senha.
        </p>

        {sent ? (
          <div className="mt-8 space-y-4 rounded-2xl border border-border/60 bg-muted/30 p-6 text-center">
            <p className="text-sm">Link enviado para <strong>{email}</strong>.</p>
            <p className="text-xs text-muted-foreground">Não recebeu? Verifique o spam ou tente reenviar em alguns minutos.</p>
            <Button variant="outline" className="w-full rounded-2xl" onClick={() => setSent(false)}>Reenviar</Button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="mt-8 space-y-5">
            <div className="space-y-2">
              <Label htmlFor="ai-recover-email" className="text-[13px] text-muted-foreground">E-mail cadastrado</Label>
              <Input id="ai-recover-email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="seu@email.com" className="h-12 rounded-2xl" required />
            </div>
            <Button type="submit" size="lg" className="w-full rounded-2xl" disabled={loading}>
              {loading ? "Enviando…" : "Enviar link de recuperação"}
            </Button>
          </form>
        )}

        <p className="mt-6 text-center text-[12px] text-muted-foreground">
          Entrou com o Google? Use o botão “Continuar com Google” na tela de login.
        </p>
      </section>
    </div>
  );
}
