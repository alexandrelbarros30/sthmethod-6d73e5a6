import { useEffect, useState, useCallback, useMemo } from "react";
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
  Plus, 
  Trash2, 
  Image as ImageIcon, 
  FileText, 
  Workflow, 
  ChevronLeft,
  Save,
  Upload,
  X,
  Maximize2,
  Minimize2
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import ReactFlow, { 
  Background, 
  Controls, 
  useNodesState, 
  useEdgesState, 
  addEdge,
  MarkerType,
  Node,
  Edge,
  Connection,
  Panel
} from "reactflow";
import "reactflow/dist/style.css";

type FlowStep = {
  id: string;
  key: string;
  label: string;
  message: string;
  media_url?: string | null;
  media_type?: string | null;
  order_index: number;
  actions: any;
  position_x?: number;
  position_y?: number;
};

// Custom Node Component to style the steps
const StepNode = ({ data, selected }: any) => {
  return (
    <div className={`px-4 py-2 shadow-md rounded-md bg-white border-2 transition-all ${selected ? "border-primary ring-2 ring-primary/20" : "border-muted"}`}>
      <div className="flex items-center gap-2">
        <div className="h-2 w-2 rounded-full bg-primary" />
        <div className="ml-1">
          <div className="text-xs font-bold text-muted-foreground uppercase">{data.key}</div>
          <div className="text-sm font-medium">{data.label}</div>
        </div>
        {data.hasMedia && (
          <div className="ml-auto">
            {data.mediaType === "pdf" ? <FileText className="w-3 h-3 text-red-400" /> : <ImageIcon className="w-3 h-3 text-blue-400" />}
          </div>
        )}
      </div>
    </div>
  );
};

const nodeTypes = {
  step: StepNode,
};

