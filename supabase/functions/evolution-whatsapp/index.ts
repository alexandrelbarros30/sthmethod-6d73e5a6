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
const DEFAULT_INSTANCE = "nutri";

const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

function extractInstanceState(body: any): string {
  return body?.instance?.state ?? body?.state ?? body?.instance?.status ?? body?.status ?? "unknown";
}

async function fetchInstances() {
  const direct = await evo(`/instance/fetchInstances`);
  if (Array.isArray(direct.body)) return direct.body;

  const wrapped = direct.body?.instances;
  if (Array.isArray(wrapped)) return wrapped;

  return [];
}

async function findInstance(instance: string) {
  const items = await fetchInstances();
  return items.find((item: any) => {
    const name = item?.instance?.instanceName ?? item?.instanceName;
    return name === instance;
  }) ?? null;
}

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

function isEmptyConnectResponse(body: any): boolean {
  return Boolean(
    body &&
    typeof body === "object" &&
    !Array.isArray(body) &&
    Number(body?.count ?? -1) === 0 &&
    !hasQrPayload(body)
  );
}

function sanitizeNumber(n?: string | null): string | undefined {
  if (!n) return undefined;
  const digits = String(n).replace(/\D/g, "");
  return digits.length >= 10 ? digits : undefined;
}

async function createInstance(instance: string, number?: string) {
  const body: Record<string, unknown> = {
    instanceName: instance,
    integration: "WHATSAPP-BAILEYS",
    qrcode: true,
  };
  const n = sanitizeNumber(number);
  if (n) body.number = n;
  return await evo(`/instance/create`, {
    method: "POST",
    body: JSON.stringify(body),
  });
}

async function ensureInstance(instance: string, number?: string) {
  const check = await evo(`/instance/connectionState/${instance}`);
  if (check.status !== 404) return { ...check, created: false };

  const existing = await findInstance(instance);
  if (existing) {
    return {
      ok: true,
      status: 200,
      body: existing,
      created: false,
    };
  }

  const created = await createInstance(instance, number);
  if (!created.ok && created.status === 403) {
    const afterConflict = await findInstance(instance);
    if (afterConflict) {
      return {
        ok: true,
        status: 200,
        body: afterConflict,
        created: false,
      };
    }
  }

  for (let i = 0; i < 4; i++) {
    await delay(800);
    const next = await evo(`/instance/connectionState/${instance}`);
    if (next.status !== 404) return { ...next, created: true };

    const listed = await findInstance(instance);
    if (listed) {
      return {
        ok: true,
        status: 200,
        body: listed,
        created: true,
      };
    }
  }

  return { ...created, created: true };
}

async function recreateInstance(instance: string, number?: string) {
  await evo(`/instance/logout/${instance}`, { method: "DELETE" }).catch(() => {});
  await evo(`/instance/delete/${instance}`, { method: "DELETE" }).catch(() => {});
  await delay(700);
  await createInstance(instance, number);
  for (let i = 0; i < 5; i++) {
    await delay(800);
    const next = await evo(`/instance/connectionState/${instance}`);
    if (next.status !== 404) return;
    const listed = await findInstance(instance);
    if (listed) return;
  }
}

async function requestQr(instance: string, attempts = 3, waitMs = 700, number?: string) {
  const n = sanitizeNumber(number);
  const path = n
    ? `/instance/connect/${instance}?number=${encodeURIComponent(n)}`
    : `/instance/connect/${instance}`;
  let response = await evo(path, { method: "GET" });

  for (let i = 1; i < attempts; i++) {
    if (hasQrPayload(response.body)) break;
    await delay(waitMs);
    response = await evo(path, { method: "GET" });
  }

  return response;
}

async function resolveInstanceSnapshot(instance: string) {
  const connection = await evo(`/instance/connectionState/${instance}`);
  if (connection.status !== 404) {
    return {
      exists: true,
      state: extractInstanceState(connection.body),
      body: connection.body,
    };
  }

  const existing = await findInstance(instance);
  if (existing) {
    return {
      exists: true,
      state: extractInstanceState(existing),
      body: existing,
    };
  }

  return {
    exists: false,
    state: "close",
    body: { instance: { instanceName: instance, state: "close" } },
  };
}

