import { useEffect } from "react";

/**
 * Troca manifest, theme-color, título e apple-touch-icon para a identidade do
 * app STH AI enquanto o usuário estiver em qualquer rota /ai. Restaura as tags
 * originais ao sair, para o restante do site continuar com o STH METHOD.
 */
export function useAiManifest() {
  useEffect(() => {
    const head = document.head;

    const ensure = (selector: string, create: () => HTMLElement) => {
      let el = head.querySelector(selector) as HTMLElement | null;
      let created = false;
      if (!el) {
        el = create();
        head.appendChild(el);
        created = true;
      }
      return { el, created };
    };

    const manifest = ensure('link[rel="manifest"]', () => {
      const l = document.createElement("link");
      l.rel = "manifest";
      return l;
    });
    const themeColor = ensure('meta[name="theme-color"]', () => {
      const m = document.createElement("meta");
      m.setAttribute("name", "theme-color");
      return m;
    });
    const appleTitle = ensure('meta[name="apple-mobile-web-app-title"]', () => {
      const m = document.createElement("meta");
      m.setAttribute("name", "apple-mobile-web-app-title");
      return m;
    });
    const appleTouch = ensure('link[rel="apple-touch-icon"]', () => {
      const l = document.createElement("link");
      l.rel = "apple-touch-icon";
      return l;
    });

    const prev = {
      manifest: (manifest.el as HTMLLinkElement).href,
      theme: (themeColor.el as HTMLMetaElement).content,
      title: (appleTitle.el as HTMLMetaElement).content,
      touch: (appleTouch.el as HTMLLinkElement).href,
    };

    (manifest.el as HTMLLinkElement).href = "/manifest-ai.webmanifest?v=1";
    (themeColor.el as HTMLMetaElement).content = "#000000";
    (appleTitle.el as HTMLMetaElement).content = "STH AI";
    (appleTouch.el as HTMLLinkElement).href = "/pwa-ai-192.png?v=1";

    return () => {
      if (manifest.created) manifest.el.remove();
      else (manifest.el as HTMLLinkElement).href = prev.manifest;
      if (themeColor.created) themeColor.el.remove();
      else (themeColor.el as HTMLMetaElement).content = prev.theme;
      if (appleTitle.created) appleTitle.el.remove();
      else (appleTitle.el as HTMLMetaElement).content = prev.title;
      if (appleTouch.created) appleTouch.el.remove();
      else (appleTouch.el as HTMLLinkElement).href = prev.touch;
    };
  }, []);
}

export default useAiManifest;
