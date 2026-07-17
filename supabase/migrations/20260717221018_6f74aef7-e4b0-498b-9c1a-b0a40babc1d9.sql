
CREATE TABLE IF NOT EXISTS public.library_write_audit (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  actor_id uuid,
  actor_role text,
  table_name text NOT NULL,
  record_id uuid,
  operation text NOT NULL CHECK (operation IN ('insert','update','delete','denied_insert','denied_update','denied_delete')),
  outcome text NOT NULL CHECK (outcome IN ('allowed','denied')),
  attempted_payload jsonb,
  created_by_owner uuid,
  reason text,
  created_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT ON public.library_write_audit TO authenticated;
GRANT ALL ON public.library_write_audit TO service_role;

ALTER TABLE public.library_write_audit ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins view audit"
  ON public.library_write_audit FOR SELECT TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'admin_viewer'::app_role));

CREATE POLICY "Authenticated insert own attempts"
  ON public.library_write_audit FOR INSERT TO authenticated
  WITH CHECK (actor_id = auth.uid());

CREATE INDEX IF NOT EXISTS library_write_audit_table_time_idx
  ON public.library_write_audit (table_name, created_at DESC);
CREATE INDEX IF NOT EXISTS library_write_audit_actor_time_idx
  ON public.library_write_audit (actor_id, created_at DESC);

-- Trigger genérico para escritas bem-sucedidas
CREATE OR REPLACE FUNCTION public.log_library_write_allowed()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_role text;
  v_owner uuid;
  v_record_id uuid;
BEGIN
  SELECT role::text INTO v_role FROM public.user_roles WHERE user_id = auth.uid() LIMIT 1;

  IF TG_OP = 'DELETE' THEN
    v_record_id := (row_to_json(OLD)->>'id')::uuid;
    v_owner := (row_to_json(OLD)->>'created_by')::uuid;
    INSERT INTO public.library_write_audit
      (actor_id, actor_role, table_name, record_id, operation, outcome, attempted_payload, created_by_owner)
    VALUES (auth.uid(), v_role, TG_TABLE_NAME, v_record_id, 'delete', 'allowed', to_jsonb(OLD), v_owner);
    RETURN OLD;
  ELSE
    v_record_id := (row_to_json(NEW)->>'id')::uuid;
    v_owner := (row_to_json(NEW)->>'created_by')::uuid;
    INSERT INTO public.library_write_audit
      (actor_id, actor_role, table_name, record_id, operation, outcome, attempted_payload, created_by_owner)
    VALUES (auth.uid(), v_role, TG_TABLE_NAME, v_record_id, lower(TG_OP), 'allowed', to_jsonb(NEW), v_owner);
    RETURN NEW;
  END IF;
END;
$$;

-- Vincular triggers às 4 tabelas
DROP TRIGGER IF EXISTS trg_audit_training_programs ON public.training_programs;
CREATE TRIGGER trg_audit_training_programs
AFTER INSERT OR UPDATE OR DELETE ON public.training_programs
FOR EACH ROW EXECUTE FUNCTION public.log_library_write_allowed();

DROP TRIGGER IF EXISTS trg_audit_exercise_library ON public.exercise_library;
CREATE TRIGGER trg_audit_exercise_library
AFTER INSERT OR UPDATE OR DELETE ON public.exercise_library
FOR EACH ROW EXECUTE FUNCTION public.log_library_write_allowed();

DROP TRIGGER IF EXISTS trg_audit_diet_library ON public.diet_library;
CREATE TRIGGER trg_audit_diet_library
AFTER INSERT OR UPDATE OR DELETE ON public.diet_library
FOR EACH ROW EXECUTE FUNCTION public.log_library_write_allowed();

DROP TRIGGER IF EXISTS trg_audit_protocol_library ON public.protocol_library;
CREATE TRIGGER trg_audit_protocol_library
AFTER INSERT OR UPDATE OR DELETE ON public.protocol_library
FOR EACH ROW EXECUTE FUNCTION public.log_library_write_allowed();

-- RPC para o app registrar tentativas NEGADAS (chamado no catch do 42501)
CREATE OR REPLACE FUNCTION public.log_library_write_denied(
  _table_name text,
  _record_id uuid,
  _operation text,
  _attempted_payload jsonb,
  _reason text DEFAULT NULL
) RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_role text;
  v_owner uuid;
  v_id uuid;
BEGIN
  IF _table_name NOT IN ('training_programs','exercise_library','diet_library','protocol_library') THEN
    RAISE EXCEPTION 'Tabela inválida para auditoria';
  END IF;
  IF _operation NOT IN ('insert','update','delete') THEN
    RAISE EXCEPTION 'Operação inválida';
  END IF;

  SELECT role::text INTO v_role FROM public.user_roles WHERE user_id = auth.uid() LIMIT 1;

  IF _record_id IS NOT NULL THEN
    EXECUTE format('SELECT created_by FROM public.%I WHERE id = $1', _table_name)
      INTO v_owner USING _record_id;
  END IF;

  INSERT INTO public.library_write_audit
    (actor_id, actor_role, table_name, record_id, operation, outcome, attempted_payload, created_by_owner, reason)
  VALUES
    (auth.uid(), v_role, _table_name, _record_id, 'denied_' || _operation, 'denied', _attempted_payload, v_owner, _reason)
  RETURNING id INTO v_id;

  RETURN v_id;
END;
$$;

GRANT EXECUTE ON FUNCTION public.log_library_write_denied(text, uuid, text, jsonb, text) TO authenticated;
