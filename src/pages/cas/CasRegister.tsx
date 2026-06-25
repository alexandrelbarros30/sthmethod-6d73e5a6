import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useCasAuth } from "@/contexts/CasAuthContext";
import CasShell, { fieldCls, labelCls, btnPrimaryCls, linkCls } from "@/components/cas/CasShell";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";

function formatRG(v: string) {
  // RG: 5 ou 6 algarismos (ex.: 88.876 ou 102.252)
  const digits = v.replace(/\D/g, "").slice(0, 6);
  if (digits.length <= 3) return digits;
  const head = digits.slice(0, digits.length - 3);
  const tail = digits.slice(-3);
  return `${head}.${tail}`;
}
function formatPhone(v: string) {
  const d = v.replace(/\D/g, "").slice(0, 11);
  if (d.length <= 10) return d.replace(/(\d{0,2})(\d{0,4})(\d{0,4}).*/, (_,a,b,c) => [a&&`(${a}`, a&&a.length===2?")":"", b&&` ${b}`, c&&`-${c}`].filter(Boolean).join(""));
  return d.replace(/(\d{2})(\d{5})(\d{0,4}).*/, "($1) $2-$3");
}

export default function CasRegister() {
  const { register } = useCasAuth();
  const nav = useNavigate();
  const [form, setForm] = useState({
    full_name: "", email: "", birth_date: "", phone: "", rg: "", password: "", confirm: "",
  });
  const [loading, setLoading] = useState(false);

  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm((f) => ({ ...f, [k]: e.target.value }));

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (form.password.length < 8) return toast.error("Senha precisa ter ao menos 8 caracteres.");
    if (form.password !== form.confirm) return toast.error("As senhas não conferem.");
    setLoading(true);
    try {
      await register({
        full_name: form.full_name.trim(),
        email: form.email.trim(),
        birth_date: form.birth_date,
        phone: form.phone.trim() || undefined,
        rg: form.rg.trim() || undefined,
        password: form.password,
      });
      toast.success("Conta criada!");
      nav("/cas", { replace: true });
    } catch (err: any) {
      toast.error(err?.message || "Não foi possível cadastrar.");
    } finally { setLoading(false); }
  }

  return (
    <CasShell title="Criar conta no MEAD · CAS" subtitle="Preencha seus dados para acessar o núcleo de estudos."
      footer={<>Já tem conta? <Link to="/cas/login" className={linkCls}>Entrar</Link></>}>
      <form onSubmit={submit} className="space-y-4">
        <div>
          <label className={labelCls}>Nome completo</label>
          <input required minLength={3} className={fieldCls} value={form.full_name} onChange={set("full_name")} />
        </div>
        <div>
          <label className={labelCls}>E-mail</label>
          <input type="email" required autoComplete="email" className={fieldCls} value={form.email} onChange={set("email")} />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className={labelCls}>Data de nascimento</label>
            <input type="date" required className={fieldCls} value={form.birth_date} onChange={set("birth_date")} />
          </div>
          <div>
            <label className={labelCls}>Telefone</label>
            <input className={fieldCls} value={form.phone}
              onChange={(e) => setForm((f) => ({ ...f, phone: formatPhone(e.target.value) }))}
              placeholder="(21) 99999-9999" />
          </div>
        </div>
        <div>
          <label className={labelCls}>RG</label>
          <input className={fieldCls} value={form.rg} inputMode="numeric" maxLength={7}
            onChange={(e) => setForm((f) => ({ ...f, rg: formatRG(e.target.value) }))}
            placeholder="88.876 ou 102.252" />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className={labelCls}>Senha</label>
            <input type="password" required minLength={8} autoComplete="new-password" className={fieldCls}
              value={form.password} onChange={set("password")} />
          </div>
          <div>
            <label className={labelCls}>Confirmar senha</label>
            <input type="password" required minLength={8} autoComplete="new-password" className={fieldCls}
              value={form.confirm} onChange={set("confirm")} />
          </div>
        </div>
        <button type="submit" disabled={loading} className={btnPrimaryCls}>
          {loading ? <Loader2 className="h-4 w-4 animate-spin inline" /> : "Criar conta"}
        </button>
      </form>
    </CasShell>
  );
}