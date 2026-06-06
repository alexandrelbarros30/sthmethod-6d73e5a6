INSERT INTO crm_settings (key, value)
VALUES ('business_hours_sucesso', '{"mon_fri": {"start": "09:00", "end": "19:00"}, "sat": {"start": "09:00", "end": "14:00"}, "sun": null, "tz": "America/Sao_Paulo"}')
ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value;

-- Atualizar templates de ausência para incluir links de renovação e site conforme solicitado
UPDATE crm_settings SET value = jsonb_set(value, '{message}', '"Olá{nomeSep}{nome}! 🌙 Nosso atendimento de hoje foi encerrado.\n\nPara conhecer nossos planos e contratar agora mesmo de forma 100% automatizada, acesse nosso site:\n\n🌐 Site: https://sthmethod.com.br\n\nResponderemos sua mensagem assim que retornarmos! 👋"') WHERE key = 'comercial_away_lead';
UPDATE crm_settings SET value = jsonb_set(value, '{message}', '"Olá{nomeSep}{nome}! 🌙 Nosso atendimento de hoje foi encerrado.\n\nPara dúvidas sobre *dieta, treino e protocolo*, fale direto com o Nutri:\n👉 https://wa.me/5521998984153\n\nPara renovações e pagamentos, utilize nosso site:\n🌐 Site: https://sthmethod.com.br\n\nNo primeiro horário do próximo expediente entraremos em contato. 👋"') WHERE key = 'comercial_away_active';
UPDATE crm_settings SET value = jsonb_set(value, '{message}', '"Olá{nomeSep}{nome}! 🌙 Nosso atendimento de hoje foi encerrado.\n\nLocalizamos seu cadastro e vimos que seu plano está inativo. Para renovar agora de forma 100% automatizada, utilize os links abaixo:\n\n🔗 Renovação: https://sthmethod.com.br/renovacao\n🌐 Site: https://sthmethod.com.br\n\nResponderemos sua mensagem assim que retornarmos! 👋"') WHERE key = 'comercial_away_expired';
