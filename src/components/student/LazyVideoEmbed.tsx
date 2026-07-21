import { useEffect, useMemo, useState } from "react";
import { Play, Video } from "lucide-react";

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
}

/**
 * Renderiza uma thumbnail leve (imagem) até o usuário tocar em "play".
 * Só então o <iframe> é montado. Evita travamentos no WebView do Android
 * quando muitos vídeos aparecem na mesma tela (tela de treino guiado).
 */
const LazyVideoEmbed = ({ url, title, className, posterUrl }: LazyVideoEmbedProps) => {
  const [active, setActive] = useState(false);
  const [thumbIdx, setThumbIdx] = useState(0);
  const [thumbUnavailable, setThumbUnavailable] = useState(false);
  const [vimeoPoster, setVimeoPoster] = useState<string | null>(null);
  const ytId = getYoutubeId(url);
  const vimeoId = getVimeoId(url);

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
      <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-gradient-to-br from-muted via-background to-card p-5 text-center">
        <div className="flex h-12 w-12 items-center justify-center rounded-full border border-border/60 bg-background/80 text-primary shadow-sm">
          <Video className="h-5 w-5" strokeWidth={1.8} />
        </div>
        <div className="space-y-1">
          <p className="text-[10px] font-medium uppercase tracking-[0.22em] text-muted-foreground">
            Vídeo de referência técnica
          </p>
          {title && (
            <p className="line-clamp-2 text-sm font-semibold leading-snug text-foreground">
              {title}
            </p>
          )}
        </div>
      </div>

      {thumbSrc && !thumbUnavailable && (
        <img
          key={thumbSrc}
          src={thumbSrc}
          alt={title || "Vídeo"}
          className="relative z-10 h-full w-full object-cover opacity-95 group-hover:opacity-100"
          loading="eager"
          decoding="async"
          draggable={false}
          referrerPolicy="no-referrer"
          onError={handleThumbError}
        />
      )}
      <div className="absolute inset-0 z-20 flex items-center justify-center bg-foreground/20">
        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-lg shadow-primary/30 transition group-hover:scale-105">
          <Play className="ml-1 h-7 w-7" fill="currentColor" />
        </div>
      </div>
    </button>
  );
};

export default LazyVideoEmbed;