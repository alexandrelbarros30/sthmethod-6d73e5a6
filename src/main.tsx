import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";

const isPreviewHost = () =>
  typeof window !== "undefined" &&
  (window.location.hostname.includes("lovableproject.com") ||
    window.location.hostname.includes("preview--"));

const killServiceWorkers = async () => {
  if (typeof window === "undefined") return;
  try {
    if ("serviceWorker" in navigator) {
      const regs = await navigator.serviceWorker.getRegistrations();
      await Promise.all(regs.map((r) => r.unregister()));
    }
    if ("caches" in window) {
      const keys = await caches.keys();
      await Promise.all(keys.map((k) => caches.delete(k)));
    }
  } catch (_) {}
};

// Apply stored theme (admin-controlled via DB)
const theme = localStorage.getItem("app-theme") || "light";
document.documentElement.classList.remove("dark", "light");
document.documentElement.classList.add(theme);

// Always kill any leftover SW/caches in production (do not block render)
if (import.meta.env.PROD && !isPreviewHost()) {
  void killServiceWorkers();
}

createRoot(document.getElementById("root")!).render(<App />);
