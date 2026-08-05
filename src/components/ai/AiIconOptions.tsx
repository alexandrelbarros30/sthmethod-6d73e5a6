import React from 'react';
import { cn } from "@/lib/utils";
import { Network, Cpu, Share2, Layers, Zap, Infinity, Dumbbell, Apple, Activity, Microchip } from "lucide-react";

export default function AiIconOptions() {
  const options = [
    {
      id: "node-triangle",
      label: "Opção 1: Triângulo de Conexão (Anexo)",
      description: "Baseado no anexo enviado: 3 nós conectados em triângulo com efeito neon verde.",
      icon: Network,
      color: "from-[#00FF41] to-[#008F11]",
      isReference: true,
    },
    {
      id: "neural-core",
      label: "Opção 2: Núcleo Neural Integrado",
      description: "Uma evolução do ícone de nós, focada em um núcleo de processamento central.",
      icon: Cpu,
      color: "from-primary to-primary/60",
    },
    {
      id: "distributed-nodes",
      label: "Opção 3 — Rede de Nós Distribuídos",
      description: "Representa a expansão da inteligência STHia integrada à musculação e biomecânica.",
      icon: Dumbbell,
      color: "from-[#00FF41] to-[#008F11]",
    },
    {
      id: "layered-intelligence",
      label: "Opção 4 — Camadas de Inteligência",
      description: "Profundidade do método: Nutrição, Bioquímica e Exames integrados por IA.",
      icon: Activity,
      color: "from-emerald-400 to-emerald-700",
    },
    {
      id: "bio-nutrition",
      label: "Opção 7: Inteligência Metabólica",
      description: "O equilíbrio perfeito entre nutrição de alta performance e análise laboratorial.",
      icon: Apple,
      color: "from-lime-400 to-green-600",
    },
    {
      id: "performance-dna",
      label: "Opção 8: DNA de Performance",
      description: "A digital técnica da STH AI mapeando cada detalhe da sua evolução física.",
      icon: Microchip,
      color: "from-primary to-emerald-500",
    },
    {
      id: "performance-spark",
      label: "Opção 5: Faísca de Performance",
      description: "Representa o impacto imediato e a energia da evolução STH.",
      icon: Zap,
      color: "from-yellow-400 to-primary",
    },
    {
      id: "infinite-evolution",
      label: "Opção 6: Evolução Infinita",
      description: "Focado na jornada contínua e no ciclo perpétuo de melhoria do aluno.",
      icon: Infinity,
      color: "from-primary to-emerald-400",
    }
  ];

  return (
    <div className="grid gap-8 sm:grid-cols-3 p-6 bg-black rounded-[40px] border border-white/10 max-h-[70vh] overflow-y-auto custom-scrollbar">
      {options.map((opt) => (
        <div key={opt.id} className="flex flex-col items-center text-center group">
          <div className={cn(
            "relative mb-4 flex h-32 w-32 items-center justify-center rounded-[32px] bg-black shadow-2xl transition-all duration-500 group-hover:scale-105 group-hover:shadow-primary/20 border border-white/10 overflow-hidden",
            opt.isReference ? "" : "bg-gradient-to-br from-zinc-900 to-black"
          )}>
            {opt.isReference ? (
              <img src="/pwa-ai-192.png?v=3" alt="Reference" className="h-full w-full object-cover" />
            ) : (
              <>
                <div className={cn(
                  "absolute inset-0 rounded-[32px] bg-gradient-to-br opacity-0 blur-xl transition-opacity duration-500 group-hover:opacity-40",
                  opt.color
                )} />
                <opt.icon className="relative z-10 h-16 w-16 text-primary animate-pulse-slow" strokeWidth={1.5} />
              </>
            )}
          </div>
          <h3 className="text-sm font-bold tracking-tight text-white mb-1 uppercase">{opt.label}</h3>
          <p className="text-[11px] text-muted-foreground leading-relaxed px-4">{opt.description}</p>
          
          <div className="mt-4 flex gap-2">
            <div className="h-6 w-6 rounded-md bg-white/5 border border-white/10 flex items-center justify-center text-[8px] font-bold text-primary">16px</div>
            <div className="h-6 w-6 rounded-md bg-white/5 border border-white/10 flex items-center justify-center text-[8px] font-bold text-primary">32px</div>
            <div className="h-6 w-6 rounded-md bg-white/5 border border-white/10 flex items-center justify-center text-[8px] font-bold text-primary">192px</div>
          </div>
        </div>
      ))}
    </div>
  );
}
