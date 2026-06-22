import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const json = (body: any, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });

function maskEmail(email: string) {
  if (!email || !email.includes("@")) return "***";
  const [u, d] = email.split("@");
  const um = u.length <= 2 ? u[0] + "*" : u.slice(0, 2) + "***";
  return `${um}@${d}`;
}
function maskPhone(p: string) {
  const d = (p || "").replace(/\D/g, "");
  if (d.length < 4) return "***";
  return `***${d.slice(-4)}`;
}

async function sha256(s: string) {
  const buf = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(s));
  return Array.from(new Uint8Array(buf)).map((b) => b.toString(16).padStart(2, "0")).join("");
}

function genCode() {
  const arr = new Uint32Array(1);
  crypto.getRandomValues(arr);
  return String(arr[0] % 1_000_000).padStart(6, "0");
}

const CODE_TTL_MIN = 15;
const MAX_KBA = 3;
const MAX_CODE = 5;

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const anonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) return json({ error: "Não autorizado" }, 401);

    const callerClient = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: { user: caller } } = await callerClient.auth.getUser();
    if (!caller) return json({ error: "Não autorizado" }, 401);

    const admin = createClient(supabaseUrl, serviceRoleKey);
    const { data: isAdmin } = await admin.rpc("has_role", { _user_id: caller.id, _role: "admin" });
    if (!isAdmin) return json({ error: "Acesso negado" }, 403);

    const body = await req.json();
    const { action } = body;
    const ip = req.headers.get("x-forwarded-for") || "";
    const ua = req.headers.get("user-agent") || "";

    // ---------- CREATE ----------
    if (action === "create") {
      const { target_user_id, change_type, new_value } = body;
      if (!target_user_id || !["email", "phone", "password"].includes(change_type)) {
        return json({ error: "Dados inválidos" }, 400);
      }
      if ((change_type === "email" || change_type === "phone") && !new_value) {
        return json({ error: "Novo valor é obrigatório" }, 400);
      }
      const { data: avail } = await admin.rpc("identity_kba_available", { _user_id: target_user_id });
      if (!avail?.has_birth_date || !avail?.has_cpf) {
        return json({
          error: "Aluno não possui data de nascimento e CPF cadastrados — desafio não é viável. Atualize o cadastro primeiro.",
        }, 200);
      }
      const { data: prof } = await admin.from("profiles")
        .select("full_name,email,phone").eq("user_id", target_user_id).maybeSingle();

      const { data: ins, error } = await admin.from("identity_verification_requests").insert({
        target_user_id, change_type, new_value: new_value || null,
        created_by: caller.id, ip, user_agent: ua,
        audit: [{ at: new Date().toISOString(), by: caller.id, event: "created" }],
      }).select("id").single();
      if (error) return json({ error: error.message }, 500);

      return json({
        request_id: ins.id,
        student: {
          name: prof?.full_name || "",
          email_masked: maskEmail(prof?.email || ""),
          phone_masked: maskPhone(prof?.phone || ""),
        },
        kba_available: avail,
      });
    }

    // Helper: load request
    const loadReq = async (id: string) => {
      const { data } = await admin.from("identity_verification_requests").select("*").eq("id", id).single();
      return data;
    };
    const appendAudit = (cur: any[], ev: any) => [...(cur || []), { at: new Date().toISOString(), by: caller.id, ...ev }];

    // ---------- VERIFY KBA ----------
    if (action === "verify_kba") {
      const { request_id, birth_date, cpf_last4 } = body;
      const r = await loadReq(request_id);
      if (!r) return json({ error: "Solicitação não encontrada" }, 404);
      if (r.status === "completed" || r.status === "cancelled") return json({ error: "Solicitação encerrada" }, 400);
      if (r.kba_attempts >= MAX_KBA) {
        await admin.from("identity_verification_requests").update({ status: "kba_failed" }).eq("id", request_id);
        return json({ error: "Limite de tentativas excedido" }, 429);
      }
      const { data: ok } = await admin.rpc("verify_identity_kba", {
        _user_id: r.target_user_id, _birth_date: birth_date, _cpf_last4: cpf_last4,
      });
      const attempts = r.kba_attempts + 1;
      const newStatus = ok ? "kba_passed" : (attempts >= MAX_KBA ? "kba_failed" : "pending");
      await admin.from("identity_verification_requests").update({
        kba_attempts: attempts,
        kba_passed: ok,
        status: newStatus,
        audit: appendAudit(r.audit, { event: "kba_attempt", ok, attempts }),
      }).eq("id", request_id);
      return json({ ok, attempts, attempts_left: Math.max(0, MAX_KBA - attempts), status: newStatus });
    }

    // ---------- SEND CODE ----------
    if (action === "send_code") {
      const { request_id } = body;
      const r = await loadReq(request_id);
      if (!r) return json({ error: "Solicitação não encontrada" }, 404);
      if (!r.kba_passed) return json({ error: "Desafio de identidade não foi aprovado" }, 400);
      if (r.status === "completed") return json({ error: "Solicitação já concluída" }, 400);

      // Decide recipient
      const { data: prof } = await admin.from("profiles")
        .select("full_name,email").eq("user_id", r.target_user_id).maybeSingle();

      let recipient = "";
      if (r.change_type === "email") {
        recipient = (r.new_value || "").trim();
      } else if (r.change_type === "phone" || r.change_type === "password") {
        recipient = prof?.email || "";
      }
      if (!recipient || !recipient.includes("@")) {
        return json({ error: "E-mail de destino do código indisponível" }, 400);
      }

      const code = genCode();
      const code_hash = await sha256(code);
      const code_expires_at = new Date(Date.now() + CODE_TTL_MIN * 60_000).toISOString();

      await admin.from("identity_verification_requests").update({
        code_hash, code_expires_at, code_attempts: 0, code_verified: false,
        code_sent_to: recipient, status: "code_sent",
        audit: appendAudit(r.audit, { event: "code_sent", to_masked: maskEmail(recipient) }),
      }).eq("id", request_id);

      // Send transactional email
      const sendRes = await admin.functions.invoke("send-transactional-email", {
        body: {
          templateName: "identity-verification-code",
          recipientEmail: recipient,
          idempotencyKey: `ivr-${request_id}-${Date.now()}`,
          templateData: {
            name: prof?.full_name || "",
            code,
            changeType: r.change_type,
            expiresInMinutes: CODE_TTL_MIN,
          },
        },
      });
      if (sendRes.error) {
        console.error("send-transactional-email error", sendRes.error);
        return json({ error: "Falha ao enviar código por e-mail" }, 500);
      }
      return json({ ok: true, recipient_masked: maskEmail(recipient), expires_in_minutes: CODE_TTL_MIN });
    }

    // ---------- VERIFY CODE & APPLY ----------
    if (action === "verify_code") {
      const { request_id, code } = body;
      const r = await loadReq(request_id);
      if (!r) return json({ error: "Solicitação não encontrada" }, 404);
      if (r.status !== "code_sent") return json({ error: "Código não foi enviado" }, 400);
      if (!r.code_hash || !r.code_expires_at) return json({ error: "Código indisponível" }, 400);
      if (new Date(r.code_expires_at) < new Date()) {
        await admin.from("identity_verification_requests").update({ status: "expired" }).eq("id", request_id);
        return json({ error: "Código expirado — gere um novo" }, 400);
      }
      if (r.code_attempts >= MAX_CODE) {
        await admin.from("identity_verification_requests").update({ status: "code_failed" }).eq("id", request_id);
        return json({ error: "Limite de tentativas do código excedido" }, 429);
      }
      const hash = await sha256(String(code || ""));
      const ok = hash === r.code_hash;
      const attempts = r.code_attempts + 1;
      if (!ok) {
        await admin.from("identity_verification_requests").update({
          code_attempts: attempts,
          status: attempts >= MAX_CODE ? "code_failed" : "code_sent",
          audit: appendAudit(r.audit, { event: "code_attempt", ok: false, attempts }),
        }).eq("id", request_id);
        return json({ ok: false, attempts, attempts_left: Math.max(0, MAX_CODE - attempts) });
      }

      // Apply change
      const { data: prof } = await admin.from("profiles")
        .select("full_name,email,phone").eq("user_id", r.target_user_id).maybeSingle();
      const oldEmail = prof?.email || "";
      const oldPhone = prof?.phone || "";

      let applyErr: string | null = null;
      if (r.change_type === "email") {
        const upd = await admin.auth.admin.updateUserById(r.target_user_id, {
          email: r.new_value!, email_confirm: true,
        });
        if (upd.error) applyErr = upd.error.message;
        else await admin.from("profiles").update({ email: r.new_value }).eq("user_id", r.target_user_id);
      } else if (r.change_type === "phone") {
        await admin.from("profiles").update({ phone: r.new_value }).eq("user_id", r.target_user_id);
      } else if (r.change_type === "password") {
        // Generate temporary password and email it via existing flow
        const temp = Array.from(crypto.getRandomValues(new Uint8Array(9)))
          .map((b) => "abcdefghijkmnpqrstuvwxyzABCDEFGHJKLMNPQRSTUVWXYZ23456789"[b % 56]).join("");
        const upd = await admin.auth.admin.updateUserById(r.target_user_id, { password: temp });
        if (upd.error) applyErr = upd.error.message;
        else {
          // Send temp password to current email — we DO NOT show it to admin
          await admin.functions.invoke("send-transactional-email", {
            body: {
              templateName: "identity-verification-code",
              recipientEmail: oldEmail,
              idempotencyKey: `ivr-pw-${request_id}-${Date.now()}`,
              templateData: {
                name: prof?.full_name || "",
                code: temp,
                changeType: "password",
                expiresInMinutes: 60,
              },
            },
          });
        }
      }

      if (applyErr) {
        await admin.from("identity_verification_requests").update({
          audit: appendAudit(r.audit, { event: "apply_failed", error: applyErr }),
        }).eq("id", request_id);
        return json({ error: `Falha ao aplicar alteração: ${applyErr}` }, 500);
      }

      await admin.from("identity_verification_requests").update({
        code_verified: true, code_attempts: attempts, status: "completed", completed_at: new Date().toISOString(),
        audit: appendAudit(r.audit, { event: "completed", change_type: r.change_type }),
      }).eq("id", request_id);

      // Notify OLD email about the change (for email/phone changes)
      if (oldEmail && oldEmail.includes("@") && r.change_type !== "password") {
        await admin.functions.invoke("send-transactional-email", {
          body: {
            templateName: "email-change-confirm",
            recipientEmail: oldEmail,
            idempotencyKey: `ivr-notify-${request_id}`,
            templateData: {
              name: prof?.full_name || "",
              oldEmail: r.change_type === "email" ? oldEmail : `Telefone ${maskPhone(oldPhone)}`,
              newEmail: r.change_type === "email" ? r.new_value : `Telefone ${maskPhone(r.new_value || "")}`,
              changedAt: new Date().toLocaleString("pt-BR"),
            },
          },
        });
      }

      return json({ ok: true, applied: r.change_type });
    }

    // ---------- CANCEL ----------
    if (action === "cancel") {
      const { request_id, reason } = body;
      const r = await loadReq(request_id);
      if (!r) return json({ error: "Solicitação não encontrada" }, 404);
      await admin.from("identity_verification_requests").update({
        status: "cancelled",
        audit: appendAudit(r.audit, { event: "cancelled", reason: reason || null }),
      }).eq("id", request_id);
      return json({ ok: true });
    }

    return json({ error: "Ação inválida" }, 400);
  } catch (err: any) {
    console.error("admin-identity-verification error", err);
    return json({ error: err?.message || "Erro inesperado" }, 500);
  }
});