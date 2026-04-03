CREATE UNIQUE INDEX IF NOT EXISTS idx_free_leads_email ON public.free_leads (email);
CREATE UNIQUE INDEX IF NOT EXISTS idx_free_leads_phone ON public.free_leads (phone);