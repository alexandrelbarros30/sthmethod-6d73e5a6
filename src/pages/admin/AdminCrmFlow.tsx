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
  Minimize2,
  Settings,
  Link as LinkIcon
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
  Panel,
  Handle,
  Position,
  NodeChange,
  applyNodeChanges,
  useReactFlow
} from "reactflow";
import "reactflow/dist/style.css";

type FlowStep = {
  id: string;
  key: string;
  label: string;
  message: string;
  display_format: 'text' | 'buttons' | 'list';
  media_url?: string | null;
  media_type?: string | null;
  order_index: number;
  actions: any[];
  position_x?: number;
  position_y?: number;
};

// Custom Node Component
const StepNode = ({ data, selected }: any) => {
  return (
    <div className={`px-4 py-3 shadow-lg rounded-xl bg-white border-2 transition-all w-56 ${selected ? "border-primary ring-2 ring-primary/20" : "border-slate-200"}`}>
      <Handle type="target" position={Position.Top} className="!bg-primary w-3 h-3" />
      <div className="flex flex-col gap-1">
        <div className="flex items-center justify-between mb-1">
          <div className="text-[9px] font-bold text-slate-400 uppercase tracking-wider truncate max-w-[80px]">{data.key}</div>
          <div className="flex gap-1">
            {data.display_format === 'buttons' && <div className="w-2 h-2 rounded-full bg-blue-400" title="Botões" />}
            {data.display_format === 'list' && <div className="w-2 h-2 rounded-full bg-green-400" title="Lista" />}
            {data.hasMedia && <ImageIcon className="w-3 h-3 text-primary" />}
          </div>
        </div>
        <div className="text-sm font-semibold text-slate-800 truncate">{data.label}</div>
        <div className="text-[10px] text-slate-500 line-clamp-2 italic h-7 overflow-hidden">
          "{data.message}"
        </div>
      </div>
      <Handle type="source" position={Position.Bottom} className="!bg-primary w-3 h-3" />
    </div>
  );
};

const nodeTypes = {
  step: StepNode,
};

function ReactFlowWrapper() {
  const { fitView } = useReactFlow();
  return (
    <Panel position="bottom-right" className="flex gap-2">
      <Button variant="secondary" size="sm" onClick={() => fitView({ duration: 800 })} className="shadow-md">
        Centralizar Fluxo
      </Button>
    </Panel>
  );
}

