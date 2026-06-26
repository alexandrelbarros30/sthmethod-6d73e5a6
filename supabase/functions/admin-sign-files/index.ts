import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });
  try {
    const { bucket, paths, expiresIn = 600, token } = await req.json();
    if (token !== Deno.env.get("ADMIN_SIGN_FILES_TOKEN")) {
      return json({ error: "unauthorized" }, 401);
    }
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );
    const { data, error } = await supabase.storage
      .from(bucket)
      .createSignedUrls(paths, expiresIn);
    if (error) return json({ error: error.message }, 400);
    return json({ data });
  } catch (e) {
    return json({ error: String(e) }, 500);
  }
});

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "*",
  "Content-Type": "application/json",
};
function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), { status, headers: cors });
}