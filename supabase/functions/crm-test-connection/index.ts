import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const { channel_id } = await req.json();
    if (!channel_id) throw new Error("channel_id obrigatório");

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    // Identify user
    const authHeader = req.headers.get("Authorization") || "";
    const jwt = authHeader.replace("Bearer ", "");
    const userClient = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } },
    );
    const { data: userData } = await userClient.auth.getUser(jwt);
    const userId = userData?.user?.id ?? null;

    const { data: channel, error: chErr } = await supabase
      .from("api_channels").select("*").eq("id", channel_id).maybeSingle();
    if (chErr || !channel) throw new Error("Canal não encontrado");

    const { data: creds } = await supabase
      .from("api_credentials").select("*").eq("channel_id", channel_id).maybeSingle();

    let ok = false;
    let number: string | null = null;
    let detail = "";
    const provider = channel.provider as string;

    try {
      if (provider === "wapi") {
        const instance = channel.instance_id || Deno.env.get("WAPI_INSTANCE_ID");
        const token = creds?.token_encrypted || Deno.env.get("WAPI_TOKEN");
        const clientToken = creds?.client_id_encrypted || Deno.env.get("WAPI_CLIENT_TOKEN");
        const base = channel.base_url || "https://api.w-api.app/v1";
        const r = await fetch(`${base}/instance/status-instance?instanceId=${instance}`, {
          headers: { Authorization: `Bearer ${token}`, "Client-Token": clientToken || "" },
        });
        const j = await r.json().catch(() => ({}));
        ok = r.ok;
        number = j?.connected || j?.phoneConnected || null;
        detail = JSON.stringify(j).slice(0, 300);
      } else if (provider === "zapi") {
        const instance = channel.instance_id || Deno.env.get("ZAPI_INSTANCE_ID");
        const token = creds?.token_encrypted || Deno.env.get("ZAPI_INSTANCE_TOKEN");
        const clientToken = creds?.client_id_encrypted || Deno.env.get("ZAPI_CLIENT_TOKEN");
        const base = channel.base_url || `https://api.z-api.io/instances/${instance}/token/${token}`;
        const r = await fetch(`${base}/status`, {
          headers: { "Client-Token": clientToken || "" },
        });
        const j = await r.json().catch(() => ({}));
        ok = r.ok && (j?.connected === true || j?.smartphoneConnected === true);
        number = j?.phone || null;
        detail = JSON.stringify(j).slice(0, 300);
      } else if (provider === "evolution") {
        const base = channel.base_url || Deno.env.get("EVOLUTION_API_URL") || "";
        const key = creds?.api_key_encrypted || Deno.env.get("EVOLUTION_API_KEY") || "";
        const instance = channel.instance_name || channel.instance_id || "";
        const r = await fetch(`${base.replace(/\/$/, "")}/instance/connectionState/${instance}`, {
          headers: { apikey: key },
        });
        const j = await r.json().catch(() => ({}));
        ok = r.ok && (j?.instance?.state === "open" || j?.state === "open");
        detail = JSON.stringify(j).slice(0, 300);
      } else if (provider === "cloud") {
        const token = creds?.access_token_encrypted || "";
        const phoneId = channel.instance_id || "";
        const r = await fetch(`https://graph.facebook.com/v20.0/${phoneId}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const j = await r.json().catch(() => ({}));
        ok = r.ok;
        number = j?.display_phone_number || null;
        detail = JSON.stringify(j).slice(0, 300);
      } else {
        throw new Error("Provedor desconhecido");
      }
    } catch (e) {
      detail = String((e as Error).message);
    }

    await supabase.from("api_channels").update({
      connection_status: ok ? "connected" : "error",
      connected_number: number,
      last_sync_at: new Date().toISOString(),
    }).eq("id", channel_id);

    await supabase.from("api_logs").insert({
      channel_id,
      provider,
      event_type: "connection_tested",
      event_description: detail.slice(0, 500),
      status: ok ? "success" : "error",
      error_message: ok ? null : detail.slice(0, 500),
      user_id: userId,
    });

    return new Response(JSON.stringify({ ok, number, detail }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    return new Response(JSON.stringify({ ok: false, error: String((e as Error).message) }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});