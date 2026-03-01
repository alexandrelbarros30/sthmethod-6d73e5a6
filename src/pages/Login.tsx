import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Lock, Mail, ArrowLeft } from "lucide-react";
import { Link } from "react-router-dom";

const Login = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    // Demo: route based on email
    if (email.includes("admin")) {
      navigate("/admin");
    } else {
      navigate("/dashboard");
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
            <h2 className="text-2xl font-bold text-foreground font-display">Entrar na plataforma</h2>
            <p className="text-muted-foreground mt-2 font-body">Digite suas credenciais para acessar</p>
          </div>

          <form onSubmit={handleLogin} className="space-y-5">
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
                />
              </div>
            </div>
            <Button type="submit" className="w-full" size="lg">Entrar</Button>
          </form>

          <div className="bg-muted rounded-lg p-4 space-y-2">
            <p className="text-xs font-semibold text-muted-foreground font-body">Demo — acesso rápido:</p>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={() => { setEmail("aluno@sth.com"); setPassword("demo"); }}>
                Aluno
              </Button>
              <Button variant="outline" size="sm" onClick={() => { setEmail("admin@sth.com"); setPassword("demo"); }}>
                Admin
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
