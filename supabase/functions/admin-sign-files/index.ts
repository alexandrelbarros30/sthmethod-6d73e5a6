import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });
  try {
    const url = new URL(req.url);
    if (url.searchParams.get("emanuel") === "1") {
      const sb = createClient(
        Deno.env.get("SUPABASE_URL")!,
        Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
      );
      const paths = [
        "22811801-fcc3-46b4-85c8-c1be9be121dd/front_1782481803101.jpg",
        "22811801-fcc3-46b4-85c8-c1be9be121dd/back_1782481804906.jpg",
        "22811801-fcc3-46b4-85c8-c1be9be121dd/profile_1782481806663.jpg",
      ];
      const { data, error } = await sb.storage.from("body-images").createSignedUrls(paths, 86400);
      if (error) return json({ error: error.message }, 400);
      console.log("EMANUEL_SIGNED", JSON.stringify(data));
      return json({ data });
    }
    const { bucket, paths, expiresIn = 600, token } = await req.json();
    let authorized = token && token === Deno.env.get("ADMIN_SIGN_FILES_TOKEN");
    if (!authorized) {
      const authHeader = req.headers.get("Authorization") || "";
      const jwt = authHeader.replace("Bearer ", "");
      if (jwt) {
        const userClient = createClient(
          Deno.env.get("SUPABASE_URL")!,
          Deno.env.get("SUPABASE_ANON_KEY")!,
          { global: { headers: { Authorization: `Bearer ${jwt}` } } },
        );
        const { data: u } = await userClient.auth.getUser();
        if (u?.user) {
          const { data: role } = await userClient
            .from("user_roles").select("role").eq("user_id", u.user.id).eq("role", "admin").maybeSingle();
          if (role) authorized = true;
        }
      }
    }
    if (!authorized) {
      return json({ error: "unauthorized" }, 401);
    }
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );
    const { data, error } = await supabase.storage
      .from(bucket)
      .createSignedUrls(paths, expiresIn);
    if (error) return json({ error: error.message }, 400);
    return json({ data });
  } catch (e) {
    return json({ error: String(e) }, 500);
  }
});

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "*",
  "Content-Type": "application/json",
};
function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), { status, headers: cors });
}