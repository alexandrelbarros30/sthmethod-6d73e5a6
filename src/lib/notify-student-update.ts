import { supabase } from "@/integrations/supabase/client";
import { sendSystemTemplate, type SystemTemplateKey } from "@/lib/system-templates";

export type StudentUpdateType = "diet" | "training" | "protocol" | "plan";

const KEY_MAP: Record<StudentUpdateType, SystemTemplateKey> = {
  diet: "diet_updated",
  training: "training_updated",
  protocol: "protocol_updated",
  plan: "plan_updated",
};

/**
 * Dispara mensagem automática (Z-API) ao aluno notificando que dieta/treino/protocolo/plano foi atualizado.
 * Respeita o toggle `notify_on_updates` do perfil (default true). Falha silenciosa — não interrompe o fluxo de save.
 */
export const notifyStudentContentUpdate = async (
  userId: string,
  type: StudentUpdateType,
): Promise<void> => {
  try {
    const { data: profile } = await supabase
      .from("profiles")
      .select("full_name, phone, email, notify_on_updates")
      .eq("user_id", userId)
      .maybeSingle();

    if (!profile) return;
    if ((profile as any).notify_on_updates === false) return;
    if (!profile.phone) return;

    await sendSystemTemplate(
      KEY_MAP[type],
      {
        full_name: profile.full_name,
        phone: profile.phone,
        email: profile.email,
        user_id: userId,
      },
      { logHistory: true, mode: "auto" },
    );
  } catch (err) {
    console.warn(`[notifyStudentContentUpdate:${type}] failed`, err);
  }
};