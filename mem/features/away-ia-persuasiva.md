---
name: Ausência fora do expediente com IA persuasiva (STHIA)
description: Fora do horário, o webhook usa a STHIA (mesmo engine/persona dos canais) para gerar a mensagem de ausência seguindo a política de 1ª adesão (lead) ou renovação (vencido/ex-aluno); aluno ativo recebe ausência cordial sem venda
type: feature
---
No `crm-inbound-webhook`, quando a conversa cai em modo AUSÊNCIA (fora do expediente, sem humano), a mensagem NÃO é mais um texto estático. O fluxo:

1. Carrega prompt do canal (`ai_prompt_comercial` / `ai_prompt_nutri` / `ai_prompt_sucesso`) via `loadEngineAndPrompt`.
2. Injeta dossiê do aluno (`buildStudentContext`) + memórias (`fetchAiMemories` + `renderMemoryBlock`) — mesma cabeça da STHIA.
3. Acrescenta diretiva "MODO AUSÊNCIA" no userPrompt declarando a intenção:
   - **lead** → 1ª adesão, ancora **Plano 90D Trimestral**, link `/cadastro`.
   - **aluno_vencido / ex_aluno** → renovação 100% automatizada, link `/renovacao?u=<user_id>`.
   - **aluno_ativo** → ausência cordial; proibido vender; orienta canal Fale com o Nutri se for técnico.
4. Regras fixas: deixar claro fora do expediente, retorno humano no próximo turno, máx. 5 frases curtas, PT-BR, persona STH METHOD, NUNCA mencionar "Sucesso do Aluno" (suspenso) nem "modo deus".
5. Em caso de falha da IA, cai no texto estático de `crm_settings.comercial_away_*` / `nutri_away_*` com `{link_renovacao}` interpolado.

Idempotência via `crm_away_locks` (4h) — uma única ausência por janela. `engine` registrado como `away_ai`.

Sucesso do Aluno permanece SUSPENSO: nada redireciona para wa.me/5521998496289 como se fosse Sucesso, nem cita o canal.