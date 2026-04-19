ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS preview_unlocked boolean NOT NULL DEFAULT false;