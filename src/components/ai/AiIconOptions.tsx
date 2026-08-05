import React from 'react';
import { cn } from "@/lib/utils";
import { Network, Dumbbell, Apple, Activity } from "lucide-react";
import logoMasterAsset from "@/assets/logo-master-v1.png.asset.json";

export default function AiIconOptions() {
  const options = [
    {
      id: "master-design-1",
      label: "ÍCONE ATUAL: Master V1",
      description: "ESTE É O ÍCONE OFICIAL. Transferido fielmente do anexo para todas as plataformas: APK, AAB, iOS e Desktop.",
      image: logoMasterAsset.url,
      selected: true
    },
    {
      id: "master-design-2",
      label: "Componente Reativo",
      description: "Versão renderizada via código para interfaces que exigem animações de rede e interatividade.",
      layout: "grid",
      color: "from-primary via-emerald-500 to-blue-500",
    }
  ];

  return (
    <div className="grid gap-8 sm:grid-cols-2 p-6 bg-black rounded-[40px] border border-white/10 max-h-[70vh] overflow-y-auto custom-scrollbar">
      <div className="col-span-full mb-4 rounded-2xl bg-primary/10 border border-primary/20 p-4 text-center">
        <p className="text-xs font-bold text-primary uppercase tracking-widest">Atenção Admin</p>
        <p className="text-[11px] text-primary/80">ESTE É O ÍCONE ATUAL INTEGRAL E FIEL APRESENTADO NA STH AI</p>
      </div>
      {options.map((opt) => (
        <div key={opt.id} className="flex flex-col items-center text-center group">
          <div className={cn(
            "relative mb-4 flex h-48 w-48 items-center justify-center rounded-[32px] bg-black shadow-2xl transition-all duration-500 group-hover:scale-105 group-hover:shadow-primary/20 border overflow-hidden",
            opt.selected ? "border-primary ring-2 ring-primary/20 shadow-primary/30" : "border-white/10",
            "bg-gradient-to-br from-zinc-900 to-black"
          )}>
            <div className={cn(
              "absolute inset-0 rounded-[32px] bg-gradient-to-br blur-xl transition-opacity duration-500",
              opt.selected ? "opacity-30" : "opacity-0 group-hover:opacity-40",
              opt.color || "from-primary/20 to-blue-500/20"
            )} />
            
            <div className="relative z-10 w-full h-full flex items-center justify-center">
              {opt.image ? (
                <img src={opt.image} alt={opt.label} className="w-full h-full object-cover rounded-[32px]" />
              ) : (
                <div className="grid grid-cols-2 gap-3">
                  <Dumbbell className="h-8 w-8 text-orange-500" />
                  <Apple className="h-8 w-8 text-red-500" />
                  <Activity className="h-8 w-8 text-emerald-500" />
                  <Network className="h-8 w-8 text-blue-500 animate-pulse" />
                </div>
              )}
            </div>
          </div>
          <h3 className="text-sm font-bold tracking-tight text-white mb-1 uppercase">{opt.label}</h3>
          <p className="text-[11px] text-muted-foreground leading-relaxed px-4">{opt.description}</p>
        </div>
      ))}
    </div>
  );
}
