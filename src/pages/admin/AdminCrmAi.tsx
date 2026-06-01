import { useEffect, useState } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useAuth } from "@/contexts/AuthContext";
import { Sparkles, Loader2 } from "lucide-react";
import { toast } from "@/hooks/use-toast";

interface Run { id: string; prompt: string | null; response: string | null; model: string | null; created_at: string; }

export default function AdminCrmAi() {
  const { user } = useAuth();
  const [prompt, setPrompt] = useState("");
  const [loading, setLoading] = useState(false);
  const [runs, setRuns] = useState<Run[]>([]);

  async function load() {
    const { data } = await supabase
      .from("crm_ai_runs")
      .select("id, prompt, response, model, created_at")
      .order("created_at", { ascending: false })
      .limit(50);
    setRuns((data ?? []) as Run[]);
  }
  useEffect(() => { load(); }, []);

  async function ask() {
    if (!prompt.trim()) return;
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("crm-ai-suggest", { body: { prompt: prompt.trim() } });
      if (error) throw error;
      await supabase.from("crm_ai_runs").insert({ prompt: prompt.trim(), response: data?.response || "", model: data?.model || null, created_by: user?.id });
      setPrompt("");
      load();
    } catch (e: any) {
      toast({ title: "Erro", description: e?.message || "Falha ao consultar IA" });
    } finally {
      setLoading(false);
    }
  }

  return (
    <DashboardLayout role="admin" title="IA do CRM" subtitle="Gere respostas e ideias usando o Gemini">
      <Card className="p-4 space-y-3">
        <Textarea rows={4} placeholder="Ex: gere uma mensagem cordial pedindo o peso atual do aluno" value={prompt} onChange={(e) => setPrompt(e.target.value)} />
        <Button size="sm" onClick={ask} disabled={loading}>
          {loading ? <Loader2 className="w-3.5 h-3.5 mr-1 animate-spin" /> : <Sparkles className="w-3.5 h-3.5 mr-1" />}
          Gerar
        </Button>
      </Card>

      <div className="mt-6 space-y-3">
        {runs.map((r) => (
          <Card key={r.id} className="p-3 space-y-2">
            <p className="text-[11px] text-muted-foreground">{new Date(r.created_at).toLocaleString("pt-BR")} · {r.model || "—"}</p>
            <p className="text-xs text-muted-foreground"><b>Prompt:</b> {r.prompt}</p>
            <p className="text-sm whitespace-pre-wrap">{r.response}</p>
          </Card>
        ))}
      </div>
    </DashboardLayout>
  );
}