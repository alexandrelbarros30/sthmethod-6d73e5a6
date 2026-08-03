import { supabase } from "@/integrations/supabase/client";

/**
 * Corrige registros órfãos sem contexto para o aluno Wallace Valentim.
 * Diets/Meals -> sth_method
 * Food Diary -> sth_ai
 */
export async function fixWallaceValentimContext() {
  const wallaceId = '10433ab8-6d3e-4f8d-9fda-bffdaf54b1fc';
  
  console.log('Iniciando correção de contexto para Wallace Valentim...');

  // 1. student_diets
  const { error: dietErr } = await supabase
    .from("student_diets")
    .update({ app_context: 'sth_method' } as any)
    .eq("user_id", wallaceId)
    .is("app_context", null);
  
  if (dietErr) console.error('Erro ao atualizar student_diets:', dietErr);
  else console.log('student_diets atualizado.');

  // 1b. Ensure only one active diet if duplicates exist (keep newest)
  const { data: activeDiets } = await supabase
    .from("student_diets")
    .select("id, created_at")
    .eq("user_id", wallaceId)
    .eq("is_active", true)
    .order("created_at", { ascending: false });

  if (activeDiets && activeDiets.length > 1) {
    const toDeactivate = activeDiets.slice(1).map(d => d.id);
    await supabase
      .from("student_diets")
      .update({ is_active: false })
      .in("id", toDeactivate);
    console.log(`Desativadas ${toDeactivate.length} dietas duplicadas.`);
  }

  // 2. diet_meals
  // We MUST link orphaned meals to a diet if possible, or delete them if they are duplicates of structured meals
  const { error: mealErr } = await supabase
    .from("diet_meals")
    .update({ app_context: 'sth_method' } as any)
    .eq("user_id", wallaceId)
    .is("app_context", null);

  if (mealErr) console.error('Erro ao atualizar diet_meals:', mealErr);
  else console.log('diet_meals atualizado.');

  // 2b. Cleanup orphaned meals (meals without diet_id that belong to sth_method)
  // These usually cause the "duplicate" look when merged with structured diet meals.
  const { error: cleanupErr } = await supabase
    .from("diet_meals")
    .delete()
    .eq("user_id", wallaceId)
    .eq("app_context", "sth_method")
    .is("diet_id", null);
  
  if (cleanupErr) console.error('Erro ao limpar refeições órfãs:', cleanupErr);
  else console.log('Refeições órfãs sem dieta vinculada foram removidas.');

  // 3. food_diary_entries
  const { error: diaryErr } = await supabase
    .from("food_diary_entries")
    .update({ app_context: 'sth_ai' } as any)
    .eq("user_id", wallaceId)
    .is("app_context", null);

  if (diaryErr) console.error('Erro ao atualizar food_diary_entries:', diaryErr);
  else console.log('food_diary_entries atualizado.');

  return { success: !dietErr && !mealErr && !diaryErr };
}
