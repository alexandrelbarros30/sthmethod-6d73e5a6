import React from 'react';
import { cn } from "@/lib/utils";
import { Brain, Fingerprint, Zap } from "lucide-react";

export default function AiIconOptions() {
  const options = [
    {
      id: "neural-network",
      label: "Opção 1: Rede Neural (Conectividade)",
      description: "Visual focado em processamento e inteligência conectada.",
      icon: Brain,
      color: "from-[#00FF41] to-[#008F11]", // Verde Neon STH
    },
    {
      id: "biometric-tech",
      label: "Opção 2: Biometria Tech (Identidade)",
      description: "Focado no DNA STH Method e personalização biológica.",
      icon: Fingerprint,
      color: "from-primary to-primary/60",
    },
    {
      id: "performance-pulse",
      label: "Opção 3: Pulso de Performance (Energia)",
      description: "Representa a evolução constante e o impacto dos resultados.",
      icon: Zap,
      color: "from-white to-primary",
    }
  ];

  return (
    <div className="grid gap-8 sm:grid-cols-3 p-6 bg-black rounded-[40px] border border-white/10">
      {options.map((opt) => (
        <div key={opt.id} className="flex flex-col items-center text-center group">
          <div className={cn(
            "relative mb-4 flex h-32 w-32 items-center justify-center rounded-[32px] bg-card shadow-2xl transition-all duration-500 group-hover:scale-105 group-hover:shadow-primary/20 border border-white/5",
            "after:absolute after:inset-0 after:rounded-[32px] after:bg-gradient-to-br after:opacity-10 after:transition-opacity group-hover:after:opacity-20",
            opt.color
          )}>
            <div className={cn(
              "absolute inset-0 rounded-[32px] bg-gradient-to-br opacity-0 blur-xl transition-opacity duration-500 group-hover:opacity-40",
              opt.color
            )} />
            <opt.icon className="relative z-10 h-16 w-16 text-primary animate-pulse-slow" strokeWidth={1.5} />
          </div>
          <h3 className="text-sm font-bold tracking-tight text-white mb-1">{opt.label}</h3>
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
