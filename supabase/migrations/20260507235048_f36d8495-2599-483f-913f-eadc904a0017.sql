DELETE FROM public.body_images
WHERE id IN (
  'dd83352c-019f-472a-92b6-d60e1bd81368',
  '2d03c451-d99a-4f9f-8d25-5fc2879a2b4c',
  '149b130b-7125-43af-8318-e71cd33c4603'
);

UPDATE public.body_images SET is_current=true
WHERE id IN (
  '869b34e1-af0b-4a4a-91fe-7831971e568a',
  '7a6afc84-1e3b-41ec-9b65-be231604063e',
  '06d2defa-2743-4838-ab80-968312f7846c'
);