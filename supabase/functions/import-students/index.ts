import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const allowedOrigins = [
  "https://sthconsultoria.lovable.app",
  "https://id-preview--b584eea6-c842-4d93-86ab-554e2c58d9fb.lovable.app",
];

function getCorsHeaders(req: Request) {
  const origin = req.headers.get("origin") || "";
  const allowed = allowedOrigins.includes(origin) ? origin : allowedOrigins[0];
  return {
    "Access-Control-Allow-Origin": allowed,
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  };
}

Deno.serve(async (req) => {
  const corsHeaders = getCorsHeaders(req);
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
          // Update existing profile with real values only
          const updateData: Record<string, any> = {};
          if (student.full_name && student.full_name !== "...") updateData.full_name = student.full_name;
          if (student.phone && student.phone !== "...") updateData.phone = student.phone;
          if (student.birth_date && student.birth_date !== "...") updateData.birth_date = student.birth_date;
          if (student.physical_activity && student.physical_activity !== "...") updateData.physical_activity = student.physical_activity;
          if (student.objective && student.objective !== "...") updateData.objective = student.objective;
          if (student.current_protocol && student.current_protocol !== "...") updateData.current_protocol = student.current_protocol;
          if (student.comorbidities && student.comorbidities !== "...") updateData.comorbidities = student.comorbidities;
          
          const h = parseFloat(student.height);
          if (!isNaN(h) && h > 0) updateData.height = h;
          const w = parseFloat(student.weight);
          if (!isNaN(w) && w > 0) updateData.weight = w;

          if (Object.keys(updateData).length > 0) {
            await adminClient.from("profiles").update(updateData).eq("user_id", existingProfile.user_id);
          }

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
          console.error(`Error creating user ${email}:`, createError.message);
          results.push({ email, status: "error", error: "Falha ao criar conta" });
          continue;
        }

        if (userData?.user?.id) {
          // Wait a moment for the trigger to create the profile
          await new Promise((r) => setTimeout(r, 500));
          
          const profileData: Record<string, any> = {
            full_name: student.full_name || "",
            physical_activity: student.physical_activity || "...",
            objective: student.objective || "...",
            current_protocol: student.current_protocol || "...",
            comorbidities: student.comorbidities || "...",
          };
          
          // Only set fields that have real values (not "...")
          if (student.phone && student.phone !== "...") profileData.phone = student.phone;
          if (student.birth_date && student.birth_date !== "...") profileData.birth_date = student.birth_date;
          
          const h = parseFloat(student.height);
          if (!isNaN(h) && h > 0) profileData.height = h;
          
          const w = parseFloat(student.weight);
          if (!isNaN(w) && w > 0) profileData.weight = w;

          await adminClient.from("profiles").update(profileData).eq("user_id", userData.user.id);
        }

        results.push({ email, status: "created" });
      } catch (err: any) {
        console.error(`Error processing student ${email}:`, err.message);
        results.push({ email, status: "error", error: "Falha no processamento" });
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
    console.error("Import students error:", err.message);
    return new Response(JSON.stringify({ error: "Falha na importação. Tente novamente." }), {
      status: 500, headers: { ...getCorsHeaders(req), "Content-Type": "application/json" },
    });
  }
});
