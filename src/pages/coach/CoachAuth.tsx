import { useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { motion } from "framer-motion";
import { Dumbbell, Eye, EyeOff, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

const CoachAuth = () => {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const redirect = params.get("redirect") || "/coach/painel";
  const [mode, setMode] = useState<"signin" | "signup">(params.get("modo") === "criar" ? "signup" : "signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (mode === "signup") {
        if (!fullName.trim()) throw new Error("Informe seu nome completo");
        if (password.length < 8) throw new Error("A senha precisa ter no mínimo 8 caracteres");
        const { error } = await supabase.auth.signUp({
          email: email.trim(),
          password,
          options: { data: { full_name: fullName.trim() }, emailRedirectTo: window.location.origin + "/coach/painel" },
        });
        if (error) throw error;
        toast.success("Conta criada. Verifique seu e-mail se a confirmação estiver ativa.");
        navigate(redirect, { replace: true });
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email: email.trim(), password });
        if (error) throw error;
        navigate(redirect, { replace: true });
      }
    } catch (err: any) {
      toast.error(err?.message || "Não foi possível continuar");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-5 py-12">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
        className="w-full max-w-sm"
      >
        <Link to="/coach" className="inline-flex items-center gap-1.5 text-[12px] text-muted-foreground mb-6 hover:text-foreground transition-colors">
          <ArrowLeft className="h-3.5 w-3.5" /> Voltar
        </Link>
        <Card className="p-7 rounded-2xl border-border/60">
          <div className="flex items-center gap-2.5 mb-7">
            <div className="h-9 w-9 rounded-xl bg-primary/15 flex items-center justify-center">
              <Dumbbell className="h-4 w-4 text-primary" strokeWidth={2} />
            </div>
            <div>
              <p className="text-[13px] font-semibold tracking-[-0.02em]">STH METHOD COACH</p>
              <p className="text-[11px] text-muted-foreground">
                {mode === "signup" ? "Crie sua conta" : "Acesse seu ambiente"}
              </p>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {mode === "signup" && (
              <div className="space-y-1.5">
                <Label htmlFor="coach-name" className="text-[12px]">Nome completo</Label>
                <Input id="coach-name" value={fullName} onChange={(e) => setFullName(e.target.value)} required maxLength={120} />
              </div>
            )}
            <div className="space-y-1.5">
              <Label htmlFor="coach-email" className="text-[12px]">E-mail</Label>
              <Input id="coach-email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required maxLength={255} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="coach-pass" className="text-[12px]">Senha</Label>
              <div className="relative">
                <Input
                  id="coach-pass"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  minLength={8}
                  className="pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  aria-label={showPassword ? "Ocultar senha" : "Mostrar senha"}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>
            <Button type="submit" disabled={loading} className="w-full rounded-full">
              {loading ? "Aguarde..." : mode === "signup" ? "Criar conta" : "Entrar"}
            </Button>
          </form>

          {mode === "signin" && (
            <button
              type="button"
              onClick={async () => {
                if (!email.trim()) return toast.error("Informe seu e-mail para redefinir a senha");
                const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), {
                  redirectTo: `${window.location.origin}/reset-password`,
                });
                if (error) toast.error("Não foi possível enviar o e-mail");
                else toast.success("Enviamos um link de redefinição para seu e-mail");
              }}
              className="mt-4 w-full text-[12px] text-muted-foreground hover:text-foreground transition-colors"
            >
              Esqueci minha senha
            </button>
          )}

          <button
            onClick={() => setMode(mode === "signup" ? "signin" : "signup")}
            className="mt-5 w-full text-[12px] text-muted-foreground hover:text-foreground transition-colors"
          >
            {mode === "signup" ? "Já tenho conta — entrar" : "Não tenho conta — criar agora"}
          </button>
        </Card>
      </motion.div>
    </div>
  );
};

export default CoachAuth;