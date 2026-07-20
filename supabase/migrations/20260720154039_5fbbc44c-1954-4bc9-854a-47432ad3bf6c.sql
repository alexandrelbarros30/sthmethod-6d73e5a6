
-- =========================================================
-- C) Dedup de telefones em profiles
-- =========================================================

-- Limpa telefone dos perfis não-canônicos (mantém em quem tem assinatura ativa / é o real)
UPDATE public.profiles SET phone = NULL, whatsapp_id = NULL WHERE user_id IN (
  'b50013a7-3b97-44cd-b9cf-949a0cbc7e92', -- Admin (teste)
  'a044c8c0-f060-4dcc-aa59-8473cad77bd2', -- Teste da silca
  '1f2c1ecc-bd57-4ed3-b4ea-72b035022323', -- Roberta antigo (sem sub)
  '6b7cef66-3303-4a7d-b953-bd771b8a7519', -- Matheus duplicado-antigo
  'e2d5c149-9db0-4448-b2e4-c2e2c1058745', -- Conta (sem sub)
  'ff46d812-1d9b-4638-a2a5-f24068587441', -- Aluno sete
  'bb7ba74b-06ac-4d78-ae74-ab85542bbea2', -- Aluno cinco
  'd5e17412-ed2d-4283-aaff-9b87e54a9185', -- Alexandre (ale@gmail)
  '8b42b0a3-2a85-4ab6-a8bd-49dd66aa2691', -- Leandro Ribeiro antigo
  '8507b545-7262-40c3-8864-41051f2fcf86', -- Alexandre Lourenco (nutri.abarros)
  'd1398e8a-2707-4470-833d-186ea0e28c95', -- Alexandre Lourenco (alexandrelbarros30)
  'bde8e3b1-d244-4ba7-bad1-bea95921d8c4'  -- Patricia Simoes (sem sub)
);

-- Índice único parcial no telefone normalizado (só para perfis com telefone real)
CREATE UNIQUE INDEX IF NOT EXISTS profiles_phone_norm_unique
  ON public.profiles ((regexp_replace(coalesce(phone,''), '\D', '', 'g')))
  WHERE phone IS NOT NULL
    AND length(regexp_replace(coalesce(phone,''), '\D', '', 'g')) >= 10;

-- Índice de busca (não único) para o webhook — acelera findProfileByPhone
CREATE INDEX IF NOT EXISTS profiles_phone_norm_idx
  ON public.profiles ((regexp_replace(coalesce(phone,''), '\D', '', 'g')));

-- =========================================================
-- D) Dedup de subscriptions (user_id, end_date, status)
-- =========================================================

WITH dupes AS (
  SELECT id,
         row_number() OVER (PARTITION BY user_id, end_date, status ORDER BY created_at ASC, id ASC) AS rn
    FROM public.subscriptions
)
DELETE FROM public.subscriptions s
 USING dupes d
 WHERE s.id = d.id AND d.rn > 1;

-- Índice único para bloquear novos gêmeos
CREATE UNIQUE INDEX IF NOT EXISTS subscriptions_user_end_status_unique
  ON public.subscriptions (user_id, end_date, status);
