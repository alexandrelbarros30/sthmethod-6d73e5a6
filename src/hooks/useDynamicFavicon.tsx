import { useEffect } from "react";
import { useLandingSetting } from "@/hooks/useLandingData";

/**
 * Dynamically applies the favicon and OG image from landing_settings.
 * Call once at the app root level.
 */
export const useDynamicFavicon = () => {
  const faviconUrl = useLandingSetting("favicon_url");
  const ogImageUrl = useLandingSetting("og_image_url");
  const siteTitle = useLandingSetting("site_title");
  const siteDescription = useLandingSetting("site_description");

  useEffect(() => {
    if (!faviconUrl) return;
    let link = document.querySelector("link[rel='icon']") as HTMLLinkElement | null;
    if (!link) {
      link = document.createElement("link");
      link.rel = "icon";
      document.head.appendChild(link);
    }
    link.href = faviconUrl;
    link.type = faviconUrl.endsWith(".svg") ? "image/svg+xml" : "image/png";
  }, [faviconUrl]);

  useEffect(() => {
    const updateMeta = (attr: string, key: string, value: string) => {
      let el = document.querySelector(`meta[${attr}='${key}']`) as HTMLMetaElement | null;
      if (!el) {
        el = document.createElement("meta");
        el.setAttribute(attr === "property" ? "property" : "name", key);
        document.head.appendChild(el);
      }
      el.setAttribute("content", value);
    };
    if (ogImageUrl) {
      updateMeta("property", "og:image", ogImageUrl);
      updateMeta("name", "twitter:image", ogImageUrl);
    }
    if (siteTitle) {
      document.title = siteTitle;
      updateMeta("property", "og:title", siteTitle);
      updateMeta("name", "twitter:title", siteTitle);
    }
    if (siteDescription) {
      updateMeta("name", "description", siteDescription);
      updateMeta("property", "og:description", siteDescription);
      updateMeta("name", "twitter:description", siteDescription);
    }
  }, [ogImageUrl, siteTitle, siteDescription]);
};
