import { cn } from "@/lib/utils";

interface RichContentRendererProps {
  content: string;
  className?: string;
}

/**
 * Detects if content is HTML (from rich text editor) or plain text,
 * and renders accordingly.
 */
const RichContentRenderer = ({ content, className }: RichContentRendererProps) => {
  const isHTML = /<[a-z][\s\S]*>/i.test(content);

  if (isHTML) {
    return (
      <div
        className={cn(
          "prose prose-sm max-w-none text-foreground",
          "[&_h1]:text-lg [&_h1]:font-bold [&_h1]:mb-2 [&_h1]:text-foreground",
          "[&_h2]:text-base [&_h2]:font-bold [&_h2]:mb-2 [&_h2]:text-foreground",
          "[&_h3]:text-sm [&_h3]:font-bold [&_h3]:mb-1 [&_h3]:text-foreground",
          "[&_p]:mb-1 [&_p]:text-foreground [&_p]:leading-relaxed",
          "[&_ul]:list-disc [&_ul]:pl-5 [&_ul]:text-foreground",
          "[&_ol]:list-decimal [&_ol]:pl-5 [&_ol]:text-foreground",
          "[&_li]:text-foreground [&_li]:mb-0.5",
          "[&_strong]:font-bold [&_em]:italic [&_u]:underline",
          "[&_mark]:bg-primary/20 [&_mark]:text-foreground [&_mark]:px-0.5 [&_mark]:rounded",
          "[&_hr]:border-foreground/20 [&_hr]:my-3",
          "[&_s]:line-through",
          className
        )}
        dangerouslySetInnerHTML={{ __html: content }}
      />
    );
  }

  // Fallback: plain text (legacy content)
  return (
    <div className={cn("whitespace-pre-wrap text-sm text-foreground font-body leading-relaxed", className)}>
      {content}
    </div>
  );
};

export default RichContentRenderer;
