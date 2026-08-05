import { ReactNode, useState } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Check, ChevronDown, Loader2, Save } from "lucide-react";
import { cn } from "@/lib/utils";

interface Props {
  icon: ReactNode;
  title: string;
  description?: string;
  /** Quantidade de campos ainda sem resposta neste grupo. */
  pending?: number;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  defaultOpen?: boolean;
  onSave?: () => void | Promise<void>;
  saveLabel?: string;
  children: ReactNode;
}

/** Janela expansível (fechada por padrão) para edição de um grupo de dados, com salvamento próprio. */
export default function AiEditSection({
  icon,
  title,
  description,
  pending = 0,
  open: controlledOpen,
  onOpenChange,
  defaultOpen = false,
  onSave,
  saveLabel = "Salvar este grupo",
  children,
}: Props) {
  const [internalOpen, setInternalOpen] = useState(defaultOpen);
  const open = controlledOpen !== undefined ? controlledOpen : internalOpen;
  
  const setOpen = (val: boolean) => {
    if (onOpenChange) onOpenChange(val);
    setInternalOpen(val);
  };

  const [saving, setSaving] = useState(false);

  async function handleSave() {
    if (!onSave) return;
    setSaving(true);
    try {
      await onSave();
      // Fecha a janela colapsável automaticamente após salvar com sucesso
      setOpen(false);
    } finally {
      setSaving(false);
    }
  }

  return (
    <Collapsible open={open} onOpenChange={setOpen}>
      <Card
        className={cn(
          "overflow-hidden transition-colors",
          pending > 0 ? "border-destructive/40 bg-destructive/5" : "border-primary/30 bg-primary/[0.03]",
          open && "ring-1 ring-primary/30",
        )}
      >
        <CollapsibleTrigger className="flex w-full items-center gap-3 p-4 text-left">
          <span
            className={cn(
              "grid h-9 w-9 shrink-0 place-items-center rounded-xl",
              pending > 0 ? "bg-destructive/15 text-destructive" : "bg-primary/15 text-primary",
            )}
          >
            {icon}
          </span>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-semibold">{title}</p>
            {description && <p className="truncate text-xs text-muted-foreground">{description}</p>}
          </div>
          {pending > 0 ? (
            <Badge variant="destructive" className="h-5 shrink-0 px-2 text-[10px]">
              {pending} pendente(s)
            </Badge>
          ) : (
            <Badge variant="secondary" className="h-5 shrink-0 gap-1 px-2 text-[10px]">
              <Check className="h-3 w-3" /> ok
            </Badge>
          )}
          <ChevronDown
            className={cn("h-4 w-4 shrink-0 text-muted-foreground transition-transform", open && "rotate-180")}
          />
        </CollapsibleTrigger>
        <CollapsibleContent>
          <div className="space-y-4 border-t border-border/60 p-4">
            {children}
            {onSave && (
              <Button className="w-full" size="sm" onClick={handleSave} disabled={saving}>
                {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                {saveLabel}
              </Button>
            )}
          </div>
        </CollapsibleContent>
      </Card>
    </Collapsible>
  );
}