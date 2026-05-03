import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Scale } from "lucide-react";

interface Props {
  weightLogs: any[];
}

const EvolutionWeightHistory = ({ weightLogs }: Props) => {
  if (!weightLogs.length) return null;

  return (
    <Card className="mb-6">
      <CardHeader>
        <CardTitle className="text-base font-display flex items-center gap-2">
          <Scale className="w-4 h-4" /> Histórico de Peso
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          {weightLogs.map((log: any, i: number) => (
            <div key={log.id} className="flex items-center justify-between border-b border-border/50 pb-2 last:border-0 last:pb-0">
              <div className="flex items-center gap-3">
                <span className={`text-sm font-bold ${i === 0 ? "text-foreground" : "text-foreground"}`}>
                  {Number(log.weight).toFixed(1)} kg
                </span>
                {i === 0 && <Badge variant="secondary" className="text-[10px]">Atual</Badge>}
                {i > 0 && weightLogs[i - 1] && (
                  <span className={`text-xs ${Number(log.weight) > Number(weightLogs[i - 1].weight) ? "text-destructive" : "text-success"}`}>
                    {Number(log.weight) > Number(weightLogs[i - 1].weight) ? "↑" : "↓"}{" "}
                    {Math.abs(Number(log.weight) - Number(weightLogs[i - 1].weight)).toFixed(1)} kg
                  </span>
                )}
              </div>
              <div className="text-right">
                <p className="text-xs text-muted-foreground">
                  {new Date(log.logged_at).toLocaleDateString("pt-BR")} às{" "}
                  {new Date(log.logged_at).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}
                </p>
                {log.notes && <p className="text-xs text-muted-foreground/70 max-w-[200px] truncate">{log.notes}</p>}
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};

export default EvolutionWeightHistory;
