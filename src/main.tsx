import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import { APP_RELEASE_VERSION, APP_VERSION, VERSION_KEY, VERSION_URL } from "./lib/app-version";

const MAX_BOOT_RELOADS = 2;
const getBootReloadKey = (version: string) => `sth-boot-update-attempts:${version}`;

const isPreviewHost = () =>
  typeof window !== "undefined" &&
  (window.location.hostname.includes("lovableproject.com") ||
    window.location.hostname.includes("preview--"));

const forceRefreshToVersion = (version: string) => {
  const url = new URL(window.location.href);
  url.searchParams.set("_v", version.replace(/\+/g, "-"));
  url.searchParams.set("_rt", Date.now().toString());
  window.location.replace(url.toString());
};

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

const syncLatestBuild = async () => {
  if (typeof window === "undefined" || isPreviewHost()) return;

  const storedVersion = localStorage.getItem(VERSION_KEY);
  if (storedVersion !== APP_VERSION) {
    localStorage.setItem(VERSION_KEY, APP_VERSION);
  }

  try {
    const res = await fetch(`${VERSION_URL}?t=${Date.now()}`, {
      cache: "no-store",
      headers: { "Cache-Control": "no-cache", Pragma: "no-cache" },
    });

    if (!res.ok) return;

    const data = await res.json();
    const remoteVersion = typeof data?.version === "string" ? data.version : null;
    if (!remoteVersion) return;
    const remoteRelease = remoteVersion.split("+")[0] || remoteVersion;
    if (remoteRelease === APP_RELEASE_VERSION) return;

    const reloadKey = getBootReloadKey(remoteVersion);
    const attempts = Number(sessionStorage.getItem(reloadKey) || "0");
    if (attempts >= MAX_BOOT_RELOADS) return;

    sessionStorage.setItem(reloadKey, String(attempts + 1));
    forceRefreshToVersion(remoteVersion);
  } catch (_) {}
};

// Apply stored theme (admin-controlled via DB)
const theme = localStorage.getItem("app-theme") || "light";
document.documentElement.classList.remove("dark", "light");
document.documentElement.classList.add(theme);

// Always kill any leftover SW/caches in production (do not block render)
if (import.meta.env.PROD && !isPreviewHost()) {
  void killServiceWorkers().then(syncLatestBuild);
}

createRoot(document.getElementById("root")!).render(<App />);
