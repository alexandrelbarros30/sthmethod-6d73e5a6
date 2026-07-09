---
name: Encerramento automático de atendimento humano após 30 min de silêncio
description: Quando atendente responde no painel, IA fica 100% silenciada. Se o cliente ficar 30 min sem responder (aviso aos 15 min + encerramento aos 30 min) após a última mensagem do atendente, o cron crm-inactivity-tick envia mensagem de encerramento e fecha a conversa (reset do handoff). Vale para aluno ativo, inativo ou lead.
type: feature
---

## Regras
- `crm-send-whatsapp` (envio pelo painel) já marca `human_handoff=true` e `assigned_to=userId` → IA totalmente silenciada em `crm-inbound-webhook`.
- `crm-inactivity-tick` (roda a cada 1 min) faz uma segunda varredura:
  - conversas com `status='open'` e (`human_handoff=true` OU `assigned_to not null`)
  - pega a última mensagem: se for `direction='out' && sent_by not null` (última fala foi do atendente humano) e passaram ≥ 15 min → envia pedido de encerramento; após +15 min sem resposta (≥ 30 min total) → envia farewell e fecha.
  - se a última mensagem foi do cliente (`in`), NÃO encerra — o atendente ainda pode voltar.
- Ao encerrar: `status='closed'`, `human_handoff=false`, `assigned_to=null`, `human_intro_sent=false`, `ai_paused_until=null`, limpa `flow_state`, `flow_context`, `session_*`.
- Log em `automation_logs` com `event_type='human_handoff_auto_closed'`.
- Mensagem: "Olá {nome}. Estamos encerrando este atendimento por inatividade. Se precisar de algo, é só nos chamar novamente por aqui. Um abraço da equipe STH Method. 🙏"
- Vale para qualquer contato: aluno ativo, inativo ou lead. Independe do canal (Comercial/Nutri/Sucesso).