
CREATE TABLE public.cas_quiz_questions (
  id BIGSERIAL PRIMARY KEY,
  exam TEXT NOT NULL,
  discipline TEXT NOT NULL,
  question_num INT NOT NULL,
  statement TEXT NOT NULL,
  option_a TEXT NOT NULL,
  option_b TEXT NOT NULL,
  option_c TEXT NOT NULL,
  option_d TEXT NOT NULL,
  correct_answer CHAR(1) NOT NULL CHECK (correct_answer IN ('A','B','C','D')),
  page_ref INT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX cas_quiz_questions_discipline_idx ON public.cas_quiz_questions(discipline);
CREATE INDEX cas_quiz_questions_exam_idx ON public.cas_quiz_questions(exam);

GRANT SELECT ON public.cas_quiz_questions TO anon, authenticated;
GRANT ALL ON public.cas_quiz_questions TO service_role;

ALTER TABLE public.cas_quiz_questions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read cas quiz" ON public.cas_quiz_questions FOR SELECT USING (true);
