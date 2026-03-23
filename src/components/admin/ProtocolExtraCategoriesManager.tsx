import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Plus, Trash2, Pencil, Check, X, Save, Sparkles, FileText } from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import RichTextEditor from "@/components/shared/RichTextEditor";

interface Props {
  userId: string;
}

const ProtocolExtraCategoriesManager = ({ userId }: Props) => {
  const qc = useQueryClient();
  const [addingNew, setAddingNew] = useState(false);
  const [newName, setNewName] = useState("");
  const [editingNameId, setEditingNameId] = useState<string | null>(null);
  const [editingNameValue, setEditingNameValue] = useState("");
  const [contentEdits, setContentEdits] = useState<Record<string, string>>({});
  const [savedIds, setSavedIds] = useState<Record<string, boolean>>({});

  const { data: categories = [] } = useQuery({
    queryKey: ["protocol-extra-categories", userId],
    queryFn: async () => {
      const { data } = await supabase
        .from("protocol_extra_categories" as any)
        .select("*")
        .eq("user_id", userId)
        .order("sort_order");
      return (data || []) as any[];
    },
  });

  const createMutation = useMutation({
    mutationFn: async () => {
      if (!newName.trim()) throw new Error("Nome obrigatório");
      await supabase.from("protocol_extra_categories" as any).insert({
        user_id: userId,
        name: newName.trim(),
        sort_order: categories.length,
      } as any);
    },
    onSuccess: () => {
      toast.success("Categoria extra criada!");
      qc.invalidateQueries({ queryKey: ["protocol-extra-categories", userId] });
      setAddingNew(false);
      setNewName("");
    },
    onError: (e: any) => toast.error(e.message || "Erro ao criar"),
  });

  const updateNameMutation = useMutation({
    mutationFn: async ({ id, name }: { id: string; name: string }) => {
      await supabase.from("protocol_extra_categories" as any).update({ name } as any).eq("id", id);
    },
    onSuccess: () => {
      toast.success("Nome atualizado!");
      qc.invalidateQueries({ queryKey: ["protocol-extra-categories", userId] });
      setEditingNameId(null);
    },
  });

  const saveContentMutation = useMutation({
    mutationFn: async ({ id, content }: { id: string; content: string }) => {
      await supabase.from("protocol_extra_categories" as any).update({ content, updated_at: new Date().toISOString() } as any).eq("id", id);
    },
    onSuccess: (_, vars) => {
      toast.success("Conteúdo salvo!");
      qc.invalidateQueries({ queryKey: ["protocol-extra-categories", userId] });
      setSavedIds((prev) => ({ ...prev, [vars.id]: true }));
      setTimeout(() => setSavedIds((prev) => ({ ...prev, [vars.id]: false })), 2000);
    },
    onError: () => toast.error("Erro ao salvar conteúdo"),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      await supabase.from("protocol_extra_categories" as any).delete().eq("id", id);
    },
    onSuccess: () => {
      toast.success("Categoria removida!");
      qc.invalidateQueries({ queryKey: ["protocol-extra-categories", userId] });
    },
  });

  const getContent = (cat: any) => {
    if (contentEdits[cat.id] !== undefined) return contentEdits[cat.id];
    return cat.content || "";
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-muted-foreground font-display flex items-center gap-2">
          <Sparkles className="w-4 h-4" /> Categorias Extras
        </h3>
        {!addingNew && (
          <Button variant="outline" size="sm" onClick={() => setAddingNew(true)} className="h-7 text-xs">
            <Plus className="w-3 h-3 mr-1" /> Nova Categoria
          </Button>
        )}
      </div>

      {addingNew && (
        <Card className="border-primary/30 bg-primary/5">
          <CardContent className="pt-4 space-y-3">
            <div>
              <Label className="text-xs font-body">Nome da categoria *</Label>
              <Input
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                placeholder="Ex: Anti DHT, Suporte Antioxidante..."
                autoFocus
              />
            </div>
            <div className="flex gap-2 justify-end">
              <Button variant="ghost" size="sm" onClick={() => { setAddingNew(false); setNewName(""); }}>
                <X className="w-3 h-3 mr-1" /> Cancelar
              </Button>
              <Button size="sm" onClick={() => createMutation.mutate()} disabled={createMutation.isPending}>
                <Check className="w-3 h-3 mr-1" /> Criar
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {categories.length > 0 && (
        <Accordion type="multiple" className="space-y-2">
          {categories.map((cat: any) => {
            const catContent = getContent(cat);
            const hasContent = catContent.replace(/<[^>]*>/g, "").trim().length > 0;
            const isSaved = savedIds[cat.id];

            return (
              <AccordionItem key={cat.id} value={cat.id} className="border rounded-xl overflow-hidden bg-card">
                <AccordionTrigger className="px-4 py-3 hover:no-underline">
                  <div className="flex items-center gap-2 text-left">
                    <Sparkles className="w-4 h-4 text-amber-500" />
                    {editingNameId === cat.id ? (
                      <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
                        <Input
                          value={editingNameValue}
                          onChange={(e) => setEditingNameValue(e.target.value)}
                          className="h-7 text-xs w-40"
                          autoFocus
                          onKeyDown={(e) => {
                            if (e.key === "Enter") updateNameMutation.mutate({ id: cat.id, name: editingNameValue });
                            if (e.key === "Escape") setEditingNameId(null);
                          }}
                        />
                        <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => updateNameMutation.mutate({ id: cat.id, name: editingNameValue })}>
                          <Check className="w-3 h-3" />
                        </Button>
                      </div>
                    ) : (
                      <span className="text-xs font-semibold font-display text-foreground">{cat.name}</span>
                    )}
                    {hasContent && (
                      <Badge variant="secondary" className="text-[10px]">
                        <FileText className="w-2.5 h-2.5 mr-0.5" /> Texto
                      </Badge>
                    )}
                  </div>
                </AccordionTrigger>
                <AccordionContent className="px-4 pb-4 space-y-3">
                  {/* Actions */}
                  <div className="flex gap-1.5">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-7 text-xs"
                      onClick={() => { setEditingNameId(cat.id); setEditingNameValue(cat.name); }}
                    >
                      <Pencil className="w-3 h-3 mr-1" /> Renomear
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-7 text-xs text-destructive"
                      onClick={() => deleteMutation.mutate(cat.id)}
                    >
                      <Trash2 className="w-3 h-3 mr-1" /> Excluir
                    </Button>
                  </div>

                  {/* Text editor */}
                  <div className="space-y-2">
                    <Label className="text-xs font-body flex items-center gap-1.5">
                      <FileText className="w-3 h-3" /> Conteúdo da categoria
                    </Label>
                    <RichTextEditor
                      value={catContent}
                      onChange={(html) => setContentEdits((prev) => ({ ...prev, [cat.id]: html }))}
                      placeholder={`Escreva orientações para ${cat.name}...`}
                      className="min-h-0 [&_.ProseMirror]:!min-h-[100px]"
                    />
                    <div className="flex justify-end">
                      <Button
                        size="sm"
                        variant={isSaved ? "default" : "outline"}
                        className={cn("h-7 text-xs", isSaved && "bg-green-600 hover:bg-green-700")}
                        onClick={() => saveContentMutation.mutate({ id: cat.id, content: getContent(cat) })}
                        disabled={saveContentMutation.isPending}
                      >
                        {isSaved ? <Check className="w-3 h-3 mr-1" /> : <Save className="w-3 h-3 mr-1" />}
                        {isSaved ? "Salvo" : "Salvar"}
                      </Button>
                    </div>
                  </div>
                </AccordionContent>
              </AccordionItem>
            );
          })}
        </Accordion>
      )}

      {categories.length === 0 && !addingNew && (
        <p className="text-xs text-muted-foreground text-center py-3 font-body">
          Nenhuma categoria extra criada. Use para anti DHT, suporte seminal, antioxidantes, etc.
        </p>
      )}
    </div>
  );
};

export default ProtocolExtraCategoriesManager;
