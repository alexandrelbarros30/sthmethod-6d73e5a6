import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";
import { Heart, Zap, Check } from "lucide-react";
import { toast } from "@/hooks/use-toast";

const MOOD = [
  { v: 1, e: "😞", l: "Baixo" },
  { v: 2, e: "😕", l: "Fraco" },
  { v: 3, e: "😐", l: "Neutro" },
  { v: 4, e: "🙂", l: "Bom" },
  { v: 5, e: "😄", l: "Ótimo" },
];

const ENERGY = [
  { v: 1, e: "🔋", l: "Zerada" },
  { v: 2, e: "🪫", l: "Baixa" },
  { v: 3, e: "⚡", l: "Média" },
  { v: 4, e: "💪", l: "Alta" },
  { v: 5, e: "🚀", l: "Máxima" },
];

const todayISO = () => new Date().toISOString().slice(0, 10);

const DailyCheckinCard = () => {
  const { user } = useAuth();
  const [mood, setMood] = useState<number | null>(null);
  const [energy, setEnergy] = useState<number | null>(null);
  const [saved, setSaved] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user?.id) return;
    (async () => {
      const { data } = await supabase
        .from("daily_checkins")
        .select("mood, energy")
        .eq("user_id", user.id)
        .eq("checkin_date", todayISO())
        .maybeSingle();
      if (data) {
        setMood(data.mood);
        setEnergy(data.energy);
        setSaved(true);
      }
      setLoading(false);
    })();
  }, [user?.id]);

  const persist = async (nextMood: number | null, nextEnergy: number | null) => {
    if (!user?.id || nextMood == null || nextEnergy == null) return;
    const { error } = await supabase
      .from("daily_checkins")
      .upsert(
        { user_id: user.id, checkin_date: todayISO(), mood: nextMood, energy: nextEnergy },
        { onConflict: "user_id,checkin_date" }
      );
    if (error) {
      toast({ title: "Não foi possível salvar", description: error.message, variant: "destructive" });
      return;
    }
    setSaved(true);
    toast({ title: "Check-in registrado", description: "Obrigado por compartilhar." });
  };

  const pickMood = (v: number) => {
    setMood(v);
    if (energy != null) persist(v, energy);
  };
  const pickEnergy = (v: number) => {
    setEnergy(v);
    if (mood != null) persist(mood, v);
  };

  if (loading) return null;

  return (
    <div className="mb-6 rounded-3xl border border-border/40 bg-background overflow-hidden">
      <div className="p-6">
        <div className="flex items-center justify-between mb-5">
          <p className="text-[10px] font-medium tracking-[0.25em] uppercase text-muted-foreground flex items-center gap-1.5">
            <Heart className="w-3 h-3" /> Check-in de hoje
          </p>
          {saved && (
            <span className="inline-flex items-center gap-1 text-[10px] font-medium text-foreground/70">
              <Check className="w-3 h-3" /> registrado
            </span>
          )}
        </div>

        <div className="mb-5">
          <p className="text-[11px] text-muted-foreground mb-2.5 tracking-tight">Como está seu humor?</p>
          <div className="grid grid-cols-5 gap-1.5">
            {MOOD.map((m) => (
              <button
                key={m.v}
                onClick={() => pickMood(m.v)}
                className={cn(
                  "flex flex-col items-center justify-center gap-1 py-2.5 rounded-2xl border transition-all",
                  mood === m.v
                    ? "border-foreground bg-foreground/5 scale-[1.03]"
                    : "border-border/40 hover:border-border"
                )}
                aria-label={m.l}
              >
                <span className="text-xl leading-none">{m.e}</span>
                <span className="text-[9px] text-muted-foreground font-light">{m.l}</span>
              </button>
            ))}
          </div>
        </div>

        <div>
          <p className="text-[11px] text-muted-foreground mb-2.5 tracking-tight flex items-center gap-1">
            <Zap className="w-3 h-3" /> E sua energia?
          </p>
          <div className="grid grid-cols-5 gap-1.5">
            {ENERGY.map((m) => (
              <button
                key={m.v}
                onClick={() => pickEnergy(m.v)}
                className={cn(
                  "flex flex-col items-center justify-center gap-1 py-2.5 rounded-2xl border transition-all",
                  energy === m.v
                    ? "border-foreground bg-foreground/5 scale-[1.03]"
                    : "border-border/40 hover:border-border"
                )}
                aria-label={m.l}
              >
                <span className="text-xl leading-none">{m.e}</span>
                <span className="text-[9px] text-muted-foreground font-light">{m.l}</span>
              </button>
            ))}
          </div>
        </div>

        {(mood == null || energy == null) && (
          <p className="text-[10.5px] text-muted-foreground mt-4 tracking-tight">
            Toque em uma opção de cada linha para salvar automaticamente.
          </p>
        )}
      </div>
    </div>
  );
};

export default DailyCheckinCard;