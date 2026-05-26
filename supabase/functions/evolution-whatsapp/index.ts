// Evolution API proxy — admin only
// deno-lint-ignore-file no-explicit-any
import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const EVOLUTION_URL = (Deno.env.get("EVOLUTION_API_URL") ?? "").replace(/\/+$/, "");
const EVOLUTION_KEY = Deno.env.get("EVOLUTION_API_KEY") ?? "";
const DEFAULT_INSTANCE = "sth-method";

const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

function hasQrPayload(body: any): boolean {
  if (!body) return false;
  if (Array.isArray(body)) return body.some(hasQrPayload);

  return Boolean(
    body?.base64 ||
    body?.code ||
    body?.pairingCode ||
    body?.qrcode ||
    body?.qrcode?.base64 ||
    body?.qrcode?.code ||
    body?.qrcode?.pairingCode
  );
}

async function createInstance(instance: string) {
  return await evo(`/instance/create`, {
    method: "POST",
    body: JSON.stringify({
      instanceName: instance,
      integration: "WHATSAPP-BAILEYS",
      qrcode: true,
    }),
  });
}

async function ensureInstance(instance: string) {
  const check = await evo(`/instance/connectionState/${instance}`);
  if (check.status !== 404) return check;

  await createInstance(instance);
  await delay(1000);
  return await evo(`/instance/connectionState/${instance}`);
}

async function recreateInstance(instance: string) {
  await evo(`/instance/logout/${instance}`, { method: "DELETE" }).catch(() => {});
  await evo(`/instance/delete/${instance}`, { method: "DELETE" }).catch(() => {});
  await delay(700);
  await createInstance(instance);
  await delay(1200);
}

async function requestQr(instance: string, attempts = 5, waitMs = 800) {
  let response = await evo(`/instance/connect/${instance}`);

  for (let i = 1; i < attempts; i++) {
    if (hasQrPayload(response.body)) break;
    await delay(waitMs);
    response = await evo(`/instance/connect/${instance}`);
  }

  return response;
}

async function evo(path: string, init: RequestInit = {}) {
  const res = await fetch(`${EVOLUTION_URL}${path}`, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      apikey: EVOLUTION_KEY,
      ...(init.headers ?? {}),
    },
  });
  const text = await res.text();
  let body: any = text;
  try { body = JSON.parse(text); } catch { /* keep text */ }
  return { ok: res.ok, status: res.status, body };
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    if (!EVOLUTION_URL || !EVOLUTION_KEY) {
      return json({ error: "EVOLUTION_API_URL/EVOLUTION_API_KEY não configurados" }, 500);
    }

    // Authn + admin role check
    const authHeader = req.headers.get("Authorization") ?? "";
    const token = authHeader.replace(/^Bearer\s+/i, "");
    if (!token) return json({ error: "missing auth" }, 401);

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const anonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const userClient = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: `Bearer ${token}` } },
    });
    const { data: userRes, error: userErr } = await userClient.auth.getUser();
    if (userErr || !userRes.user) return json({ error: "invalid user" }, 401);

    const { data: isAdmin } = await userClient.rpc("has_role", {
      _user_id: userRes.user.id,
      _role: "admin",
    });
    if (!isAdmin) return json({ error: "forbidden" }, 403);

    const payload = await req.json().catch(() => ({}));
    const action: string = payload.action ?? "status";
    const instance: string = payload.instance ?? DEFAULT_INSTANCE;

    switch (action) {
      case "status": {
        const r = await evo(`/instance/connectionState/${instance}`);
        // Instância não existe → trata como desconectada para o frontend parar de polling
        if (r.status === 404) {
          return json({ instance: { instanceName: instance, state: "close" } }, 200);
        }
        return json(r.body, r.status);
      }
      case "qr":
      case "connect": {
        const check = await ensureInstance(instance);

        let r = await requestQr(instance);
        if (!hasQrPayload(r.body)) {
          const state = check.body?.instance?.state ?? check.body?.state ?? "unknown";
          if (r.status === 404 || r.body?.count === 0 || state === "connecting") {
            await recreateInstance(instance);
            r = await requestQr(instance, 6, 1000);
          }
        }

        if (!hasQrPayload(r.body)) {
          const finalState = await evo(`/instance/connectionState/${instance}`);
          return json({
            ...(typeof r.body === "object" && r.body ? r.body : {}),
            pending: true,
            instance: {
              instanceName: instance,
              state: finalState.body?.instance?.state ?? finalState.body?.state ?? "connecting",
            },
          }, 200);
        }

        return json(r.body, 200);
      }
      case "fetchInstances": {
        const r = await evo(`/instance/fetchInstances?instanceName=${encodeURIComponent(instance)}`);
        return json(r.body, r.status);
      }
      case "delete": {
        const r = await evo(`/instance/delete/${instance}`, { method: "DELETE" });
        return json(r.body, r.status);
      }
      case "recreate": {
        // Apaga (se existir) e recria com qrcode habilitado.
        await evo(`/instance/logout/${instance}`, { method: "DELETE" }).catch(() => {});
        await evo(`/instance/delete/${instance}`, { method: "DELETE" }).catch(() => {});
        await new Promise((r) => setTimeout(r, 500));
        const create = await evo(`/instance/create`, {
          method: "POST",
          body: JSON.stringify({
            instanceName: instance,
            integration: "WHATSAPP-BAILEYS",
            qrcode: true,
          }),
        });
        return json(create.body, create.status);
      }
      case "logout":
      case "disconnect": {
        const r = await evo(`/instance/logout/${instance}`, { method: "DELETE" });
        return json(r.body, r.status);
      }
      case "restart": {
        const r = await evo(`/instance/restart/${instance}`, { method: "POST" });
        return json(r.body, r.status);
      }
      case "create": {
        const r = await evo(`/instance/create`, {
          method: "POST",
          body: JSON.stringify({
            instanceName: instance,
            integration: "WHATSAPP-BAILEYS",
            qrcode: true,
          }),
        });
        return json(r.body, r.status);
      }
      case "send": {
        const number = String(payload.number ?? "").replace(/\D/g, "");
        const text = String(payload.text ?? "").trim();
        if (!number || !text) return json({ error: "number e text obrigatórios" }, 400);
        const r = await evo(`/message/sendText/${instance}`, {
          method: "POST",
          body: JSON.stringify({ number, text }),
        });
        return json(r.body, r.status);
      }
      default:
        return json({ error: `ação desconhecida: ${action}` }, 400);
    }
  } catch (e) {
    console.error("evolution-whatsapp error", e);
    return json({ error: (e as Error).message }, 500);
  }
});

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}