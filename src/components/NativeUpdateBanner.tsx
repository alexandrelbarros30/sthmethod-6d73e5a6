import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Download, X } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { APP_RELEASE_VERSION, VERSION_URL } from "@/lib/app-version";
import { compareVersions } from "@/lib/version-bump";

const CHECK_INTERVAL_MS = 5 * 60_000; // 5min
const DISMISS_KEY = "sth-native-update-dismissed";

const isNativeApp = () => {
  if (typeof window === "undefined") return false;
  const w = window as any;
  return !!w.Capacitor?.isNativePlatform?.();
};

const getReleaseVersion = (version: string) => version.split("+")[0] || version;

const fetchRemoteVersion = async (): Promise<string | null> => {
  try {
    // No app nativo o WebView carrega o HTML remoto (preview) OU os assets
    // empacotados. version.json é sempre buscado do domínio publicado.
    const res = await fetch(`https://sthmethod.com/version.json?t=${Date.now()}`, {
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

/**
 * Aviso de nova versão do APK dentro do app nativo (Android).
 * Compara version.json publicado contra o release embarcado no APK. Se houver
 * versão maior, mostra banner com botão "Baixar atualização" que abre a
 * release do GitHub no navegador externo. Não aparece em web/PWA.
 */
const NativeUpdateBanner = () => {
  const [show, setShow] = useState(false);
  const [remote, setRemote] = useState<string>("");
  const navigate = useNavigate();

  useEffect(() => {
    if (!isNativeApp()) return;
    let cancelled = false;

    const check = async () => {
      const rv = await fetchRemoteVersion();
      if (cancelled || !rv) return;
      const remoteRelease = getReleaseVersion(rv);
      const localRelease = getReleaseVersion(APP_RELEASE_VERSION);
      if (compareVersions(remoteRelease, localRelease) <= 0) return;
      const dismissed = localStorage.getItem(DISMISS_KEY);
      if (dismissed && dismissed === remoteRelease) return;
      setRemote(remoteRelease);
      setShow(true);
    };

    check();
    const id = window.setInterval(check, CHECK_INTERVAL_MS);
    return () => {
      cancelled = true;
      window.clearInterval(id);
    };
  }, []);

  const handleOpenSobre = () => {
    if (remote) localStorage.setItem(DISMISS_KEY, remote);
    setShow(false);
    navigate("/sobre");
  };

  const handleDismiss = () => {
    if (remote) localStorage.setItem(DISMISS_KEY, remote);
    setShow(false);
  };

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ y: -80, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: -80, opacity: 0 }}
          transition={{ type: "spring", damping: 22, stiffness: 300 }}
          className="fixed left-0 right-0 z-[9999] p-3 flex justify-center"
          style={{ top: "env(safe-area-inset-top, 12px)" }}
        >
          <div
            className="flex items-center gap-3 px-4 py-3 rounded-2xl shadow-2xl backdrop-blur-xl max-w-sm w-full"
            style={{
              background: "hsl(0 0% 8% / 0.95)",
              border: "0.5px solid hsl(145 60% 42% / 0.35)",
              boxShadow: "0 8px 32px hsl(0 0% 0% / 0.5)",
            }}
          >
            <div
              className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
              style={{ background: "hsl(145 60% 42% / 0.15)" }}
            >
              <Download className="w-4 h-4" style={{ color: "hsl(145 60% 42%)" }} />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-[13px] font-semibold truncate" style={{ color: "hsl(0 0% 96%)" }}>
                Nova versão do app
              </p>
              <p className="text-[11px] truncate" style={{ color: "hsl(0 0% 55%)" }}>
                v{remote} — veja detalhes em Sobre
              </p>
            </div>
            <button
              onClick={handleOpenSobre}
              className="px-3 py-1.5 rounded-lg text-[11px] font-semibold flex-shrink-0 transition-transform active:scale-95"
              style={{ background: "hsl(145 60% 42%)", color: "hsl(0 0% 100%)" }}
            >
              Ver
            </button>
            <button
              onClick={handleDismiss}
              className="p-1 flex-shrink-0"
              style={{ color: "hsl(0 0% 40%)" }}
              aria-label="Fechar"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default NativeUpdateBanner;