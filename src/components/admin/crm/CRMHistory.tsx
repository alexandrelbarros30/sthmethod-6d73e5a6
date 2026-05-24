import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { History, CheckCircle2, XCircle, Eye, Clock, MessageSquareX, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";

const statusColor: Record<string, string> = {
  sent: "text-emerald-400", failed: "text-rose-400",
  pending: "text-zinc-400", sending: "text-amber-400", skipped: "text-violet-400",
};

export default function CRMHistory() {
  const [openRun, setOpenRun] = useState<string | null>(null);
  const qc = useQueryClient();
  const [deletingRun, setDeletingRun] = useState<string | null>(null);

  const deleteRunFromWhatsApp = async (run: any) => {
    if (!confirm(
      `Apagar do WhatsApp todas as mensagens desta execução de "${run.campaign_name}"?\n\n` +
      `Só funciona em mensagens enviadas há menos de ~48h e ainda não visualizadas pelo destinatário.`
    )) return;
    setDeletingRun(run.id);
    try {
      const { data, error } = await supabase.functions.invoke("whatsapp-delete-messages", {
        body: { run_id: run.id },
      });
      if (error) throw error;
      if (!data?.ok) throw new Error(data?.error || "Falha ao apagar");
      toast.success(`${data.deleted} apagadas no WhatsApp • ${data.failed} falharam`);
      qc.invalidateQueries({ queryKey: ["crm-run-messages", run.id] });
    } catch (e: any) {
      toast.error(e.message || "Erro ao apagar do WhatsApp");
    } finally {
      setDeletingRun(null);
    }
  };

  const { data: runs = [], isLoading } = useQuery({
    queryKey: ["crm-runs"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("crm_campaign_runs")
        .select("id, campaign_id, started_at, finished_at, total_recipients, sent_count, failed_count, trigger_type")
        .order("started_at", { ascending: false })
        .limit(50);
      if (error) throw error;
      const ids = Array.from(new Set((data || []).map((r: any) => r.campaign_id)));
      const { data: camps } = await supabase.from("crm_campaigns").select("id, name").in("id", ids);
      const map = new Map((camps || []).map((c: any) => [c.id, c.name]));
      return (data || []).map((r: any) => ({ ...r, campaign_name: map.get(r.campaign_id) || "—" }));
    },
    refetchInterval: 10000,
  });

  const { data: messages = [] } = useQuery({
    queryKey: ["crm-run-messages", openRun],
    enabled: !!openRun,
    queryFn: async () => {
      const { data } = await supabase
        .from("crm_campaign_messages")
        .select("id, recipient_name, recipient_phone, status, error, sent_at, rendered_content")
        .eq("run_id", openRun!)
        .order("created_at", { ascending: false })
        .limit(500);
      return data || [];
    },
  });

  return (
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
      <div>
        <h2 className="text-lg font-semibold tracking-tight">Histórico de envios</h2>
        <p className="text-xs text-muted-foreground">Todas as execuções de campanhas — manuais, agendadas e recorrentes.</p>
      </div>

      {isLoading ? (
        <Card><CardContent className="p-6 text-center text-sm text-muted-foreground">Carregando...</CardContent></Card>
      ) : runs.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center gap-2 p-10 text-center">
            <History className="h-8 w-8 text-muted-foreground" />
            <p className="text-sm text-muted-foreground">Sem execuções ainda.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-2">
          {runs.map((r: any) => (
            <Card key={r.id} className="border-border/40">
              <CardContent className="flex items-center justify-between gap-3 p-4">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="font-medium text-sm truncate">{r.campaign_name}</p>
                    <Badge variant="outline" className="text-[10px] capitalize">{r.trigger_type}</Badge>
                    {!r.finished_at && (
                      <Badge variant="outline" className="text-[10px] border-amber-500/30 text-amber-400 gap-1">
                        <Clock className="h-3 w-3" /> em andamento
                      </Badge>
                    )}
                  </div>
                  <div className="mt-1 flex flex-wrap gap-3 text-xs text-muted-foreground">
                    <span>{formatDistanceToNow(new Date(r.started_at), { addSuffix: true, locale: ptBR })}</span>
                    <span className="inline-flex items-center gap-1"><CheckCircle2 className="h-3 w-3 text-emerald-400" />{r.sent_count}/{r.total_recipients}</span>
                    {r.failed_count > 0 && <span className="inline-flex items-center gap-1"><XCircle className="h-3 w-3 text-rose-400" />{r.failed_count} falhas</span>}
                  </div>
                </div>
                <Dialog open={openRun === r.id} onOpenChange={(v) => setOpenRun(v ? r.id : null)}>
                  <DialogTrigger asChild>
                    <Button size="sm" variant="outline" className="gap-1"><Eye className="h-3.5 w-3.5" />Detalhes</Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
                    <DialogHeader><DialogTitle>{r.campaign_name} — envios</DialogTitle></DialogHeader>
                    {r.sent_count > 0 && (
                      <div className="mb-2">
                        <Button size="sm" variant="outline" disabled={deletingRun === r.id}
                          onClick={() => deleteRunFromWhatsApp(r)}
                          className="gap-1 border-amber-500/40 text-amber-400 hover:bg-amber-500/10">
                          {deletingRun === r.id
                            ? <Loader2 className="h-3.5 w-3.5 animate-spin" />
                            : <MessageSquareX className="h-3.5 w-3.5" />}
                          Apagar mensagens do WhatsApp
                        </Button>
                      </div>
                    )}
                    <div className="divide-y divide-border/40">
                      {messages.length === 0 ? (
                        <p className="p-4 text-sm text-muted-foreground text-center">Sem mensagens.</p>
                      ) : messages.map((m: any) => (
                        <div key={m.id} className="py-2 text-xs">
                          <div className="flex items-center justify-between gap-2">
                            <span className="font-medium">{m.recipient_name || m.recipient_phone}</span>
                            <span className={statusColor[m.status]}>{m.status}</span>
                          </div>
                          <div className="text-muted-foreground">{m.recipient_phone}</div>
                          {m.error && <div className="text-rose-400 line-clamp-2">{m.error}</div>}
                        </div>
                      ))}
                    </div>
                  </DialogContent>
                </Dialog>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </motion.div>
  );
}