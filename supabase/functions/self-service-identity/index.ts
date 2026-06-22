import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const json = (b: any, s = 200) =>
  new Response(JSON.stringify(b), { status: s, headers: { ...corsHeaders, "Content-Type": "application/json" } });

const maskEmail = (e: string) => {
  if (!e || !e.includes("@")) return "***";
  const [u, d] = e.split("@");
  return `${u.length <= 2 ? u[0] + "*" : u.slice(0, 2) + "***"}@${d}`;
};

async function sha256(s: string) {
  const buf = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(s));
  return Array.from(new Uint8Array(buf)).map((b) => b.toString(16).padStart(2, "0")).join("");
}
const genCode = () => {
  const a = new Uint32Array(1); crypto.getRandomValues(a);
  return String(a[0] % 1_000_000).padStart(6, "0");
};
const genToken = () => {
  const a = new Uint8Array(24); crypto.getRandomValues(a);
  return Array.from(a).map((b) => b.toString(16).padStart(2, "0")).join("");
};

const CODE_TTL_MIN = 15;
const MAX_KBA = 3;
const MAX_CODE = 5;

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  try {
    const admin = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
    const ip = req.headers.get("x-forwarded-for") || "";
    const ua = req.headers.get("user-agent") || "";
    const body = await req.json();
    const { action } = body;
    const appendAudit = (cur: any[], ev: any) =>
      [...(cur || []), { at: new Date().toISOString(), by: null, channel: "self_service", ...ev }];

    // ---------- START ----------
    // { action:'start', email, change_type, new_value? }  -> { request_id, token, kba_available }
    // To avoid enumeration we ALWAYS return success-like payload. If email not found, we return fake token but no DB row.
    if (action === "start") {
      const { email, change_type, new_value } = body;
      if (!email || !["email", "phone", "password"].includes(change_type)) {
        return json({ error: "Dados inválidos" }, 400);
      }
      if ((change_type === "email" || change_type === "phone") && !new_value) {
        return json({ error: "Informe o novo valor desejado" }, 400);
      }
      const normEmail = String(email).trim().toLowerCase();
      const { data: prof } = await admin.from("profiles")
        .select("user_id, full_name, email").ilike("email", normEmail).maybeSingle();

      // Rate-limit: max 3 pending in last 30min per email
      if (prof?.user_id) {
        const since = new Date(Date.now() - 30 * 60_000).toISOString();
        const { count } = await admin.from("identity_verification_requests")
          .select("id", { count: "exact", head: true })
          .eq("target_user_id", prof.user_id).gte("created_at", since);
        if ((count || 0) >= 3) {
          return json({ error: "Muitas solicitações recentes — aguarde 30 minutos." }, 429);
        }
      }

      const token = genToken();
      if (prof?.user_id) {
        const { data: avail } = await admin.rpc("identity_kba_available", { _user_id: prof.user_id });
        await admin.from("identity_verification_requests").insert({
          target_user_id: prof.user_id, change_type, new_value: new_value || null,
          channel: "self_service", self_service_token: token,
          ip, user_agent: ua,
          audit: [{ at: new Date().toISOString(), event: "self_service_started", change_type }],
        });
        return json({ ok: true, token, kba_available: avail });
      }
      // Silent decoy
      return json({ ok: true, token, kba_available: { has_birth_date: true, has_cpf: true } });
    }

    // load by token
    const loadByToken = async (token: string) => {
      const { data } = await admin.from("identity_verification_requests")
        .select("*").eq("self_service_token", token).maybeSingle();
      return data;
    };

    // ---------- VERIFY KBA ----------
    if (action === "verify_kba") {
      const { token, birth_date, cpf_last4 } = body;
      const r = await loadByToken(token);
      if (!r) return json({ ok: false, attempts_left: 0, error: "Não foi possível validar. Confira seus dados." });
      if (r.status === "completed" || r.status === "cancelled" || r.status === "kba_failed") {
        return json({ error: "Solicitação encerrada — inicie novamente." }, 400);
      }
      if (r.kba_attempts >= MAX_KBA) {
        await admin.from("identity_verification_requests").update({ status: "kba_failed" }).eq("id", r.id);
        return json({ error: "Limite de tentativas excedido" }, 429);
      }
      const { data: ok } = await admin.rpc("verify_identity_kba", {
        _user_id: r.target_user_id, _birth_date: birth_date, _cpf_last4: cpf_last4,
      });
      const attempts = r.kba_attempts + 1;
      const newStatus = ok ? "kba_passed" : (attempts >= MAX_KBA ? "kba_failed" : "pending");
      await admin.from("identity_verification_requests").update({
        kba_attempts: attempts, kba_passed: ok, status: newStatus,
        audit: appendAudit(r.audit, { event: "kba_attempt", ok, attempts }),
      }).eq("id", r.id);
      return json({ ok, attempts_left: Math.max(0, MAX_KBA - attempts) });
    }

    // ---------- SEND CODE ----------
    if (action === "send_code") {
      const { token } = body;
      const r = await loadByToken(token);
      if (!r) return json({ error: "Sessão inválida" }, 400);
      if (!r.kba_passed) return json({ error: "Verificação de identidade ainda não foi aprovada" }, 400);
      if (r.status === "completed") return json({ error: "Já concluído" }, 400);

      const { data: prof } = await admin.from("profiles")
        .select("full_name,email").eq("user_id", r.target_user_id).maybeSingle();

      const recipient = r.change_type === "email" ? (r.new_value || "").trim() : (prof?.email || "");
      if (!recipient.includes("@")) return json({ error: "E-mail de destino indisponível" }, 400);

      const code = genCode();
      const code_hash = await sha256(code);
      const code_expires_at = new Date(Date.now() + CODE_TTL_MIN * 60_000).toISOString();

      await admin.from("identity_verification_requests").update({
        code_hash, code_expires_at, code_attempts: 0, code_verified: false,
        code_sent_to: recipient, status: "code_sent",
        audit: appendAudit(r.audit, { event: "code_sent", to_masked: maskEmail(recipient) }),
      }).eq("id", r.id);

      const sendRes = await admin.functions.invoke("send-transactional-email", {
        body: {
          templateName: "identity-verification-code",
          recipientEmail: recipient,
          idempotencyKey: `ssi-${r.id}-${Date.now()}`,
          templateData: { name: prof?.full_name || "", code, changeType: r.change_type, expiresInMinutes: CODE_TTL_MIN },
        },
      });
      if (sendRes.error) return json({ error: "Falha ao enviar código" }, 500);
      return json({ ok: true, recipient_masked: maskEmail(recipient), expires_in_minutes: CODE_TTL_MIN });
    }

    // ---------- VERIFY CODE & APPLY ----------
    if (action === "verify_code") {
      const { token, code } = body;
      const r = await loadByToken(token);
      if (!r) return json({ error: "Sessão inválida" }, 400);
      if (r.status !== "code_sent") return json({ error: "Código não foi enviado" }, 400);
      if (!r.code_hash || !r.code_expires_at) return json({ error: "Código indisponível" }, 400);
      if (new Date(r.code_expires_at) < new Date()) {
        await admin.from("identity_verification_requests").update({ status: "expired" }).eq("id", r.id);
        return json({ error: "Código expirado — gere um novo" }, 400);
      }
      if (r.code_attempts >= MAX_CODE) {
        await admin.from("identity_verification_requests").update({ status: "code_failed" }).eq("id", r.id);
        return json({ error: "Limite de tentativas excedido" }, 429);
      }
      const hash = await sha256(String(code || ""));
      const ok = hash === r.code_hash;
      const attempts = r.code_attempts + 1;
      if (!ok) {
        await admin.from("identity_verification_requests").update({
          code_attempts: attempts,
          status: attempts >= MAX_CODE ? "code_failed" : "code_sent",
          audit: appendAudit(r.audit, { event: "code_attempt", ok: false, attempts }),
        }).eq("id", r.id);
        return json({ ok: false, attempts_left: Math.max(0, MAX_CODE - attempts) });
      }

      const { data: prof } = await admin.from("profiles")
        .select("full_name,email,phone").eq("user_id", r.target_user_id).maybeSingle();
      const oldEmail = prof?.email || "";

      let applyErr: string | null = null;
      if (r.change_type === "email") {
        const upd = await admin.auth.admin.updateUserById(r.target_user_id, { email: r.new_value!, email_confirm: true });
        if (upd.error) applyErr = upd.error.message;
        else await admin.from("profiles").update({ email: r.new_value }).eq("user_id", r.target_user_id);
      } else if (r.change_type === "phone") {
        await admin.from("profiles").update({ phone: r.new_value }).eq("user_id", r.target_user_id);
      } else if (r.change_type === "password") {
        const temp = Array.from(crypto.getRandomValues(new Uint8Array(10)))
          .map((b) => "abcdefghijkmnpqrstuvwxyzABCDEFGHJKLMNPQRSTUVWXYZ23456789"[b % 56]).join("");
        const upd = await admin.auth.admin.updateUserById(r.target_user_id, { password: temp });
        if (upd.error) applyErr = upd.error.message;
        else if (oldEmail.includes("@")) {
          await admin.functions.invoke("send-transactional-email", {
            body: {
              templateName: "identity-verification-code",
              recipientEmail: oldEmail,
              idempotencyKey: `ssi-pw-${r.id}-${Date.now()}`,
              templateData: { name: prof?.full_name || "", code: temp, changeType: "password", expiresInMinutes: 60 },
            },
          });
        }
      }
      if (applyErr) {
        await admin.from("identity_verification_requests").update({
          audit: appendAudit(r.audit, { event: "apply_failed", error: applyErr }),
        }).eq("id", r.id);
        return json({ error: `Falha ao aplicar alteração: ${applyErr}` }, 500);
      }

      await admin.from("identity_verification_requests").update({
        code_verified: true, code_attempts: attempts, status: "completed",
        completed_at: new Date().toISOString(),
        audit: appendAudit(r.audit, { event: "completed", change_type: r.change_type }),
      }).eq("id", r.id);

      // Notify old email (email/phone changes)
      if (oldEmail.includes("@") && r.change_type !== "password") {
        await admin.functions.invoke("send-transactional-email", {
          body: {
            templateName: "email-change-confirm",
            recipientEmail: oldEmail,
            idempotencyKey: `ssi-notify-${r.id}`,
            templateData: {
              name: prof?.full_name || "",
              oldEmail: r.change_type === "email" ? oldEmail : `Telefone atualizado`,
              newEmail: r.change_type === "email" ? r.new_value : `Telefone atualizado`,
              changedAt: new Date().toLocaleString("pt-BR"),
            },
          },
        });
      }

      return json({ ok: true, applied: r.change_type });
    }

    return json({ error: "Ação inválida" }, 400);
  } catch (e: any) {
    console.error("self-service-identity error", e);
    return json({ error: e?.message || "Erro inesperado" }, 500);
  }
});