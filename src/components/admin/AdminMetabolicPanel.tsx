import { useState, lazy, Suspense } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Microscope, Save } from "lucide-react";
import { toast } from "sonner";

const RichTextEditor = lazy(() => import("@/components/shared/RichTextEditor"));

interface AdminMetabolicPanelProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  userId: string;
  userName: string;
}

const AdminMetabolicPanel = ({ open, onOpenChange, userId, userName }: AdminMetabolicPanelProps) => {
  const qc = useQueryClient();
  const [content, setContent] = useState("");
  const [visible, setVisible] = useState(false);
  const [loaded, setLoaded] = useState(false);

  const { data: panel, isLoading } = useQuery({
    queryKey: ["metabolic-panel-admin", userId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("metabolic_panels")
        .select("*")
        .eq("user_id", userId)
        .order("updated_at", { ascending: false })
        .limit(1)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
    enabled: open && !!userId,
  });

  // Load data into state when fetched
  if (panel && !loaded) {
    setContent(panel.content || "");
    setVisible(panel.visible || false);
    setLoaded(true);
  }
  if (!panel && !isLoading && !loaded) {
    setLoaded(true);
  }

  const saveMutation = useMutation({
    mutationFn: async () => {
      if (panel) {
        // Update existing
        const { error } = await supabase
          .from("metabolic_panels")
          .update({
            content,
            visible,
            seen_by_student: false, // Reset so student sees popup
          })
          .eq("id", panel.id);
        if (error) throw error;
      } else {
        // Insert new
        const { error } = await supabase
          .from("metabolic_panels")
          .insert({
            user_id: userId,
            content,
            visible,
            seen_by_student: false,
          });
        if (error) throw error;
      }

      // Also log to anamnesis
      if (content.trim()) {
        const now = new Date();
        const dateStr = now.toLocaleDateString("pt-BR");
        const note = `📊 **Painel Metabólico atualizado em ${dateStr}**\n\n${content}`;
        await supabase.from("anamnesis_entries").insert({
          user_id: userId,
          notes: note,
        });
      }
    },
    onSuccess: () => {
      toast.success("Painel metabólico salvo!");
      qc.invalidateQueries({ queryKey: ["metabolic-panel-admin", userId] });
      qc.invalidateQueries({ queryKey: ["metabolic-panel-student", userId] });
      onOpenChange(false);
      setLoaded(false);
    },
    onError: () => toast.error("Erro ao salvar painel metabólico"),
  });

  const handleClose = () => {
    onOpenChange(false);
    setLoaded(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Microscope className="w-5 h-5 text-primary" />
            Painel Metabólico — {userName}
          </DialogTitle>
        </DialogHeader>

        {isLoading ? (
          <p className="text-sm text-muted-foreground py-4">Carregando...</p>
        ) : (
          <div className="space-y-4">
            <Suspense fallback={<div className="h-[220px] rounded-md border border-input bg-background animate-pulse" />}>
              <RichTextEditor
                value={content}
                onChange={setContent}
                placeholder="Descreva a análise metabólica, interpretação de exames laboratoriais, orientações..."
              />
            </Suspense>

            <div className="flex items-center gap-3 p-3 rounded-lg border border-border/50 bg-muted/30">
              <Switch
                id="visible-toggle"
                checked={visible}
                onCheckedChange={setVisible}
              />
              <Label htmlFor="visible-toggle" className="text-sm cursor-pointer">
                {visible ? "Liberado para o aluno" : "Não liberado ao aluno"}
              </Label>
            </div>

            <Button
              onClick={() => saveMutation.mutate()}
              disabled={saveMutation.isPending}
              className="w-full"
            >
              <Save className="w-4 h-4 mr-2" />
              {saveMutation.isPending ? "Salvando..." : "Salvar Painel Metabólico"}
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default AdminMetabolicPanel;
