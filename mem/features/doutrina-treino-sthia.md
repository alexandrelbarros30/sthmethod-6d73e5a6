---
name: Doutrina STHIA de prescrição de treino
description: Regras duras de repetições (mín. 6), cardio dentro das sessões A-G e cardio livre da biblioteca ST Coach — compartilhadas por STH Method, ST Coach e STH AI
type: feature
---
Fonte única: `supabase/functions/_shared/sthia-training-doctrine.ts`, injetada em `ai-workout-coach` e `sth-ai-app`.

- Proibido prescrever menos de 6 repetições. Hipertrofia 8-12, básicos 6-8, isoladores 12-20. Sempre em faixa.
- Cardio não é seção separada: entra como linha dentro da tabela de cada treino (A, B, C...), somando ao tempo da sessão.
- Se o volume de cardio superar o de musculação, criar sessões extras "Treino X — Cardio Livre" com exercícios de cardio da biblioteca oficial ST Coach (com vídeo).
- Abdominal/core em 2-3 sessões, também dentro das tabelas.
- No /ai, o treino é exibido só no programa guiado (sem bloco "Ver plano completo em texto").
