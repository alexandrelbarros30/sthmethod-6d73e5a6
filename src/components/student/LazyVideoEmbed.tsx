import { useEffect, useMemo, useState } from "react";
import { ChevronRight, Play } from "lucide-react";

// Extrai o ID do YouTube a partir da URL de embed/watch/short.
const getYoutubeId = (url: string) => {
  const m = url.match(/(?:youtube(?:-nocookie)?\.com\/(?:watch\?v=|embed\/|shorts\/)|youtu\.be\/)([a-zA-Z0-9_-]+)/);
  return m?.[1] || null;
};

const getVimeoId = (url: string) => {
  const m = url.match(/vimeo\.com\/(?:video\/)?(\d+)/);
  return m?.[1] || null;
};

const normalizeImageUrl = (raw?: string | null) => {
  if (!raw) return "";
  try {
    const u = new URL(raw);
    u.pathname = u.pathname
      .split("/")
      .map((seg) => {
        try {
          return encodeURIComponent(decodeURIComponent(seg));
        } catch {
          return encodeURIComponent(seg);
        }
      })
      .join("/");
    return u.toString();
  } catch {
    return raw;
  }
};

interface LazyVideoEmbedProps {
  url: string;
  title?: string;
  className?: string;
  posterUrl?: string | null;
  /**
   * "embed" para YouTube/Vimeo (default) ou "file" para MP4/WebM. Em ambos os
   * casos, exibimos o mesmo preview estilizado até o usuário tocar em play —
   * evita o overlay verde nativo do WebView Android em <video>.
   */
  kind?: "embed" | "file";
}

/**
 * Renderiza uma thumbnail leve (imagem) até o usuário tocar em "play".
 * Só então o <iframe> é montado. Evita travamentos no WebView do Android
 * quando muitos vídeos aparecem na mesma tela (tela de treino guiado).
 */
const LazyVideoEmbed = ({ url, title, className, posterUrl, kind = "embed" }: LazyVideoEmbedProps) => {
  const [active, setActive] = useState(false);
  const [thumbIdx, setThumbIdx] = useState(0);
  const [thumbUnavailable, setThumbUnavailable] = useState(false);
  const [vimeoPoster, setVimeoPoster] = useState<string | null>(null);
  const ytId = kind === "embed" ? getYoutubeId(url) : null;
  const vimeoId = kind === "embed" ? getVimeoId(url) : null;

  useEffect(() => {
    setThumbIdx(0);
    setThumbUnavailable(false);
  }, [url, posterUrl]);

  useEffect(() => {
    let cancelled = false;
    setVimeoPoster(null);
    if (!vimeoId) return;

    fetch(`https://vimeo.com/api/oembed.json?url=${encodeURIComponent(`https://vimeo.com/${vimeoId}`)}`)
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (!cancelled && data?.thumbnail_url) {
          setVimeoPoster(normalizeImageUrl(data.thumbnail_url));
          setThumbIdx(0);
          setThumbUnavailable(false);
        }
      })
      .catch(() => undefined);

    return () => {
      cancelled = true;
    };
  }, [vimeoId]);

  // Usa nocookie + playsinline pra reduzir peso no WebView.
  const embedSrc = ytId
    ? `https://www.youtube-nocookie.com/embed/${ytId}?autoplay=1&playsinline=1&rel=0&modestbranding=1`
    : url;

  // APK/WebView Android é mais estável com JPG já visível; não dependemos de
  // onLoad nem de WebP. Para Vimeo/ST Coach, usa a capa do cadastro e oEmbed.
  const thumbCandidates = useMemo(() => {
    const candidates = [
      normalizeImageUrl(posterUrl),
      ytId ? `https://i.ytimg.com/vi/${ytId}/hqdefault.jpg` : "",
      ytId ? `https://i.ytimg.com/vi/${ytId}/mqdefault.jpg` : "",
      ytId ? `https://i.ytimg.com/vi/${ytId}/0.jpg` : "",
      ytId ? `https://img.youtube.com/vi/${ytId}/hqdefault.jpg` : "",
      vimeoPoster,
    ].filter(Boolean) as string[];

    return Array.from(new Set(candidates));
  }, [posterUrl, vimeoPoster, ytId]);

  const thumbSrc = thumbCandidates[thumbIdx] || null;

  const handleThumbError = () => {
    if (thumbIdx < thumbCandidates.length - 1) {
      setThumbIdx((current) => current + 1);
      return;
    }
    setThumbUnavailable(true);
  };

  if (active) {
    if (kind === "file") {
      return (
        <video
          src={url}
          className={className || "w-full h-full"}
          controls
          autoPlay
          playsInline
          preload="metadata"
          poster={thumbSrc || undefined}
        />
      );
    }
    return (
      <iframe
        src={embedSrc}
        className={className || "w-full h-full"}
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
        allowFullScreen
        title={title}
      />
    );
  }

  return (
    <button
      type="button"
      onClick={() => setActive(true)}
      className={`group relative w-full h-full overflow-hidden bg-card ${className || ""}`}
      aria-label={`Reproduzir vídeo${title ? `: ${title}` : ""}`}
    >
      {thumbSrc && !thumbUnavailable && (
        <img
          key={thumbSrc}
          src={thumbSrc}
          alt={title || "Vídeo"}
          className="absolute inset-0 h-full w-full object-cover"
          loading="eager"
          decoding="async"
          draggable={false}
          referrerPolicy="no-referrer"
          onError={handleThumbError}
        />
      )}

      {(!thumbSrc || thumbUnavailable) && (
        <div className="absolute inset-0 flex items-center justify-center bg-muted text-center">
          <p className="max-w-[80%] text-sm font-semibold leading-snug text-foreground">
            {title || "Vídeo de referência técnica"}
          </p>
        </div>
      )}

      <div className="absolute inset-x-3 bottom-3 z-20 flex items-center gap-3 rounded-md bg-background/90 p-2 text-foreground shadow-lg ring-1 ring-border/50 backdrop-blur-sm">
        <div className="flex h-12 w-14 shrink-0 items-center justify-center rounded-md bg-foreground text-background">
          <Play className="ml-0.5 h-7 w-7" fill="currentColor" strokeWidth={1.8} />
        </div>
        <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-muted">
          <div className="h-full w-[12%] rounded-full bg-primary" />
        </div>
        <ChevronRight className="h-7 w-7 shrink-0 text-foreground" strokeWidth={3} />
      </div>
    </button>
  );
};

export default LazyVideoEmbed;