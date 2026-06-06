import { useEffect } from "react";
import { useParams, Navigate } from "react-router-dom";
import AdminCrm from "./AdminCrm";

const MAP: Record<string, { provider: "zapi" | "wapi" | "wapi_sucesso"; manifest: string; theme: string; title: string }> = {
  comercial: { provider: "zapi",         manifest: "/manifest-comercial.webmanifest", theme: "#25D366", title: "Comercial · STH" },
  nutri:     { provider: "wapi",         manifest: "/manifest-nutri.webmanifest",     theme: "#10b981", title: "Fale com o Nutri · STH" },
  sucesso:   { provider: "wapi_sucesso", manifest: "/manifest-sucesso.webmanifest",   theme: "#a78bfa", title: "Sucesso do Aluno · STH" },
};

/**
 * Rota dedicada por canal para suportar instalação como PWA independente.
 * Troca dinamicamente o <link rel="manifest">, theme-color e título para que o
 * navegador (Chrome / Safari) ofereça instalar como app separado na tela inicial.
 */
export default function AdminChatChannel() {
  const { canal } = useParams<{ canal: string }>();
  const cfg = canal ? MAP[canal] : undefined;

  useEffect(() => {
    if (!cfg) return;
    const prevTitle = document.title;
    document.title = cfg.title;

    // Swap manifest
    let link = document.querySelector<HTMLLinkElement>('link[rel="manifest"]');
    const prevManifest = link?.href || null;
    if (!link) {
      link = document.createElement("link");
      link.rel = "manifest";
      document.head.appendChild(link);
    }
    link.href = cfg.manifest;

    // Theme color
    let theme = document.querySelector<HTMLMetaElement>('meta[name="theme-color"]');
    const prevTheme = theme?.content || null;
    if (!theme) {
      theme = document.createElement("meta");
      theme.name = "theme-color";
      document.head.appendChild(theme);
    }
    theme.content = cfg.theme;

    // Apple title
    let appleTitle = document.querySelector<HTMLMetaElement>('meta[name="apple-mobile-web-app-title"]');
    const prevApple = appleTitle?.content || null;
    if (!appleTitle) {
      appleTitle = document.createElement("meta");
      appleTitle.name = "apple-mobile-web-app-title";
      document.head.appendChild(appleTitle);
    }
    appleTitle.content = cfg.title.split(" · ")[0];

    return () => {
      document.title = prevTitle;
      if (link && prevManifest) link.href = prevManifest;
      if (theme && prevTheme) theme.content = prevTheme;
      if (appleTitle && prevApple) appleTitle.content = prevApple;
    };
  }, [cfg]);

  if (!cfg) return <Navigate to="/admin/crm" replace />;

  // AdminCrm lê ?canal=... e trava no canal correspondente
  return <AdminCrm forcedProvider={cfg.provider} />;
}