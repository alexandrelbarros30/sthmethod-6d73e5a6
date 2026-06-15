---
name: CRM IA Comercial - Fisiculturismo Avançado
description: IA NUNCA afasta leads sobre anabolizantes, insulina, somatropina, peptídeos ou ciclos — regras críticas são extraídas e colocadas no INÍCIO do system prompt para prioridade máxima
Type: feature
---
O prompt `crm_settings.ai_prompt_comercial` tem seção dedicada "FISICULTURISMO AVANÇADO E SUBSTÂNCIAS ERGOGÊNICAS".

Regras absolutas para a IA comercial:
- Apresentar a STH METHOD como consultoria completa para fisiculturismo avançado, com médicos colaboradores que solicitam exames laboratoriais.
- Vender a consultoria diretamente — NÃO transferir para "Fale com o Nutri" nesses temas.
- PROIBIDO responder com "procure um endocrinologista", "não é nossa alçada", "isso é ilegal" ou "fora do meu escopo". Essas frases afastam leads pagantes.

Tópicos cobertos: anabolizantes, somatropina (GH), insulina para hipertrofia, peptídeos, TRT, ciclos avançados de fisiculturismo.

## Prioridade no Prompt (correção engine)

O engine `ai-engine.ts` extrai automaticamente o bloco "FISICULTURISMO AVANÇADO" do prompt comercial e o coloca como **PREÂMBULO no início do system prompt**, antes de qualquer prompt global ou auxiliar.

**Por que:** modelos Gemini (usados via `gemini_api` e Lovable AI Gateway) dão muito mais peso às instruções que aparecem no **início** do system prompt. Quando o prompt global (389 linhas) vinha primeiro, as regras críticas no final do prompt comercial eram ignoradas.

**NUNCA** reverta essa ordem. Se adicionar novas regras críticas ao prompt comercial, use os marcadores:
- `FISICULTURISMO AVANÇADO E SUBSTÂNCIAS ERGOGÊNICAS`
- `⚠️ REGRA CRÍTICA — NUNCA afaste`

O engine detecta esses marcadores e promove o bloco inteiro para o topo.
