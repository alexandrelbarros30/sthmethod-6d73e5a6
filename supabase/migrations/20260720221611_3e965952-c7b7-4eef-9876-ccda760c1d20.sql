UPDATE public.student_diets
SET content = regexp_replace(
  regexp_replace(content, '<p[^>]*>\s*(?:<[^>]+>\s*)*TOTAL\s+DI[ÁA]RIO[\s\S]*?</p>\s*', '', 'gi'),
  '(?:<[^>]+>\s*)*TOTAL\s+DI[ÁA]RIO\s*:?\s*\d+\s*kcal\s*\|\s*P\s*:\s*\d+\s*g\s*\|\s*C\s*:\s*\d+\s*g\s*\|\s*G\s*:\s*\d+\s*g\s*(?:<[^>]+>\s*)*', '', 'gi'
)
WHERE content ~* 'TOTAL\s+DI[ÁA]RIO';