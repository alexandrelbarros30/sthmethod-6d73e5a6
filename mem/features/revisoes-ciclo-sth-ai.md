---
name: Revisões por ciclo no STH AI
description: 3 revisões por ciclo (cardápio/treino), 1 para análise; banner destacado com contagem regressiva até o fim do ciclo.
type: feature
---
- `MAX_REVISIONS` em `sth-ai-app`: diet 3, workout 3, analysis 1 (deve bater com `maxRevisions` em `AiModule.tsx` e o rótulo em `AiDashboard.tsx`).
- O aluno vê `AiRevisionsBanner`: contador destacado (vira vermelho quando resta ≤1) + contagem regressiva d/h/m/s até `cycle_start + cycleDays`, incentivando briefing detalhado para máximo acerto.
