import { readFileSync } from "node:fs";
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";

const packageJson = JSON.parse(
  readFileSync(new URL("./package.json", import.meta.url), "utf-8"),
) as { version?: string };

const releaseVersion = packageJson.version || "0.0.0";
const buildId = new Date().toISOString().replace(/[-:.TZ]/g, "");
const appVersion = `${releaseVersion}+${buildId}`;

const appVersionAssetPlugin = () => ({
  name: "app-version-asset",
  generateBundle() {
    this.emitFile({
      type: "asset",
      fileName: "app-version.json",
      source: JSON.stringify({
        version: appVersion,
        releaseVersion,
        buildId,
      }),
    });
  },
});

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  define: {
    __APP_BUILD_ID__: JSON.stringify(buildId),
    __APP_RELEASE_VERSION__: JSON.stringify(releaseVersion),
  },
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
    appVersionAssetPlugin(),
    mode === "development" && componentTagger(),
  ].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
}));
