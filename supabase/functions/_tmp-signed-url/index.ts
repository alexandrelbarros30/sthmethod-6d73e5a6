import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";
Deno.serve(async (req) => {
  const { paths } = await req.json();
  const sb = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
  const { data, error } = await sb.storage.from("body-images").createSignedUrls(paths, 3600);
  return new Response(JSON.stringify({ data, error }), { headers: { "content-type": "application/json" } });
});
