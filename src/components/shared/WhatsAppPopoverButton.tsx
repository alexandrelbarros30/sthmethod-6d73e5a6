import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { MessageCircle, ExternalLink } from "lucide-react";

interface Props {
  phone: string;
  name?: string;
  /** Size variant */
  size?: "sm" | "default";
}

export default function WhatsAppPopoverButton({ phone, name, size = "default" }: Props) {
  const rawPhone = phone.replace(/\D/g, "");
  const [waPhone, setWaPhone] = useState(`55${rawPhone}`);
  const [waMessage, setWaMessage] = useState(`Olá ${name || ""}! Tudo bem?`);
  const [open, setOpen] = useState(false);

  const handleOpen = (isOpen: boolean) => {
    if (isOpen) {
      setWaPhone(`55${rawPhone}`);
      setWaMessage(`Olá ${name || ""}! Tudo bem?`);
    }
    setOpen(isOpen);
  };

  const waLink = `https://wa.me/${waPhone.replace(/\D/g, "")}?text=${encodeURIComponent(waMessage)}`;

  const btnClass = size === "sm"
    ? "w-7 h-7 border-[#25D366]/30 text-[#25D366] hover:bg-[#25D366]/10"
    : "h-10 w-10 border-[#25D366]/30 text-[#25D366] hover:bg-[#25D366]/10";

  const iconClass = size === "sm" ? "w-3.5 h-3.5" : "w-4 h-4";

  return (
    <Popover open={open} onOpenChange={handleOpen}>
      <PopoverTrigger asChild>
        <Button
          type="button"
          variant="outline"
          size="icon"
          className={`shrink-0 ${btnClass}`}
          title="Enviar WhatsApp"
        >
          <MessageCircle className={iconClass} />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-72 space-y-3" align="end">
        <p className="text-sm font-semibold">WhatsApp</p>
        <div>
          <Label className="text-xs">Número (com DDI)</Label>
          <Input
            value={waPhone}
            onChange={(e) => setWaPhone(e.target.value)}
            placeholder="5511999999999"
            className="text-sm"
          />
          <p className="text-[10px] text-muted-foreground mt-0.5">Ex: 55 para Brasil, 1 para EUA</p>
        </div>
        <div>
          <Label className="text-xs">Mensagem</Label>
          <Textarea
            value={waMessage}
            onChange={(e) => setWaMessage(e.target.value)}
            rows={3}
            className="text-sm resize-none"
          />
        </div>
        <Button
          size="sm"
          className="w-full gap-1.5 bg-[#25D366] hover:bg-[#25D366]/90 text-white"
          asChild
        >
          <a href={waLink} target="_blank" rel="noopener noreferrer">
            <ExternalLink className="w-3.5 h-3.5" /> Abrir WhatsApp
          </a>
        </Button>
      </PopoverContent>
    </Popover>
  );
}
