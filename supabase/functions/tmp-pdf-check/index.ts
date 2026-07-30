import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

Deno.serve(async (req) => {
  const url = new URL(req.url);
  const path = url.searchParams.get("path");
  if (!path) return new Response("no path", { status: 400 });
  const sb = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
  const { data, error } = await sb.storage.from("documents").download(path);
  if (error) return new Response(JSON.stringify({ error: error.message }), { status: 200 });
  const buf = new Uint8Array(await data.arrayBuffer());
  const dec = new TextDecoder();
  return new Response(JSON.stringify({
    len: buf.length,
    head: dec.decode(buf.slice(0, 24)),
    tail: dec.decode(buf.slice(-40)),
  }), { headers: { "Content-Type": "application/json" } });
});