export default function AdminCrmFlow() {
  const isMobile = useIsMobile();
  const [loading, setLoading] = useState(true);
  const [steps, setSteps] = useState<FlowStep[]>([]);
  const [editingStep, setEditingStep] = useState<FlowStep | null>(null);
  const [saving, setSaving] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);

  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);

  const loadSteps = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("crm_flow_steps")
      .select("*")
      .order("order_index");
    
    if (error) {
      toast({ title: "Erro ao carregar", description: error.message, variant: "destructive" });
    } else {
      const formattedSteps = (data || []).map(step => ({
        ...step,
        actions: Array.isArray(step.actions) ? step.actions : []
      })) as FlowStep[];
      setSteps(formattedSteps);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    loadSteps();
  }, [loadSteps]);

  // Sync steps to nodes and edges
  useEffect(() => {
    if (steps.length === 0 && !loading) return;

    const newNodes: Node[] = steps.map((step) => ({
      id: step.id,
      type: "step",
      position: { x: step.position_x ?? 0, y: step.position_y ?? 0 },
      data: { 
        label: step.label, 
        key: step.key,
        message: step.message,
        display_format: step.display_format || 'text',
        hasMedia: !!step.media_url,
        mediaType: step.media_type
      },
    }));

    const newEdges: Edge[] = [];
    steps.forEach(step => {
      if (Array.isArray(step.actions)) {
        step.actions.forEach((action: any, index: number) => {
          if (action.next_step_key) {
            const targetStep = steps.find(s => s.key === action.next_step_key);
            if (targetStep) {
              newEdges.push({
                id: `e-${step.id}-${targetStep.id}-${index}`,
                source: step.id,
                target: targetStep.id,
                label: action.label,
                animated: true,
                style: { stroke: '#94a3b8', strokeWidth: 2 },
                labelStyle: { fill: '#64748b', fontWeight: 700, fontSize: 10 },
                labelBgStyle: { fill: '#ffffff', fillOpacity: 0.8 },
                markerEnd: { type: MarkerType.ArrowClosed, color: '#94a3b8' },
              });
            }
          }
        });
      }
    });

    setNodes(newNodes);
    setEdges(newEdges);
  }, [steps, loading, setNodes, setEdges]);

  const onConnect = useCallback((params: Connection) => {
    setEdges((eds) => addEdge({ ...params, animated: true, markerEnd: { type: MarkerType.ArrowClosed } }, eds));
    
    // Update local state and DB
    const sourceStep = steps.find(s => s.id === params.source);
    const targetStep = steps.find(s => s.id === params.target);
    
    if (sourceStep && targetStep) {
      const newActions = [...(sourceStep.actions || [])];
      // Check if connection already exists to avoid duplicates
      if (!newActions.some(a => a.next_step_key === targetStep.key)) {
        newActions.push({ label: "Próximo", next_step_key: targetStep.key });
        const updatedStep = { ...sourceStep, actions: newActions };
        saveStepToDb(updatedStep);
      }
    }
  }, [steps, setEdges]);

  const onNodeDragStop = useCallback((_: any, node: Node) => {
    const step = steps.find(s => s.id === node.id);
    if (step) {
      const updatedStep = { 
        ...step, 
        position_x: node.position.x, 
        position_y: node.position.y 
      };
      saveStepToDb(updatedStep, false); // Don't reload for drag
    }
  }, [steps]);

  async function saveStepToDb(step: FlowStep, reload = true) {
    const { error } = await supabase
      .from("crm_flow_steps")
      .upsert({ 
        id: step.id,
        key: step.key,
        label: step.label,
        message: step.message,
        display_format: step.display_format || 'text',
        media_url: step.media_url,
        media_type: step.media_type,
        actions: step.actions,
        order_index: step.order_index,
        position_x: step.position_x,
        position_y: step.position_y,
        updated_at: new Date().toISOString() 
      });
    
    if (error) {
      toast({ title: "Erro ao salvar", description: error.message, variant: "destructive" });
    } else if (reload) {
      loadSteps();
    } else {
      // Update local state without full reload
      setSteps(prev => prev.map(s => s.id === step.id ? step : s));
    }
  }

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !editingStep) return;

    setSaving(true);
    const fileExt = file.name.split('.').pop();
    const fileName = `${Math.random().toString(36).substring(2)}.${fileExt}`;
    const filePath = `flow-assets/${fileName}`;

    const { error: uploadError } = await supabase.storage
      .from('crm-media')
      .upload(filePath, file);

    if (uploadError) {
      toast({ title: "Erro no upload", description: uploadError.message, variant: "destructive" });
      setSaving(false);
      return;
    }

    const { data: { publicUrl } } = supabase.storage
      .from('crm-media')
      .getPublicUrl(filePath);

    setEditingStep({ 
      ...editingStep, 
      media_url: publicUrl,
      media_type: file.type.startsWith('image') ? 'image' : 'document'
    });
    setSaving(false);
    toast({ title: "Sucesso", description: "Arquivo enviado" });
  };

  const handleAddStep = async () => {
    const newStep = {
      key: `novo_passo_${steps.length + 1}`,
      label: "Novo Passo",
      message: "Escreva sua mensagem aqui...",
      actions: [],
      order_index: steps.length,
      position_x: 100,
      position_y: 100
    };

    const { data, error } = await supabase
      .from("crm_flow_steps")
      .insert(newStep)
      .select()
      .single();

    if (error) {
      toast({ title: "Erro ao criar", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Sucesso", description: "Novo passo criado" });
      loadSteps();
    }
  };

  const handleDeleteStep = async (id: string) => {
    if (!confirm("Tem certeza que deseja excluir este passo? Isso removerá todas as conexões vinculadas.")) return;
    
    const { error } = await supabase
      .from("crm_flow_steps")
      .delete()
      .eq("id", id);

    if (error) {
      toast({ title: "Erro ao excluir", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Sucesso", description: "Passo removido" });
      setEditingStep(null);
      loadSteps();
    }
  };

  const handleUpdateEditingStep = (field: keyof FlowStep, value: any) => {
    if (!editingStep) return;
    setEditingStep({ ...editingStep, [field]: value });
  };

  const handleSaveEditingStep = async () => {
    if (!editingStep) return;
    setSaving(true);
    await saveStepToDb(editingStep);
    setSaving(false);
    toast({ title: "Sucesso", description: "Passo atualizado" });
  };

  const removeAction = (index: number) => {
    if (!editingStep) return;
    const newActions = [...editingStep.actions];
    newActions.splice(index, 1);
    setEditingStep({ ...editingStep, actions: newActions });
  };

  const updateAction = (index: number, field: string, value: string) => {
    if (!editingStep) return;
    const newActions = [...editingStep.actions];
    newActions[index] = { ...newActions[index], [field]: value };
    setEditingStep({ ...editingStep, actions: newActions });
  };

  return (
    <div className="min-h-screen bg-slate-50">
      {!isFullscreen && <DashboardSidebar role="admin" />}
      
      <div className={`transition-all duration-300 ${!isFullscreen ? (isMobile ? "pt-16" : "ml-60") : ""}`}>
        <div className={`p-6 max-w-[1600px] mx-auto space-y-4 ${isFullscreen ? "h-screen" : ""}`}>
          
          <div className="flex justify-between items-center bg-white p-4 rounded-xl shadow-sm border border-slate-200">
            <div className="flex items-center gap-3">
              <div className="bg-primary/10 p-2 rounded-lg">
                <Workflow className="w-5 h-5 text-primary" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-slate-800 tracking-tight">Fluxo de Atendimento</h1>
                <p className="text-xs text-slate-500">Desenhe e gerencie a inteligência das conversas</p>
              </div>
            </div>
            
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={handleAddStep} className="gap-2">
                <Plus className="w-4 h-4" /> Novo Passo
              </Button>
              <Button variant="ghost" size="sm" onClick={() => setIsFullscreen(!isFullscreen)}>
                {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
              </Button>
            </div>
          </div>
          
          <div className="flex gap-4 h-[calc(100vh-180px)] min-h-[600px]">
            {/* Flowchart Area */}
            <div className={`flex-1 relative border border-slate-200 rounded-xl bg-white shadow-inner overflow-hidden ${isFullscreen ? "fixed inset-0 z-40" : ""}`}>
              {loading ? (
                <div className="absolute inset-0 flex items-center justify-center bg-white/50 z-10">
                  <Loader2 className="w-8 h-8 animate-spin text-primary" />
                </div>
              ) : (
                <ReactFlow
                  nodes={nodes}
                  edges={edges}
                  onNodesChange={onNodesChange}
                  onEdgesChange={onEdgesChange}
                  onConnect={onConnect}
                  onNodeDragStop={onNodeDragStop}
                  onNodeClick={(_, node) => {
                    const step = steps.find(s => s.id === node.id);
                    if (step) setEditingStep(JSON.parse(JSON.stringify(step))); // Deep copy
                  }}
                  nodeTypes={nodeTypes}
                  fitView
                >
                  <Background color="#cbd5e1" gap={20} />
                  <Controls />
                  
                  {isFullscreen && (
                    <Panel position="top-right">
                      <Button variant="secondary" onClick={() => setIsFullscreen(false)}>
                        Sair da Tela Cheia
                      </Button>
                    </Panel>
                  )}
                  <ReactFlowWrapper />
                </ReactFlow>
              )}
            </div>

            {/* Editor Sidebar */}
            {(editingStep || isMobile) && (
              <div className={`${isMobile ? "fixed inset-0 z-50 bg-white p-6" : "w-96"} h-full overflow-y-auto bg-white border border-slate-200 rounded-xl shadow-sm flex flex-col`}>
                <div className="p-4 border-b flex justify-between items-center sticky top-0 bg-white z-10">
                  <div className="flex items-center gap-2">
                    <Settings className="w-4 h-4 text-slate-400" />
                    <h2 className="font-bold text-slate-700">Editar Passo</h2>
                  </div>
                  <Button variant="ghost" size="sm" onClick={() => setEditingStep(null)}>
                    <X className="w-4 h-4" />
                  </Button>
                </div>

                {!editingStep ? (
                  <div className="flex-1 flex flex-col items-center justify-center p-8 text-center text-slate-400">
                    <div className="bg-slate-50 p-4 rounded-full mb-4">
                      <Workflow className="w-8 h-8 opacity-20" />
                    </div>
                    <p className="text-sm">Selecione uma caixa no fluxograma para editar seu conteúdo.</p>
                  </div>
                ) : (
                  <div className="p-4 space-y-6">
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <Label>Título (Interno)</Label>
                        <Input 
                          value={editingStep.label} 
                          onChange={(e) => handleUpdateEditingStep("label", e.target.value)}
                          placeholder="Ex: Saudação Inicial"
                        />
                      </div>
                      
                      <div className="space-y-2">
                        <Label>Chave (ID único)</Label>
                        <Input 
                          value={editingStep.key} 
                          onChange={(e) => handleUpdateEditingStep("key", e.target.value)}
                          placeholder="ex_id_saudacao"
                          className="font-mono text-xs uppercase"
                        />
                      </div>

                      <div className="space-y-2">
                        <Label>Formato de Exibição (W-API)</Label>
                        <div className="flex gap-2 p-1 bg-slate-100 rounded-lg">
                          {(['text', 'buttons', 'list'] as const).map((fmt) => (
                            <button
                              key={fmt}
                              onClick={() => handleUpdateEditingStep("display_format", fmt)}
                              className={`flex-1 py-1.5 text-xs font-medium rounded-md transition-all ${
                                editingStep.display_format === fmt || (!editingStep.display_format && fmt === 'text')
                                  ? "bg-white shadow-sm text-primary"
                                  : "text-slate-500 hover:text-slate-700"
                              }`}
                            >
                              {fmt === 'text' ? 'Texto' : fmt === 'buttons' ? 'Botões' : 'Lista'}
                            </button>
                          ))}
                        </div>
                        <p className="text-[10px] text-slate-400 italic">
                          Botões suportam até 3 opções. Lista até 10.
                        </p>
                      </div>

                      <div className="space-y-2">
                        <Label>Mensagem do Bot</Label>
                        <Textarea 
                          value={editingStep.message} 
                          onChange={(e) => handleUpdateEditingStep("message", e.target.value)}
                          placeholder="Olá {nome}, como podemos ajudar?"
                          className="min-h-[120px] text-sm"
                        />
                        <p className="text-[10px] text-slate-400 italic">Use {"{nome}"} para personalizar.</p>
                      </div>

                      <div className="space-y-2">
                        <Label>Mídia (URL Imagem/PDF)</Label>
                        <div className="flex gap-2">
                          <Input 
                            value={editingStep.media_url || ""} 
                            onChange={(e) => handleUpdateEditingStep("media_url", e.target.value)}
                            placeholder="https://..."
                            className="text-xs"
                          />
                          <div className="relative">
                            <input
                              type="file"
                              id="flow-file-upload"
                              className="hidden"
                              onChange={handleFileUpload}
                              accept="image/*,application/pdf"
                            />
                            <Button 
                              variant="outline" 
                              size="icon" 
                              className="shrink-0"
                              onClick={() => document.getElementById('flow-file-upload')?.click()}
                              disabled={saving}
                            >
                              <Upload className="w-4 h-4" />
                            </Button>
                          </div>
                        </div>
                        {editingStep.media_url && (
                          <div className="mt-2 relative group">
                            {editingStep.media_type === 'image' ? (
                              <img src={editingStep.media_url} className="w-full h-32 object-cover rounded-md border" />
                            ) : (
                              <div className="flex items-center gap-2 p-2 bg-slate-50 border rounded-md">
                                <FileText className="w-4 h-4 text-primary" />
                                <span className="text-xs truncate">{editingStep.media_url}</span>
                              </div>
                            )}
                            <button 
                              onClick={() => {
                                setEditingStep({...editingStep, media_url: null, media_type: null});
                              }}
                              className="absolute -top-2 -right-2 bg-white border shadow-sm rounded-full p-1 text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
                            >
                              <X className="w-3 h-3" />
                            </button>
                          </div>
                        )}
                      </div>
                    </div>

                    <Separator />

                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <Label className="flex items-center gap-2">
                          <LinkIcon className="w-3 h-3" /> Conexões / Opções
                        </Label>
                        <Button variant="outline" size="sm" onClick={() => {
                          const newActions = [...(editingStep.actions || [])];
                          newActions.push({ label: "Nova Opção", next_step_key: "" });
                          handleUpdateEditingStep("actions", newActions);
                        }}>
                          <Plus className="w-3 h-3" />
                        </Button>
                      </div>

                      <div className="space-y-3">
                        {editingStep.actions?.map((action, index) => (
                          <div key={index} className="p-3 bg-slate-50 rounded-lg border border-slate-200 space-y-2 relative group">
                            <button 
                              onClick={() => removeAction(index)}
                              className="absolute -top-2 -right-2 bg-white border shadow-sm rounded-full p-1 text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
                            >
                              <X className="w-3 h-3" />
                            </button>
                            
                            <div className="grid grid-cols-2 gap-2">
                              <div className="space-y-1">
                                <Label className="text-[10px]">Gatilho (ex: 1)</Label>
                                <Input 
                                  value={action.label} 
                                  onChange={(e) => updateAction(index, "label", e.target.value)}
                                  className="h-7 text-xs"
                                />
                              </div>
                              <div className="space-y-1">
                                <Label className="text-[10px]">Vai para (Chave)</Label>
                                <select 
                                  value={action.next_step_key} 
                                  onChange={(e) => updateAction(index, "next_step_key", e.target.value)}
                                  className="w-full h-7 text-xs rounded-md border border-input bg-background px-3 py-1"
                                >
                                  <option value="">Selecione...</option>
                                  {steps.filter(s => s.id !== editingStep.id).map(s => (
                                    <option key={s.key} value={s.key}>{s.label}</option>
                                  ))}
                                </select>
                              </div>
                            </div>
                          </div>
                        ))}
                        {(!editingStep.actions || editingStep.actions.length === 0) && (
                          <p className="text-[11px] text-slate-400 text-center py-2">Sem conexões de saída.</p>
                        )}
                      </div>
                    </div>

                    <div className="pt-6 sticky bottom-0 bg-white pb-4 space-y-2">
                      <Button className="w-full gap-2" onClick={handleSaveEditingStep} disabled={saving}>
                        {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                        Salvar Alterações
                      </Button>
                      <Button variant="ghost" className="w-full text-red-500 hover:text-red-600 hover:bg-red-50 gap-2" onClick={() => handleDeleteStep(editingStep.id)}>
                        <Trash2 className="w-4 h-4" /> Excluir Passo
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
