import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { MessageCircle, Copy, ExternalLink, Settings2, ChevronDown, ChevronUp } from "lucide-react";
import { toast } from "sonner";

const STORAGE_KEY = "admin_whatsapp_config";

const DEFAULT_PHONE = "5521998496289";
const DEFAULT_MESSAGE = "Olá! Gostaria de falar sobre a consultoria.";

const WhatsAppQuickLink = () => {
  const [phone, setPhone] = useState(DEFAULT_PHONE);
  const [message, setMessage] = useState(DEFAULT_MESSAGE);
  const [editing, setEditing] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        const { phone: p, message: m } = JSON.parse(saved);
        if (p) setPhone(p);
        if (m) setMessage(m);
      } catch {}
    }
  }, []);

  const save = () => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ phone, message }));
    toast.success("Configuração salva!");
    setEditing(false);
  };

  const rawPhone = phone.replace(/\D/g, "");
  const waLink = `https://wa.me/${rawPhone}?text=${encodeURIComponent(message)}`;

  const copyLink = () => {
    navigator.clipboard.writeText(waLink);
    toast.success("Link copiado!");
  };

  const formatPhone = (v: string) => {
    const digits = v.replace(/\D/g, "").slice(0, 13);
    setPhone(digits);
  };

  const displayPhone = (digits: string) => {
    if (digits.length <= 2) return `+${digits}`;
    if (digits.length <= 4) return `+${digits.slice(0, 2)} ${digits.slice(2)}`;
    if (digits.length <= 9) return `+${digits.slice(0, 2)} ${digits.slice(2, 4)} ${digits.slice(4)}`;
    return `+${digits.slice(0, 2)} ${digits.slice(2, 4)} ${digits.slice(4, 9)}-${digits.slice(9)}`;
  };

  return (
    <Card className="border-[#25D366]/20 bg-[#25D366]/5">
      <CardHeader className="pb-2">
        <CardTitle className="text-base font-display flex items-center justify-between">
          <span className="flex items-center gap-2">
            <MessageCircle className="w-4 h-4 text-[#25D366]" />
            WhatsApp Rápido
          </span>
          <Button
            variant="ghost"
            size="sm"
            className="h-7 px-2 text-xs"
            onClick={() => setEditing(!editing)}
          >
            {editing ? <ChevronUp className="w-3.5 h-3.5" /> : <Settings2 className="w-3.5 h-3.5" />}
          </Button>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {editing ? (
          <>
            <div className="space-y-1.5">
              <Label className="text-xs">Número (com código do país)</Label>
              <Input
                value={displayPhone(phone)}
                onChange={(e) => formatPhone(e.target.value)}
                placeholder="+55 21 99999-9999"
                className="text-sm h-9"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Mensagem padrão</Label>
              <Textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                rows={3}
                className="text-sm resize-none"
                maxLength={500}
              />
              <p className="text-[10px] text-muted-foreground text-right">{message.length}/500</p>
            </div>
            <Button size="sm" className="w-full h-8 text-xs" onClick={save}>
              Salvar configuração
            </Button>
          </>
        ) : (
          <>
            <p className="text-xs text-muted-foreground truncate">
              📞 {displayPhone(phone)}
            </p>
            <p className="text-xs text-muted-foreground line-clamp-2 italic">
              "{message}"
            </p>
            <div className="flex gap-2">
              <Button
                size="sm"
                className="flex-1 h-8 text-xs gap-1.5"
                style={{ background: "#25D366" }}
                asChild
              >
                <a href={waLink} target="_blank" rel="noopener noreferrer">
                  <ExternalLink className="w-3.5 h-3.5" />
                  Abrir WhatsApp
                </a>
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="h-8 px-3 text-xs gap-1.5"
                onClick={copyLink}
              >
                <Copy className="w-3.5 h-3.5" />
                Copiar
              </Button>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
};

export default WhatsAppQuickLink;
