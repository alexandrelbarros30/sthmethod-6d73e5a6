import { Eye, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { usePreviewAs } from "@/hooks/usePreviewAs";

const PreviewAsBanner = () => {
  const { isPreviewing, previewUserId } = usePreviewAs();
  if (!isPreviewing) return null;

  const close = () => {
    if (typeof window !== "undefined") window.close();
  };

  return (
    <div className="sticky top-0 z-50 bg-foreground text-background px-4 py-2 flex items-center justify-between text-xs sm:text-sm font-body shadow-md">
      <div className="flex items-center gap-2 min-w-0">
        <Eye className="w-4 h-4 shrink-0" />
        <span className="truncate">
          <strong>Modo Visualização:</strong> você está vendo a tela exata do aluno
          <span className="opacity-70 ml-2 hidden sm:inline">({previewUserId?.slice(0, 8)}…)</span>
        </span>
      </div>
      <Button size="sm" variant="ghost" className="h-7 px-2 text-background hover:bg-foreground-foreground/10" onClick={close}>
        <X className="w-4 h-4" />
      </Button>
    </div>
  );
};

export default PreviewAsBanner;
