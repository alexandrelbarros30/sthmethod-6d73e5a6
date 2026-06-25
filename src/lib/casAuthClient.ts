import { supabase } from "@/integrations/supabase/client";

const TOKEN_KEY = "cas.auth.token";
const USER_KEY = "cas.auth.user";

export type CasUser = {
  id: string;
  full_name: string;
  email: string;
  birth_date: string;
  phone?: string | null;
  rg?: string | null;
  last_login_at?: string | null;
  created_at?: string;
  is_admin?: boolean;
  is_active?: boolean;
};

export function getCasToken(): string | null {
  try { return localStorage.getItem(TOKEN_KEY); } catch { return null; }
}
export function setCasToken(token: string | null) {
  try {
    if (token) localStorage.setItem(TOKEN_KEY, token);
    else localStorage.removeItem(TOKEN_KEY);
  } catch {}
}
export function getCasUserCached(): CasUser | null {
  try {
    const raw = localStorage.getItem(USER_KEY);
    return raw ? (JSON.parse(raw) as CasUser) : null;
  } catch { return null; }
}
export function setCasUserCached(user: CasUser | null) {
  try {
    if (user) localStorage.setItem(USER_KEY, JSON.stringify(user));
    else localStorage.removeItem(USER_KEY);
  } catch {}
}

async function call<T = any>(payload: Record<string, any>): Promise<T> {
  const token = getCasToken();
  const { data, error } = await supabase.functions.invoke("cas-auth", {
    body: payload,
    headers: token ? { Authorization: `Bearer ${token}` } : undefined,
  });
  if (error) {
    // supabase.functions.invoke returns the body on non-2xx in error.context.json
    const body: any = (error as any).context?.json ?? null;
    const msg = body?.error || error.message || "Erro de comunicação.";
    const e: any = new Error(msg);
    e.status = (error as any).context?.status;
    throw e;
  }
  if (data && (data as any).error) {
    const e: any = new Error((data as any).error);
    throw e;
  }
  return data as T;
}

export const casAuthApi = {
  register: (p: { full_name: string; email: string; birth_date: string; phone?: string; rg?: string; password: string }) =>
    call<{ user: CasUser; token: string; expiresAt: string }>({ action: "register", ...p }),
  login: (p: { email: string; password: string }) =>
    call<{ user: CasUser; token: string; expiresAt: string }>({ action: "login", ...p }),
  me: () => call<{ user: CasUser }>({ action: "me" }),
  logout: () => call<{ ok: true }>({ action: "logout" }),
  forgot: (p: { email: string; birth_date: string }) =>
    call<{ ok: true; message: string }>({
      action: "forgot", ...p, site_url: window.location.origin,
    }),
  reset: (p: { token: string; new_password: string }) =>
    call<{ ok: true }>({ action: "reset", ...p }),
  updateProfile: (p: Partial<Pick<CasUser, "full_name" | "phone" | "rg" | "birth_date">>) =>
    call<{ user: CasUser }>({ action: "update_profile", ...p }),
  changePassword: (p: { current_password: string; new_password: string }) =>
    call<{ ok: true }>({ action: "change_password", ...p }),
  historyList: (limit = 30) =>
    call<{ items: { id: string; query: string; discipline: string | null; has_answer: boolean; created_at: string }[] }>({ action: "history_list", limit }),
  historyAdd: (p: { query: string; discipline?: string | null; has_answer?: boolean }) =>
    call<{ ok: true }>({ action: "history_add", ...p }),
  historyClear: () => call<{ ok: true }>({ action: "history_clear" }),
  // ===== Admin =====
  adminMetrics: () => call<{
    users_total: number; users_active: number; users_logged_30d: number;
    searches_total: number; searches_7d: number;
  }>({ action: "admin_metrics" }),
  adminListUsers: (p: { q?: string; limit?: number } = {}) =>
    call<{ users: Array<CasUser & { searches_count: number }> }>({ action: "admin_list_users", ...p }),
  adminUserDetail: (id: string) =>
    call<{
      user: CasUser;
      history: { id: string; query: string; discipline: string | null; has_answer: boolean; created_at: string }[];
      sessions: { id: string; user_agent: string | null; ip_address: string | null; created_at: string; expires_at: string; revoked_at: string | null }[];
    }>({ action: "admin_user_detail", id }),
  adminUpdateUser: (p: { id: string } & Partial<Pick<CasUser, "full_name" | "email" | "phone" | "rg" | "birth_date" | "is_active" | "is_admin">>) =>
    call<{ user: CasUser }>({ action: "admin_update_user", ...p }),
  adminResetPassword: (p: { id: string; new_password: string }) =>
    call<{ ok: true }>({ action: "admin_reset_password", ...p }),
  adminDeleteUser: (id: string) =>
    call<{ ok: true }>({ action: "admin_delete_user", id }),
};