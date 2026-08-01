---
name: STH METHOD COACH
description: Produto SaaS multi-tenant para personal trainers, academias e assessorias, em /coach, sem IA e sem consultoria STH
type: feature
---
Produto separado dentro do ecossistema, em rotas `/coach`.

- Público: personal trainers, educadores físicos, academias, studios, assessorias.
- PROIBIDO neste módulo: qualquer recurso de IA (STHIA, Food AI, geração de dieta/protocolo) e qualquer conteúdo de consultoria/protocolo médico. Edição de treino é 100% manual.
- Dados isolados em tabelas com prefixo `coach_` (`coach_tenants`, `coach_members`, `coach_students`, `coach_invites`) com RLS multi-tenant.
- Papéis: `owner` e `professor` em `coach_members`; aluno vinculado via `coach_students.user_id`.
- Entrada de aluno por convite (link + QR) usando `coach_invite_preview` / `coach_redeem_invite`.
- Planos: Free 1 aluno (grátis, para experimentar) / Start 50 / Pro 150 / Business 300 / Enterprise (custom) — definidos em `src/lib/coach-plans.ts`. Limite aplicado por trigger; cobrança ainda não ativa (só exibição).
- Design segue o padrão CXO da STH METHOD, mas com marca/cores do próprio profissional (tenant).
