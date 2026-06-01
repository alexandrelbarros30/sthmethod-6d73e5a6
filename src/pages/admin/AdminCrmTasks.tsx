import { useEffect, useState } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/contexts/AuthContext";
import { Plus, Check, Trash2 } from "lucide-react";
import { toast } from "@/hooks/use-toast";

interface Task {
  id: string;
  title: string;
  notes: string | null;
  due_at: string | null;
  status: string;
  phone: string | null;
  created_at: string;
}

export default function AdminCrmTasks() {
  const { user } = useAuth();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [title, setTitle] = useState("");
  const [due, setDue] = useState("");
  const [phone, setPhone] = useState("");

  async function load() {
    const { data } = await supabase
      .from("crm_tasks")
      .select("id, title, notes, due_at, status, phone, created_at")
      .order("status", { ascending: true })
      .order("due_at", { ascending: true, nullsFirst: false })
      .limit(200);
    setTasks((data ?? []) as Task[]);
  }

  useEffect(() => { load(); }, []);

  async function add() {
    if (!title.trim()) return;
    const { error } = await supabase.from("crm_tasks").insert({
      title: title.trim(),
      due_at: due ? new Date(due).toISOString() : null,
      phone: phone.trim() || null,
      created_by: user?.id,
      status: "todo",
    });
    if (error) { toast({ title: "Erro", description: error.message }); return; }
    setTitle(""); setDue(""); setPhone("");
    load();
  }

  async function toggle(t: Task) {
    await supabase.from("crm_tasks").update({ status: t.status === "done" ? "todo" : "done" }).eq("id", t.id);
    load();
  }

  async function remove(id: string) {
    await supabase.from("crm_tasks").delete().eq("id", id);
    load();
  }

  return (
    <DashboardLayout role="admin" title="Tarefas do CRM" subtitle="Lembretes e follow-ups da equipe">
      <Card className="p-4 space-y-3">
        <h3 className="text-sm font-semibold">Nova tarefa</h3>
        <div className="grid md:grid-cols-4 gap-2">
          <Input className="md:col-span-2" placeholder="Título" value={title} onChange={(e) => setTitle(e.target.value)} />
          <Input type="datetime-local" value={due} onChange={(e) => setDue(e.target.value)} />
          <Input placeholder="Telefone (opcional)" value={phone} onChange={(e) => setPhone(e.target.value)} />
        </div>
        <Button size="sm" onClick={add}><Plus className="w-4 h-4 mr-1" /> Adicionar</Button>
      </Card>

      <div className="mt-6 space-y-2">
        {tasks.length === 0 && <p className="text-sm text-muted-foreground">Nenhuma tarefa.</p>}
        {tasks.map((t) => (
          <Card key={t.id} className="p-3 flex items-center gap-3">
            <Button size="sm" variant={t.status === "done" ? "default" : "outline"} onClick={() => toggle(t)} className="h-8 w-8 p-0">
              <Check className="w-3.5 h-3.5" />
            </Button>
            <div className="flex-1 min-w-0">
              <p className={`text-sm font-medium ${t.status === "done" ? "line-through text-muted-foreground" : ""}`}>{t.title}</p>
              <div className="flex items-center gap-2 text-[11px] text-muted-foreground">
                {t.due_at && <span>📅 {new Date(t.due_at).toLocaleString("pt-BR")}</span>}
                {t.phone && <span>📞 {t.phone}</span>}
              </div>
            </div>
            <Badge variant="outline" className="text-[10px]">{t.status}</Badge>
            <Button size="sm" variant="ghost" onClick={() => remove(t.id)} className="h-8 w-8 p-0 text-rose-400"><Trash2 className="w-3.5 h-3.5" /></Button>
          </Card>
        ))}
      </div>
    </DashboardLayout>
  );
}