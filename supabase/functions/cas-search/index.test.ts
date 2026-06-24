import { assert, assertEquals } from "https://deno.land/std@0.224.0/assert/mod.ts";
import { geminiAnswer, LOVABLE_GATEWAY, makeCacheKey } from "./index.ts";

Deno.test("cas-search aciona fallback do Gateway quando Gemini retorna 429 e entrega resposta final", async () => {
  const oldKey = Deno.env.get("LOVABLE_API_KEY");
  Deno.env.set("LOVABLE_API_KEY", "test-lovable-key");

  let geminiCalls = 0;
  let gatewayCalls = 0;
  const fetchMock = async (input: string | URL | Request, _init?: RequestInit): Promise<Response> => {
    const url = String(input);
    if (url.startsWith(LOVABLE_GATEWAY)) {
      gatewayCalls += 1;
      return Response.json({ choices: [{ message: { content: "{\"resposta_completa\":\"Resposta final via fallback\"}" } }] });
    }
    geminiCalls += 1;
    return new Response(JSON.stringify({ error: { message: "rate limited" } }), { status: 429 });
  };

  const result = await geminiAnswer("sistema", "pergunta", "fake-gemini-key", true, fetchMock as typeof fetch);

  assertEquals(result.status, "ok");
  assertEquals(result.fallbackUsed, true);
  assertEquals(result.fallbackProvider, "lovable-gateway");
  assert(result.text?.includes("Resposta final via fallback"));
  assert(geminiCalls >= 1);
  assertEquals(gatewayCalls, 1);

  if (oldKey) Deno.env.set("LOVABLE_API_KEY", oldKey);
  else Deno.env.delete("LOVABLE_API_KEY");
});

Deno.test("cas-search sinaliza quota esgotada quando Gateway retorna 402", async () => {
  const oldKey = Deno.env.get("LOVABLE_API_KEY");
  Deno.env.set("LOVABLE_API_KEY", "test-lovable-key");

  const fetchMock = async (input: string | URL | Request, _init?: RequestInit): Promise<Response> => {
    const url = String(input);
    if (url.startsWith(LOVABLE_GATEWAY)) {
      return new Response(JSON.stringify({ error: { message: "credits exhausted" } }), { status: 402 });
    }
    return new Response(JSON.stringify({ error: { message: "rate limited" } }), { status: 429 });
  };

  const result = await geminiAnswer("sistema", "pergunta", "fake-gemini-key", false, fetchMock as typeof fetch);

  assertEquals(result.status, "quota_exhausted");
  assertEquals(result.fallbackUsed, true);
  assert(result.error?.toLowerCase().includes("quota"));

  if (oldKey) Deno.env.set("LOVABLE_API_KEY", oldKey);
  else Deno.env.delete("LOVABLE_API_KEY");
});

Deno.test("cas-search cache key muda por disciplina e parâmetros", async () => {
  const base = await makeCacheKey({ query: "O que é IPM?", discipline: "DIREITO PROCESSUAL PENAL MILITAR", intent: "definicao", language: "pt-BR", matchCount: 10, requestType: "search" });
  const sameNormalized = await makeCacheKey({ query: "  o que é ipm?  ", discipline: "DIREITO PROCESSUAL PENAL MILITAR", intent: "definicao", language: "pt-BR", matchCount: 10, requestType: "search" });
  const otherDiscipline = await makeCacheKey({ query: "O que é IPM?", discipline: "DIREITO PENAL MILITAR", intent: "definicao", language: "pt-BR", matchCount: 10, requestType: "search" });
  const otherSize = await makeCacheKey({ query: "O que é IPM?", discipline: "DIREITO PROCESSUAL PENAL MILITAR", intent: "definicao", language: "pt-BR", matchCount: 20, requestType: "search" });

  assertEquals(base, sameNormalized);
  assert(base !== otherDiscipline);
  assert(base !== otherSize);
});