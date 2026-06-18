---
name: Estratégia de vendas - Âncora Plano 90D (Comercial)
description: Canal Comercial deve ancorar todos os novos leads no Plano 90D (Trimestral) como recomendação ideal, com abordagem psicanalítica/consultiva, sem esconder demais planos. Aplicado via preamble obrigatório em supabase/functions/_shared/ai-engine.ts (ai_prompt_comercial).
type: feature
---
Regra: a IA do canal Comercial (zapi/both) faz NASCER NA MENTE do novo lead que o **Plano 90D (90 dias / Trimestral)** é a escolha mais viável e adequada para qualquer perfil — sem empurrar, sem esconder os demais planos.

Argumentos-âncora obrigatórios:
- Tempo biológico real: ~12 semanas para resultado mensurável (adaptação metabólica, recomposição, hormonal).
- Ciclo completo do método STH (dieta + treino + protocolo + reavaliação) cabe em 90 dias.
- Melhor custo-benefício: caro o suficiente para comprometer, barato o suficiente para caber.
- Reduz fricção mental do mensal (recontratação repetida) e o medo do longo prazo (semestral/anual).

Fluxo psicanalítico/consultivo:
1. Escuta ativa — objetivo + histórico + dor.
2. Ancoragem temporal — fazer o lead concordar com "o corpo precisa de 12 semanas" antes de citar plano.
3. Posicionar 90D como caminho natural ("é o que recomendo para o seu caso", "é onde o método mostra resultado").
4. Apresentar mensal/semestral/anual como alternativas legítimas (mensal = teste, anual = quem já decidiu).
5. Fechar com pergunta consultiva + link https://sthmethod.com.br/cadastro.

Proibido:
- Apresentar só o 90D escondendo os demais.
- Pressionar lead com preferência clara por outro plano.
- Aplicar a âncora em ALUNO ATIVO — é apenas para NOVOS leads / contratação inicial.
- Inventar descontos/bônus fora dos templates oficiais.

Implementação: bloco "ESTRATÉGIA DE VENDAS — ÂNCORA DO PLANO 90D" injetado em `loadEngineAndPrompt` quando `promptKey === 'ai_prompt_comercial'`.