import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { History, Camera, Phone, Loader2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";

type Row = {
  id: string;
  kind: "image" | "phone";
  action: string;
  previous_value: string | null;
  new_value: string | null;
  reason: string | null;
  created_at: string;
};

const ACTION_LABEL: Record<string, string> = {
  granted: "Concedida",
  updated: "Atualizada",
  revoked: "Revogada",
  rejected: "Recusada",
};
const ACTION_COLOR: Record<string, string> = {
  granted: "bg-emerald-500/15 text-emerald-600 border-emerald-500/30",
  updated: "bg-sky-500/15 text-sky-600 border-sky-500/30",
  revoked: "bg-destructive/15 text-destructive border-destructive/30",
  rejected: "bg-destructive/15 text-destructive border-destructive/30",
};

const VALUE_LABEL: Record<string, string> = {
  nao_autorizo: "Não autorizo",
  sem_identificacao: "Sem identificação",
  com_identificacao: "Com identificação",
};

function pretty(v: string | null) {
  if (!v) return "—";
  return VALUE_LABEL[v] || v;
}

export default function AuthorizationHistoryCard({ userId, compact }: { userId: string; compact?: boolean }) {
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    (async () => {
      setLoading(true);
      const { data } = await (supabase as any)
        .from("authorization_audit")
        .select("id, kind, action, previous_value, new_value, reason, created_at")
        .eq("user_id", userId)
        .order("created_at", { ascending: false })
        .limit(50);
      if (!mounted) return;
      setRows((data as Row[]) || []);
      setLoading(false);
    })();
    return () => { mounted = false; };
  }, [userId]);

  return (
    <div className={`rounded-2xl border border-border bg-card ${compact ? "p-4" : "p-5"}`} id="historico-autorizacoes">
      <div className="flex items-center gap-3 mb-3">
        <History className="w-5 h-5 text-primary" />
        <div>
          <p className="text-sm font-semibold text-foreground">Histórico de autorizações</p>
          <p className="text-[12px] text-muted-foreground leading-relaxed mt-0.5">
            Todas as alterações de autorização de imagem e telefone, com data e motivo (quando informado).
          </p>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <Loader2 className="w-3 h-3 animate-spin" /> Carregando histórico…
        </div>
      ) : rows.length === 0 ? (
        <p className="text-xs text-muted-foreground">Nenhuma alteração registrada até o momento.</p>
      ) : (
        <ol className="relative border-l border-border/60 ml-2 space-y-3">
          {rows.map((r) => (
            <li key={r.id} className="pl-4">
              <span className="absolute -left-1.5 mt-1.5 w-3 h-3 rounded-full bg-primary/70 border-2 border-background" />
              <div className="flex flex-wrap items-center gap-2">
                <Badge variant="outline" className="gap-1 text-[10px]">
                  {r.kind === "image" ? <Camera className="w-3 h-3" /> : <Phone className="w-3 h-3" />}
                  {r.kind === "image" ? "Imagem" : "Telefone"}
                </Badge>
                <Badge className={`text-[10px] ${ACTION_COLOR[r.action] || ""}`} variant="outline">
                  {ACTION_LABEL[r.action] || r.action}
                </Badge>
                <span className="text-[11px] text-muted-foreground">
                  {new Date(r.created_at).toLocaleString("pt-BR")}
                </span>
              </div>
              <p className="text-[12px] text-foreground mt-1">
                <span className="text-muted-foreground">De:</span> {pretty(r.previous_value)}{" "}
                <span className="text-muted-foreground">→ Para:</span> {pretty(r.new_value)}
              </p>
              {r.reason && (
                <p className="text-[11px] text-muted-foreground mt-0.5">Motivo: “{r.reason}”</p>
              )}
            </li>
          ))}
        </ol>
      )}
    </div>
  );
}