import DashboardLayout from "@/components/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth } from "@/contexts/AuthContext";
import { useSubscriptionGuard } from "@/hooks/useSubscriptionGuard";
import SubscriptionBlock from "@/components/SubscriptionBlock";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { AlertTriangle, FileText } from "lucide-react";

const StudentProtocol = () => {
  const { user } = useAuth();
  const { isActive, isLoading: subLoading } = useSubscriptionGuard();

  const { data: protocol, isLoading } = useQuery({
    queryKey: ["student-protocol", user?.id],
    queryFn: async () => {
      const { data } = await supabase
        .from("student_protocols" as any)
        .select("*")
        .eq("user_id", user!.id)
        .maybeSingle();
      return data;
    },
    enabled: !!user?.id && isActive,
  });

  if (subLoading || isLoading) {
    return (
      <DashboardLayout role="student" title="Protocolo" subtitle="Suplementação e medicamentos prescritos.">
        <p className="text-muted-foreground font-body text-sm">Carregando...</p>
      </DashboardLayout>
    );
  }

  if (!isActive) {
    return (
      <DashboardLayout role="student" title="Protocolo" subtitle="Suplementação e medicamentos prescritos.">
        <SubscriptionBlock />
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout role="student" title={(protocol as any)?.title || "Protocolo"} subtitle="Suplementação e medicamentos prescritos.">
      <div className="space-y-6 max-w-4xl">
        {/* Legal disclaimer */}
        <Card className="border-warning/30 bg-warning/5">
          <CardContent className="flex items-start gap-3 py-4">
            <AlertTriangle className="w-5 h-5 text-warning shrink-0 mt-0.5" />
            <p className="text-sm text-muted-foreground font-body">
              As informações aqui apresentadas não substituem avaliação e acompanhamento médico.
            </p>
          </CardContent>
        </Card>

        {!protocol ? (
          <Card><CardContent className="py-8 text-center">
            <p className="text-muted-foreground font-body">Nenhum protocolo configurado ainda. Aguarde seu consultor.</p>
          </CardContent></Card>
        ) : (
          <>
            {(protocol as any).pdf_url && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-base font-display flex items-center gap-2">
                    <FileText className="w-4 h-4" /> Documento PDF
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <iframe
                    src={(protocol as any).pdf_url}
                    className="w-full h-[600px] rounded-lg border border-border"
                    title="Protocolo PDF"
                  />
                </CardContent>
              </Card>
            )}

            {(protocol as any).content && (
              <Card>
                <CardHeader><CardTitle className="text-base font-display">Detalhes</CardTitle></CardHeader>
                <CardContent>
                  <div className="whitespace-pre-wrap text-sm text-foreground font-body leading-relaxed">
                    {(protocol as any).content}
                  </div>
                </CardContent>
              </Card>
            )}
          </>
        )}
      </div>
    </DashboardLayout>
  );
};

export default StudentProtocol;
