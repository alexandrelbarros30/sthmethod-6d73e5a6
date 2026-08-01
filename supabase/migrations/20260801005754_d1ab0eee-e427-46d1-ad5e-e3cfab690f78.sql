-- ==== ENUMS ====
CREATE TYPE public.coach_member_role AS ENUM ('owner', 'professor');
CREATE TYPE public.coach_plan AS ENUM ('start', 'pro', 'business', 'enterprise');
CREATE TYPE public.coach_student_status AS ENUM ('pending', 'active', 'inactive');

-- ==== TENANTS ====
CREATE TABLE public.coach_tenants (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  owner_id UUID NOT NULL,
  business_name TEXT NOT NULL,
  legal_name TEXT,
  tax_id TEXT,
  cref TEXT,
  phone TEXT,
  email TEXT,
  logo_url TEXT,
  primary_color TEXT NOT NULL DEFAULT '#22A05E',
  secondary_color TEXT NOT NULL DEFAULT '#0A0A0A',
  plan public.coach_plan NOT NULL DEFAULT 'start',
  student_limit INTEGER NOT NULL DEFAULT 50,
  active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.coach_tenants TO authenticated;
GRANT ALL ON public.coach_tenants TO service_role;
ALTER TABLE public.coach_tenants ENABLE ROW LEVEL SECURITY;

-- ==== MEMBERS ====
CREATE TABLE public.coach_members (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  tenant_id UUID NOT NULL REFERENCES public.coach_tenants(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  role public.coach_member_role NOT NULL DEFAULT 'professor',
  full_name TEXT,
  email TEXT,
  phone TEXT,
  cref TEXT,
  active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (tenant_id, user_id)
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.coach_members TO authenticated;
GRANT ALL ON public.coach_members TO service_role;
ALTER TABLE public.coach_members ENABLE ROW LEVEL SECURITY;

-- ==== HELPERS (security definer) ====
CREATE OR REPLACE FUNCTION public.coach_is_member(_tenant_id UUID)
RETURNS BOOLEAN LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.coach_members
    WHERE tenant_id = _tenant_id AND user_id = auth.uid() AND active = true
  );
$$;

CREATE OR REPLACE FUNCTION public.coach_is_owner(_tenant_id UUID)
RETURNS BOOLEAN LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.coach_members
    WHERE tenant_id = _tenant_id AND user_id = auth.uid() AND active = true AND role = 'owner'
  );
$$;

-- ==== STUDENTS ====
CREATE TABLE public.coach_students (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  tenant_id UUID NOT NULL REFERENCES public.coach_tenants(id) ON DELETE CASCADE,
  trainer_id UUID REFERENCES public.coach_members(id) ON DELETE SET NULL,
  user_id UUID,
  full_name TEXT NOT NULL,
  email TEXT,
  phone TEXT,
  birth_date DATE,
  gender TEXT,
  height_cm NUMERIC,
  weight_kg NUMERIC,
  goal TEXT,
  injuries TEXT,
  pathologies TEXT,
  notes TEXT,
  photos JSONB NOT NULL DEFAULT '[]'::jsonb,
  status public.coach_student_status NOT NULL DEFAULT 'pending',
  onboarding_completed_at TIMESTAMPTZ,
  terms_accepted_at TIMESTAMPTZ,
  last_access_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (tenant_id, user_id)
);

CREATE INDEX coach_students_tenant_idx ON public.coach_students(tenant_id);
CREATE INDEX coach_students_user_idx ON public.coach_students(user_id);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.coach_students TO authenticated;
GRANT ALL ON public.coach_students TO service_role;
ALTER TABLE public.coach_students ENABLE ROW LEVEL SECURITY;

-- ==== INVITES ====
CREATE TABLE public.coach_invites (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  tenant_id UUID NOT NULL REFERENCES public.coach_tenants(id) ON DELETE CASCADE,
  trainer_id UUID REFERENCES public.coach_members(id) ON DELETE SET NULL,
  token TEXT NOT NULL UNIQUE DEFAULT encode(gen_random_bytes(16), 'hex'),
  full_name TEXT,
  email TEXT,
  phone TEXT,
  max_uses INTEGER NOT NULL DEFAULT 1,
  used_count INTEGER NOT NULL DEFAULT 0,
  expires_at TIMESTAMPTZ NOT NULL DEFAULT (now() + interval '14 days'),
  revoked_at TIMESTAMPTZ,
  created_by UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.coach_invites TO authenticated;
GRANT ALL ON public.coach_invites TO service_role;
ALTER TABLE public.coach_invites ENABLE ROW LEVEL SECURITY;

-- ==== POLICIES: tenants ====
CREATE POLICY "coach_tenants_select_members" ON public.coach_tenants
  FOR SELECT TO authenticated
  USING (public.coach_is_member(id) OR owner_id = auth.uid()
         OR EXISTS (SELECT 1 FROM public.coach_students s WHERE s.tenant_id = coach_tenants.id AND s.user_id = auth.uid()));

CREATE POLICY "coach_tenants_insert_self" ON public.coach_tenants
  FOR INSERT TO authenticated WITH CHECK (owner_id = auth.uid());

CREATE POLICY "coach_tenants_update_owner" ON public.coach_tenants
  FOR UPDATE TO authenticated USING (public.coach_is_owner(id) OR owner_id = auth.uid())
  WITH CHECK (public.coach_is_owner(id) OR owner_id = auth.uid());

CREATE POLICY "coach_tenants_delete_owner" ON public.coach_tenants
  FOR DELETE TO authenticated USING (owner_id = auth.uid());

-- ==== POLICIES: members ====
CREATE POLICY "coach_members_select" ON public.coach_members
  FOR SELECT TO authenticated
  USING (user_id = auth.uid() OR public.coach_is_member(tenant_id));

CREATE POLICY "coach_members_insert" ON public.coach_members
  FOR INSERT TO authenticated
  WITH CHECK (
    public.coach_is_owner(tenant_id)
    OR EXISTS (SELECT 1 FROM public.coach_tenants t WHERE t.id = tenant_id AND t.owner_id = auth.uid())
  );

CREATE POLICY "coach_members_update_owner" ON public.coach_members
  FOR UPDATE TO authenticated USING (public.coach_is_owner(tenant_id)) WITH CHECK (public.coach_is_owner(tenant_id));

CREATE POLICY "coach_members_delete_owner" ON public.coach_members
  FOR DELETE TO authenticated USING (public.coach_is_owner(tenant_id));

-- ==== POLICIES: students ====
CREATE POLICY "coach_students_select" ON public.coach_students
  FOR SELECT TO authenticated
  USING (
    user_id = auth.uid()
    OR public.coach_is_owner(tenant_id)
    OR (public.coach_is_member(tenant_id) AND trainer_id IN (
          SELECT m.id FROM public.coach_members m WHERE m.tenant_id = coach_students.tenant_id AND m.user_id = auth.uid()))
  );

CREATE POLICY "coach_students_insert" ON public.coach_students
  FOR INSERT TO authenticated WITH CHECK (public.coach_is_member(tenant_id));

CREATE POLICY "coach_students_update" ON public.coach_students
  FOR UPDATE TO authenticated
  USING (
    user_id = auth.uid()
    OR public.coach_is_owner(tenant_id)
    OR (public.coach_is_member(tenant_id) AND trainer_id IN (
          SELECT m.id FROM public.coach_members m WHERE m.tenant_id = coach_students.tenant_id AND m.user_id = auth.uid()))
  )
  WITH CHECK (
    user_id = auth.uid()
    OR public.coach_is_owner(tenant_id)
    OR (public.coach_is_member(tenant_id) AND trainer_id IN (
          SELECT m.id FROM public.coach_members m WHERE m.tenant_id = coach_students.tenant_id AND m.user_id = auth.uid()))
  );

CREATE POLICY "coach_students_delete_owner" ON public.coach_students
  FOR DELETE TO authenticated USING (public.coach_is_owner(tenant_id));

-- ==== POLICIES: invites ====
CREATE POLICY "coach_invites_select" ON public.coach_invites
  FOR SELECT TO authenticated USING (public.coach_is_member(tenant_id));

CREATE POLICY "coach_invites_insert" ON public.coach_invites
  FOR INSERT TO authenticated WITH CHECK (public.coach_is_member(tenant_id));

CREATE POLICY "coach_invites_update" ON public.coach_invites
  FOR UPDATE TO authenticated USING (public.coach_is_member(tenant_id)) WITH CHECK (public.coach_is_member(tenant_id));

CREATE POLICY "coach_invites_delete" ON public.coach_invites
  FOR DELETE TO authenticated USING (public.coach_is_member(tenant_id));

-- ==== PUBLIC INVITE LOOKUP (safe fields only) ====
CREATE OR REPLACE FUNCTION public.coach_invite_preview(_token TEXT)
RETURNS JSONB LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public AS $$
DECLARE r RECORD;
BEGIN
  SELECT i.*, t.business_name, t.logo_url, t.primary_color
    INTO r
  FROM public.coach_invites i
  JOIN public.coach_tenants t ON t.id = i.tenant_id
  WHERE i.token = _token LIMIT 1;

  IF r IS NULL THEN RETURN jsonb_build_object('state','invalid'); END IF;
  IF r.revoked_at IS NOT NULL THEN RETURN jsonb_build_object('state','revoked'); END IF;
  IF r.expires_at < now() THEN RETURN jsonb_build_object('state','expired'); END IF;
  IF r.used_count >= r.max_uses THEN RETURN jsonb_build_object('state','used'); END IF;

  RETURN jsonb_build_object(
    'state','valid',
    'business_name', r.business_name,
    'logo_url', r.logo_url,
    'primary_color', r.primary_color,
    'full_name', COALESCE(r.full_name,''),
    'email', COALESCE(r.email,''),
    'phone', COALESCE(r.phone,'')
  );
END;
$$;

REVOKE ALL ON FUNCTION public.coach_invite_preview(TEXT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.coach_invite_preview(TEXT) TO anon, authenticated;

-- ==== REDEEM INVITE (authenticated student) ====
CREATE OR REPLACE FUNCTION public.coach_redeem_invite(_token TEXT, _full_name TEXT)
RETURNS JSONB LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  r RECORD;
  v_uid UUID := auth.uid();
  v_active INT;
  v_limit INT;
  v_student_id UUID;
BEGIN
  IF v_uid IS NULL THEN RAISE EXCEPTION 'Autenticação obrigatória'; END IF;

  SELECT * INTO r FROM public.coach_invites WHERE token = _token FOR UPDATE;
  IF r IS NULL THEN RAISE EXCEPTION 'Convite inválido'; END IF;
  IF r.revoked_at IS NOT NULL THEN RAISE EXCEPTION 'Convite revogado'; END IF;
  IF r.expires_at < now() THEN RAISE EXCEPTION 'Convite expirado'; END IF;
  IF r.used_count >= r.max_uses THEN RAISE EXCEPTION 'Convite já utilizado'; END IF;

  SELECT student_limit INTO v_limit FROM public.coach_tenants WHERE id = r.tenant_id;
  SELECT count(*) INTO v_active FROM public.coach_students
    WHERE tenant_id = r.tenant_id AND status = 'active';
  IF v_active >= v_limit THEN RAISE EXCEPTION 'Limite de alunos do plano atingido'; END IF;

  SELECT id INTO v_student_id FROM public.coach_students
    WHERE tenant_id = r.tenant_id AND user_id = v_uid LIMIT 1;

  IF v_student_id IS NULL THEN
    INSERT INTO public.coach_students (tenant_id, trainer_id, user_id, full_name, email, phone, status)
    VALUES (r.tenant_id, r.trainer_id, v_uid, COALESCE(NULLIF(trim(_full_name),''), COALESCE(r.full_name,'Aluno')),
            r.email, r.phone, 'active')
    RETURNING id INTO v_student_id;
  ELSE
    UPDATE public.coach_students SET status = 'active', trainer_id = COALESCE(trainer_id, r.trainer_id), updated_at = now()
      WHERE id = v_student_id;
  END IF;

  UPDATE public.coach_invites SET used_count = used_count + 1, updated_at = now() WHERE id = r.id;

  RETURN jsonb_build_object('ok', true, 'student_id', v_student_id, 'tenant_id', r.tenant_id);
END;
$$;

REVOKE ALL ON FUNCTION public.coach_redeem_invite(TEXT, TEXT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.coach_redeem_invite(TEXT, TEXT) TO authenticated;

-- ==== PLAN LIMIT ENFORCEMENT ====
CREATE OR REPLACE FUNCTION public.coach_enforce_student_limit()
RETURNS TRIGGER LANGUAGE plpgsql SET search_path = public AS $$
DECLARE v_limit INT; v_active INT;
BEGIN
  IF NEW.status <> 'active' THEN RETURN NEW; END IF;
  IF TG_OP = 'UPDATE' AND OLD.status = 'active' THEN RETURN NEW; END IF;

  SELECT student_limit INTO v_limit FROM public.coach_tenants WHERE id = NEW.tenant_id;
  SELECT count(*) INTO v_active FROM public.coach_students
    WHERE tenant_id = NEW.tenant_id AND status = 'active' AND id <> NEW.id;

  IF v_limit IS NOT NULL AND v_active >= v_limit THEN
    RAISE EXCEPTION 'Limite de % alunos ativos do plano atingido', v_limit;
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER coach_students_limit
  BEFORE INSERT OR UPDATE OF status ON public.coach_students
  FOR EACH ROW EXECUTE FUNCTION public.coach_enforce_student_limit();

-- ==== OWNER MEMBER AUTO-CREATE ====
CREATE OR REPLACE FUNCTION public.coach_create_owner_member()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.coach_members (tenant_id, user_id, role, full_name, email, phone, cref)
  VALUES (NEW.id, NEW.owner_id, 'owner', NEW.legal_name, NEW.email, NEW.phone, NEW.cref)
  ON CONFLICT (tenant_id, user_id) DO NOTHING;
  RETURN NEW;
END;
$$;

CREATE TRIGGER coach_tenants_owner_member
  AFTER INSERT ON public.coach_tenants
  FOR EACH ROW EXECUTE FUNCTION public.coach_create_owner_member();

-- ==== updated_at triggers ====
CREATE OR REPLACE FUNCTION public.coach_touch_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql SET search_path = public AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END; $$;

CREATE TRIGGER coach_tenants_touch BEFORE UPDATE ON public.coach_tenants
  FOR EACH ROW EXECUTE FUNCTION public.coach_touch_updated_at();
CREATE TRIGGER coach_members_touch BEFORE UPDATE ON public.coach_members
  FOR EACH ROW EXECUTE FUNCTION public.coach_touch_updated_at();
CREATE TRIGGER coach_students_touch BEFORE UPDATE ON public.coach_students
  FOR EACH ROW EXECUTE FUNCTION public.coach_touch_updated_at();
CREATE TRIGGER coach_invites_touch BEFORE UPDATE ON public.coach_invites
  FOR EACH ROW EXECUTE FUNCTION public.coach_touch_updated_at();