import { assert, assertEquals } from "https://deno.land/std@0.224.0/assert/mod.ts";
import { makeCacheKey } from "./index.ts";

Deno.test("cas-search cache key muda por disciplina e parâmetros", async () => {
  const base = await makeCacheKey({ query: "O que é IPM?", discipline: "DIREITO PROCESSUAL PENAL MILITAR", intent: "definicao", language: "pt-BR", matchCount: 10, requestType: "search" });
  const sameNormalized = await makeCacheKey({ query: "  o que é ipm?  ", discipline: "DIREITO PROCESSUAL PENAL MILITAR", intent: "definicao", language: "pt-BR", matchCount: 10, requestType: "search" });
  const otherDiscipline = await makeCacheKey({ query: "O que é IPM?", discipline: "DIREITO PENAL MILITAR", intent: "definicao", language: "pt-BR", matchCount: 10, requestType: "search" });
  const otherSize = await makeCacheKey({ query: "O que é IPM?", discipline: "DIREITO PROCESSUAL PENAL MILITAR", intent: "definicao", language: "pt-BR", matchCount: 20, requestType: "search" });

  assertEquals(base, sameNormalized);
  assert(base !== otherDiscipline);
  assert(base !== otherSize);
});