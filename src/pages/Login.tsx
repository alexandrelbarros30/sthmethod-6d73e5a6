import { useState } from "react";
import { useNavigate, Link, useSearchParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Lock, Mail, ArrowLeft, User, Eye, EyeOff } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

const Login = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const redirectTo = searchParams.get("redirect");
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (isSignUp) {
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: { full_name: fullName },
            emailRedirectTo: window.location.origin,
          },
        });
        if (error) throw error;
        toast.success("Conta criada com sucesso! Complete seu cadastro para liberar o acesso.", {
          action: {
            label: "Completar cadastro",
            onClick: () => window.location.href = "/cadastro",
          },
          duration: 8000,
        });
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;

        // Check role to redirect
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          const { data: roleData } = await supabase
            .from("user_roles")
            .select("role")
            .eq("user_id", user.id)
            .single();

          const roleHomeMap: Record<string, string> = {
            admin: "/admin",
            consultor: "/consultor",
            assistente: "/assistente",
            financeiro: "/financeiro",
            student: "/dashboard",
          };
          const role = roleData?.role || "student";
          navigate(redirectTo || roleHomeMap[role] || "/dashboard");
        }
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
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="pl-10"
                  required
                  minLength={6}
                />
              </div>
            </div>
            <Button type="submit" className="w-full" size="lg" disabled={loading}>
              {loading ? "Processando..." : isSignUp ? "Criar conta" : "Entrar"}
            </Button>
          </form>

          <div className="text-center">
            <button
              type="button"
              onClick={() => setIsSignUp(!isSignUp)}
              className="text-sm text-muted-foreground hover:text-foreground transition-colors font-body"
            >
              {isSignUp ? "Já tem conta? Entrar" : "Não tem conta? Criar conta"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
