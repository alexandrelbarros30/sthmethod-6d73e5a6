import { supabase } from "@/integrations/supabase/client";
import { invokeSuperCoachEdge } from "@/lib/supercoach-edge";

/**
 * Creates the Hipertrofia Max 1.0 program with ST Coach exercises
 * as requested by the user.
 */
export async function createHipertrofiaMaxProgram(userId: string) {
  try {
    // 1. Create the Program
    const { data: program, error: pError } = await supabase
      .from("training_programs")
      .insert({
        title: "Hipertrofia Max 1.0",
        details: "Programa de treinamento avançado focado em hipertrofia máxima. Todos os exercícios incluem vídeos demonstrativos do ST Coach.",
        objective: "hypertrophy",
        difficulty: "advanced",
        status: "draft", // Not assigned to students yet
        created_by: userId
      } as any)
      .select("id")
      .single();

    if (pError) throw pError;

    const programId = program.id;

    // Helper to create a workout template
    const createWorkout = async (title: string, subtitle: string, order: number) => {
      const { data: workout, error: wError } = await supabase
        .from("workout_templates")
        .insert({
          program_id: programId,
          title,
          subtitle,
          sort_order: order,
          released: true,
          created_by: userId
        } as any)
        .select("id")
        .single();
      
      if (wError) throw wError;
      return workout.id;
    };

    // Note: The user provided 6 images (A, B, C, D, E and one general).
    // I will scaffold the structure based on the images provided.

    // Treino A: Peitorais e Deltóides
    const workoutA = await createWorkout("Semana 1 - Treino A", "Peitorais e Deltóides", 0);
    await supabase.from("workout_template_exercises").insert([
      { template_id: workoutA, custom_name: "Supino 45º com Halteres", sets: "4", reps: "12/10/8/6 + drop-set", sort_order: 0, video_url: "https://vimeo.com/393165987" },
      { template_id: workoutA, custom_name: "Supino 45º Hammer", sets: "4", reps: "12/10/8/6 + drop-set", sort_order: 1 },
      { template_id: workoutA, custom_name: "Supino Reto Máquina", sets: "3", reps: "10", sort_order: 2 },
      { template_id: workoutA, custom_name: "Supino Declinado Máquina", sets: "3", reps: "8-12", sort_order: 3 },
      { template_id: workoutA, custom_name: "Crossover - Peak Contraction", sets: "5", reps: "15/15/12/12/10", sort_order: 4 },
      { template_id: workoutA, custom_name: "Elevação Frontal Corda", sets: "3", reps: "8-12 + drop-set", sort_order: 5 },
      { template_id: workoutA, custom_name: "Elevação Lateral Sentado", sets: "3", reps: "8-12 + drop-set", sort_order: 6 }
    ]);

    // Treino B: Dorsais: largura
    const workoutB = await createWorkout("Semana 1 - Treino B", "Dorsais: largura", 1);
    await supabase.from("workout_template_exercises").insert([
      { template_id: workoutB, custom_name: "Pulldown com Corda", sets: "4", reps: "8-15", sort_order: 0 },
      { template_id: workoutB, custom_name: "Barra Fixa Aberta", sets: "3", reps: "to failure (até a falha)", sort_order: 1 },
      { template_id: workoutB, custom_name: "Puxador Aberto", sets: "3", reps: "8-12 + 3\" Peak Contraction", sort_order: 2 },
      { template_id: workoutB, custom_name: "Puxador Aberto", sets: "3", reps: "to failure (até a falha)", sort_order: 3 },
      { template_id: workoutB, custom_name: "Puxador Triângulo", sets: "3", reps: "8-12 + 1\" Peak Contraction", sort_order: 4 },
      { template_id: workoutB, custom_name: "Puxador Supinado", sets: "4", reps: "8-10 + 2\" Peak Contraction", sort_order: 5 },
      { template_id: workoutB, custom_name: "Banco Romano", sets: "4", reps: "10", sort_order: 6 }
    ]);

    // Treino C: Deltóides e Peitorais
    const workoutC = await createWorkout("Semana 1 - Treino C", "Deltóides e Peitorais", 2);
    await supabase.from("workout_template_exercises").insert([
      { template_id: workoutC, custom_name: "Desenvolvimento com Halteres", sets: "5", reps: "20/15/12/10/8 + drop-set", sort_order: 0 },
      { template_id: workoutC, custom_name: "Elevação Lateral", sets: "3", reps: "8-10 + drop-set em todas", sort_order: 1 },
      { template_id: workoutC, custom_name: "Elevação Lateral Unil. no Cabo", sets: "3", reps: "12 each arm (cada braço)", sort_order: 2 },
      { template_id: workoutC, custom_name: "Elevação Frontal no Cabo", sets: "3", reps: "10", sort_order: 3 },
      { template_id: workoutC, custom_name: "Elevação Frontal com Halteres", sets: "3", reps: "10", sort_order: 4 },
      { template_id: workoutC, custom_name: "Supino 45º com Halteres", sets: "3", reps: "10/8/6 + drop-set", sort_order: 5 },
      { template_id: workoutC, custom_name: "Crossover", sets: "5", reps: "8-10 + drop-set", sort_order: 6 }
    ]);

    // Treino D: Panturrilhas e Isquiotibiais
    const workoutD = await createWorkout("Semana 1 - Treino D", "Panturrilhas e Isquiotibiais", 3);
    await supabase.from("workout_template_exercises").insert([
      { template_id: workoutD, custom_name: "Panturrilhas Sentado", sets: "5", reps: "to failure + 2\" Peak Cont.", sort_order: 0 },
      { template_id: workoutD, custom_name: "Panturrilhas Em Pé Máquina", sets: "5", reps: "to failure (até a falha)", sort_order: 1 },
      { template_id: workoutD, custom_name: "Flexor Deitado", sets: "5", reps: "20/15/10/8/8 + drop-set", sort_order: 2 },
      { template_id: workoutD, custom_name: "Flexor Sentado", sets: "3", reps: "10+10+10 (rest-pause)", sort_order: 3 },
      { template_id: workoutD, custom_name: "Flexor Unilateral", sets: "4", reps: "10 + drop-set", sort_order: 4 },
      { template_id: workoutD, custom_name: "Elevação de Quadril", sets: "4", reps: "8-12", sort_order: 5 },
      { template_id: workoutD, custom_name: "Abdutora na Máquina", sets: "5", reps: "8-12", sort_order: 6 },
      { template_id: workoutD, custom_name: "Agachamento Livre", sets: "4", reps: "12/10/8/6", sort_order: 7 },
      { template_id: workoutD, custom_name: "Leg Press Unilateral", sets: "4", reps: "8-10 each leg", sort_order: 8 }
    ]);

    // Treino E: Braços e Costas
    const workoutE = await createWorkout("Semana 1 - Treino E", "Braços e Costas", 4);
    await supabase.from("workout_template_exercises").insert([
      { template_id: workoutE, custom_name: "Rosca Direta EZ Bar", sets: "5", reps: "15/12/10/8/8 + drop-set", sort_order: 0 },
      { template_id: workoutE, custom_name: "Rosca Scott Máquina", sets: "4", reps: "4x 10 + 2\" Peak Contraction", sort_order: 1 },
      { template_id: workoutE, custom_name: "Rosca Direta no Cabo", sets: "4", reps: "8-12", sort_order: 2 },
      { template_id: workoutE, custom_name: "Rosca Bíceps no Cross", sets: "4", reps: "8-12", sort_order: 3 },
      { template_id: workoutE, custom_name: "Tríceps Testa com Corda", sets: "5", reps: "20/15/12/10/8/ + drop-set", sort_order: 4 },
      { template_id: workoutE, custom_name: "Tríceps Corda", sets: "4", reps: "8-12", sort_order: 5 },
      { template_id: workoutE, custom_name: "Francês", sets: "3", reps: "8-12", sort_order: 6 },
      { template_id: workoutE, custom_name: "Puxador Supinado", sets: "4", reps: "8-12", sort_order: 7 },
      { template_id: workoutE, custom_name: "Remada Máquina Aberta", sets: "4", reps: "8-12", sort_order: 8 }
    ]);

    // Finally, trigger ST Coach sync for each workout to link videos
    const { data: templates } = await supabase.from("workout_templates").select("id").eq("program_id", programId);
    if (templates) {
      for (const t of templates) {
        await invokeSuperCoachEdge("supercoach-push-template", { templateId: t.id });
      }
    }

    return { success: true, programId };
  } catch (error) {
    console.error("Error creating Hipertrofia Max program:", error);
    return { success: false, error };
  }
}
