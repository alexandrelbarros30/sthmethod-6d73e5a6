-- Adicionar campo title para identificação do link
ALTER TABLE public.plan_payment_links 
ADD COLUMN IF NOT EXISTS title TEXT;

-- Atualizar os registros existentes com títulos descritivos baseados nos planos
UPDATE public.plan_payment_links ppl
SET title = 
  CASE 
    WHEN p.visibility = 'promo_abril' THEN p.name || ' (PROMOÇÃO ABRIL)'
    ELSE p.name || ' (Plano Padrão)'
  END
FROM public.plans p
WHERE ppl.plan_id = p.id AND ppl.title IS NULL;

-- Criar índice para busca eficiente por título
CREATE INDEX IF NOT EXISTS idx_plan_payment_links_title 
ON public.plan_payment_links(title);