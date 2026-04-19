import { useEffect } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth } from "@/contexts/AuthContext";
import { useSubscriptionGuard } from "@/hooks/useSubscriptionGuard";
import { usePreviewAs } from "@/hooks/usePreviewAs";
import PreviewAsBanner from "@/components/student/PreviewAsBanner";
import SubscriptionBlock from "@/components/SubscriptionBlock";
import PreviewLockedCard from "@/components/student/PreviewLockedCard";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { AlertTriangle, FileText, Clock, Download } from "lucide-react";
import RichContentRenderer from "@/components/shared/RichContentRenderer";
import ProtocolInfoPanel from "@/components/student/ProtocolInfoPanel";
import StudentInfoHeader from "@/components/student/StudentInfoHeader";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { generateStudentPDF, canDownloadPDF } from "@/lib/pdfGenerator";
import { toast } from "sonner";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";

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
  const { effectiveUserId, isPreviewing } = usePreviewAs();
  const targetId = effectiveUserId || user?.id;
  const { isActive, isLoading: subLoading, subscription, previewUnlocked } = useSubscriptionGuard();

  const { data: previewProtocol } = useQuery({
    queryKey: ["preview-protocol", targetId],
    queryFn: async () => {
      const { data } = await supabase
        .from("student_protocols")
        .select("title, content")
        .eq("user_id", targetId!)
        .eq("visible", true)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();
      return data;
    },
    enabled: !!targetId && !isActive && previewUnlocked,
  });

  const { data: protocols, isLoading } = useQuery({
    queryKey: ["student-protocols", targetId, isPreviewing],
    queryFn: async () => {
      const today = new Date().toISOString().slice(0, 10);
      const { data } = await supabase
        .from("student_protocols")
        .select("*")
        .eq("user_id", targetId!)
        .eq("visible", true)
        .order("created_at", { ascending: false });
      // Filter by release_date and end_date client-side
      return (data || []).filter((p: any) => {
        if (p.release_date && p.release_date > today) return false;
        if (p.end_date && p.end_date < today) return false;
        return true;
      });
    },
    enabled: !!targetId && isActive,
  });

  const { data: protocolItems = [] } = useQuery({
    queryKey: ["student-protocol-items", targetId],
    queryFn: async () => {
      const { data } = await supabase
        .from("protocols")
        .select("*")
        .eq("user_id", targetId!)
        .order("category")
        .order("sort_order");
      return data || [];
    },
    enabled: !!targetId && isActive,
  });

  const { data: profile } = useQuery({
    queryKey: ["profile", targetId],
    queryFn: async () => {
      const { data } = await supabase
        .from("profiles")
        .select("*")
        .eq("user_id", targetId!)
        .single();
      return data;
    },
    enabled: !!targetId,
  });

  const buildStudentInfo = () => {
    if (!profile) return null;
    const age = profile.birth_date
      ? Math.floor((Date.now() - new Date(profile.birth_date).getTime()) / (365.25 * 24 * 60 * 60 * 1000))
      : undefined;
    return (
      <Card className="border-border bg-muted/50">
        <CardContent className="py-4">
          <StudentInfoHeader info={{
            name: profile.full_name || undefined,
            age,
            weight: profile.weight || undefined,
            height: profile.height || undefined,
            objective: profile.objective || undefined,
          }} />
        </CardContent>
      </Card>
    );
  };

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
    if (previewUnlocked) {
      const txt = (previewProtocol?.content || "").replace(/<[^>]+>/g, "\n");
      return (
        <DashboardLayout role="student" title="Protocolo" subtitle="Pré-estreia do seu protocolo personalizado.">
          <PreviewLockedCard type="protocol" previewText={txt} />
        </DashboardLayout>
      );
    }
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

        {/* Student info */}
        {buildStudentInfo()}

        {/* Protocol Info Panel */}
        <ProtocolInfoPanel protocols={protocolItems} userId={user?.id} />

        {!protocols || protocols.length === 0 ? (
          <Card><CardContent className="py-8 text-center">
            <p className="text-muted-foreground font-body">Nenhum protocolo configurado ainda. Aguarde seu consultor.</p>
          </CardContent></Card>
        ) : (
          <>
            <h3 className="text-sm font-semibold text-muted-foreground font-display flex items-center gap-2">
              <Clock className="w-4 h-4" /> Histórico de Protocolos ({protocols.length})
            </h3>

            <Accordion type="single" collapsible className="space-y-2">
              {protocols.map((protocol: any) => (
                <AccordionItem key={protocol.id} value={protocol.id} className="border rounded-xl overflow-hidden bg-card">
                  <AccordionTrigger className="px-4 py-3 hover:no-underline">
                    <div className="flex items-center gap-2 flex-wrap text-left">
                      <span className="text-base font-display font-semibold">{protocol.title}</span>
                      <Badge variant="outline" className="text-[10px]">
                        {new Date(protocol.created_at).toLocaleDateString("pt-BR")} às{" "}
                        {new Date(protocol.created_at).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}
                      </Badge>
                    </div>
                  </AccordionTrigger>
                  <AccordionContent className="px-4 pb-4">
                    <div className="space-y-3">
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
                    </div>
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </>
        )}
      </div>
    </DashboardLayout>
  );
};

export default StudentProtocol;
