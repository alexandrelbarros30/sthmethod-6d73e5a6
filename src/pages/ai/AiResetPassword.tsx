import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ArrowLeft, Brain, Eye, EyeOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { useSthAiTheme } from "@/hooks/useSthAiTheme";
import { toast } from "sonner";

export default function AiResetPassword() {
  useSthAiTheme();
  const navigate = useNavigate();
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [show, setShow] = useState(false);
  const [loading, setLoading] = useState(false);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const { data: sub } = supabase.auth.onAuthStateChange((event) => {
      if (event === "PASSWORD_RECOVERY") setReady(true);
    });
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) setReady(true);
    });
    return () => sub.subscription.unsubscribe();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password.length < 6) { toast.error("A senha deve ter no mínimo 6 caracteres."); return; }
    if (password !== confirm) { toast.error("As senhas não coincidem."); return; }
    setLoading(true);
    try {
      const { data: userData } = await supabase.auth.getUser();
      const { error } = await supabase.auth.updateUser({ password });
      if (error) throw error;
      const email = userData?.user?.email;
      if (email) {
        supabase.functions.invoke("send-transactional-email", {
          body: {
            templateName: "sth-ai-password-changed",
            recipientEmail: email,
            idempotencyKey: `sthai-pass-${userData?.user?.id}-${Date.now()}`,
            templateData: {
              name: (userData?.user?.user_metadata as any)?.full_name || "",
              changedAt: new Date().toLocaleString("pt-BR"),
            },
          },
        }).catch(() => {});
      }
      toast.success("Senha atualizada com sucesso!");
      await supabase.auth.signOut();
      navigate("/ai/login", { replace: true });
    } catch (err: any) {
      toast.error(err?.message || "Não foi possível atualizar a senha. Solicite um novo link.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="mx-auto flex max-w-5xl items-center justify-between px-4 py-5">
        <Link to="/ai/login" className="flex items-center gap-1.5 text-[12px] text-muted-foreground hover:text-foreground">
          <ArrowLeft className="h-3.5 w-3.5" /> Entrar
        </Link>
        <span className="grid h-8 w-8 place-items-center rounded-xl bg-primary/15 text-primary">
          <Brain className="h-4 w-4" />
        </span>
      </header>

      <section className="mx-auto max-w-md px-4 pb-24 pt-8">
        <h1 className="text-3xl font-semibold tracking-tight">Nova senha</h1>
        <p className="mt-2 text-sm text-muted-foreground">Defina uma nova senha para sua conta STH AI.</p>

        <form onSubmit={handleSubmit} className="mt-8 space-y-5">
          <div className="space-y-2">
            <Label htmlFor="ai-new-pass" className="text-[13px] text-muted-foreground">Nova senha</Label>
            <div className="relative">
              <Input id="ai-new-pass" type={show ? "text" : "password"} value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" className="h-12 rounded-2xl pr-12" required minLength={6} />
              <button type="button" onClick={() => setShow((v) => !v)} className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground" aria-label="Mostrar senha">
                {show ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="ai-confirm-pass" className="text-[13px] text-muted-foreground">Confirmar nova senha</Label>
            <Input id="ai-confirm-pass" type={show ? "text" : "password"} value={confirm} onChange={(e) => setConfirm(e.target.value)} placeholder="••••••••" className="h-12 rounded-2xl" required minLength={6} />
          </div>
          <Button type="submit" size="lg" className="w-full rounded-2xl" disabled={loading}>
            {loading ? "Atualizando…" : "Salvar nova senha"}
          </Button>
          {!ready && (
            <p className="text-center text-[11px] text-muted-foreground/70">
              Abra esta página pelo link enviado ao seu e-mail para concluir a redefinição.
            </p>
          )}
        </form>
      </section>
    </div>
  );
}
