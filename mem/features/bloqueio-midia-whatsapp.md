---
name: Bloqueio de mídia no WhatsApp (todos os canais IA)
description: WhatsApp NÃO recebe imagens, vídeos, documentos nem stickers em nenhum canal IA (Comercial, Nutri, Sucesso). Aluno é redirecionado ao sistema sthmethod.com.br. Áudio continua transcrito.
type: feature
---
- Detecção em `crm-inbound-webhook` via `detectIncomingMediaKind(payload)` (image/video/document/sticker).
- Áudio (PTT) NÃO entra na regra — continua sendo transcrito e respondido como texto.
- Quando há mídia: caption é ignorado, IA não roda, e enviamos um aviso padronizado direcionando para `https://sthmethod.com.br/dashboard` (Evolução / Documentos / Assinatura conforme o tipo).
- Dedup: 1 aviso a cada 4h por conversa (filtrado por `metadata->>tag = 'media_blocked'`).
- Mídia recebida é registrada como inbound placeholder em `crm_messages` (`metadata.type = 'media_blocked_in'`) para o painel mostrar que algo chegou.
- Log em `automation_logs` com `event_type = 'media_blocked'`.
- Vale para todos os providers: zapi (Comercial), wapi (Nutri), wapi_sucesso (Sucesso).
- Motivo: arquivos por WhatsApp ficam soltos, sem autorização e fora do prontuário. O sistema garante registro, autorização (image_consents quando aplicável) e vínculo ao acompanhamento.