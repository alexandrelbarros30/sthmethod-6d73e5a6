import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Bell, RefreshCw, XCircle } from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";

type Campaign = {
  id: string;
  title: string;
  body: string | null;
  audience_type: string;
  target_count: number;
  subscriptions_reached: number;
  sent_count: number;
  failed_count: number;
  status: string;
  scheduled_at: string | null;
  started_at: string | null;
  completed_at: string | null;
  created_at: string;
  created_by_name: string | null;
  error_message: string | null;
  use_variables: boolean;
};

const STATUS_COLORS: Record<string, string> = {
  scheduled: "bg-blue-500/20 text-blue-400 border-blue-500/40",
  sending: "bg-amber-500/20 text-amber-400 border-amber-500/40",
  completed: "bg-emerald-500/20 text-emerald-400 border-emerald-500/40",
  failed: "bg-red-500/20 text-red-400 border-red-500/40",
  canceled: "bg-muted text-muted-foreground border-border",
  draft: "bg-muted text-muted-foreground border-border",
};

const AUDIENCE_LABEL: Record<string, string> = {
  active: "Ativos",
  inactive: "Inativos",
  all: "Todos",
  custom: "Personalizada",
};

export default function AdminPushHistory() {
  const [rows, setRows] = useState<Campaign[]>([]);
  const [loading, setLoading] = useState(true);

  async function load() {
    setLoading(true);
    const { data, error } = await supabase
      .from("push_campaigns")
      .select(
        "id,title,body,audience_type,target_count,subscriptions_reached,sent_count,failed_count,status,scheduled_at,started_at,completed_at,created_at,created_by_name,error_message,use_variables"
      )
      .order("created_at", { ascending: false })
      .limit(200);
    if (error) toast.error("Não foi possível carregar o histórico");
    else setRows((data as Campaign[]) || []);
    setLoading(false);
  }

  useEffect(() => {
    load();
  }, []);

  async function cancel(id: string) {
    const { error } = await supabase
      .from("push_campaigns")
      .update({ status: "canceled" })
      .eq("id", id)
      .eq("status", "scheduled");
    if (error) toast.error("Falha ao cancelar");
    else {
      toast.success("Campanha cancelada");
      load();
    }
  }

  return (
    <div className="p-4 sm:p-6 max-w-7xl mx-auto space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-display flex items-center gap-2">
            <Bell className="w-5 h-5 text-primary" /> Histórico de campanhas push
          </h1>
          <p className="text-xs text-muted-foreground mt-1">
            Auditoria de todos os envios de push (imediatos e agendados).
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={load} disabled={loading}>
          <RefreshCw className={`w-4 h-4 mr-1 ${loading ? "animate-spin" : ""}`} /> Atualizar
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Campanhas ({rows.length})</CardTitle>
        </CardHeader>
        <CardContent className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Título</TableHead>
                <TableHead>Audiência</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Período</TableHead>
                <TableHead className="text-right">Alvo</TableHead>
                <TableHead className="text-right">Entregues</TableHead>
                <TableHead className="text-right">Falhas</TableHead>
                <TableHead>Admin</TableHead>
                <TableHead className="w-12" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((r) => {
                const when =
                  r.status === "scheduled"
                    ? `Agendada p/ ${r.scheduled_at ? format(new Date(r.scheduled_at), "dd/MM HH:mm") : "—"}`
                    : r.completed_at
                    ? format(new Date(r.completed_at), "dd/MM/yyyy HH:mm")
                    : r.started_at
                    ? format(new Date(r.started_at), "dd/MM/yyyy HH:mm")
                    : format(new Date(r.created_at), "dd/MM/yyyy HH:mm");
                return (
                  <TableRow key={r.id}>
                    <TableCell className="max-w-[240px]">
                      <div className="font-medium truncate" title={r.title}>{r.title}</div>
                      {r.body && (
                        <div className="text-xs text-muted-foreground truncate" title={r.body}>{r.body}</div>
                      )}
                      {r.use_variables && (
                        <Badge variant="outline" className="text-[9px] mt-1">com variáveis</Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className="text-[10px]">{AUDIENCE_LABEL[r.audience_type] || r.audience_type}</Badge>
                    </TableCell>
                    <TableCell>
                      <Badge className={`text-[10px] border ${STATUS_COLORS[r.status] || ""}`} variant="outline">
                        {r.status}
                      </Badge>
                      {r.error_message && (
                        <div className="text-[10px] text-red-400 mt-1 max-w-[160px] truncate" title={r.error_message}>
                          {r.error_message}
                        </div>
                      )}
                    </TableCell>
                    <TableCell className="text-xs whitespace-nowrap">{when}</TableCell>
                    <TableCell className="text-right text-xs">{r.target_count}</TableCell>
                    <TableCell className="text-right text-xs text-emerald-400">{r.sent_count}</TableCell>
                    <TableCell className="text-right text-xs text-red-400">{r.failed_count}</TableCell>
                    <TableCell className="text-xs text-muted-foreground max-w-[140px] truncate" title={r.created_by_name || ""}>
                      {r.created_by_name || "—"}
                    </TableCell>
                    <TableCell>
                      {r.status === "scheduled" && (
                        <Button size="icon" variant="ghost" onClick={() => cancel(r.id)} title="Cancelar agendamento">
                          <XCircle className="w-4 h-4 text-red-400" />
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                );
              })}
              {!loading && rows.length === 0 && (
                <TableRow>
                  <TableCell colSpan={9} className="text-center text-sm text-muted-foreground py-8">
                    Nenhuma campanha registrada ainda.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}