CREATE OR REPLACE FUNCTION public.sth_growth_dashboard()
RETURNS jsonb
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE v jsonb;
BEGIN
  IF NOT (public.has_admin_view(auth.uid()) OR public.has_role(auth.uid(),'consultor')) THEN
    RAISE EXCEPTION 'forbidden';
  END IF;

  SELECT jsonb_build_object(
    'conversao', jsonb_build_object(
      'frio',   (SELECT count(*) FROM public.sth_memory WHERE temperature = 'frio'),
      'morno',  (SELECT count(*) FROM public.sth_memory WHERE temperature = 'morno'),
      'quente', (SELECT count(*) FROM public.sth_memory WHERE temperature = 'quente'),
      'pronto', (SELECT count(*) FROM public.sth_memory WHERE temperature = 'pronto'),
      'taxa_30d', (
        SELECT CASE WHEN (SELECT count(*) FROM public.sth_memory WHERE created_at >= now() - interval '30 days') > 0
          THEN round(100.0 * (SELECT count(*) FROM public.payments WHERE status='approved' AND created_at >= now() - interval '30 days')
            / NULLIF((SELECT count(*) FROM public.sth_memory WHERE created_at >= now() - interval '30 days'),0), 1)
          ELSE 0 END
      )
    ),
    'retencao', jsonb_build_object(
      'baixo_risco', (
        SELECT count(*) FROM public.subscriptions s
        WHERE s.status='active' AND s.end_date >= current_date
          AND EXISTS (SELECT 1 FROM public.weight_logs w WHERE w.user_id=s.user_id AND w.logged_at >= now() - interval '14 days')
      ),
      'medio_risco', (
        SELECT count(*) FROM public.subscriptions s
        WHERE s.status='active' AND s.end_date >= current_date
          AND NOT EXISTS (SELECT 1 FROM public.weight_logs w WHERE w.user_id=s.user_id AND w.logged_at >= now() - interval '14 days')
          AND EXISTS (SELECT 1 FROM public.weight_logs w WHERE w.user_id=s.user_id AND w.logged_at >= now() - interval '45 days')
      ),
      'alto_risco', (
        SELECT count(*) FROM public.subscriptions s
        WHERE s.status='active' AND s.end_date >= current_date
          AND NOT EXISTS (SELECT 1 FROM public.weight_logs w WHERE w.user_id=s.user_id AND w.logged_at >= now() - interval '45 days')
      )
    ),
    'renovacao', jsonb_build_object(
      'd30', (SELECT count(*) FROM public.subscriptions WHERE status='active' AND end_date BETWEEN current_date+16 AND current_date+30),
      'd15', (SELECT count(*) FROM public.subscriptions WHERE status='active' AND end_date BETWEEN current_date+8  AND current_date+15),
      'd7',  (SELECT count(*) FROM public.subscriptions WHERE status='active' AND end_date BETWEEN current_date+4  AND current_date+7),
      'd3',  (SELECT count(*) FROM public.subscriptions WHERE status='active' AND end_date BETWEEN current_date+2  AND current_date+3),
      'd1',  (SELECT count(*) FROM public.subscriptions WHERE status='active' AND end_date BETWEEN current_date    AND current_date+1),
      'vencidos_7d', (SELECT count(*) FROM public.subscriptions WHERE end_date BETWEEN current_date - 7 AND current_date - 1)
    ),
    'vip', (
      SELECT COALESCE(jsonb_agg(jsonb_build_object(
        'user_id', user_id,
        'full_name', full_name,
        'updates', updates_count,
        'renewals', renewals_count,
        'score', vip_score
      ) ORDER BY vip_score DESC), '[]'::jsonb)
      FROM (
        SELECT p.user_id, p.full_name,
          (SELECT count(*) FROM public.weight_logs w WHERE w.user_id=p.user_id AND w.logged_at >= now() - interval '90 days') AS updates_count,
          (SELECT count(*) FROM public.subscriptions s WHERE s.user_id=p.user_id) AS renewals_count,
          (
            (SELECT count(*) FROM public.weight_logs w WHERE w.user_id=p.user_id AND w.logged_at >= now() - interval '90 days') * 5 +
            (SELECT count(*) FROM public.subscriptions s WHERE s.user_id=p.user_id) * 15
          ) AS vip_score
        FROM public.profiles p
        WHERE EXISTS (SELECT 1 FROM public.subscriptions s WHERE s.user_id=p.user_id AND s.status='active' AND s.end_date >= current_date)
        ORDER BY vip_score DESC
        LIMIT 20
      ) t
      WHERE vip_score >= 30
    ),
    'kpis', jsonb_build_object(
      'leads_quentes',      (SELECT count(*) FROM public.sth_memory WHERE temperature IN ('quente','pronto')),
      'risco_evasao',       (SELECT count(*) FROM public.subscriptions s
                              WHERE s.status='active' AND s.end_date >= current_date
                                AND NOT EXISTS (SELECT 1 FROM public.weight_logs w WHERE w.user_id=s.user_id AND w.logged_at >= now() - interval '45 days')),
      'renovacoes_proximas',(SELECT count(*) FROM public.subscriptions WHERE status='active' AND end_date BETWEEN current_date AND current_date+30),
      'conversoes_30d',     (SELECT count(*) FROM public.payments WHERE status='approved' AND created_at >= now() - interval '30 days'),
      'receita_30d',        (SELECT COALESCE(SUM(amount),0) FROM public.payments WHERE status='approved' AND created_at >= now() - interval '30 days'),
      'receita_7d',         (SELECT COALESCE(SUM(amount),0) FROM public.payments WHERE status='approved' AND created_at >= now() - interval '7 days'),
      'alunos_ativos',      (SELECT count(*) FROM public.subscriptions WHERE status='active' AND end_date >= current_date),
      'taxa_retencao',      (
        SELECT CASE WHEN (SELECT count(*) FROM public.subscriptions WHERE status='active' AND end_date >= current_date) > 0
          THEN round(100.0 * (SELECT count(*) FROM public.subscriptions s
                              WHERE s.status='active' AND s.end_date >= current_date
                                AND EXISTS (SELECT 1 FROM public.weight_logs w WHERE w.user_id=s.user_id AND w.logged_at >= now() - interval '14 days'))
            / NULLIF((SELECT count(*) FROM public.subscriptions WHERE status='active' AND end_date >= current_date),0), 1)
          ELSE 0 END
      )
    )
  ) INTO v;
  RETURN v;
END $$;