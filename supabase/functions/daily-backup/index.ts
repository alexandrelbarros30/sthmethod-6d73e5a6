// Daily backup edge function
// - action=run: prepares a manual table-by-table backup or dispatches cron jobs
// - action=table: dumps one public table to gzipped JSON into private storage and mirrors to GitHub when available
// - action=manifest: writes a lightweight manifest after table files exist
// - action=list: lists backups (admin only)
// - action=download: returns file content (admin only)
// Auth: shared token (cron) OR admin JWT
import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
};

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_ROLE = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY")!;
const GITHUB_API_KEY = Deno.env.get("GITHUB_API_KEY")!;
const CRON_TOKEN = Deno.env.get("BACKUP_CRON_TOKEN")!;

const REPO_OWNER = "alexandrelbarros30";
const REPO_NAME = "sthmethod-backups";
const GATEWAY = "https://connector-gateway.lovable.dev/github";
const BACKUP_BUCKET = "database-backups";
const TABLE_NAME_RE = /^[a-zA-Z_][a-zA-Z0-9_]*$/;

class UserFacingError extends Error {
  status: number;
  code: string;
  details?: string;

  constructor(status: number, code: string, message: string, details?: string) {
    super(message);
    this.name = "UserFacingError";
    this.status = status;
    this.code = code;
    this.details = details;
  }
}

// Tables to skip (auth-managed, high-churn logs, ephemeral throttles)
const SKIP_TABLES = new Set([
  "cas_search_cache",
  "call_reject_throttle",
  "crm_message_locks",
  "crm_away_locks",
  "auth_rate_limits",
  "crm_ai_runs",
]);

const jsonResp = (status: number, body: unknown) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });

function ghHeaders() {
  return {
    Accept: "application/vnd.github+json",
    Authorization: `Bearer ${LOVABLE_API_KEY}`,
    "X-Connection-Api-Key": GITHUB_API_KEY,
    "Content-Type": "application/json",
  };
}

async function gzipBytes(text: string): Promise<Uint8Array> {
  const stream = new Blob([text]).stream().pipeThrough(new CompressionStream("gzip"));
  const buf = await new Response(stream).arrayBuffer();
  return new Uint8Array(buf);
}

function bytesToBase64(bytes: Uint8Array): string {
  let bin = "";
  const chunk = 0x8000;
  for (let i = 0; i < bytes.length; i += chunk) {
    bin += String.fromCharCode(...bytes.subarray(i, i + chunk));
  }
  return btoa(bin);
}

async function listPublicTables(supabase: ReturnType<typeof createClient>): Promise<string[]> {
  const { data, error } = await supabase.rpc("backup_list_public_tables");
  if (error) throw new Error(`list tables: ${error.message}`);
  return (data as { table_name: string }[]).map((r) => r.table_name);
}

async function backupTables(supabase: ReturnType<typeof createClient>): Promise<string[]> {
  const tables = await listPublicTables(supabase);
  return tables.filter((table) => !SKIP_TABLES.has(table));
}

async function dumpTable(supabase: ReturnType<typeof createClient>, table: string): Promise<unknown[]> {
  const rows: unknown[] = [];
  const pageSize = 1000;
  let from = 0;
  while (true) {
    const { data, error } = await supabase.from(table).select("*").range(from, from + pageSize - 1);
    if (error) {
      // Some tables may lack a default order; try without range fallback
      throw new Error(`dump ${table}: ${error.message}`);
    }
    if (!data || data.length === 0) break;
    rows.push(...data);
    if (data.length < pageSize) break;
    from += pageSize;
  }
  return rows;
}

async function ghPutFile(path: string, contentBase64: string, message: string) {
  const existing = await ghGetJson(path) as { sha?: string } | null;
  const res = await fetch(`${GATEWAY}/repos/${REPO_OWNER}/${REPO_NAME}/contents/${path}`, {
    method: "PUT",
    headers: ghHeaders(),
    body: JSON.stringify({ message, content: contentBase64, ...(existing?.sha ? { sha: existing.sha } : {}) }),
  });
  if (!res.ok) {
    const t = await res.text();
    throw new Error(`github put ${path} [${res.status}]: ${t}`);
  }
}

async function storagePutFile(supabase: ReturnType<typeof createClient>, path: string, bytes: Uint8Array) {
  const { error } = await supabase.storage
    .from(BACKUP_BUCKET)
    .upload(path, new Blob([bytes], { type: "application/gzip" }), {
      contentType: "application/gzip",
      upsert: true,
    });

  if (error) throw new Error(`storage put ${path}: ${error.message}`);
}

