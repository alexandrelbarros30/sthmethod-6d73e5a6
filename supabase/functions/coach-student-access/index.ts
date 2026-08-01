import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });

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

    const body = await req.json().catch(() => ({}));
    const action = String(body?.action || "");
    const studentId = String(body?.student_id || "");
    if (!action || !studentId) return json({ error: "Dados incompletos" }, 400);

    const { data: student } = await admin
      .from("coach_students")
      .select("id, tenant_id, user_id, full_name, email")
      .eq("id", studentId)
      .maybeSingle();
    if (!student) return json({ error: "Aluno não encontrado" }, 404);

    // Caller must be an active member (owner/professor) of the student's tenant,
    // or a platform admin.
    const [{ data: member }, { data: isAdmin }] = await Promise.all([
      admin
        .from("coach_members")
        .select("id, role")
        .eq("tenant_id", student.tenant_id)
        .eq("user_id", caller.id)
        .eq("active", true)
        .maybeSingle(),
      admin.rpc("has_role", { _user_id: caller.id, _role: "admin" }),
    ]);
    if (!member && !isAdmin) return json({ error: "Acesso negado" }, 403);

    if (action === "create_login") {
      const email = String(body?.email || "").trim().toLowerCase();
      const password = String(body?.password || "");
      if (!email || !email.includes("@")) return json({ error: "E-mail inválido" }, 400);
      if (password.length < 8) return json({ error: "A senha deve ter no mínimo 8 caracteres" }, 400);
      if (student.user_id) return json({ error: "Este aluno já possui acesso" }, 200);

      const { data: created, error: createErr } = await admin.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
        user_metadata: { full_name: student.full_name },
      });

      let userId = created?.user?.id ?? null;

      if (createErr) {
        const alreadyExists = createErr.message?.toLowerCase().includes("already been registered");
        if (!alreadyExists) {
          console.error("create_login error:", createErr.message);
          return json({ error: "Não foi possível criar o acesso" }, 200);
        }
        // Reuse the existing auth account with this e-mail
        const { data: list } = await admin.auth.admin.listUsers({ page: 1, perPage: 1000 });
        const found = list?.users?.find((u) => (u.email || "").toLowerCase() === email);
        if (!found) return json({ error: "Este e-mail já está em uso em outra conta" }, 200);
        const { data: linked } = await admin
          .from("coach_students")
          .select("id")
          .eq("user_id", found.id)
          .maybeSingle();
        if (linked && linked.id !== student.id) {
          return json({ error: "Este e-mail já está vinculado a outro aluno" }, 200);
        }
        await admin.auth.admin.updateUserById(found.id, { password });
        userId = found.id;
      }

      if (!userId) return json({ error: "Não foi possível criar o acesso" }, 200);

      const { error: linkErr } = await admin
        .from("coach_students")
        .update({ user_id: userId, email })
        .eq("id", student.id);
      if (linkErr) {
        console.error("link error:", linkErr.message);
        return json({ error: "Acesso criado, mas não foi possível vincular ao aluno" }, 200);
      }

      return json({ success: true, user_id: userId, email });
    }

    if (action === "reset_password") {
      const password = String(body?.password || "");
      if (password.length < 8) return json({ error: "A senha deve ter no mínimo 8 caracteres" }, 400);
      if (!student.user_id) return json({ error: "Este aluno ainda não tem acesso criado" }, 200);
      const { error } = await admin.auth.admin.updateUserById(student.user_id, { password });
      if (error) {
        console.error("reset_password error:", error.message);
        return json({ error: "Não foi possível redefinir a senha" }, 200);
      }
      return json({ success: true });
    }

    if (action === "send_reset_email") {
      const redirectTo = String(body?.redirect_to || "");
      if (!student.email) return json({ error: "Aluno sem e-mail cadastrado" }, 200);
      const { error } = await admin.auth.resetPasswordForEmail(student.email, {
        redirectTo: redirectTo || undefined,
      });
      if (error) {
        console.error("send_reset_email error:", error.message);
        return json({ error: "Não foi possível enviar o e-mail de redefinição" }, 200);
      }
      return json({ success: true });
    }

    if (action === "revoke_access") {
      const { error } = await admin
        .from("coach_students")
        .update({ user_id: null })
        .eq("id", student.id);
      if (error) return json({ error: "Não foi possível remover o acesso" }, 200);
      return json({ success: true });
    }

    return json({ error: "Ação inválida" }, 400);
  } catch (err) {
    console.error("coach-student-access fatal:", err);
    return json({ error: "Erro inesperado" }, 500);
  }
});