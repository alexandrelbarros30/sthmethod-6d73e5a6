import { useEffect, useMemo, useState } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatPhoneBR } from "@/lib/phone";
import { ChevronLeft, ChevronRight, ExternalLink } from "lucide-react";
import { Link } from "react-router-dom";
import { toast } from "@/hooks/use-toast";

const STAGES: { id: string; label: string; color: string }[] = [
  { id: "novo_lead",  label: "Novo Lead",  color: "#64748b" },
  { id: "contato",    label: "Contato",    color: "#0ea5e9" },
  { id: "interesse",  label: "Interesse",  color: "#a855f7" },
  { id: "cadastro",   label: "Cadastro",   color: "#f59e0b" },
  { id: "pagamento",  label: "Pagamento",  color: "#22c55e" },
  { id: "convertido", label: "Convertido", color: "#10b981" },
];

interface Conv {
  id: string;
  phone: string;
  display_name: string | null;
  pipeline_stage: string | null;
  last_message_at: string | null;
  channel: string | null;
}

export default function AdminCrmPipeline() {
  const [items, setItems] = useState<Conv[]>([]);
  const [loading, setLoading] = useState(true);

  async function load() {
    setLoading(true);
    const { data } = await supabase
      .from("crm_conversations")
      .select("id, phone, display_name, pipeline_stage, last_message_at, channel")
      .not("pipeline_stage", "is", null)
      .order("last_message_at", { ascending: false, nullsFirst: false })
      .limit(500);
    setItems((data ?? []) as Conv[]);
    setLoading(false);
  }
  useEffect(() => { load(); }, []);

  async function move(id: string, dir: 1 | -1) {
    const conv = items.find((c) => c.id === id);
    if (!conv) return;
    const idx = STAGES.findIndex((s) => s.id === conv.pipeline_stage);
    const nextIdx = Math.max(0, Math.min(STAGES.length - 1, idx + dir));
    if (nextIdx === idx) return;
    const next = STAGES[nextIdx].id;
    const { error } = await supabase.from("crm_conversations").update({ pipeline_stage: next }).eq("id", id);
    if (error) { toast({ title: "Erro", description: error.message }); return; }
    load();
  }

  const grouped = useMemo(() => {
    const map: Record<string, Conv[]> = {};
    STAGES.forEach((s) => { map[s.id] = []; });
    items.forEach((c) => { if (c.pipeline_stage && map[c.pipeline_stage]) map[c.pipeline_stage].push(c); });
    return map;
  }, [items]);

  return (
    <DashboardLayout role="admin" title="Pipeline Comercial" subtitle="Acompanhe leads do primeiro contato à conversão">
      {loading && <p className="text-xs text-muted-foreground">Carregando...</p>}
      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-3">
        {STAGES.map((s) => {
          const list = grouped[s.id] || [];
          return (
            <Card key={s.id} className="p-2.5 space-y-2 bg-muted/20">
              <div className="flex items-center justify-between px-1">
                <div className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full" style={{ background: s.color }} />
                  <span className="text-xs font-semibold">{s.label}</span>
                </div>
                <Badge variant="outline" className="h-4 text-[10px]">{list.length}</Badge>
              </div>
              <div className="space-y-2 min-h-[60px]">
                {list.length === 0 && (
                  <p className="text-[11px] text-muted-foreground text-center py-3">Vazio</p>
                )}
                {list.map((c) => (
                  <Card key={c.id} className="p-2 text-xs space-y-1.5 bg-background">
                    <div className="flex items-center justify-between gap-2">
                      <p className="font-medium truncate">{c.display_name || formatPhoneBR(c.phone)}</p>
                      <Link to="/admin/crm" className="text-muted-foreground hover:text-foreground">
                        <ExternalLink className="w-3 h-3" />
                      </Link>
                    </div>
                    <p className="text-[10px] text-muted-foreground">{formatPhoneBR(c.phone)}</p>
                    <div className="flex items-center justify-between pt-1">
                      <Button size="sm" variant="ghost" className="h-6 w-6 p-0" onClick={() => move(c.id, -1)} disabled={STAGES[0].id === c.pipeline_stage}>
                        <ChevronLeft className="w-3 h-3" />
                      </Button>
                      <Button size="sm" variant="ghost" className="h-6 w-6 p-0" onClick={() => move(c.id, 1)} disabled={STAGES[STAGES.length - 1].id === c.pipeline_stage}>
                        <ChevronRight className="w-3 h-3" />
                      </Button>
                    </div>
                  </Card>
                ))}
              </div>
            </Card>
          );
        })}
      </div>
      <p className="text-[11px] text-muted-foreground mt-4">
        Para incluir uma conversa no pipeline, abra-a no Inbox e selecione um estágio comercial.
      </p>
    </DashboardLayout>
  );
}