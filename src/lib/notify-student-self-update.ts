import { supabase } from "@/integrations/supabase/client";
import { sendSystemTemplate } from "@/lib/system-templates";

export type SelfUpdateType = "photos" | "documents" | "weight";

const LABELS: Record<SelfUpdateType, string> = {
  photos: "novas fotos de evolução",
  documents: "novos documentos clínicos",
  weight: "uma atualização de peso/medidas",
};

// Debounce em memória — evita disparar 3x quando o aluno envia fotos +
// peso + medidas no mesmo submit. Uma janela de 2min basta para o caso real.
const RECENT_FIRE_MS = 2 * 60 * 1000;
const recentFires = new Map<string, number>();

/**
 * Confirma ao próprio aluno (canal Fale com o Nutri) que o sistema recebeu
 * a atualização e que o nutri fará contato. Só dispara quando:
 *   - o usuário autenticado é o próprio dono dos dados (não admin no lugar dele)
 *   - existe uma assinatura ativa e não vencida
 *   - tem telefone cadastrado
 * Falha silenciosa — nunca interrompe o fluxo de save do aluno.
 */
export const notifyStudentSelfUpdate = async (
  userId: string,
  type: SelfUpdateType,
): Promise<void> => {
  try {
    const { data: authData } = await supabase.auth.getUser();
    const authUid = authData?.user?.id;
    if (!authUid || authUid !== userId) return; // admin/consultor no lugar do aluno → não notifica

    // Dedup por usuário em 2 min
    const key = `${userId}`;
    const last = recentFires.get(key) || 0;
    if (Date.now() - last < RECENT_FIRE_MS) return;

    // Confirma aluno ATIVO (subscriptions.status=active e end_date > hoje)
    const today = new Date().toISOString().split("T")[0];
    const { data: sub } = await supabase
      .from("subscriptions")
      .select("status, end_date")
      .eq("user_id", userId)
      .eq("status", "active")
      .gte("end_date", today)
      .order("end_date", { ascending: false })
      .limit(1)
      .maybeSingle();
    if (!sub) return;

    const { data: profile } = await supabase
      .from("profiles")
      .select("full_name, phone, email")
      .eq("user_id", userId)
      .maybeSingle();
    if (!profile?.phone) return;

    recentFires.set(key, Date.now());

    await sendSystemTemplate(
      "student_update_received",
      {
        full_name: profile.full_name,
        phone: profile.phone,
        email: profile.email,
        user_id: userId,
        update_label: LABELS[type],
      } as any,
      { logHistory: true, mode: "auto", silent: true },
    );
  } catch (err) {
    console.warn("[notifyStudentSelfUpdate] failed", err);
  }
};