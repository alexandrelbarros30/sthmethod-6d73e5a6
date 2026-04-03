
CREATE TABLE public.protocol_library (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  created_by UUID NOT NULL,
  title TEXT NOT NULL,
  content TEXT NOT NULL DEFAULT '',
  items_json JSONB NOT NULL DEFAULT '[]'::jsonb,
  extra_categories_json JSONB NOT NULL DEFAULT '[]'::jsonb,
  category_contents_json JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.protocol_library ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage protocol library"
ON public.protocol_library FOR ALL TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Consultors can manage protocol library"
ON public.protocol_library FOR ALL TO authenticated
USING (has_role(auth.uid(), 'consultor'::app_role))
WITH CHECK (has_role(auth.uid(), 'consultor'::app_role));

CREATE TRIGGER update_protocol_library_updated_at
BEFORE UPDATE ON public.protocol_library
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
