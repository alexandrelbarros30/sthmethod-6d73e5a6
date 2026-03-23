import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Heart, Activity, Zap, Shield, FlaskConical, Brain, Pill, Eye, EyeOff } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import RichContentRenderer from "@/components/shared/RichContentRenderer";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

interface ProtocolItem {
  id: string;
  name: string;
  category: string;
  dosage: string;
  frequency: string;
  notes: string | null;
  sort_order: number;
}

interface ProtocolInfoPanelProps {
  protocols?: ProtocolItem[];
  userId?: string;
}

const categoryConfig = [
  {
    key: "endocrino",
    title: "Suporte Endócrino Hormonal",
    icon: FlaskConical,
    color: "from-violet-500 to-fuchsia-500",
    glowColor: "shadow-violet-500/20",
    bgAccent: "bg-violet-500/10",
    borderAccent: "border-violet-500/20",
    iconSecondary: Brain,
    defaultItems: [
      "Otimização dos eixos hormonais",
      "Suporte à tireoide e metabolismo basal",
      "Regulação do cortisol e estresse",
      "Equilíbrio de hormônios anabólicos",
    ],
  },
  {
    key: "cardiovascular",
    title: "Suporte Cardiovascular, Hepático e Renal",
    icon: Heart,
    color: "from-rose-500 to-orange-500",
    glowColor: "shadow-rose-500/20",
    bgAccent: "bg-rose-500/10",
    borderAccent: "border-rose-500/20",
    iconSecondary: Shield,
    defaultItems: [
      "Proteção cardiovascular avançada",
      "Suporte à função hepática e detox",
      "Manutenção da saúde renal",
      "Controle lipídico e pressórico",
    ],
  },
  {
    key: "metabolico",
    title: "Suporte Metabólico e Performance",
    icon: Zap,
    color: "from-emerald-500 to-cyan-500",
    glowColor: "shadow-emerald-500/20",
    bgAccent: "bg-emerald-500/10",
    borderAccent: "border-emerald-500/20",
    iconSecondary: Activity,
    defaultItems: [
      "Maximização da performance esportiva",
      "Otimização da composição corporal",
      "Suporte energético e recuperação",
      "Nutrição celular e micronutrientes",
    ],
  },
];

