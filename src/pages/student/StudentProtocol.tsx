import { useEffect } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth } from "@/contexts/AuthContext";
import { useSubscriptionGuard } from "@/hooks/useSubscriptionGuard";
import SubscriptionBlock from "@/components/SubscriptionBlock";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { AlertTriangle, FileText } from "lucide-react";

const useContentProtection = () => {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "PrintScreen" || (e.ctrlKey && e.key === "p") || (e.metaKey && e.key === "p") || (e.ctrlKey && e.key === "c") || (e.metaKey && e.key === "c")) {
        e.preventDefault();
        document.body.style.filter = "blur(20px)";
        setTimeout(() => { document.body.style.filter = "none"; }, 1500);
      }
    };
    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.key === "PrintScreen") {
        document.body.style.filter = "blur(20px)";
        navigator.clipboard.writeText("").catch(() => {});
        setTimeout(() => { document.body.style.filter = "none"; }, 1500);
      }
    };
    const handleContextMenu = (e: MouseEvent) => e.preventDefault();
    const handleVisibilityChange = () => {
      document.body.style.filter = document.visibilityState === "hidden" ? "blur(20px)" : "none";
    };
    document.addEventListener("keydown", handleKeyDown);
    document.addEventListener("keyup", handleKeyUp);
    document.addEventListener("contextmenu", handleContextMenu);
    document.addEventListener("visibilitychange", handleVisibilityChange);
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.removeEventListener("keyup", handleKeyUp);
      document.removeEventListener("contextmenu", handleContextMenu);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      document.body.style.filter = "none";
    };
  }, []);
};

const StudentProtocol = () => {
  useContentProtection();
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
      <style>{`
        @media print { .content-protected { display: none !important; } body::after { content: "Impressão não permitida"; display: flex; align-items: center; justify-content: center; font-size: 2rem; height: 100vh; } }
        .content-protected { user-select: none; -webkit-user-select: none; -moz-user-select: none; -ms-user-select: none; -webkit-touch-callout: none; }
      `}</style>
      <div className="space-y-6 max-w-4xl content-protected">
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
