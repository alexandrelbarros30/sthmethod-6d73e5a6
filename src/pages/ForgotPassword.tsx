import { useState } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ArrowLeft } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.7, ease: [0.16, 1, 0.3, 1] as const } },
};

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
    <div className="min-h-screen bg-background text-foreground antialiased">
      <header className="fixed top-0 inset-x-0 z-50 bg-background/80 backdrop-blur-2xl border-b border-border/40">
        <div className="max-w-6xl mx-auto px-6 h-11 flex items-center justify-between">
          <Link to="/login" className="flex items-center gap-1.5 text-[12px] text-muted-foreground hover:text-foreground transition-colors">
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Login</span>
          </Link>
          <span className="text-[12px] font-semibold tracking-tight">STH METHOD</span>
          <span className="w-12" />
        </div>
      </header>

      <section className="pt-32 md:pt-40 pb-12 text-center px-6">
        <motion.p initial="hidden" animate="visible" variants={fadeUp} className="text-[12px] font-medium tracking-[0.25em] uppercase text-primary mb-6">
          Recuperação
        </motion.p>
        <motion.h1
          initial="hidden" animate="visible" variants={fadeUp}
          className="max-w-3xl mx-auto text-4xl sm:text-5xl md:text-7xl font-semibold tracking-[-0.04em] leading-[0.95] text-foreground"
        >
          Esqueci <br /><span className="text-muted-foreground">minha senha.</span>
        </motion.h1>
        <motion.p initial="hidden" animate="visible" variants={fadeUp} className="max-w-md mx-auto mt-6 text-base text-muted-foreground font-light">
          Informe seu e-mail e enviaremos um link para criar uma nova senha.
        </motion.p>
      </section>

      <motion.section initial="hidden" animate="visible" variants={fadeUp} className="max-w-md mx-auto px-6 pb-32">
        {sent ? (
          <div className="space-y-4 rounded-3xl border border-border/40 bg-muted/30 p-6 text-center">
            <p className="text-base text-foreground">Link enviado para <strong>{email}</strong>.</p>
            <p className="text-sm text-muted-foreground">Não recebeu? Verifique a pasta de spam ou tente reenviar em alguns minutos.</p>
            <Button variant="outline" className="w-full h-12 rounded-full" onClick={() => setSent(false)}>Reenviar</Button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-2">
              <Label htmlFor="email" className="text-[13px] font-medium text-muted-foreground">E-mail cadastrado</Label>
              <Input id="email" type="email" placeholder="seu@email.com" value={email} onChange={(e) => setEmail(e.target.value)} className="h-12 rounded-2xl border-border/60 bg-muted/30 px-4 text-base" required />
            </div>
            <Button type="submit" disabled={loading} className="w-full h-12 rounded-full bg-foreground text-background hover:bg-foreground/90 text-[15px] font-medium">
              {loading ? "Enviando..." : "Enviar link de recuperação"}
            </Button>
          </form>
        )}
        <div className="mt-6 text-center">
          <Link to="/alterar-dados" className="text-xs text-muted-foreground hover:text-foreground underline">
            Trocou de e-mail/telefone? Atualize seus dados aqui
          </Link>
        </div>
      </motion.section>
    </div>
  );
};

export default ForgotPassword;
