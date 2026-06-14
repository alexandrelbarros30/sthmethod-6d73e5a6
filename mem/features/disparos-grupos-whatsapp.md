---
name: Disparos automáticos em grupos de WhatsApp
description: Sistema de agendamento semanal (cron + edge function) que envia mensagens com artes para grupos via Z-API Comercial. Admin gerencia em /admin/crm/grupos-agenda.
type: feature
---
Tabela `crm_group_broadcasts` (weekday 0=Dom..6=Sáb, hour_brt, message_body, image_urls[], text_first, group_ids[] no formato `@g.us` ou só dígitos, active, last_sent_at).

Edge function `crm-group-broadcast-tick` roda via pg_cron a cada hora (`5 * * * *`). Calcula hora atual em America/Sao_Paulo e dispara via Z-API:
- text_first=true → envia texto sozinho, depois 1 imagem por vez (sem caption).
- text_first=false → 1ª imagem com texto como caption, demais sem caption.
- Dedup por 23h via `last_sent_at`; aceita `force_id` no body para teste manual ("Disparar agora").
- Normaliza group id removendo sufixo `@g.us` (Z-API espera só a parte numérica no campo `phone`).
- Respeita kill-switch `crm_settings.zapi.enabled`.

Agendamentos seedados: domingo_19h, segunda_08h, quinta_20h (quinta=text_first com 3 artes).

Artes armazenadas em `crm-media/group-broadcasts/*.jpg` (bucket público).