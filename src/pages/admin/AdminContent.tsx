import { useState } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useSiteContent, useUpdateSiteContent, SiteContentItem } from "@/hooks/useSiteContent";
import { Save, Check, FileText, Settings } from "lucide-react";
import { toast } from "@/hooks/use-toast";

const AdminContent = () => {
  const { data: items, isLoading } = useSiteContent();
  const updateMutation = useUpdateSiteContent();
  const [edits, setEdits] = useState<Record<string, string>>({});
  const [saved, setSaved] = useState<Record<string, boolean>>({});

  const institutional = items?.filter((i) => i.category === "institutional") ?? [];
  const operational = items?.filter((i) => i.category === "operational") ?? [];

  const handleChange = (id: string, value: string) => {
    setEdits((prev) => ({ ...prev, [id]: value }));
    setSaved((prev) => ({ ...prev, [id]: false }));
  };

  const handleSave = async (item: SiteContentItem) => {
    const content = edits[item.id] ?? item.content;
    try {
      await updateMutation.mutateAsync({ id: item.id, content });
      setSaved((prev) => ({ ...prev, [item.id]: true }));
      toast({ title: "Salvo!", description: `"${item.label}" atualizado com sucesso.` });
    } catch {
      toast({ title: "Erro", description: "Não foi possível salvar.", variant: "destructive" });
    }
  };

  const renderItems = (list: SiteContentItem[]) =>
    list.map((item) => {
      const value = edits[item.id] ?? item.content;
      const isSaved = saved[item.id];
      const isChanged = edits[item.id] !== undefined && edits[item.id] !== item.content;

      return (
        <Card key={item.id} className="bg-card border-border">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-sm font-semibold text-foreground">{item.label}</CardTitle>
                <p className="text-xs text-muted-foreground mt-0.5 font-mono">{item.key}</p>
              </div>
              <Button
                size="sm"
                onClick={() => handleSave(item)}
                disabled={!isChanged && !isSaved}
                className={isSaved ? "bg-green-600 hover:bg-green-700" : "gradient-bg"}
              >
                {isSaved ? <Check className="w-4 h-4 mr-1" /> : <Save className="w-4 h-4 mr-1" />}
                {isSaved ? "Salvo" : "Salvar"}
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <Textarea
              value={value}
              onChange={(e) => handleChange(item.id, e.target.value)}
              rows={value.length > 100 ? 4 : 2}
              className="bg-background border-border text-foreground resize-y"
            />
          </CardContent>
        </Card>
      );
    });

  return (
    <DashboardLayout role="admin" title="Personalização">
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-display font-bold text-foreground">Personalização de Textos</h1>
          <p className="text-muted-foreground text-sm mt-1">
            Edite os textos exibidos na plataforma. Alterações são salvas individualmente.
          </p>
        </div>

        {isLoading ? (
          <div className="text-muted-foreground">Carregando...</div>
        ) : (
          <Tabs defaultValue="institutional">
            <TabsList className="bg-muted">
              <TabsTrigger value="institutional" className="gap-2">
                <FileText className="w-4 h-4" />
                Institucionais
              </TabsTrigger>
              <TabsTrigger value="operational" className="gap-2">
                <Settings className="w-4 h-4" />
                Operacionais
              </TabsTrigger>
            </TabsList>

            <TabsContent value="institutional" className="space-y-4 mt-4">
              <p className="text-sm text-muted-foreground">
                Textos da página inicial, seções de funcionalidades, CTA e rodapé.
              </p>
              {renderItems(institutional)}
            </TabsContent>

            <TabsContent value="operational" className="space-y-4 mt-4">
              <p className="text-sm text-muted-foreground">
                Mensagens exibidas na área do aluno, boas-vindas e introduções dos módulos.
              </p>
              {renderItems(operational)}
            </TabsContent>
          </Tabs>
        )}
      </div>
    </DashboardLayout>
  );
};

export default AdminContent;
