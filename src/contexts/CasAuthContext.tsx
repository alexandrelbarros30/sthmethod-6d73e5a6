import { createContext, useCallback, useContext, useEffect, useState } from "react";
import { CasUser, casAuthApi, getCasToken, getCasUserCached, setCasToken, setCasUserCached } from "@/lib/casAuthClient";

type Ctx = {
  user: CasUser | null;
  loading: boolean;
  refresh: () => Promise<void>;
  login: (email: string, password: string) => Promise<CasUser>;
  register: (p: { full_name: string; email: string; birth_date: string; phone?: string; rg?: string; password: string }) => Promise<CasUser>;
  logout: () => Promise<void>;
  setUser: (u: CasUser | null) => void;
};

const CasAuthContext = createContext<Ctx | null>(null);

export function CasAuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUserState] = useState<CasUser | null>(() => getCasUserCached());
  const [loading, setLoading] = useState<boolean>(!!getCasToken());

  const setUser = useCallback((u: CasUser | null) => {
    setUserState(u);
    setCasUserCached(u);
  }, []);

  const refresh = useCallback(async () => {
    if (!getCasToken()) { setUser(null); setLoading(false); return; }
    try {
      const { user } = await casAuthApi.me();
      setUser(user);
    } catch {
      setCasToken(null);
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, [setUser]);

  useEffect(() => { refresh(); }, [refresh]);

  const login = useCallback(async (email: string, password: string) => {
    const res = await casAuthApi.login({ email, password });
    setCasToken(res.token);
    setUser(res.user);
    return res.user;
  }, [setUser]);

  const register = useCallback(async (p: Parameters<typeof casAuthApi.register>[0]) => {
    const res = await casAuthApi.register(p);
    setCasToken(res.token);
    setUser(res.user);
    return res.user;
  }, [setUser]);

  const logout = useCallback(async () => {
    try { await casAuthApi.logout(); } catch {}
    setCasToken(null);
    setUser(null);
  }, [setUser]);

  return (
    <CasAuthContext.Provider value={{ user, loading, refresh, login, register, logout, setUser }}>
      {children}
    </CasAuthContext.Provider>
  );
}

export function useCasAuth() {
  const ctx = useContext(CasAuthContext);
  if (!ctx) throw new Error("useCasAuth must be inside CasAuthProvider");
  return ctx;
}