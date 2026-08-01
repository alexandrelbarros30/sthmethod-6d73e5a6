import { useRef, useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Loader2, Upload, Watch, CheckCircle2 } from "lucide-react";
import { parseHealthCsv, type HealthDay, type HealthSource } from "@/hooks/useAiHealth";

const STEPS = [
  "No celular Galaxy, abra o Samsung Health e confirme que o relógio está sincronizado (Configurações › Sincronizar agora).",
  "Ainda no Samsung Health: Configurações › Health Connect › ative Passos, Calorias ativas, Sono, Frequência cardíaca e Peso.",
  "Para exportar: Samsung Health › Configurações › Baixar dados pessoais. Você recebe um .zip por e-mail/pasta Downloads.",
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

      <ol className="mt-4 space-y-2.5">
        {STEPS.map((s, i) => (
          <li key={i} className="flex gap-3 rounded-2xl border border-border/40 bg-card/40 p-3">
            <span className="grid h-6 w-6 shrink-0 place-items-center rounded-full bg-primary/15 text-xs font-semibold text-primary">
              {i + 1}
            </span>
            <span className="text-xs leading-relaxed text-muted-foreground">{s}</span>
          </li>
        ))}
      </ol>

      <div className="mt-4 flex flex-wrap items-center gap-3">
        <Button disabled={busy} onClick={() => fileRef.current?.click()}>
          {busy ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Upload className="mr-2 h-4 w-4" />}
          Enviar dados do Galaxy Watch
        </Button>
        <input ref={fileRef} type="file" accept=".csv,text/csv" className="hidden" onChange={onFile} />
        <p className="text-[11px] text-muted-foreground">
          {source?.last_sync_at
            ? `Última sincronização em ${new Date(source.last_sync_at).toLocaleDateString("pt-BR")}`
            : "Aceitamos os CSVs originais do Samsung Health (colunas em inglês) ou o formato simples day,steps,active_kcal,sleep_minutes,resting_hr,weight_kg."}
        </p>
      </div>
    </Card>
  );
}
