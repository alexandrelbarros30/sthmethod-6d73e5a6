---
name: Typing-lock — pausa da IA quando humano digita no painel
description: A IA do CRM fica silenciada por 5min sempre que o atendente humano está digitando no painel (campo ai_paused_until). Reinicia a cada tecla. Aviso discreto ao aluno é enviado UMA única vez por ciclo de handoff.
type: feature
---

# Typing-lock — IA respeita o humano

## Campos em `crm_conversations`

- `ai_paused_until timestamptz` — enquanto `> now()`, a IA NÃO responde nada (nem fluxo, nem ausência, nem AI).
- `human_intro_sent boolean` — marca se o aviso "Um consultor vai te responder em instantes 🙏" já foi enviado neste ciclo de handoff. Resetado para `false` quando a conversa fecha/reabre sem atendente fixo (junto com `human_handoff=false` e `ai_paused_until=null`).

## Edge function `crm-typing-lock`

POST `{ conversation_id, seconds? }` (default 300s, mín 30s, máx 1800s).
- Exige staff CRM (`is_crm_staff`).
- Estende `ai_paused_until = now() + seconds`. Cada chamada reinicia o cronômetro.
- Não envia mensagem nenhuma. Não toca em `human_handoff`.

## Painel `src/pages/admin/AdminCrm.tsx`

- `pingTypingLock()` chamada em `onFocus` e `onChange` do textarea de mensagem.
- Debounce de 1.2s entre chamadas (ref local).
- Falha silenciosa — nunca atrapalha o atendente.

## Webhook `crm-inbound-webhook`

Ordem das checagens antes de a IA responder:
1. canal desabilitado → ignora
2. `human_handoff === true || assigned_to` → IA totalmente silenciada (handoff manual de 24h)
3. **`ai_paused_until > now()` → IA silenciada (typing-lock). Envia aviso discreto ao aluno apenas se `human_intro_sent === false`, e marca `human_intro_sent=true`.**
4. `aiMode === 'ai_only'` → IA responde tudo
5. fluxo normal

## Regras absolutas (NUNCA violar)

- **NUNCA** a IA pode responder enquanto `ai_paused_until > now()`. Nem fluxo, nem ausência, nem AI.
- **NUNCA** enviar mais de um aviso "Um consultor vai te responder em instantes 🙏" por ciclo de handoff. Sempre checar `human_intro_sent` antes.
- **NUNCA** sobrescrever `ai_paused_until` em outros lugares do código (só o `crm-typing-lock` escreve, e o reset de ciclo zera).
- O typing-lock é **independente** do `human_handoff`. Ele NÃO marca handoff de 24h — é só uma pausa curta durante a digitação.
- Se o aluno responder enquanto a IA está pausada, NÃO acumular respostas para enviar depois. A IA simplesmente perde o turno.

## Reset automático

No webhook (quando a conversa estava `closed` ou sem `assigned_to` e chega nova mensagem):
- `human_handoff = false`
- `assigned_to = null`
- `human_intro_sent = false`
- `ai_paused_until = null`

Isso garante que o próximo ciclo de digitação humana dispare o aviso de novo.
