import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { RefreshCw, X } from "lucide-react";

const APP_VERSION = "1.6.4";
const VERSION_KEY = "sth-app-version";
const AUTO_RELOAD_KEY = "sth-auto-reload-version";
const VERSION_URL = "/version.json";
const POLL_INTERVAL_MS = 15_000;

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
    const stored = localStorage.getItem(VERSION_KEY);
    if (stored && stored !== APP_VERSION) {
      setShow(true);
    }
    localStorage.setItem(VERSION_KEY, APP_VERSION);

    let cancelled = false;
    const check = async () => {
      const remote = await fetchRemoteVersion();
      if (cancelled || !remote) return;
      if (remote !== APP_VERSION) {
        setRemoteVersion(remote);
        setShow(true);
        // Auto-reload once per new version (Safari iOS / Chrome aggressive cache bypass)
        const lastAutoReload = localStorage.getItem(AUTO_RELOAD_KEY);
        if (lastAutoReload !== remote) {
          localStorage.setItem(AUTO_RELOAD_KEY, remote);
          try {
            if ("caches" in window) {
              const keys = await caches.keys();
              await Promise.all(keys.map((k) => caches.delete(k)));
            }
            if ("serviceWorker" in navigator) {
              const regs = await navigator.serviceWorker.getRegistrations();
              await Promise.all(regs.map((r) => r.unregister()));
            }
          } catch {}
          setTimeout(() => {
            const url = new URL(window.location.href);
            url.searchParams.set("_v", remote);
            window.location.replace(url.toString());
          }, 500);
        }
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
    // Clear caches and reload
    if ("caches" in window) {
      caches.keys().then((keys) => Promise.all(keys.map((k) => caches.delete(k))));
    }
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker.getRegistrations().then((regs) =>
        regs.forEach((r) => r.unregister())
      );
    }
    setTimeout(() => window.location.reload(), 300);
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
                v{remoteVersion} — Toque em Atualizar para aplicar
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
