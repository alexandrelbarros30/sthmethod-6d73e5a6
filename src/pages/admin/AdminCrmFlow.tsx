import { useEffect, useState } from "react";
import DashboardSidebar from "@/components/DashboardSidebar";
import { useIsMobile } from "@/hooks/use-mobile";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "@/hooks/use-toast";
import { 
  Loader2, 
  ArrowRight, 
  Plus, 
  Trash2, 
  Image as ImageIcon, 
  FileText, 
  Workflow, 
  ChevronLeft,
  Save,
  Upload,
  X
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";

type FlowStep = {
  id: string;
  key: string;
  label: string;
  message: string;
  media_url?: string | null;
  media_type?: string | null;
  order_index: number;
  actions: any;
};

export default function AdminCrmFlow() {
  const isMobile = useIsMobile();
  const [loading, setLoading] = useState(true);
  const [steps, setSteps] = useState<FlowStep[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState<string | null>(null);

  useEffect(() => {
    loadSteps();
  }, []);

  async function loadSteps() {
    setLoading(true);
    const { data, error } = await supabase
      .from("crm_flow_steps")
      .select("*")
      .order("order_index");
    
    if (error) {
      toast({ title: "Erro ao carregar fluxo", description: error.message, variant: "destructive" });
    } else {
      setSteps(data || []);
    }
    setLoading(false);
  }

  async function saveStep(step: FlowStep) {
    setSaving(true);
    const { error } = await supabase
      .from("crm_flow_steps")
      .upsert({
        ...step,
        updated_at: new Date().toISOString()
      });

    if (error) {
      toast({ title: "Erro ao salvar", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Passo salvo com sucesso" });
      loadSteps();
    }
    setSaving(false);
  }

  async function deleteStep(id: string) {
    if (!confirm("Tem certeza que deseja excluir este passo?")) return;
    
    const { error } = await supabase
      .from("crm_flow_steps")
      .delete()
      .eq("id", id);

    if (error) {
      toast({ title: "Erro ao excluir", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Passo excluído" });
      loadSteps();
    }
  }

  async function uploadMedia(stepId: string, file: File) {
    const isImage = file.type.startsWith("image/");
    const isPdf = file.type === "application/pdf";

    if (!isImage && !isPdf) {
      toast({ title: "Arquivo inválido", description: "Envie uma imagem ou PDF", variant: "destructive" });
      return;
    }

    setUploading(stepId);
    try {
      const ext = file.name.split(".").pop();
      const path = `flow-media/${stepId}-${Date.now()}.${ext}`;
      const { error: upErr } = await supabase.storage.from("crm-media").upload(path, file);
      
      if (upErr) throw upErr;

      const { data } = supabase.storage.from("crm-media").getPublicUrl(path);
      
      const step = steps.find(s => s.id === stepId);
      if (step) {
        await saveStep({
          ...step,
          media_url: data.publicUrl,
          media_type: isImage ? "image" : "pdf"
        });
      }
    } catch (e: any) {
      toast({ title: "Erro no upload", description: e.message, variant: "destructive" });
    } finally {
      setUploading(null);
    }
  }

  async function removeMedia(stepId: string) {
    const step = steps.find(s => s.id === stepId);
    if (step) {
      await saveStep({
        ...step,
        media_url: null,
        media_type: null
      });
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <DashboardSidebar role="admin" />
        <div className={`${isMobile ? "pt-16" : "ml-60"} p-6 flex items-center justify-center`}>
          <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <DashboardSidebar role="admin" />
      <div className={`${isMobile ? "pt-16" : "ml-60"} p-6 max-w-6xl mx-auto space-y-6`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" onClick={() => window.location.href = "/admin/crm/configuracoes"}>
              <ChevronLeft className="w-5 h-5" />
            </Button>
            <div>
              <h1 className="text-2xl font-semibold tracking-tight flex items-center gap-2">
                <Workflow className="w-6 h-6 text-primary" />
                Fluxo de Atendimento
              </h1>
              <p className="text-sm text-muted-foreground mt-1">Configure a sequência de mensagens e triagem automática.</p>
            </div>
          </div>
          <Button onClick={() => {
            const newStep: FlowStep = {
              id: crypto.randomUUID(),
              key: `new_step_${Date.now()}`,
              label: "Novo Passo",
              message: "",
              order_index: steps.length + 1,
              actions: []
            };
            setSteps([...steps, newStep]);
            setEditingId(newStep.id);
          }}>
            <Plus className="w-4 h-4 mr-2" />
            Novo Passo
          </Button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Fluxograma Visual */}
          <div className="lg:col-span-1 space-y-4">
            <h3 className="text-sm font-medium uppercase tracking-wider text-muted-foreground px-1">Fluxograma</h3>
            <div className="space-y-3 relative">
              {steps.map((step, idx) => (
                <div key={step.id} className="relative">
                  <Card 
                    className={`p-4 cursor-pointer transition-all border-2 ${editingId === step.id ? "border-primary shadow-md" : "border-transparent hover:border-muted"}`}
                    onClick={() => setEditingId(step.id)}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2 min-w-0">
                        <Badge variant="outline" className="h-5 w-5 flex items-center justify-center p-0 text-[10px]">
                          {idx + 1}
                        </Badge>
                        <span className="font-medium text-sm truncate">{step.label}</span>
                      </div>
                      {step.media_url && (
                        step.media_type === "pdf" ? <FileText className="w-3 h-3 text-red-400 shrink-0" /> : <ImageIcon className="w-3 h-3 text-blue-400 shrink-0" />
                      )}
                    </div>
                  </Card>
                  {idx < steps.length - 1 && (
                    <div className="flex justify-center my-1">
                      <ArrowRight className="w-4 h-4 text-muted-foreground rotate-90" />
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Editor de Passo */}
          <div className="lg:col-span-2">
            {editingId ? (
              <Card className="p-6 space-y-6 sticky top-6">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold">Editar Passo</h3>
                  <div className="flex gap-2">
                    <Button variant="ghost" size="icon" onClick={() => deleteStep(editingId)} className="text-rose-500">
                      <Trash2 className="w-4 h-4" />
                    </Button>
                    <Button variant="ghost" size="icon" onClick={() => setEditingId(null)}>
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Identificador (Key)</Label>
                    <Input 
                      value={steps.find(s => s.id === editingId)?.key || ""} 
                      onChange={(e) => {
                        const val = e.target.value.toLowerCase().replace(/\s+/g, "_");
                        setSteps(steps.map(s => s.id === editingId ? { ...s, key: val } : s));
                      }}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Rótulo (Label)</Label>
                    <Input 
                      value={steps.find(s => s.id === editingId)?.label || ""} 
                      onChange={(e) => setSteps(steps.map(s => s.id === editingId ? { ...s, label: e.target.value } : s))}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Mensagem (WhatsApp)</Label>
                  <Textarea 
                    rows={8}
                    value={steps.find(s => s.id === editingId)?.message || ""} 
                    onChange={(e) => setSteps(steps.map(s => s.id === editingId ? { ...s, message: e.target.value } : s))}
                    placeholder="Use {nome}, {plano}, etc. Suporta Markdown do WhatsApp (*bold*, _italic_)."
                  />
                </div>

                <div className="space-y-3">
                  <Label>Mídia Anexada (Imagem ou PDF)</Label>
                  <div className="flex items-center gap-4">
                    {steps.find(s => s.id === editingId)?.media_url ? (
                      <div className="flex items-center gap-3 p-2 border rounded-lg bg-muted/30 flex-1">
                        {steps.find(s => s.id === editingId)?.media_type === "pdf" ? (
                          <FileText className="w-8 h-8 text-red-500" />
                        ) : (
                          <div className="w-12 h-12 rounded bg-cover bg-center" style={{ backgroundImage: `url(${steps.find(s => s.id === editingId)?.media_url})` }} />
                        )}
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-medium truncate">Arquivo anexado</p>
                          <a href={steps.find(s => s.id === editingId)?.media_url!} target="_blank" className="text-[10px] text-primary hover:underline">Ver original</a>
                        </div>
                        <Button variant="ghost" size="icon" onClick={() => removeMedia(editingId)} className="text-muted-foreground">
                          <X className="w-4 h-4" />
                        </Button>
                      </div>
                    ) : (
                      <div className="flex-1">
                        <Input 
                          type="file" 
                          accept="image/*,application/pdf"
                          onChange={(e) => e.target.files?.[0] && uploadMedia(editingId, e.target.files[0])}
                          className="hidden"
                          id="media-upload"
                        />
                        <Label 
                          htmlFor="media-upload" 
                          className="flex flex-col items-center justify-center p-6 border-2 border-dashed rounded-lg cursor-pointer hover:bg-muted/50 transition-colors"
                        >
                          {uploading === editingId ? (
                            <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
                          ) : (
                            <>
                              <Upload className="w-6 h-6 text-muted-foreground mb-2" />
                              <span className="text-sm font-medium">Clique para enviar Imagem ou PDF</span>
                              <span className="text-xs text-muted-foreground mt-1">Máximo 5MB</span>
                            </>
                          )}
                        </Label>
                      </div>
                    )}
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <Label>Respostas / Ações (Opções de menu)</Label>
                    <Button variant="outline" size="sm" onClick={() => {
                      const step = steps.find(s => s.id === editingId);
                      if (step) {
                        const actions = Array.isArray(step.actions) ? step.actions : [];
                        setSteps(steps.map(s => s.id === editingId ? { ...s, actions: [...actions, { label: "", next_step_key: "" }] } : s));
                      }
                    }}>
                      <Plus className="w-3 h-3 mr-1" /> Add Opção
                    </Button>
                  </div>
                  <div className="space-y-2">
                    {Array.isArray(steps.find(s => s.id === editingId)?.actions) && steps.find(s => s.id === editingId)?.actions.map((action: any, idx: number) => (
                      <div key={idx} className="flex gap-2 items-center">
                        <Input 
                          placeholder="Ex: 1 ou 'Sim'" 
                          value={action.label} 
                          className="flex-1"
                          onChange={(e) => {
                            const newActions = [...steps.find(s => s.id === editingId)!.actions];
                            newActions[idx].label = e.target.value;
                            setSteps(steps.map(s => s.id === editingId ? { ...s, actions: newActions } : s));
                          }}
                        />
                        <ArrowRight className="w-4 h-4 text-muted-foreground" />
                        <select 
                          className="flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 flex-1"
                          value={action.next_step_key}
                          onChange={(e) => {
                            const newActions = [...steps.find(s => s.id === editingId)!.actions];
                            newActions[idx].next_step_key = e.target.value;
                            setSteps(steps.map(s => s.id === editingId ? { ...s, actions: newActions } : s));
                          }}
                        >
                          <option value="">Selecione o próximo passo...</option>
                          {steps.filter(s => s.id !== editingId).map(s => (
                            <option key={s.id} value={s.key}>{s.label}</option>
                          ))}
                        </select>
                        <Button variant="ghost" size="icon" onClick={() => {
                          const newActions = steps.find(s => s.id === editingId)!.actions.filter((_: any, i: number) => i !== idx);
                          setSteps(steps.map(s => s.id === editingId ? { ...s, actions: newActions } : s));
                        }}>
                          <X className="w-4 h-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>

                <Separator />

                <div className="flex justify-end gap-3">
                  <Button variant="outline" onClick={() => setEditingId(null)}>Cancelar</Button>
                  <Button onClick={() => {
                    const step = steps.find(s => s.id === editingId);
                    if (step) saveStep(step);
                  }} disabled={saving}>
                    {saving && <Loader2 className="w-4 h-4 animate-spin mr-2" />}
                    <Save className="w-4 h-4 mr-2" />
                    Salvar Passo
                  </Button>
                </div>
              </Card>
            ) : (
              <div className="h-full flex flex-col items-center justify-center p-12 border-2 border-dashed rounded-xl text-muted-foreground space-y-4">
                <Workflow className="w-12 h-12 opacity-20" />
                <p className="text-center max-w-xs">Selecione um passo do fluxograma ao lado para editar suas configurações e mídias.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