async function tryMirrorToGitHub(path: string, bytes: Uint8Array, message: string) {
  try {
    const status = await getBackupRepositoryStatus();
    if (!status.available) return { mirrored: false, warning: status.warning };
    await ghPutFile(path, bytesToBase64(bytes), message);
    return { mirrored: true };
  } catch (e) {
    const warning = e instanceof Error ? e.message : String(e);
    console.warn("github mirror skipped", { path, warning });
    return { mirrored: false, warning };
  }
}

async function ghGetJson(path: string) {
  const res = await fetch(`${GATEWAY}/repos/${REPO_OWNER}/${REPO_NAME}/contents/${path}`, {
    headers: ghHeaders(),
  });
  if (res.status === 404) return null;
  if (!res.ok) throw new Error(`github get ${path} [${res.status}]: ${await res.text()}`);
  return await res.json();
}

async function getBackupRepositoryStatus() {
  if (!LOVABLE_API_KEY || !GITHUB_API_KEY) {
    return {
      available: false,
      warning: "Espelho GitHub indisponível: credenciais do conector não estão disponíveis.",
    };
  }

  const repoRes = await fetch(`${GATEWAY}/repos/${REPO_OWNER}/${REPO_NAME}`, {
    headers: ghHeaders(),
  });

  if (repoRes.status === 404) {
    const details = await repoRes.text();
    return {
      available: false,
      warning: `Espelho GitHub indisponível: ${REPO_OWNER}/${REPO_NAME} não encontrado ou sem permissão para o token conectado.`,
      details,
    };
  }

  if (!repoRes.ok) {
    const details = await repoRes.text();
    return {
      available: false,
      warning: `Espelho GitHub indisponível: falha ${repoRes.status} ao acessar ${REPO_OWNER}/${REPO_NAME}.`,
      details,
    };
  }

  const repo = await repoRes.json();
  if (!repo?.private) {
    return {
      available: false,
      warning: `Espelho GitHub indisponível: ${REPO_OWNER}/${REPO_NAME} precisa ser privado.`,
    };
  }

  return { available: true, repo };
}

async function assertAdmin(req: Request): Promise<{ ok: boolean; error?: string }> {
  const tokenHeader = req.headers.get("x-backup-token");
  if (tokenHeader && tokenHeader === CRON_TOKEN) return { ok: true };

  const auth = req.headers.get("Authorization");
  if (!auth?.startsWith("Bearer ")) return { ok: false, error: "missing auth" };
  const jwt = auth.slice(7);
  const supabase = createClient(SUPABASE_URL, SERVICE_ROLE);
  const { data: userData, error: userErr } = await supabase.auth.getUser(jwt);
  if (userErr || !userData?.user) return { ok: false, error: "invalid session" };
  const { data: role, error: roleErr } = await supabase.rpc("has_role", {
    _user_id: userData.user.id,
    _role: "admin",
  });
  if (roleErr || !role) return { ok: false, error: "admin only" };
  return { ok: true };
}

function isCronRequest(req: Request) {
  return req.headers.get("x-backup-token") === CRON_TOKEN;
}

async function dumpSingleTable(table: string, day: string) {
  if (!TABLE_NAME_RE.test(table)) throw new Error("invalid table");
  const supabase = createClient(SUPABASE_URL, SERVICE_ROLE);
  const allowedTables = await backupTables(supabase);
  if (!allowedTables.includes(table)) throw new Error("table not allowed for backup");

  const rows = await dumpTable(supabase, table);
  const gz = await gzipBytes(JSON.stringify(rows));
  const path = `${day}/${table}.json.gz`;
  await storagePutFile(supabase, path, gz);
  const mirror = await tryMirrorToGitHub(path, gz, `backup ${day} ${table} (${rows.length} rows)`);
  return { table, rows: rows.length, bytes: gz.length, storage: "internal", github_mirror: mirror };
}

async function writeManifest(day: string) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(day)) throw new Error("invalid day");
  const supabase = createClient(SUPABASE_URL, SERVICE_ROLE);
  const { data: files, error } = await supabase.storage.from(BACKUP_BUCKET).list(day, { limit: 1000 });
  if (error) throw new Error(`storage list ${day}: ${error.message}`);

  const summary = (files ?? [])
    .filter((file) => file.name.endsWith(".json.gz") && file.name !== "_manifest.json.gz")
    .map((file) => ({ file: file.name, path: `${day}/${file.name}`, bytes: file.metadata?.size ?? 0 }));

  const manifest = {
    date: day,
    finished: new Date().toISOString(),
    primary_storage: "internal_private_storage",
    github_repository: `${REPO_OWNER}/${REPO_NAME}`,
    files: summary,
    file_count: summary.length,
  };
  const manifestGz = await gzipBytes(JSON.stringify(manifest, null, 2));
  const path = `${day}/_manifest.json.gz`;
  await storagePutFile(supabase, path, manifestGz);
  const mirror = await tryMirrorToGitHub(path, manifestGz, `manifest ${day}`);
  return { ...manifest, github_mirror: mirror };
}

