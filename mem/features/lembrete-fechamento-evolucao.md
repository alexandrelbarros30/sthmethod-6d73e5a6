---
name: Lembrete de Fechamento de Evolução D-5
description: Trigger evolution_close_pre_5d em subscription-reminder-dispatch enviando 5 dias antes do fim da consultoria pelo Comercial (Z-API) para pedir atualização final de peso/medidas/fotos
type: feature
---
Em `supabase/functions/subscription-reminder-dispatch/index.ts` a régua inclui `evolution_close_pre_5d` (offset -5). Template `crm_message_templates.key='evolution_close_pre_5d'` (channel=zapi). Dedup via `subscription_reminder_log` (user_id+end_date+trigger). Respeita opt_out e trava global de 1 cobrança/dia. CTA: https://sthmethod.com.br/dashboard/evolution. Roda antes do `renewal_pre_3d` para não competir com cobrança.
