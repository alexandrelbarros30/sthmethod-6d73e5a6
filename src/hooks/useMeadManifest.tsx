import { useEffect } from "react";

/**
 * Swap the document manifest, theme-color and apple title to the MEAD PWA
 * while the user is inside any /cas or /mead route. Restores the previous
 * tags on unmount so the rest of the site keeps the STH METHOD manifest.
 */
export function useMeadManifest() {
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
      docTitle: document.title,
    };

    (manifest.el as HTMLLinkElement).href = "/manifest-mead.webmanifest";
    (themeColor.el as HTMLMetaElement).content = "#f5f5f7";
    (appleTitle.el as HTMLMetaElement).content = "MEAD";
    (appleTouch.el as HTMLLinkElement).href =
      "/__l5e/assets-v1/0c5a2aa3-bb25-4d3b-9291-d4d337cccf15/mead-logo.png";

    return () => {
      if (manifest.created) manifest.el.remove();
      else (manifest.el as HTMLLinkElement).href = prev.manifest;
      if (themeColor.created) themeColor.el.remove();
      else (themeColor.el as HTMLMetaElement).content = prev.theme;
      if (appleTitle.created) appleTitle.el.remove();
      else (appleTitle.el as HTMLMetaElement).content = prev.title;
      if (appleTouch.created) appleTouch.el.remove();
      else (appleTouch.el as HTMLLinkElement).href = prev.touch;
      document.title = prev.docTitle;
    };
  }, []);
}