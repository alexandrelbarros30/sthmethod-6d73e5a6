---
name: Bloqueio do canal Fale com o Nutri para inativos
description: Webhook redireciona imediatamente leads/alunos vencidos/ex-alunos do canal Nutri (W-API) para o Comercial, preservando prioridade do aluno ativo
type: feature
---
No `crm-inbound-webhook`, quando uma mensagem chega no canal "Fale com o Nutri" (provider `wapi`) e `identifiedAs !== 'aluno_ativo'`, a IA NÃO atende: envia mensagem única (idempotência por sessão via `automation_logs.idempotency_key = nutri_block_redirect_<session>`) explicando que o canal é exclusivo para alunos ativos, oferece link de renovação (aluno_vencido/ex_aluno) ou cadastro (lead), redireciona para Comercial (https://wa.me/5521998496289) e fecha a conversa (`status='closed'`, `flow_state=null`).

Motivo: o Nutri é canal técnico de prioridade para aluno ativo. Inativos consumindo o canal atrasam atendimento de quem está pagando consultoria.

Encerramento mantém marca de fala "Conte Comigo!" do Nutri Alexandre.

**REGRA ABSOLUTA (reforço diário):** No canal Fale com o Nutri, se o contato NÃO É CLIENTE ATIVO (lead que nunca foi cliente, aluno vencido ou ex-aluno), NÃO HAVERÁ ATENDIMENTO com o Nutri em hipótese alguma. Deve ser encaminhado imediatamente para o canal Comercial (https://wa.me/5521998496289) — 1ª adesão para leads, renovação para vencidos/ex-alunos. Sem exceção, sem "só dessa vez", sem responder a dúvida técnica antes de redirecionar.
