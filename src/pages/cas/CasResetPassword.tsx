import { useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { casAuthApi } from "@/lib/casAuthClient";
import CasShell, { fieldCls, labelCls, btnPrimaryCls, linkCls } from "@/components/cas/CasShell";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";

export default function CasResetPassword() {
  const [sp] = useSearchParams();
  const token = sp.get("token") || "";
  const nav = useNavigate();
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (password.length < 8) return toast.error("Senha precisa ter ao menos 8 caracteres.");
    if (password !== confirm) return toast.error("As senhas não conferem.");
    setLoading(true);
    try {
      await casAuthApi.reset({ token, new_password: password });
      toast.success("Senha atualizada. Faça login.");
      nav("/cas/login", { replace: true });
    } catch (err: any) {
      toast.error(err?.message || "Link inválido ou expirado.");
    } finally { setLoading(false); }
  }

  if (!token) {
    return (
      <CasShell title="Link inválido" subtitle="O link de recuperação não veio completo.">
        <p className="text-[14px] text-[#6e6e73]">Solicite um novo link em <Link to="/cas/esqueci-senha" className={linkCls}>recuperação de senha</Link>.</p>
      </CasShell>
    );
  }

  return (
    <CasShell title="Criar nova senha" subtitle="Defina uma senha forte para seu acesso ao EAD CAS.">
      <form onSubmit={submit} className="space-y-4">
        <div>
          <label className={labelCls}>Nova senha</label>
          <input type="password" required minLength={8} className={fieldCls}
            value={password} onChange={(e) => setPassword(e.target.value)} />
        </div>
        <div>
          <label className={labelCls}>Confirmar senha</label>
          <input type="password" required minLength={8} className={fieldCls}
            value={confirm} onChange={(e) => setConfirm(e.target.value)} />
        </div>
        <button type="submit" disabled={loading} className={btnPrimaryCls}>
          {loading ? <Loader2 className="h-4 w-4 animate-spin inline" /> : "Atualizar senha"}
        </button>
      </form>
    </CasShell>
  );
}