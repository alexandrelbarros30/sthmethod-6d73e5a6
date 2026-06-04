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
  Panel,
  Handle,
  Position
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

// Custom Node Component
const StepNode = ({ data, selected }: any) => {
  return (
    <div className={`px-4 py-3 shadow-lg rounded-xl bg-white border-2 transition-all w-48 ${selected ? "border-primary ring-2 ring-primary/20" : "border-slate-200"}`}>
      <Handle type="target" position={Position.Top} className="!bg-primary" />
      <div className="flex flex-col gap-1">
        <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{data.key}</div>
        <div className="text-sm font-semibold text-slate-800">{data.label}</div>
        <div className="text-[10px] text-slate-500 truncate">{data.message.substring(0, 30)}...</div>
      </div>
      <Handle type="source" position={Position.Bottom} className="!bg-primary" />
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
  const [isFullscreen, setIsFullscreen] = useState(false);

  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);

  useEffect(() => {
    loadSteps();
  }, []);

  useEffect(() => {
    if (steps.length === 0) return;

    const newNodes: Node[] = steps.map((step) => ({
      id: step.id,
      type: "step",
      position: { x: step.position_x ?? 0, y: step.position_y ?? 0 },
      data: { 
        label: step.label, 
        key: step.key,
        message: step.message,
        hasMedia: !!step.media_url,
        mediaType: step.media_type
      },
    }));

    const newEdges: Edge[] = [];
    steps.forEach(step => {
      if (Array.isArray(step.actions)) {
        step.actions.forEach((action: any) => {
          if (action.next_step_key) {
            const targetStep = steps.find(s => s.key === action.next_step_key);
            if (targetStep) {
              newEdges.push({
                id: `e-${step.id}-${targetStep.id}-${Math.random()}`,
                source: step.id,
                target: targetStep.id,
                label: action.label,
                animated: true,
                markerEnd: { type: MarkerType.ArrowClosed },
              });
            }
          }
        });
      }
    });

    setNodes(newNodes);
    setEdges(newEdges);
  }, [steps, setNodes, setEdges]);

  async function loadSteps() {
    setLoading(true);
    const { data } = await supabase.from("crm_flow_steps").select("*").order("order_index");
    setSteps(data || []);
    setLoading(false);
  }

  const onConnect = useCallback((params: Connection) => {
    if (!params.source || !params.target) return;
    
    const sourceStep = steps.find(s => s.id === params.source);
    const targetStep = steps.find(s => s.id === params.target);
    
    if (sourceStep && targetStep) {
      const newActions = [...(sourceStep.actions || [])];
      newActions.push({ label: "Nova Conexão", next_step_key: targetStep.key });
      
      const updatedStep = { ...sourceStep, actions: newActions };
      setSteps(steps.map(s => s.id === sourceStep.id ? updatedStep : s));
      saveStep(updatedStep);
    }
  }, [steps]);

  async function saveStep(step: FlowStep) {
    const { error } = await supabase.from("crm_flow_steps").upsert({ ...step, updated_at: new Date().toISOString() });
    if (!error) loadSteps();
  }

  return (
    <div className="min-h-screen bg-slate-100">
      {!isFullscreen && <DashboardSidebar role="admin" />}
      <div className={`p-6 ${!isFullscreen ? (isMobile ? "pt-16" : "ml-60") : ""}`}>
        <div className="max-w-7xl mx-auto space-y-4">
          <div className="flex justify-between items-center bg-white p-4 rounded-xl shadow-sm">
            <h1 className="text-xl font-bold">Fluxograma de Atendimento</h1>
            <div className="flex gap-2">
              <Button onClick={() => setIsFullscreen(!isFullscreen)}>
                {isFullscreen ? <Minimize2 /> : <Maximize2 />}
              </Button>
            </div>
          </div>
          
          <div className={`border rounded-xl bg-white ${isFullscreen ? "fixed inset-0 z-50" : "h-[600px]"}`}>
            <ReactFlow
              nodes={nodes}
              edges={edges}
              onNodesChange={onNodesChange}
              onEdgesChange={onEdgesChange}
              onConnect={onConnect}
              onNodeClick={(_, node) => setEditingId(node.id)}
              nodeTypes={nodeTypes}
            >
              <Background />
              <Controls />
            </ReactFlow>
          </div>
        </div>
      </div>
    </div>
  );
}
