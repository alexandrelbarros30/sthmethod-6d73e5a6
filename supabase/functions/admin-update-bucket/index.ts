// Atualiza configurações do bucket "documents" via Storage Management API
Deno.serve(async (_req) => {
  const url = Deno.env.get("SUPABASE_URL")!;
  const key = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const res = await fetch(`${url}/storage/v1/bucket/documents`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${key}`,
      apikey: key,
    },
    body: JSON.stringify({
      id: "documents",
      name: "documents",
      public: false,
      file_size_limit: 57671680,
      allowed_mime_types: ["application/pdf"],
    }),
  });
  const text = await res.text();
  return new Response(text, { status: res.status, headers: { "Content-Type": "application/json" } });
});