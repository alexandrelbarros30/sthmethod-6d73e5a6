-- Update Comercial Greeting to match the requested template and use text format
UPDATE public.crm_flow_steps 
SET 
  display_format = 'text',
  message = 'Olá! Seja bem-vindo(a) à STH METHOD. 👋\n\nComo posso ajudar?\n\n1️⃣ Conhecer planos e valores\n2️⃣ Como funciona a metodologia\n3️⃣ Falar com um consultor\n4️⃣ Já sou aluno',
  actions = '[{"label": "1", "next_step_key": "comercial_lista_planos"}, {"label": "2", "next_step_key": "comercial_menu_2_como_funciona"}, {"label": "3", "next_step_key": "comercial_handoff_consultor"}, {"label": "4", "next_step_key": "comercial_sucesso_handoff"}]'::jsonb
WHERE key = 'comercial_saudacao_lead';

-- Update Success Menu to use text format
UPDATE public.crm_flow_steps 
SET 
  display_format = 'text',
  message = '🏆 *Sucesso do Aluno | STH Method*\n\nOlá, {nome}! 👋\n\nComo podemos ajudar hoje?\n\n1️⃣ Atualizar Peso e Fotos\n2️⃣ Renovar Consultoria\n3️⃣ Verificar Pagamentos\n4️⃣ Reativar Consultoria\n5️⃣ Receber Meus Acessos\n6️⃣ Dúvidas Administrativas\n7️⃣ Falar com o Nutri\n\n_Ou digite *0* para voltar._'
WHERE key = 'sucesso_main_menu';

-- Update Nutri Reception to use text format
UPDATE public.crm_flow_steps 
SET 
  display_format = 'text',
  message = '🔬 *Fale com o Nutri | STH Method*\n\nOlá! Você está no canal técnico da STH Method.\n\nComo o Nutri Alexandre pode te ajudar hoje?\n\n1️⃣ Dieta\n2️⃣ Treinamento\n3️⃣ Exames\n4️⃣ Protocolo\n5️⃣ Urgência\n\n_Aguarde que o Nutri já irá analisar sua solicitação._'
WHERE key = 'nutri_reception';
