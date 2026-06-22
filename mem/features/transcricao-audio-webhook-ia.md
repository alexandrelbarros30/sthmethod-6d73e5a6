---
name: Transcrição de áudio nos webhooks IA
description: crm-inbound-webhook transcreve PTT via Lovable AI (gpt-4o-mini-transcribe, pt) e injeta como body para que ausência fora do expediente e IA respondam normalmente
type: feature
---
Aplicado a TODOS os canais IA (Comercial 21998496289, Nutri 21998984153, Sucesso do Aluno 21972486650).

Em `supabase/functions/crm-inbound-webhook/index.ts`, quando `audioUrl` está presente e não há texto/caption, baixa o arquivo, envia para `https://ai.gateway.lovable.dev/v1/audio/transcriptions` com `model=openai/gpt-4o-mini-transcribe` e `language=pt`, e usa a transcrição como `body` prefixada com `[Áudio do aluno]`.

Garantias:
- Mensagem de ausência fora do expediente DISPARA mesmo para áudios (antes ficava só `[Áudio recebido]` mas em alguns payloads o body vinha vazio e abortava em `if (!phone || !body)`).
- Dentro do expediente a IA responde ao conteúdo real do áudio.
- Fallback: se transcrição falhar (download/timeout/erro), usa `[Áudio recebido]` e segue o fluxo (não trava).
- Limite de 24 MiB; timeout de 30s; helper `transcribeAudioFromUrl`.