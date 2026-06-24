import { assert, assertEquals } from "https://deno.land/std@0.224.0/assert/mod.ts";
import { geminiAnswer, makeCacheKey } from "./index.ts";

Deno.test("cas-search tenta chave Gemini fallback quando a principal retorna 429", async () => {
  let primaryCalls = 0;
  let fallbackCalls = 0;
  const fetchMock = async (input: string | URL | Request, _init?: RequestInit): Promise<Response> => {
    const url = String(input);
    if (url.includes("key=primary-key")) {
      primaryCalls += 1;
      return new Response(JSON.stringify({ error: { message: "rate limited" } }), { status: 429 });
    }
    if (url.includes("key=fallback-key")) {
      fallbackCalls += 1;
      return Response.json({ candidates: [{ content: { parts: [{ text: "{\"resposta_completa\":\"Resposta final via Gemini fallback\"}" }] } }] });
    }
    return new Response(JSON.stringify({ error: { message: "unexpected key" } }), { status: 400 });
  };

  const result = await geminiAnswer("sistema", "pergunta", "primary-key||fallback-key", true, fetchMock as typeof fetch);

  assertEquals(result.status, "ok");
  assertEquals(result.fallbackUsed, true);
  assertEquals(result.fallbackProvider, "gemini-key-fallback_1");
  assert(result.text?.includes("Resposta final via Gemini fallback"));
  assertEquals(primaryCalls, 1);
  assertEquals(fallbackCalls, 1);
});

Deno.test("cas-search sinaliza rate limit quando todas as chaves Gemini retornam 429", async () => {
  let calls = 0;
  const fetchMock = async (input: string | URL | Request, _init?: RequestInit): Promise<Response> => {
    await String(input);
    calls += 1;
    return new Response(JSON.stringify({ error: { message: "rate limited" } }), { status: 429 });
  };

  const result = await geminiAnswer("sistema", "pergunta", "key-a||key-b", false, fetchMock as typeof fetch);

  assertEquals(result.status, "rate_limited");
  assertEquals(result.fallbackUsed, false);
  assert(result.error?.toLowerCase().includes("limite"));
  assertEquals(calls, 2);
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