
-- 1. Role enum & user_roles table
CREATE TYPE public.app_role AS ENUM ('admin', 'student');

CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role app_role NOT NULL,
  UNIQUE (user_id, role)
);
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Security definer function for role checks
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role = _role
  )
$$;

-- RLS for user_roles
CREATE POLICY "Users can view own roles" ON public.user_roles
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all roles" ON public.user_roles
  FOR SELECT USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can manage roles" ON public.user_roles
  FOR ALL USING (public.has_role(auth.uid(), 'admin'));

-- 2. Profiles table
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
  full_name TEXT NOT NULL DEFAULT '',
  email TEXT NOT NULL DEFAULT '',
  phone TEXT DEFAULT '',
  avatar_url TEXT DEFAULT '',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own profile" ON public.profiles
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all profiles" ON public.profiles
  FOR SELECT USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Users can update own profile" ON public.profiles
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own profile" ON public.profiles
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- 3. Plans table
CREATE TABLE public.plans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  price TEXT NOT NULL,
  duration TEXT NOT NULL,
  duration_days INTEGER NOT NULL DEFAULT 30,
  benefits TEXT[] NOT NULL DEFAULT '{}',
  active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.plans ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone authenticated can view plans" ON public.plans
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Admins can manage plans" ON public.plans
  FOR ALL USING (public.has_role(auth.uid(), 'admin'));

-- 4. Subscriptions table
CREATE TABLE public.subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  plan_id UUID REFERENCES public.plans(id) NOT NULL,
  start_date DATE NOT NULL DEFAULT CURRENT_DATE,
  end_date DATE NOT NULL,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'expired', 'cancelled')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own subscription" ON public.subscriptions
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Admins can manage subscriptions" ON public.subscriptions
  FOR ALL USING (public.has_role(auth.uid(), 'admin'));

-- 5. Diet meals table
CREATE TABLE public.diet_meals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  time TEXT NOT NULL,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.diet_meals ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own meals" ON public.diet_meals
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Admins can manage meals" ON public.diet_meals
  FOR ALL USING (public.has_role(auth.uid(), 'admin'));

-- 6. Diet foods (items within meals)
CREATE TABLE public.diet_foods (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  meal_id UUID REFERENCES public.diet_meals(id) ON DELETE CASCADE NOT NULL,
  item TEXT NOT NULL,
  quantity TEXT NOT NULL,
  notes TEXT DEFAULT '',
  sort_order INTEGER NOT NULL DEFAULT 0
);
ALTER TABLE public.diet_foods ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own foods" ON public.diet_foods
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.diet_meals WHERE id = meal_id AND user_id = auth.uid())
  );

CREATE POLICY "Admins can manage foods" ON public.diet_foods
  FOR ALL USING (public.has_role(auth.uid(), 'admin'));

-- 7. Training weeks
CREATE TABLE public.training_weeks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.training_weeks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own training" ON public.training_weeks
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Admins can manage training" ON public.training_weeks
  FOR ALL USING (public.has_role(auth.uid(), 'admin'));

-- 8. Training exercises
CREATE TABLE public.training_exercises (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  week_id UUID REFERENCES public.training_weeks(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  sets TEXT NOT NULL DEFAULT '',
  reps TEXT NOT NULL DEFAULT '',
  notes TEXT DEFAULT '',
  video_url TEXT DEFAULT '',
  sort_order INTEGER NOT NULL DEFAULT 0
);
ALTER TABLE public.training_exercises ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own exercises" ON public.training_exercises
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.training_weeks WHERE id = week_id AND user_id = auth.uid())
  );

CREATE POLICY "Admins can manage exercises" ON public.training_exercises
  FOR ALL USING (public.has_role(auth.uid(), 'admin'));

-- 9. Protocols
CREATE TABLE public.protocols (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  category TEXT NOT NULL CHECK (category IN ('supplement', 'medication')),
  name TEXT NOT NULL,
  dosage TEXT NOT NULL DEFAULT '',
  frequency TEXT NOT NULL DEFAULT '',
  notes TEXT DEFAULT '',
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.protocols ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own protocols" ON public.protocols
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Admins can manage protocols" ON public.protocols
  FOR ALL USING (public.has_role(auth.uid(), 'admin'));

-- 10. Educational content
CREATE TABLE public.content (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT DEFAULT '',
  type TEXT NOT NULL CHECK (type IN ('article', 'pdf', 'video')),
  url TEXT DEFAULT '',
  body TEXT DEFAULT '',
  min_plan_level INTEGER NOT NULL DEFAULT 0,
  published BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.content ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view published content" ON public.content
  FOR SELECT TO authenticated USING (published = true);

CREATE POLICY "Admins can manage content" ON public.content
  FOR ALL USING (public.has_role(auth.uid(), 'admin'));

-- 11. Auto-create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (user_id, full_name, email)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
    COALESCE(NEW.email, '')
  );
  -- Default role: student
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, 'student');
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 12. Updated_at trigger
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_subscriptions_updated_at BEFORE UPDATE ON public.subscriptions
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 13. Seed plans
INSERT INTO public.plans (name, price, duration, duration_days, benefits) VALUES
  ('Mensal', 'R$ 297', '30 dias', 30, ARRAY['Dieta personalizada', 'Treino estruturado', 'Suporte por chat']),
  ('Trimestral', 'R$ 797', '90 dias', 90, ARRAY['Dieta personalizada', 'Treino estruturado', 'Protocolo de suplementação', 'Suporte prioritário']),
  ('Semestral', 'R$ 1.397', '180 dias', 180, ARRAY['Dieta personalizada', 'Treino estruturado', 'Protocolo completo', 'Conteúdos exclusivos', 'Suporte VIP']),
  ('Anual', 'R$ 2.397', '365 dias', 365, ARRAY['Acesso completo', 'Dieta personalizada', 'Treino estruturado', 'Protocolo completo', 'Conteúdos exclusivos', 'Suporte VIP', 'Consultas mensais']);
