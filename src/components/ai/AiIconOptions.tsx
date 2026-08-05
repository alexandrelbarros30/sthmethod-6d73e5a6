import React from 'react';
import { cn } from "@/lib/utils";
import { Network, Cpu, Share2, Layers, Zap, Infinity, Dumbbell, Apple, Activity, Microchip } from "lucide-react";

export default function AiIconOptions() {
  const options = [
    {
      id: "sth-ai-core",
      label: "Opção Master: Ecossistema Integrado",
      description: "A união definitiva: O peso (Musculação), a maçã (Nutrição) e o pulso (Exames) conectados pela rede neural STH AI.",
      icon: Network,
      color: "from-[#00FF41] to-[#008F11]",
      isHybrid: true
    },
    {
      id: "performance-dna",
      label: "Conceito 1: DNA Metabólico",
      description: "Integração total entre bioquímica sanguínea e resposta hipertrófica monitorada por IA.",
      icon: Activity,
      color: "from-emerald-400 to-primary",
    },
    {
      id: "smart-fuel",
      label: "Conceito 2: Nutrição Sintética",
      description: "IA aplicada à otimização de nutrientes para performance máxima e saúde celular.",
      icon: Apple,
      color: "from-lime-400 to-green-600",
    },
    {
      id: "strength-logic",
      label: "Conceito 3: Biomecânica Aumentada",
      description: "O poder da musculação guiado por análise de dados em tempo real da STHia.",
      icon: Dumbbell,
      color: "from-zinc-400 to-primary",
    },
    {
      id: "clinical-sync",
      label: "Conceito 4: Inteligência Clínica",
      description: "Transformando exames laboratoriais em protocolos de treino e dieta precisos.",
      icon: Microchip,
      color: "from-blue-400 to-emerald-500",
    },
    {
      id: "unified-nodes",
      label: "Conceito 5: Rede de Performance",
      description: "Nós de dados conectando nutrição, treino e saúde em um único cérebro de IA.",
      icon: Share2,
      color: "from-primary to-white",
    }
  ];

  return (
    <div className="grid gap-8 sm:grid-cols-3 p-6 bg-black rounded-[40px] border border-white/10 max-h-[70vh] overflow-y-auto custom-scrollbar">
      {options.map((opt) => (
        <div key={opt.id} className="flex flex-col items-center text-center group">
          <div className={cn(
            "relative mb-4 flex h-32 w-32 items-center justify-center rounded-[32px] bg-black shadow-2xl transition-all duration-500 group-hover:scale-105 group-hover:shadow-primary/20 border border-white/10 overflow-hidden",
            opt.isHybrid ? "bg-gradient-to-br from-zinc-900 to-black" : "bg-gradient-to-br from-zinc-900 to-black"
          )}>
            <div className={cn(
              "absolute inset-0 rounded-[32px] bg-gradient-to-br opacity-0 blur-xl transition-opacity duration-500 group-hover:opacity-40",
              opt.color
            )} />
            
            {opt.isHybrid ? (
              <div className="relative z-10 grid grid-cols-2 gap-2 p-4">
                <Dumbbell className="h-6 w-6 text-primary" />
                <Apple className="h-6 w-6 text-emerald-400" />
                <Activity className="h-6 w-6 text-blue-400" />
                <Network className="h-6 w-6 text-white animate-pulse" />
              </div>
            ) : (
              <opt.icon className="relative z-10 h-16 w-16 text-primary animate-pulse-slow" strokeWidth={1.5} />
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
