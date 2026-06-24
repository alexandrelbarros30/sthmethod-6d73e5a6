---
name: CAS Estudo Avançado (/cas)
description: Página oculta /cas com pesquisa textual nas apostilas CAS-PMERJ (20 disciplinas, 1297 trechos) e resposta por Lovable AI Gateway.
type: feature
---
Rota oculta `/cas` (não exposta no menu). Sistema de estudo da apostila CAS-PMERJ (1403 páginas, 20 disciplinas):

- **Backend**: tabela `cas_chunks` (1297 trechos com discipline, page_start/end, content + embedding vetorial). Função `search_cas_chunks_fts(q, match_count, filter_discipline)` faz busca textual em português com `websearch_to_tsquery` + fallback ILIKE. Função `match_cas_chunks` (vetorial) existe mas não é usada pelo fluxo atual.
- **IA**: usar Lovable AI Gateway com `LOVABLE_API_KEY`, sem Google AI Studio/Gemini API Key direta. Modelos atuais via gateway: `google/gemini-3-flash-preview`, fallback `google/gemini-2.5-flash`/lite.
- **Edge functions**:
  - `cas-search`: FTS no Postgres + priorização de definições literais + geração via Lovable AI Gateway. Retorna `{answer, structured, answerError, matches}`.
  - `cas-ingest`: idempotente, já populado (1297 rows).
  - `cas-reembed`: existe mas Gemini embedding free tier limitado (5 RPM), não viável re-indexar em massa.
- **Frontend** `src/pages/Cas.tsx`: dois modos — Pesquisar (busca + resposta IA + fontes citadas) e Livro (cards das 20 disciplinas → leitura sequencial). Botão Download PDF mantido.
- **Comportamento de erro**: quando Gemini retorna 429, `answerError` é setado e a UI mostra aviso amarelo mantendo os trechos visíveis.