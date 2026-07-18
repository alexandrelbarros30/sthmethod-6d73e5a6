import { createContext, useCallback, useContext, useMemo, useRef, useState, type ReactNode } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { ShieldCheck, AlertTriangle } from "lucide-react";

// Reauth token lasts 5 min in memory so the admin isn't prompted repeatedly.
const REAUTH_TTL_MS = 5 * 60 * 1000;

type ReauthOptions = {
  reason: string;      // human-readable reason shown in dialog
  action: string;      // machine action name (e.g. "update_student_email")
  targetLabel?: string;
};

type Ctx = {
  requireReauth: (opts: ReauthOptions) => Promise<boolean>;
  hasFreshReauth: () => boolean;
};

const AdminReauthContext = createContext<Ctx | null>(null);

export function AdminReauthProvider({ children }: { children: ReactNode }) {
  const lastReauthRef = useRef<number>(0);
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const resolverRef = useRef<((v: boolean) => void) | null>(null);

  const hasFreshReauth = useCallback(() => {
    return Date.now() - lastReauthRef.current < REAUTH_TTL_MS;
  }, []);

  const requireReauth = useCallback((opts: ReauthOptions) => {
    return new Promise<boolean>((resolve) => {
      if (hasFreshReauth()) {
        resolve(true);
        return;
      }
      setReason(opts.reason);
      setPassword("");
      setError(null);
      resolverRef.current = (ok: boolean) => {
        if (ok) {
          // fire-and-forget audit log
          supabase.rpc("log_admin_access", {
            _action: opts.action,
            _resource_type: "reauth",
            _target_user_id: null,
            _target_label: opts.targetLabel ?? null,
            _metadata: { reason: opts.reason },
            _reauth_used: true,
          }).then(() => {});
        }
        resolve(ok);
      };
      setOpen(true);
    });
  }, [hasFreshReauth]);

  const handleConfirm = async () => {
    if (!password) { setError("Digite sua senha."); return; }
    setLoading(true); setError(null);
    try {
      const { data: sess } = await supabase.auth.getUser();
      const email = sess.user?.email;
      if (!email) throw new Error("Sessão inválida.");
      const { error: signErr } = await supabase.auth.signInWithPassword({ email, password });
      if (signErr) throw new Error("Senha incorreta.");
      lastReauthRef.current = Date.now();
      setOpen(false);
      resolverRef.current?.(true);
      resolverRef.current = null;
    } catch (e: any) {
      setError(e.message || "Falha na verificação.");
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    setOpen(false);
    resolverRef.current?.(false);
    resolverRef.current = null;
  };

  const value = useMemo<Ctx>(() => ({ requireReauth, hasFreshReauth }), [requireReauth, hasFreshReauth]);

  return (
    <AdminReauthContext.Provider value={value}>
      {children}
      <Dialog open={open} onOpenChange={(o) => { if (!o) handleCancel(); }}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-primary" />
              Confirmação de segurança
            </DialogTitle>
            <DialogDescription>{reason}</DialogDescription>
          </DialogHeader>
          <div className="space-y-3 py-2">
            <Label htmlFor="reauth-pw">Sua senha de admin</Label>
            <Input
              id="reauth-pw"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter") handleConfirm(); }}
              autoFocus
              placeholder="••••••••"
            />
            {error && (
              <div className="flex items-center gap-2 text-sm text-destructive">
                <AlertTriangle className="w-4 h-4" /> {error}
              </div>
            )}
            <p className="text-xs text-muted-foreground">
              Após confirmar, a autorização vale por 5 minutos para novas ações sensíveis.
            </p>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={handleCancel} disabled={loading}>Cancelar</Button>
            <Button onClick={handleConfirm} disabled={loading}>
              {loading ? "Verificando…" : "Confirmar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AdminReauthContext.Provider>
  );
}

export function useAdminReauth(): Ctx {
  const ctx = useContext(AdminReauthContext);
  if (!ctx) {
    // Safe fallback so calling in non-admin contexts doesn't crash.
    return {
      requireReauth: async () => true,
      hasFreshReauth: () => true,
    };
  }
  return ctx;
}

// Convenience helper: log an admin action without a reauth challenge.
export async function logAdminAccess(params: {
  action: string;
  resourceType: string;
  targetUserId?: string | null;
  targetLabel?: string | null;
  metadata?: Record<string, any>;
  reauthUsed?: boolean;
}) {
  try {
    await supabase.rpc("log_admin_access", {
      _action: params.action,
      _resource_type: params.resourceType,
      _target_user_id: params.targetUserId ?? null,
      _target_label: params.targetLabel ?? null,
      _metadata: params.metadata ?? {},
      _reauth_used: params.reauthUsed ?? false,
    });
  } catch {
    // best-effort; never throw
  }
}