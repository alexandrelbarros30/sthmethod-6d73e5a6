import DashboardLayout from "@/components/DashboardLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Clock, Flame, ChevronLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

import recipePoke from "@/assets/recipe-poke.jpg";
import recipeFrango from "@/assets/recipe-frango.jpg";
import recipeAcai from "@/assets/recipe-acai.jpg";
import recipeSmoothie from "@/assets/recipe-smoothie.jpg";
import recipePanqueca from "@/assets/recipe-panqueca.jpg";
import recipeSalada from "@/assets/recipe-salada.jpg";

const recipes = [
  {
    id: "1", title: "Poke Bowl de Salmão", image: recipePoke, time: "20 min", kcal: 420, category: "Almoço",
    tags: ["Alto em Proteína", "Low Carb"],
    ingredients: ["150g salmão fresco em cubos", "100g arroz japonês cozido", "½ abacate fatiado", "50g edamame", "50g repolho roxo", "Gergelim e molho shoyu light"],
    instructions: "1. Cozinhe o arroz e reserve.\n2. Corte o salmão em cubos.\n3. Monte o bowl: arroz na base, salmão, abacate, edamame e repolho.\n4. Finalize com gergelim e molho shoyu light.",
  },
  {
    id: "2", title: "Frango Grelhado com Batata Doce", image: recipeFrango, time: "30 min", kcal: 380, category: "Almoço",
    tags: ["Alto em Proteína", "Pré-treino"],
    ingredients: ["200g peito de frango", "150g batata doce", "100g brócolis", "Azeite, sal e pimenta"],
    instructions: "1. Tempere o frango com sal, pimenta e azeite.\n2. Grelhe em fogo médio-alto por 6 min de cada lado.\n3. Cozinhe a batata doce no vapor por 15 min.\n4. Refogue o brócolis com um fio de azeite.",
  },
  {
    id: "3", title: "Açaí Bowl Proteico", image: recipeAcai, time: "10 min", kcal: 350, category: "Lanche",
    tags: ["Pós-treino", "Rico em Fibras"],
    ingredients: ["200g polpa de açaí sem açúcar", "1 banana", "30g granola", "Morangos e mirtilos", "1 scoop whey protein (opcional)"],
    instructions: "1. Bata o açaí com a banana e whey no liquidificador.\n2. Coloque na tigela.\n3. Decore com granola, morangos e mirtilos.",
  },
  {
    id: "4", title: "Smoothie Verde Detox", image: recipeSmoothie, time: "5 min", kcal: 180, category: "Café da manhã",
    tags: ["Detox", "Rico em Vitaminas"],
    ingredients: ["1 xícara de espinafre", "1 banana", "1 kiwi", "1 colher de chia", "200ml água de coco"],
    instructions: "1. Coloque todos os ingredientes no liquidificador.\n2. Bata até ficar homogêneo.\n3. Sirva gelado.",
  },
  {
    id: "5", title: "Panqueca Proteica", image: recipePanqueca, time: "15 min", kcal: 290, category: "Café da manhã",
    tags: ["Alto em Proteína", "Pré-treino"],
    ingredients: ["2 ovos", "1 banana madura", "30g aveia", "1 scoop whey", "Frutas vermelhas para decorar"],
    instructions: "1. Bata os ovos, banana, aveia e whey no liquidificador.\n2. Despeje em frigideira antiaderente.\n3. Doure dos dois lados.\n4. Decore com frutas vermelhas e mel.",
  },
  {
    id: "6", title: "Salada de Salmão e Quinoa", image: recipeSalada, time: "25 min", kcal: 400, category: "Jantar",
    tags: ["Rico em Ômega-3", "Low Carb"],
    ingredients: ["150g salmão grelhado", "80g quinoa cozida", "Mix de folhas verdes", "Tomate cereja", "½ abacate", "Azeite e limão"],
    instructions: "1. Grelhe o salmão temperado com sal e limão.\n2. Cozinhe a quinoa conforme instruções.\n3. Monte a salada com folhas, tomate e abacate.\n4. Coloque o salmão e a quinoa por cima.\n5. Regue com azeite e limão.",
  },
];

const categories = ["Todos", "Café da manhã", "Almoço", "Lanche", "Jantar"];

const StudentRecipes = () => {
  const navigate = useNavigate();
  const [filter, setFilter] = useState("Todos");
  const [selected, setSelected] = useState<typeof recipes[0] | null>(null);

  const filtered = filter === "Todos" ? recipes : recipes.filter((r) => r.category === filter);

  return (
    <DashboardLayout role="student" title="Receitas Saudáveis" subtitle="Inspire-se para suas refeições">
      <Button variant="ghost" size="sm" className="mb-4 gap-1 text-muted-foreground" onClick={() => navigate("/dashboard")}>
        <ChevronLeft className="w-4 h-4" /> Voltar
      </Button>

      {/* Category filters */}
      <div className="flex gap-2 overflow-x-auto pb-3 mb-4 scrollbar-hide">
        {categories.map((cat) => (
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

      {/* Recipe grid */}
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

      {/* Recipe detail modal */}
      <Dialog open={!!selected} onOpenChange={() => setSelected(null)}>
        <DialogContent className="max-w-md max-h-[85vh] overflow-y-auto p-0">
          {selected && (
            <>
              <div className="relative aspect-video">
                <img src={selected.image} alt={selected.title} className="w-full h-full object-cover" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent" />
                <div className="absolute bottom-4 left-4 right-4">
                  <DialogHeader>
                    <DialogTitle className="text-white text-lg">{selected.title}</DialogTitle>
                  </DialogHeader>
                  <div className="flex items-center gap-3 mt-2 text-white/80 text-xs">
                    <span className="flex items-center gap-1"><Clock className="w-3 h-3" /> {selected.time}</span>
                    <span className="flex items-center gap-1"><Flame className="w-3 h-3" /> {selected.kcal} kcal</span>
                  </div>
                </div>
              </div>
              <div className="p-4 space-y-4">
                <div className="flex flex-wrap gap-1.5">
                  {selected.tags.map((tag) => (
                    <Badge key={tag} variant="secondary" className="text-[10px]">{tag}</Badge>
                  ))}
                </div>
                <div>
                  <h3 className="text-sm font-bold text-foreground mb-2">Ingredientes</h3>
                  <ul className="space-y-1">
                    {selected.ingredients.map((ing, i) => (
                      <li key={i} className="text-xs text-muted-foreground flex items-start gap-2">
                        <span className="w-1.5 h-1.5 rounded-full bg-primary mt-1.5 shrink-0" />
                        {ing}
                      </li>
                    ))}
                  </ul>
                </div>
                <div>
                  <h3 className="text-sm font-bold text-foreground mb-2">Modo de Preparo</h3>
                  <p className="text-xs text-muted-foreground whitespace-pre-line leading-relaxed">{selected.instructions}</p>
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
};

export default StudentRecipes;
