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
    const authHeader = req.headers.get("Authorization")!;

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
        return new Response(JSON.stringify({ error: "Erro ao criar usuário. Verifique os dados e tente novamente." }), {
          status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
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
        return new Response(JSON.stringify({ error: "Erro ao excluir usuário. Tente novamente." }), {
          status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      return new Response(JSON.stringify({ success: true }), {
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
