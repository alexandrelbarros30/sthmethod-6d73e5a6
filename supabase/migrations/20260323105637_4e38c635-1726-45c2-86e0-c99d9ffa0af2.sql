
CREATE TABLE public.protocol_category_content (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  category TEXT NOT NULL,
  content TEXT NOT NULL DEFAULT '',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, category)
);

ALTER TABLE public.protocol_category_content ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage protocol category content"
ON public.protocol_category_content
FOR ALL
TO authenticated
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Consultors can manage linked protocol category content"
ON public.protocol_category_content
FOR ALL
TO authenticated
USING (public.has_role(auth.uid(), 'consultor') AND public.is_consultant_of(auth.uid(), user_id))
WITH CHECK (public.has_role(auth.uid(), 'consultor') AND public.is_consultant_of(auth.uid(), user_id));

CREATE POLICY "Students can view own protocol category content"
ON public.protocol_category_content
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);
