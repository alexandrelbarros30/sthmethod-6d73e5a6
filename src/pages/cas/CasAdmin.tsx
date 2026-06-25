import { useEffect, useMemo, useState } from "react";
import { Link, Navigate } from "react-router-dom";
import { useCasAuth } from "@/contexts/CasAuthContext";
import { casAuthApi, CasUser } from "@/lib/casAuthClient";
import { useMeadManifest } from "@/hooks/useMeadManifest";
import meadLogo from "@/assets/mead-logo.png.asset.json";
import { Loader2, Search, ShieldCheck, Users, Activity, BookOpen, X, RefreshCcw, KeyRound, Trash2, Save } from "lucide-react";
import { toast } from "sonner";

type Row = CasUser & { searches_count: number };

const card = "rounded-2xl bg-white border border-[#e6e6e8] shadow-[0_1px_2px_rgba(0,0,0,0.04)]";
const fieldCls = "w-full h-10 rounded-xl border border-[#d2d2d7] bg-white px-3 text-[14px] focus:outline-none focus:border-[#0071e3] focus:ring-2 focus:ring-[#0071e3]/20";

function fmtDate(s?: string | null) {
  if (!s) return "—";
  try { return new Date(s).toLocaleString("pt-BR", { dateStyle: "short", timeStyle: "short" }); } catch { return s; }
}

