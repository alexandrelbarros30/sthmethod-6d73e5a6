import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Loader2, QrCode, Power, RefreshCw, Send } from "lucide-react";
import { toast } from "sonner";

type State = "open" | "close" | "connecting" | "unknown";

const INSTANCE = "atendimento";
const PHONE_KEY = "admin_whatsapp_pairing_number";

export default function AdminWhatsApp() {
  const [state, setState] = useState<State>("unknown");
  const [qr, setQr] = useState<string | null>(null);
  const [pairing, setPairing] = useState<string | null>(null);
  const [hint, setHint] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [number, setNumber] = useState("");
  const [text, setText] = useState("");
  const [sending, setSending] = useState(false);
  const [pairingNumber, setPairingNumber] = useState(() => {
    if (typeof window === "undefined") return "";
    return window.localStorage.getItem(PHONE_KEY) ?? "";
  });

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (pairingNumber) window.localStorage.setItem(PHONE_KEY, pairingNumber);
  }, [pairingNumber]);

  async function call(action: string, extra: Record<string, unknown> = {}) {
    const { data, error } = await supabase.functions.invoke("evolution-whatsapp", {
      body: { action, instance: INSTANCE, number: pairingNumber || undefined, ...extra },
    });
    if (error) throw new Error(error.message);
    return data as any;
  }

  async function refreshStatus() {
    try {
      const data = await call("status");
      const s: State = data?.instance?.state ?? data?.state ?? "unknown";
      setState(s);
      if (s === "open") {
        setQr(null);
        setPairing(null);
        setHint(null);
      }
    } catch (e: any) {
      toast.error("Erro ao consultar status: " + e.message);
    }
  }

  async function connect() {
    setLoading(true);
    setQr(null);
    setPairing(null);
    setHint(null);
    try {
      let data = await call("qr");

      for (let i = 0; i < 5; i++) {
        const base64 = data?.base64 ?? data?.qrcode?.base64;
        const code = data?.code ?? data?.qrcode?.code;
        const pair = data?.pairingCode ?? data?.qrcode?.pairingCode;

        if (base64) {
          setQr(base64.startsWith("data:") ? base64 : `data:image/png;base64,${base64}`);
          if (pair) setPairing(pair);
          break;
        }

        if (code) {
          setQr(`https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(code)}`);
          if (pair) setPairing(pair);
          break;
        }

        if (pair) {
          setPairing(pair);
          break;
        }

        if (i < 4) {
          await new Promise((resolve) => setTimeout(resolve, 1200));
          data = await call("qr-status");
        }
      }

      if (!data?.base64 && !data?.qrcode?.base64 && !data?.code && !data?.qrcode?.code && !data?.pairingCode && !data?.qrcode?.pairingCode) {
        const nextHint = data?.message ?? (
          data?.emptyConnectResponse
            ? "O servidor respondeu sem QR por enquanto. Se isso continuar, use “Forçar nova sessão”."
            : "A instância está preparando o pareamento. Aguarde alguns segundos e tente novamente."
        );
        setHint(nextHint);
        toast.message(nextHint);
      }

      if (data?.recovered) {
        toast.success("Sessão recuperada e novo QR solicitado.");
      }

      await refreshStatus();
    } catch (e: any) {
      toast.error("Falha ao gerar QR: " + e.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (state !== "connecting" || qr) return;

    const id = setInterval(async () => {
      try {
        const data = await call("qr-status");
        const base64 = data?.base64 ?? data?.qrcode?.base64;
        const code = data?.code ?? data?.qrcode?.code;
        const pair = data?.pairingCode ?? data?.qrcode?.pairingCode;

        if (base64) {
          setQr(base64.startsWith("data:") ? base64 : `data:image/png;base64,${base64}`);
        } else if (code) {
          setQr(`https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(code)}`);
        }

        if (pair) setPairing(pair);
        if (!base64 && !code && !pair && data?.message) setHint(data.message);
      } catch {
        // mantém polling silencioso enquanto conecta
      }
    }, 2500);

    return () => clearInterval(id);
  }, [state, qr]);

  async function disconnect() {
    if (!confirm("Desconectar a sessão do WhatsApp?")) return;
    setLoading(true);
    try {
      await call("logout");
      toast.success("Desconectado");
      setQr(null);
      setPairing(null);
      setHint(null);
      await refreshStatus();
    } catch (e: any) {
      toast.error("Erro: " + e.message);
    } finally {
      setLoading(false);
    }
  }

  async function forceRecreate() {
    if (!confirm("Refazer a sessão e gerar um novo QR?")) return;
    setLoading(true);
    setQr(null);
    setPairing(null);
    setHint("Refazendo a sessão para solicitar um novo QR…");

    try {
      await call("recreate");
      toast.success("Sessão refeita. Gerando novo QR…");
    } catch (e: any) {
      toast.error("Erro ao refazer a sessão: " + e.message);
      setLoading(false);
      return;
    }

    setLoading(false);
    await connect();
  }

  async function sendTest() {
    if (!number || !text) return toast.error("Preencha número e mensagem");
    setSending(true);
    try {
      const data = await call("send", { number, text });
      if (data?.key || data?.messageTimestamp) toast.success("Mensagem enviada");
      else toast.message(JSON.stringify(data).slice(0, 200));
    } catch (e: any) {
      toast.error("Erro ao enviar: " + e.message);
    } finally {
      setSending(false);
    }
  }

  useEffect(() => {
    refreshStatus();
    const id = setInterval(refreshStatus, 5000);
    return () => clearInterval(id);
  }, []);

  const statusBadge = {
    open: <Badge className="bg-emerald-500/20 text-emerald-400 border-emerald-500/40">Conectado</Badge>,
    close: <Badge variant="destructive">Desconectado</Badge>,
    connecting: <Badge className="bg-amber-500/20 text-amber-400 border-amber-500/40">Conectando…</Badge>,
    unknown: <Badge variant="secondary">—</Badge>,
  }[state];

  return (
    <div className="min-h-screen bg-background p-4 md:p-8">
      <div className="max-w-3xl mx-auto space-y-6">
        <header className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">WhatsApp — STH METHOD</h1>
            <p className="text-sm text-muted-foreground">Evolution API · instância <code>{INSTANCE}</code></p>
          </div>
          {statusBadge}
        </header>

        <Card className="p-6 space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">Número do WhatsApp da instância (com DDI)</label>
            <Input
              placeholder="Ex: 5521998496289"
              value={pairingNumber}
              onChange={(e) => setPairingNumber(e.target.value.replace(/\D/g, ""))}
              inputMode="numeric"
            />
            <p className="text-xs text-muted-foreground">
              Informe o número que será pareado. Se preenchido, a Evolution gera também um <strong>código de pareamento</strong> de 8 caracteres como alternativa ao QR. Salvo localmente.
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            <Button onClick={connect} disabled={loading || state === "open"}>
              {loading ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <QrCode className="h-4 w-4 mr-2" />}
              {state === "open" ? "Conectado" : "Conectar / Gerar QR"}
            </Button>
            <Button variant="outline" onClick={refreshStatus}>
              <RefreshCw className="h-4 w-4 mr-2" /> Atualizar status
            </Button>
            <Button variant="outline" onClick={forceRecreate} disabled={loading || state === "open"}>
              <RefreshCw className="h-4 w-4 mr-2" /> Forçar nova sessão
            </Button>
            <Button variant="destructive" onClick={disconnect} disabled={loading || state !== "open"}>
              <Power className="h-4 w-4 mr-2" /> Desconectar
            </Button>
          </div>

          {qr && state !== "open" && (
            <div className="flex flex-col items-center gap-3 pt-4 border-t border-border">
              <img src={qr} alt="QR Code WhatsApp" className="w-64 h-64 rounded-lg bg-white p-2" />
              <p className="text-xs text-muted-foreground text-center max-w-sm">
                No WhatsApp do celular: <strong>Configurações → Aparelhos conectados → Conectar aparelho</strong> e aponte para este QR.
              </p>
              {pairing && (
                <p className="text-sm">Código de pareamento: <code className="font-mono">{pairing}</code></p>
              )}
            </div>
          )}

          {!qr && pairing && state !== "open" && (
            <div className="pt-4 border-t border-border text-center space-y-2">
              <p className="text-sm text-muted-foreground">Use o código de pareamento no WhatsApp para concluir a conexão.</p>
              <p className="text-base">Código: <code className="font-mono">{pairing}</code></p>
            </div>
          )}

          {!qr && !pairing && state === "connecting" && (
            <p className="text-sm text-muted-foreground pt-2">{hint ?? "Preparando QR de conexão… atualize em alguns segundos se ele não aparecer."}</p>
          )}

          {state === "open" && (
            <p className="text-sm text-emerald-400 pt-2">✓ WhatsApp conectado e pronto para enviar mensagens.</p>
          )}
        </Card>

        <Card className="p-6 space-y-4">
          <h2 className="text-lg font-semibold">Teste de envio</h2>
          <Input
            placeholder="Número com DDI (ex: 5521998496289)"
            value={number}
            onChange={(e) => setNumber(e.target.value)}
            disabled={state !== "open"}
          />
          <Textarea
            placeholder="Mensagem"
            value={text}
            onChange={(e) => setText(e.target.value)}
            disabled={state !== "open"}
            rows={3}
          />
          <Button onClick={sendTest} disabled={sending || state !== "open"}>
            {sending ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Send className="h-4 w-4 mr-2" />}
            Enviar mensagem teste
          </Button>
        </Card>
      </div>
    </div>
  );
}