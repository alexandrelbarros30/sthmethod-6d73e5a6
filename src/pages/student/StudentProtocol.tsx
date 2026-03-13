import { useEffect } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth } from "@/contexts/AuthContext";
import { useSubscriptionGuard } from "@/hooks/useSubscriptionGuard";
import SubscriptionBlock from "@/components/SubscriptionBlock";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { AlertTriangle, FileText, Clock, Download } from "lucide-react";
import RichContentRenderer from "@/components/shared/RichContentRenderer";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { generateStudentPDF, canDownloadPDF } from "@/lib/pdfGenerator";
import { toast } from "sonner";

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
  const { isActive, isLoading: subLoading, subscription } = useSubscriptionGuard();

  const { data: protocols, isLoading } = useQuery({
    queryKey: ["student-protocols", user?.id],
    queryFn: async () => {
      const { data } = await supabase
        .from("student_protocols")
        .select("*")
        .eq("user_id", user!.id)
        .order("created_at", { ascending: false });
      return data || [];
    },
    enabled: !!user?.id && isActive,
  });

  const { data: profile } = useQuery({
    queryKey: ["profile", user?.id],
    queryFn: async () => {
      const { data } = await supabase
        .from("profiles")
        .select("*")
        .eq("user_id", user!.id)
        .single();
      return data;
    },
    enabled: !!user?.id,
  });

  const handleDownloadPDF = async (protocol: any) => {
    try {
      const blob = await generateStudentPDF({
        type: 'protocol',
        title: protocol.title,
        content: protocol.content || 'Conteúdo não disponível',
        studentInfo: {
          name: profile?.full_name || 'Aluno',
          age: profile?.birth_date ? Math.floor((Date.now() - new Date(profile.birth_date).getTime()) / (365.25 * 24 * 60 * 60 * 1000)) : undefined,
          weight: profile?.weight || undefined,
          height: profile?.height ? (profile.height / 100) : undefined,
          goal: profile?.objective || undefined,
        },
        createdAt: protocol.created_at,
      });
      
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${protocol.title.replace(/[^a-zA-Z0-9]/g, '_')}_${new Date(protocol.created_at).toLocaleDateString('pt-BR').replace(/\//g, '-')}.pdf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      
      toast.success('PDF baixado com sucesso!');
    } catch (error) {
      console.error('Erro ao gerar PDF:', error);
      toast.error('Erro ao gerar PDF. Tente novamente.');
    }
  };

  const canDownload = canDownloadPDF(subscription?.plans?.name);

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
    <DashboardLayout role="student" title="Protocolo" subtitle="Suplementação e medicamentos prescritos.">
      <style>{`
        @media print { .content-protected { display: none !important; } body::after { content: "Impressão não permitida"; display: flex; align-items: center; justify-content: center; font-size: 2rem; height: 100vh; } }
        .content-protected { user-select: none; -webkit-user-select: none; -moz-user-select: none; -ms-user-select: none; -webkit-touch-callout: none; }
      `}</style>
      <div className="space-y-4 max-w-4xl content-protected">
        {/* Legal disclaimer */}
        <Card className="border-warning/30 bg-warning/5">
          <CardContent className="flex items-start gap-3 py-4">
            <AlertTriangle className="w-5 h-5 text-warning shrink-0 mt-0.5" />
            <p className="text-sm text-muted-foreground font-body">
              As informações aqui apresentadas não substituem avaliação e acompanhamento médico.
            </p>
          </CardContent>
        </Card>

        {!protocols || protocols.length === 0 ? (
          <Card><CardContent className="py-8 text-center">
            <p className="text-muted-foreground font-body">Nenhum protocolo configurado ainda. Aguarde seu consultor.</p>
          </CardContent></Card>
        ) : (
          <>
            <h3 className="text-sm font-semibold text-muted-foreground font-display flex items-center gap-2">
              <Clock className="w-4 h-4" /> Histórico de Protocolos ({protocols.length})
            </h3>

            {protocols.map((protocol: any) => (
              <Card key={protocol.id}>
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between flex-wrap gap-2">
                    <div className="flex items-center gap-2 flex-wrap">
                      <CardTitle className="text-base font-display">{protocol.title}</CardTitle>
                      <Badge variant="outline" className="text-[10px]">
                        {new Date(protocol.created_at).toLocaleDateString("pt-BR")} às{" "}
                        {new Date(protocol.created_at).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}
                      </Badge>
                    </div>
                    {canDownload && protocol.content && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDownloadPDF(protocol)}
                        className="h-7 text-xs"
                      >
                        <Download className="w-3 h-3 mr-1" />
                        PDF
                      </Button>
                    )}
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  {protocol.pdf_url && (
                    <div>
                      <p className="text-xs text-primary flex items-center gap-1 mb-2">
                        <FileText className="w-3 h-3" /> Documento PDF
                      </p>
                      <iframe
                        src={protocol.pdf_url}
                        className="w-full h-[500px] rounded-lg border border-border"
                        title="Protocolo PDF"
                      />
                    </div>
                  )}
                  {protocol.content && (
                    <RichContentRenderer content={protocol.content} />
                  )}
                </CardContent>
              </Card>
            ))}
          </>
        )}
      </div>
    </DashboardLayout>
  );
};

export default StudentProtocol;
