import { useState } from "react";
import { Link } from "react-router-dom";
import { casAuthApi } from "@/lib/casAuthClient";
import CasShell, { fieldCls, labelCls, btnPrimaryCls, linkCls } from "@/components/cas/CasShell";
import { Loader2, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";

export default function CasForgotPassword() {
  const [email, setEmail] = useState("");
  const [birth, setBirth] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      const r = await casAuthApi.forgot({ email: email.trim(), birth_date: birth });
      setSent(true);
      toast.success(r.message);
    } catch (err: any) {
      toast.error(err?.message || "Não foi possível enviar.");
    } finally { setLoading(false); }
  }

  return (
    <CasShell title="Recuperar senha" subtitle="Para sua segurança, confirme seu e-mail e data de nascimento."
      footer={<>Lembrou a senha? <Link to="/cas/login" className={linkCls}>Voltar ao login</Link></>}>
      {sent ? (
        <div className="text-center py-4">
          <CheckCircle2 className="h-10 w-10 text-emerald-600 mx-auto mb-3" />
          <p className="text-[15px] text-[#1d1d1f]">Se os dados conferirem, você receberá um e-mail com o link para criar uma nova senha em até alguns minutos.</p>
          <p className="mt-3 text-[13px] text-[#6e6e73]">Verifique também a caixa de spam.</p>
        </div>
      ) : (
        <form onSubmit={submit} className="space-y-4">
          <div>
            <label className={labelCls}>E-mail cadastrado</label>
            <input type="email" required className={fieldCls} value={email} onChange={(e) => setEmail(e.target.value)} />
          </div>
          <div>
            <label className={labelCls}>Data de nascimento</label>
            <input type="date" required className={fieldCls} value={birth} onChange={(e) => setBirth(e.target.value)} />
          </div>
          <button type="submit" disabled={loading} className={btnPrimaryCls}>
            {loading ? <Loader2 className="h-4 w-4 animate-spin inline" /> : "Enviar link de recuperação"}
          </button>
        </form>
      )}
    </CasShell>
  );
}