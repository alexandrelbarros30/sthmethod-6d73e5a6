---
name: Escopo Canal Fale com o Nutri (IA)
description: Prompt ai_prompt_nutri dedicado + memória global; IA nunca diz que vai "encaminhar para Fale com o Nutri" estando dentro do próprio canal
type: feature
---
Webhook crm-inbound-webhook mapeia queue 'nutri' -> ai_prompt_nutri (W-API 5521 99898-4153). Regra crítica injetada no prompt e em crm_ai_memory (scope=global, aprendizado): NUNCA dizer encaminhar/transferir para Fale com o Nutri estando nele; nunca enviar o próprio número. Admin/pagamento -> canal Comercial (5521 99849-6289). O número 21 97248-6650 NÃO EXISTE e não pode ser citado em nenhum canal. loadEngineAndPrompt aceita ai_prompt_nutri com channelFilter ['wapi','both'].
REGRA DE AUSÊNCIA: fora do horário de expediente o webhook envia ausência SEMPRE — independente de canal, identificação ou estado da conversa (nova sessão, fluxo em andamento, primeiro contato no Comercial). Dedup de 4h via crm_away_locks.