export default function CasAdmin() {
  useMeadManifest();
  const { user } = useCasAuth();
  const [metrics, setMetrics] = useState<any>(null);
  const [rows, setRows] = useState<Row[]>([]);
  const [q, setQ] = useState("");
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<string | null>(null);

  async function loadAll(query = "") {
    setLoading(true);
    try {
      const [m, u] = await Promise.all([
        casAuthApi.adminMetrics(),
        casAuthApi.adminListUsers({ q: query, limit: 300 }),
      ]);
      setMetrics(m);
      setRows(u.users);
    } catch (e: any) {
      toast.error(e?.message || "Falha ao carregar painel.");
    } finally { setLoading(false); }
  }

  useEffect(() => { if (user?.is_admin) loadAll(""); }, [user?.is_admin]);

  if (!user) return <Navigate to="/cas/login?next=/cas/admin" replace />;
  if (!user.is_admin) return <Navigate to="/cas" replace />;

  const filtered = useMemo(() => rows, [rows]);

  return (
    <div className="min-h-screen bg-[#f5f5f7] text-[#1d1d1f]">
      <header className="border-b border-[#e6e6e8] bg-white/70 backdrop-blur sticky top-0 z-20">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-14 sm:h-16 flex items-center justify-between gap-3">
          <Link to="/cas" className="flex items-center gap-2.5">
            <img src={meadLogo.url} alt="MEAD" className="h-8 sm:h-10 w-auto object-contain" />
            <span className="text-[11px] tracking-[0.22em] font-semibold text-[#86868b]">· CAS · ADMIN</span>
          </Link>
          <div className="flex items-center gap-2 text-[13px] text-[#6e6e73]">
            <ShieldCheck className="h-4 w-4 text-emerald-600" />
            <span className="hidden sm:inline">{user.full_name}</span>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 sm:px-6 py-8 space-y-6">
        <div>
          <div className="text-[10px] tracking-[0.28em] font-semibold uppercase text-[#86868b]">Painel administrativo</div>
          <h1 className="text-[28px] sm:text-[34px] font-semibold tracking-tight">Visão geral do MEAD · CAS</h1>
          <p className="text-[14px] text-[#6e6e73] mt-1">Alunos, progresso e gestão de cadastros.</p>
        </div>

        {/* Metrics */}
        <section className="grid grid-cols-2 lg:grid-cols-5 gap-3">
          <MetricCard label="Total de alunos" value={metrics?.users_total ?? "—"} Icon={Users} />
          <MetricCard label="Ativos" value={metrics?.users_active ?? "—"} Icon={ShieldCheck} accent="text-emerald-600" />
          <MetricCard label="Logaram em 30d" value={metrics?.users_logged_30d ?? "—"} Icon={Activity} accent="text-blue-600" />
          <MetricCard label="Pesquisas (7d)" value={metrics?.searches_7d ?? "—"} Icon={BookOpen} />
          <MetricCard label="Pesquisas totais" value={metrics?.searches_total ?? "—"} Icon={BookOpen} accent="text-[#1d1d1f]" />
        </section>

        {/* Toolbar */}
        <div className={`${card} p-3 flex items-center gap-2`}>
          <Search className="h-4 w-4 text-[#86868b] ml-1" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter") loadAll(q); }}
            placeholder="Buscar por nome ou e-mail"
            className="flex-1 h-9 bg-transparent text-[14px] focus:outline-none"
          />
          <button onClick={() => loadAll(q)} className="h-9 px-3 rounded-lg bg-[#1d1d1f] text-white text-[13px] font-medium hover:bg-black flex items-center gap-1.5">
            <RefreshCcw className="h-3.5 w-3.5" /> Atualizar
          </button>
        </div>

        {/* Table */}
        <div className={`${card} overflow-hidden`}>
          <div className="overflow-x-auto">
            <table className="w-full text-[13px]">
              <thead className="bg-[#fafafa] text-[11px] uppercase tracking-[0.08em] text-[#6e6e73]">
                <tr>
                  <th className="text-left px-4 py-2.5">Aluno</th>
                  <th className="text-left px-4 py-2.5">Contato</th>
                  <th className="text-left px-4 py-2.5">Status</th>
                  <th className="text-right px-4 py-2.5">Pesquisas</th>
                  <th className="text-left px-4 py-2.5">Último login</th>
                  <th className="text-left px-4 py-2.5">Cadastro</th>
                  <th className="px-4 py-2.5"></th>
                </tr>
              </thead>
              <tbody>
                {loading && (
                  <tr><td colSpan={7} className="px-4 py-10 text-center"><Loader2 className="h-5 w-5 animate-spin inline" /></td></tr>
                )}
                {!loading && filtered.length === 0 && (
                  <tr><td colSpan={7} className="px-4 py-10 text-center text-[#86868b]">Nenhum aluno encontrado.</td></tr>
                )}
                {!loading && filtered.map((r) => (
                  <tr key={r.id} className="border-t border-[#f0f0f3] hover:bg-[#fafafa]">
                    <td className="px-4 py-3">
                      <div className="font-medium flex items-center gap-1.5">
                        {r.full_name}
                        {r.is_admin && <span className="text-[9px] tracking-wider font-bold px-1.5 py-0.5 rounded bg-emerald-50 text-emerald-700">ADMIN</span>}
                      </div>
                      <div className="text-[12px] text-[#86868b]">{r.email}</div>
                    </td>
                    <td className="px-4 py-3 text-[#6e6e73]">{r.phone || "—"}</td>
                    <td className="px-4 py-3">
                      <span className={`text-[11px] font-medium px-2 py-0.5 rounded-full ${r.is_active ? "bg-emerald-50 text-emerald-700" : "bg-red-50 text-red-700"}`}>
                        {r.is_active ? "Ativo" : "Inativo"}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right tabular-nums font-medium">{r.searches_count}</td>
                    <td className="px-4 py-3 text-[#6e6e73]">{fmtDate(r.last_login_at)}</td>
                    <td className="px-4 py-3 text-[#6e6e73]">{fmtDate(r.created_at)}</td>
                    <td className="px-4 py-3 text-right">
                      <button onClick={() => setSelected(r.id)} className="text-[12px] font-medium text-[#0071e3] hover:underline">Abrir</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </main>

      {selected && (
        <UserDrawer id={selected} onClose={() => setSelected(null)} onChanged={() => loadAll(q)} />
      )}
    </div>
  );
}

function MetricCard({ label, value, Icon, accent }: { label: string; value: any; Icon: any; accent?: string }) {
  return (
    <div className={`${card} p-4`}>
      <div className="flex items-center gap-2 text-[11px] tracking-[0.08em] uppercase text-[#86868b]">
        <Icon className={`h-3.5 w-3.5 ${accent ?? "text-[#6e6e73]"}`} /> {label}
      </div>
      <div className="mt-1 text-[26px] font-semibold tabular-nums">{value}</div>
    </div>
  );
}

function UserDrawer({ id, onClose, onChanged }: { id: string; onClose: () => void; onChanged: () => void }) {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState<any>({});
  const [newPwd, setNewPwd] = useState("");

  async function load() {
    setLoading(true);
    try {
      const d = await casAuthApi.adminUserDetail(id);
      setData(d);
      setForm({
        full_name: d.user.full_name, email: d.user.email, phone: d.user.phone || "",
        rg: d.user.rg || "", birth_date: d.user.birth_date,
        is_active: d.user.is_active !== false, is_admin: !!d.user.is_admin,
      });
    } catch (e: any) {
      toast.error(e?.message || "Falha ao carregar");
    } finally { setLoading(false); }
  }
  useEffect(() => { load(); }, [id]);

  async function save() {
    setSaving(true);
    try {
      await casAuthApi.adminUpdateUser({ id, ...form });
      toast.success("Dados atualizados.");
      onChanged();
    } catch (e: any) { toast.error(e?.message || "Falha ao salvar"); }
    finally { setSaving(false); }
  }

  async function resetPwd() {
    if (newPwd.length < 8) { toast.error("Senha precisa ter ao menos 8 caracteres."); return; }
    if (!confirm("Definir nova senha para este aluno?")) return;
    try {
      await casAuthApi.adminResetPassword({ id, new_password: newPwd });
      setNewPwd("");
      toast.success("Senha atualizada e sessões revogadas.");
    } catch (e: any) { toast.error(e?.message || "Falha"); }
  }

  async function remove() {
    if (!confirm("Excluir este cadastro permanentemente? Esta ação não pode ser desfeita.")) return;
    try {
      await casAuthApi.adminDeleteUser(id);
      toast.success("Cadastro excluído.");
      onChanged(); onClose();
    } catch (e: any) { toast.error(e?.message || "Falha ao excluir"); }
  }

  return (
    <div className="fixed inset-0 z-30 flex justify-end" onClick={onClose}>
      <div className="absolute inset-0 bg-black/30" />
      <div className="relative w-full max-w-lg h-full bg-white overflow-y-auto" onClick={(e) => e.stopPropagation()}>
        <div className="sticky top-0 bg-white/90 backdrop-blur border-b border-[#e6e6e8] px-5 py-3 flex items-center justify-between">
          <div>
            <div className="text-[10px] tracking-[0.22em] uppercase text-[#86868b]">Cadastro</div>
            <div className="font-semibold">{data?.user?.full_name || "Carregando..."}</div>
          </div>
          <button onClick={onClose} className="p-2 rounded-lg hover:bg-[#f5f5f7]"><X className="h-4 w-4" /></button>
        </div>
        {loading ? (
          <div className="p-10 text-center"><Loader2 className="h-5 w-5 animate-spin inline" /></div>
        ) : (
          <div className="p-5 space-y-6">
            <section className="space-y-3">
              <h3 className="text-[12px] tracking-[0.08em] uppercase font-semibold text-[#6e6e73]">Dados do aluno</h3>
              <Field label="Nome completo" value={form.full_name} onChange={(v) => setForm({ ...form, full_name: v })} />
              <Field label="E-mail" value={form.email} onChange={(v) => setForm({ ...form, email: v })} />
              <div className="grid grid-cols-2 gap-3">
                <Field label="Telefone" value={form.phone} onChange={(v) => setForm({ ...form, phone: v })} />
                <Field label="RG" value={form.rg} onChange={(v) => setForm({ ...form, rg: v })} />
              </div>
              <Field label="Nascimento" type="date" value={form.birth_date} onChange={(v) => setForm({ ...form, birth_date: v })} />
              <div className="flex items-center gap-6 pt-1">
                <Toggle label="Ativo" checked={form.is_active} onChange={(b) => setForm({ ...form, is_active: b })} />
                <Toggle label="Administrador" checked={form.is_admin} onChange={(b) => setForm({ ...form, is_admin: b })} />
              </div>
              <button disabled={saving} onClick={save} className="h-10 px-4 rounded-xl bg-[#1d1d1f] text-white text-[14px] font-medium hover:bg-black flex items-center gap-2 disabled:opacity-50">
                <Save className="h-4 w-4" /> Salvar alterações
              </button>
            </section>

            <section className="space-y-2 pt-2 border-t border-[#f0f0f3]">
              <h3 className="text-[12px] tracking-[0.08em] uppercase font-semibold text-[#6e6e73]">Redefinir senha</h3>
              <div className="flex gap-2">
                <input type="text" value={newPwd} onChange={(e) => setNewPwd(e.target.value)} placeholder="Nova senha (mín. 8)" className={fieldCls} />
                <button onClick={resetPwd} className="h-10 px-3 rounded-xl bg-[#0071e3] text-white text-[13px] font-medium flex items-center gap-1.5"><KeyRound className="h-3.5 w-3.5" /> Definir</button>
              </div>
              <p className="text-[11px] text-[#86868b]">Ao redefinir, todas as sessões ativas deste aluno são revogadas.</p>
            </section>

            <section className="pt-2 border-t border-[#f0f0f3]">
              <h3 className="text-[12px] tracking-[0.08em] uppercase font-semibold text-[#6e6e73] mb-2">Histórico de consultas (últimas 50)</h3>
              {data.history.length === 0 ? (
                <div className="text-[13px] text-[#86868b]">Nenhuma consulta registrada.</div>
              ) : (
                <ul className="space-y-1.5 max-h-72 overflow-y-auto">
                  {data.history.map((h: any) => (
                    <li key={h.id} className="text-[13px] flex items-start justify-between gap-3 py-1.5 border-b border-[#f5f5f7]">
                      <span className="truncate flex-1">
                        <span className={h.has_answer ? "text-emerald-600 mr-1.5" : "text-amber-600 mr-1.5"}>●</span>
                        {h.query}
                        {h.discipline && <span className="text-[11px] text-[#86868b] ml-2">· {h.discipline}</span>}
                      </span>
                      <span className="text-[11px] text-[#86868b] whitespace-nowrap">{fmtDate(h.created_at)}</span>
                    </li>
                  ))}
                </ul>
              )}
            </section>

            <section className="pt-2 border-t border-[#f0f0f3]">
              <h3 className="text-[12px] tracking-[0.08em] uppercase font-semibold text-[#6e6e73] mb-2">Sessões recentes</h3>
              <ul className="space-y-1 text-[12px] text-[#6e6e73]">
                {data.sessions.map((s: any) => (
                  <li key={s.id} className="flex justify-between gap-3 border-b border-[#f5f5f7] py-1">
                    <span className="truncate">{s.ip_address || "—"} · {(s.user_agent || "").slice(0, 40)}</span>
                    <span className="whitespace-nowrap">{fmtDate(s.created_at)}</span>
                  </li>
                ))}
                {data.sessions.length === 0 && <li className="text-[#86868b]">Sem sessões.</li>}
              </ul>
            </section>

            <section className="pt-2 border-t border-[#f0f0f3]">
              <button onClick={remove} className="h-10 px-3 rounded-xl border border-red-200 text-red-600 hover:bg-red-50 text-[13px] font-medium flex items-center gap-1.5">
                <Trash2 className="h-3.5 w-3.5" /> Excluir cadastro
              </button>
            </section>
          </div>
        )}
      </div>
    </div>
  );
}

function Field({ label, value, onChange, type = "text" }: { label: string; value: string; onChange: (v: string) => void; type?: string }) {
  return (
    <label className="block">
      <div className="text-[11px] tracking-[0.08em] uppercase text-[#86868b] mb-1">{label}</div>
      <input type={type} value={value || ""} onChange={(e) => onChange(e.target.value)} className={fieldCls} />
    </label>
  );
}

function Toggle({ label, checked, onChange }: { label: string; checked: boolean; onChange: (b: boolean) => void }) {
  return (
    <label className="flex items-center gap-2 cursor-pointer">
      <input type="checkbox" checked={!!checked} onChange={(e) => onChange(e.target.checked)} className="h-4 w-4" />
      <span className="text-[13px]">{label}</span>
    </label>
  );
}