import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { RefreshCw, X } from "lucide-react";

const APP_VERSION = "1.4.2";
const VERSION_KEY = "sth-app-version";

const UpdateBanner = () => {
  const [show, setShow] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem(VERSION_KEY);
    if (stored && stored !== APP_VERSION) {
      setShow(true);
    }
    localStorage.setItem(VERSION_KEY, APP_VERSION);
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
                v{APP_VERSION} — Performance e novos recursos
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
