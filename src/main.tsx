import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import { registerSW } from "virtual:pwa-register";

const SW_RESET_KEY = "sth-sw-reset-v2";
const SW_REFRESH_PARAM = "__sw_refresh";
const CURRENT_BUNDLE_MARKER = import.meta.env.PROD ? new URL(import.meta.url).pathname : "dev";

const isPreviewHost = () =>
  typeof window !== "undefined" && window.location.hostname.includes("preview--");

const getResetStorage = () => (isPreviewHost() ? sessionStorage : localStorage);

const clearStaleCaches = async (): Promise<boolean> => {
  if (typeof window === "undefined" || !import.meta.env.PROD) return true;

  const currentUrl = new URL(window.location.href);
  const alreadyRefreshed = currentUrl.searchParams.has(SW_REFRESH_PARAM);
  const resetMarker = getResetStorage().getItem(SW_RESET_KEY);

  if (!alreadyRefreshed && resetMarker === CURRENT_BUNDLE_MARKER) {
    return true;
  }

  try {
    if ("serviceWorker" in navigator) {
      const registrations = await navigator.serviceWorker.getRegistrations();
      await Promise.allSettled(registrations.map((registration) => registration.unregister()));
    }

    if ("caches" in window) {
      const cacheKeys = await caches.keys();
      await Promise.allSettled(cacheKeys.map((key) => caches.delete(key)));
    }
  } catch (_e) {
    // Ignore cache cleanup failures to avoid blocking app render
  }

  if (!alreadyRefreshed) {
    currentUrl.searchParams.set(SW_REFRESH_PARAM, `${Date.now()}`);
    window.location.replace(currentUrl.toString());
    return false;
  }

  currentUrl.searchParams.delete(SW_REFRESH_PARAM);
  window.history.replaceState(window.history.state, "", currentUrl.toString());
  getResetStorage().setItem(SW_RESET_KEY, CURRENT_BUNDLE_MARKER);
  return true;
};

const bootstrap = async () => {
  const canRender = await clearStaleCaches();
  if (!canRender) return;

  // Apply stored theme (admin-controlled via DB)
  const theme = localStorage.getItem("app-theme") || "light";
  document.documentElement.classList.remove("dark", "light");
  document.documentElement.classList.add(theme);

  if (import.meta.env.PROD && !isPreviewHost()) {
    registerSW({ immediate: true });
  }

  createRoot(document.getElementById("root")!).render(<App />);
};

void bootstrap();
