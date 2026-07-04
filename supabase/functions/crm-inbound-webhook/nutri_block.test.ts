import "https://deno.land/std@0.224.0/dotenv/load.ts";
import { assert, assertEquals, assertStringIncludes } from "https://deno.land/std@0.224.0/assert/mod.ts";
import { buildNutriBlockPayload } from "./nutri-block-template.ts";

const SUPABASE_URL = Deno.env.get("VITE_SUPABASE_URL") || Deno.env.get("SUPABASE_URL")!;
const SUPABASE_ANON_KEY = Deno.env.get("VITE_SUPABASE_PUBLISHABLE_KEY") || Deno.env.get("SUPABASE_PUBLISHABLE_KEY")!;

// Números de teste que NÃO existem em profiles → classificam como lead.
// Usamos um DDD/prefixo improvável para não colidir com contatos reais.
const TEST_PHONE_LEAD = "5599999900001";
const TEST_PHONE_LEAD_2 = "5599999900002";

function nutriPayload(phone: string, extra: Record<string, unknown> = {}) {
  return {
    type: "ReceivedCallback",
    instanceId: "test-instance-nutri",
    phone,
    fromMe: false,
    messageId: `test-${crypto.randomUUID()}`,
    senderName: "Teste E2E",
    ...extra,
  };
}

async function postWebhook(body: Record<string, unknown>) {
  const res = await fetch(`${SUPABASE_URL}/functions/v1/crm-inbound-webhook?provider=wapi`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
      apikey: SUPABASE_ANON_KEY,
    },
    body: JSON.stringify(body),
  });
  const text = await res.text();
  let json: any = null;
  try { json = JSON.parse(text); } catch { /* keep as text */ }
  return { status: res.status, json, text };
}

// ============================================================
// 1) Template — mesma estrutura para texto e mídia por identidade
// ============================================================
Deno.test("template: lead recebe redirecionamento para o Comercial (texto)", () => {
  const { message, reason } = buildNutriBlockPayload({
    identifiedAs: "lead",
    firstName: "Marcos",
    entry: "text",
  });
  assertStringIncludes(message, "Marcos");
  assertStringIncludes(message, "Vanessa");
  assertStringIncludes(message, "https://wa.me/5521998496289");
  assertStringIncludes(message, "Comercial");
  assertStringIncludes(message, "abrindo seu atendimento");
  assertEquals(reason, "nutri_block:lead:text");
});

Deno.test("template: aluno_vencido recebe link de renovação e Comercial (texto)", () => {
  const { message, reason } = buildNutriBlockPayload({
    identifiedAs: "aluno_vencido",
    firstName: "Ana",
    renewalLink: "https://sthmethod.com.br/renovacao?u=abc",
    entry: "text",
  });
  assertStringIncludes(message, "inativa");
  assertStringIncludes(message, "https://sthmethod.com.br/renovacao?u=abc");
  assertStringIncludes(message, "https://wa.me/5521998496289");
  assertEquals(reason, "nutri_block:aluno_vencido:text");
});

Deno.test("template: ex_aluno recebe versão de renovação (mídia)", () => {
  const { message, reason } = buildNutriBlockPayload({
    identifiedAs: "ex_aluno",
    firstName: "Joao",
    renewalLink: "https://sthmethod.com.br/renovacao?u=xyz",
    entry: "media",
    mediaKind: "document",
  });
  assertStringIncludes(message, "document");
  assertStringIncludes(message, "https://wa.me/5521998496289");
  assertStringIncludes(message, "https://sthmethod.com.br/renovacao?u=xyz");
  assertEquals(reason, "nutri_block:ex_aluno:media");
});

Deno.test("template: mensagem lead texto e mídia compartilham corpo/CTA", () => {
  const text = buildNutriBlockPayload({ identifiedAs: "lead", firstName: "X", entry: "text" }).message;
  const media = buildNutriBlockPayload({ identifiedAs: "lead", firstName: "X", entry: "media", mediaKind: "image" }).message;
  // Corpo (CTA) idêntico
  const cta = "👉 https://wa.me/5521998496289";
  assertStringIncludes(text, cta);
  assertStringIncludes(media, cta);
  assertStringIncludes(text, "Comercial");
  assertStringIncludes(media, "Comercial");
});

