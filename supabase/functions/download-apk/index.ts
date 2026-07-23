// Public endpoint that redirects the user to a fresh signed URL for the
// current APK release stored in the private `app-releases` bucket.
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    const { data: rel, error } = await supabase
      .from("app_releases")
      .select("version, file_path")
      .eq("is_current", true)
      .order("released_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (error || !rel) {
      return new Response(
        JSON.stringify({ error: "Nenhum APK publicado ainda" }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const { data: signed, error: signErr } = await supabase.storage
      .from("app-releases")
      .createSignedUrl(rel.file_path, 60 * 10, {
        download: `sthmethod-${rel.version}.apk`,
      });

    if (signErr || !signed?.signedUrl) {
      return new Response(
        JSON.stringify({ error: "Falha ao gerar link do APK", details: signErr?.message }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const url = new URL(req.url);
    if (url.searchParams.get("format") === "json") {
      return new Response(
        JSON.stringify({ url: signed.signedUrl, version: rel.version }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    return new Response(null, {
      status: 302,
      headers: { ...corsHeaders, Location: signed.signedUrl },
    });
  } catch (e) {
    return new Response(
      JSON.stringify({ error: (e as Error).message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});