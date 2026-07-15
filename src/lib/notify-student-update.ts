import { supabase } from "@/integrations/supabase/client";
import { sendSystemTemplate, type SystemTemplateKey } from "@/lib/system-templates";

export type StudentUpdateType = "diet" | "training" | "protocol" | "plan";

const KEY_MAP: Record<StudentUpdateType, SystemTemplateKey> = {
  diet: "diet_updated",
  training: "training_updated",
  protocol: "protocol_updated",
  plan: "plan_updated",
};

// Janela para coalescer dieta+treino+protocolo em UMA mensagem combinada.
// Curto o suficiente para o admin salvar os três em sequência, mas curto
// o bastante para NÃO segurar mensagem além do razoável.
const COMBINED_WINDOW_MS = 90 * 1000; // 90 segundos
// Dedup por tipo — evita reenvio se o mesmo release for salvo duas vezes.
const INDIVIDUAL_DEDUP_MS = 10 * 60 * 1000; // 10 minutos
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
  if (!profile) return false;
  // O toggle notify_on_updates só bloqueia notificações "opcionais" (plan).
  // Releases de dieta/treino/protocolo SÃO mensagens de sistema e devem
  // sempre chegar via canal Fale com o Nutri.
  if (type === "plan" && (profile as any).notify_on_updates !== true) return false;
  if (!profile.phone) return false;

  const res = await sendSystemTemplate(
    KEY_MAP[type],
    {
      full_name: profile.full_name,
      phone: profile.phone,
      email: profile.email,
      user_id: userId,
    },
    { logHistory: true, mode: "auto", silent: true },
  );
  return !!res?.ok;
};

const sendCombined = async (userId: string) => {
  const profile = await loadProfile(userId);
  if (!profile) return false;
  if (!profile.phone) return false;

  const res = await sendSystemTemplate(
    "content_all_ready",
    {
      full_name: profile.full_name,
      phone: profile.phone,
      email: profile.email,
      user_id: userId,
    },
    { logHistory: true, mode: "auto", silent: true },
  );
  return !!res?.ok;
};

/**
 * Dispara mensagem ao aluno notificando atualização de dieta/treino/protocolo/plano.
 *
 * Envio IMEDIATO ao salvar (não depende de setTimeout do navegador, que morre
 * se o admin sai da página). Coalescência simples: se dieta + treino + protocolo
 * ficarem prontos na janela de 90s, o 3º disparo envia a mensagem combinada;
 * os individuais anteriores continuam válidos como confirmação parcial.
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

    // Dedup: se o mesmo tipo foi enviado nos últimos INDIVIDUAL_DEDUP_MS,
    // pula (evita duplicidade quando o admin salva várias vezes em sequência).
    const sentMap = ((existing?.last_individual_sent || {}) as Record<string, string>);
    const lastSentAt = sentMap[type] ? new Date(sentMap[type]).getTime() : 0;
    const alreadySentRecently = lastSentAt > 0 && now.getTime() - lastSentAt < INDIVIDUAL_DEDUP_MS;

    const batchStartedAt = existing?.batch_started_at
      ? new Date(existing.batch_started_at)
      : null;
    const isExpired =
      !batchStartedAt || now.getTime() - batchStartedAt.getTime() > COMBINED_WINDOW_MS;

    const updatePayload: Record<string, any> = { user_id: userId, [col]: nowIso };
    if (isExpired) {
      updatePayload.batch_started_at = nowIso;
      updatePayload.diet_ready_at = type === "diet" ? nowIso : null;
      updatePayload.training_ready_at = type === "training" ? nowIso : null;
      updatePayload.protocol_ready_at = type === "protocol" ? nowIso : null;
    }

    await supabase
      .from("student_content_batches")
      .upsert(updatePayload as any, { onConflict: "user_id" });

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
        return;
      }
    }

    // Envio individual IMEDIATO (não depende de setTimeout do navegador).
    if (alreadySentRecently) return;
    const ok = await sendIndividual(userId, type);
    if (ok) {
      const nextMap = { ...sentMap, [type]: new Date().toISOString() };
      await supabase
        .from("student_content_batches")
        .update({ last_individual_sent: nextMap })
        .eq("user_id", userId);
    }
  } catch (err) {
    console.warn(`[notifyStudentContentUpdate:${type}] failed`, err);
  }
};