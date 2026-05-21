-- Helper: identifica admin ou admin_viewer
CREATE OR REPLACE FUNCTION public.has_admin_view(_user_id uuid)
RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id
      AND role::text IN ('admin', 'admin_viewer')
  )
$$;

-- Adiciona política SELECT para admin_viewer em todas as tabelas do schema public com RLS habilitada
DO $$
DECLARE
  r RECORD;
  policy_name text := 'Admin viewers can read all';
BEGIN
  FOR r IN
    SELECT c.relname AS tablename
    FROM pg_class c
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE n.nspname = 'public'
      AND c.relkind = 'r'
      AND c.relrowsecurity = true
  LOOP
    -- Remove se já existir (idempotente)
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.%I', policy_name, r.tablename);
    EXECUTE format(
      'CREATE POLICY %I ON public.%I FOR SELECT TO authenticated USING (public.has_admin_view(auth.uid()))',
      policy_name, r.tablename
    );
  END LOOP;
END
$$;