-- Inserir o Programa
INSERT INTO public.training_programs (name, description, gender, is_public)
VALUES ('STH METHOD MASCULINO 1.0', 'Programa completo de hipertrofia com foco em expansão e volume máximo.', 'masculino', true)
RETURNING id;
