import { supabase } from "@/integrations/supabase/client";

export type SnapshotSource = "student" | "admin" | "consultor";

/**
 * Cria um snapshot completo da evolução do aluno no momento atual.
 * Coleta peso/macros/NEAT do profile, fotos corporais vigentes e bioimpedância mais recente.
 * Não joga erro: registra no console e retorna null em caso de falha (fluxo principal não deve quebrar).
 */
export async function createEvolutionSnapshot(
  userId: string,
  source: SnapshotSource,
  notes: string = ""
): Promise<string | null> {
  try {
    const [{ data: profile }, { data: images }, { data: bio }] = await Promise.all([
      supabase
        .from("profiles")
        .select(
          "weight, bmr, tdee, daily_calories, protein_g, carbs_g, fat_g, activity_type, does_cardio, physical_activity_level, training_days_per_week, training_duration_minutes, training_intensity, cardio_days_per_week, cardio_duration_minutes, cardio_intensity"
        )
        .eq("user_id", userId)
        .maybeSingle(),
      supabase
        .from("body_images")
        .select("type, image_url, storage_path, uploaded_at")
        .eq("user_id", userId)
        .eq("is_current", true),
      supabase
        .from("bioimpedance_logs")
        .select("id, body_fat_pct, lean_mass_kg, fat_mass_kg")
        .eq("user_id", userId)
        .order("logged_at", { ascending: false })
        .limit(1)
        .maybeSingle(),
    ]);

    const frontImg = images?.find((i) => i.type === "front");
    const backImg = images?.find((i) => i.type === "back");
    const profileImg = images?.find((i) => i.type === "profile");
    const front = frontImg?.storage_path || frontImg?.image_url || null;
    const back = backImg?.storage_path || backImg?.image_url || null;
    const profilePic = profileImg?.storage_path || profileImg?.image_url || null;

    const payload = {
      user_id: userId,
      source,
      notes,
      weight: profile?.weight ?? null,
      bmr: profile?.bmr ?? null,
      tdee: profile?.tdee ?? null,
      daily_calories: profile?.daily_calories ?? null,
      protein_g: profile?.protein_g ?? null,
      carbs_g: profile?.carbs_g ?? null,
      fat_g: profile?.fat_g ?? null,
      activity_type: profile?.activity_type ?? null,
      does_cardio: profile?.does_cardio ?? null,
      physical_activity_level: profile?.physical_activity_level ?? null,
      training_days_per_week: profile?.training_days_per_week ?? null,
      training_duration_minutes: profile?.training_duration_minutes ?? null,
      training_intensity: profile?.training_intensity ?? null,
      cardio_days_per_week: profile?.cardio_days_per_week ?? null,
      cardio_duration_minutes: profile?.cardio_duration_minutes ?? null,
      cardio_intensity: profile?.cardio_intensity ?? null,
      body_image_front_url: front,
      body_image_back_url: back,
      body_image_profile_url: profilePic,
      bioimpedance_log_id: bio?.id ?? null,
      body_fat_pct: bio?.body_fat_pct ?? null,
      lean_mass_kg: bio?.lean_mass_kg ?? null,
      fat_mass_kg: bio?.fat_mass_kg ?? null,
    };

    const { data, error } = await supabase
      .from("evolution_snapshots")
      .insert(payload)
      .select("id")
      .maybeSingle();

    if (error) {
      console.error("[evolution-snapshot] insert error:", error);
      return null;
    }
    return data?.id ?? null;
  } catch (err) {
    console.error("[evolution-snapshot] unexpected error:", err);
    return null;
  }
}

export interface EvolutionSnapshot {
  id: string;
  created_at: string;
  source: string;
  notes: string;
  weight: number | null;
  bmr: number | null;
  tdee: number | null;
  daily_calories: number | null;
  protein_g: number | null;
  carbs_g: number | null;
  fat_g: number | null;
  activity_type: string | null;
  does_cardio: boolean | null;
  physical_activity_level: string | null;
  training_days_per_week: number | null;
  training_duration_minutes: number | null;
  training_intensity: string | null;
  cardio_days_per_week: number | null;
  cardio_duration_minutes: number | null;
  cardio_intensity: string | null;
  body_image_front_url: string | null;
  body_image_back_url: string | null;
  body_image_profile_url: string | null;
  body_fat_pct: number | null;
  lean_mass_kg: number | null;
  fat_mass_kg: number | null;
}