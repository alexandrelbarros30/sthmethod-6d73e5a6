import { useCallback, useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import AiShell from "@/components/ai/AiShell";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { AI_MODULES, AiKind, daysLeftInCycle, latestOf, useAiApp } from "@/hooks/useAiApp";
import { useAiProgress, todayISO } from "@/hooks/useAiProgress";
import { useWorkoutReminder, ensureNotificationPermission } from "@/hooks/useWorkoutReminder";
import { useAiReminders, ReminderItem } from "@/hooks/useAiReminders";
import { parseMeals } from "@/components/ai/AiDietPlan";
import { useAiOffer, useAiInsight } from "@/hooks/useAiGrowth";
import AiOfferCard from "@/components/ai/AiOfferCard";
import AiHydrationCard from "@/components/ai/AiHydrationCard";
import AiNextMealCard from "@/components/ai/AiNextMealCard";
import AiWorkoutReminderCard from "@/components/ai/AiWorkoutReminderCard";
import AiHealthMetricCard from "@/components/ai/AiHealthMetricCard";
import ProfileAvatar from "@/components/shared/ProfileAvatar";
import { useAiWidgets, type WidgetMeta } from "@/hooks/useAiWidgets";
import { useAiHomeStyle, AI_HOME_STYLES } from "@/hooks/useAiHomeStyle";
import {
  Loader2,
  ArrowRight,
  ArrowUpRight,
  Sparkles,
  ShieldCheck,
  Flame,
  HeartPulse,
  UserRound,
  UtensilsCrossed,
  Scale,
  BrainCircuit,
  Camera,
} from "lucide-react";
import { LayoutGrid, RotateCcw, Check, Repeat, GripVertical, Minus, Plus } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  DndContext,
  DragEndEvent,
  PointerSensor,
  TouchSensor,
  closestCenter,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import {
  SortableContext,
  arrayMove,
  rectSortingStrategy,
  useSortable,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

const WIDGET_META: WidgetMeta[] = [
  { id: "next-meal", label: "Refeição de agora" },
  { id: "workout", label: "Treino do dia" },
  { id: "streak", label: "Constância" },
  { id: "hydration", label: "Hidratação" },
  { id: "weight", label: "Peso atual" },
  { id: "insight", label: "Leitura preditiva" },
  { id: "mod-diet", label: "Cardápio" },
  { id: "mod-workout", label: "Treino" },
  { id: "mod-analysis", label: "Análise" },
  { id: "images", label: "Imagens corporais" },
  { id: "/ai/app/diario", label: "Diário alimentar" },
  { id: "/ai/app/saude", label: "Saúde e wearables" },
  { id: "/ai/app/coaches", label: "Coaches humanos" },
  { id: "health-steps", label: "Passos", defaultHidden: true },
  { id: "health-kcal", label: "Kcal ativas", defaultHidden: true },
  { id: "health-hr", label: "FC de repouso", defaultHidden: true },
  { id: "health-sleep", label: "Sono", defaultHidden: true },
];

/** Assunto de cada widget: usado para agrupar a troca e a galeria por tema. */
const WIDGET_GROUP: Record<string, string> = {
  "next-meal": "Nutrição",
  "mod-diet": "Nutrição",
  "/ai/app/diario": "Nutrição",
  hydration: "Nutrição",
  workout: "Treino",
  "mod-workout": "Treino",
  streak: "Progresso",
  weight: "Progresso",
  images: "Progresso",
  insight: "Inteligência",
  "mod-analysis": "Inteligência",
  "/ai/app/coaches": "Inteligência",
  "/ai/app/saude": "Saúde e wearables",
  "health-steps": "Saúde e wearables",
  "health-kcal": "Saúde e wearables",
  "health-hr": "Saúde e wearables",
  "health-sleep": "Saúde e wearables",
};

const GROUP_ORDER = ["Saúde e wearables", "Nutrição", "Treino", "Progresso", "Inteligência", "Outros"];

const groupOf = (id: string) => WIDGET_GROUP[id] ?? "Outros";

/** Agrupa ids por assunto, preservando a ordem de GROUP_ORDER. */
const byGroup = (ids: string[]) =>
  GROUP_ORDER.map((g) => [g, ids.filter((id) => groupOf(id) === g)] as const).filter(([, list]) => list.length > 0);

const ROUTES: Record<AiKind, string> = {
  diet: "/ai/app/cardapio",
  workout: "/ai/app/treino",
  analysis: "/ai/app/analise",
};

const labelOf = (id: string) => WIDGET_META.find((w) => w.id === id)?.label ?? id;

const tile =
  "group relative overflow-hidden rounded-3xl border border-border/70 bg-card p-4 shadow-sm transition-all duration-300 hover:-translate-y-0.5 hover:border-ocean-teal/40 hover:shadow-[0_18px_50px_-30px_hsl(var(--ocean-teal)/0.75)] sm:rounded-[2rem] sm:p-5";

const Ring = ({ pct, size = 104, stroke = 9 }: { pct: number; size?: number; stroke?: number }) => {
  const radius = (size - stroke) / 2;
  const c = 2 * Math.PI * radius;
  const clamped = Math.max(0, Math.min(100, pct));
  return (
    <svg width={size} height={size} className="-rotate-90 shrink-0" aria-hidden>
      <circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke="hsl(var(--ocean-teal))" strokeWidth={stroke} opacity={0.12} />
      <circle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        fill="none"
        stroke="hsl(var(--ocean-teal))"
        strokeWidth={stroke}
        strokeLinecap="round"
        strokeDasharray={c}
        strokeDashoffset={c - (clamped / 100) * c}
        className="transition-all duration-700 ease-out"
      />
    </svg>
  );
};

const MicroLabel = ({ children }: { children: React.ReactNode }) => (
  <span className="block text-[10px] font-bold uppercase leading-tight tracking-[0.12em] text-muted-foreground">
    {children}
  </span>
);

/** Card arrastável no modo edição (fora do componente para não perder o estado). */
function SortableTile({
  id,
  span,
  onRemove,
  onSwap,
  swappable,
  children,
}: {
  id: string;
  span: string;
  onRemove: () => void;
  onSwap: (withId: string) => void;
  swappable: string[];
  children: React.ReactNode;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id });
  return (
    <div
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition }}
      className={`relative flex ${span} touch-none ${isDragging ? "z-20 opacity-90" : ""}`}
    >
      <div
        className={`relative w-full overflow-hidden rounded-3xl ring-2 ring-dashed ring-ocean-teal/40 sm:rounded-[2rem] ${
          isDragging ? "shadow-[0_24px_60px_-24px_hsl(var(--ocean-teal)/0.8)]" : ""
        }`}
      >
        <div className="pointer-events-none select-none [&_*]:pointer-events-none [&>*]:h-full [&>*]:w-full">
          {children}
        </div>

        <div className="absolute inset-0 flex flex-col justify-between bg-background/45 p-2 backdrop-blur-[1px]">
          <div className="flex items-start justify-between gap-2">
            <button
              type="button"
              {...attributes}
              {...listeners}
              aria-label={`Arrastar ${labelOf(id)}`}
              className="inline-flex cursor-grab items-center gap-1 rounded-full bg-card/95 px-2.5 py-1 text-[11px] font-semibold text-foreground shadow-sm active:cursor-grabbing"
            >
              <GripVertical className="h-3.5 w-3.5 text-muted-foreground" /> Arrastar
            </button>
            <button
              type="button"
              onClick={onRemove}
              aria-label={`Remover ${labelOf(id)}`}
              className="grid h-7 w-7 place-items-center rounded-full bg-destructive text-destructive-foreground shadow-sm"
            >
              <Minus className="h-4 w-4" />
            </button>
          </div>

          <div className="flex items-end justify-between gap-2">
            <span className="truncate rounded-full bg-card/95 px-2.5 py-1 text-[11px] font-semibold shadow-sm">
              {labelOf(id)}
            </span>
            {swappable.length > 0 && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button
                    type="button"
                    className="inline-flex items-center gap-1 rounded-full bg-card/95 px-2.5 py-1 text-[11px] font-semibold shadow-sm"
                  >
                    <Repeat className="h-3.5 w-3.5 text-muted-foreground" /> Trocar
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="max-h-72 overflow-auto">
                  {byGroup(swappable).map(([group, list]) => (
                    <div key={group}>
                      <DropdownMenuLabel className="text-[10px] uppercase tracking-[0.12em] text-muted-foreground">
                        {group}
                      </DropdownMenuLabel>
                      {list.map((other) => (
                        <DropdownMenuItem key={other} onSelect={() => onSwap(other)}>
                          {labelOf(other)}
                        </DropdownMenuItem>
                      ))}
                    </div>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function AiDashboard() {
  const { profile, subscription, generations, loading, user } = useAiApp();
  const { streak, today, last7, measurements, saveCheckin, setWorkoutDone } = useAiProgress();
  const { offer, dismiss } = useAiOffer();
  const { insight } = useAiInsight();
  const navigate = useNavigate();
  const { ordered, hidden, toggle, replace, reset, setOrderIds } = useAiWidgets(WIDGET_META);
  const { style, setStyle, slotSpan, gridClass } = useAiHomeStyle();
  const [editing, setEditing] = useState(false);
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 120, tolerance: 8 } }),
  );

  const onDragEnd = useCallback(
    (e: DragEndEvent) => {
      const { active, over } = e;
      if (!over || active.id === over.id) return;
      const visible = ordered.filter((x) => !hidden.has(x));
      const from = visible.indexOf(String(active.id));
      const to = visible.indexOf(String(over.id));
      if (from < 0 || to < 0) return;
      const moved = arrayMove(visible, from, to);
      let k = 0;
      setOrderIds(ordered.map((id) => (hidden.has(id) ? id : moved[k++])));
    },
    [ordered, hidden, setOrderIds],
  );

  const visibleIds = useMemo(() => ordered.filter((x) => !hidden.has(x)), [ordered, hidden]);
  const hiddenIds = useMemo(() => ordered.filter((x) => hidden.has(x)), [ordered, hidden]);

  useEffect(() => {
    if (loading) return;
    if (!user) navigate("/ai/login?next=/ai/app");
    else if (!profile?.phase1_complete) navigate("/ai/onboarding");
  }, [loading, user, profile, navigate]);

  const markWorkoutDone = useCallback(async () => {
    await saveCheckin({
      diet_done: today?.diet_done ?? false,
      water_done: today?.water_done ?? false,
      workout_done: true,
    });
    toast.success(`Treino registrado em ${new Date().toLocaleDateString("pt-BR")} no seu histórico.`);
  }, [saveCheckin, today]);

  const undoWorkout = useCallback(async () => {
    await setWorkoutDone(todayISO(), false);
    toast("Registro desfeito. O treino de hoje voltou para pendente.");
  }, [setWorkoutDone]);

  // Lembrete no horário do treino: notificação do sistema + prompt na tela.
  useEffect(() => {
    void ensureNotificationPermission();
  }, []);

  const remind = useCallback(() => {
    toast("Hora do treino", {
      description: "Conclua a sessão e marque seu check-in como realizado.",
      duration: 15000,
      action: { label: "Realizado", onClick: () => void markWorkoutDone() },
    });
  }, [markWorkoutDone]);

  useWorkoutReminder({
    enabled: !!user && !!latestOf(generations, "workout"),
    alreadyDone: !!today?.workout_done,
    dateISO: todayISO(),
    onRemind: remind,
  });

  // Notificações push locais: treino (aviso prévio + início) e cada refeição do cardápio.
  const workoutDone = !!today?.workout_done;
  const dietGen = latestOf(generations, "diet");
  const workoutGen = latestOf(generations, "workout");
  const reminderItems = useMemo<ReminderItem[]>(() => {
    const items: ReminderItem[] = [];
    if (workoutGen && !workoutDone) {
      items.push({
        id: "workout",
        time: "18:00",
        title: "Hora do treino",
        body: "Abra o treino guiado e marque como realizado ao terminar.",
        url: "/ai/app/treino",
        leadMinutes: 15,
        onFire: () => remind(),
      });
    }
    if (dietGen) {
      for (const meal of parseMeals(dietGen.content)) {
        if (!meal.time) continue;
        items.push({
          id: `meal-${meal.name}`,
          time: meal.time,
          title: `${meal.name} · ${meal.time}`,
          body: `${meal.kcal} kcal · P ${meal.protein}g · C ${meal.carbs}g · G ${meal.fat}g`,
          url: "/ai/app/cardapio",
          leadMinutes: 10,
        });
      }
    }
    return items;
  }, [dietGen, workoutGen, workoutDone, remind]);

  useAiReminders(reminderItems, { enabled: !!user, dateISO: todayISO() });

  if (loading) {
    return (
      <div className="grid min-h-screen place-items-center bg-background">
        <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const firstName = (profile?.full_name ?? "").split(" ")[0] || "atleta";
  const adherence7 = last7.filter((d) => d.done).length;
  const adherencePct = Math.round((adherence7 / 7) * 100);
  const weight = measurements?.[0]?.weight_kg ?? profile?.weight_kg ?? null;
  const prevWeight = measurements?.[1]?.weight_kg ?? null;
  const weightDelta = weight != null && prevWeight != null ? Number((weight - prevWeight).toFixed(1)) : null;
  const insightText =
    insight?.content
      ?.replace(/```[\s\S]*?```/g, " ")
      .replace(/<[^>]+>/g, " ")
      .replace(/^\s{0,3}#{1,6}\s*/gm, "")
      .replace(/^\s{0,3}>\s?/gm, "")
      .replace(/^\s{0,3}([-*+]|\d+\.)\s+/gm, "")
      .replace(/^\s*([-*_]\s*){3,}\s*$/gm, " ")
      .replace(/!\[[^\]]*\]\([^)]*\)/g, " ")
      .replace(/\[([^\]]+)\]\([^)]*\)/g, "$1")
      .replace(/(\*\*\*|\*\*|__|[*_~`])/g, "")
      .replace(/&nbsp;/gi, " ")
      .replace(/\s+/g, " ")
      .trim() ?? "";

  const SHORTCUTS = [
          { to: "/ai/app/diario", label: "Diário alimentar", hint: "registre refeições e água", icon: UtensilsCrossed },
          { to: "/ai/app/saude", label: "Saúde e wearables", hint: "Galaxy Watch e Health Connect", icon: HeartPulse },
          { to: "/ai/app/coaches", label: "Coaches humanos", hint: "acompanhamento profissional", icon: UserRound },
        ];

  const moduleNode = (kind: AiKind) => {
          const mod = AI_MODULES[kind];
          const gen = latestOf(generations, kind);
          const left = daysLeftInCycle(gen, mod.cycleDays);
          const dark = kind === "diet";
          return (
            <Link
              key={kind}
              to={ROUTES[kind]}
              className={`${tile} col-span-2 flex min-h-[10.5rem] flex-col justify-between sm:col-span-1 lg:col-span-2 ${
                dark ? "border-white/5 bg-ocean-mid text-white" : ""
              }`}
            >
              <div className="flex items-start justify-between gap-2">
                <span className={`grid h-10 w-10 place-items-center rounded-2xl text-lg ${dark ? "bg-white/10" : "bg-ocean-mint/15"}`}>
                  {mod.icon}
                </span>
                {gen ? (
                  <Badge
                    variant="secondary"
                    className={`text-[10px] ${dark ? "bg-ocean-mint/20 text-ocean-mint hover:bg-ocean-mint/20" : ""}`}
                  >
                    {left > 0 ? `${left}d restantes` : "Novo ciclo"}
                  </Badge>
                ) : (
                  <Badge variant="outline" className={`text-[10px] ${dark ? "border-white/20 text-white/80" : ""}`}>Novo</Badge>
                )}
              </div>
              <div className="mt-4">
                <h2 className="font-urbanist text-base font-bold tracking-tight">{mod.title}</h2>
                <p className={`mt-1 line-clamp-2 text-xs leading-snug sm:text-sm ${dark ? "text-white/60" : "text-muted-foreground"}`}>{mod.short}</p>
              </div>
              <div className="mt-4 flex items-center justify-between">
                <span className={`inline-flex items-center gap-1.5 text-xs font-semibold ${dark ? "text-ocean-mint" : "text-ocean-teal"}`}>
                  {gen ? "Abrir" : "Gerar agora"}
                  <Sparkles className="h-3.5 w-3.5 transition-transform group-hover:scale-110" />
                </span>
                {gen && (
                  <span className={`text-[10px] ${dark ? "text-white/50" : "text-muted-foreground"}`}>
                    revisões {gen.revisions}/{kind === "analysis" ? 1 : 3}
                  </span>
                )}
              </div>
            </Link>
          );
  };

  const shortcutNode = (s: (typeof SHORTCUTS)[number]) => (
          <Link key={s.to} to={s.to} className={`${tile} col-span-2 flex items-center justify-between gap-2 py-3.5 sm:col-span-1 lg:col-span-2`}>
            <span className="flex min-w-0 items-center gap-3">
              <span className="grid h-10 w-10 shrink-0 place-items-center rounded-2xl bg-ocean-mint/15 text-ocean-teal">
                <s.icon className="h-4 w-4" />
              </span>
              <span className="min-w-0">
                <span className="block truncate text-sm font-semibold">{s.label}</span>
                <span className="block truncate text-xs text-muted-foreground">{s.hint}</span>
              </span>
            </span>
            <ArrowRight className="h-4 w-4 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-0.5" />
          </Link>
  );

  const nodes: Record<string, React.ReactNode> = {
    "next-meal": <AiNextMealCard diet={latestOf(generations, "diet")} />,
    workout: (
      <AiWorkoutReminderCard
          workout={latestOf(generations, "workout")}
          done={!!today?.workout_done}
          doneAt={today?.workout_done ? today.checkin_date : null}
          onDone={markWorkoutDone}
          onUndo={undoWorkout}
        />
    ),
    streak: (
      <Link
          to="/ai/app/progresso"
          className={`${tile} col-span-2 flex flex-col justify-between lg:col-span-3`}
        >
          <div
            className="pointer-events-none absolute -right-16 -top-16 h-48 w-48 rounded-full bg-primary/10 blur-3xl transition-opacity duration-500 group-hover:opacity-80"
            aria-hidden
          />
          <div className="relative flex flex-wrap items-start justify-between gap-2">
            <span className="inline-flex min-w-0 items-center gap-1.5 rounded-full bg-ocean-mint/15 px-2.5 py-1 font-urbanist text-[10px] font-bold uppercase leading-tight tracking-[0.12em] text-ocean-teal">
              <Flame className="h-3 w-3 shrink-0" /> <span className="truncate">Constância</span>
            </span>
            <Badge variant={today ? "secondary" : "outline"} className="shrink-0 whitespace-nowrap text-[10px]">
              {today ? "Check-in feito" : "Pendente"}
            </Badge>
          </div>

          <div className="relative mt-4 flex flex-wrap items-center gap-4">
            <div className="relative grid shrink-0 place-items-center">
              <Ring pct={adherencePct} size={68} stroke={7} />
              <span className="absolute text-center">
                <span className="block text-lg font-semibold leading-none tracking-tight">{adherence7}</span>
                <span className="block text-[9px] text-muted-foreground">/7 dias</span>
              </span>
            </div>
            <div className="min-w-0 flex-1 basis-28">
              <p className="font-urbanist text-sm font-bold leading-tight tracking-tight text-ocean-deep">
                {streak > 0 ? `${streak} ${streak === 1 ? "dia" : "dias"} seguidos` : "Comece sua sequência hoje"}
              </p>
              <p className="mt-1 line-clamp-2 text-[11px] text-muted-foreground">
                {today ? "Tudo registrado por hoje." : "Registre seu dia em 5 segundos."}
              </p>
            </div>
          </div>

          <div className="relative mt-4 flex items-center gap-1.5">
            {last7.map((d, i) => (
              <span key={i} className={`h-1.5 flex-1 rounded-full transition-colors ${d.done ? "bg-ocean-teal" : "bg-muted"}`} />
            ))}
          </div>
        </Link>
    ),
    hydration: (
      <div className="col-span-2 lg:col-span-3">
          <AiHydrationCard />
        </div>
    ),
    weight: (
      <Link
          to="/ai/app/progresso"
          className={`${tile} col-span-2 flex items-center justify-between gap-3 border-ocean-mint/25 bg-ocean-mint/10 sm:col-span-1 lg:col-span-2`}
        >
          <div className="min-w-0 flex-1">
            <MicroLabel>Peso atual</MicroLabel>
            <p className="mt-1.5 font-urbanist text-2xl font-extrabold leading-none tracking-tight text-ocean-mid">
              {weight != null ? `${weight} kg` : "—"}
            </p>
            <p className="mt-1.5 line-clamp-2 text-xs leading-snug text-muted-foreground">
              {weightDelta != null
                ? `${weightDelta > 0 ? "+" : ""}${weightDelta} kg desde a última`
                : "registre suas medidas"}
            </p>
          </div>
          <span className="grid h-10 w-10 shrink-0 place-items-center rounded-2xl bg-background/70 text-ocean-teal">
            <Scale className="h-4.5 w-4.5" style={{ width: 18, height: 18 }} />
          </span>
        </Link>
    ),
    insight: (
      <Link
          to="/ai/app/progresso"
          className={`${tile} col-span-2 flex min-h-[9.5rem] flex-col justify-between border-transparent bg-gradient-to-br from-ocean-teal to-ocean-mint text-white shadow-lg shadow-ocean-teal/20 sm:col-span-1 lg:col-span-4`}
        >
          <div className="flex items-start justify-between gap-2">
            <span className="inline-flex min-w-0 items-center gap-1.5 font-urbanist text-[10px] font-bold uppercase leading-tight tracking-[0.12em] text-white/90">
              <BrainCircuit className="h-3.5 w-3.5 shrink-0" /> <span className="truncate">Leitura preditiva</span>
            </span>
            <ArrowUpRight className="h-4 w-4 shrink-0 text-white/70 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
          </div>
          <p className="mt-3 line-clamp-4 max-w-[70ch] text-sm font-light leading-relaxed tracking-[0.01em] text-white/90 sm:text-[15px] sm:leading-[1.7]">
            {insightText || "Registre alguns dias e a inteligência gera sua leitura de tendência automaticamente."}
          </p>
        </Link>
    ),
    ...Object.fromEntries((Object.keys(AI_MODULES) as AiKind[]).map((kind) => [`mod-${kind}`, moduleNode(kind)])),
    images: (
      <Link to="/ai/app/imagens" className={`${tile} col-span-2 flex min-h-[10.5rem] flex-col justify-between sm:col-span-1 lg:col-span-2`}>
          <div className="flex items-start justify-between gap-2">
            <span className="grid h-10 w-10 place-items-center rounded-2xl bg-ocean-mint/15 text-ocean-teal">
              <Camera className="h-5 w-5" />
            </span>
            <Badge variant="outline" className="text-[10px]">Evolução</Badge>
          </div>
          <div className="mt-4">
            <h2 className="font-urbanist text-base font-bold tracking-tight">Imagens corporais</h2>
            <p className="mt-1 line-clamp-2 text-xs leading-snug text-muted-foreground sm:text-sm">
              Envie fotos de evolução e compare sua transformação ao longo do ciclo.
            </p>
          </div>
          <div className="mt-4 flex items-center justify-between">
            <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-ocean-teal">
              Registrar
              <Sparkles className="h-3.5 w-3.5 transition-transform group-hover:scale-110" />
            </span>
          </div>
        </Link>
    ),
    ...Object.fromEntries(SHORTCUTS.map((s) => [s.to, shortcutNode(s)])),
    "health-steps": <AiHealthMetricCard metric="steps" />,
    "health-kcal": <AiHealthMetricCard metric="active_kcal" />,
    "health-hr": <AiHealthMetricCard metric="resting_hr" />,
    "health-sleep": <AiHealthMetricCard metric="sleep_minutes" />,
  };

  return (
    <AiShell title={`Olá, ${firstName}`} subtitle="Sua inteligência de nutrição, treino e evolução.">
      <Card className="mb-4 flex items-center gap-3 p-4">
        <ProfileAvatar size={52} onClick={() => navigate("/ai/app/perfil")} />
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold">{profile?.full_name || firstName}</p>
          <Link to="/ai/app/perfil" className="text-xs text-primary hover:underline">
            Alterar foto de perfil
          </Link>
        </div>
      </Card>

      {offer && (
        <div className="mb-4">
          <AiOfferCard offer={offer} onDismiss={dismiss} />
        </div>
      )}

      {!subscription && !offer && (
        <Card className="mb-4 flex flex-col gap-3 border-primary/30 bg-primary/5 p-5 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm font-semibold">Ative seu plano para gerar seus programas</p>
            <p className="mt-1 text-sm text-muted-foreground">A partir de R$ 39,90/mês, sem fidelidade.</p>
          </div>
          <Button asChild>
            <Link to="/ai/assinatura">Ver planos <ArrowRight className="ml-2 h-4 w-4" /></Link>
          </Button>
        </Card>
      )}

      <div className="mb-3 flex items-center justify-between gap-2">
        <p className="text-xs text-muted-foreground">
          {editing ? "Arraste os cards para organizar. Toque em − para remover e + para incluir." : "Sua tela inicial personalizada."}
        </p>
        <Button size="sm" variant={editing ? "default" : "outline"} onClick={() => setEditing((v) => !v)}>
          {editing ? <Check className="mr-2 h-4 w-4" /> : <LayoutGrid className="mr-2 h-4 w-4" />}
          {editing ? "Concluir" : "Editar widgets"}
        </Button>
      </div>

      <div className="mb-3 flex gap-2 overflow-x-auto pb-1">
        {AI_HOME_STYLES.map((s) => (
          <button
            key={s.id}
            type="button"
            onClick={() => setStyle(s.id)}
            aria-pressed={style === s.id}
            className={`min-w-0 shrink-0 rounded-2xl border px-3 py-2 text-left transition-colors ${
              style === s.id
                ? "border-ocean-teal/60 bg-ocean-mint/15 text-ocean-teal"
                : "border-border/70 bg-card text-muted-foreground hover:border-ocean-teal/40"
            }`}
          >
            <span className="block text-xs font-bold">{s.label}</span>
            <span className="block whitespace-nowrap text-[10px] opacity-80">{s.hint}</span>
          </button>
        ))}
      </div>

      {editing ? (
        <>
          <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={onDragEnd}>
            <SortableContext items={visibleIds} strategy={rectSortingStrategy}>
              <div className={gridClass}>
                {visibleIds.map((id, i) => (
                  <SortableTile
                    key={id}
                    id={id}
                    span={slotSpan(i)}
                    swappable={hiddenIds}
                    onRemove={() => toggle(id)}
                    onSwap={(other) => replace(id, other)}
                  >
                    {nodes[id]}
                  </SortableTile>
                ))}
              </div>
            </SortableContext>
          </DndContext>

          <div className="mt-4 rounded-3xl border border-border/70 bg-card/60 p-4 backdrop-blur-sm sm:p-5">
            <p className="text-sm font-semibold">Adicionar widget</p>
            <p className="mt-0.5 text-[11px] text-muted-foreground">
              Toque em + para incluir na tela. Escolha por assunto — em Saúde você tem passos, kcal ativas, FC e sono.
            </p>
            {hiddenIds.length === 0 ? (
              <p className="mt-3 text-xs text-muted-foreground">Todos os widgets já estão na sua tela inicial.</p>
            ) : (
              <div className="mt-3 space-y-3">
                {byGroup(hiddenIds).map(([group, list]) => (
                  <div key={group}>
                    <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-muted-foreground">{group}</p>
                    <div className="mt-1.5 flex flex-wrap gap-2">
                      {list.map((id) => (
                        <button
                          key={id}
                          type="button"
                          onClick={() => toggle(id)}
                          className="inline-flex items-center gap-1.5 rounded-full border border-ocean-teal/40 bg-ocean-mint/10 px-3 py-1.5 text-xs font-semibold text-ocean-teal transition-colors hover:bg-ocean-mint/20"
                        >
                          <Plus className="h-3.5 w-3.5" /> {labelOf(id)}
                        </button>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
            <div className="mt-4 flex items-center justify-between gap-2">
              <Button size="sm" variant="ghost" onClick={reset}>
                <RotateCcw className="mr-2 h-4 w-4" /> Restaurar padrão
              </Button>
              <Button size="sm" onClick={() => setEditing(false)}>
                <Check className="mr-2 h-4 w-4" /> Concluir
              </Button>
            </div>
          </div>
        </>
      ) : (
        <div className={gridClass}>
          {visibleIds.map((id, i) => (
            <div key={id} className={`ai-slot relative flex min-w-0 ${slotSpan(i)} [&>*]:h-full [&>*]:w-full`}>
              {nodes[id]}
            </div>
          ))}
        </div>
      )}

      <div className="mt-6 flex gap-3 rounded-2xl border border-border/40 bg-card/40 p-4 text-xs leading-relaxed text-muted-foreground sm:p-5">
        <ShieldCheck className="h-4 w-4 shrink-0 text-primary" />
        <p>
          O STH METHOD AI oferece orientação plena e suporte para o alcance do objetivo. Assuntos de substâncias, doses
          e protocolos terapêuticos são exclusivos do acompanhamento profissional da consultoria.
        </p>
      </div>
    </AiShell>
  );
}
