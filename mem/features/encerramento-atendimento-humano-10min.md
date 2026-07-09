---
name: Encerramento automático de atendimento humano após 30 min de silêncio
description: Quando atendente responde no painel, IA fica 100% silenciada. Se o cliente ficar 30 min sem responder (aviso aos 15 min + encerramento aos 30 min) após a última mensagem do atendente, o cron crm-inactivity-tick envia mensagem de encerramento e fecha a conversa (reset do handoff). Vale para aluno ativo, inativo ou lead.
type: feature
---

## Regras (encerramento SILENCIOSO)
- Encerramento por inatividade NÃO envia nenhuma mensagem ao cliente.
- `crm-inactivity-tick` (roda a cada 1 min) fecha a conversa após 30 min sem resposta do cliente (last_bot_message_at ou última msg do atendente humano). Sem aviso prévio, sem farewell.
- Ao encerrar: `status='closed'`, `human_handoff=false`, `assigned_to=null`, `human_intro_sent=false`, limpa `flow_state`, `flow_context`, `session_*`, `inactivity_warned_at=null`, `last_bot_message_at=null`.
- Log em `automation_logs` com `metadata.silent=true`.
- Mensagens só são disparadas em novo início de conversa (webhook) ou envios agendados pelo sistema (campanhas, lembretes).
- Vale para qualquer canal (Comercial/Nutri/Sucesso) e qualquer contato (aluno ativo, inativo ou lead).