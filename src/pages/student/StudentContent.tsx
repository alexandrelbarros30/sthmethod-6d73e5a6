import DashboardLayout from "@/components/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { FileText, Video, BookOpen, ExternalLink } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

const typeIcons: Record<string, any> = {
  article: BookOpen,
  pdf: FileText,
  video: Video,
};

const typeLabels: Record<string, string> = {
  article: "Artigo",
  pdf: "PDF",
  video: "Vídeo",
};

const StudentContent = () => {
  const { data: contents, isLoading } = useQuery({
    queryKey: ["content"],
    queryFn: async () => {
      const { data } = await supabase
        .from("content")
        .select("*")
        .eq("published", true)
        .order("created_at", { ascending: false });
      return data || [];
    },
  });

  return (
    <DashboardLayout role="student" title="Conteúdo Educativo" subtitle="Artigos, vídeos e materiais para sua evolução.">
      <div className="grid md:grid-cols-2 gap-4 max-w-4xl">
        {isLoading && <p className="text-muted-foreground font-body text-sm col-span-2">Carregando...</p>}
        {!isLoading && (!contents || contents.length === 0) && (
          <Card className="col-span-2">
            <CardContent className="py-8 text-center">
              <p className="text-muted-foreground font-body">Nenhum conteúdo disponível ainda.</p>
            </CardContent>
          </Card>
        )}
        {contents?.map((item, i) => {
          const Icon = typeIcons[item.type] || BookOpen;
          return (
            <Card key={item.id} className="animate-fade-in hover:shadow-card-hover transition-all" style={{ animationDelay: `${i * 80}ms` }}>
              <CardHeader className="pb-2">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-lg bg-secondary flex items-center justify-center">
                      <Icon className="w-4 h-4 text-primary" />
                    </div>
                    <CardTitle className="text-sm font-display">{item.title}</CardTitle>
                  </div>
                  <Badge variant="outline" className="text-xs">{typeLabels[item.type] || item.type}</Badge>
                </div>
              </CardHeader>
              <CardContent>
                {item.description && <p className="text-xs text-muted-foreground font-body mb-3">{item.description}</p>}
                {item.url && (
                  <a href={item.url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-xs text-primary hover:underline font-body">
                    Acessar <ExternalLink className="w-3 h-3" />
                  </a>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>
    </DashboardLayout>
  );
};

export default StudentContent;
