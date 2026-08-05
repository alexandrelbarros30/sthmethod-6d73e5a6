import React from 'react';
import { cn } from "@/lib/utils";
import { Network, Cpu, Share2, Layers, Zap, Infinity, Dumbbell, Apple, Activity, Microchip } from "lucide-react";

export default function AiIconOptions() {
  const options = [
    {
      id: "master-design-1",
      label: "Master V1: Fusão Biomecânica",
      description: "Design minimalista unindo Halter, Maçã e Pulso em uma malha neural integrada. Foco em equilíbrio.",
      icon: Network,
      color: "from-primary to-emerald-500",
      layout: "grid",
      selected: true
    },
    {
      id: "master-design-2",
      label: "Master V2: Núcleo Clínico",
      description: "O sensor de exames (Activity) como centro, orbitado pela musculação e nutrição. Foco em saúde/performance.",
      icon: Network,
      color: "from-blue-500 to-primary",
      layout: "orbit"
    },
    {
      id: "master-design-3",
      label: "Master V3: Escudo de Evolução",
      description: "Elementos dispostos de forma heráldica, simbolizando a proteção e o suporte da STHia em todas as frentes.",
      icon: Network,
      color: "from-zinc-100 to-primary",
      layout: "shield"
    }
  ];

  return (
    <div className="grid gap-8 sm:grid-cols-3 p-6 bg-black rounded-[40px] border border-white/10 max-h-[70vh] overflow-y-auto custom-scrollbar">
      {options.map((opt) => (
        <div key={opt.id} className="flex flex-col items-center text-center group">
          <div className={cn(
            "relative mb-4 flex h-32 w-32 items-center justify-center rounded-[32px] bg-black shadow-2xl transition-all duration-500 group-hover:scale-105 group-hover:shadow-primary/20 border overflow-hidden",
            opt.selected ? "border-primary ring-2 ring-primary/20 shadow-primary/30" : "border-white/10",
            "bg-gradient-to-br from-zinc-900 to-black"
          )}>
            <div className={cn(
              "absolute inset-0 rounded-[32px] bg-gradient-to-br blur-xl transition-opacity duration-500",
              opt.selected ? "opacity-30" : "opacity-0 group-hover:opacity-40",
              opt.color
            )} />
            
            <div className="relative z-10 w-full h-full flex items-center justify-center p-4">
              {opt.layout === "grid" && (
                <div className="relative flex flex-col items-center justify-center w-full h-full">
                  <Dumbbell className="absolute top-0 h-7 w-7 text-primary" />
                  <div className="flex gap-10 mt-8">
                    <Apple className="h-7 w-7 text-emerald-400" />
                    <Activity className="h-7 w-7 text-blue-400" />
                  </div>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="h-2 w-2 rounded-full bg-white animate-pulse" />
                  </div>
                </div>
              )}
              
              {opt.layout === "orbit" && (
                <div className="relative h-full w-full flex items-center justify-center">
                  <div className="absolute inset-2 rounded-full border border-white/5 animate-spin-slow" />
                  <Activity className="h-10 w-10 text-blue-400 animate-pulse" />
                  <Dumbbell className="absolute -top-1 h-6 w-6 text-primary" />
                  <Apple className="absolute -bottom-1 h-6 w-6 text-emerald-400" />
                  <Network className="absolute right-0 h-4 w-4 text-white opacity-40" />
                </div>
              )}
              
              {opt.layout === "shield" && (
                <div className="flex flex-col items-center gap-2">
                  <ShieldCheck className="h-10 w-10 text-white/90" />
                  <div className="flex gap-2">
                    <Dumbbell className="h-5 w-5 text-primary" />
                    <Activity className="h-5 w-5 text-blue-400" />
                    <Apple className="h-5 w-5 text-emerald-400" />
                  </div>
                </div>
              )}
            </div>
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
