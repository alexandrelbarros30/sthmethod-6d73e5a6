import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { RefreshCw, X } from "lucide-react";
import { APP_VERSION, VERSION_KEY, VERSION_URL } from "@/lib/app-version";

const POLL_INTERVAL_MS = 15_000;
const MAX_AUTO_RELOADS = 2;
const getReloadAttemptKey = (version: string) => `sth-update-attempts:${version}`;

const getReleaseVersion = (version: string) => version.split("+")[0] || version;

const clearClientCaches = async () => {
  try {
    if ("caches" in window) {
      const keys = await caches.keys();
      await Promise.all(keys.map((k) => caches.delete(k)));
    }
    if ("serviceWorker" in navigator) {
      const regs = await navigator.serviceWorker.getRegistrations();
      await Promise.all(regs.map((r) => r.unregister()));
    }
  } catch {
    // noop
  }
};

const forceRefreshToVersion = async (version: string) => {
  await clearClientCaches();
  localStorage.setItem(VERSION_KEY, version);

  const url = new URL(window.location.href);
  url.searchParams.set("_v", version.replace(/\+/g, "-"));
  url.searchParams.set("_rt", Date.now().toString());
  window.location.replace(url.toString());
};

const fetchRemoteVersion = async (): Promise<string | null> => {
  try {
    const res = await fetch(`${VERSION_URL}?t=${Date.now()}`, {
      cache: "no-store",
      headers: { "Cache-Control": "no-cache", Pragma: "no-cache" },
    });
    if (!res.ok) return null;
    const data = await res.json();
    return typeof data?.version === "string" ? data.version : null;
  } catch {
    return null;
  }
};

const UpdateBanner = () => {
  const [show, setShow] = useState(false);
  const [remoteVersion, setRemoteVersion] = useState<string>(APP_VERSION);

  useEffect(() => {
    // Sempre sincroniza o storage com a versão atual ao montar.
    // Não mostra banner baseado em storage — apenas comparação real com servidor.
    localStorage.setItem(VERSION_KEY, APP_VERSION);

    let cancelled = false;
    const check = async () => {
      const remote = await fetchRemoteVersion();
      if (cancelled || !remote) return;
      if (remote !== APP_VERSION) {
        setRemoteVersion(remote);
        setShow(true);
        const reloadKey = getReloadAttemptKey(remote);
        const attempts = Number(sessionStorage.getItem(reloadKey) || "0");
        if (attempts < MAX_AUTO_RELOADS) {
          sessionStorage.setItem(reloadKey, String(attempts + 1));
          setTimeout(() => {
            void forceRefreshToVersion(remote);
          }, 500);
        }
      } else {
        // Versão remota igual à atual — garante que banner não apareça
        setShow(false);
        localStorage.setItem(VERSION_KEY, APP_VERSION);
      }
    };
    check();
    const interval = window.setInterval(check, POLL_INTERVAL_MS);
    const onFocus = () => check();
    window.addEventListener("focus", onFocus);
    document.addEventListener("visibilitychange", onFocus);
    return () => {
      cancelled = true;
      window.clearInterval(interval);
      window.removeEventListener("focus", onFocus);
      document.removeEventListener("visibilitychange", onFocus);
    };
  }, []);

  const handleUpdate = () => {
    void forceRefreshToVersion(remoteVersion);
  };

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ y: -80, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: -80, opacity: 0 }}
          transition={{ type: "spring", damping: 20, stiffness: 300 }}
          className="fixed top-0 left-0 right-0 z-[9999] p-3 flex justify-center"
          style={{ paddingTop: "env(safe-area-inset-top, 12px)" }}
        >
          <div
            className="flex items-center gap-3 px-4 py-3 rounded-2xl shadow-2xl backdrop-blur-xl max-w-sm w-full"
            style={{
              background: "hsl(0 0% 8% / 0.95)",
              border: "0.5px solid hsl(145 60% 42% / 0.3)",
              boxShadow: "0 8px 32px hsl(0 0% 0% / 0.5)",
            }}
          >
            <div
              className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
              style={{ background: "hsl(145 60% 42% / 0.15)" }}
            >
              <RefreshCw className="w-4 h-4" style={{ color: "hsl(145 60% 42%)" }} />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-[13px] font-semibold" style={{ color: "hsl(0 0% 96%)" }}>
                Nova atualização disponível
              </p>
              <p className="text-[11px]" style={{ color: "hsl(0 0% 55%)" }}>
                v{getReleaseVersion(remoteVersion)} — Toque em Atualizar para aplicar
              </p>
            </div>
            <button
              onClick={handleUpdate}
              className="px-3 py-1.5 rounded-lg text-[11px] font-semibold flex-shrink-0 transition-transform active:scale-95"
              style={{
                background: "hsl(145 60% 42%)",
                color: "hsl(0 0% 100%)",
              }}
            >
              Atualizar
            </button>
            <button
              onClick={() => setShow(false)}
              className="p-1 flex-shrink-0"
              style={{ color: "hsl(0 0% 40%)" }}
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default UpdateBanner;
