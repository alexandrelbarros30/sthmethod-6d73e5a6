import { useEffect, useMemo, useState } from "react";
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
import SignedPdfFrame from "@/components/shared/SignedPdfFrame";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import GamifiedProtocolPanel from "@/components/student/GamifiedProtocolPanel";
import { hasSmartProtocolStructure, isSmartProtocolEra } from "@/lib/protocol-phase-parser";
import { Sparkles, ChevronDown } from "lucide-react";

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

  // Fetch all subscriptions + continuity decisions to compute cumulative medication weeks
  const { data: continuityData } = useQuery({
    queryKey: ["student-continuity", targetId],
    queryFn: async () => {
      const [{ data: subs }, { data: decisions }] = await Promise.all([
        supabase
          .from("subscriptions")
          .select("id, start_date, end_date, created_at, plan_id, plans(duration_days)")
          .eq("user_id", targetId!)
          .order("created_at", { ascending: true }),
        supabase
          .from("protocol_continuity_decisions" as any)
          .select("*")
          .eq("user_id", targetId!),
      ]);
      return { subs: subs || [], decisions: (decisions as any[]) || [] };
    },
    enabled: !!targetId && isActive,
  });

  const { maxMedWeeks, continuationNotice } = useMemo(() => {
    const currentPlanDays = (subscription as any)?.plans?.duration_days as number | undefined;
    const baseWeeks = currentPlanDays && currentPlanDays > 0
      ? Math.max(1, Math.floor((currentPlanDays * 4) / 30))
      : undefined;

    const subs = continuityData?.subs || [];
    const decisions = continuityData?.decisions || [];
    if (subs.length === 0) {
      return { maxMedWeeks: baseWeeks, continuationNotice: null as string | null };
    }

    // Sum durations across the chain of continued subscriptions ending at the current one.
    // Walk forward from earliest sub; reset chain when decision is 'restart' or 'pending' (not yet decided).
    let chainDays = 0;
    for (const s of subs) {
      const d = decisions.find((x) => x.subscription_id === s.id);
      const dec = d?.decision || "auto_continue"; // first ever sub has no decision row
      if (dec === "restart" || dec === "pending") {
        chainDays = (s as any)?.plans?.duration_days || 0;
      } else {
        chainDays += (s as any)?.plans?.duration_days || 0;
      }
    }
    const cumulativeWeeks = chainDays > 0 ? Math.max(1, Math.floor((chainDays * 4) / 30)) : baseWeeks;

    // Detect continuation notice: continued chain but the protocol HTML may not have enough week cards.
    let notice: string | null = null;
    const lastSub = subs[subs.length - 1];
    const lastDecision = decisions.find((x) => x.subscription_id === lastSub?.id);
    if (lastDecision?.decision === "pending" && (lastDecision?.gap_days ?? 0) > 15) {
      notice = "Renovação detectada após 15 dias. Aguardando seu consultor decidir sobre a continuidade do protocolo.";
    } else if ((lastDecision?.decision === "auto_continue" || lastDecision?.decision === "continue") && cumulativeWeeks && baseWeeks && cumulativeWeeks > baseWeeks) {
      notice = "Protocolo continuado — seu consultor pode atualizar o conteúdo conforme sua evolução.";
    }

    return { maxMedWeeks: cumulativeWeeks, continuationNotice: notice };
  }, [continuityData, subscription]);

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
    enabled: !!targetId && !isActive,
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

  const { data: protocolCategoryContents = [] } = useQuery({
    queryKey: ["student-protocol-category-contents", targetId],
    queryFn: async () => {
      const { data } = await supabase
        .from("protocol_category_content")
        .select("category, content, updated_at")
        .eq("user_id", targetId!);
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
          cpf: (profile as any)?.cpf || undefined,
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

  const planDurationDays = (subscription as any)?.plans?.duration_days as number | undefined;
  const canDownload = canDownloadPDF(subscription?.plans?.name) && planDurationDays === 180;
  const latestProtocol = protocols && protocols[0];
  const latestProtocolContent = latestProtocol?.content || "";
  const hasOldProtocolItems = (protocolItems?.length ?? 0) > 0;
  const latestProtocolIsSmartEra = isSmartProtocolEra(latestProtocol?.created_at);
  const latestProtocolHasSmartStructure = useMemo(
    () => hasSmartProtocolStructure(latestProtocolContent),
    [latestProtocolContent],
  );
  const smartContentFromLegacyCards = useMemo(() => {
    const match = protocolCategoryContents.find((entry: any) => hasSmartProtocolStructure(entry.content || ""));
    return match?.content || "";
  }, [protocolCategoryContents]);
  const smartProtocolContent = latestProtocolHasSmartStructure
    ? latestProtocolContent
    : smartContentFromLegacyCards;
  const hasSmartProtocolConfigured = smartProtocolContent.trim().length > 0;
  const showSmartProtocol = hasSmartProtocolConfigured || (!hasOldProtocolItems && latestProtocolIsSmartEra);
  const showLegacyPanels = hasOldProtocolItems && !hasSmartProtocolConfigured;
  const historyProtocols = useMemo(() => {
    if (!protocols?.length) return [];
    if (!showSmartProtocol) return protocols;
    return protocols.filter((protocol: any) => protocol.id !== latestProtocol?.id);
  }, [protocols, showSmartProtocol, latestProtocol?.id]);
  const [smartOpen, setSmartOpen] = useState(true);

  if (subLoading || isLoading) {
    return (
      <DashboardLayout role="student" title="Protocolo" subtitle="Suplementação e medicamentos prescritos.">
        <PreviewAsBanner />
        <p className="text-muted-foreground font-body text-sm">Carregando...</p>
      </DashboardLayout>
    );
  }

  if (!isActive) {
    if (previewProtocol?.content) {
      const txt = (previewProtocol.content || "").replace(/<[^>]+>/g, "\n");
      return (
        <DashboardLayout role="student" title="Protocolo" subtitle="Pré-estreia do seu protocolo personalizado.">
          <PreviewAsBanner />
          <PreviewLockedCard type="protocol" previewText={txt} />
        </DashboardLayout>
      );
    }
    return (
      <DashboardLayout role="student" title="Protocolo" subtitle="Suplementação e medicamentos prescritos.">
        <PreviewAsBanner />
        <SubscriptionBlock />
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout role="student" title="Protocolo" subtitle="Suplementação e medicamentos prescritos.">
      <PreviewAsBanner />
      <style>{`
        @media print { .content-protected { display: none !important; } body::after { content: "Impressão não permitida"; display: flex; align-items: center; justify-content: center; font-size: 2rem; height: 100vh; } }
        .content-protected { user-select: none; -webkit-user-select: none; -moz-user-select: none; -ms-user-select: none; -webkit-touch-callout: none; }
      `}</style>
      <div className="space-y-4 max-w-4xl content-protected">
        {/* Legal disclaimer */}
        <div className="rounded-2xl border border-border/40 bg-muted/30 px-4 py-3 flex items-start gap-3">
          <AlertTriangle className="w-4 h-4 text-foreground/70 shrink-0 mt-0.5" strokeWidth={1.8} />
          <p className="text-[12px] text-muted-foreground font-light tracking-tight leading-relaxed">
            As informações aqui apresentadas não substituem avaliação e acompanhamento médico.
          </p>
        </div>

        {/* Student info */}
        {buildStudentInfo()}

        {/* Legacy panels remain active whenever the student has old protocol items */}
        {showLegacyPanels && (
          <ProtocolInfoPanel protocols={protocolItems} userId={targetId} />
        )}

        {/* New "Protocolo Inteligente" card — independent from legacy panels */}
        {showSmartProtocol && (
          <Collapsible open={smartOpen} onOpenChange={setSmartOpen}>
            <CollapsibleTrigger className="w-full flex items-center justify-between rounded-2xl border border-[#14b780]/30 bg-gradient-to-br from-[#14b780]/10 to-transparent px-4 py-3 hover:bg-[#14b780]/5 transition">
              <span className="flex items-center gap-2 text-sm font-semibold tracking-tight">
                <Sparkles className="w-4 h-4 text-[#14b780]" strokeWidth={2} />
                Protocolo Inteligente
              </span>
              <ChevronDown className={`w-4 h-4 transition-transform ${smartOpen ? "rotate-180" : ""}`} strokeWidth={2} />
            </CollapsibleTrigger>
            <CollapsibleContent className="pt-3">
              <div className="space-y-3">
                {canDownload && latestProtocol?.content && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleDownloadPDF(latestProtocol)}
                    className="h-7 text-xs"
                  >
                    <Download className="w-3 h-3 mr-1" />
                    PDF
                  </Button>
                )}
                <GamifiedProtocolPanel content={smartProtocolContent} userId={targetId!} readOnly={isPreviewing} maxWeeks={maxMedWeeks} continuationNotice={continuationNotice} />
              </div>
            </CollapsibleContent>
          </Collapsible>
        )}

        {/* History */}
        {!historyProtocols || historyProtocols.length === 0 ? (
              <Card><CardContent className="py-8 text-center">
                <p className="text-muted-foreground font-body">Nenhum protocolo configurado ainda. Aguarde seu consultor.</p>
              </CardContent></Card>
            ) : (
              <>
                <p className="text-[10px] font-medium tracking-[0.25em] uppercase text-muted-foreground flex items-center gap-1.5 pt-2">
                  <Clock className="w-3 h-3" strokeWidth={2} /> Histórico · {historyProtocols.length}
                </p>

                <Accordion type="single" collapsible className="space-y-2">
                  {historyProtocols.map((protocol: any) => (
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
                              <p className="text-xs text-foreground flex items-center gap-1 mb-2">
                                <FileText className="w-3 h-3" /> Documento PDF
                              </p>
                              <SignedPdfFrame
                                bucket="documents"
                                storagePath={(protocol as any).storage_path}
                                publicUrl={protocol.pdf_url}
                                className="w-full h-[500px] rounded-lg border border-border"
                                title="Protocolo PDF"
                              />
                            </div>
                          )}
                           {protocol.content && (
                            (hasSmartProtocolStructure(protocol.content) ? (
                              <GamifiedProtocolPanel
                                content={protocol.content}
                                userId={targetId!}
                                readOnly={isPreviewing}
                                maxWeeks={maxMedWeeks}
                                continuationNotice={continuationNotice}
                              />
                            ) : (
                              <RichContentRenderer content={protocol.content} />
                            ))
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
