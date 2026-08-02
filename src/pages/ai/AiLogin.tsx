import { useEffect, useState } from "react";
import { useSthAiTheme } from "@/hooks/useSthAiTheme";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { Brain, ArrowLeft, Eye, EyeOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export default function AiLogin() {
  useSthAiTheme();
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const next = params.get("next") || "/ai/app";
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) navigate(next, { replace: true });
    });
    const { data: sub } = supabase.auth.onAuthStateChange((_e, session) => {
      if (session) navigate(next, { replace: true });
    });
    return () => sub.subscription.unsubscribe();
  }, [navigate, next]);

  const friendlyError = (msg: string) => {
    const m = msg.toLowerCase();
    if (m.includes("already registered") || m.includes("already been registered"))
      return "Este e-mail já possui conta. Faça login ou recupere a senha.";
    if (m.includes("invalid login credentials")) return "E-mail ou senha incorretos.";
    if (m.includes("password should be")) return "A senha deve ter no mínimo 6 caracteres.";
    if (m.includes("email rate limit") || m.includes("too many"))
      return "Muitas tentativas. Aguarde alguns minutos e tente novamente.";
    return msg;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanEmail = email.trim().toLowerCase();
    setLoading(true);
    try {
      if (isSignUp) {
        if (!fullName.trim()) { toast.error("Informe seu nome"); return; }
        if (password.length < 6) { toast.error("A senha deve ter no mínimo 6 caracteres."); return; }
        const { data, error } = await supabase.auth.signUp({
          email: cleanEmail,
          password,
          options: {
            data: { full_name: fullName.trim() },
            emailRedirectTo: `${window.location.origin}/ai/onboarding`,
          },
        });
        if (error) throw error;
        // Supabase devolve um usuário "fantasma" (sem identities) quando o e-mail já existe
        if (data.user && Array.isArray(data.user.identities) && data.user.identities.length === 0) {
          toast.error("Este e-mail já possui conta. Faça login para continuar.");
          setIsSignUp(false);
          return;
        }
        if (!data.session) {
          toast.success("Conta criada. Confirme seu e-mail para continuar.");
          return;
        }
        navigate("/ai/onboarding", { replace: true });
        return;
      }
      const { error } = await supabase.auth.signInWithPassword({ email: cleanEmail, password });
      if (error) throw error;
      navigate(next, { replace: true });
    } catch (err: any) {
      toast.error(friendlyError(err?.message || "") || "Não foi possível entrar");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="mx-auto flex max-w-5xl items-center justify-between px-4 py-5">
        <Link to="/ai" className="flex items-center gap-1.5 text-[12px] text-muted-foreground hover:text-foreground">
          <ArrowLeft className="h-3.5 w-3.5" /> STH METHOD AI
        </Link>
        <span className="grid h-8 w-8 place-items-center rounded-xl bg-primary/15 text-primary">
          <Brain className="h-4 w-4" />
        </span>
      </header>

      <section className="mx-auto max-w-md px-4 pb-24 pt-8">
        <h1 className="text-3xl font-semibold tracking-tight">
          {isSignUp ? "Criar conta no app" : "Entrar no app"}
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Acesso exclusivo ao STH METHOD AI — cardápio, treino e evolução em ciclos.
        </p>

        <form onSubmit={handleSubmit} className="mt-8 space-y-5">
          {isSignUp && (
            <div className="space-y-2">
              <Label htmlFor="ai-name" className="text-[13px] text-muted-foreground">Nome completo</Label>
              <Input id="ai-name" value={fullName} onChange={(e) => setFullName(e.target.value)} placeholder="Seu nome" className="h-12 rounded-2xl" required />
            </div>
          )}
          <div className="space-y-2">
            <Label htmlFor="ai-email" className="text-[13px] text-muted-foreground">E-mail</Label>
            <Input id="ai-email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="seu@email.com" className="h-12 rounded-2xl" required />
          </div>
          <div className="space-y-2">
            <Label htmlFor="ai-pass" className="text-[13px] text-muted-foreground">Senha</Label>
            <div className="relative">
              <Input id="ai-pass" type={showPassword ? "text" : "password"} value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" className="h-12 rounded-2xl pr-12" required minLength={6} />
              <button type="button" onClick={() => setShowPassword((v) => !v)} className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground" aria-label="Mostrar senha">
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>

          <Button type="submit" size="lg" className="w-full rounded-2xl" disabled={loading}>
            {loading ? "Aguarde…" : isSignUp ? "Criar conta" : "Entrar"}
          </Button>
        </form>

        <button
          type="button"
          onClick={() => setIsSignUp((v) => !v)}
          className="mt-6 w-full text-center text-[13px] text-muted-foreground hover:text-foreground"
        >
          {isSignUp ? "Já tenho conta — entrar" : "Ainda não tenho conta — criar"}
        </button>
      </section>
    </div>
  );
}