async function evo(path: string, init: RequestInit = {}) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 8000);
  try {
    const res = await fetch(`${EVOLUTION_URL}${path}`, {
      ...init,
      signal: controller.signal,
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
  } catch (e) {
    return { ok: false, status: 599, body: { error: (e as Error).message, timeout: true } };
  } finally {
    clearTimeout(timer);
  }
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
    const number: string | undefined = sanitizeNumber(payload.number);

    switch (action) {
      case "status": {
        const snapshot = await resolveInstanceSnapshot(instance);
        return json(snapshot.body, 200);
      }
      case "qr-status": {
        const snapshot = await resolveInstanceSnapshot(instance);
        const r = await requestQr(instance, 2, 1000, number);

        if (hasQrPayload(r.body)) {
          return json({
            ...(typeof r.body === "object" && r.body ? r.body : { data: r.body }),
            instance: {
              instanceName: instance,
              state: snapshot.state,
            },
          }, 200);
        }

        return json({
          ...(typeof r.body === "object" && r.body ? r.body : {}),
          pending: true,
          emptyConnectResponse: isEmptyConnectResponse(r.body),
          message: isEmptyConnectResponse(r.body)
            ? "A instância ainda não entregou o QR. Aguarde alguns segundos antes de tentar refazer a sessão."
            : "A instância ainda está preparando o pareamento.",
          instance: {
            instanceName: instance,
            state: snapshot.state === "open" ? "open" : "connecting",
          },
        }, 200);
      }
      case "qr":
      case "connect": {
        const check = await ensureInstance(instance, number);
        let recovery: "none" | "restart" | "recreate" = "none";

        let r = await requestQr(instance, 3, 700, number);
        if (!hasQrPayload(r.body) && (check as any).created) {
          await delay(1000);
          r = await requestQr(instance, 4, 900, number);
        }

        if (!hasQrPayload(r.body) && isEmptyConnectResponse(r.body)) {
          const currentState = await resolveInstanceSnapshot(instance);
          const state = currentState.state;

          if (state !== "open") {
            await evo(`/instance/restart/${instance}`, { method: "POST" }).catch(() => {});
            recovery = "restart";
            await delay(1000);
            r = await requestQr(instance, 4, 900, number);
          }
        }

        if (!hasQrPayload(r.body) && (r.status === 404 || isEmptyConnectResponse(r.body))) {
          await recreateInstance(instance, number);
          recovery = "recreate";
          r = await requestQr(instance, 4, 900, number);
        }

        if (!hasQrPayload(r.body)) {
          const finalState = await resolveInstanceSnapshot(instance);
          return json({
            ...(typeof r.body === "object" && r.body ? r.body : {}),
            pending: true,
            emptyConnectResponse: isEmptyConnectResponse(r.body),
            recovery,
            recoveryAttempted: recovery !== "none",
            message: isEmptyConnectResponse(r.body)
              ? "A instância respondeu sem QR. A sessão foi reiniciada e pode levar alguns segundos para gerar um novo código."
              : "A instância ainda está preparando o pareamento.",
            instance: {
              instanceName: instance,
              state: finalState.state === "open" ? "open" : "connecting",
            },
          }, 200);
        }

        return json({
          ...(typeof r.body === "object" && r.body ? r.body : { data: r.body }),
          recovery,
          recovered: recovery !== "none",
        }, 200);
      }
      case "fetchInstances": {
        const items = await fetchInstances();
        const filtered = items.filter((item: any) => {
          const name = item?.instance?.instanceName ?? item?.instanceName;
          return !instance || name === instance;
        });
        return json(filtered, 200);
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
        const create = await createInstance(instance, number);
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
        const r = await createInstance(instance, number);
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