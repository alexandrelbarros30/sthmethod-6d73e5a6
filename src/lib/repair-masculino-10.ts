import { supabase } from "@/integrations/supabase/client";
import { invokeSuperCoachEdge } from "@/lib/supercoach-edge";

/**
 * Script for emergency repair of the "STH METHOD MASCULINO 1.0" program.
 * It populates the existing workout templates with the correct exercises
 * from the ST Coach library and triggers a sync.
 */
export async function repairMasculino10Program() {
  const PROGRAM_ID = '901bf922-431e-4bc6-8b5d-3caae258e834';
  
  const workouts = [
    { 
      id: 'f4b5f406-b5dc-4258-bf11-235cddce66da', // Treino A
      exercises: [
        { custom_name: "Supino 45º com Halteres", sets: "4", reps: "12/10/8/6 + drop-set", sort_order: 0 },
        { custom_name: "Supino 45º Hammer", sets: "4", reps: "12/10/8/6 + drop-set", sort_order: 1 },
        { custom_name: "Supino Reto Máquina", sets: "3", reps: "10", sort_order: 2 },
        { custom_name: "Supino Declinado Máquina", sets: "3", reps: "8-12", sort_order: 3 },
        { custom_name: "Crossover", sets: "5", reps: "15/15/12/12/10", sort_order: 4 },
        { custom_name: "Elevação Frontal Corda", sets: "3", reps: "8-12 + drop-set", sort_order: 5 },
        { custom_name: "Elevação Lateral Sentado", sets: "3", reps: "8-12 + drop-set", sort_order: 6 }
      ]
    },
    {
      id: '40e1daac-f227-49a5-92e8-89c8d2fefb41', // Treino B
      exercises: [
        { custom_name: "Pulldown com Corda", sets: "4", reps: "8-15", sort_order: 0 },
        { custom_name: "Barra Fixa Aberta", sets: "3", reps: "to failure (até a falha)", sort_order: 1 },
        { custom_name: "Puxador Aberto", sets: "3", reps: "8-12 + 3\" Peak Contraction", sort_order: 2 },
        { custom_name: "Puxador Aberto", sets: "3", reps: "to failure (até a falha)", sort_order: 3 },
        { custom_name: "Puxador Triângulo", sets: "3", reps: "8-12 + 1\" Peak Contraction", sort_order: 4 },
        { custom_name: "Puxador Supinado", sets: "4", reps: "8-10 + 2\" Peak Contraction", sort_order: 5 },
        { custom_name: "Banco Romano", sets: "4", reps: "10", sort_order: 6 }
      ]
    },
    {
      id: '340b3cfc-957e-43b1-8e1c-306952235a80', // Treino C
      exercises: [
        { custom_name: "Desenvolvimento com Halteres", sets: "5", reps: "20/15/12/10/8 + drop-set", sort_order: 0 },
        { custom_name: "Elevação Lateral", sets: "3", reps: "8-10 + drop-set em todas", sort_order: 1 },
        { custom_name: "Elevação Lateral Unil. no Cabo", sets: "3", reps: "12 each arm (cada braço)", sort_order: 2 },
        { custom_name: "Elevação Frontal no Cabo", sets: "3", reps: "10", sort_order: 3 },
        { custom_name: "Elevação Frontal com Halteres", sets: "3", reps: "10", sort_order: 4 },
        { custom_name: "Supino 45º com Halteres", sets: "3", reps: "10/8/6 + drop-set", sort_order: 5 },
        { custom_name: "Crossover", sets: "5", reps: "8-10 + drop-set", sort_order: 6 }
      ]
    },
    {
      id: '74aaa881-bffb-4870-a3c1-15cb7e33f02d', // Treino D
      exercises: [
        { custom_name: "Panturrilhas Sentado", sets: "5", reps: "to failure + 2\" Peak Cont.", sort_order: 0 },
        { custom_name: "Panturrilhas Em Pé Máquina", sets: "5", reps: "to failure (até a falha)", sort_order: 1 },
        { custom_name: "Flexor Deitado", sets: "5", reps: "20/15/10/8/8 + drop-set", sort_order: 2 },
        { custom_name: "Flexor Sentado", sets: "3", reps: "10+10+10 (rest-pause)", sort_order: 3 },
        { custom_name: "Flexor Unilateral", sets: "4", reps: "10 + drop-set", sort_order: 4 },
        { custom_name: "Elevação de Quadril", sets: "4", reps: "8-12", sort_order: 5 },
        { custom_name: "Abdutora na Máquina", sets: "5", reps: "8-12", sort_order: 6 },
        { custom_name: "Agachamento Livre", sets: "4", reps: "12/10/8/6", sort_order: 7 },
        { custom_name: "Leg Press Unilateral", sets: "4", reps: "8-10 each leg", sort_order: 8 }
      ]
    },
    {
      id: '5b31ef36-9d4f-4900-a534-955676bf9c5a', // Treino E
      exercises: [
        { custom_name: "Rosca Direta EZ Bar", sets: "5", reps: "15/12/10/8/8 + drop-set", sort_order: 0 },
        { custom_name: "Rosca Scott Máquina", sets: "4", reps: "4x 10 + 2\" Peak Contraction", sort_order: 1 },
        { custom_name: "Rosca Direta no Cabo", sets: "4", reps: "8-12", sort_order: 2 },
        { custom_name: "Rosca Bíceps no Cross", sets: "4", reps: "8-12", sort_order: 3 },
        { custom_name: "Tríceps Testa com Corda", sets: "5", reps: "20/15/12/10/8/ + drop-set", sort_order: 4 },
        { custom_name: "Tríceps Corda", sets: "4", reps: "8-12", sort_order: 5 },
        { custom_name: "Francês", sets: "3", reps: "8-12", sort_order: 6 },
        { custom_name: "Puxador Supinado", sets: "4", reps: "8-12", sort_order: 7 },
        { custom_name: "Remada Máquina Aberta", sets: "4", reps: "8-12", sort_order: 8 }
      ]
    }
  ];

  console.log("[repair-masculino-1.0] Starting repair for program:", PROGRAM_ID);

  for (const workout of workouts) {
    console.log(`[repair-masculino-1.0] Cleaning existing exercises for workout: ${workout.id}`);
    await supabase.from("workout_template_exercises").delete().eq("template_id", workout.id);
    
    console.log(`[repair-masculino-1.0] Inserting ${workout.exercises.length} exercises for workout: ${workout.id}`);
    const { error: insError } = await supabase.from("workout_template_exercises").insert(
      workout.exercises.map(ex => ({ ...ex, template_id: workout.id }))
    );
    
    if (insError) {
      console.error(`[repair-masculino-1.0] Error inserting exercises for ${workout.id}:`, insError);
      continue;
    }

    console.log(`[repair-masculino-1.0] Triggering ST Coach sync for workout: ${workout.id}`);
    const res = await invokeSuperCoachEdge("supercoach-push-template", { templateId: workout.id });
    console.log(`[repair-masculino-1.0] Sync result for ${workout.id}:`, res);
  }

  console.log("[repair-masculino-1.0] Repair complete.");
  return { success: true };
}
