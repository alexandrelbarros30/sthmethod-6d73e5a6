CREATE TABLE IF NOT EXISTS public.crm_flow_steps (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    key TEXT UNIQUE NOT NULL,
    label TEXT NOT NULL,
    message TEXT,
    media_url TEXT,
    media_type TEXT, -- 'image', 'pdf', null
    actions JSONB DEFAULT '[]'::jsonb, -- [{label: string, next_step_key: string}]
    order_index INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.crm_flow_steps TO authenticated;
GRANT ALL ON public.crm_flow_steps TO service_role;

ALTER TABLE public.crm_flow_steps ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage crm_flow_steps" ON public.crm_flow_steps
    FOR ALL USING (EXISTS (
        SELECT 1 FROM public.user_roles
        WHERE user_id = auth.uid() AND role = 'admin'
    ));

-- Inserir dados iniciais baseados nos FLOW_KEYS existentes
INSERT INTO public.crm_flow_steps (key, label, message, order_index) VALUES
('comercial_id_active', 'Saudação — Aluno Ativo', 'Olá{nomeSep}{nome}! 👋\n\nIdentificamos que você possui um *acompanhamento ativo* na STH METHOD.\n\nPara assuntos sobre *dieta, treino, protocolo, exames ou evolução*, utilize uma das opções abaixo:\n\n🟢 Digite *NUTRI*\nou\n🟢 Clique em *Fale com o Nutri*:\n👉 https://wa.me/5521998984153', 1),
('comercial_id_expired', 'Saudação — Aluno Vencido (menu)', 'Olá{nomeSep}{nome}! 👋\n\nIdentificamos que você já fez parte da STH METHOD.\n\nComo podemos ajudar?\n\n1️⃣ Conhecer os planos\n2️⃣ Formas de pagamento\n3️⃣ Falar com um consultor', 2),
('comercial_id_lead', 'Lead — Pedido de Nome', 'Olá! 👋\n\nSeja bem-vindo(a) à *STH METHOD*.\n\nQual é o seu *nome*?', 3),
('comercial_lead_menu', 'Lead — Menu após nome', 'Prazer, {nome}.\n\nComo posso ajudar?\n\n1️⃣ Como funciona\n2️⃣ Conhecer os planos\n3️⃣ Falar com um consultor', 4),
('comercial_menu_2_como_funciona', 'Como funciona a STH METHOD', '*Como funciona a STH METHOD* 🧬\n\nA STH METHOD é uma consultoria em performance, saúde e transformação corporal, baseada em ciência e estratégia.\n\n✅ *Plano Alimentar Personalizado*\n✅ *Treino Personalizado*\n✅ *Protocolo Inteligente*\n✅ *Análise de Exames*\n✅ *Acompanhamento Contínuo*\n✅ *Avaliação Mensal*', 5),
('comercial_formas_pagamento', 'Formas de Pagamento', '*Formas de pagamento* 💳\n\n💳 Cartão de Crédito\n📲 PIX\n💰 Parcelamento disponível conforme o plano\n\n1️⃣ Ver Planos\n2️⃣ Falar com consultor\n0️⃣ Voltar', 6),
('comercial_handoff_consultor', 'Transferência para Consultor', 'Perfeito.\n\nVou encaminhar você para um *consultor* da equipe STH METHOD.\n\nAguarde alguns instantes. 🙏', 7),
('comercial_lista_planos', 'Lista de Planos', '*Planos STH METHOD* 💎\n\n{planos}\n\n{cta}\n\n0️⃣ Voltar', 8)
ON CONFLICT (key) DO UPDATE SET
    label = EXCLUDED.label,
    message = EXCLUDED.message,
    order_index = EXCLUDED.order_index;
