
-- Enums
CREATE TYPE public.tele_specialty AS ENUM (
  'medico','nutricionista','psicologo','psiquiatra','terapeuta','educador_fisico','consultor','outro'
);
CREATE TYPE public.appointment_status AS ENUM (
  'scheduled','confirmed','in_progress','completed','cancelled','no_show'
);
CREATE TYPE public.appointment_modality AS ENUM ('video','in_person','chat');
CREATE TYPE public.medical_record_section AS ENUM (
  'anamnese','evolucao_clinica','exames','estrategia_nutricional','protocolo',
  'prescricao','emocoes_humor','sono','performance','sintomas','historico','outros'
);

-- Tele professionals
CREATE TABLE public.tele_professionals (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE,
  specialty tele_specialty NOT NULL DEFAULT 'consultor',
  council_id TEXT,
  council_uf TEXT,
  bio TEXT,
  active BOOLEAN NOT NULL DEFAULT true,
  video_room_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.tele_professionals ENABLE ROW LEVEL SECURITY;
CREATE POLICY "View professionals" ON public.tele_professionals FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admins manage professionals" ON public.tele_professionals FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Self update professional" ON public.tele_professionals FOR UPDATE TO authenticated USING (auth.uid() = user_id);
CREATE TRIGGER trg_tele_pros_updated_at BEFORE UPDATE ON public.tele_professionals
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Appointments
CREATE TABLE public.appointments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  patient_user_id UUID NOT NULL,
  professional_user_id UUID NOT NULL,
  scheduled_at TIMESTAMPTZ NOT NULL,
  duration_min INTEGER NOT NULL DEFAULT 30 CHECK (duration_min BETWEEN 5 AND 240),
  modality appointment_modality NOT NULL DEFAULT 'video',
  status appointment_status NOT NULL DEFAULT 'scheduled',
  video_url TEXT,
  reason TEXT,
  notes TEXT,
  patient_notes TEXT,
  started_at TIMESTAMPTZ,
  ended_at TIMESTAMPTZ,
  created_by UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_appointments_patient ON public.appointments(patient_user_id, scheduled_at DESC);
CREATE INDEX idx_appointments_professional ON public.appointments(professional_user_id, scheduled_at DESC);
CREATE INDEX idx_appointments_status_time ON public.appointments(status, scheduled_at);
ALTER TABLE public.appointments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Patient sees own appointments" ON public.appointments FOR SELECT TO authenticated USING (auth.uid() = patient_user_id);
CREATE POLICY "Professional sees own appointments" ON public.appointments FOR SELECT TO authenticated USING (auth.uid() = professional_user_id);
CREATE POLICY "Admin sees all appointments" ON public.appointments FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'admin_viewer'));
CREATE POLICY "Admin and professional manage appointments" ON public.appointments FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin') OR auth.uid() = professional_user_id)
  WITH CHECK (public.has_role(auth.uid(), 'admin') OR auth.uid() = professional_user_id);
CREATE TRIGGER trg_appointments_updated_at BEFORE UPDATE ON public.appointments
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Medical records (modular)
CREATE TABLE public.medical_records (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  patient_user_id UUID NOT NULL,
  professional_user_id UUID NOT NULL,
  appointment_id UUID REFERENCES public.appointments(id) ON DELETE SET NULL,
  section medical_record_section NOT NULL,
  title TEXT,
  content TEXT,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  ai_summary TEXT,
  pinned BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_records_patient_section ON public.medical_records(patient_user_id, section, created_at DESC);
ALTER TABLE public.medical_records ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Patient reads own records" ON public.medical_records FOR SELECT TO authenticated USING (auth.uid() = patient_user_id);
CREATE POLICY "Staff reads records" ON public.medical_records FOR SELECT TO authenticated
  USING (auth.uid() = professional_user_id OR public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'consultor'));
CREATE POLICY "Staff manages records" ON public.medical_records FOR ALL TO authenticated
  USING (auth.uid() = professional_user_id OR public.has_role(auth.uid(), 'admin'))
  WITH CHECK (auth.uid() = professional_user_id OR public.has_role(auth.uid(), 'admin'));
CREATE TRIGGER trg_records_updated_at BEFORE UPDATE ON public.medical_records
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
