import { useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { useCasAuth } from "@/contexts/CasAuthContext";
import CasShell, { fieldCls, labelCls, btnPrimaryCls, linkCls } from "@/components/cas/CasShell";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";

export default function CasLogin() {
  const { login } = useCasAuth();
  const nav = useNavigate();
  const [sp] = useSearchParams();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      await login(email.trim(), password);
      const next = sp.get("next") || "/cas";
      nav(next, { replace: true });
    } catch (err: any) {
      toast.error(err?.message || "Não foi possível entrar.");
    } finally { setLoading(false); }
  }

  return (
    <CasShell title="Entrar no EAD CAS" subtitle="Acesse seu núcleo de estudos."
      footer={<>Novo por aqui? <Link to="/cas/cadastro" className={linkCls}>Criar conta</Link></>}>
      <form onSubmit={submit} className="space-y-4">
        <div>
          <label className={labelCls}>E-mail</label>
          <input type="email" required autoComplete="email" className={fieldCls}
            value={email} onChange={(e) => setEmail(e.target.value)} />
        </div>
        <div>
          <label className={labelCls}>Senha</label>
          <input type="password" required autoComplete="current-password" className={fieldCls}
            value={password} onChange={(e) => setPassword(e.target.value)} />
          <div className="mt-2 text-right">
            <Link to="/cas/esqueci-senha" className={`text-[13px] ${linkCls}`}>Esqueci minha senha</Link>
          </div>
        </div>
        <button type="submit" disabled={loading} className={btnPrimaryCls}>
          {loading ? <Loader2 className="h-4 w-4 animate-spin inline" /> : "Entrar"}
        </button>
      </form>
    </CasShell>
  );
}