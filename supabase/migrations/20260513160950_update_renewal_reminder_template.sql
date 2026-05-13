UPDATE public.message_templates
SET content = E'{nome},\n\n👀 *Seu plano está encerrando…*\n\nPra não perder o ritmo e continuar evoluindo:\n\n👉 *Renove agora:*\n{link_renovacao}\n\n---\n\nSeu resultado depende da continuidade.\nParar agora é retroceder.\n\nBora manter o progresso ativo. 🚀',
    updated_at = now()
WHERE system_key = 'renewal_reminder';
