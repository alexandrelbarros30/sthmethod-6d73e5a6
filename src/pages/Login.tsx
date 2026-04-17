import { useState } from "react";
import { useNavigate, Link, useSearchParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Lock, Mail, ArrowLeft, User, Phone, Eye, EyeOff } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

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
          email,
          password,
          options: {
            data: { full_name: fullName },
            emailRedirectTo: window.location.origin,
          },
        });
        if (error) throw error;
        // Save phone to profile
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
        toast.success("Conta criada com sucesso! Complete seu cadastro para liberar o acesso.", {
          action: {
            label: "Completar cadastro",
            onClick: () => window.location.href = "/cadastro",
          },
          duration: 8000,
        });
      } else {
        // Retry sign-in with multiple strategies (mobile networks / Android Chromium often throw "Failed to fetch")
        let signInData: any = null;
        let error: any = null;
        for (let attempt = 0; attempt < 3; attempt++) {
          try {
            const res = await supabase.auth.signInWithPassword({ email, password });
            signInData = res.data;
            error = res.error;
          } catch (netErr: any) {
            error = { message: netErr?.message || "Failed to fetch" };
          }
          if (!error) break;
          const msg = (error.message || "").toLowerCase();
          const isNetwork = msg.includes("failed to fetch") || msg.includes("network") || msg.includes("load failed");
          if (!isNetwork) break;
          await new Promise(r => setTimeout(r, 600 * (attempt + 1)));
        }

        // Fallback: direct REST call (bypasses SDK fetch wrapper that some Android Chromium builds choke on)
        if (error) {
          const msg = (error.message || "").toLowerCase();
          const isNetwork = msg.includes("failed to fetch") || msg.includes("network") || msg.includes("load failed");
          if (isNetwork) {
            try {
              const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
              const ANON = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;
              const r = await fetch(`${SUPABASE_URL}/auth/v1/token?grant_type=password`, {
                method: "POST",
                headers: {
                  "Content-Type": "application/json",
                  apikey: ANON,
                  Authorization: `Bearer ${ANON}`,
                },
                body: JSON.stringify({ email, password }),
                cache: "no-store",
              });
              if (r.ok) {
                const session = await r.json();
                const { error: setErr } = await supabase.auth.setSession({
                  access_token: session.access_token,
                  refresh_token: session.refresh_token,
                });
                if (!setErr) {
                  signInData = { user: session.user };
                  error = null;
                }
              } else {
                const body = await r.json().catch(() => ({}));
                error = { message: body?.error_description || body?.msg || `HTTP ${r.status}` };
              }
            } catch (e: any) {
              // Still failing → caches/SW likely poisoned. Clear & reload.
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
              toast.error("Falha de conexão. Toque em 'Limpar cache' abaixo e tente novamente.", { duration: 5000 });
              setLoading(false);
              return;
            }
          }
          if (error) throw error;
        }

        const userId = signInData.user?.id;
        if (!userId) {
          toast.error("Não foi possível autenticar. Tente novamente.");
          setLoading(false);
          return;
        }

        // Fetch role with maybeSingle (avoids hang/error when no row); guarded with timeout.
        let role: string = "student";
        try {
          const rolePromise = supabase
            .from("user_roles")
            .select("role")
            .eq("user_id", userId)
            .maybeSingle();
          const timeout = new Promise<{ data: null }>((resolve) =>
            setTimeout(() => resolve({ data: null }), 4000)
          );
          const result: any = await Promise.race([rolePromise, timeout]);
          if (result?.data?.role) role = result.data.role;
        } catch (e) {
          console.warn("[Login] role fetch failed, defaulting to student:", e);
        }

        const roleHomeMap: Record<string, string> = {
          admin: "/admin",
          consultor: "/consultor",
          assistente: "/assistente",
          financeiro: "/financeiro",
          student: "/dashboard",
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
    <div className="min-h-screen flex">
      {/* Left panel */}
      <div className="hidden lg:flex lg:w-1/2 bg-hero relative items-center justify-center p-12">
        <div className="relative z-10 max-w-md space-y-6">
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 rounded-lg bg-primary-foreground/10 backdrop-blur-sm flex items-center justify-center">
              <span className="text-primary-foreground font-bold">ST</span>
            </div>
            <span className="font-display text-2xl font-bold text-primary-foreground">ST&H</span>
          </div>
          <h1 className="text-4xl font-bold text-primary-foreground leading-tight font-display">
            Sua jornada científica começa aqui
          </h1>
          <p className="text-primary-foreground/60 font-body">
            Acesse sua dieta, treino e protocolos personalizados em um só lugar.
          </p>
        </div>
      </div>

      {/* Right panel */}
      <div className="flex-1 flex items-center justify-center p-8 bg-background">
        <div className="w-full max-w-md space-y-8">
          <div>
            <Link to="/" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors mb-8">
              <ArrowLeft className="w-4 h-4" /> Voltar
            </Link>
            <div className="lg:hidden flex items-center gap-2 mb-6">
              <div className="w-8 h-8 rounded-lg bg-gradient-primary flex items-center justify-center">
                <span className="text-primary-foreground font-bold text-sm">ST</span>
              </div>
              <span className="font-display text-xl font-bold text-foreground">ST&H</span>
            </div>
            <h2 className="text-2xl font-bold text-foreground font-display">
              {isSignUp ? "Criar conta" : "Entrar na plataforma"}
            </h2>
            <p className="text-muted-foreground mt-2 font-body">
              {isSignUp ? "Preencha os dados para criar sua conta" : "Digite suas credenciais para acessar"}
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            {isSignUp && (
              <div className="space-y-2">
                <Label htmlFor="fullName" className="font-body">Nome completo</Label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    id="fullName"
                    type="text"
                    placeholder="Seu nome completo"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    className="pl-10"
                    required
                  />
                </div>
              </div>
            )}
            {isSignUp && (
              <div className="space-y-2">
                <Label htmlFor="phone" className="font-body">Telefone</Label>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    id="phone"
                    type="tel"
                    placeholder="(00) 00000-0000"
                    value={phoneVal}
                    onChange={(e) => setPhoneVal(phoneMask(e.target.value))}
                    className="pl-10"
                    required
                  />
                </div>
              </div>
            )}
            <div className="space-y-2">
              <Label htmlFor="email" className="font-body">Email</Label>
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
            <div className="space-y-2">
              <Label htmlFor="password" className="font-body">Senha</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="pl-10 pr-10"
                  required
                  minLength={6}
                />
                <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors">
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>
            <Button type="submit" className="w-full" size="lg" disabled={loading}>
              {loading ? "Processando..." : isSignUp ? "Criar conta" : "Entrar"}
            </Button>
          </form>

          <div className="text-center space-y-3">
            <button
              type="button"
              onClick={() => setIsSignUp(!isSignUp)}
              className="text-sm text-muted-foreground hover:text-foreground transition-colors font-body"
            >
              {isSignUp ? "Já tem conta? Entrar" : "Não tem conta? Criar conta"}
            </button>
            <div>
              <button
                type="button"
                onClick={async () => {
                  try {
                    if ("caches" in window) {
                      const keys = await caches.keys();
                      await Promise.all(keys.map(k => caches.delete(k)));
                    }
                    if ("serviceWorker" in navigator) {
                      const regs = await navigator.serviceWorker.getRegistrations();
                      await Promise.all(regs.map(r => r.unregister()));
                    }
                    localStorage.removeItem("sth-app-version");
                    localStorage.removeItem("sth-auto-reload-version");
                  } catch {}
                  const url = new URL(window.location.href);
                  url.searchParams.set("_v", Date.now().toString());
                  window.location.replace(url.toString());
                }}
                className="text-[11px] text-muted-foreground/60 hover:text-foreground transition-colors underline-offset-2 hover:underline"
              >
                Problemas para entrar? Limpar cache e recarregar
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
