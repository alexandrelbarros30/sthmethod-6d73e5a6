import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
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

    const { students } = await req.json();
    if (!students || !Array.isArray(students)) {
      return new Response(JSON.stringify({ error: "Lista de alunos é obrigatória" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const results: { email: string; status: string; error?: string }[] = [];

    for (const student of students) {
      const email = student.email?.trim()?.toLowerCase();
      if (!email) {
        results.push({ email: "N/A", status: "skipped", error: "Email vazio" });
        continue;
      }

      try {
        // Check if user already exists by email in profiles
        const { data: existingProfile } = await adminClient
          .from("profiles")
          .select("user_id")
          .eq("email", email)
          .maybeSingle();

        if (existingProfile) {
          // Update existing profile
          await adminClient.from("profiles").update({
            full_name: student.full_name || undefined,
            phone: student.phone || undefined,
            weight: student.weight || undefined,
            height: student.height || undefined,
            birth_date: student.birth_date || undefined,
            physical_activity: student.physical_activity || undefined,
            objective: student.objective || undefined,
            current_protocol: student.current_protocol || undefined,
            comorbidities: student.comorbidities || undefined,
          }).eq("user_id", existingProfile.user_id);

          results.push({ email, status: "updated" });
          continue;
        }

        // Create new auth user with default password
        const defaultPassword = "123456";
        const { data: userData, error: createError } = await adminClient.auth.admin.createUser({
          email,
          password: defaultPassword,
          email_confirm: true,
          user_metadata: { full_name: student.full_name || "" },
        });

        if (createError) {
          results.push({ email, status: "error", error: createError.message });
          continue;
        }

        if (userData?.user?.id) {
          // Update profile with additional data (profile is auto-created by trigger)
          await adminClient.from("profiles").update({
            full_name: student.full_name || "",
            phone: student.phone || "",
            weight: student.weight || null,
            height: student.height || null,
            birth_date: student.birth_date || null,
            physical_activity: student.physical_activity || "...",
            objective: student.objective || "...",
            current_protocol: student.current_protocol || "...",
            comorbidities: student.comorbidities || "...",
          }).eq("user_id", userData.user.id);
        }

        results.push({ email, status: "created" });
      } catch (err: any) {
        results.push({ email, status: "error", error: err.message });
      }
    }

    const created = results.filter(r => r.status === "created").length;
    const updated = results.filter(r => r.status === "updated").length;
    const errors = results.filter(r => r.status === "error").length;
    const skipped = results.filter(r => r.status === "skipped").length;

    return new Response(JSON.stringify({
      summary: { total: students.length, created, updated, errors, skipped },
      details: results,
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err: any) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