const ProtocolInfoPanel = ({ protocols = [], userId }: ProtocolInfoPanelProps) => {
  const { user } = useAuth();
  const effectiveUserId = userId || user?.id;
  const [viewingCategory, setViewingCategory] = useState<string | null>(null);

  const { data: categoryContents = [] } = useQuery({
    queryKey: ["protocol-category-content", effectiveUserId],
    queryFn: async () => {
      const { data } = await supabase
        .from("protocol_category_content")
        .select("*")
        .eq("user_id", effectiveUserId!);
      return data || [];
    },
    enabled: !!effectiveUserId,
  });

  const groupedProtocols = categoryConfig.reduce((acc, cat) => {
    acc[cat.key] = protocols
      .filter((p) => p.category === cat.key)
      .sort((a, b) => a.sort_order - b.sort_order);
    return acc;
  }, {} as Record<string, ProtocolItem[]>);

  const hasAnyProtocols = protocols.length > 0;

  const getCategoryContent = (catKey: string) => {
    const found = categoryContents.find((c: any) => c.category === catKey);
    return found?.content || "";
  };

  const viewingCatConfig = viewingCategory ? categoryConfig.find((c) => c.key === viewingCategory) : null;

  return (
    <div className="space-y-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="text-center space-y-3"
      >
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary/10 border border-primary/20 text-primary text-xs font-semibold tracking-wider uppercase">
          <FlaskConical className="w-3.5 h-3.5" />
          Protocolo Personalizado
        </div>
        <h2 className="text-xl sm:text-2xl font-display font-bold text-foreground">
          Pilares do Protocolo
        </h2>
        <p className="text-sm text-muted-foreground max-w-md mx-auto font-body">
          {hasAnyProtocols
            ? "Seus medicamentos e suplementos organizados por pilar de suporte."
            : "Seu protocolo é construído sobre três pilares científicos para otimização completa da saúde e performance."}
        </p>
      </motion.div>

      {/* Cards */}
      <div className="grid gap-4">
        {categoryConfig.map((cat, i) => {
          const Icon = cat.icon;
          const IconSec = cat.iconSecondary;
          const items = groupedProtocols[cat.key] || [];
          const showDefault = items.length === 0;
          const catContent = getCategoryContent(cat.key);
          const hasContent = catContent.replace(/<[^>]*>/g, "").trim().length > 0;
          const hasViewable = items.length > 0 || hasContent;

          return (
            <motion.div
              key={cat.key}
              initial={{ opacity: 0, x: -30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2 + i * 0.15, duration: 0.5 }}
              className={`relative overflow-hidden rounded-xl border ${cat.borderAccent} bg-card/80 backdrop-blur-sm p-4 sm:p-5 group hover:shadow-lg ${cat.glowColor} transition-all duration-500`}
            >
              {/* Glow background effect */}
              <div className={`absolute -top-12 -right-12 w-32 h-32 bg-gradient-to-br ${cat.color} opacity-[0.07] rounded-full blur-2xl group-hover:opacity-[0.12] transition-opacity duration-500`} />
              <div className={`absolute -bottom-8 -left-8 w-24 h-24 bg-gradient-to-br ${cat.color} opacity-[0.04] rounded-full blur-xl`} />

              <div className="relative z-10">
                {/* Title row */}
                <div className="flex items-center gap-3 mb-3">
                  <div className={`w-10 h-10 rounded-lg bg-gradient-to-br ${cat.color} flex items-center justify-center shadow-lg ${cat.glowColor}`}>
                    <Icon className="w-5 h-5 text-white" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-display font-semibold text-sm sm:text-base text-foreground leading-tight">
                      {cat.title}
                    </h3>
                    {!showDefault && (
                      <p className="text-[10px] text-muted-foreground mt-0.5">
                        {items.length} item(ns) prescrito(s)
                      </p>
                    )}
                  </div>
                  <div className="flex items-center gap-1.5 shrink-0">
                    {hasViewable && (
                      <button
                        type="button"
                        onClick={() => setViewingCategory(cat.key)}
                        className={`inline-flex items-center justify-center w-8 h-8 rounded-lg bg-gradient-to-br ${cat.color} text-white shadow-md hover:shadow-lg hover:scale-105 transition-all duration-300`}
                        title={`Ver protocolo ${cat.title}`}
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                    )}
                    <IconSec className="w-5 h-5 text-muted-foreground/30" />
                  </div>
                </div>

                {/* Items - dynamic or default */}
                <div className="space-y-2 ml-[52px]">
                  {showDefault ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                      {cat.defaultItems.map((item, j) => (
                        <motion.div
                          key={j}
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          transition={{ delay: 0.4 + i * 0.15 + j * 0.08 }}
                          className="flex items-start gap-2"
                        >
                          <div className={`w-1.5 h-1.5 rounded-full bg-gradient-to-br ${cat.color} mt-1.5 shrink-0`} />
                          <span className="text-xs sm:text-sm text-muted-foreground font-body leading-snug">
                            {item}
                          </span>
                        </motion.div>
                      ))}
                    </div>
                  ) : (
                    items.slice(0, 3).map((item, j) => (
                      <motion.div
                        key={item.id}
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.3 + i * 0.1 + j * 0.06 }}
                        className={`rounded-lg border ${cat.borderAccent} ${cat.bgAccent} p-2.5 sm:p-3`}
                      >
                        <div className="flex items-center gap-2 mb-1">
                          <Pill className="w-3.5 h-3.5 text-foreground/70 shrink-0" />
                          <span className="font-display font-semibold text-xs sm:text-sm text-foreground">
                            {item.name}
                          </span>
                        </div>
                        <div className="grid grid-cols-2 gap-x-4 gap-y-0.5 text-[11px] sm:text-xs text-muted-foreground font-body pl-5.5">
                          {item.dosage && (
                            <span><strong className="text-foreground/80">Dose:</strong> {item.dosage}</span>
                          )}
                          {item.frequency && (
                            <span><strong className="text-foreground/80">Freq:</strong> {item.frequency}</span>
                          )}
                        </div>
                        {item.notes && (
                          <p className="text-[10px] sm:text-[11px] text-muted-foreground/80 mt-1 pl-5.5 italic font-body">
                            {item.notes}
                          </p>
                        )}
                      </motion.div>
                    ))
                  )}
                  {items.length > 3 && (
                    <button
                      type="button"
                      onClick={() => setViewingCategory(cat.key)}
                      className="text-xs text-primary hover:underline font-body"
                    >
                      +{items.length - 3} itens... ver todos
                    </button>
                  )}
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* Category Detail Dialog */}
      <Dialog open={!!viewingCategory} onOpenChange={(o) => !o && setViewingCategory(null)}>
        <DialogContent className="max-w-lg max-h-[85dvh] overflow-hidden !flex !flex-col">
          {viewingCatConfig && (
            <>
              <DialogHeader>
                <DialogTitle className="flex items-center gap-3 font-display">
                  <div className={`w-9 h-9 rounded-lg bg-gradient-to-br ${viewingCatConfig.color} flex items-center justify-center shadow-lg`}>
                    <viewingCatConfig.icon className="w-4.5 h-4.5 text-white" />
                  </div>
                  {viewingCatConfig.title}
                </DialogTitle>
              </DialogHeader>
              <div className="flex-1 min-h-0 overflow-y-auto space-y-4 pr-1">
                {/* Category text content */}
                {(() => {
                  const content = getCategoryContent(viewingCatConfig.key);
                  const hasText = content.replace(/<[^>]*>/g, "").trim().length > 0;
                  if (!hasText) return null;
                  return (
                    <div className={`rounded-xl border ${viewingCatConfig.borderAccent} ${viewingCatConfig.bgAccent} p-4`}>
                      <RichContentRenderer content={content} />
                    </div>
                  );
                })()}

                {/* Items */}
                {(groupedProtocols[viewingCatConfig.key] || []).map((item, j) => (
                  <motion.div
                    key={item.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: j * 0.05 }}
                    className={`rounded-xl border ${viewingCatConfig.borderAccent} ${viewingCatConfig.bgAccent} p-4`}
                  >
                    <div className="flex items-center gap-2.5 mb-2">
                      <Pill className="w-4 h-4 text-foreground/70 shrink-0" />
                      <span className="font-display font-bold text-sm text-foreground">
                        {item.name}
                      </span>
                    </div>
                    <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-xs text-muted-foreground font-body pl-6">
                      {item.dosage && (
                        <span><strong className="text-foreground/80">Dosagem:</strong> {item.dosage}</span>
                      )}
                      {item.frequency && (
                        <span><strong className="text-foreground/80">Frequência:</strong> {item.frequency}</span>
                      )}
                    </div>
                    {item.notes && (
                      <p className="text-[11px] text-muted-foreground/80 mt-2 pl-6 italic font-body leading-relaxed">
                        {item.notes}
                      </p>
                    )}
                  </motion.div>
                ))}

                {(groupedProtocols[viewingCatConfig.key] || []).length === 0 && !getCategoryContent(viewingCatConfig.key).replace(/<[^>]*>/g, "").trim() && (
                  <p className="text-sm text-muted-foreground text-center py-6 font-body">
                    Nenhum item prescrito nesta categoria.
                  </p>
                )}
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* Bottom note */}
      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1 }}
        className="text-center text-[11px] text-muted-foreground/60 font-body"
      >
        Protocolos individualizados com base na avaliação clínica e laboratorial do aluno.
      </motion.p>
    </div>
  );
};

export default ProtocolInfoPanel;
