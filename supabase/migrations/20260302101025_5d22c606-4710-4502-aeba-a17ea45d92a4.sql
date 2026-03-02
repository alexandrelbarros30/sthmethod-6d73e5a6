
-- Body images table
CREATE TABLE public.body_images (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  type TEXT NOT NULL, -- 'front', 'back', 'profile'
  image_url TEXT NOT NULL,
  uploaded_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  is_current BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.body_images ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage body images"
ON public.body_images FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Users can view own body images"
ON public.body_images FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own body images"
ON public.body_images FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own body images"
ON public.body_images FOR UPDATE
USING (auth.uid() = user_id);

-- Add onboarding_complete flag to profiles
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS onboarding_complete BOOLEAN NOT NULL DEFAULT false;

-- Create storage bucket for body images
INSERT INTO storage.buckets (id, name, public) VALUES ('body-images', 'body-images', true)
ON CONFLICT (id) DO NOTHING;

-- Storage policies for body images
CREATE POLICY "Anyone can view body images"
ON storage.objects FOR SELECT
USING (bucket_id = 'body-images');

CREATE POLICY "Authenticated users can upload body images"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'body-images' AND auth.role() = 'authenticated');

CREATE POLICY "Users can update own body images"
ON storage.objects FOR UPDATE
USING (bucket_id = 'body-images' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Admins can delete body images"
ON storage.objects FOR DELETE
USING (bucket_id = 'body-images' AND (SELECT has_role(auth.uid(), 'admin'::app_role)));
