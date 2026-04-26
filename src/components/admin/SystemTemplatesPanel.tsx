import { useEffect, useMemo, useRef, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { toast } from "@/hooks/use-toast";
import { Bot, Save, AlertTriangle, Sparkles, ImagePlus, X } from "lucide-react";
import { SYSTEM_TEMPLATE_DEFINITIONS, SystemTemplateKey } from "@/lib/system-templates";

const SystemTemplatesPanel = () => {
  const queryClient = useQueryClient();

  const { data: templates = [], isLoading } = useQuery({
    queryKey: ["system-templates"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("message_templates")
        .select("id, title, content, image_url, system_key, system_description, category_id")
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

  const [drafts, setDrafts] = useState<Record<string, { title: string; content: string; image_url: string }>>({});
  const fileRefs = useRef<Record<string, HTMLInputElement | null>>({});
  const [uploadingKey, setUploadingKey] = useState<string | null>(null);

  useEffect(() => {
    const next: Record<string, { title: string; content: string; image_url: string }> = {};
    SYSTEM_TEMPLATE_DEFINITIONS.forEach((def) => {
      const existing = templates.find((t: any) => t.system_key === def.key);
      next[def.key] = {
        title: existing?.title || def.label,
        content: existing?.content || def.defaultContent,
        image_url: existing?.image_url || "",
      };
    });
    setDrafts(next);
  }, [templates]);

  const saveMutation = useMutation({
    mutationFn: async ({ key, title, content, image_url }: { key: SystemTemplateKey; title: string; content: string; image_url: string }) => {
      const def = SYSTEM_TEMPLATE_DEFINITIONS.find((d) => d.key === key)!;
      const existing = templates.find((t: any) => t.system_key === key);

      if (existing) {
        const { error } = await supabase
          .from("message_templates")
          .update({ title, content, image_url: image_url || null, system_description: def.description })
          .eq("id", existing.id);
        if (error) throw error;
      } else {
        if (!systemCategoryId) throw new Error("Categoria 'sistema' não encontrada.");
        const { error } = await supabase.from("message_templates").insert({
          category_id: systemCategoryId,
          title,
          content,
          image_url: image_url || null,
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

  const handleUpload = async (key: string, file: File) => {
    setUploadingKey(key);
    try {
      const ext = file.name.split(".").pop();
      const path = `messages/system-${key}-${Date.now()}.${ext}`;
      const { error } = await supabase.storage.from("landing-assets").upload(path, file, { upsert: true });
      if (error) throw error;
      const { data: urlData } = supabase.storage.from("landing-assets").getPublicUrl(path);
      setDrafts((prev) => ({ ...prev, [key]: { ...prev[key], image_url: urlData.publicUrl } }));
      toast({ title: "Imagem enviada", description: "Lembre-se de clicar em Salvar." });
    } catch (e: any) {
      toast({ title: "Erro no upload", description: e.message, variant: "destructive" });
    } finally {
      setUploadingKey(null);
    }
  };

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
        const draft = drafts[def.key] || { title: def.label, content: def.defaultContent, image_url: "" };
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
              <div>
                <Label className="text-xs">Imagem (opcional)</Label>
                <p className="text-[10px] text-muted-foreground mb-1">
                  A URL da imagem será anexada ao final da mensagem do WhatsApp para pré-visualização automática.
                </p>
                {draft.image_url ? (
                  <div className="flex items-start gap-2">
                    <img src={draft.image_url} alt="" className="w-20 h-20 object-cover rounded border" />
                    <div className="flex-1 space-y-1">
                      <Input
                        value={draft.image_url}
                        onChange={(e) =>
                          setDrafts((prev) => ({ ...prev, [def.key]: { ...prev[def.key], image_url: e.target.value } }))
                        }
                        className="h-8 text-xs"
                      />
                      <Button
                        size="sm"
                        variant="ghost"
                        className="h-7 text-xs text-destructive"
                        onClick={() =>
                          setDrafts((prev) => ({ ...prev, [def.key]: { ...prev[def.key], image_url: "" } }))
                        }
                      >
                        <X className="w-3 h-3 mr-1" /> Remover
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      className="h-8 text-xs"
                      disabled={uploadingKey === def.key}
                      onClick={() => fileRefs.current[def.key]?.click()}
                    >
                      <ImagePlus className="w-3.5 h-3.5 mr-1" />
                      {uploadingKey === def.key ? "Enviando..." : "Anexar imagem"}
                    </Button>
                    <Input
                      placeholder="ou cole a URL"
                      value={draft.image_url}
                      onChange={(e) =>
                        setDrafts((prev) => ({ ...prev, [def.key]: { ...prev[def.key], image_url: e.target.value } }))
                      }
                      className="h-8 text-xs flex-1"
                    />
                  </div>
                )}
                <input
                  ref={(el) => (fileRefs.current[def.key] = el)}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => {
                    const f = e.target.files?.[0];
                    if (f) handleUpload(def.key, f);
                    e.target.value = "";
                  }}
                />
              </div>
              <div className="flex justify-end">
                <Button
                  size="sm"
                  className="h-8"
                  onClick={() => saveMutation.mutate({ key: def.key, title: draft.title, content: draft.content, image_url: draft.image_url })}
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
