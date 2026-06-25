import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useCasAuth } from "@/contexts/CasAuthContext";
import { casAuthApi } from "@/lib/casAuthClient";
import CasShell, { fieldCls, labelCls, btnPrimaryCls } from "@/components/cas/CasShell";
import { Loader2, LogOut } from "lucide-react";
import { toast } from "sonner";

export default function CasProfile() {
  const { user, setUser, logout } = useCasAuth();
  const nav = useNavigate();
  const [form, setForm] = useState({
    full_name: user?.full_name ?? "",
    phone: user?.phone ?? "",
    rg: user?.rg ?? "",
    birth_date: user?.birth_date ?? "",
  });
  const [pwd, setPwd] = useState({ current: "", next: "", confirm: "" });
  const [savingProfile, setSavingProfile] = useState(false);
  const [savingPwd, setSavingPwd] = useState(false);

  async function saveProfile(e: React.FormEvent) {
    e.preventDefault();
    setSavingProfile(true);
    try {
      const { user: u } = await casAuthApi.updateProfile(form);
      setUser(u);
      toast.success("Perfil atualizado.");
    } catch (err: any) {
      toast.error(err?.message || "Erro ao atualizar.");
    } finally { setSavingProfile(false); }
  }

  async function savePassword(e: React.FormEvent) {
    e.preventDefault();
    if (pwd.next.length < 8) return toast.error("Senha precisa ter ao menos 8 caracteres.");
    if (pwd.next !== pwd.confirm) return toast.error("Senhas não conferem.");
    setSavingPwd(true);
    try {
      await casAuthApi.changePassword({ current_password: pwd.current, new_password: pwd.next });
      setPwd({ current: "", next: "", confirm: "" });
      toast.success("Senha atualizada.");
    } catch (err: any) {
      toast.error(err?.message || "Erro ao atualizar senha.");
    } finally { setSavingPwd(false); }
  }

  async function doLogout() {
    await logout();
    nav("/cas/login", { replace: true });
  }

  return (
    <CasShell title="Meu perfil" subtitle={user?.email}>
      <form onSubmit={saveProfile} className="space-y-4">
        <div>
          <label className={labelCls}>Nome completo</label>
          <input className={fieldCls} value={form.full_name} onChange={(e) => setForm({ ...form, full_name: e.target.value })} />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className={labelCls}>Data de nascimento</label>
            <input type="date" className={fieldCls} value={form.birth_date} onChange={(e) => setForm({ ...form, birth_date: e.target.value })} />
          </div>
          <div>
            <label className={labelCls}>Telefone</label>
            <input className={fieldCls} value={form.phone ?? ""} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
          </div>
        </div>
        <div>
          <label className={labelCls}>RG</label>
          <input
            className={fieldCls}
            value={form.rg ?? ""}
            inputMode="numeric"
            maxLength={7}
            placeholder="88.876 ou 102.252"
            onChange={(e) => {
              const d = e.target.value.replace(/\D/g, "").slice(0, 6);
              const formatted = d.length <= 3 ? d : `${d.slice(0, d.length - 3)}.${d.slice(-3)}`;
              setForm({ ...form, rg: formatted });
            }}
          />
        </div>
        <button disabled={savingProfile} className={btnPrimaryCls}>
          {savingProfile ? <Loader2 className="h-4 w-4 animate-spin inline" /> : "Salvar perfil"}
        </button>
      </form>

      <div className="my-6 border-t border-[#e6e6e8]" />

      <h2 className="text-[15px] font-semibold mb-3">Alterar senha</h2>
      <form onSubmit={savePassword} className="space-y-4">
        <div>
          <label className={labelCls}>Senha atual</label>
          <input type="password" required className={fieldCls} value={pwd.current} onChange={(e) => setPwd({ ...pwd, current: e.target.value })} />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className={labelCls}>Nova senha</label>
            <input type="password" required minLength={8} className={fieldCls} value={pwd.next} onChange={(e) => setPwd({ ...pwd, next: e.target.value })} />
          </div>
          <div>
            <label className={labelCls}>Confirmar</label>
            <input type="password" required minLength={8} className={fieldCls} value={pwd.confirm} onChange={(e) => setPwd({ ...pwd, confirm: e.target.value })} />
          </div>
        </div>
        <button disabled={savingPwd} className={btnPrimaryCls}>
          {savingPwd ? <Loader2 className="h-4 w-4 animate-spin inline" /> : "Atualizar senha"}
        </button>
      </form>

      <div className="mt-8 pt-6 border-t border-[#e6e6e8]">
        <button onClick={doLogout} className="w-full h-11 rounded-xl border border-[#d2d2d7] text-[15px] text-[#1d1d1f] hover:bg-[#f5f5f7] inline-flex items-center justify-center gap-2">
          <LogOut className="h-4 w-4" /> Sair
        </button>
      </div>
    </CasShell>
  );
}