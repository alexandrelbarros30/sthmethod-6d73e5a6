UPDATE public.crm_flow_steps
SET message = 'Olá, {nome}!\n\nIdentificamos que você possui uma consultoria ativa na STH METHOD.\n\nO canal Comercial é direcionado para novos interessados, planos e cadastro. Para assuntos técnicos do seu acompanhamento, vou encaminhar você para o canal Fale com o Nutri.\n\n✅ Sua mensagem será direcionada para o atendimento técnico agora.',
    updated_at = now()
WHERE key = 'comercial_ident_ativo';

UPDATE public.crm_conversations
SET queue_type = 'comercial',
    provider = 'zapi',
    flow_state = NULL,
    flow_context = '{}'::jsonb,
    human_handoff = false,
    assigned_to = NULL,
    status = 'open',
    updated_at = now()
WHERE phone = '5521985099917';