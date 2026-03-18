INSERT INTO public.message_variables (key, label, example, sort_order) VALUES
  ('{nome_completo}', 'Nome completo do aluno', 'Maria Silva Santos', 7),
  ('{email}', 'E-mail do aluno', 'maria@email.com', 8),
  ('{telefone}', 'Telefone do aluno', '(21) 99999-0000', 9),
  ('{objetivo}', 'Objetivo do aluno', 'Emagrecimento', 10),
  ('{peso}', 'Peso do aluno', '65kg', 11),
  ('{altura}', 'Altura do aluno', '165cm', 12)
ON CONFLICT DO NOTHING;