async function dispatchCronBackup(req: Request, day: string, tables: string[]) {
  const base = new URL(req.url);
  let ok = 0;
  let failed = 0;

  // Keep server-side cron lightweight: each invocation dumps exactly one table.
  for (const table of tables) {
    const next = new URL(base);
    next.searchParams.set("action", "table");
    next.searchParams.set("day", day);
    next.searchParams.set("table", table);
    try {
      const res = await fetch(next.toString(), {
        method: "POST",
        headers: { "x-backup-token": CRON_TOKEN, "Content-Type": "application/json" },
      });
      await res.text();
      if (res.ok) ok += 1;
      else failed += 1;
    } catch (e) {
      failed += 1;
      console.error("cron table dispatch failed", table, e);
    }
  }

  try {
    await writeManifest(day);
  } catch (e) {
    console.error("cron manifest failed", e);
  }

  console.log("cron backup dispatch finished", { day, ok, failed });
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const url = new URL(req.url);
    const action = url.searchParams.get("action") ?? "run";

    const gate = await assertAdmin(req);
    if (!gate.ok) return jsonResp(401, { error: gate.error });

    if (action === "run") {
      const supabase = createClient(SUPABASE_URL, SERVICE_ROLE);
      const tables = await backupTables(supabase);
      const day = new Date().toISOString().slice(0, 10); // YYYY-MM-DD

      const github = await getBackupRepositoryStatus();

      if (isCronRequest(req)) {
        // @ts-ignore EdgeRuntime is provided by Supabase edge runtime
        EdgeRuntime.waitUntil(dispatchCronBackup(req, day, tables));
        return jsonResp(202, { ok: true, status: "started", day, total: tables.length });
      }

      return jsonResp(200, {
        ok: true,
        status: "ready",
        day,
        tables,
        total: tables.length,
        primary_storage: "internal_private_storage",
        github_mirror: github,
        message: github.available
          ? "Backup preparado. O portal salvará no armazenamento interno privado e espelhará no GitHub."
          : "Backup preparado. O portal salvará no armazenamento interno privado; o espelho GitHub está indisponível.",
      });
    }

    if (action === "table") {
      const table = url.searchParams.get("table") ?? "";
      const day = url.searchParams.get("day") ?? new Date().toISOString().slice(0, 10);
      const result = await dumpSingleTable(table, day);
      return jsonResp(200, { ok: true, status: "table_done", day, ...result });
    }

    if (action === "manifest") {
      const day = url.searchParams.get("day") ?? new Date().toISOString().slice(0, 10);
      const manifest = await writeManifest(day);
      return jsonResp(200, { ok: true, status: "completed", manifest });
    }

    if (action === "list") {
      const supabase = createClient(SUPABASE_URL, SERVICE_ROLE);
      const { data: root, error: rootError } = await supabase.storage.from(BACKUP_BUCKET).list("", { limit: 1000 });
      if (rootError) throw new Error(`storage list root: ${rootError.message}`);
      const days = (root ?? [])
        .filter((e) => /^\d{4}-\d{2}-\d{2}$/.test(e.name))
        .map((e) => e.name)
        .sort()
        .reverse();
      const day = url.searchParams.get("day");
      if (day) {
        const { data: files, error: filesError } = await supabase.storage.from(BACKUP_BUCKET).list(day, { limit: 1000 });
        if (filesError) throw new Error(`storage list ${day}: ${filesError.message}`);
        return jsonResp(200, {
          days,
          source: "internal_private_storage",
          files: (files ?? []).map((file) => ({
            name: file.name,
            size: file.metadata?.size ?? 0,
            path: `${day}/${file.name}`,
            source: "internal_private_storage",
          })),
        });
      }
      return jsonResp(200, { days, files: [], source: "internal_private_storage" });
    }

    if (action === "download") {
      const path = url.searchParams.get("path");
      if (!path) return jsonResp(400, { error: "missing path" });
      const supabase = createClient(SUPABASE_URL, SERVICE_ROLE);
      const { data, error } = await supabase.storage.from(BACKUP_BUCKET).download(path);
      if (error || !data) return jsonResp(404, { error: "not found" });
      const bytes = new Uint8Array(await data.arrayBuffer());
      return jsonResp(200, { path, content: bytesToBase64(bytes), encoding: "base64", source: "internal_private_storage" });
    }

    return jsonResp(400, { error: "unknown action" });
  } catch (e) {
    console.error("daily-backup error", e);
    if (e instanceof UserFacingError) {
      return jsonResp(e.status, { error: e.message, code: e.code, details: e.details });
    }
    return jsonResp(500, { error: String(e) });
  }
});