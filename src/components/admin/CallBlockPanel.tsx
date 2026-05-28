import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { toast } from "@/hooks/use-toast";
import { PhoneOff, PhoneCall, Save, Clock, ShieldAlert } from "lucide-react";

type ChannelRow = {
  id: string;
  name: string;
  whatsapp_number: string | null;
  reject_calls: boolean;
  reject_call_message: string;
  calls_unlocked_until: string | null;
};

const RELEASE_OPTIONS: { label: string; minutes: number | "indef" }[] = [
  { label: "30 min", minutes: 30 },
  { label: "2 horas", minutes: 120 },
  { label: "Indefinido", minutes: "indef" },
];

export default function CallBlockPanel({ compact = false }: { compact?: boolean }) {
  const [rows, setRows] = useState<ChannelRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [drafts, setDrafts] = useState<Record<string, string>>({});

  const load = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("api_channels")
      .select("id, name, whatsapp_number, reject_calls, reject_call_message, calls_unlocked_until")
      .order("name");
    if (error) toast({ title: "Erro ao carregar canais", description: error.message, variant: "destructive" });
    const list = (data || []) as ChannelRow[];
    setRows(list);
    setDrafts(Object.fromEntries(list.map((r) => [r.id, r.reject_call_message || ""])));
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const toggleReject = async (ch: ChannelRow, value: boolean) => {
    const { error } = await supabase
      .from("api_channels")
      .update({ reject_calls: value, calls_unlocked_until: value ? null : ch.calls_unlocked_until })
      .eq("id", ch.id);
    if (error) return toast({ title: "Erro", description: error.message, variant: "destructive" });
    toast({ title: value ? "Chamadas bloqueadas" : "Chamadas liberadas" });
    load();
  };

  const releaseTemporarily = async (ch: ChannelRow, minutes: number | "indef") => {
    const until = minutes === "indef" ? null : new Date(Date.now() + minutes * 60_000).toISOString();
    const { error } = await supabase
      .from("api_channels")
      .update({
        reject_calls: minutes === "indef" ? false : true,
        calls_unlocked_until: minutes === "indef" ? null : until,
      })
      .eq("id", ch.id);
    if (error) return toast({ title: "Erro", description: error.message, variant: "destructive" });
    toast({
      title: minutes === "indef" ? "Chamadas liberadas (indefinido)" : `Chamadas liberadas por ${minutes}min`,
    });
    load();
  };

  const lockNow = async (ch: ChannelRow) => {
    const { error } = await supabase
      .from("api_channels")
      .update({ reject_calls: true, calls_unlocked_until: null })
      .eq("id", ch.id);
    if (error) return toast({ title: "Erro", description: error.message, variant: "destructive" });
    toast({ title: "Chamadas bloqueadas novamente" });
    load();
  };

  const saveMessage = async (ch: ChannelRow) => {
    const msg = drafts[ch.id] ?? "";
    if (!msg.trim()) return toast({ title: "Mensagem vazia", variant: "destructive" });
    const { error } = await supabase
      .from("api_channels")
      .update({ reject_call_message: msg.trim() })
      .eq("id", ch.id);
    if (error) return toast({ title: "Erro", description: error.message, variant: "destructive" });
    toast({ title: "Mensagem salva" });
    load();
  };

  const now = Date.now();
  const isUnlocked = (ch: ChannelRow) =>
    !ch.reject_calls || (ch.calls_unlocked_until ? new Date(ch.calls_unlocked_until).getTime() > now : false);

  return (
    <Card className="border-border/40">
      <CardHeader className="pb-3">
        <CardTitle className="text-base sm:text-lg tracking-tight flex items-center gap-2">
          <PhoneOff className="h-4 w-4 text-primary" /> Bloqueio de chamadas (áudio/vídeo)
        </CardTitle>
        <p className="text-xs text-muted-foreground">
          Por padrão, os números não aceitam ligações. Ao receber uma chamada, o sistema envia uma mensagem automática
          ao remetente. Para receber chamadas, libere temporariamente abaixo.
        </p>
      </CardHeader>
      <CardContent className="space-y-4">
        {loading ? (
          <p className="text-xs text-muted-foreground">Carregando…</p>
        ) : rows.length === 0 ? (
          <p className="text-xs text-muted-foreground">Nenhum canal configurado.</p>
        ) : (
          rows.map((ch) => {
            const unlocked = isUnlocked(ch);
            const untilLabel = ch.calls_unlocked_until
              ? new Date(ch.calls_unlocked_until).toLocaleString("pt-BR", { dateStyle: "short", timeStyle: "short" })
              : null;
            return (
              <div key={ch.id} className="rounded-xl border border-border/40 bg-card/40 p-3 sm:p-4 space-y-3">
                <div className="flex items-center justify-between gap-3 flex-wrap">
                  <div className="min-w-0">
                    <div className="text-sm font-medium tracking-tight">{ch.name}</div>
                    <div className="text-[11px] text-muted-foreground">{ch.whatsapp_number || "número não definido"}</div>
                  </div>
                  <div className="flex items-center gap-2">
                    {unlocked ? (
                      <Badge variant="outline" className="border-amber-500/30 text-amber-400">
                        <PhoneCall className="h-3 w-3 mr-1" /> Aceitando chamadas
                        {untilLabel && ch.reject_calls && <span className="ml-1">até {untilLabel}</span>}
                      </Badge>
                    ) : (
                      <Badge variant="outline" className="border-primary/30 text-primary">
                        <ShieldAlert className="h-3 w-3 mr-1" /> Chamadas bloqueadas
                      </Badge>
                    )}
                    <Switch
                      checked={ch.reject_calls && !untilLabel}
                      onCheckedChange={(v) => toggleReject(ch, v)}
                      title="Rejeitar chamadas"
                    />
                  </div>
                </div>

                {!compact && (
                  <>
                    <div>
                      <label className="text-[11px] uppercase tracking-wider text-muted-foreground mb-1 block">
                        Mensagem automática
                      </label>
                      <Textarea
                        rows={3}
                        value={drafts[ch.id] ?? ""}
                        onChange={(e) => setDrafts((d) => ({ ...d, [ch.id]: e.target.value }))}
                        placeholder="Mensagem enviada ao remetente quando uma chamada é rejeitada"
                        className="text-sm"
                      />
                      <div className="flex justify-end mt-2">
                        <Button size="sm" variant="outline" onClick={() => saveMessage(ch)}>
                          <Save className="h-3.5 w-3.5 mr-1" /> Salvar mensagem
                        </Button>
                      </div>
                    </div>
                  </>
                )}

                <div className="flex flex-wrap gap-2 items-center">
                  <span className="text-[11px] text-muted-foreground flex items-center gap-1">
                    <Clock className="h-3 w-3" /> Liberar por:
                  </span>
                  {RELEASE_OPTIONS.map((opt) => (
                    <Button
                      key={opt.label}
                      size="sm"
                      variant="outline"
                      onClick={() => releaseTemporarily(ch, opt.minutes)}
                    >
                      {opt.label}
                    </Button>
                  ))}
                  {unlocked && (
                    <Button size="sm" variant="default" onClick={() => lockNow(ch)}>
                      <PhoneOff className="h-3.5 w-3.5 mr-1" /> Bloquear agora
                    </Button>
                  )}
                </div>
              </div>
            );
          })
        )}
      </CardContent>
    </Card>
  );
}