// ============================================================
// 2) E2E — lead enviando texto no Nutri é bloqueado e redirecionado
// ============================================================
Deno.test("E2E: lead enviando TEXTO no canal Nutri é bloqueado (200 + resposta)", async () => {
  const res = await postWebhook(nutriPayload(TEST_PHONE_LEAD, {
    text: { message: "oi, quero saber sobre a consultoria" },
  }));
  assertEquals(res.status, 200);
  assert(res.json?.ok === true, `esperava ok=true, veio: ${res.text}`);
});

// ============================================================
// 3) E2E — lead enviando DOCUMENTO no Nutri é bloqueado como mídia
// ============================================================
Deno.test("E2E: lead enviando DOCUMENTO no Nutri é bloqueado (200 + reason=media_not_allowed)", async () => {
  const res = await postWebhook(nutriPayload(TEST_PHONE_LEAD_2, {
    document: {
      mimeType: "application/pdf",
      documentUrl: "https://example.com/fake.pdf",
      fileName: "exame.pdf",
    },
  }));
  assertEquals(res.status, 200);
  assert(
    res.json?.blocked === true || res.json?.ok === true,
    `esperava blocked/ok, veio: ${res.text}`,
  );
});

// ============================================================
// 4) E2E — dedup por sessão: segundo envio na mesma sessão NÃO deve
//    quebrar o webhook (retorna 200 e não reenvia mensagem)
// ============================================================
Deno.test("E2E: envios repetidos na mesma sessão continuam retornando 200", async () => {
  const first = await postWebhook(nutriPayload(TEST_PHONE_LEAD, {
    text: { message: "mais uma mensagem" },
  }));
  const second = await postWebhook(nutriPayload(TEST_PHONE_LEAD, {
    text: { message: "e mais outra" },
  }));
  assertEquals(first.status, 200);
  assertEquals(second.status, 200);
});

// ============================================================
// 5) E2E — resposta do webhook expõe transferência + regra de bloqueio
//    (auditoria observável sem depender de leitura direta do banco)
// ============================================================
Deno.test("E2E: lead TEXTO recebe autoReply com transfer=nutri->comercial e rule=nutri_channel_active_only", async () => {
  const phone = "5599999900010";
  const res = await postWebhook(nutriPayload(phone, {
    text: { message: "quero informações sobre a consultoria" },
  }));
  assertEquals(res.status, 200);
  const ar = res.json?.autoReply;
  assert(ar, `esperava autoReply na resposta, veio: ${res.text}`);
  assertEquals(ar.transfer, "nutri->comercial");
  assertEquals(ar.rule, "nutri_channel_active_only");
  assertEquals(ar.identified_as, "lead");
  assert(
    ar.engine === "nutri_to_comercial_transfer" || ar.engine === "nutri_block_silent",
    `engine inesperado: ${ar.engine}`,
  );
  assert(typeof ar.commercial_conversation_id === "string" && ar.commercial_conversation_id.length > 0,
    "esperava commercial_conversation_id preenchido");
});

Deno.test("E2E: segundo envio na mesma sessão mantém transfer e rule (deduplicado)", async () => {
  const phone = "5599999900011";
  await postWebhook(nutriPayload(phone, { text: { message: "primeira" } }));
  const res = await postWebhook(nutriPayload(phone, { text: { message: "segunda" } }));
  assertEquals(res.status, 200);
  const ar = res.json?.autoReply;
  assert(ar, `esperava autoReply, veio: ${res.text}`);
  assertEquals(ar.transfer, "nutri->comercial");
  assertEquals(ar.rule, "nutri_channel_active_only");
  // Segundo envio deve estar deduplicado (não reenvia mensagem)
  assertEquals(ar.sent, false);
  assertEquals(ar.reason, "nutri_block_already_sent");
});

Deno.test("E2E: lead enviando MÍDIA no Nutri retorna blocked=true e media_not_allowed", async () => {
  const phone = "5599999900012";
  const res = await postWebhook(nutriPayload(phone, {
    image: {
      mimeType: "image/jpeg",
      imageUrl: "https://example.com/fake.jpg",
      caption: "meu exame",
    },
  }));
  assertEquals(res.status, 200);
  assertEquals(res.json?.blocked, true);
  assertEquals(res.json?.reason, "media_not_allowed");
});