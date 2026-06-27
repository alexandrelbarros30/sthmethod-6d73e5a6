# Etapa 10 — Auditoria Jurídica do Ecossistema STH METHOD

**Data:** 27/06/2026  
**Escopo:** repositório completo (`src/`, `supabase/`) — copy do usuário, e-mails, WhatsApp, IA, landing pages, checkout, área do aluno.  
**Referência legal:** `src/lib/legal-version.ts` · Termo de Adesão (`/termo`) · Política de Privacidade (`/privacidade`).

---

## 1. Termos pesquisados

| Categoria | Termos varridos |
| --- | --- |
| Promessas proibidas | `garantia de resultado`, `garantido`, `milagre`, `milagroso`, `sem esforço`, `100% de resultado`, `perde N kg em N dias` |
| Linguagem clínica indevida | `paciente`, `prescrição`, `diagnóstico`, `tratamento`, `cura`, `medicamento` |
| Vocabulário de produto vendido (incompatível com programa por prazo determinado) | `consultoria` (uso comercial vs. brand), `aquisição`, `vitalício`, `acesso permanente` |
| Apelo visual sensível | `antes e depois` |

## 2. Resultado consolidado

| Status | Quantidade | Observação |
| --- | --- | --- |
| 🟢 Conformes (já negam/contextualizam) | 7 ocorrências | Reforço explícito de **ausência de garantia** em Faq, Programa, CompraConcluida, legal-version, AI prompts. |
| 🟡 Brand (uso permitido) | ~40 ocorrências de `consultoria` | Trata-se da identidade comercial "STH METHOD — Consultoria Científica em Performance e Saúde". Categoria de serviço, **não** promessa. |
| 🔴 Promessas proibidas explícitas | **0** | Nenhuma cópia ativa promete resultado, cura, transformação garantida ou prazo milagroso. |

## 3. Achados detalhados

### 3.1 Reforços anti-promessa (manter como estão)
- `src/pages/Faq.tsx:36` — *"Tenho garantia de resultado? **Não.** Resultados dependem de adesão, rotina, genética..."*
- `src/pages/Programa.tsx:19` — Bloco **"O que NÃO está incluso"** lista *"Garantia de resultados específicos"*.
- `src/pages/Programa.tsx:38` — FAQ nega expressamente.
- `src/pages/CompraConcluida.tsx:52` — Checklist de responsabilidade reconhece *"sem garantia de resultado"*.
- `src/lib/legal-version.ts:17` — `LEGAL_DISCLAIMER_SHORT` carrega a cláusula central.
- `supabase/functions/_shared/ai-engine.ts:119,234` — System prompt da IA: *"Nunca prometa resultados milagrosos"* / *"Nunca prometa milagre."*
- `supabase/functions/student-ai-chat/index.ts:42` — Mesma diretiva aplicada à IA do aluno.

### 3.2 Uso de "consultoria" — análise por contexto

| Contexto | Decisão | Justificativa |
| --- | --- | --- |
| Brand institucional (`Consultoria Científica em Performance e Saúde`) | **Manter** | Categoria de atividade econômica/marca consagrada — não configura promessa de resultado nem prática vedada. |
| Termo de Adesão `src/pages/legal/Termo.tsx` | **Manter** | Define "prestação de serviços de consultoria em saúde e performance" + cláusulas de vigência e ausência de garantia. |
| Vendas/WhatsApp (canais Comercial e Nutri) | **Manter** | Acompanhada do enquadramento de Programa por prazo determinado nas etapas anteriores (5, 6, 7). |
| Páginas de cadastro/checkout do aluno (`/programa`, `/compra-concluida`, e-mails transacionais) | **Migrado** | Etapas 1–7 já substituíram por "Programa de Acompanhamento". |

### 3.3 "Antes e depois"
- `src/pages/Landing.tsx:480` e `supabase/functions/analyze-evolution-public/index.ts:73` — referem-se a fotos do **próprio usuário** comparadas entre si pelo gerador de evolução (uso lícito, com consentimento de imagem registrado em `image_consents`).
- Não há uso publicitário de transformação de terceiros sem consentimento.

### 3.4 Vocabulário clínico
- Ocorrências de "medicamento" estão apenas em **dados históricos de planilha** (`src/lib/spreadsheet-students.ts`) e em catálogos internos (`tele_specialty`).
- Não há `prescrição` nem `diagnóstico` em cópia voltada ao público.
- Termos como `nutricionista`, `psicólogo`, `psiquiatra` aparecem em enum de especialidade dos profissionais cadastrados — uso correto.

## 4. Conclusão da auditoria

> O ecossistema STH METHOD está **alinhado** à nova arquitetura jurídica de **Programa de Acompanhamento por prazo determinado**.  
> Nenhuma cópia ativa promete resultado, cura ou transformação garantida.  
> O vocabulário "consultoria" permanece **apenas como categoria de serviço/brand**, sempre acompanhado das cláusulas de ausência de garantia e de vigência determinada.

## 5. Recomendações de manutenção contínua

1. **Revisão trimestral** desta auditoria a cada bump de `LEGAL.version` em `src/lib/legal-version.ts`.
2. **Checklist pré-publicação** de novas landing pages e e-mails: rodar a grep desta auditoria antes do deploy.
3. **Bloqueio de copy** nos prompts da IA: manter as diretivas *"Nunca prometa milagre / resultados milagrosos"* em todas as edge functions de chat.
4. **Registro de consentimento de imagem** continua obrigatório antes de qualquer uso público de fotos de evolução (Etapas 5 e 9).
5. **Termo de Adesão e Política de Privacidade versionados** — qualquer alteração de copy comercial relevante deve incrementar `LEGAL.version` para forçar nova assinatura no próximo checkout.

---

**Status final:** ✅ Etapa 10 concluída. Ecossistema aprovado sob a moldura "Programa de Acompanhamento por prazo determinado".