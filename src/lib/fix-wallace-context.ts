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

  // 2. diet_meals
  const { error: mealErr } = await supabase
    .from("diet_meals")
    .update({ app_context: 'sth_method' } as any)
    .eq("user_id", wallaceId)
    .is("app_context", null);

  if (mealErr) console.error('Erro ao atualizar diet_meals:', mealErr);
  else console.log('diet_meals atualizado.');

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
