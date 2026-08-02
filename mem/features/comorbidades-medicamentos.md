---
name: Comorbidades e Medicamentos no cadastro
description: Campos obrigatórios comorbidities/medications em profiles e ai_app_profiles, sincronizados e injetados em todos os prompts de IA (cardápio, treino, análise).
type: feature
---
- `public.profiles.comorbidities` e `public.profiles.medications` (texto livre) são campos do cadastro STH METHOD; espelhados em `public.ai_app_profiles` (STH AI) pelos triggers `sync_ai_profile_to_master` / `sync_master_to_ai_profile`.
- Obrigatórios nos formulários admin/aluno (usar "Nenhuma"/"Nenhum" quando não houver). No STH AI ficam na fase 2 do onboarding e no perfil.
- Devem SEMPRE entrar no contexto de IA: `_shared/student-context.ts`, `sth-ai-app` (profileBlock), `generate-diet-ai` (clinicalBlock) e `sthia-clinical-analysis`.
- Regra de conteúdo: IA adapta alimentos, macros, volume/intensidade e recomendações a essas condições, mas NUNCA prescreve, altera ou sugere suspensão de medicamento.
