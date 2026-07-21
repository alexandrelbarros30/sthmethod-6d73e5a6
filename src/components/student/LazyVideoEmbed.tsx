import { useEffect, useMemo, useRef, useState } from "react";
import { flushSync } from "react-dom";
import { Pause, Play } from "lucide-react";

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
  const [filePlaying, setFilePlaying] = useState(false);
  const [fileDuration, setFileDuration] = useState(0);
  const [fileCurrentTime, setFileCurrentTime] = useState(0);
  const [thumbIdx, setThumbIdx] = useState(0);
  const [thumbUnavailable, setThumbUnavailable] = useState(false);
  const [vimeoPoster, setVimeoPoster] = useState<string | null>(null);
  const fileVideoRef = useRef<HTMLVideoElement | null>(null);
  const ytId = kind === "embed" ? getYoutubeId(url) : null;
  const vimeoId = kind === "embed" ? getVimeoId(url) : null;

  useEffect(() => {
    setActive(false);
    setFilePlaying(false);
    setFileDuration(0);
    setFileCurrentTime(0);
    setThumbIdx(0);
    setThumbUnavailable(false);
  }, [url, posterUrl]);

  useEffect(() => {
    if (!active || kind !== "file") return;
    const video = fileVideoRef.current;
    if (!video) return;

    const play = async () => {
      try {
        await video.play();
        setFilePlaying(true);
      } catch {
        setFilePlaying(false);
      }
    };

    void play();
  }, [active, kind]);

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

  const playFileVideo = async () => {
    const video = fileVideoRef.current;
    if (!video) return;
    try {
      await video.play();
      setFilePlaying(true);
    } catch {
      setFilePlaying(false);
    }
  };

  const handleActivate = () => {
    if (kind === "file") {
      // Android WebView só libera play confiável quando o play() acontece no
      // mesmo gesto do usuário. O flushSync monta o <video> antes de chamar play.
      flushSync(() => setActive(true));
      void playFileVideo();
      return;
    }
    setActive(true);
  };

  const handleThumbError = () => {
    if (thumbIdx < thumbCandidates.length - 1) {
      setThumbIdx((current) => current + 1);
      return;
    }
    setThumbUnavailable(true);
  };

  if (active) {
    if (kind === "file") {
      const progress = fileDuration > 0 ? Math.min(100, Math.max(0, (fileCurrentTime / fileDuration) * 100)) : 0;
      const togglePlayback = async () => {
        const video = fileVideoRef.current;
        if (!video) return;
        if (video.paused) {
          await playFileVideo();
        } else {
          video.pause();
          setFilePlaying(false);
        }
      };

      return (
        <div className={`relative h-full w-full overflow-hidden bg-card ${className || ""}`}>
          <video
            ref={fileVideoRef}
            src={url}
            className="sth-workout-video absolute inset-0 h-full w-full object-cover"
            playsInline
            webkit-playsinline="true"
            preload="metadata"
            poster={thumbSrc || undefined}
            controls={false}
            disablePictureInPicture
            controlsList="nodownload noplaybackrate noremoteplayback"
            onLoadedMetadata={(event) => setFileDuration(event.currentTarget.duration || 0)}
            onTimeUpdate={(event) => setFileCurrentTime(event.currentTarget.currentTime || 0)}
            onPlay={() => setFilePlaying(true)}
            onPause={() => setFilePlaying(false)}
            onEnded={() => setFilePlaying(false)}
          />

          <button
            type="button"
            onClick={togglePlayback}
            className="absolute inset-0 z-10 cursor-pointer bg-transparent"
            aria-label={filePlaying ? "Pausar vídeo" : `Reproduzir vídeo${title ? `: ${title}` : ""}`}
          />

          <div className="absolute inset-x-0 bottom-0 z-20 flex h-11 items-center gap-2 bg-background/80 px-3 text-foreground shadow-[0_-10px_28px_-18px_hsl(var(--foreground))] ring-1 ring-border/35 backdrop-blur-md sm:h-12 sm:px-4">
            <button
              type="button"
              onClick={togglePlayback}
              className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-foreground text-background sm:h-9 sm:w-9"
              aria-label={filePlaying ? "Pausar vídeo" : "Reproduzir vídeo"}
            >
              {filePlaying ? (
                <Pause className="h-4 w-4 sm:h-4.5 sm:w-4.5" fill="currentColor" strokeWidth={1.8} />
              ) : (
                <Play className="ml-0.5 h-4 w-4 sm:h-4.5 sm:w-4.5" fill="currentColor" strokeWidth={1.8} />
              )}
            </button>
            <div className="h-1 flex-1 overflow-hidden rounded-full bg-muted">
              <div className="h-full rounded-full bg-primary" style={{ width: `${progress || 2}%` }} />
            </div>
            <span className="ml-1 h-2.5 w-2.5 shrink-0 rounded-full bg-foreground/85" aria-hidden="true" />
          </div>
        </div>
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
      onClick={handleActivate}
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

      <div className="absolute inset-x-0 bottom-0 z-20 flex h-11 items-center gap-2 bg-background/80 px-3 text-foreground shadow-[0_-10px_28px_-18px_hsl(var(--foreground))] ring-1 ring-border/35 backdrop-blur-md sm:h-12 sm:px-4">
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-foreground text-background sm:h-9 sm:w-9">
          <Play className="ml-0.5 h-4 w-4 sm:h-4.5 sm:w-4.5" fill="currentColor" strokeWidth={1.8} />
        </div>
        <div className="h-1 flex-1 overflow-hidden rounded-full bg-muted">
          <div className="h-full w-[14%] rounded-full bg-primary" />
        </div>
        <span className="ml-1 h-2.5 w-2.5 shrink-0 rounded-full bg-foreground/85" aria-hidden="true" />
      </div>
    </button>
  );
};

export default LazyVideoEmbed;