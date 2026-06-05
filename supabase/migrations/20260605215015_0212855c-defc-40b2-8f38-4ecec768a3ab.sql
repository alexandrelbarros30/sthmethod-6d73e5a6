-- 1. Novos templates operacionais para o Sucesso do Aluno
INSERT INTO public.crm_flow_steps (key, label, message) VALUES
('sucesso_main_menu', 'Menu Inicial — Sucesso do Aluno', 'Olá{nomeSep}{nome}! 👋\n\nEste é o canal de *Sucesso do Aluno* da STH METHOD.\n\nComo posso te ajudar hoje?\n\n1️⃣ Atualizar Peso e Fotos\n2️⃣ Renovar Plano\n3️⃣ Verificar Pagamento\n4️⃣ Reativar Consultoria\n5️⃣ Dúvidas Administrativas\n6️⃣ Falar com o Nutri'),
('sucesso_nutri_handoff', 'Handoff — Sucesso para Nutri', 'Entendido! Vou te transferir para o canal *Fale com o Nutri* para suporte técnico.\n\n👉 https://wa.me/5521998984153'),
('nutri_sucesso_handoff', 'Handoff — Nutri para Sucesso', 'Para questões de financeiro, renovação ou cobrança, fale com o nosso canal de *Sucesso do Aluno*:\n\n👉 https://wa.me/5521978250000'),
('comercial_sucesso_handoff', 'Handoff — Comercial para Sucesso', 'Seu pagamento foi confirmado! 🎉\n\nAgora seu atendimento será realizado pelo nosso canal de *Sucesso do Aluno*.\n\n👉 https://wa.me/5521978250000')
ON CONFLICT (key) DO UPDATE SET message = EXCLUDED.message, label = EXCLUDED.label;

-- 2. Garantir que a fila do Sucesso exista (Verificando antes para evitar duplicidade manual já que não há UNIQUE no name)
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM public.crm_queues WHERE name = 'Sucesso do Aluno') THEN
        INSERT INTO public.crm_queues (name, type) VALUES ('Sucesso do Aluno', 'support');
    END IF;
END $$;
