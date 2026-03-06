
-- Create training_programs table
CREATE TABLE public.training_programs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  poster_url text DEFAULT '',
  details text DEFAULT '',
  created_by uuid NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Add program_id, released, subtitle, sort_order to workout_templates
ALTER TABLE public.workout_templates 
  ADD COLUMN program_id uuid REFERENCES public.training_programs(id) ON DELETE CASCADE,
  ADD COLUMN released boolean NOT NULL DEFAULT true,
  ADD COLUMN subtitle text DEFAULT '',
  ADD COLUMN sort_order integer DEFAULT 0;

-- Enable RLS on training_programs
ALTER TABLE public.training_programs ENABLE ROW LEVEL SECURITY;

-- RLS policies for training_programs
CREATE POLICY "Admins can manage training programs" ON public.training_programs
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Consultors can manage own training programs" ON public.training_programs
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'consultor'))
  WITH CHECK (public.has_role(auth.uid(), 'consultor'));

CREATE POLICY "Students can view assigned programs" ON public.training_programs
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.student_workout_assignments swa
      JOIN public.workout_templates wt ON wt.id = swa.template_id
      WHERE wt.program_id = training_programs.id
      AND swa.user_id = auth.uid()
      AND swa.active = true
    )
  );
