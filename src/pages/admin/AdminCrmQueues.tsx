import { useEffect, useState } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/contexts/AuthContext";
import { formatPhoneBR } from "@/lib/phone";
import { Check, UserCircle2 } from "lucide-react";
import StudentDossier from "@/components/admin/crm/StudentDossier";

interface Queue { id: string; name: string; type: string; color: string; }
interface Item {
  id: string;
  queue_id: string;
  conversation_id: string | null;
  phone: string | null;
  priority: number;
  entered_at: string;
  picked_by: string | null;
  closed_at: string | null;
  notes: string | null;
}

export default function AdminCrmQueues() {
  const { user } = useAuth();
  const [queues, setQueues] = useState<Queue[]>([]);
  const [items, setItems] = useState<Item[]>([]);
  const [selectedPhone, setSelectedPhone] = useState<string | null>(null);

  async function load() {
    const [q, i] = await Promise.all([
      supabase.from("crm_queues").select("id, name, type, color").order("sort_order"),
      supabase.from("crm_queue_items").select("id, queue_id, conversation_id, phone, priority, entered_at, picked_by, closed_at, notes").is("closed_at", null).order("priority", { ascending: false }).order("entered_at", { ascending: true }),
    ]);
    setQueues((q.data ?? []) as Queue[]);
    setItems((i.data ?? []) as Item[]);
  }

  useEffect(() => { load(); }, []);

  async function pick(id: string) {
    await supabase.from("crm_queue_items").update({ picked_by: user?.id, picked_at: new Date().toISOString() }).eq("id", id);
    load();
  }
  async function close(id: string) {
    await supabase.from("crm_queue_items").update({ closed_at: new Date().toISOString() }).eq("id", id);
    load();
  }

  return (
    <DashboardLayout role="admin" title="Filas de atendimento" subtitle="Fale com o Nutri · Atendimento Comercial">
      <div className="grid lg:grid-cols-[1fr_320px] gap-4">
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
        {queues.map((q) => {
          const list = items.filter((i) => i.queue_id === q.id);
          return (
            <Card key={q.id} className="p-3">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-semibold">{q.name}</h3>
                <Badge style={{ background: q.color + "33", color: q.color }} className="text-[10px] border-0">{list.length}</Badge>
              </div>
              <div className="space-y-2">
                {list.length === 0 && <p className="text-xs text-muted-foreground">Fila vazia.</p>}
                {list.map((it) => (
                  <button
                    type="button"
                    key={it.id}
                    onClick={() => setSelectedPhone(it.phone)}
                    className={`w-full text-left border rounded-lg p-2 text-xs space-y-1 transition-colors ${selectedPhone && selectedPhone === it.phone ? "border-emerald-500/50 bg-emerald-500/5" : "border-border/40 hover:bg-accent/30"}`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-medium">{it.phone ? formatPhoneBR(it.phone) : "—"}</span>
                      <span className="text-[10px] text-muted-foreground">{new Date(it.entered_at).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}</span>
                    </div>
                    {it.notes && <p className="text-[11px] text-muted-foreground">{it.notes}</p>}
                    <div className="flex gap-1">
                      {!it.picked_by ? (
                        <Button size="sm" variant="outline" className="h-7 text-[11px] flex-1" onClick={(e) => { e.stopPropagation(); pick(it.id); }}>
                          <UserCircle2 className="w-3 h-3 mr-1" /> Pegar
                        </Button>
                      ) : (
                        <Button size="sm" className="h-7 text-[11px] flex-1" onClick={(e) => { e.stopPropagation(); close(it.id); }}>
                          <Check className="w-3 h-3 mr-1" /> Concluir
                        </Button>
                      )}
                    </div>
                  </button>
                ))}
              </div>
            </Card>
          );
        })}
        </div>
        <Card className="hidden lg:block p-0 h-fit sticky top-4 overflow-hidden">
          <div className="px-4 py-3 border-b border-border/50">
            <p className="text-sm font-semibold">Dossiê do aluno</p>
          </div>
          <StudentDossier phone={selectedPhone} />
        </Card>
      </div>
    </DashboardLayout>
  );
}