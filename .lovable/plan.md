## Novo Fluxo Comercial STH ONE — Substituição completa

### O que muda
Substituo o fluxo atual do canal Comercial (Z-API) pelo novo state machine baseado no prompt fornecido. O canal Nutri (W-API) permanece intacto.

### 1. Banco de dados (1 migração)

Adicionar à `crm_conversations`:
- `flow_state text` — etapa atual do bot (ex.: `idle`, `main_menu`, `awaiting_name`, `awaiting_plan_choice`, `awaiting_pay_choice`, `handoff_consultor`).
- `flow_context jsonb` — dados temporários (nome capturado para lead, plano escolhido, etc.).
- `last_bot_message_at timestamptz` — para o timer de inatividade.
- `inactivity_warned_at timestamptz` — marca que o 1º aviso (5min) já foi enviado.
- `human_handoff boolean` — quando true, suspende o timer (transferência para consultor).

Nova fila: garantir `CONSULTOR` em `crm_queues` (reaproveita "Atendimento Comercial" caso já cubra). Reaproveito "Atendimento Comercial" como fila do consultor humano.

### 2. Reescrita de `crm-inbound-webhook` (canal Comercial)

Substituo todo o bloco Z-API (identificação + menu 1-5 + away) por máquina de estados:

**Classificação inicial:** `aluno_ativo` / `aluno_inativo` (= vencido ou sem assinatura porém com profile) / `lead` (sem profile).
> *Nota:* "ALUNO_INATIVO" no prompt = profile existente mas sem assinatura ativa/vencida. "LEAD" = telefone desconhecido.

**Fluxo ALUNO_ATIVO:**
- 1ª msg da sessão → envia mensagem "digite NUTRI ou clique Fale com o Nutri" + link `wa.me/5521998984153`.
- Se responder `nutri` (qualquer caixa) ou `fale com o nutri` → marca `human_handoff=true`, encerra sessão comercial, cria item na fila NUTRI (no canal W-API a próxima msg dele cai naturalmente). Como o aluno precisa escrever no outro número, o bot só confirma "Perfeito! Continue por https://wa.me/5521998984153".

**Fluxo ALUNO_INATIVO:**
- 1ª msg → menu (1 Planos / 2 Formas de pagamento / 3 Consultor). `flow_state=main_menu_inativo`.
- `1` → lista planos do BD (`plans` ativos) numerados. `flow_state=awaiting_plan_inativo`.
  - Resposta numérica → busca último plano/cadastro do user_id, monta link `${ORIGIN}/aluno/renovar?plan={id}`, envia. Volta `flow_state=idle`.
- `2` → envia formas de pagamento (Cartão/PIX/parcelamento) + submenu (1 Ver Planos / 2 Consultor / 0 Voltar). `flow_state=pay_menu_inativo`.
- `3` → transfere para consultor (ver abaixo).
- `0` → reenvia menu principal.

**Fluxo LEAD:**
- 1ª msg → "Qual é o seu nome?". `flow_state=awaiting_name`.
- Resposta → salva em `flow_context.nome` (e `display_name` da conversa), envia menu (1 Como funciona / 2 Planos / 3 Consultor). `flow_state=main_menu_lead`.
- `1` → template institucional ("Como funciona" — reaproveita `comercial_menu_2_como_funciona` ou default) + submenu (1 Planos / 2 Consultor / 0 Voltar).
- `2` → lista planos → escolha → envia link `https://sthmethod.com.br/cadastro`. Volta `idle`.
- `3` → transfere para consultor.

**Transferência para consultor (qualquer fluxo):**
- Define `flow_state=handoff_consultor`, `human_handoff=true`.
- Insere item em `crm_queues` "Atendimento Comercial" com `priority=0`.
- Envia "Vou encaminhar para um consultor. Aguarde alguns instantes."
- A partir daí o bot fica silencioso (todas as msgs apenas registradas, sem auto-reply). Timer suspenso.

**Fora de horário:** mantém comportamento atual (mensagem de ausência 1x por sessão), porém sem disparar a máquina de estados.

**Retorno após encerramento:** se `status=closed` ou sessão expirada → reseta `flow_state=null`, `human_handoff=false`, reidentifica e reinicia o fluxo do zero.

### 3. Timer de inatividade (nova edge function + cron)

Nova função `crm-inactivity-tick` (já existe `crm_expire_idle_conversations`; criamos uma específica para o canal Comercial):

Lógica (rodando a cada 1 min via `pg_cron`):
- Para cada `crm_conversations` onde `provider='zapi'`, `status='open'`, `human_handoff=false`, `last_bot_message_at IS NOT NULL`:
  - Se passaram **5 min** desde `last_bot_message_at` E `inactivity_warned_at IS NULL` E nenhuma msg `direction='in'` depois → envia "1º aviso" e seta `inactivity_warned_at=now()`.
  - Se passaram **10 min** desde `last_bot_message_at` (5 min após aviso) E `inactivity_warned_at IS NOT NULL` → envia msg de encerramento, marca `status='closed'`, limpa `flow_state` e `session_*`.
- Resposta do cliente reseta: o webhook já atualiza `session_expires_at`; passamos a limpar `inactivity_warned_at` quando chega msg `direction='in'`.

Schedule via `pg_cron` (1/min) executando a função.

### 4. UI Admin (mínima)

Sem mudança grande agora; o `AdminCrmSettings` continua editando templates. As novas mensagens (boas-vindas-lead, pergunta-nome, formas-pagamento, transferência-consultor, aviso-inatividade, encerramento) ganham defaults no código e ficarão editáveis em fase 2 se você pedir.

### 5. Detalhes técnicos

- Helper `sendZapiText` reutilizado. Toda saída do bot atualiza `last_bot_message_at` e limpa `inactivity_warned_at`.
- Toda msg `direction='in'` limpa `inactivity_warned_at` (no webhook).
- `human_handoff=true` impede qualquer auto-reply (menu, IA, etc.).
- `flow_state` é a fonte da verdade — webhook switch case por estado.
- Detecção de "NUTRI" via regex `/^(nutri|fale com o nutri)$/i` no fluxo aluno_ativo.

### Arquivos
- **migração**: novas colunas em `crm_conversations` + cron.
- **edit**: `supabase/functions/crm-inbound-webhook/index.ts` (substituição do bloco Comercial).
- **novo**: `supabase/functions/crm-inactivity-tick/index.ts` + entrada em `supabase/config.toml`.

### Não muda
- Canal Nutri (W-API).
- Mensagens de ausência fora de horário.
- IA/copilot, templates, opt-out, kill-switch.

Confirma para eu implementar?