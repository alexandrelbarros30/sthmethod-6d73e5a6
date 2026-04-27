-- Allow anonymous visitors to join the queue
ALTER TABLE public.queue_join_requests
  ALTER COLUMN student_user_id DROP NOT NULL,
  ADD COLUMN IF NOT EXISTS visitor_name text,
  ADD COLUMN IF NOT EXISTS visitor_phone text;

-- Allow anonymous insert (public queue page)
CREATE POLICY "Anyone can join public queue"
ON public.queue_join_requests
FOR INSERT
TO anon, authenticated
WITH CHECK (
  source = 'public_link'
  AND visitor_name IS NOT NULL
  AND length(trim(visitor_name)) > 0
  AND visitor_phone IS NOT NULL
  AND length(trim(visitor_phone)) >= 8
);

-- Allow anyone to read their own request by id (for status polling)
CREATE POLICY "Anyone can view queue request by id"
ON public.queue_join_requests
FOR SELECT
TO anon, authenticated
USING (true);
