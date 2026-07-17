import { Dumbbell, Play, Video } from "lucide-react";
import { cn } from "@/lib/utils";
import StCoachCredit, { isStCoachVideoUrl } from "@/components/shared/StCoachCredit";

type MediaKind = "image" | "video" | "embed";

export interface ExerciseMediaSource {
  kind: MediaKind;
  url: string;
  embedUrl?: string;
  thumbUrl?: string;
  label: string;
}

const normalizeUrl = (url?: string | null) => (url || "").trim();

const getYoutubeId = (url: string) => {
  const match = url.match(/(?:youtube\.com\/(?:watch\?v=|embed\/|shorts\/)|youtu\.be\/)([a-zA-Z0-9_-]+)/);
  return match?.[1] || null;
};

const getVimeoId = (url: string) => {
  const match = url.match(/vimeo\.com\/(?:video\/)?(\d+)/);
  return match?.[1] || null;
};

const isImageUrl = (url: string) => /\.(gif|png|jpe?g|webp|avif|bmp|svg)(?:[?#].*)?$/i.test(url);
const isVideoUrl = (url: string) => /\.(mp4|webm|ogg|mov|m4v)(?:[?#].*)?$/i.test(url);

const sourceFromUrl = (url: string, origin: "video" | "image" | "generic"): ExerciseMediaSource | null => {
  const cleanUrl = normalizeUrl(url);
  if (!cleanUrl) return null;

  const youtubeId = getYoutubeId(cleanUrl);
  if (youtubeId) {
    return {
      kind: "embed",
      url: cleanUrl,
      embedUrl: `https://www.youtube.com/embed/${youtubeId}`,
      thumbUrl: `https://img.youtube.com/vi/${youtubeId}/mqdefault.jpg`,
      label: "YouTube",
    };
  }

  const vimeoId = getVimeoId(cleanUrl);
  if (vimeoId) {
    return {
      kind: "embed",
      url: cleanUrl,
      embedUrl: `https://player.vimeo.com/video/${vimeoId}`,
      label: "Vimeo",
    };
  }

  if (isImageUrl(cleanUrl)) {
    return { kind: "image", url: cleanUrl, label: /\.gif(?:[?#].*)?$/i.test(cleanUrl) ? "GIF" : "Imagem" };
  }

  if (isVideoUrl(cleanUrl) || origin === "video") {
    return { kind: "video", url: cleanUrl, label: "Vídeo" };
  }

  return { kind: "image", url: cleanUrl, label: "Imagem" };
};

export const getExerciseMediaSource = ({
  videoUrl,
  imageUrl,
  url,
}: {
  videoUrl?: string | null;
  imageUrl?: string | null;
  url?: string | null;
}): ExerciseMediaSource | null => {
  return (
    sourceFromUrl(normalizeUrl(videoUrl), "video") ||
    sourceFromUrl(normalizeUrl(imageUrl), "image") ||
    sourceFromUrl(normalizeUrl(url), "generic")
  );
};

interface ExerciseMediaPreviewProps {
  videoUrl?: string | null;
  imageUrl?: string | null;
  url?: string | null;
  alt: string;
  mode?: "thumb" | "player";
  className?: string;
  showBadge?: boolean;
  hidePlaceholder?: boolean;
}

const ExerciseMediaPreview = ({
  videoUrl,
  imageUrl,
  url,
  alt,
  mode = "thumb",
  className,
  showBadge = false,
  hidePlaceholder = false,
}: ExerciseMediaPreviewProps) => {
  const media = getExerciseMediaSource({ videoUrl, imageUrl, url });

  if (!media) {
    if (hidePlaceholder) return null;
    return (
      <div className={cn("flex items-center justify-center rounded-md border border-border bg-muted", className)}>
        <Dumbbell className="w-4 h-4 text-muted-foreground" />
      </div>
    );
  }

  const isPlayer = mode === "player";
  const mediaClass = isPlayer ? "w-full h-full object-contain" : "w-full h-full object-cover";
  const isStCoach = isStCoachVideoUrl(media.url) || isStCoachVideoUrl(media.embedUrl);

  return (
    <div className={cn("relative overflow-hidden rounded-md border border-border bg-muted", className)}>
      {media.kind === "embed" && isPlayer ? (
        <iframe
          src={media.embedUrl || media.url}
          title={`Vídeo - ${alt}`}
          className="w-full h-full"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
          allowFullScreen
        />
      ) : media.kind === "embed" && media.thumbUrl ? (
        <img src={media.thumbUrl} alt={alt} className={mediaClass} loading="lazy" draggable={false} />
      ) : media.kind === "embed" ? (
        <div className="flex h-full w-full items-center justify-center bg-muted">
          <Video className="h-5 w-5 text-primary" />
        </div>
      ) : media.kind === "image" ? (
        <img src={media.url} alt={alt} className={mediaClass} loading="lazy" draggable={false} />
      ) : isPlayer ? (
        <video src={media.url} controls playsInline preload="metadata" className="w-full h-full object-contain" />
      ) : (
        <video src={media.url} muted playsInline autoPlay loop preload="metadata" className="w-full h-full object-cover" />
      )}

      {showBadge && (
        <span className="absolute left-1.5 bottom-1.5 inline-flex items-center gap-1 rounded bg-background/85 px-1.5 py-0.5 text-[10px] font-semibold text-foreground shadow-sm">
          {media.kind === "image" && media.label === "GIF" ? <Play className="w-2.5 h-2.5" /> : <Video className="w-2.5 h-2.5" />}
          {media.label}
        </span>
      )}
      {isStCoach && <StCoachCredit variant="overlay" />}
    </div>
  );
};

export default ExerciseMediaPreview;