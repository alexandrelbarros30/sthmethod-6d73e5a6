import { useEffect, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { TrendingUp, TrendingDown, Minus, ImageOff } from "lucide-react";
import type { EvolutionSnapshot } from "@/lib/evolution-snapshot";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import EvolutionCharts from "./EvolutionCharts";
import SignedImage from "./SignedImage";
import { extractStoragePath } from "@/lib/secure-file-url";

interface Props {
  userId: string;
}

const fmt = (n: number | null | undefined, suffix = "", digits = 1) =>
  n === null || n === undefined ? "—" : `${Number(n).toFixed(digits)}${suffix}`;

function Delta({ before, after, suffix = "", invertColor = false }: { before: number | null; after: number | null; suffix?: string; invertColor?: boolean }) {
  if (before === null || after === null || before === undefined || after === undefined) {
    return <span className="text-xs text-muted-foreground">—</span>;
  }
  const diff = Number(after) - Number(before);
  if (Math.abs(diff) < 0.05) {
    return (
      <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
        <Minus className="w-3 h-3" /> sem variação
      </span>
    );
  }
  const positive = diff > 0;
  // invertColor: para peso/gordura, perda (negativo) é "bom" => verde
  const isGood = invertColor ? !positive : positive;
  const color = isGood ? "text-emerald-500" : "text-rose-500";
  const Icon = positive ? TrendingUp : TrendingDown;
  return (
    <span className={`inline-flex items-center gap-1 text-xs font-medium ${color}`}>
      <Icon className="w-3 h-3" />
      {positive ? "+" : ""}
      {diff.toFixed(1)}
      {suffix}
    </span>
  );
}

function PhotoCell({ url, label }: { url: string | null; label: string }) {
  const storagePath = extractStoragePath(url, "body-images");
  return (
    <div className="flex flex-col items-center gap-1">
      <div className="aspect-[3/4] w-full rounded-md overflow-hidden bg-muted/40 border border-border/50 flex items-center justify-center">
        {url ? (
          <SignedImage bucket="body-images" storagePath={storagePath} publicUrl={url} alt={label} className="w-full h-full object-cover" />
        ) : (
          <ImageOff className="w-6 h-6 text-muted-foreground" />
        )}
      </div>
      <span className="text-[10px] text-muted-foreground uppercase tracking-wide">{label}</span>
    </div>
  );
}

const EvolutionComparison = ({ userId }: Props) => {
  const { data: snapshots = [], isLoading } = useQuery({
    queryKey: ["evolution-snapshots-with-current", userId],
    queryFn: async () => {
      const [snapsRes, profileRes, weightRes, imagesRes, bioRes] = await Promise.all([
        supabase
          .from("evolution_snapshots")
          .select("*")
          .eq("user_id", userId)
          .order("created_at", { ascending: true }),
        supabase
          .from("profiles")
          .select(
            "weight, bmr, tdee, daily_calories, protein_g, carbs_g, fat_g, activity_type, does_cardio, physical_activity_level, training_days_per_week, training_duration_minutes, training_intensity, cardio_days_per_week, cardio_duration_minutes, cardio_intensity"
          )
          .eq("user_id", userId)
          .maybeSingle(),
        supabase
          .from("weight_logs")
          .select("weight, logged_at")
          .eq("user_id", userId)
          .order("logged_at", { ascending: false })
          .limit(1)
          .maybeSingle(),
        supabase
          .from("body_images")
          .select("type, image_url, storage_path")
          .eq("user_id", userId)
          .eq("is_current", true),
        supabase
          .from("bioimpedance_logs")
          .select("body_fat_pct, lean_mass_kg, fat_mass_kg, logged_at")
          .eq("user_id", userId)
          .order("logged_at", { ascending: false })
          .limit(1)
          .maybeSingle(),
      ]);
      if (snapsRes.error) throw snapsRes.error;
      const list = (snapsRes.data || []) as EvolutionSnapshot[];

      const p: any = profileRes.data || {};
      const w: any = weightRes.data || {};
      const imgs: any[] = imagesRes.data || [];
      const bio: any = bioRes.data || {};
      const frontImg = imgs.find((i) => i.type === "front");
      const backImg = imgs.find((i) => i.type === "back");
      const profileImg = imgs.find((i) => i.type === "profile");
      const front = frontImg?.storage_path || frontImg?.image_url || null;
      const back = backImg?.storage_path || backImg?.image_url || null;
      const profilePic = profileImg?.storage_path || profileImg?.image_url || null;

      const currentWeight = w.weight ?? p.weight ?? null;
      const hasAnyCurrent =
        currentWeight !== null ||
        p.daily_calories !== null ||
        front || back || profilePic ||
        bio.body_fat_pct !== null;

      if (hasAnyCurrent) {
        const virtual: EvolutionSnapshot = {
          id: "__current__",
          created_at: new Date().toISOString(),
          source: "atual",
          notes: "",
          weight: currentWeight,
          bmr: p.bmr ?? null,
          tdee: p.tdee ?? null,
          daily_calories: p.daily_calories ?? null,
          protein_g: p.protein_g ?? null,
          carbs_g: p.carbs_g ?? null,
          fat_g: p.fat_g ?? null,
          activity_type: p.activity_type ?? null,
          does_cardio: p.does_cardio ?? null,
          physical_activity_level: p.physical_activity_level ?? null,
          training_days_per_week: p.training_days_per_week ?? null,
          training_duration_minutes: p.training_duration_minutes ?? null,
          training_intensity: p.training_intensity ?? null,
          cardio_days_per_week: p.cardio_days_per_week ?? null,
          cardio_duration_minutes: p.cardio_duration_minutes ?? null,
          cardio_intensity: p.cardio_intensity ?? null,
          body_image_front_url: front,
          body_image_back_url: back,
          body_image_profile_url: profilePic,
          body_fat_pct: bio.body_fat_pct ?? null,
          lean_mass_kg: bio.lean_mass_kg ?? null,
          fat_mass_kg: bio.fat_mass_kg ?? null,
        };
        list.push(virtual);
      }
      return list;
    },
    enabled: !!userId,
  });

  // Fotos "Antes/Depois" vêm SEMPRE da galeria real de fotos corporais,
  // agrupadas por sessão de upload (janela de 10 min). A última sessão é
  // "Depois" (atual) e a penúltima é "Antes" (envio anterior).
  const { data: gallerySessions = [] } = useQuery({
    queryKey: ["evolution-photo-sessions", userId],
    enabled: !!userId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("body_images")
        .select("type, image_url, storage_path, uploaded_at")
        .eq("user_id", userId)
        .order("uploaded_at", { ascending: false });
      if (error) throw error;
      const SESSION_WINDOW_MS = 10 * 60 * 1000;
      const sessions: { anchor: number; images: any[] }[] = [];
      for (const img of data || []) {
        const t = new Date(img.uploaded_at).getTime();
        const last = sessions[sessions.length - 1];
        if (!last || Math.abs(last.anchor - t) > SESSION_WINDOW_MS) {
          sessions.push({ anchor: t, images: [img] });
        } else {
          last.images.push(img);
        }
      }
      return sessions.map((s) => {
        const pick = (type: string) => {
          const i = s.images.find((x: any) => x.type === type);
          return i?.storage_path || i?.image_url || null;
        };
        return {
          uploaded_at: new Date(s.anchor).toISOString(),
          front: pick("front"),
          back: pick("back"),
          profile: pick("profile"),
        };
      });
    },
  });

  const latestSession = gallerySessions[0] ?? null;
  const previousSession = gallerySessions[1] ?? null;

  const [beforeId, setBeforeId] = useState<string | null>(null);
  const [afterId, setAfterId] = useState<string | null>(null);

  useEffect(() => {
    if (snapshots.length >= 1 && !beforeId) setBeforeId(snapshots[0].id);
    if (snapshots.length >= 1 && !afterId) setAfterId(snapshots[snapshots.length - 1].id);
  }, [snapshots, beforeId, afterId]);

  const before = useMemo(() => snapshots.find((s) => s.id === beforeId), [snapshots, beforeId]);
  const after = useMemo(() => snapshots.find((s) => s.id === afterId), [snapshots, afterId]);

  if (isLoading) {
    return <p className="text-sm text-muted-foreground py-4 text-center">Carregando histórico…</p>;
  }

  if (snapshots.length === 0) {
    return (
      <p className="text-sm text-muted-foreground py-6 text-center">
        Nenhum snapshot ainda. Eles serão criados automaticamente a cada atualização de evolução.
      </p>
    );
  }

  const formatLabel = (s: EvolutionSnapshot) =>
    s.id === "__current__"
      ? `Atual (agora) · ${format(new Date(s.created_at), "dd/MM/yyyy", { locale: ptBR })}`
      : `${format(new Date(s.created_at), "dd/MM/yyyy HH:mm", { locale: ptBR })} · ${s.source}`;

  const setQuickRange = (which: "first-last" | "last-two") => {
    if (snapshots.length === 0) return;
    if (which === "first-last") {
      setBeforeId(snapshots[0].id);
      setAfterId(snapshots[snapshots.length - 1].id);
    } else if (which === "last-two" && snapshots.length >= 2) {
      setBeforeId(snapshots[snapshots.length - 2].id);
      setAfterId(snapshots[snapshots.length - 1].id);
    }
  };

  return (
    <div className="space-y-4">
      {/* Gráficos de evolução */}
      <EvolutionCharts userId={userId} />

      {/* Selectors */}
      <div className="space-y-2">
        <div className="flex flex-wrap gap-2">
          <Button size="sm" variant="outline" className="h-7 text-xs" onClick={() => setQuickRange("first-last")}>
            Inicial × Atual
          </Button>
          {snapshots.length >= 2 && (
            <Button size="sm" variant="outline" className="h-7 text-xs" onClick={() => setQuickRange("last-two")}>
              Últimos 2
            </Button>
          )}
          <Badge variant="secondary" className="text-[10px]">{snapshots.length} snapshots</Badge>
        </div>
        <div className="grid grid-cols-2 gap-2">
          <div>
            <p className="text-[10px] text-muted-foreground mb-1 uppercase">De</p>
            <Select value={beforeId ?? undefined} onValueChange={setBeforeId}>
              <SelectTrigger className="h-9 text-xs"><SelectValue /></SelectTrigger>
              <SelectContent>
                {snapshots.map((s) => (
                  <SelectItem key={s.id} value={s.id} className="text-xs">{formatLabel(s)}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <p className="text-[10px] text-muted-foreground mb-1 uppercase">Para</p>
            <Select value={afterId ?? undefined} onValueChange={setAfterId}>
              <SelectTrigger className="h-9 text-xs"><SelectValue /></SelectTrigger>
              <SelectContent>
                {snapshots.map((s) => (
                  <SelectItem key={s.id} value={s.id} className="text-xs">{formatLabel(s)}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      {before && after && (
        <div className="space-y-3">
          {/* Headers */}
          <div className="grid grid-cols-2 gap-2 text-center">
            <div className="rounded-md border border-border/50 bg-muted/20 p-2">
              <p className="text-[10px] uppercase text-muted-foreground">Antes</p>
              <p className="text-xs font-medium">{format(new Date(before.created_at), "dd/MM/yyyy", { locale: ptBR })}</p>
            </div>
            <div className="rounded-md border border-foreground/30 bg-foreground/5 p-2">
              <p className="text-[10px] uppercase text-muted-foreground">Depois</p>
              <p className="text-xs font-medium">{format(new Date(after.created_at), "dd/MM/yyyy", { locale: ptBR })}</p>
            </div>
          </div>

          {/* Peso */}
          <Card>
            <CardContent className="p-3 space-y-2">
              <p className="text-xs font-display uppercase tracking-wide text-muted-foreground">Peso</p>
              <div className="grid grid-cols-2 gap-2 text-center">
                <p className="text-lg font-bold">{fmt(before.weight, " kg")}</p>
                <p className="text-lg font-bold">{fmt(after.weight, " kg")}</p>
              </div>
              <div className="text-center"><Delta before={before.weight} after={after.weight} suffix=" kg" invertColor /></div>
            </CardContent>
          </Card>

          {/* Macros */}
          <Card>
            <CardContent className="p-3 space-y-2">
              <p className="text-xs font-display uppercase tracking-wide text-muted-foreground">Macros</p>
              {[
                { label: "Calorias", a: before.daily_calories, b: after.daily_calories, suffix: " kcal", digits: 0 },
                { label: "Proteína", a: before.protein_g, b: after.protein_g, suffix: " g", digits: 0 },
                { label: "Carboidratos", a: before.carbs_g, b: after.carbs_g, suffix: " g", digits: 0 },
                { label: "Gordura", a: before.fat_g, b: after.fat_g, suffix: " g", digits: 0 },
                { label: "TMB", a: before.bmr, b: after.bmr, suffix: " kcal", digits: 0 },
                { label: "TDEE", a: before.tdee, b: after.tdee, suffix: " kcal", digits: 0 },
              ].map((row) => (
                <div key={row.label} className="grid grid-cols-3 gap-2 text-xs items-center">
                  <span className="text-muted-foreground">{row.label}</span>
                  <span className="text-center">{fmt(row.a, row.suffix, row.digits)} → {fmt(row.b, row.suffix, row.digits)}</span>
                  <span className="text-right"><Delta before={row.a} after={row.b} suffix={row.suffix} /></span>
                </div>
              ))}
            </CardContent>
          </Card>

          {/* NEAT / Atividade */}
          <Card>
            <CardContent className="p-3 space-y-2">
              <p className="text-xs font-display uppercase tracking-wide text-muted-foreground">Rotina de Atividades</p>
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="space-y-1">
                  <p><span className="text-muted-foreground">NEAT:</span> {before.physical_activity_level ?? "—"}</p>
                  <p><span className="text-muted-foreground">Tipo:</span> {before.activity_type ?? "—"}</p>
                  <p><span className="text-muted-foreground">Treino:</span> {before.training_days_per_week ?? "—"}x/sem</p>
                  <p><span className="text-muted-foreground">Cardio:</span> {before.does_cardio ? `${before.cardio_days_per_week ?? "—"}x/sem` : "não"}</p>
                </div>
                <div className="space-y-1">
                  <p><span className="text-muted-foreground">NEAT:</span> {after.physical_activity_level ?? "—"}</p>
                  <p><span className="text-muted-foreground">Tipo:</span> {after.activity_type ?? "—"}</p>
                  <p><span className="text-muted-foreground">Treino:</span> {after.training_days_per_week ?? "—"}x/sem</p>
                  <p><span className="text-muted-foreground">Cardio:</span> {after.does_cardio ? `${after.cardio_days_per_week ?? "—"}x/sem` : "não"}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Bioimpedância */}
          {(before.body_fat_pct !== null || after.body_fat_pct !== null || before.lean_mass_kg !== null || after.lean_mass_kg !== null) && (
            <Card>
              <CardContent className="p-3 space-y-2">
                <p className="text-xs font-display uppercase tracking-wide text-muted-foreground">Bioimpedância</p>
                {[
                  { label: "% Gordura", a: before.body_fat_pct, b: after.body_fat_pct, suffix: "%", invert: true },
                  { label: "Massa Magra", a: before.lean_mass_kg, b: after.lean_mass_kg, suffix: " kg" },
                  { label: "Massa Gorda", a: before.fat_mass_kg, b: after.fat_mass_kg, suffix: " kg", invert: true },
                ].map((row) => (
                  <div key={row.label} className="grid grid-cols-3 gap-2 text-xs items-center">
                    <span className="text-muted-foreground">{row.label}</span>
                    <span className="text-center">{fmt(row.a, row.suffix)} → {fmt(row.b, row.suffix)}</span>
                    <span className="text-right"><Delta before={row.a} after={row.b} suffix={row.suffix} invertColor={row.invert} /></span>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}

          {/* Fotos */}
          <Card>
            <CardContent className="p-3 space-y-2">
              <p className="text-xs font-display uppercase tracking-wide text-muted-foreground">Fotos Corporais</p>
              <p className="text-[10px] text-muted-foreground">Antes = envio anterior · Depois = último envio da galeria.</p>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <p className="text-[10px] text-center text-muted-foreground">
                    Antes {previousSession ? `· ${format(new Date(previousSession.uploaded_at), "dd/MM/yyyy", { locale: ptBR })}` : ""}
                  </p>
                  <div className="grid grid-cols-3 gap-1">
                    <PhotoCell url={previousSession?.front ?? null} label="Frente" />
                    <PhotoCell url={previousSession?.back ?? null} label="Costas" />
                    <PhotoCell url={previousSession?.profile ?? null} label="Perfil" />
                  </div>
                </div>
                <div className="space-y-2">
                  <p className="text-[10px] text-center text-muted-foreground">
                    Depois {latestSession ? `· ${format(new Date(latestSession.uploaded_at), "dd/MM/yyyy", { locale: ptBR })}` : ""}
                  </p>
                  <div className="grid grid-cols-3 gap-1">
                    <PhotoCell url={latestSession?.front ?? null} label="Frente" />
                    <PhotoCell url={latestSession?.back ?? null} label="Costas" />
                    <PhotoCell url={latestSession?.profile ?? null} label="Perfil" />
                  </div>
                </div>
              </div>
              {!previousSession && latestSession && (
                <p className="text-[10px] text-muted-foreground text-center">Apenas um envio de fotos registrado até agora.</p>
              )}
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
};

export default EvolutionComparison;