---
name: Bloqueio de mídia no WhatsApp (todos os canais IA)
description: WhatsApp bloqueia mídia em Comercial e Nutri (redireciona ao sistema). Canal Sucesso do Aluno (wapi_sucesso) ACEITA toda mídia — imagens rodam STH METHOD FOOD AI e devolvem análise nutricional.
type: feature
---
- Detecção em `crm-inbound-webhook` via `detectIncomingMediaKind(payload)`; URL extraída por `extractIncomingMediaUrl(payload, kind)` (Z-API `payload.image.imageUrl`, W-API `msgContent.imageMessage.url`, fallback `mediaUrl`).
- Áudio (PTT) NÃO entra na regra — continua transcrito e respondido como texto.
- **Comercial (zapi/send-whatsapp) e Nutri (wapi/send-wapi)**: mídia bloqueada. Caption é ignorado, IA não roda, aviso padronizado aponta para `https://sthmethod.com.br/dashboard`. Dedup 4h por conversa (`metadata->>tag = 'media_blocked'`). Log `event_type='media_blocked'`. Nutri+inativo/lead: template redireciona ao Comercial.
- **Sucesso do Aluno (wapi_sucesso/send-wapi-sucesso)**: TODA mídia é aceita.
  - Imagem: baixa a URL, converte em base64, chama `supabase.functions.invoke('food-ai-analyze', { mode:'photo' })`, e responde no WhatsApp com itens identificados, totais (kcal/P/C/G/fibra), classificação (🟢/🟡/🔴) e alertas. Fallback: pede descrição textual. Registra `metadata.type='food_ai_analysis'` + `automation_logs.event_type='food_ai_analysis'`.
  - Vídeo/documento/sticker: envia ACK ("Recebi seu documento…") e libera fluxo normal.
  - Toda mídia é registrada inbound em `crm_messages` com `media_url` + `media_type` + `metadata.sucesso_media_allowed=true`.
- Motivo: no canal Sucesso o time nutricional precisa ver a foto do prato (Food AI); nos demais canais arquivos ficam soltos, sem autorização e fora do prontuário.