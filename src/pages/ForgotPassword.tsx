import { useState } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Mail, ArrowLeft } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

const ForgotPassword = () => {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), {
        redirectTo: `${window.location.origin}/reset-password`,
      });
      if (error) throw error;
      setSent(true);
      toast.success("Enviamos um link para seu e-mail. Confira a caixa de entrada (e o spam).");
    } catch (err: any) {
      toast.error(err.message || "Não foi possível enviar. Tente novamente.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-8 bg-background">
      <div className="w-full max-w-md space-y-8">
        <div>
          <Link to="/login" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors mb-8">
            <ArrowLeft className="w-4 h-4" /> Voltar ao login
          </Link>
          <h2 className="text-2xl font-bold text-foreground font-display">Esqueci minha senha</h2>
          <p className="text-muted-foreground mt-2 font-body text-sm">
            Informe seu e-mail e enviaremos um link para você criar uma nova senha.
          </p>
        </div>

        {sent ? (
          <div className="space-y-4 rounded-lg border border-border bg-muted/30 p-4">
            <p className="text-sm text-foreground font-body">
              ✅ Link enviado para <strong>{email}</strong>.
            </p>
            <p className="text-xs text-muted-foreground font-body">
              Não recebeu? Verifique a pasta de spam ou tente reenviar em alguns minutos.
            </p>
            <Button variant="outline" className="w-full" onClick={() => setSent(false)}>
              Reenviar
            </Button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-2">
              <Label htmlFor="email" className="font-body">E-mail cadastrado</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  id="email"
                  type="email"
                  placeholder="seu@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="pl-10"
                  required
                />
              </div>
            </div>
            <Button type="submit" className="w-full" size="lg" disabled={loading}>
              {loading ? "Enviando..." : "Enviar link de recuperação"}
            </Button>
          </form>
        )}
      </div>
    </div>
  );
};

export default ForgotPassword;
