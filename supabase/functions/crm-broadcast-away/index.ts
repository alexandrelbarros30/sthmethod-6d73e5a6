import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

type Channel = "zapi" | "wapi" | "wapi_sucesso";

function fnNameFor(p: Channel): string {
  if (p === "zapi") return "send-whatsapp";
  if (p === "wapi_sucesso") return "send-wapi-sucesso";
  return "send-wapi";
}

function renderTpl(s: string, ctx: Record<string, string>): string {
  const nome = ctx.nome || "";
  let out = String(s || "")
    .replace(/\\n/g, "\n")
    .replace(/\{nome\}/gi, nome)
    .replace(/\{nomeSep\}/gi, nome ? " " : "");
  for (const [k, v] of Object.entries(ctx)) {
    if (k === "nome") continue;
    out = out.replace(new RegExp(`\\{${k}\\}`, "gi"), String(v ?? ""));
  }
  return out;
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  const admin = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
  );
  const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
  const SERVICE_ROLE = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

  const opts = await req.json().catch(() => ({}));
  const dryRun: boolean = !!opts.dry_run;
  const windowHours: number = Number(opts.window_hours || 24);
  const respectLock: boolean = opts.respect_lock !== false; // default true

  // Load away templates from crm_settings.
  const keys = [
    "nutri_away_active", "nutri_away_inactive",
    "comercial_away_lead", "comercial_away_active", "comercial_away_expired",
  ];
  const { data: cfgRows } = await admin
    .from("crm_settings").select("key, value").in("key", keys);
  const cfg: Record<string, string> = {};
  for (const r of cfgRows || []) {
    const m = (r as any).value?.message;
    if (m) cfg[(r as any).key] = String(m);
  }

  // Sucesso fallback (used in webhook): hardcoded copy.
  const sucessoFallback = "Olá! No momento estamos fora do horário de expediente no canal Sucesso do Aluno.\n\nPara um autoatendimento rápido, você pode utilizar as opções abaixo:\n\n1️⃣ Atualizar Peso/Medidas (App)\n2️⃣ Renovação de Plano: {link_renovacao}\n3️⃣ Financeiro/Pagamentos: https://sthmethod.com.br/financeiro\n\nDeixe sua mensagem e responderemos assim que retornarmos! 👋";

  // Pull open conversations with recent activity (avoid blasting historical).
  const since = new Date(Date.now() - windowHours * 3600_000).toISOString();
  const { data: convs } = await admin
    .from("crm_conversations")
    .select("id, phone, display_name, provider, status, last_message_at, human_handoff")
    .eq("status", "open")
    .gte("last_message_at", since)
    .not("phone", "is", null);

  const results: any[] = [];
  let sentCount = 0; let skipCount = 0;

  for (const c of convs || []) {
    const provider = (c as any).provider as Channel;
    if (!["zapi", "wapi", "wapi_sucesso"].includes(provider)) {
      results.push({ conv: c.id, skipped: "provider_unknown" }); skipCount++; continue;
    }
    if ((c as any).human_handoff) {
      results.push({ conv: c.id, skipped: "human_handoff" }); skipCount++; continue;
    }
    const phone = String((c as any).phone).replace(/\D/g, "");
    if (!phone) { results.push({ conv: c.id, skipped: "no_phone" }); skipCount++; continue; }

    // Lock dedup (same logic as webhook away).
    if (respectLock) {
      const { data: lock } = await admin.from("crm_away_locks")
        .select("phone").eq("phone", phone).maybeSingle();
      if (lock) { results.push({ conv: c.id, skipped: "locked" }); skipCount++; continue; }
    }

    // Identify recipient (lead vs active vs expired) for template selection.
    let identifiedAs: "lead" | "aluno_ativo" | "aluno_vencido" = "lead";
    let userId: string | null = null;
    let fullName: string | null = (c as any).display_name || null;

    {
      const last10 = phone.slice(-10); // tolerate +55 variations
      const { data: prof } = await admin
        .from("profiles")
        .select("user_id, full_name, phone")
        .ilike("phone", `%${last10}%`)
        .maybeSingle();
      if (prof) {
        userId = prof.user_id;
        if (!fullName) fullName = prof.full_name;
        const { data: subs } = await admin
          .from("subscriptions").select("end_date, status")
          .eq("user_id", prof.user_id)
          .order("end_date", { ascending: false }).limit(1);
        const sub = subs?.[0];
        if (sub) {
          const isFuture = new Date(sub.end_date).getTime() > Date.now();
          identifiedAs = (sub.status === "active" || isFuture) ? "aluno_ativo" : "aluno_vencido";
        }
      }
    }

    // Pick template by (provider, identification).
    let tplKey = "";
    if (provider === "zapi") {
      tplKey = identifiedAs === "aluno_ativo" ? "comercial_away_active"
             : identifiedAs === "aluno_vencido" ? "comercial_away_expired"
             : "comercial_away_lead";
    } else if (provider === "wapi") {
      tplKey = identifiedAs === "aluno_ativo" ? "nutri_away_active" : "nutri_away_inactive";
    }
    const raw = (provider === "wapi_sucesso") ? sucessoFallback : (cfg[tplKey] || "");
    if (!raw) { results.push({ conv: c.id, skipped: "no_template", tplKey }); skipCount++; continue; }

    const renewalLink = userId
      ? `https://sthmethod.com.br/dashboard/renew?uid=${userId}`
      : "https://sthmethod.com.br/cadastro";
    const firstName = (fullName || "").split(" ")[0] || "";
    const message = renderTpl(raw, { nome: firstName, link_renovacao: renewalLink });

    if (dryRun) {
      results.push({ conv: c.id, phone, provider, tplKey, identifiedAs, would_send: message.slice(0, 120) });
      continue;
    }

    // Send via channel function.
    let ok = false; let err: any = null;
    try {
      const res = await fetch(`${SUPABASE_URL}/functions/v1/${fnNameFor(provider)}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${SERVICE_ROLE}`,
          "apikey": SERVICE_ROLE,
        },
        body: JSON.stringify({ phone, message }),
      });
      const j = await res.json().catch(() => ({}));
      ok = !!j?.ok;
      if (!ok) err = j?.error || `http ${res.status}`;
    } catch (e: any) { err = e?.message || String(e); }

    if (ok) {
      sentCount++;
      // Set lock to mirror webhook behavior.
      await admin.from("crm_away_locks").upsert({
        phone, locked_until: new Date(Date.now() + 4 * 3600_000).toISOString(),
      });
      // Log as outbound so it appears in conversation.
      await admin.from("crm_messages").insert({
        conversation_id: c.id, direction: "out", body: message,
        source: provider, status: "sent",
        metadata: { tag: "away_broadcast", template: tplKey, identifiedAs },
      });
    } else { skipCount++; }
    results.push({ conv: c.id, phone, provider, tplKey, identifiedAs, ok, err });
  }

  return new Response(JSON.stringify({
    ok: true, dry_run: dryRun, window_hours: windowHours,
    total: results.length, sent: sentCount, skipped: skipCount,
    results,
  }, null, 2), {
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
});
