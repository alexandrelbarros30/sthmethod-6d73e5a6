import { useEffect, useMemo, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { toast } from "@/hooks/use-toast";
import { Bot, Save, AlertTriangle, Sparkles } from "lucide-react";
import { SYSTEM_TEMPLATE_DEFINITIONS, SystemTemplateKey } from "@/lib/system-templates";

const SystemTemplatesPanel = () => {
  const queryClient = useQueryClient();

  const { data: templates = [], isLoading } = useQuery({
    queryKey: ["system-templates"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("message_templates")
        .select("id, title, content, system_key, system_description, category_id")
        .not("system_key", "is", null);
      if (error) throw error;
      return data || [];
    },
  });

  const { data: systemCategoryId } = useQuery({
    queryKey: ["system-category-id"],
    queryFn: async () => {
      const { data } = await supabase.from("message_categories").select("id").eq("slug", "sistema").maybeSingle();
      return data?.id as string | undefined;
    },
  });

  const [drafts, setDrafts] = useState<Record<string, { title: string; content: string }>>({});

  useEffect(() => {
    const next: Record<string, { title: string; content: string }> = {};
    SYSTEM_TEMPLATE_DEFINITIONS.forEach((def) => {
      const existing = templates.find((t: any) => t.system_key === def.key);
      next[def.key] = {
        title: existing?.title || def.label,
        content: existing?.content || def.defaultContent,
      };
    });
    setDrafts(next);
  }, [templates]);

  const saveMutation = useMutation({
    mutationFn: async ({ key, title, content }: { key: SystemTemplateKey; title: string; content: string }) => {
      const def = SYSTEM_TEMPLATE_DEFINITIONS.find((d) => d.key === key)!;
      const existing = templates.find((t: any) => t.system_key === key);

      if (existing) {
        const { error } = await supabase
          .from("message_templates")
          .update({ title, content, system_description: def.description })
          .eq("id", existing.id);
        if (error) throw error;
      } else {
        if (!systemCategoryId) throw new Error("Categoria 'sistema' não encontrada.");
        const { error } = await supabase.from("message_templates").insert({
          category_id: systemCategoryId,
          title,
          content,
          system_key: key,
          system_description: def.description,
          is_reusable: true,
        });
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["system-templates"] });
      toast({ title: "Template salvo", description: "As mensagens automáticas usarão a nova versão." });
    },
    onError: (e: any) => toast({ title: "Erro", description: e.message, variant: "destructive" }),
  });

  const variables = useMemo(
    () => ["{nome}", "{nome_completo}", "{email}", "{telefone}", "{plano}", "{vencimento}", "{dias_restantes}", "{link}", "{valor}"],
    []
  );

  return (
    <div className="space-y-3">
      <Card className="border-primary/20 bg-primary/5">
        <CardContent className="p-3 sm:p-4 flex items-start gap-2">
          <Sparkles className="w-4 h-4 text-primary shrink-0 mt-0.5" />
          <div className="text-xs sm:text-sm">
            <p className="font-medium">Templates Automáticos do Sistema</p>
            <p className="text-muted-foreground mt-0.5">
              Estas mensagens são enviadas pelos popups, lembretes e fila de atendimento. Edite o texto e clique em Salvar.
              Variáveis disponíveis:{" "}
              <span className="font-mono text-[10px]">{variables.join(" ")}</span>
            </p>
          </div>
        </CardContent>
      </Card>

      {isLoading && <p className="text-sm text-muted-foreground">Carregando…</p>}

      {SYSTEM_TEMPLATE_DEFINITIONS.map((def) => {
        const draft = drafts[def.key] || { title: def.label, content: def.defaultContent };
        const exists = templates.some((t: any) => t.system_key === def.key);
        return (
          <Card key={def.key} className="overflow-hidden">
            <CardHeader className="pb-2 px-3 sm:px-4">
              <CardTitle className="text-sm sm:text-base flex items-center gap-2 flex-wrap">
                <Bot className="w-4 h-4 text-primary shrink-0" />
                <span>{def.label}</span>
                <Badge variant="outline" className="text-[10px] font-mono">{def.key}</Badge>
                {!exists && (
                  <Badge variant="secondary" className="text-[10px] gap-1">
                    <AlertTriangle className="w-3 h-3" /> Será criado ao salvar
                  </Badge>
                )}
              </CardTitle>
              <p className="text-[11px] sm:text-xs text-muted-foreground mt-1">{def.description}</p>
            </CardHeader>
            <CardContent className="px-3 sm:px-4 pb-3 space-y-2">
              <div>
                <Label className="text-xs">Título interno</Label>
                <Input
                  value={draft.title}
                  onChange={(e) =>
                    setDrafts((prev) => ({ ...prev, [def.key]: { ...prev[def.key], title: e.target.value } }))
                  }
                  className="h-8 text-sm"
                />
              </div>
              <div>
                <Label className="text-xs">Mensagem enviada</Label>
                <Textarea
                  value={draft.content}
                  rows={6}
                  onChange={(e) =>
                    setDrafts((prev) => ({ ...prev, [def.key]: { ...prev[def.key], content: e.target.value } }))
                  }
                  className="text-sm font-mono"
                />
              </div>
              <div className="flex justify-end">
                <Button
                  size="sm"
                  className="h-8"
                  onClick={() => saveMutation.mutate({ key: def.key, title: draft.title, content: draft.content })}
                  disabled={saveMutation.isPending}
                >
                  <Save className="w-3.5 h-3.5 mr-1" /> Salvar
                </Button>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
};

export default SystemTemplatesPanel;