export default function AdminCrmFlow() {
  const isMobile = useIsMobile();
  const [loading, setLoading] = useState(true);
  const [steps, setSteps] = useState<FlowStep[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState<string | null>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);

  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);

  useEffect(() => {
    loadSteps();
  }, []);

  // Sync steps with React Flow nodes and edges
  useEffect(() => {
    if (steps.length === 0) return;

    const newNodes: Node[] = steps.map((step, idx) => ({
      id: step.id,
      type: "step",
      position: { 
        x: step.position_x ?? 100, 
        y: step.position_y ?? idx * 100 
      },
      data: { 
        label: step.label, 
        key: step.key,
        hasMedia: !!step.media_url,
        mediaType: step.media_type
      },
      selected: editingId === step.id
    }));

    const newEdges: Edge[] = [];
    steps.forEach(step => {
      if (Array.isArray(step.actions)) {
        step.actions.forEach((action: any) => {
          if (action.next_step_key) {
            const targetStep = steps.find(s => s.key === action.next_step_key);
            if (targetStep) {
              newEdges.push({
                id: `e-${step.id}-${targetStep.id}-${action.label}`,
                source: step.id,
                target: targetStep.id,
                label: action.label,
                animated: true,
                markerEnd: { type: MarkerType.ArrowClosed, color: "#94a3b8" },
                style: { stroke: "#94a3b8" },
                labelStyle: { fill: "#64748b", fontWeight: 700, fontSize: 10 },
                labelBgStyle: { fill: "#f8fafc", fillOpacity: 0.8 },
                labelBgPadding: [4, 2],
                labelBgBorderRadius: 4,
              });
            }
          }
        });
      }
    });

    setNodes(newNodes);
    setEdges(newEdges);
  }, [steps, editingId, setNodes, setEdges]);

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

  const onConnect = useCallback(
    (params: Connection) => {
      if (!params.source || !params.target) return;
      
      const sourceStep = steps.find(s => s.id === params.source);
      const targetStep = steps.find(s => s.id === params.target);
      
      if (sourceStep && targetStep) {
        const newActions = Array.isArray(sourceStep.actions) ? [...sourceStep.actions] : [];
        newActions.push({ label: "Nova Opção", next_step_key: targetStep.key });
        
        const updatedStep = { ...sourceStep, actions: newActions };
        setSteps(steps.map(s => s.id === sourceStep.id ? updatedStep : s));
        setEditingId(sourceStep.id);
        saveStep(updatedStep);
      }
    },
    [steps]
  );

  const onNodeClick = (_: any, node: Node) => {
    setEditingId(node.id);
  };

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
      toast({ title: "Passo salvo" });
      // Don't reload everything to avoid layout jump
      setSteps(prev => prev.map(s => s.id === step.id ? step : s));
    }
    setSaving(false);
  }

  // Save all positions
  async function savePositions() {
    setSaving(true);
    try {
      const updates = nodes.map(node => {
        const step = steps.find(s => s.id === node.id);
        if (!step) return null;
        return {
          ...step,
          position_x: Math.round(node.position.x),
          position_y: Math.round(node.position.y),
          updated_at: new Date().toISOString()
        };
      }).filter(Boolean) as FlowStep[];

      const { error } = await supabase.from("crm_flow_steps").upsert(updates);
      if (error) throw error;
      
      toast({ title: "Posições salvas" });
      setSteps(prev => prev.map(s => {
        const up = updates.find(u => u.id === s.id);
        return up || s;
      }));
    } catch (e: any) {
      toast({ title: "Erro ao salvar posições", description: e.message, variant: "destructive" });
    } finally {
      setSaving(false);
    }
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
      setSteps(prev => prev.filter(s => s.id !== id));
      setEditingId(null);
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
        const updated = {
          ...step,
          media_url: data.publicUrl,
          media_type: isImage ? "image" : "pdf"
        };
        await saveStep(updated);
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
      const updated = {
        ...step,
        media_url: null,
        media_type: null
      };
      await saveStep(updated);
    }
  }

  const activeEditingStep = useMemo(() => steps.find(s => s.id === editingId), [steps, editingId]);

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
      {!isFullscreen && <DashboardSidebar role="admin" />}
      <div className={`${!isFullscreen ? (isMobile ? "pt-16" : "ml-60") : ""} p-6 transition-all duration-300`}>
        <div className="max-w-7xl mx-auto space-y-6">
          {!isFullscreen && (
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Button variant="ghost" size="icon" onClick={() => window.location.href = "/admin/crm/configuracoes"}>
                  <ChevronLeft className="w-5 h-5" />
                </Button>
                <div>
                  <h1 className="text-2xl font-semibold tracking-tight flex items-center gap-2">
                    <Workflow className="w-6 h-6 text-primary" />
                    Organismo Fluxogrma
                  </h1>
                  <p className="text-sm text-muted-foreground mt-1">Desenhe visualmente seu fluxo de atendimento automatizado.</p>
                </div>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" onClick={savePositions} disabled={saving}>
                  {saving && <Loader2 className="w-4 h-4 animate-spin mr-2" />}
                  <Save className="w-4 h-4 mr-2" />
                  Salvar Posições
                </Button>
                <Button onClick={() => {
                  const newStep: FlowStep = {
                    id: crypto.randomUUID(),
                    key: `step_${steps.length + 1}`,
                    label: "Novo Passo",
                    message: "",
                    order_index: steps.length + 1,
                    actions: [],
                    position_x: 250,
                    position_y: 100
                  };
                  setSteps([...steps, newStep]);
                  setEditingId(newStep.id);
                  saveStep(newStep);
                }}>
                  <Plus className="w-4 h-4 mr-2" />
                  Novo Passo
                </Button>
              </div>
            </div>
          )}

          <div className={`grid grid-cols-1 lg:grid-cols-4 gap-6 ${isFullscreen ? "fixed inset-0 z-50 bg-background p-6" : "h-[700px]"}`}>
            {/* Fluxograma Visual */}
            <div className={`lg:col-span-3 border rounded-xl overflow-hidden bg-slate-50 relative group ${isFullscreen ? "h-full" : "h-[700px]"}`}>
              <ReactFlow
                nodes={nodes}
                edges={edges}
                onNodesChange={onNodesChange}
                onEdgesChange={onEdgesChange}
                onConnect={onConnect}
                onNodeClick={onNodeClick}
                nodeTypes={nodeTypes}
                fitView
              >
                <Background color="#cbd5e1" gap={20} />
                <Controls />
                <Panel position="top-right" className="flex gap-2">
                  <Button 
                    variant="secondary" 
                    size="icon" 
                    className="bg-white shadow-sm"
                    onClick={() => setIsFullscreen(!isFullscreen)}
                  >
                    {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
                  </Button>
                </Panel>
              </ReactFlow>
            </div>

            {/* Editor Lateral */}
            <div className={`lg:col-span-1 space-y-4 overflow-y-auto ${isFullscreen ? "h-full pr-2" : "h-[700px]"}`}>
              {activeEditingStep ? (
                <Card className="p-5 space-y-6">
                  <div className="flex items-center justify-between">
                    <h3 className="font-semibold text-sm uppercase tracking-wider text-muted-foreground">Editor de Passo</h3>
                    <div className="flex gap-1">
                      <Button variant="ghost" size="icon" onClick={() => deleteStep(activeEditingStep.id)} className="h-8 w-8 text-rose-500">
                        <Trash2 className="w-4 h-4" />
                      </Button>
                      <Button variant="ghost" size="icon" onClick={() => setEditingId(null)} className="h-8 w-8 text-muted-foreground">
                        <X className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label className="text-xs">Rótulo Visual</Label>
                      <Input 
                        value={activeEditingStep.label} 
                        onChange={(e) => setSteps(steps.map(s => s.id === editingId ? { ...s, label: e.target.value } : s))}
                        onBlur={() => saveStep(activeEditingStep)}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label className="text-xs">ID Técnico (Key)</Label>
                      <Input 
                        value={activeEditingStep.key} 
                        onChange={(e) => {
                          const val = e.target.value.toLowerCase().replace(/\s+/g, "_");
                          setSteps(steps.map(s => s.id === editingId ? { ...s, key: val } : s));
                        }}
                        onBlur={() => saveStep(activeEditingStep)}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label className="text-xs">Mensagem WhatsApp</Label>
                      <Textarea 
                        rows={6}
                        value={activeEditingStep.message} 
                        onChange={(e) => setSteps(steps.map(s => s.id === editingId ? { ...s, message: e.target.value } : s))}
                        onBlur={() => saveStep(activeEditingStep)}
                        placeholder="Mensagem que o aluno receberá..."
                        className="text-sm"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label className="text-xs">Mídia / PDF</Label>
                      {activeEditingStep.media_url ? (
                        <div className="flex items-center gap-2 p-2 border rounded-md bg-muted/20">
                          {activeEditingStep.media_type === "pdf" ? <FileText className="w-4 h-4 text-red-500" /> : <ImageIcon className="w-4 h-4 text-blue-500" />}
                          <span className="text-[10px] truncate flex-1">Arquivo anexado</span>
                          <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => removeMedia(activeEditingStep.id)}>
                            <X className="w-3 h-3" />
                          </Button>
                        </div>
                      ) : (
                        <div className="relative">
                          <Input 
                            type="file" 
                            accept="image/*,application/pdf"
                            onChange={(e) => e.target.files?.[0] && uploadMedia(activeEditingStep.id, e.target.files[0])}
                            className="hidden"
                            id="media-upload-edit"
                          />
                          <Label 
                            htmlFor="media-upload-edit" 
                            className="flex items-center justify-center gap-2 p-3 border border-dashed rounded-md cursor-pointer hover:bg-muted/50 transition-colors text-xs"
                          >
                            {uploading === activeEditingStep.id ? <Loader2 className="w-3 h-3 animate-spin" /> : <Upload className="w-3 h-3" />}
                            Anexar Foto ou PDF
                          </Label>
                        </div>
                      )}
                    </div>

                    <Separator />

                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <Label className="text-xs font-bold uppercase">Opções de Resposta</Label>
                        <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => {
                          const actions = Array.isArray(activeEditingStep.actions) ? [...activeEditingStep.actions] : [];
                          actions.push({ label: "", next_step_key: "" });
                          const updated = { ...activeEditingStep, actions };
                          setSteps(steps.map(s => s.id === editingId ? updated : s));
                          saveStep(updated);
                        }}>
                          <Plus className="w-3 h-3" />
                        </Button>
                      </div>
                      
                      <div className="space-y-2">
                        {Array.isArray(activeEditingStep.actions) && activeEditingStep.actions.map((action: any, idx: number) => (
                          <div key={idx} className="space-y-1 p-2 bg-muted/10 rounded-lg border border-border/50">
                            <div className="flex gap-1 items-center">
                              <Input 
                                placeholder="Texto da opção" 
                                value={action.label} 
                                className="h-8 text-xs flex-1"
                                onChange={(e) => {
                                  const newActions = [...activeEditingStep.actions];
                                  newActions[idx].label = e.target.value;
                                  setSteps(steps.map(s => s.id === editingId ? { ...s, actions: newActions } : s));
                                }}
                                onBlur={() => saveStep(activeEditingStep)}
                              />
                              <Button variant="ghost" size="icon" className="h-6 w-6 text-muted-foreground" onClick={() => {
                                const newActions = activeEditingStep.actions.filter((_: any, i: number) => i !== idx);
                                const updated = { ...activeEditingStep, actions: newActions };
                                setSteps(steps.map(s => s.id === editingId ? updated : s));
                                saveStep(updated);
                              }}>
                                <Trash2 className="w-3 h-3" />
                              </Button>
                            </div>
                            <select 
                              className="h-7 w-full rounded-md border border-input bg-background px-2 text-[10px] focus:outline-none"
                              value={action.next_step_key}
                              onChange={(e) => {
                                const newActions = [...activeEditingStep.actions];
                                newActions[idx].next_step_key = e.target.value;
                                const updated = { ...activeEditingStep, actions: newActions };
                                setSteps(steps.map(s => s.id === editingId ? updated : s));
                                saveStep(updated);
                              }}
                            >
                              <option value="">Próximo Passo...</option>
                              {steps.filter(s => s.id !== editingId).map(s => (
                                <option key={s.id} value={s.key}>{s.label}</option>
                              ))}
                            </select>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </Card>
              ) : (
                <div className="h-full flex flex-col items-center justify-center p-8 border-2 border-dashed rounded-xl text-muted-foreground space-y-4 text-center">
                  <Workflow className="w-10 h-10 opacity-20" />
                  <div className="space-y-1">
                    <p className="font-medium text-sm">Selecione um passo</p>
                    <p className="text-xs max-w-[200px]">Clique em um bloco do mapa para editar suas mensagens e anexos.</p>
                  </div>
                  <div className="pt-4 space-y-2 w-full">
                    <div className="text-[10px] text-left font-bold uppercase text-muted-foreground/50">Dica Pro:</div>
                    <p className="text-[10px] text-left leading-relaxed">Conecte os blocos arrastando os círculos nas bordas para criar caminhos automáticos!</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
