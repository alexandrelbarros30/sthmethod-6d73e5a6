import DashboardLayout from "@/components/DashboardLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Clock, Flame, ChevronLeft, Target, Utensils, ArrowRightLeft, Lightbulb, Rocket } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { recipes, recipeCategories, type Recipe } from "@/data/recipes";

const objectiveColor: Record<string, string> = {
  Emagrecimento: "text-green-400",
  Hipertrofia: "text-blue-400",
  Manutenção: "text-amber-400",
  Definição: "text-purple-400",
};

const RecipeDetailModal = ({ recipe, onClose }: { recipe: Recipe; onClose: () => void }) => {
  const objectives = recipe.objetivo.split("/").map((o) => o.trim());

  return (
    <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto p-0 gap-0">
      {/* Hero image */}
      <div className="relative aspect-[16/10]">
        <img src={recipe.image} alt={recipe.title} className="w-full h-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/30 to-transparent" />
        <div className="absolute bottom-4 left-4 right-4">
          <DialogHeader>
            <DialogTitle className="text-white text-lg font-bold tracking-tight">{recipe.title}</DialogTitle>
          </DialogHeader>
          <div className="flex items-center gap-3 mt-1.5 text-white/70 text-xs">
            <span className="flex items-center gap-1"><Clock className="w-3 h-3" /> {recipe.time}</span>
            <span className="flex items-center gap-1"><Flame className="w-3 h-3" /> {recipe.kcal} kcal</span>
          </div>
          <div className="flex flex-wrap gap-1.5 mt-2">
            {recipe.tags.map((tag) => (
              <Badge key={tag} className="text-[9px] bg-white/10 backdrop-blur-sm text-white border-white/20">{tag}</Badge>
            ))}
          </div>
        </div>
      </div>

      <div className="p-4 space-y-5">
        {/* Objetivo */}
        <SectionBlock icon={<Target className="w-4 h-4 text-primary" />} title="Objetivo">
          <div className="flex gap-2">
            {objectives.map((obj) => (
              <span key={obj} className={`text-sm font-bold ${objectiveColor[obj] || "text-primary"}`}>
                {obj}
              </span>
            ))}
          </div>
        </SectionBlock>

        {/* Composição Base */}
        <SectionBlock icon={<Utensils className="w-4 h-4 text-primary" />} title="Composição Base">
          <ul className="space-y-1.5">
            {recipe.ingredients.map((ing, i) => (
              <li key={i} className="text-xs text-muted-foreground flex items-start gap-2 leading-relaxed">
                <span className="w-1.5 h-1.5 rounded-full bg-primary mt-1.5 shrink-0" />
                {ing}
              </li>
            ))}
          </ul>
        </SectionBlock>

        {/* Preparo */}
        <SectionBlock icon={<Flame className="w-4 h-4 text-orange-400" />} title="Preparo Simples">
          <div className="space-y-2">
            {recipe.instructions.split("\n").map((step, i) => (
              <p key={i} className="text-xs text-muted-foreground leading-relaxed">{step}</p>
            ))}
          </div>
        </SectionBlock>

        {/* Substituições */}
        <SectionBlock icon={<ArrowRightLeft className="w-4 h-4 text-blue-400" />} title="Substituições Inteligentes">
          <ul className="space-y-1.5">
            {recipe.substituicoes.map((sub, i) => (
              <li key={i} className="text-xs text-muted-foreground flex items-start gap-2 leading-relaxed">
                <span className="text-blue-400 font-bold shrink-0">↔</span>
                {sub}
              </li>
            ))}
          </ul>
        </SectionBlock>

        {/* Ajuste Estratégico */}
        <SectionBlock icon={<Lightbulb className="w-4 h-4 text-amber-400" />} title="Ajuste Estratégico">
          <p className="text-xs text-muted-foreground leading-relaxed">{recipe.ajusteEstrategico}</p>
        </SectionBlock>

        {/* Dica Prática */}
        <div className="rounded-xl bg-primary/8 border border-primary/15 p-3">
          <div className="flex items-center gap-2 mb-1.5">
            <Rocket className="w-4 h-4 text-primary" />
            <span className="text-xs font-bold text-primary uppercase tracking-wider">Dica Prática</span>
          </div>
          <p className="text-xs text-foreground leading-relaxed">{recipe.dicaPratica}</p>
        </div>

        <button
          onClick={onClose}
          className="w-full py-2.5 rounded-xl bg-muted/30 hover:bg-muted/50 text-muted-foreground hover:text-foreground text-xs font-medium transition-all"
        >
          Fechar receita
        </button>
      </div>
    </DialogContent>
  );
};

const SectionBlock = ({ icon, title, children }: { icon: React.ReactNode; title: string; children: React.ReactNode }) => (
  <div>
    <div className="flex items-center gap-2 mb-2">
      {icon}
      <span className="text-[10px] font-bold text-foreground uppercase tracking-wider">{title}</span>
    </div>
    {children}
  </div>
);

const StudentRecipes = () => {
  const navigate = useNavigate();
  const [filter, setFilter] = useState("Todos");
  const [selected, setSelected] = useState<Recipe | null>(null);

  const base = filter === "Todos" ? recipes : recipes.filter((r) => r.category === filter);
  const filtered = [...base].sort((a, b) => Number(!!b.isNew) - Number(!!a.isNew));

  return (
    <DashboardLayout role="student" title="Receitas Saudáveis" subtitle="Decisões alimentares guiadas">
      <Button variant="ghost" size="sm" className="mb-4 gap-1 text-muted-foreground" onClick={() => navigate("/dashboard/content")}>
        <ChevronLeft className="w-4 h-4" /> Voltar ao conteúdo
      </Button>

      <div className="flex gap-2 overflow-x-auto pb-3 mb-4 scrollbar-hide">
        {recipeCategories.map((cat) => (
          <button
            key={cat}
            onClick={() => setFilter(cat)}
            className={`px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-colors ${
              filter === cat
                ? "bg-primary text-primary-foreground"
                : "bg-muted text-muted-foreground hover:bg-muted/80"
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-2 gap-3">
        {filtered.map((recipe) => (
          <Card
            key={recipe.id}
            className="overflow-hidden cursor-pointer group hover:shadow-lg transition-all border-border/50"
            onClick={() => setSelected(recipe)}
          >
            <div className="relative aspect-square overflow-hidden">
              <img
                src={recipe.image}
                alt={recipe.title}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                loading="lazy"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent" />
              <div className="absolute bottom-2 left-2 right-2">
                <p className="text-white text-xs font-bold leading-tight">{recipe.title}</p>
              </div>
              <Badge className="absolute top-2 right-2 text-[9px] bg-black/50 backdrop-blur-sm text-white border-0">
                {recipe.category}
              </Badge>
              {recipe.isNew && (
                <Badge className="absolute top-2 left-2 text-[9px] bg-primary text-primary-foreground border-0 font-bold tracking-wider animate-pulse">
                  NOVO
                </Badge>
              )}
            </div>
            <CardContent className="p-2.5">
              <div className="flex items-center justify-between text-[10px] text-muted-foreground">
                <span className="flex items-center gap-1"><Clock className="w-3 h-3" /> {recipe.time}</span>
                <span className="flex items-center gap-1"><Flame className="w-3 h-3" /> {recipe.kcal} kcal</span>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Dialog open={!!selected} onOpenChange={() => setSelected(null)}>
        {selected && <RecipeDetailModal recipe={selected} onClose={() => setSelected(null)} />}
      </Dialog>
    </DashboardLayout>
  );
};

export default StudentRecipes;
