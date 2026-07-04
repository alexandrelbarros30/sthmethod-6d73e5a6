import { useEffect, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { TrendingUp, CheckCheck, Eye } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { ScrollArea } from "@/components/ui/scroll-area";

const EvolutionUpdatePopup = () => {
  const { user, role } = useAuth();
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const [hasShown, setHasShown] = useState(false);

  const { data: unseen = [] } = useQuery({
    queryKey: ["unseen-evolution-notifications"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("evolution_notifications")
        .select("*")
        .eq("seen", false)
        .order("created_at", { ascending: false })
        .limit(50);
      if (error) throw error;
      return data;
    },
    enabled: !!user && (role === "admin" || role === "consultor"),
    refetchInterval: 60000,
  });

  useEffect(() => {
    if (unseen.length > 0 && !hasShown) {
      const timer = setTimeout(() => {
        setOpen(true);
        setHasShown(true);
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [unseen.length, hasShown]);

  useEffect(() => {
    if (!user || (role !== "admin" && role !== "consultor")) return;
    const channel = supabase
      .channel("evolution-update-realtime")
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "evolution_notifications" }, () => {
        queryClient.invalidateQueries({ queryKey: ["unseen-evolution-notifications"] });
        setOpen(true);
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [user, role, queryClient]);

  const markSeen = useMutation({
    mutationFn: async (id: string) => {
      await supabase.from("evolution_notifications").update({ seen: true }).eq("id", id);
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["unseen-evolution-notifications"] }),
  });

  const markAllSeen = useMutation({
    mutationFn: async () => {
      await supabase.from("evolution_notifications").update({ seen: true }).eq("seen", false);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["unseen-evolution-notifications"] });
      setOpen(false);
    },
  });

  if (!user || (role !== "admin" && role !== "consultor")) return null;

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-base">
            <TrendingUp className="w-5 h-5 text-foreground" />
            Atualizações de Alunos
            {unseen.length > 0 && <Badge variant="destructive" className="text-xs">{unseen.length}</Badge>}
          </DialogTitle>
        </DialogHeader>

        <ScrollArea className="max-h-[60vh]">
          <div className="space-y-2 pr-2">
            {unseen.map((n: any) => {
              const hasWeight = n.new_weight != null;
              const diff = n.previous_weight && n.new_weight
                ? (Number(n.new_weight) - Number(n.previous_weight)).toFixed(1)
                : null;
              const diffLabel = diff ? (Number(diff) > 0 ? `+${diff}` : diff) : null;

              return (
                <div key={n.id} className="flex items-start justify-between gap-2 p-3 rounded-lg bg-foreground/5 border border-foreground/15">
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium">
                      {n.has_photos && !hasWeight ? "📸" : "📊"} {n.student_name}
                    </p>
                    <div className="flex gap-1 mt-1 flex-wrap">
                      {hasWeight && (
                        <Badge variant="secondary" className="text-[10px]">
                          ⚖️ {Number(n.new_weight).toFixed(1)} kg
                        </Badge>
                      )}
                      {diffLabel && (
                        <Badge variant="outline" className="text-[10px]">
                          {diffLabel} kg
                        </Badge>
                      )}
                      {n.has_photos && (
                        <Badge variant="outline" className="text-[10px] border-amber-500/40 text-amber-600">
                          📸 Novas fotos de evolução
                        </Badge>
                      )}
                      {!hasWeight && !n.has_photos && (
                        <Badge variant="outline" className="text-[10px]">Atualização recebida</Badge>
                      )}
                    </div>
                    <p className="text-[10px] text-muted-foreground mt-1">
                      {format(new Date(n.created_at), "dd/MM/yyyy HH:mm", { locale: ptBR })}
                    </p>
                  </div>
                  <Button size="sm" variant="ghost" className="shrink-0 text-xs h-7" onClick={() => markSeen.mutate(n.id)}>
                    <Eye className="w-3 h-3 mr-1" /> Visto
                  </Button>
                </div>
              );
            })}
            {unseen.length === 0 && (
              <p className="text-sm text-muted-foreground text-center py-6">Nenhuma atualização pendente 🎉</p>
            )}
          </div>
        </ScrollArea>

        {unseen.length > 0 && (
          <div className="flex justify-end pt-2 border-t">
            <Button size="sm" onClick={() => markAllSeen.mutate()} className="text-xs gap-1.5">
              <CheckCheck className="w-3.5 h-3.5" />
              Marcar todas como vistas
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default EvolutionUpdatePopup;
