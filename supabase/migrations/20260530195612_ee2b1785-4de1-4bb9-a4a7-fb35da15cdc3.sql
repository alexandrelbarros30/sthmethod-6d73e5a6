CREATE OR REPLACE FUNCTION public.sth_command_center()
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
    'comercial', jsonb_build_object(
      'leads_hoje',    (SELECT count(*) FROM public.sth_memory WHERE created_at::date = current_date),
      'leads_semana',  (SELECT count(*) FROM public.sth_memory WHERE created_at >= now() - interval '7 days'),
      'conversoes_30d',(SELECT count(*) FROM public.payments WHERE status='approved' AND created_at >= now() - interval '30 days'),
      'taxa_conversao',(
        SELECT CASE WHEN (SELECT count(*) FROM public.sth_memory WHERE created_at >= now() - interval '30 days') > 0
          THEN round(100.0 * (SELECT count(*) FROM public.payments WHERE status='approved' AND created_at >= now() - interval '30 days')
            / NULLIF((SELECT count(*) FROM public.sth_memory WHERE created_at >= now() - interval '30 days'),0), 1)
          ELSE 0 END
      ),
      'plano_top', (
        SELECT COALESCE(jsonb_build_object('name', name, 'count', c), '{}'::jsonb)
        FROM (
          SELECT pl.name, count(*) AS c
          FROM public.payments p
          JOIN public.plans pl ON pl.id = p.plan_id
          WHERE p.status='approved' AND p.created_at >= now() - interval '30 days'
          GROUP BY pl.name ORDER BY c DESC LIMIT 1
        ) t
      )
    ),
    'operacao', jsonb_build_object(
      'abertos',       (SELECT count(*) FROM public.crm_tickets WHERE closed_at IS NULL),
      'aguardando',    (SELECT count(*) FROM public.crm_tickets WHERE closed_at IS NULL AND status IN ('aguardando','novo_lead','prioridade_sensivel')),
      'encerrados_7d', (SELECT count(*) FROM public.crm_tickets WHERE closed_at >= now() - interval '7 days'),
      'tempo_medio_ms',(SELECT COALESCE(round(avg(latency_ms))::int,0) FROM public.sth_ai_drafts WHERE created_at >= now() - interval '7 days')
    ),
    'retencao', jsonb_build_object(
      'sem_atualizacao', (
        SELECT count(*) FROM public.subscriptions s
        WHERE s.status='active' AND s.end_date >= current_date
          AND NOT EXISTS (SELECT 1 FROM public.weight_logs w WHERE w.user_id=s.user_id AND w.logged_at >= now() - interval '29 days')
      ),
      'em_risco', (
        SELECT count(*) FROM public.subscriptions s
        WHERE s.status='active' AND s.end_date >= current_date
          AND NOT EXISTS (SELECT 1 FROM public.weight_logs w WHERE w.user_id=s.user_id AND w.logged_at >= now() - interval '45 days')
      ),
      'ativos', (SELECT count(*) FROM public.subscriptions WHERE status='active' AND end_date >= current_date),
      'vip', (
        SELECT count(*) FROM public.profiles p
        WHERE EXISTS (SELECT 1 FROM public.subscriptions s WHERE s.user_id=p.user_id AND s.status='active' AND s.end_date >= current_date)
          AND (SELECT count(*) FROM public.subscriptions s WHERE s.user_id=p.user_id) >= 2
      )
    ),
    'renovacao', jsonb_build_object(
      'd30', (SELECT count(*) FROM public.subscriptions WHERE status='active' AND end_date BETWEEN current_date+16 AND current_date+30),
      'd15', (SELECT count(*) FROM public.subscriptions WHERE status='active' AND end_date BETWEEN current_date+8  AND current_date+15),
      'd7',  (SELECT count(*) FROM public.subscriptions WHERE status='active' AND end_date BETWEEN current_date+4  AND current_date+7),
      'd3',  (SELECT count(*) FROM public.subscriptions WHERE status='active' AND end_date BETWEEN current_date    AND current_date+3)
    ),
    'financeiro', jsonb_build_object(
      'receita_mes',  (SELECT COALESCE(SUM(amount),0) FROM public.payments WHERE status='approved' AND created_at >= date_trunc('month', now())),
      'receita_ano',  (SELECT COALESCE(SUM(amount),0) FROM public.payments WHERE status='approved' AND created_at >= date_trunc('year', now())),
      'ticket_medio', (SELECT COALESCE(round(avg(amount)::numeric, 2),0) FROM public.payments WHERE status='approved' AND created_at >= now() - interval '30 days'),
      'por_plano', (
        SELECT COALESCE(jsonb_agg(jsonb_build_object('name', name, 'amount', total) ORDER BY total DESC), '[]'::jsonb)
        FROM (
          SELECT pl.name, SUM(p.amount) AS total
          FROM public.payments p
          JOIN public.plans pl ON pl.id = p.plan_id
          WHERE p.status='approved' AND p.created_at >= now() - interval '30 days'
          GROUP BY pl.name ORDER BY total DESC LIMIT 6
        ) t
      )
    ),
    'inteligencia', jsonb_build_object(
      'top_intents', (
        SELECT COALESCE(jsonb_agg(jsonb_build_object('intent', intent, 'count', c) ORDER BY c DESC), '[]'::jsonb)
        FROM (
          SELECT intent, count(*) AS c FROM public.sth_ai_drafts
          WHERE intent IS NOT NULL AND created_at >= now() - interval '30 days'
          GROUP BY intent ORDER BY count(*) DESC LIMIT 6
        ) t
      ),
      'top_templates', (
        SELECT COALESCE(jsonb_agg(jsonb_build_object('name', name, 'uses', uses_count, 'success', success_count) ORDER BY uses_count DESC), '[]'::jsonb)
        FROM (
          SELECT name, uses_count, success_count FROM public.sth_ai_templates
          WHERE active ORDER BY uses_count DESC LIMIT 6
        ) t
      ),
      'top_conversao_templates', (
        SELECT COALESCE(jsonb_agg(jsonb_build_object('name', name, 'success', success_count, 'uses', uses_count) ORDER BY success_count DESC), '[]'::jsonb)
        FROM (
          SELECT name, success_count, uses_count FROM public.sth_ai_templates
          WHERE active AND success_count > 0 ORDER BY success_count DESC LIMIT 6
        ) t
      )
    ),
    'series', jsonb_build_object(
      'receita_30d', (
        SELECT COALESCE(jsonb_agg(jsonb_build_object('day', d, 'value', val) ORDER BY d), '[]'::jsonb)
        FROM (
          SELECT to_char(d::date, 'YYYY-MM-DD') AS d,
            COALESCE((SELECT SUM(amount) FROM public.payments WHERE status='approved' AND created_at::date = d::date),0) AS val
          FROM generate_series(current_date - 29, current_date, '1 day') d
        ) t
      ),
      'leads_30d', (
        SELECT COALESCE(jsonb_agg(jsonb_build_object('day', d, 'value', val) ORDER BY d), '[]'::jsonb)
        FROM (
          SELECT to_char(d::date, 'YYYY-MM-DD') AS d,
            COALESCE((SELECT count(*) FROM public.sth_memory WHERE created_at::date = d::date),0) AS val
          FROM generate_series(current_date - 29, current_date, '1 day') d
        ) t
      ),
      'conversoes_30d', (
        SELECT COALESCE(jsonb_agg(jsonb_build_object('day', d, 'value', val) ORDER BY d), '[]'::jsonb)
        FROM (
          SELECT to_char(d::date, 'YYYY-MM-DD') AS d,
            COALESCE((SELECT count(*) FROM public.payments WHERE status='approved' AND created_at::date = d::date),0) AS val
          FROM generate_series(current_date - 29, current_date, '1 day') d
        ) t
      )
    ),
    'alertas', jsonb_build_object(
      'leads_quentes',    (SELECT count(*) FROM public.sth_memory WHERE temperature IN ('quente','pronto')),
      'risco_evasao',     (SELECT count(*) FROM public.subscriptions s
                            WHERE s.status='active' AND s.end_date >= current_date
                              AND NOT EXISTS (SELECT 1 FROM public.weight_logs w WHERE w.user_id=s.user_id AND w.logged_at >= now() - interval '45 days')),
      'renovacao_proxima',(SELECT count(*) FROM public.subscriptions WHERE status='active' AND end_date BETWEEN current_date AND current_date+7),
      'atendimento_parado',(SELECT count(*) FROM public.crm_tickets WHERE closed_at IS NULL AND last_message_at < now() - interval '60 minutes'),
      'atualizacao_pendente',(SELECT count(*) FROM public.subscriptions s
                              WHERE s.status='active' AND s.end_date >= current_date
                                AND NOT EXISTS (SELECT 1 FROM public.weight_logs w WHERE w.user_id=s.user_id AND w.logged_at >= now() - interval '29 days'))
    )
  ) INTO v;
  RETURN v;
END $$;