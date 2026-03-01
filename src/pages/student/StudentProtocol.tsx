import DashboardLayout from "@/components/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { AlertTriangle } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

const StudentProtocol = () => {
  const { user } = useAuth();

  const { data: protocols, isLoading } = useQuery({
    queryKey: ["protocols", user?.id],
    queryFn: async () => {
      const { data } = await supabase
        .from("protocols")
        .select("*")
        .eq("user_id", user!.id)
        .order("sort_order");
      return data || [];
    },
    enabled: !!user?.id,
  });

  const supplements = protocols?.filter((p) => p.category === "supplement") || [];
  const medications = protocols?.filter((p) => p.category === "medication") || [];

  return (
    <DashboardLayout role="student" title="Protocolo" subtitle="Suplementação e medicamentos prescritos.">
      <div className="space-y-6 max-w-3xl">
        {/* Legal disclaimer */}
        <Card className="border-warning/30 bg-warning/5">
          <CardContent className="flex items-start gap-3 py-4">
            <AlertTriangle className="w-5 h-5 text-warning shrink-0 mt-0.5" />
            <p className="text-sm text-muted-foreground font-body">
              As informações aqui apresentadas não substituem acompanhamento médico. Consulte sempre um profissional de saúde.
            </p>
          </CardContent>
        </Card>

        {isLoading && <p className="text-muted-foreground font-body text-sm">Carregando...</p>}

        {!isLoading && protocols?.length === 0 && (
          <Card>
            <CardContent className="py-8 text-center">
              <p className="text-muted-foreground font-body">Nenhum protocolo cadastrado ainda.</p>
            </CardContent>
          </Card>
        )}

        {supplements.length > 0 && (
          <Card>
            <CardHeader><CardTitle className="text-base font-display">Suplementos</CardTitle></CardHeader>
            <CardContent className="space-y-2">
              {supplements.map((s) => (
                <div key={s.id} className="flex items-start justify-between py-2 border-b border-border/50 last:border-0">
                  <div>
                    <span className="text-sm font-medium text-foreground font-body">{s.name}</span>
                    {s.notes && <p className="text-xs text-muted-foreground font-body">{s.notes}</p>}
                  </div>
                  <div className="text-right">
                    <Badge variant="secondary" className="text-xs">{s.dosage}</Badge>
                    <p className="text-xs text-muted-foreground font-body mt-1">{s.frequency}</p>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        )}

        {medications.length > 0 && (
          <Card>
            <CardHeader><CardTitle className="text-base font-display">Medicamentos</CardTitle></CardHeader>
            <CardContent className="space-y-2">
              {medications.map((m) => (
                <div key={m.id} className="flex items-start justify-between py-2 border-b border-border/50 last:border-0">
                  <div>
                    <span className="text-sm font-medium text-foreground font-body">{m.name}</span>
                    {m.notes && <p className="text-xs text-muted-foreground font-body">{m.notes}</p>}
                  </div>
                  <div className="text-right">
                    <Badge variant="secondary" className="text-xs">{m.dosage}</Badge>
                    <p className="text-xs text-muted-foreground font-body mt-1">{m.frequency}</p>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        )}
      </div>
    </DashboardLayout>
  );
};

export default StudentProtocol;
