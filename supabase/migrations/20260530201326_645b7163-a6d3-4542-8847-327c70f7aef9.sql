-- 1) Extensões para agendamento
CREATE EXTENSION IF NOT EXISTS pg_cron;
CREATE EXTENSION IF NOT EXISTS pg_net;

-- 2) Seed Knowledge Hub (apenas se vazio para a categoria)
INSERT INTO public.sth_kb_articles (title, category, summary, content, tags, status, author_name)
SELECT * FROM (VALUES
  ('Metodologia STH METHOD — Visão Geral', 'Consultoria',
    'Os 3 pilares: Performance, Saúde e Estratégia. Consultoria personalizada e baseada em dados.',
    E'A STH METHOD é uma metodologia de consultoria que integra três pilares fundamentais:\n\n1. PERFORMANCE — treino periodizado, evolução mensurável.\n2. SAÚDE — exames laboratoriais, marcadores e segurança em primeiro lugar.\n3. ESTRATÉGIA — nutrição, suplementação e protocolos individualizados.\n\nO atendimento é 100% online via plataforma própria, com acompanhamento contínuo e ajustes a cada ciclo. Nunca prometemos resultados milagrosos — entregamos método, consistência e responsabilidade.',
    ARRAY['metodologia','pilares','consultoria'], 'aprovado', 'STH METHOD'),

  ('Planos e Modalidades', 'Planos',
    'Estrutura de planos da consultoria: Entrada, Intermediário e Premium.',
    E'A STH METHOD oferece planos com duração e nível de personalização variados.\n\n- ENTRADA: ideal para começar com método estruturado.\n- INTERMEDIÁRIO: maior frequência de ajustes e acompanhamento.\n- PREMIUM: acompanhamento avançado, exames integrados e prioridade no atendimento.\n\nValores e durações exatas devem ser consultados na página de planos pelo aluno. Nunca informe valores sem confirmar com o time comercial.',
    ARRAY['planos','valores','consultoria'], 'aprovado', 'STH METHOD'),

  ('Plataforma do Aluno — Como Acessar', 'Plataforma',
    'Login, painel do aluno e funcionalidades principais.',
    E'Após a confirmação do pagamento, o aluno recebe acesso à plataforma com:\n- Dieta interativa\n- Treino guiado\n- Protocolo de suplementação\n- Acompanhamento de evolução (peso, fotos, medidas)\n- Comunicação direta com o time\n\nO login é feito pelo e-mail cadastrado. Em caso de dificuldade, oriente o aluno a usar "Esqueci minha senha" ou a entrar em contato pelo WhatsApp oficial.',
    ARRAY['plataforma','login','acesso'], 'aprovado', 'STH METHOD'),

  ('Nutrição — Cálculo de Macros', 'Nutrição',
    'Base de cálculo: Mifflin-St Jeor + NEAT dinâmico + EAT individualizado.',
    E'A dieta da STH METHOD é construída com base em:\n- TMB pela fórmula de Mifflin-St Jeor\n- NEAT (atividade não-exercício) dinâmico\n- EAT (gasto com treino) individualizado por frequência\n- Fontes oficiais TACO/TBCA para composição de alimentos\n\nA dieta é interativa: o aluno marca refeições, acompanha hidratação e recebe ajustes periódicos. Substituições devem sempre respeitar a proporção de macros do prato original.',
    ARRAY['nutricao','dieta','macros'], 'aprovado', 'STH METHOD'),

  ('Treinamento — Estrutura de Programas', 'Treinamento',
    'Programas hierárquicos: Programa → Treino → Exercício, com PDF e treino guiado.',
    E'Os treinos são organizados em hierarquia:\n1. Programa (mesociclo)\n2. Treinos (A, B, C, D...)\n3. Exercícios (séries x repetições, descanso, observações)\n\nO aluno acessa via plataforma com:\n- Treino guiado passo a passo\n- PDF para impressão\n- Integração com ST Coach (deep link stcoach://)\n\nProgressão de cargas e ajustes seguem o ciclo do plano contratado.',
    ARRAY['treino','programa','musculacao'], 'aprovado', 'STH METHOD'),

  ('Exames Laboratoriais — Marcadores', 'Exames',
    'Painel de marcadores recomendados e periodicidade de coleta.',
    E'A STH METHOD trabalha com painel de marcadores laboratoriais para garantir segurança e direcionamento. Os exames recomendados variam conforme o objetivo e o plano contratado.\n\nNUNCA prescrevemos exames ou interpretamos resultados sem validação profissional. O aluno deve sempre apresentar laudos atualizados; a equipe orienta o que olhar e quando reavaliar. Em caso de alteração relevante, encaminhamos para validação clínica.',
    ARRAY['exames','laboratorio','seguranca'], 'aprovado', 'STH METHOD'),

  ('Comercial — Como Apresentar a STH METHOD', 'Comercial',
    'Discurso institucional, abordagem de objeções e próximo passo.',
    E'Ao apresentar a STH METHOD para um lead:\n1. Escute o objetivo antes de oferecer plano.\n2. Reforce os 3 pilares: Performance, Saúde, Estratégia.\n3. Apresente o plano que melhor encaixa no momento do lead.\n4. Trate objeções comuns: "caro" (mostre valor entregue), "vou pensar" (ofereça material), "sem tempo" (mostre que tudo é guiado).\n5. Conduza ao próximo passo SEM pressão (link de inscrição, dúvida pontual ou call).\n\nNunca prometa resultado. Nunca compare com concorrentes de forma agressiva.',
    ARRAY['comercial','vendas','objecoes'], 'aprovado', 'STH METHOD'),

  ('Financeiro — Formas de Pagamento', 'Financeiro',
    'Pix e cartão de crédito; políticas de parcelamento e comprovantes.',
    E'Formas de pagamento aceitas:\n- Pix (confirmação automática + verificação por IA do comprovante)\n- Cartão de crédito via Mercado Pago (parcelamento conforme plano)\n\nO aluno recebe automaticamente acesso após confirmação. Em caso de Pix manual, o time valida o comprovante e libera o acesso. Sempre confirme valores e datas com a página oficial de planos antes de informar.',
    ARRAY['financeiro','pagamento','pix','cartao'], 'aprovado', 'STH METHOD'),

  ('Renovação — Continuidade do Plano', 'Renovação',
    'Janela de renovação D-30 a D-1, mensagens e benefícios da continuidade.',
    E'A renovação é o pilar da evolução real. O aluno é avisado nas janelas D-30, D-15, D-7, D-3 e D-1 antes do vencimento.\n\nAo renovar:\n- Continuidade do protocolo sem perda de ciclo\n- Não obrigatória nova biometria (mantém a vigente)\n- Possibilidade de ajustar plano (upgrade/downgrade)\n\nTom: nunca soar cobrança. Reforce evolução, consistência e o que vem pela frente.',
    ARRAY['renovacao','continuidade','retencao'], 'aprovado', 'STH METHOD'),

  ('Retenção — Aluno Inativo ou Sumido', 'Renovação',
    'Como reconectar alunos sem atualização ou sem interação.',
    E'Quando um aluno está há mais de 21 dias sem interação ou sem atualização (peso/fotos):\n1. Reconecte com tom acolhedor, sem julgamento.\n2. Pergunte como está, sem cobrar resultado.\n3. Ofereça retomada simples: "vamos voltar com 1 ajuste pequeno?".\n4. Se houver bloqueio real (financeiro, emocional, viagem), registre na memória e proponha pausa formal.\n\nNunca abandone o aluno. A retenção é responsabilidade do time, não do aluno.',
    ARRAY['retencao','reconexao','inativo'], 'aprovado', 'STH METHOD'),

  ('FAQ — Perguntas Frequentes', 'FAQ',
    'Respostas curtas para dúvidas mais recorrentes do dia a dia.',
    E'P: Posso trocar alimentos da dieta?\nR: Sim, respeitando a proporção de macros do prato original. A plataforma sugere substituições.\n\nP: E se eu viajar?\nR: Mantenha o protocolo o máximo possível e avise o time para ajustes pontuais.\n\nP: Posso pular treino?\nR: Evite. Se acontecer, retome no próximo dia sem dobrar carga.\n\nP: Onde tiro dúvidas?\nR: Pelo WhatsApp oficial da consultoria ou pela plataforma.',
    ARRAY['faq','duvidas','dia-a-dia'], 'aprovado', 'STH METHOD'),

  ('Ética e Comunicação — STH METHOD', 'Consultoria',
    'Tom de voz oficial: profissional, humano, claro e responsável.',
    E'Toda comunicação da STH METHOD segue:\n- Tom profissional, humano, claro e confiante.\n- NUNCA agressivo, nunca pressionar venda.\n- NUNCA prometer resultados ou cura.\n- NUNCA prescrever medicação, dose ou conduta clínica.\n- Sempre orientar com responsabilidade e encaminhar para validação profissional quando necessário.\n- Sempre escrever a marca como "STH METHOD" (jamais "STM").\n\nA marca é construída na confiança. Cada mensagem representa o método.',
    ARRAY['etica','tom-de-voz','marca'], 'aprovado', 'STH METHOD')
) AS v(title, category, summary, content, tags, status, author_name)
WHERE NOT EXISTS (
  SELECT 1 FROM public.sth_kb_articles WHERE title = v.title
);