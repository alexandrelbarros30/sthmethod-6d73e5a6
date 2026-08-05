import { useEffect, useState } from "react";
import { useSthAiTheme } from "@/hooks/useSthAiTheme";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { signInWithGoogleNative } from "@/utils/ai/auth-utils";
import { Brain, ArrowLeft, Eye, EyeOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable";
import { toast } from "sonner";

export default function AiLogin() {
  useSthAiTheme();
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const nextParam = params.get("next");
  const storedNext = typeof window !== "undefined" ? (sessionStorage.getItem("sthai_oauth_next") || localStorage.getItem("sthai_oauth_next")) : null;
  const next = nextParam || storedNext || "/ai/app";
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) {
        try { sessionStorage.removeItem("sthai_oauth_next"); localStorage.removeItem("sthai_oauth_next"); } catch {}
        navigate(next, { replace: true });
      }
    });
    const { data: sub } = supabase.auth.onAuthStateChange((_e, session) => {
      if (session) {
        try { sessionStorage.removeItem("sthai_oauth_next"); localStorage.removeItem("sthai_oauth_next"); } catch {}
        navigate(next, { replace: true });
      }
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
        supabase.functions.invoke("send-transactional-email", {
          body: {
            templateName: "sth-ai-welcome",
            recipientEmail: cleanEmail,
            idempotencyKey: `sthai-welcome-${data.user?.id ?? cleanEmail}`,
            templateData: { name: fullName.trim() },
          },
        }).catch(() => {});
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
          <Link to="/ai/instalar" className="block mt-2 text-primary hover:underline font-medium">
            Baixar o arquivo APK atualizado (Pós-Build STHia)
          </Link>
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
          {!isSignUp && (
            <div className="text-center">
              <Link to="/ai/esqueci-senha" className="text-[13px] text-muted-foreground hover:text-foreground underline">
                Esqueci minha senha
              </Link>
            </div>
          )}
        </form>

        <div className="mt-6 flex items-center gap-3">
          <div className="h-px flex-1 bg-border/60" />
          <span className="text-[11px] uppercase tracking-[0.2em] text-muted-foreground">ou</span>
          <div className="h-px flex-1 bg-border/60" />
        </div>

        <Button
          type="button"
          variant="outline"
          size="lg"
          disabled={loading}
          onClick={async () => {
            try {
              setLoading(true);
              try { sessionStorage.setItem("sthai_oauth_next", next); } catch {}
              const result = await lovable.auth.signInWithOAuth("google", {
                redirect_uri: `${window.location.origin}/ai/login`,
              });
              });
              if (result.error) {
                toast.error("Não foi possível entrar com o Google");
                setLoading(false);
                return;
              }
              if (result.redirected) return;
              navigate(next, { replace: true });
            } catch (err: any) {
              toast.error(err?.message || "Erro ao entrar com o Google");
              setLoading(false);
            }
          }}
          className="mt-6 flex w-full items-center justify-center gap-3 rounded-2xl"
        >
          <svg width="18" height="18" viewBox="0 0 48 48" aria-hidden="true">
            <path fill="#FFC107" d="M43.611 20.083H42V20H24v8h11.303c-1.649 4.657-6.08 8-11.303 8-6.627 0-12-5.373-12-12s5.373-12 12-12c3.059 0 5.842 1.154 7.961 3.039l5.657-5.657C34.046 6.053 29.268 4 24 4 12.955 4 4 12.955 4 24s8.955 20 20 20 20-8.955 20-20c0-1.341-.138-2.65-.389-3.917z"/>
            <path fill="#FF3D00" d="M6.306 14.691l6.571 4.819C14.655 15.108 18.961 12 24 12c3.059 0 5.842 1.154 7.961 3.039l5.657-5.657C34.046 6.053 29.268 4 24 4 16.318 4 9.656 8.337 6.306 14.691z"/>
            <path fill="#4CAF50" d="M24 44c5.166 0 9.86-1.977 13.409-5.192l-6.19-5.238C29.211 35.091 26.715 36 24 36c-5.202 0-9.619-3.317-11.283-7.946l-6.522 5.025C9.505 39.556 16.227 44 24 44z"/>
            <path fill="#1976D2" d="M43.611 20.083H42V20H24v8h11.303c-.792 2.237-2.231 4.166-4.094 5.571.001-.001.002-.001.003-.002l6.19 5.238C36.971 39.205 44 34 44 24c0-1.341-.138-2.65-.389-3.917z"/>
          </svg>
          Continuar com Google
        </Button>

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
