ALTER TABLE public.cas_users ADD COLUMN IF NOT EXISTS is_admin boolean NOT NULL DEFAULT false;
UPDATE public.cas_users SET is_admin = true WHERE email = 'alexandrelbarros30@gmail.com';