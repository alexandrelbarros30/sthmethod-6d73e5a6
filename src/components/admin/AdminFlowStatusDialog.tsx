import { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Loader2, Zap } from "lucide-react";

type FlowKey =
  | "cadastro_recebido_at"
  | "dados_em_analise_at"
  | "estrategia_estruturando_at"
  | "plataforma_liberada_at"
  | "plano_avancado_pronto_at";

const STEPS: { key: FlowKey; label: string }[] = [
  { key: "cadastro_recebido_at", label: "Cadastro recebido" },
  { key: "dados_em_analise_at", label: "Dados em análise" },
  { key: "estrategia_estruturando_at", label: "Estratégia sendo estruturada" },
  { key: "plataforma_liberada_at", label: "Plataforma liberada" },
  { key: "plano_avancado_pronto_at", label: "Plano avançado pronto" },
];

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  userId: string;
  userName?: string;
}

export default function AdminFlowStatusDialog({ open, onOpenChange, userId, userName }: Props) {
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [state, setState] = useState<Record<FlowKey, string | null>>({
    cadastro_recebido_at: null,
    dados_em_analise_at: null,
    estrategia_estruturando_at: null,
    plataforma_liberada_at: null,
    plano_avancado_pronto_at: null,
  });
  const [notes, setNotes] = useState("");

  useEffect(() => {
    if (!open || !userId) return;
    setLoading(true);
    (async () => {
      const { data } = await (supabase as any)
        .from("student_flow_status")
        .select("*")
        .eq("user_id", userId)
        .maybeSingle();
      if (data) {
        setState({
          cadastro_recebido_at: data.cadastro_recebido_at,
          dados_em_analise_at: data.dados_em_analise_at,
          estrategia_estruturando_at: data.estrategia_estruturando_at,
          plataforma_liberada_at: data.plataforma_liberada_at,
          plano_avancado_pronto_at: data.plano_avancado_pronto_at,
        });
        setNotes(data.notes || "");
      } else {
        setState({
          cadastro_recebido_at: new Date().toISOString(),
          dados_em_analise_at: null,
          estrategia_estruturando_at: null,
          plataforma_liberada_at: null,
          plano_avancado_pronto_at: null,
        });
        setNotes("");
      }
      setLoading(false);
    })();
  }, [open, userId]);

  const toggle = (key: FlowKey, checked: boolean) => {
    setState((s) => ({ ...s, [key]: checked ? new Date().toISOString() : null }));
  };

  const completed = STEPS.filter((s) => !!state[s.key]).length;
  const progress = Math.round((completed / STEPS.length) * 100);

  const save = async () => {
    setSaving(true);
    const { error } = await (supabase as any)
      .from("student_flow_status")
      .upsert(
        { user_id: userId, ...state, notes, updated_at: new Date().toISOString() },
        { onConflict: "user_id" }
      );
    setSaving(false);
    if (error) {
      toast.error("Erro ao salvar: " + error.message);
      return;
    }
    toast.success("STH Flow atualizado");
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Zap className="w-4 h-4 text-primary" /> STH Flow — {userName || "Aluno"}
          </DialogTitle>
        </DialogHeader>
        {loading ? (
          <div className="py-10 flex justify-center"><Loader2 className="w-5 h-5 animate-spin" /></div>
        ) : (
          <div className="space-y-4">
            <div className="rounded-xl border border-border/50 p-4">
              <div className="flex items-baseline justify-between mb-2">
                <span className="text-xs text-muted-foreground uppercase tracking-wider">Progresso</span>
                <span className="text-2xl font-semibold tabular-nums">{progress}%</span>
              </div>
              <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                <div className="h-full bg-primary transition-all" style={{ width: `${progress}%` }} />
              </div>
            </div>
            <div className="space-y-2">
              {STEPS.map((step) => (
                <label
                  key={step.key}
                  className="flex items-center gap-3 p-3 rounded-lg border border-border/50 cursor-pointer hover:bg-muted/30"
                >
                  <Checkbox
                    checked={!!state[step.key]}
                    onCheckedChange={(c) => toggle(step.key, !!c)}
                  />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium">{step.label}</p>
                    {state[step.key] && (
                      <p className="text-[10px] text-muted-foreground">
                        {new Date(state[step.key]!).toLocaleString("pt-BR")}
                      </p>
                    )}
                  </div>
                </label>
              ))}
            </div>
            <Textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Observações internas (opcional)"
              rows={2}
            />
            <Button onClick={save} disabled={saving} className="w-full">
              {saving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
              Salvar
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}