import DashboardLayout from "@/components/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { FileText, Video, BookOpen } from "lucide-react";
import { mockContent } from "@/lib/mock-data";

const typeIcons = { article: BookOpen, pdf: FileText, video: Video };
const typeLabels = { article: "Artigo", pdf: "PDF", video: "Vídeo" };

const StudentContent = () => {
  return (
    <DashboardLayout role="student" title="Conteúdo Educativo" subtitle="Materiais para aprofundar seu conhecimento.">
      <div className="space-y-4 max-w-3xl">
        {mockContent.map((item, i) => {
          const Icon = typeIcons[item.type];
          return (
            <Card key={item.id} className="animate-fade-in hover:shadow-card-hover transition-all duration-300 cursor-pointer" style={{ animationDelay: `${i * 80}ms` }}>
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-lg bg-secondary flex items-center justify-center">
                      <Icon className="w-4 h-4 text-primary" />
                    </div>
                    <CardTitle className="text-base font-display">{item.title}</CardTitle>
                  </div>
                  <Badge variant="outline" className="text-xs">{typeLabels[item.type]}</Badge>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground font-body">{item.description}</p>
                <p className="text-xs text-muted-foreground/60 mt-2 font-body">{new Date(item.date).toLocaleDateString("pt-BR")}</p>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </DashboardLayout>
  );
};

export default StudentContent;
