import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const anonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const authHeader = req.headers.get("Authorization");

    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Não autorizado" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Verify caller is admin
    const callerClient = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: { user: caller } } = await callerClient.auth.getUser();
    if (!caller) {
      return new Response(JSON.stringify({ error: "Não autorizado" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const adminClient = createClient(supabaseUrl, serviceRoleKey);
    const { data: isAdmin } = await adminClient.rpc("has_role", { _user_id: caller.id, _role: "admin" });
    if (!isAdmin) {
      return new Response(JSON.stringify({ error: "Acesso negado" }), {
        status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { action, ...payload } = await req.json();

    if (action === "create") {
      const { email, password, full_name, role } = payload;
      if (!email || !password || !full_name) {
        return new Response(JSON.stringify({ error: "Email, senha e nome são obrigatórios" }), {
          status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const { data, error } = await adminClient.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
        user_metadata: { full_name },
      });
      if (error) {
        console.error("Error creating user:", error.message);
        const msg = error.message?.includes("already been registered")
          ? "Este email já está cadastrado no sistema. Use outro email ou edite o aluno existente."
          : "Erro ao criar usuário. Verifique os dados e tente novamente.";
        return new Response(JSON.stringify({ error: msg }), {
          status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      // If a specific role was requested, update from default 'student'
      if (role && role !== "student" && data.user) {
        await adminClient.from("user_roles").update({ role }).eq("user_id", data.user.id);
      }
      return new Response(JSON.stringify({ user: data.user }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (action === "reset_password") {
      const { user_id, new_password } = payload;
      if (!user_id || !new_password) {
        return new Response(JSON.stringify({ error: "user_id e nova senha são obrigatórios" }), {
          status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (new_password.length < 6) {
        return new Response(JSON.stringify({ error: "A senha deve ter no mínimo 6 caracteres" }), {
          status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const { error } = await adminClient.auth.admin.updateUserById(user_id, { password: new_password });
      if (error) {
        console.error("Error resetting password:", error.message);
        return new Response(JSON.stringify({ error: `Erro ao alterar senha: ${error.message}` }), {
          status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      return new Response(JSON.stringify({ success: true }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (action === "delete") {
      const { user_id } = payload;
      if (!user_id) {
        return new Response(JSON.stringify({ error: "user_id é obrigatório" }), {
          status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      // Delete related data first
      await adminClient.from("consultant_students").delete().eq("consultant_id", user_id);
      await adminClient.from("consultant_students").delete().eq("student_id", user_id);
      await adminClient.from("student_diets").delete().eq("user_id", user_id);
      await adminClient.from("student_protocols").delete().eq("user_id", user_id);
      await adminClient.from("student_trainings").delete().eq("user_id", user_id);
      await adminClient.from("subscriptions").delete().eq("user_id", user_id);
      await adminClient.from("protocols").delete().eq("user_id", user_id);
      await adminClient.from("diet_meals").delete().eq("user_id", user_id);
      await adminClient.from("training_weeks").delete().eq("user_id", user_id);
      await adminClient.from("body_images").delete().eq("user_id", user_id);
      await adminClient.from("anamnesis_entries").delete().eq("user_id", user_id);
      await adminClient.from("payments").delete().eq("user_id", user_id);
      await adminClient.from("admin_reminders").delete().eq("user_id", user_id);
      await adminClient.from("message_history").delete().eq("user_id", user_id);
      await adminClient.from("profiles").delete().eq("user_id", user_id);
      await adminClient.from("user_roles").delete().eq("user_id", user_id);

      const { error } = await adminClient.auth.admin.deleteUser(user_id);
      if (error) {
        console.error("Error deleting user:", error.message);
        const msg = (error.message || "").toLowerCase();
        // If user already gone from Auth, treat as success — related rows were cleaned above
        if (msg.includes("not found") || msg.includes("user_not_found")) {
          return new Response(JSON.stringify({ success: true, already_deleted: true }), {
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }
        return new Response(JSON.stringify({ error: `Erro ao excluir usuário: ${error.message}` }), {
          status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      return new Response(JSON.stringify({ success: true }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (action === "check_orphan") {
      const { email } = payload;
      if (!email) {
        return new Response(JSON.stringify({ error: "Email é obrigatório" }), {
          status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      // Search through pages to find user by email
      let found: any = null;
      let page = 1;
      const perPage = 500;
      while (!found) {
        const { data: listData, error: listError } = await adminClient.auth.admin.listUsers({ page, perPage });
        if (listError) {
          return new Response(JSON.stringify({ error: "Erro ao buscar usuários" }), {
            status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }
        found = listData.users.find((u: any) => u.email === email);
        if (found) break;
        if (listData.users.length < perPage) break; // no more pages
        page++;
      }
      if (!found) {
        return new Response(JSON.stringify({ orphan: false }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const { data: profile } = await adminClient.from("profiles").select("user_id").eq("user_id", found.id).maybeSingle();
      const { data: role } = await adminClient.from("user_roles").select("role").eq("user_id", found.id).maybeSingle();
      const isOrphan = !profile || !role;
      return new Response(JSON.stringify({
        orphan: isOrphan,
        user_id: found.id,
        email: found.email,
        has_profile: !!profile,
        has_role: !!role,
        created_at: found.created_at,
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (action === "repair_orphan") {
      const { user_id, full_name, email } = payload;
      if (!user_id) {
        return new Response(JSON.stringify({ error: "user_id é obrigatório" }), {
          status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      // Ensure profile exists
      const { data: existingProfile } = await adminClient.from("profiles").select("id").eq("user_id", user_id).maybeSingle();
      if (!existingProfile) {
        await adminClient.from("profiles").insert({
          user_id,
          full_name: full_name || "",
          email: email || "",
        });
      }
      // Ensure role exists
      const { data: existingRole } = await adminClient.from("user_roles").select("id").eq("user_id", user_id).maybeSingle();
      if (!existingRole) {
        await adminClient.from("user_roles").insert({ user_id, role: "student" });
      }
      return new Response(JSON.stringify({ success: true, user_id }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (action === "swap_emails") {
      const { user_a, user_b } = payload;
      if (!user_a || !user_b) {
        return new Response(JSON.stringify({ error: "user_a e user_b são obrigatórios" }), {
          status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const { data: ua, error: eA } = await adminClient.auth.admin.getUserById(user_a);
      const { data: ub, error: eB } = await adminClient.auth.admin.getUserById(user_b);
      if (eA || eB || !ua?.user || !ub?.user) {
        return new Response(JSON.stringify({ error: "Usuário não encontrado" }), {
          status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const emailA = ua.user.email!;
      const emailB = ub.user.email!;
      const tempEmail = `temp-swap-${crypto.randomUUID()}@swap.local`;
      // Step 1: park A on temp
      let res = await adminClient.auth.admin.updateUserById(user_a, { email: tempEmail, email_confirm: true });
      if (res.error) {
        return new Response(JSON.stringify({ error: `Falha passo 1: ${res.error.message}` }), {
          status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      // Step 2: B -> emailA
      res = await adminClient.auth.admin.updateUserById(user_b, { email: emailA, email_confirm: true });
      if (res.error) {
        // rollback
        await adminClient.auth.admin.updateUserById(user_a, { email: emailA, email_confirm: true });
        return new Response(JSON.stringify({ error: `Falha passo 2: ${res.error.message}` }), {
          status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      // Step 3: A (temp) -> emailB
      res = await adminClient.auth.admin.updateUserById(user_a, { email: emailB, email_confirm: true });
      if (res.error) {
        return new Response(JSON.stringify({ error: `Falha passo 3 (estado inconsistente!): ${res.error.message}` }), {
          status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      // Also sync profiles.email so they stay consistent
      await adminClient.from("profiles").update({ email: emailB }).eq("user_id", user_a);
      await adminClient.from("profiles").update({ email: emailA }).eq("user_id", user_b);
      return new Response(JSON.stringify({ success: true, user_a_email: emailB, user_b_email: emailA }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (action === "update_email") {
      const { user_id, new_email } = payload;
      if (!user_id || !new_email || !new_email.includes("@")) {
        return new Response(JSON.stringify({ error: "user_id e novo email válido são obrigatórios" }), {
          status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const normalized = new_email.trim().toLowerCase();
      // Detect collision in auth
      let conflictUserId: string | null = null;
      try {
        let page = 1;
        const perPage = 500;
        while (true) {
          const { data: listData, error: listError } = await adminClient.auth.admin.listUsers({ page, perPage });
          if (listError) break;
          const f = listData.users.find((u: any) => (u.email || "").toLowerCase() === normalized);
          if (f) { conflictUserId = f.id; break; }
          if (listData.users.length < perPage) break;
          page++;
        }
      } catch { /* noop */ }
      if (conflictUserId && conflictUserId !== user_id) {
        return new Response(JSON.stringify({ error: "Este email já está em uso por outra conta no sistema." }), {
          status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const { error: authErr } = await adminClient.auth.admin.updateUserById(user_id, {
        email: normalized, email_confirm: true,
      });
      if (authErr) {
        console.error("update_email auth error:", authErr.message);
        return new Response(JSON.stringify({ error: `Falha ao atualizar email no login: ${authErr.message}` }), {
          status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      await adminClient.from("profiles").update({ email: normalized }).eq("user_id", user_id);
      return new Response(JSON.stringify({ success: true, email: normalized }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ error: "Ação inválida" }), {
      status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("Admin manage error:", err);
    return new Response(JSON.stringify({ error: "Operação falhou. Tente novamente." }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
