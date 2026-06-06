INSERT INTO crm_settings (key, value)
VALUES 
  ('session_timeout_minutes', '{"minutes": 120}'),
  ('farewell_message', '{"message": "Agradecemos o seu contato! Como não houve novas interações por algum tempo, esta conversa foi encerrada automaticamente. Caso precise de algo mais, basta enviar uma nova mensagem. 👋"}')
ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value;