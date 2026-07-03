---
name: Encerramento automático de atendimento humano após 10 min de silêncio
description: Quando atendente (Vanessa/Rafaela/qualquer) responde no painel, IA fica 100% silenciada. Se o cliente ficar 10 min sem responder após a última mensagem do atendente, o cron crm-inactivity-tick envia mensagem de encerramento e fecha a conversa (reset do handoff). Vale para aluno ativo, inativo ou lead.
type: feature
---

## Regras
- `crm-send-whatsapp` (envio pelo painel) já marca `human_handoff=true` e `assigned_to=userId` → IA totalmente silenciada em `crm-inbound-webhook`.
- `crm-inactivity-tick` (roda a cada 1 min) faz uma segunda varredura:
  - conversas com `status='open'` e (`human_handoff=true` OU `assigned_to not null`)
  - pega a última mensagem: se for `direction='out' && sent_by not null` (última fala foi do atendente humano) e passaram ≥ 10 min → envia encerramento e fecha.
  - se a última mensagem foi do cliente (`in`), NÃO encerra — o atendente ainda pode voltar.
- Ao encerrar: `status='closed'`, `human_handoff=false`, `assigned_to=null`, `human_intro_sent=false`, `ai_paused_until=null`, limpa `flow_state`, `flow_context`, `session_*`.
- Log em `automation_logs` com `event_type='human_handoff_auto_closed'`.
- Mensagem: "Olá {nome}. Estamos encerrando este atendimento por inatividade. Se precisar de algo, é só nos chamar novamente por aqui. Um abraço da equipe STH Method. 🙏"
- Vale para qualquer contato: aluno ativo, inativo ou lead. Independe do canal (Comercial/Nutri/Sucesso).