import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";

const PREVIEW_SW_RESET_KEY = "sth-preview-sw-reset-v1";

const clearPreviewCaches = async () => {
  if (typeof window === "undefined") return;

  const isPreviewHost = window.location.hostname.includes("preview--");
  if (!isPreviewHost) return;

  const hasActiveController = !!navigator.serviceWorker?.controller;

  if ("serviceWorker" in navigator) {
    const registrations = await navigator.serviceWorker.getRegistrations();
    await Promise.all(registrations.map((registration) => registration.unregister()));
  }

  if ("caches" in window) {
    const cacheKeys = await caches.keys();
    await Promise.all(cacheKeys.map((key) => caches.delete(key)));
  }

  const alreadyReloaded = sessionStorage.getItem(PREVIEW_SW_RESET_KEY) === "1";
  if (hasActiveController && !alreadyReloaded) {
    sessionStorage.setItem(PREVIEW_SW_RESET_KEY, "1");
    window.location.reload();
    return;
  }

  sessionStorage.setItem(PREVIEW_SW_RESET_KEY, "1");
};

void clearPreviewCaches();

createRoot(document.getElementById("root")!).render(<App />);
