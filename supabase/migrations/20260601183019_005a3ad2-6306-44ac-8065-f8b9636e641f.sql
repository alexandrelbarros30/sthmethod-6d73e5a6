-- Adiciona separação por canal (STH One / Fale com o Nutri) e gatilho de automação
ALTER TABLE public.crm_message_templates
  ADD COLUMN IF NOT EXISTS channel TEXT NOT NULL DEFAULT 'both',
  ADD COLUMN IF NOT EXISTS automation_trigger TEXT;

-- Validação leve dos valores possíveis
ALTER TABLE public.crm_message_templates
  DROP CONSTRAINT IF EXISTS crm_message_templates_channel_check;
ALTER TABLE public.crm_message_templates
  ADD CONSTRAINT crm_message_templates_channel_check
  CHECK (channel IN ('zapi','wapi','both'));

CREATE INDEX IF NOT EXISTS idx_crm_message_templates_channel
  ON public.crm_message_templates(channel);

-- Backfill: classifica os 12 templates iniciais por canal e gatilho
-- STH One (Z-API) = comercial / captação / planos / cobrança / renovação
UPDATE public.crm_message_templates SET channel='zapi'
 WHERE key IN (
   'saudacao_boas_vindas','apresentacao_planos','duvidas_como_funciona',
   'cobranca_vencido','renovacao_lembrete','oferta_especial',
   'recuperacao_ex_aluno'
 );

-- Fale com o Nutri (W-API) = atendimento de aluno ativo
UPDATE public.crm_message_templates SET channel='wapi'
 WHERE key IN (
   'lembrete_atualizacao_ciclo','lembrete_vencimento_proximo',
   'tarefa_envio_evolucao','dieta_pronta','treino_pronto'
 );

-- Marca quais são automáticos + descreve o gatilho
UPDATE public.crm_message_templates SET is_automatic=true,
  automation_trigger='Disparado quando o plano vence (D+0). Envio diário para alunos sem renovação.'
 WHERE key='cobranca_vencido';

UPDATE public.crm_message_templates SET is_automatic=true,
  automation_trigger='Disparado 3 dias antes do vencimento do plano.'
 WHERE key='renovacao_lembrete';

UPDATE public.crm_message_templates SET is_automatic=true,
  automation_trigger='Disparado 1 dia antes do término do ciclo (29 dias) para atualizar peso e fotos.'
 WHERE key='lembrete_atualizacao_ciclo';

UPDATE public.crm_message_templates SET is_automatic=true,
  automation_trigger='Disparado 7 dias antes do vencimento do plano.'
 WHERE key='lembrete_vencimento_proximo';

UPDATE public.crm_message_templates SET is_automatic=true,
  automation_trigger='Disparado quando admin salva uma nova dieta para o aluno.'
 WHERE key='dieta_pronta';

UPDATE public.crm_message_templates SET is_automatic=true,
  automation_trigger='Disparado quando admin libera um novo treino para o aluno.'
 WHERE key='treino_pronto';