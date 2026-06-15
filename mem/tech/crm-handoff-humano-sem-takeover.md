---
name: CRM Handoff Humano - IA totalmente silenciada
description: Durante handoff humano (human_handoff=true ou assigned_to), a IA fica 100% silenciada até o handoff ser encerrado manualmente — sem takeover por inatividade
type: feature
---
Em `supabase/functions/crm-inbound-webhook/index.ts`, quando `conv.human_handoff === true || !!conv.assigned_to`:
- A IA NÃO responde de jeito nenhum, mesmo se a atendente ficar inativa.
- Removido o antigo "AI takeover por inatividade" (5 min) que enviava `ai_assist_filler` + resposta da IA — causava respostas duplicadas junto com a atendente humana (ex.: Vanessa).
- Apenas registra `automation_logs` com `event_type: 'blocked_human_active'` e atualiza `crm_away_locks`.

Para reativar a IA é preciso encerrar o handoff manualmente (resetar `human_handoff` e `assigned_to`).
