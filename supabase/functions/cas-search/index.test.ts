import { assert, assertEquals } from "https://deno.land/std@0.224.0/assert/mod.ts";
import { definitionScore, extractFocusTerms, makeCacheKey } from "./index.ts";

Deno.test("cas-search cache key muda por disciplina e parâmetros", async () => {
  const base = await makeCacheKey({ query: "O que é IPM?", discipline: "DIREITO PROCESSUAL PENAL MILITAR", intent: "definicao", language: "pt-BR", matchCount: 10, requestType: "search" });
  const sameNormalized = await makeCacheKey({ query: "  o que é ipm?  ", discipline: "DIREITO PROCESSUAL PENAL MILITAR", intent: "definicao", language: "pt-BR", matchCount: 10, requestType: "search" });
  const otherDiscipline = await makeCacheKey({ query: "O que é IPM?", discipline: "DIREITO PENAL MILITAR", intent: "definicao", language: "pt-BR", matchCount: 10, requestType: "search" });
  const otherSize = await makeCacheKey({ query: "O que é IPM?", discipline: "DIREITO PROCESSUAL PENAL MILITAR", intent: "definicao", language: "pt-BR", matchCount: 20, requestType: "search" });

  assertEquals(base, sameNormalized);
  assert(base !== otherDiscipline);
  assert(base !== otherSize);
});

Deno.test("cas-search prioriza definição literal em perguntas de conceito", () => {
  assertEquals(extractFocusTerms("O que é tortura?"), ["tortura"]);

  const definicao = definitionScore({
    discipline: "LEIS ESPECIAIS",
    similarity: 0.12,
    content: "A tortura se caracteriza como um intenso sofrimento físico ou mental. O termo tortura significa ação de torcer, dor aguda.",
  }, "O que é tortura?", "definicao");

  const questao = definitionScore({
    discipline: "ÉTICA E DEONTOLOGIA POLICIAL MILITAR",
    similarity: 0.18,
    content: "36. Que tipo de tortura ocorre quando o sofrimento físico ou mental é produzido? A) Tortura comum. B) Tortura discriminatória. C) Tortura castigo. D) Tortura omissiva. Gabarito: B",
  }, "O que é tortura?", "definicao");

  assert(definicao > questao);
});