import { useState } from "react";
import { Play } from "lucide-react";

// Extrai o ID do YouTube a partir da URL de embed/watch/short.
const getYoutubeId = (url: string) => {
  const m = url.match(/(?:youtube(?:-nocookie)?\.com\/(?:watch\?v=|embed\/|shorts\/)|youtu\.be\/)([a-zA-Z0-9_-]+)/);
  return m?.[1] || null;
};

interface LazyVideoEmbedProps {
  url: string;
  title?: string;
  className?: string;
}

/**
 * Renderiza uma thumbnail leve (imagem) até o usuário tocar em "play".
 * Só então o <iframe> é montado. Evita travamentos no WebView do Android
 * quando muitos vídeos aparecem na mesma tela (tela de treino guiado).
 */
const LazyVideoEmbed = ({ url, title, className }: LazyVideoEmbedProps) => {
  const [active, setActive] = useState(false);
  const ytId = getYoutubeId(url);
  // Usa nocookie + playsinline pra reduzir peso no WebView.
  const embedSrc = ytId
    ? `https://www.youtube-nocookie.com/embed/${ytId}?autoplay=1&playsinline=1&rel=0&modestbranding=1`
    : url;
  const thumbSrc = ytId ? `https://img.youtube.com/vi/${ytId}/hqdefault.jpg` : null;

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
      className={`group relative w-full h-full bg-black ${className || ""}`}
      aria-label={`Reproduzir vídeo${title ? `: ${title}` : ""}`}
    >
      {thumbSrc && (
        <img
          src={thumbSrc}
          alt={title || "Vídeo"}
          className="w-full h-full object-cover opacity-90 group-hover:opacity-100 transition"
          loading="lazy"
          draggable={false}
        />
      )}
      <div className="absolute inset-0 flex items-center justify-center bg-black/30">
        <div className="w-16 h-16 rounded-full bg-primary text-primary-foreground flex items-center justify-center shadow-lg">
          <Play className="w-7 h-7 ml-1" fill="currentColor" />
        </div>
      </div>
    </button>
  );
};

export default LazyVideoEmbed;