import DashboardLayout from "@/components/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth } from "@/contexts/AuthContext";
import { useSubscriptionGuard } from "@/hooks/useSubscriptionGuard";
import SubscriptionBlock from "@/components/SubscriptionBlock";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { FileText, Video } from "lucide-react";

const getEmbedUrl = (url: string) => {
  if (!url) return null;
  const ytMatch = url.match(/(?:youtube\.com\/(?:watch\?v=|embed\/)|youtu\.be\/)([a-zA-Z0-9_-]+)/);
  if (ytMatch) return `https://www.youtube.com/embed/${ytMatch[1]}`;
  const vimeoMatch = url.match(/vimeo\.com\/(\d+)/);
  if (vimeoMatch) return `https://player.vimeo.com/video/${vimeoMatch[1]}`;
  return url;
};

const StudentTraining = () => {
  const { user } = useAuth();
  const { isActive, isLoading: subLoading } = useSubscriptionGuard();

  const { data: training, isLoading } = useQuery({
    queryKey: ["student-training", user?.id],
    queryFn: async () => {
      const { data } = await supabase
        .from("student_trainings" as any)
        .select("*")
        .eq("user_id", user!.id)
        .maybeSingle();
      return data;
    },
    enabled: !!user?.id && isActive,
  });

  if (subLoading || isLoading) {
    return (
      <DashboardLayout role="student" title="Treino" subtitle="Seu plano de treino personalizado.">
        <p className="text-muted-foreground font-body text-sm">Carregando...</p>
      </DashboardLayout>
    );
  }

  if (!isActive) {
    return (
      <DashboardLayout role="student" title="Treino" subtitle="Seu plano de treino personalizado.">
        <SubscriptionBlock />
      </DashboardLayout>
    );
  }

  if (!training) {
    return (
      <DashboardLayout role="student" title="Treino" subtitle="Seu plano de treino personalizado.">
        <Card><CardContent className="py-8 text-center">
          <p className="text-muted-foreground font-body">Nenhum treino configurado ainda. Aguarde seu consultor.</p>
        </CardContent></Card>
      </DashboardLayout>
    );
  }

  const embedUrl = getEmbedUrl((training as any).video_url || "");

  return (
    <DashboardLayout role="student" title={(training as any).title || "Treino"} subtitle="Seu plano de treino personalizado.">
      <div className="space-y-6 max-w-4xl">
        {embedUrl && (
          <Card>
            <CardHeader>
              <CardTitle className="text-base font-display flex items-center gap-2">
                <Video className="w-4 h-4" /> Vídeo
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="aspect-video">
                <iframe
                  src={embedUrl}
                  className="w-full h-full rounded-lg"
                  allowFullScreen
                  title="Vídeo do treino"
                />
              </div>
            </CardContent>
          </Card>
        )}

        {(training as any).pdf_url && (
          <Card>
            <CardHeader>
              <CardTitle className="text-base font-display flex items-center gap-2">
                <FileText className="w-4 h-4" /> Documento PDF
              </CardTitle>
            </CardHeader>
            <CardContent>
              <iframe
                  src={`${(training as any).pdf_url}#toolbar=0&navpanes=0&scrollbar=1`}
                  className="w-full h-[600px] rounded-lg border border-border"
                  title="Treino PDF"
                  style={{ pointerEvents: "auto" }}
                  sandbox="allow-same-origin allow-scripts"
                />
            </CardContent>
          </Card>
        )}

        {(training as any).content && (
          <Card>
            <CardHeader><CardTitle className="text-base font-display">Detalhes</CardTitle></CardHeader>
            <CardContent>
              <div className="whitespace-pre-wrap text-sm text-foreground font-body leading-relaxed">
                {(training as any).content}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </DashboardLayout>
  );
};

export default StudentTraining;
