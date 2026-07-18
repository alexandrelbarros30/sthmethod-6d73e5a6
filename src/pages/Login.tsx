import { useState } from "react";
import { useNavigate, Link, useSearchParams } from "react-router-dom";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ArrowLeft, Eye, EyeOff } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable";
import { toast } from "sonner";

const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.7, ease: [0.16, 1, 0.3, 1] as const } },
};

const phoneMask = (v: string) => {
  const d = v.replace(/\D/g, "").slice(0, 11);
  if (d.length <= 2) return `(${d}`;
  if (d.length <= 7) return `(${d.slice(0, 2)}) ${d.slice(2)}`;
  return `(${d.slice(0, 2)}) ${d.slice(2, 7)}-${d.slice(7)}`;
};

const Login = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const redirectTo = searchParams.get("redirect");
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [phoneVal, setPhoneVal] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (isSignUp) {
        if (!fullName.trim()) { toast.error("Nome completo é obrigatório"); setLoading(false); return; }
        const phoneClean = phoneVal.replace(/\D/g, "");
        if (phoneClean.length < 10) { toast.error("Telefone inválido. Use (xx) xxxxx-xxxx"); setLoading(false); return; }
        const { data, error } = await supabase.auth.signUp({
          email, password,
          options: { data: { full_name: fullName }, emailRedirectTo: window.location.origin },
        });
        if (error) throw error;
        if (data.user) {
          let retries = 0;
          const savePhone = async () => {
            const { data: updated } = await supabase
              .from("profiles")
              .update({ phone: phoneVal, full_name: fullName })
              .eq("user_id", data.user!.id)
              .select("id");
            if ((!updated || updated.length === 0) && retries < 5) {
              retries++;
              await new Promise(r => setTimeout(r, 500));
              return savePhone();
            }
          };
          await savePhone();
        }
        setLoading(false);
        navigate("/cadastro", { replace: true });
        return;
      } else {
        // Rate-limit gate: check before attempting to sign in
        try {
          const { data: gate } = await supabase.functions.invoke("auth-gate", {
            body: { action: "check", email },
          });
          if (gate?.blocked) {
            const mins = Math.ceil((gate.retry_after_seconds || 900) / 60);
            toast.error(`Muitas tentativas. Tente novamente em ~${mins} min.`, { duration: 6000 });
            setLoading(false);
            return;
          }
        } catch (gateErr) {
          console.warn("[Login] auth-gate check failed (permitindo):", gateErr);
        }

        let signInData: any = null;
        let error: any = null;
        for (let attempt = 0; attempt < 3; attempt++) {
          try {
            const res = await supabase.auth.signInWithPassword({ email, password });
            signInData = res.data; error = res.error;
          } catch (netErr: any) {
            error = { message: netErr?.message || "Failed to fetch" };
          }
          if (!error) break;
          const msg = (error.message || "").toLowerCase();
          const isNetwork = msg.includes("failed to fetch") || msg.includes("network") || msg.includes("load failed");
          if (!isNetwork) break;
          await new Promise(r => setTimeout(r, 600 * (attempt + 1)));
        }

        if (error) {
          const msg = (error.message || "").toLowerCase();
          const isNetwork = msg.includes("failed to fetch") || msg.includes("network") || msg.includes("load failed");
          if (isNetwork) {
            try {
              const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
              const ANON = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;
              const r = await fetch(`${SUPABASE_URL}/auth/v1/token?grant_type=password`, {
                method: "POST",
                headers: { "Content-Type": "application/json", apikey: ANON, Authorization: `Bearer ${ANON}` },
                body: JSON.stringify({ email, password }),
                cache: "no-store",
              });
              if (r.ok) {
                const session = await r.json();
                const { error: setErr } = await supabase.auth.setSession({
                  access_token: session.access_token, refresh_token: session.refresh_token,
                });
                if (!setErr) { signInData = { user: session.user }; error = null; }
              } else {
                const body = await r.json().catch(() => ({}));
                error = { message: body?.error_description || body?.msg || `HTTP ${r.status}` };
              }
            } catch (e: any) {
              try {
                if ("caches" in window) {
                  const keys = await caches.keys();
                  await Promise.all(keys.map(k => caches.delete(k)));
                }
                if ("serviceWorker" in navigator) {
                  const regs = await navigator.serviceWorker.getRegistrations();
                  await Promise.all(regs.map(r => r.unregister()));
                }
              } catch {}
              // Auto-recover: reload once to clear stale SW/cache. Use a session flag to avoid loops.
              // Dentro do app nativo (Capacitor) NÃO fazemos reload — o WebView pode travar.
              const isNative =
                (window as any).Capacitor?.isNativePlatform?.() ||
                window.location.protocol === "capacitor:";
              const RELOAD_KEY = "sth-login-auto-recover";
              const alreadyTried = sessionStorage.getItem(RELOAD_KEY) === "1";
              if (!isNative && !alreadyTried) {
                sessionStorage.setItem(RELOAD_KEY, "1");
                toast.message("Reconectando…", { duration: 2000 });
                const url = new URL(window.location.href);
                url.searchParams.set("_v", Date.now().toString());
                setTimeout(() => window.location.replace(url.toString()), 400);
                return;
              }
              toast.error("Sem conexão com o servidor. Verifique sua internet e tente novamente.", { duration: 5000 });
              setLoading(false);
              return;
            }
          }
          if (error) throw error;
        }

        // Successful login path — clear recovery flag
        try { sessionStorage.removeItem("sth-login-auto-recover"); } catch {}
        // Record success (non-blocking)
        supabase.functions.invoke("auth-gate", {
          body: { action: "record", email, success: true },
        }).catch(() => {});

        const userId = signInData.user?.id;
        if (!userId) { toast.error("Não foi possível autenticar. Tente novamente."); setLoading(false); return; }

        let role: string = "student";
        try {
          const rolePromise = supabase.from("user_roles").select("role").eq("user_id", userId).maybeSingle();
          const timeout = new Promise<{ data: null }>((resolve) => setTimeout(() => resolve({ data: null }), 4000));
          const result: any = await Promise.race([rolePromise, timeout]);
          if (result?.data?.role) role = result.data.role;
        } catch (e) { console.warn("[Login] role fetch failed:", e); }

        const roleHomeMap: Record<string, string> = {
          admin: "/admin", admin_viewer: "/admin", consultor: "/consultor", assistente: "/assistente",
          financeiro: "/financeiro", student: "/dashboard",
        };
        setLoading(false);
        navigate(redirectTo || roleHomeMap[role] || "/dashboard", { replace: true });
        return;
      }
    } catch (error: any) {
      toast.error(error.message || "Erro ao processar");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background text-foreground antialiased">
      <header className="fixed top-0 inset-x-0 z-50 bg-background/80 backdrop-blur-2xl border-b border-border/40">
        <div className="max-w-6xl mx-auto px-6 h-11 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-1.5 text-[12px] text-muted-foreground hover:text-foreground transition-colors">
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Início</span>
          </Link>
          <span className="text-[12px] font-semibold tracking-tight">STH METHOD</span>
          <span className="w-12" />
        </div>
      </header>

      <section className="pt-32 md:pt-40 pb-12 md:pb-16 text-center px-6">
        <motion.p initial="hidden" animate="visible" variants={fadeUp} className="text-[12px] font-medium tracking-[0.25em] uppercase text-primary mb-6">
          {isSignUp ? "Criar conta" : "Entrar"}
        </motion.p>
        <motion.h1
          initial="hidden" animate="visible" variants={fadeUp}
          className="max-w-3xl mx-auto text-4xl sm:text-5xl md:text-7xl font-semibold tracking-[-0.04em] leading-[0.95] text-foreground"
        >
          {isSignUp ? <>Comece sua <br /><span className="text-muted-foreground">jornada.</span></> : <>Bem-vindo <br /><span className="text-muted-foreground">de volta.</span></>}
        </motion.h1>
      </section>

      <motion.section
        initial="hidden" animate="visible" variants={fadeUp}
        className="max-w-md mx-auto px-6 pb-32"
      >
        <form onSubmit={handleSubmit} className="space-y-5">
          {isSignUp && (
            <div className="space-y-2">
              <Label htmlFor="fullName" className="text-[13px] font-medium text-muted-foreground">Nome completo</Label>
              <Input id="fullName" type="text" placeholder="Seu nome completo" value={fullName} onChange={(e) => setFullName(e.target.value)} className="h-12 rounded-2xl border-border/60 bg-muted/30 px-4 text-base" required />
            </div>
          )}
          {isSignUp && (
            <div className="space-y-2">
              <Label htmlFor="phone" className="text-[13px] font-medium text-muted-foreground">Telefone</Label>
              <Input id="phone" type="tel" placeholder="(00) 00000-0000" value={phoneVal} onChange={(e) => setPhoneVal(phoneMask(e.target.value))} className="h-12 rounded-2xl border-border/60 bg-muted/30 px-4 text-base" required />
            </div>
          )}
          <div className="space-y-2">
            <Label htmlFor="email" className="text-[13px] font-medium text-muted-foreground">E-mail</Label>
            <Input id="email" type="email" placeholder="seu@email.com" value={email} onChange={(e) => setEmail(e.target.value)} className="h-12 rounded-2xl border-border/60 bg-muted/30 px-4 text-base" required />
          </div>
          <div className="space-y-2">
            <Label htmlFor="password" className="text-[13px] font-medium text-muted-foreground">Senha</Label>
            <div className="relative">
              <Input id="password" type={showPassword ? "text" : "password"} placeholder="••••••••" value={password} onChange={(e) => setPassword(e.target.value)} className="h-12 rounded-2xl border-border/60 bg-muted/30 px-4 pr-12 text-base" required minLength={6} />
              <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors">
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>
          <Button type="submit" disabled={loading} className="w-full h-12 rounded-full bg-foreground text-background hover:bg-foreground/90 text-[15px] font-medium">
            {loading ? "Processando..." : isSignUp ? "Criar conta" : "Entrar"}
          </Button>
        </form>

        <div className="mt-6 flex items-center gap-3">
          <div className="h-px flex-1 bg-border/60" />
          <span className="text-[11px] uppercase tracking-[0.2em] text-muted-foreground">ou</span>
          <div className="h-px flex-1 bg-border/60" />
        </div>

        <Button
          type="button"
          variant="outline"
          disabled={loading}
          onClick={async () => {
            try {
              setLoading(true);
              const result = await lovable.auth.signInWithOAuth("google", {
                redirect_uri: window.location.origin + (redirectTo || "/dashboard"),
              });
              if (result.error) {
                toast.error("Falha ao entrar com Google");
                setLoading(false);
                return;
              }
              if (result.redirected) return;
              navigate(redirectTo || "/dashboard", { replace: true });
            } catch (e: any) {
              toast.error(e?.message || "Erro ao entrar com Google");
              setLoading(false);
            }
          }}
          className="mt-6 w-full h-12 rounded-full border-border/60 bg-background hover:bg-muted/40 text-[15px] font-medium flex items-center justify-center gap-3"
        >
          <svg width="18" height="18" viewBox="0 0 48 48" aria-hidden="true">
            <path fill="#FFC107" d="M43.611 20.083H42V20H24v8h11.303c-1.649 4.657-6.08 8-11.303 8-6.627 0-12-5.373-12-12s5.373-12 12-12c3.059 0 5.842 1.154 7.961 3.039l5.657-5.657C34.046 6.053 29.268 4 24 4 12.955 4 4 12.955 4 24s8.955 20 20 20 20-8.955 20-20c0-1.341-.138-2.65-.389-3.917z"/>
            <path fill="#FF3D00" d="M6.306 14.691l6.571 4.819C14.655 15.108 18.961 12 24 12c3.059 0 5.842 1.154 7.961 3.039l5.657-5.657C34.046 6.053 29.268 4 24 4 16.318 4 9.656 8.337 6.306 14.691z"/>
            <path fill="#4CAF50" d="M24 44c5.166 0 9.86-1.977 13.409-5.192l-6.19-5.238C29.211 35.091 26.715 36 24 36c-5.202 0-9.619-3.317-11.283-7.946l-6.522 5.025C9.505 39.556 16.227 44 24 44z"/>
            <path fill="#1976D2" d="M43.611 20.083H42V20H24v8h11.303c-.792 2.237-2.231 4.166-4.094 5.571.001-.001.002-.001.003-.002l6.19 5.238C36.971 39.205 44 34 44 24c0-1.341-.138-2.65-.389-3.917z"/>
          </svg>
          Continuar com Google
        </Button>

        <div className="mt-8 text-center space-y-3">
          {!isSignUp && (
            <Link to="/forgot-password" className="text-[13px] text-muted-foreground hover:text-foreground transition-colors block">
              Esqueci minha senha
            </Link>
          )}
          <button type="button" onClick={() => setIsSignUp(!isSignUp)} className="text-[13px] text-muted-foreground hover:text-foreground transition-colors block w-full">
            {isSignUp ? "Já tem conta? Entrar" : "Não tem conta? Criar conta"}
          </button>
          <button
            type="button"
            onClick={async () => {
              try {
                if ("caches" in window) { const keys = await caches.keys(); await Promise.all(keys.map(k => caches.delete(k))); }
                if ("serviceWorker" in navigator) { const regs = await navigator.serviceWorker.getRegistrations(); await Promise.all(regs.map(r => r.unregister())); }
                localStorage.removeItem("sth-app-version");
                localStorage.removeItem("sth-auto-reload-version");
              } catch {}
              const url = new URL(window.location.href);
              url.searchParams.set("_v", Date.now().toString());
              window.location.replace(url.toString());
            }}
            className="text-[11px] text-muted-foreground/60 hover:text-foreground transition-colors underline-offset-2 hover:underline pt-4"
          >
            Problemas para entrar? Limpar cache e recarregar
          </button>
        </div>
      </motion.section>
    </div>
  );
};

export default Login;
