import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";
import { VitePWA } from "vite-plugin-pwa";

// Self-destroying service worker — unregisters any previous SW and clears caches
const SW_KILL_SWITCH = `
self.addEventListener('install', () => { self.skipWaiting(); });
self.addEventListener('activate', (e) => {
  e.waitUntil((async () => {
    try {
      const keys = await caches.keys();
      await Promise.all(keys.map((k) => caches.delete(k)));
      const regs = await self.registration ? [self.registration] : [];
      await Promise.all(regs.map((r) => r.unregister()));
      const clientsList = await self.clients.matchAll({ type: 'window' });
      clientsList.forEach((c) => c.navigate(c.url));
    } catch (_) {}
  })());
});
self.addEventListener('fetch', () => {});
`;

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  build: {
    target: "es2017",
  },
  server: {
    host: "::",
    port: 8080,
    hmr: {
      overlay: false,
    },
  },
  plugins: [
    react(),
    mode === "development" && componentTagger(),
    VitePWA({
      injectRegister: false,
      registerType: "autoUpdate",
      strategies: "injectManifest",
      srcDir: "public",
      filename: "sw-kill.js",
      injectManifest: {
        injectionPoint: undefined,
      },
      devOptions: { enabled: false },
      manifest: false,
    }),
  ].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
}));
