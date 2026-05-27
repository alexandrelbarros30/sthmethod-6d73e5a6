import { supabase } from "@/integrations/supabase/client";
import { sendSystemTemplate, type SystemTemplateKey } from "@/lib/system-templates";

export type StudentUpdateType = "diet" | "training" | "protocol" | "plan";

const KEY_MAP: Record<StudentUpdateType, SystemTemplateKey> = {
  diet: "diet_updated",
  training: "training_updated",
  protocol: "protocol_updated",
  plan: "plan_updated",
};

// Janela para considerar dieta+treino+protocolo como um "projeto completo"
const BATCH_WINDOW_MS = 15 * 60 * 1000; // 15 minutos
// Delay antes de disparar individual (se o lote não completar)
const INDIVIDUAL_DELAY_MS = 5 * 60 * 1000; // 5 minutos
// Lock para não duplicar combined
const COMBINED_LOCK_MS = 24 * 60 * 60 * 1000; // 24h

const COLUMN_MAP: Record<
  "diet" | "training" | "protocol",
  "diet_ready_at" | "training_ready_at" | "protocol_ready_at"
> = {
  diet: "diet_ready_at",
  training: "training_ready_at",
  protocol: "protocol_ready_at",
};

const loadProfile = async (userId: string) => {
  const { data } = await supabase
    .from("profiles")
    .select("full_name, phone, email, notify_on_updates")
    .eq("user_id", userId)
    .maybeSingle();
  return data;
};

const sendIndividual = async (userId: string, type: StudentUpdateType) => {
  const profile = await loadProfile(userId);
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
};

const sendCombined = async (userId: string) => {
  const profile = await loadProfile(userId);
  if (!profile) return false;
  if ((profile as any).notify_on_updates === false) return false;
  if (!profile.phone) return false;

  await sendSystemTemplate(
    "content_all_ready",
    {
      full_name: profile.full_name,
      phone: profile.phone,
      email: profile.email,
      user_id: userId,
    },
    { logHistory: true, mode: "auto" },
  );
  return true;
};

/**
 * Dispara mensagem ao aluno notificando atualização de dieta/treino/protocolo/plano.
 *
 * Coalescência (Projeto Completo): se dieta + treino + protocolo são salvos numa janela
 * de 15 min, envia UMA mensagem combinada ("Dieta, treino e protocolo prontos") em vez
 * de 3 isoladas. Caso fique incompleto, dispara o individual após 5 min de espera.
 *
 * `plan` é enviado direto (não entra no batch).
 * Falha silenciosa — não interrompe o fluxo de save.
 */
export const notifyStudentContentUpdate = async (
  userId: string,
  type: StudentUpdateType,
): Promise<void> => {
  try {
    if (type === "plan") {
      await sendIndividual(userId, type);
      return;
    }

    const now = new Date();
    const nowIso = now.toISOString();
    const col = COLUMN_MAP[type];

    const { data: existing } = await supabase
      .from("student_content_batches")
      .select("*")
      .eq("user_id", userId)
      .maybeSingle();

    const batchStartedAt = existing?.batch_started_at
      ? new Date(existing.batch_started_at)
      : null;
    const isExpired =
      !batchStartedAt || now.getTime() - batchStartedAt.getTime() > BATCH_WINDOW_MS;

    const updatePayload: Record<string, any> = { user_id: userId, [col]: nowIso };
    if (isExpired) {
      updatePayload.batch_started_at = nowIso;
      updatePayload.diet_ready_at = type === "diet" ? nowIso : null;
      updatePayload.training_ready_at = type === "training" ? nowIso : null;
      updatePayload.protocol_ready_at = type === "protocol" ? nowIso : null;
    }

    await supabase
      .from("student_content_batches")
      .upsert(updatePayload, { onConflict: "user_id" });

    const { data: fresh } = await supabase
      .from("student_content_batches")
      .select("*")
      .eq("user_id", userId)
      .maybeSingle();

    if (!fresh) return;

    const dietAt = fresh.diet_ready_at ? new Date(fresh.diet_ready_at).getTime() : 0;
    const trainingAt = fresh.training_ready_at
      ? new Date(fresh.training_ready_at).getTime()
      : 0;
    const protocolAt = fresh.protocol_ready_at
      ? new Date(fresh.protocol_ready_at).getTime()
      : 0;
    const batchStart = fresh.batch_started_at
      ? new Date(fresh.batch_started_at).getTime()
      : 0;
    const combinedAt = fresh.combined_sent_at
      ? new Date(fresh.combined_sent_at).getTime()
      : 0;

    const allReady =
      batchStart > 0 && dietAt >= batchStart && trainingAt >= batchStart && protocolAt >= batchStart;
    const combinedLocked =
      combinedAt > 0 && now.getTime() - combinedAt < COMBINED_LOCK_MS;

    if (allReady && !combinedLocked) {
      const ok = await sendCombined(userId);
      if (ok) {
        await supabase
          .from("student_content_batches")
          .update({
            combined_sent_at: nowIso,
            diet_ready_at: null,
            training_ready_at: null,
            protocol_ready_at: null,
            batch_started_at: null,
          })
          .eq("user_id", userId);
      }
      return;
    }

    // Lote incompleto: agenda envio individual após delay (best-effort).
    setTimeout(async () => {
      try {
        const { data: check } = await supabase
          .from("student_content_batches")
          .select("combined_sent_at, last_individual_sent, diet_ready_at, training_ready_at, protocol_ready_at")
          .eq("user_id", userId)
          .maybeSingle();
        if (!check) return;
        const sentMap = ((check.last_individual_sent || {}) as Record<string, string>);
        const myReadyAt = (check as any)[col] as string | null;
        if (!myReadyAt) return; // foi limpo pelo combined
        const lastSent = sentMap[type] ? new Date(sentMap[type]).getTime() : 0;
        if (lastSent >= new Date(myReadyAt).getTime()) return;
        const justCombined =
          check.combined_sent_at &&
          Date.now() - new Date(check.combined_sent_at).getTime() < COMBINED_LOCK_MS;
        if (justCombined) return;

        await sendIndividual(userId, type);
        sentMap[type] = new Date().toISOString();
        await supabase
          .from("student_content_batches")
          .update({ last_individual_sent: sentMap })
          .eq("user_id", userId);
      } catch (err) {
        console.warn(`[notifyStudentContentUpdate:delayed:${type}] failed`, err);
      }
    }, INDIVIDUAL_DELAY_MS);
  } catch (err) {
    console.warn(`[notifyStudentContentUpdate:${type}] failed`, err);
  }
};