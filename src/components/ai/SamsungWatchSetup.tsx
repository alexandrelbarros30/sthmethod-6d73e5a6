import { useRef, useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { CheckCircle2, Loader2, RefreshCw, Settings2, Smartphone, Upload, Watch } from "lucide-react";
import { parseHealthCsv, type HealthDay, type HealthSource } from "@/hooks/useAiHealth";
import { useHealthConnect } from "@/hooks/useHealthConnect";

const NATIVE_STEPS = [
  "No celular Galaxy: Samsung Health › Configurações › Health Connect › ative Passos, Calorias ativas, Sono, Frequência cardíaca e Peso.",
  "Confirme que o relógio está sincronizado com o Samsung Health (Configurações › Sincronizar agora).",
  "Toque em Sincronizar agora aqui e autorize o STH METHOD no Health Connect.",
  "Pronto: a cada abertura do app os dados do Galaxy Watch entram automaticamente.",
];

const CSV_STEPS = [
  "Samsung Health › Configurações › Baixar dados pessoais. Você recebe um .zip por e-mail/pasta Downloads.",
  "Descompacte e escolha o arquivo com passos/calorias (ex.: com.samsung.health.step_count...csv) e envie aqui.",
];

interface Props {
  source?: HealthSource;
  onConnect: () => Promise<void>;
  onDisconnect: () => Promise<void>;
  onImport: (rows: (Partial<HealthDay> & { day: string })[], provider: string) => Promise<number>;
}

export default function SamsungWatchSetup({ source, onConnect, onDisconnect, onImport }: Props) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const { status, syncing, lastSync, sync, openHealthSettings, openHealthConnectStore } = useHealthConnect(onImport);
  const isNative = status === "ready" || status === "unavailable";

  async function onFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    setBusy(true);
    try {
      const rows = parseHealthCsv(await file.text());
      if (rows.length === 0) {
        toast.error("Não reconhecemos as colunas desse arquivo. Envie o CSV de passos do Samsung Health.");
        return;
      }
      const n = await onImport(rows, "samsung_health");
      toast.success(`${n} dias do Galaxy Watch importados.`);
    } catch {
      toast.error("Falha ao importar o arquivo do Samsung Health.");
    } finally {
      setBusy(false);
    }
  }

  async function runSync() {
    try {
      const n = await sync();
      toast.success(n > 0 ? `${n} dias sincronizados do Galaxy Watch.` : "Nada novo para sincronizar por enquanto.");
    } catch {
      toast.error("Permissão não concedida. Autorize o STH METHOD no Health Connect.");
    }
  }

  const steps = status === "ready" ? NATIVE_STEPS : [...NATIVE_STEPS.slice(0, 2), ...CSV_STEPS];
  const syncedAt = lastSync ?? source?.last_sync_at ?? null;

  return (
    <Card className="mt-4 p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <h2 className="flex items-center gap-2 text-sm font-semibold">
            <Watch className="h-4 w-4 text-primary" /> Samsung Galaxy Watch
          </h2>
          <p className="mt-1 text-xs text-muted-foreground">
            Passos, calorias ativas, sono, frequência cardíaca e peso do seu relógio alimentando a leitura da STHIA.
          </p>
        </div>
        <div className="flex items-center gap-2">
          {source ? (
            <>
              <Badge variant="secondary" className="gap-1">
                <CheckCircle2 className="h-3 w-3" /> Conectado
              </Badge>
              <Button variant="ghost" size="sm" onClick={() => onDisconnect().catch(() => toast.error("Falha ao desconectar."))}>
                Remover
              </Button>
            </>
          ) : (
            <Button variant="outline" size="sm" onClick={() => onConnect().catch(() => toast.error("Falha ao conectar."))}>
              Ativar integração
            </Button>
          )}
        </div>
      </div>

      {status === "ready" && (
        <div className="mt-4 flex flex-wrap items-center gap-2 rounded-2xl border border-primary/30 bg-primary/5 p-3">
          <Smartphone className="h-4 w-4 text-primary" />
          <span className="text-xs font-medium">Sincronização automática ativa via Health Connect</span>
          <Button size="sm" className="ml-auto" disabled={syncing} onClick={runSync}>
            {syncing ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <RefreshCw className="mr-2 h-4 w-4" />}
            Sincronizar agora
          </Button>
          <Button size="sm" variant="ghost" onClick={() => openHealthSettings()}>
            <Settings2 className="mr-2 h-4 w-4" /> Permissões
          </Button>
        </div>
      )}

      {status === "unavailable" && (
        <div className="mt-4 flex flex-wrap items-center gap-2 rounded-2xl border border-border/50 bg-muted/30 p-3">
          <span className="text-xs text-muted-foreground">
            O app Health Connect não está instalado neste aparelho — ele é a ponte oficial do Samsung Health.
          </span>
          <Button size="sm" variant="outline" className="ml-auto" onClick={() => openHealthConnectStore()}>
            Instalar Health Connect
          </Button>
        </div>
      )}

      {!isNative && (
        <p className="mt-4 rounded-2xl border border-border/50 bg-muted/30 p-3 text-xs text-muted-foreground">
          A sincronização automática do Galaxy Watch só funciona no aplicativo Android do STH METHOD (Health Connect não
          existe no navegador). Aqui no site você pode importar a exportação do Samsung Health em CSV.
        </p>
      )}

      <ol className="mt-4 space-y-2.5">
        {steps.map((s, i) => (
          <li key={s} className="flex gap-3 rounded-2xl border border-border/40 bg-card/40 p-3">
            <span className="grid h-6 w-6 shrink-0 place-items-center rounded-full bg-primary/15 text-xs font-semibold text-primary">
              {i + 1}
            </span>
            <span className="text-xs leading-relaxed text-muted-foreground">{s}</span>
          </li>
        ))}
      </ol>

      <div className="mt-4 flex flex-wrap items-center gap-3">
        <Button variant={status === "ready" ? "outline" : "default"} disabled={busy} onClick={() => fileRef.current?.click()}>
          {busy ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Upload className="mr-2 h-4 w-4" />}
          Enviar dados do Galaxy Watch
        </Button>
        <input ref={fileRef} type="file" accept=".csv,text/csv" className="hidden" onChange={onFile} />
        <p className="text-[11px] text-muted-foreground">
          {syncedAt
            ? `Última sincronização em ${new Date(syncedAt).toLocaleString("pt-BR")}`
            : "Aceitamos os CSVs originais do Samsung Health (colunas em inglês) ou o formato simples day,steps,active_kcal,sleep_minutes,resting_hr,weight_kg."}
        </p>
      </div>
    </Card>
  );
}
