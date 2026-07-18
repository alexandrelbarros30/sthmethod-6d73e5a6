import { useState } from "react";
import { Plus, Scale, X, Droplets } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useQueryClient } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { notifyStudentSelfUpdate } from "@/lib/notify-student-update";

/**
 * Floating quick actions on the student home.
 * Primary action: fast weight log (no macro recalc — that lives in the full evolution flow).
 */
const QuickActionsFab = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const [weightOpen, setWeightOpen] = useState(false);
  const [weight, setWeight] = useState("");
  const [notes, setNotes] = useState("");
  const [saving, setSaving] = useState(false);

  const handleSaveWeight = async () => {
    const w = Number(weight.replace(",", "."));
    if (!Number.isFinite(w) || w <= 20 || w > 400) {
      toast.error("Informe um peso válido (kg).");
      return;
    }
    if (!user?.id) return;
    setSaving(true);
    try {
      const { error } = await supabase.from("weight_logs").insert({
        user_id: user.id,
        weight: w,
        notes: notes || "Registro rápido",
      });
      if (error) throw error;
      void notifyStudentSelfUpdate(user.id, "weight");
      toast.success("Peso registrado.");
      setWeight("");
      setNotes("");
      setWeightOpen(false);
      setOpen(false);
      queryClient.invalidateQueries({ queryKey: ["evolution-status"] });
      queryClient.invalidateQueries({ queryKey: ["weight-logs"] });
    } catch (e: any) {
      toast.error(e?.message || "Falha ao registrar peso.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      {/* Backdrop when open */}
      {open && (
        <button
          aria-label="Fechar ações rápidas"
          onClick={() => setOpen(false)}
          className="fixed inset-0 z-40 bg-background/40 backdrop-blur-[2px] animate-in fade-in duration-150"
        />
      )}

      {/* FAB stack */}
      <div
        className="fixed z-50 right-4 flex flex-col items-end gap-3"
        style={{ bottom: "calc(env(safe-area-inset-bottom, 0px) + 88px)" }}
      >
        {open && (
          <>
            <button
              onClick={() => setWeightOpen(true)}
              className="flex items-center gap-2 pl-3 pr-4 h-11 rounded-full bg-background border border-border shadow-lg text-[13px] font-medium text-foreground animate-in slide-in-from-bottom-2 fade-in duration-200"
            >
              <span className="w-7 h-7 rounded-full bg-foreground text-background flex items-center justify-center">
                <Scale className="w-3.5 h-3.5" strokeWidth={2} />
              </span>
              Registrar peso
            </button>
          </>
        )}

        <button
          onClick={() => setOpen((v) => !v)}
          aria-label={open ? "Fechar" : "Ações rápidas"}
          className="w-14 h-14 rounded-full bg-foreground text-background flex items-center justify-center shadow-2xl active:scale-95 transition-transform"
        >
          {open ? <X className="w-5 h-5" strokeWidth={2.2} /> : <Plus className="w-6 h-6" strokeWidth={2.2} />}
        </button>
      </div>

      {/* Weight dialog */}
      <Dialog open={weightOpen} onOpenChange={setWeightOpen}>
        <DialogContent className="max-w-sm rounded-3xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-[17px] tracking-tight">
              <Scale className="w-4 h-4" /> Registrar peso
            </DialogTitle>
            <DialogDescription className="text-[12px]">
              Registro rápido do dia. Para atualizar a rotina completa e recalcular macros, use o Ciclo de Atualização.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 pt-1">
            <div className="space-y-1.5">
              <Label htmlFor="qa-weight" className="text-[11px] uppercase tracking-wider text-muted-foreground">Peso (kg)</Label>
              <Input
                id="qa-weight"
                type="number"
                inputMode="decimal"
                step="0.1"
                autoFocus
                placeholder="Ex.: 82.5"
                value={weight}
                onChange={(e) => setWeight(e.target.value)}
                className="h-12 text-[20px] font-medium tabular-nums"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="qa-notes" className="text-[11px] uppercase tracking-wider text-muted-foreground">Observação (opcional)</Label>
              <Textarea
                id="qa-notes"
                rows={2}
                placeholder="Ex.: em jejum, pós-treino..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
              />
            </div>
            <Button
              onClick={handleSaveWeight}
              disabled={saving || !weight}
              className="w-full h-11 rounded-full bg-foreground text-background hover:bg-foreground/90 text-[13px] font-medium"
            >
              {saving ? "Salvando..." : "Salvar registro"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default QuickActionsFab;