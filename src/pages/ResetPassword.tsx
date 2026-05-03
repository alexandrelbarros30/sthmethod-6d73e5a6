import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ArrowLeft, Eye, EyeOff } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.7, ease: [0.16, 1, 0.3, 1] as const } },
};

const ResetPassword = () => {
  const navigate = useNavigate();
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [recoveryReady, setRecoveryReady] = useState(false);

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === "PASSWORD_RECOVERY") setRecoveryReady(true);
    });
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) setRecoveryReady(true);
    });
    return () => subscription.unsubscribe();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password.length < 6) { toast.error("A senha deve ter pelo menos 6 caracteres"); return; }
    if (password !== confirm) { toast.error("As senhas não coincidem"); return; }
    setLoading(true);
    try {
      const { error } = await supabase.auth.updateUser({ password });
      if (error) throw error;
      toast.success("Senha atualizada com sucesso!");
      await supabase.auth.signOut();
      navigate("/login", { replace: true });
    } catch (err: any) {
      toast.error(err.message || "Não foi possível atualizar a senha. Solicite um novo link.");
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
          Nova senha
        </motion.p>
        <motion.h1
          initial="hidden" animate="visible" variants={fadeUp}
          className="max-w-3xl mx-auto text-4xl sm:text-5xl md:text-7xl font-semibold tracking-[-0.04em] leading-[0.95] text-foreground"
        >
          Redefinir <br /><span className="text-muted-foreground">senha.</span>
        </motion.h1>
      </section>

      <motion.section initial="hidden" animate="visible" variants={fadeUp} className="max-w-md mx-auto px-6 pb-32">
        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="space-y-2">
            <Label htmlFor="password" className="text-[13px] font-medium text-muted-foreground">Nova senha</Label>
            <div className="relative">
              <Input id="password" type={showPassword ? "text" : "password"} placeholder="••••••••" value={password} onChange={(e) => setPassword(e.target.value)} className="h-12 rounded-2xl border-border/60 bg-muted/30 px-4 pr-12 text-base" required minLength={6} />
              <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors">
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="confirm" className="text-[13px] font-medium text-muted-foreground">Confirmar nova senha</Label>
            <Input id="confirm" type={showPassword ? "text" : "password"} placeholder="••••••••" value={confirm} onChange={(e) => setConfirm(e.target.value)} className="h-12 rounded-2xl border-border/60 bg-muted/30 px-4 text-base" required minLength={6} />
          </div>
          <Button type="submit" disabled={loading} className="w-full h-12 rounded-full bg-foreground text-background hover:bg-foreground/90 text-[15px] font-medium">
            {loading ? "Atualizando..." : "Salvar nova senha"}
          </Button>
          {!recoveryReady && (
            <p className="text-[11px] text-muted-foreground/70 text-center">
              Abra esta página pelo link enviado ao seu e-mail para garantir o reset.
            </p>
          )}
        </form>
      </motion.section>
    </div>
  );
};

export default ResetPassword;
