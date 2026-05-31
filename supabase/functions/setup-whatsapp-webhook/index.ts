import { corsHeaders } from "npm:@supabase/supabase-js@2/cors";

const WEBHOOK_URL = `${Deno.env.get("SUPABASE_URL")}/functions/v1/crm-inbound`;

async function configureZapi() {
  const instance = Deno.env.get("ZAPI_INSTANCE_ID");
  const token = Deno.env.get("ZAPI_INSTANCE_TOKEN");
  const clientToken = Deno.env.get("ZAPI_CLIENT_TOKEN");
  if (!instance || !token) return { provider: "zapi", ok: false, error: "missing ZAPI_INSTANCE_ID/TOKEN" };

  const base = `https://api.z-api.io/instances/${instance}/token/${token}`;
  const headers: Record<string, string> = { "Content-Type": "application/json" };
  if (clientToken) headers["Client-Token"] = clientToken;

  const endpoints = [
    "/update-webhook-received",
    "/update-webhook-received-delivery",
    "/update-webhook-delivery",
    "/update-webhook-disconnected",
    "/update-webhook-connected",
    "/update-webhook-message-status",
  ];
  const results: any[] = [];
  for (const ep of endpoints) {
    try {
      const r = await fetch(`${base}${ep}`, {
        method: "PUT",
        headers,
        body: JSON.stringify({ value: WEBHOOK_URL }),
      });
      const body = await r.text();
      results.push({ ep, status: r.status, body: body.slice(0, 300) });
    } catch (e) {
      results.push({ ep, error: String(e) });
    }
  }
  return { provider: "zapi", ok: true, webhook: WEBHOOK_URL, results };
}

async function configureWapi() {
  const instance = Deno.env.get("WAPI_INSTANCE_ID");
  const token = Deno.env.get("WAPI_TOKEN");
  if (!instance || !token) return { provider: "wapi", ok: false, error: "missing WAPI_INSTANCE_ID/TOKEN" };

  // W-API.app: POST /instances/{id}/webhooks?token=...
  const url = `https://api.w-api.app/v1/webhooks?connectionKey=${instance}`;
  const attempts: any[] = [];
  try {
    const r = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify({
        webhookUrl: WEBHOOK_URL,
        events: ["messages"],
        enabled: true,
      }),
    });
    attempts.push({ url, status: r.status, body: (await r.text()).slice(0, 300) });
  } catch (e) {
    attempts.push({ url, error: String(e) });
  }

  // Fallback for legacy api.wapi.com.br pattern
  const url2 = `https://api.wapi.com.br/v1/webhook/set`;
  try {
    const r = await fetch(url2, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify({ instance_id: instance, url: WEBHOOK_URL, events: ["message"] }),
    });
    attempts.push({ url: url2, status: r.status, body: (await r.text()).slice(0, 300) });
  } catch (e) {
    attempts.push({ url: url2, error: String(e) });
  }

  return { provider: "wapi", ok: true, webhook: WEBHOOK_URL, attempts };
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  try {
    const [zapi, wapi] = await Promise.all([configureZapi(), configureWapi()]);
    return new Response(JSON.stringify({ ok: true, webhook: WEBHOOK_URL, zapi, wapi }, null, 2), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    return new Response(JSON.stringify({ ok: false, error: String(err) }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});