import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";

const PREVIEW_SW_RESET_KEY = "sth-preview-sw-reset-v1";
const PREVIEW_REFRESH_PARAM = "__preview_refresh";
const PREVIEW_BUNDLE_MARKER = import.meta.env.PROD ? new URL(import.meta.url).pathname : "dev";

const clearPreviewCaches = async (): Promise<boolean> => {
  if (typeof window === "undefined") return true;

  const isPreviewHost = window.location.hostname.includes("preview--");
  if (!isPreviewHost) return true;

  const currentUrl = new URL(window.location.href);
  const alreadyRefreshed = currentUrl.searchParams.has(PREVIEW_REFRESH_PARAM);
  const resetMarker = sessionStorage.getItem(PREVIEW_SW_RESET_KEY);

  if (!alreadyRefreshed && resetMarker === PREVIEW_BUNDLE_MARKER) {
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
  } catch {
    // Ignore cache cleanup failures to avoid blocking preview render
  }

  if (!alreadyRefreshed) {
    currentUrl.searchParams.set(PREVIEW_REFRESH_PARAM, `${Date.now()}`);
    window.location.replace(currentUrl.toString());
    return false;
  }

  currentUrl.searchParams.delete(PREVIEW_REFRESH_PARAM);
  window.history.replaceState(window.history.state, "", currentUrl.toString());
  sessionStorage.setItem(PREVIEW_SW_RESET_KEY, PREVIEW_BUNDLE_MARKER);
  return true;
};

const bootstrap = async () => {
  const canRender = await clearPreviewCaches();
  if (!canRender) return;

  createRoot(document.getElementById("root")!).render(<App />);
};

void bootstrap();
