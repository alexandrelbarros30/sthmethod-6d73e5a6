// STHIA — Central de Análise Clínica do Aluno
// Integra dossiê completo (perfil, exames, bioimpedância, fotos, protocolo, dieta, treino)
// com o cérebro STHIA Elite Medical Performance Engine e devolve um parecer estruturado.
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const MODEL_ID = "google/gemini-2.5-flash";

const STHIA_IDENTITY = `Você é o STHIA ELITE MEDICAL PERFORMANCE ENGINE — cérebro clínico-científico da STH METHOD.
Integra médicos do esporte, endocrinologistas, nutrólogos, farmacologistas, bioquímicos,
fisiologistas, nutricionistas esportivos e coaches de elite. Domina fisiologia, farmacocinética,
farmacodinâmica, interpretação laboratorial, composição corporal e medicina baseada em evidências.
Voz técnica, direta, sem enrolação. NUNCA promete resultado milagroso. NUNCA usa a expressão "modo deus".`;

const STHIA_LAYERS = `# 12 CAMADAS OPERACIONAIS
1. Hierarquia de evidências (★ a ★★★★★) em toda recomendação sensível.
2. Raciocínio multidisciplinar simultâneo (médico + endócrino + nutro + farma + coach).
3. Modo investigativo: aponte dados faltantes, diagnósticos diferenciais, red flags.
4. Otimização multi-eixo (hipertrofia, GC, insulina, CV, fígado, rim, sono, libido, cognição).
5. Modo bodybuilder (off-season, cutting, peak week, PCT, cruise, blast).
6. Motor de exames: NUNCA leia marcador isolado — tendências, correlações, prioridade clínica.
7. Análise visual de imagens corporais: %GC estimado, distribuição muscular, assimetrias, retenção,
   pontos fracos, maturidade — sempre rotulada como "estimativa visual, não é diagnóstico".
8. Memória longitudinal (evolução × regressão × estagnação).
9. Previsão de resultado com probabilidade e marcadores esperados.
10. Modo cientista: mecanismo fisiológico curto quando citar hormônio/peptídeo relevante.
11. Personalização por sexo, idade, experiência, stack, exames, sono, patologias.
12. Segurança primeiro: red flags sinalizados, evidência antes de opinião, transparência.`;

const FORMAT_SPEC = `FORMATO DE SAÍDA — HTML PURO (sem markdown, sem code fences). Use apenas
<p>, <strong>, <em>, <br>, <table>, <tr>, <td>, <th>. Estruture o parecer nesta ordem:

<p><strong>🧠 PARECER GERAL</strong></p>
<p>Diagnóstico integrado (5-8 linhas) cruzando exames + composição corporal + protocolo atual + queixas.</p>

<p><strong>🩸 INTERPRETAÇÃO LABORATORIAL</strong></p>
Para cada bloco (hormonal, hepático, renal, lipídico, hemograma, inflamatório, metabólico, tireoide),
use uma <table> compacta com colunas: Marcador | Valor | Referência | Status | Leitura clínica.
Status = 🟢 ok · 🟡 atenção · 🔴 alterado. Se não houver dados do bloco, omita a tabela.

<p><strong>📸 COMPOSIÇÃO VISUAL</strong></p>
<p>Estimativa visual — não é diagnóstico. Descreva: %GC estimado, distribuição, simetria,
retenção hídrica, pontos fracos, maturidade muscular e evolução vs. sessão anterior (se houver).</p>

<p><strong>⚖️ COMPOSIÇÃO CORPORAL</strong></p>
<p>Leitura de bioimpedância e antropometria: MG, MM, água, ângulo de fase, gordura visceral,
segmentos (assimetria %). Compare com sessão anterior quando existir.</p>

<p><strong>🚨 RED FLAGS</strong></p>
<p>Liste alterações que exigem ação/consulta médica IMEDIATA (ou "Nenhuma no momento").</p>

<p><strong>🎯 RECOMENDAÇÕES PRIORIZADAS</strong></p>
<p>Até 8 ações ordenadas por impacto: dieta, treino, protocolo, suplementação, sono,
exames de reavaliação. Cada linha com nível de evidência entre parênteses.</p>

<p><strong>📅 PLANO DE REAVALIAÇÃO</strong></p>
<p>O que refazer em 30 / 60 / 90 dias (exames, bioimpedância, fotos, ajustes de stack).</p>

<p><strong>⚠️ DISCLAIMER</strong></p>
<p>Este parecer é apoio à decisão do consultor. Não substitui avaliação médica presencial.</p>`;

async function fetchDossier(
  admin: ReturnType<typeof createClient>,
  studentId: string,
  bodyImageIds?: string[] | null,
) {
  const out: Record<string, unknown> = {};
  const imageParts: Array<{ type: "image_url"; image_url: { url: string } }> = [];

  const { data: prof } = await admin.from("profiles")
    .select("full_name, birth_date, gender, weight, height, objective, medical_conditions, medications, current_supplements, allergies, notes")
    .eq("user_id", studentId).maybeSingle();
  out.profile = prof ?? null;

  const { data: bio } = await admin.from("bioimpedance_logs")
    .select("logged_at, total_weight, body_fat_pct, fat_mass_kg, lean_mass_kg, skeletal_muscle_kg, total_water_pct, intracellular_water_l, extracellular_water_l, bmr_kcal, metabolic_age, visceral_fat, seg_left_arm, seg_right_arm, seg_left_leg, seg_right_leg, seg_trunk, phase_angle, waist_cm, hip_cm, chest_cm, arm_cm, notes")
    .eq("user_id", studentId).order("logged_at", { ascending: false }).limit(3);
  out.bioimpedance = bio ?? [];

  const { data: weights } = await admin.from("weight_logs")
    .select("logged_at, weight_kg, body_fat_pct, notes").eq("user_id", studentId)
    .order("logged_at", { ascending: false }).limit(10);
  out.weight_history = weights ?? [];

  const { data: currentProtocol } = await admin.from("student_protocols")
    .select("title, content, created_at").eq("user_id", studentId)
    .order("created_at", { ascending: false }).limit(1).maybeSingle();
  out.current_protocol = currentProtocol ?? null;

  const { data: currentDiet } = await admin.from("student_diets")
    .select("title, kcal, protein_g, carbs_g, fat_g, water_goal_ml, created_at")
    .eq("user_id", studentId).order("created_at", { ascending: false }).limit(1).maybeSingle();
  out.current_diet = currentDiet ?? null;

  const { data: labs } = await admin.from("metabolic_panels")
    .select("created_at, panel_type, values, notes")
    .eq("user_id", studentId).order("created_at", { ascending: false }).limit(5);
  out.metabolic_panels = labs ?? [];

  const { data: docs } = await admin.from("clinical_documents")
    .select("type, storage_path, file_url, uploaded_at")
    .eq("user_id", studentId).order("uploaded_at", { ascending: false }).limit(6);
  const docLinks: string[] = [];
  for (const d of docs ?? []) {
    let url: string | null = null;
    if (d.storage_path) {
      const { data: signed } = await admin.storage.from("documents")
        .createSignedUrl(d.storage_path, 60 * 30);
      url = signed?.signedUrl ?? null;
    }
    if (!url && d.file_url) url = d.file_url;
    if (url) docLinks.push(`${d.type} · ${new Date(d.uploaded_at).toLocaleDateString("pt-BR")} → ${url}`);
  }
  out.clinical_documents = docLinks;

  // Body images — either explicit selection (bodyImageIds) or auto (front/back/profile most recent)
  const { data: imgs } = await admin.from("body_images")
    .select("id, type, storage_path, image_url, uploaded_at, is_current")
    .eq("user_id", studentId).order("uploaded_at", { ascending: false }).limit(40);
  if (imgs?.length) {
    let selected: any[] = [];
    if (bodyImageIds && bodyImageIds.length) {
      selected = imgs.filter((i: any) => bodyImageIds.includes(i.id));
    } else {
      selected = imgs.filter((i: any) => i.is_current);
      if (!selected.length) {
        const anchor = new Date(imgs[0].uploaded_at).getTime();
        selected = imgs.filter((i: any) => Math.abs(new Date(i.uploaded_at).getTime() - anchor) <= 10 * 60 * 1000);
      }
      const byType: Record<string, any> = {};
      for (const img of selected) {
        if (!["front", "back", "profile"].includes(img.type)) continue;
        if (!byType[img.type]) byType[img.type] = img;
      }
      selected = Object.values(byType);
    }
    const meta: string[] = [];
    for (const img of selected) {
      let url: string | null = null;
      if (img.storage_path) {
        const { data: signed } = await admin.storage.from("body-images").createSignedUrl(img.storage_path, 60 * 30);
        url = signed?.signedUrl ?? null;
      }
      if (!url && img.image_url) url = img.image_url;
      if (url) {
        imageParts.push({ type: "image_url", image_url: { url } });
        meta.push(`${img.type} · ${new Date(img.uploaded_at).toLocaleString("pt-BR")}`);
      }
    }
    out.body_images_meta = meta;
  }

  return { dossier: out, imageParts };
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
    const ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY")!;
    const SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ANON_KEY;
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY not configured");

    const authed = createClient(SUPABASE_URL, ANON_KEY, { global: { headers: { Authorization: authHeader } } });
    const admin = createClient(SUPABASE_URL, SERVICE_KEY, { auth: { persistSession: false } });

    const { data: userData } = await authed.auth.getUser(authHeader.replace("Bearer ", ""));
    const actorId = userData?.user?.id as string | undefined;
    if (!actorId) return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } });

    const { data: roles } = await admin.from("user_roles").select("role").eq("user_id", actorId);
    const allowed = Array.isArray(roles) && roles.some((r: any) => ["admin", "consultor"].includes(r.role));
    if (!allowed) return new Response(JSON.stringify({ error: "Forbidden" }), { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } });

    const {
      studentId,
      examText = "",
      consultantNotes = "",
      focus = "full",
      save = true,
      bodyImageIds = null,
      extraImagePaths = [],
      extraExamPaths = [],
    } = await req.json();
    if (!studentId) return new Response(JSON.stringify({ error: "studentId required" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });

    const { dossier, imageParts } = await fetchDossier(admin, studentId, bodyImageIds);

    // Extra body/reference images uploaded ad hoc for this analysis (body-images bucket)
    const extraImgMeta: string[] = [];
    for (const p of Array.isArray(extraImagePaths) ? extraImagePaths : []) {
      if (typeof p !== "string" || !p) continue;
      const { data: s } = await admin.storage.from("body-images").createSignedUrl(p, 60 * 30);
      if (s?.signedUrl) {
        imageParts.push({ type: "image_url", image_url: { url: s.signedUrl } });
        extraImgMeta.push(p.split("/").pop() || p);
      }
    }
    if (extraImgMeta.length) (dossier as any).extra_reference_images = extraImgMeta;

    // Lab exam files (PDF or image) uploaded ad hoc — documents bucket
    const examParts: any[] = [];
    const examMeta: string[] = [];
    for (const p of Array.isArray(extraExamPaths) ? extraExamPaths : []) {
      if (typeof p !== "string" || !p) continue;
      try {
        const { data: blob, error: dErr } = await admin.storage.from("documents").download(p);
        if (dErr || !blob) continue;
        const name = p.split("/").pop() || "exame";
        const ext = name.split(".").pop()?.toLowerCase() || "";
        const mime = ext === "pdf" ? "application/pdf"
          : ext === "png" ? "image/png"
          : ext === "webp" ? "image/webp"
          : "image/jpeg";
        const buf = new Uint8Array(await blob.arrayBuffer());
        let bin = "";
        for (let i = 0; i < buf.length; i++) bin += String.fromCharCode(buf[i]);
        const b64 = btoa(bin);
        if (mime.startsWith("image/")) {
          examParts.push({ type: "image_url", image_url: { url: `data:${mime};base64,${b64}` } });
        } else {
          examParts.push({ type: "file", file: { filename: name, file_data: `data:${mime};base64,${b64}` } });
        }
        examMeta.push(`${name} (${mime})`);
      } catch (e) {
        console.warn("exam file load failed", p, e);
      }
    }
    if (examMeta.length) (dossier as any).uploaded_exam_files = examMeta;

    const systemPrompt = `${STHIA_IDENTITY}\n\n${STHIA_LAYERS}\n\n${FORMAT_SPEC}\n\nAplique silenciosamente as 12 camadas durante o raciocínio. Se dados críticos faltarem, sinalize no summary o que precisa ser coletado antes de escalar decisões.`;

    const userText = `FOCO SOLICITADO: ${focus}\n\nDOSSIÊ ATUAL DO ALUNO:\n${JSON.stringify(dossier, null, 2)}\n\nEXAMES / RESULTADOS FORNECIDOS (texto colado ou OCR):\n${examText || "(nenhum texto colado — usar apenas dossiê, imagens e arquivos anexados)"}\n\nOBSERVAÇÕES DO CONSULTOR:\n${consultantNotes || "(nenhuma)"}\n\nARQUIVOS DE EXAMES ANEXADOS: ${examMeta.length ? examMeta.join("; ") : "nenhum"}. Leia (OCR quando necessário) e integre todos os marcadores encontrados na seção 🩸 INTERPRETAÇÃO LABORATORIAL.\n\nIMAGENS DE REFERÊNCIA/EVOLUÇÃO ANEXADAS: ${extraImgMeta.length ? extraImgMeta.join("; ") : "nenhuma além das oficiais do dossiê"}. Use na 📸 COMPOSIÇÃO VISUAL.\n\nGere agora o parecer completo no formato HTML especificado, cruzando exames + composição visual + bioimpedância + protocolo/dieta atuais + histórico. Se não houver dados para uma seção, omita-a explicitando "sem dados suficientes".`;

    const allParts = [...imageParts, ...examParts];
    const userMessage = allParts.length
      ? { role: "user" as const, content: [{ type: "text" as const, text: userText }, ...allParts] }
      : { role: "user" as const, content: userText };

    const tool = {
      type: "function",
      function: {
        name: "return_clinical_analysis",
        description: "Return the full STHIA clinical analysis report",
        parameters: {
          type: "object",
          properties: {
            title: { type: "string" },
            report_html: { type: "string", description: "HTML puro do parecer completo" },
            summary: { type: "string", description: "Resumo executivo em 3-5 linhas" },
            red_flags: { type: "array", items: { type: "string" } },
            recommendations: { type: "array", items: { type: "string" } },
            markers: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  name: { type: "string" },
                  value: { type: "string" },
                  reference: { type: "string" },
                  status: { type: "string", enum: ["ok", "attention", "altered"] },
                  note: { type: "string" },
                },
                required: ["name", "status"],
                additionalProperties: false,
              },
            },
            visual_composition: {
              type: "object",
              properties: {
                bf_estimate_pct: { type: "string" },
                muscle_maturity: { type: "string" },
                asymmetries: { type: "string" },
                water_retention: { type: "string" },
                weak_points: { type: "string" },
              },
              additionalProperties: false,
            },
          },
          required: ["title", "report_html", "summary"],
          additionalProperties: false,
        },
      },
    };

    const aiResp = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${LOVABLE_API_KEY}` },
      body: JSON.stringify({
        model: MODEL_ID,
        messages: [{ role: "system", content: systemPrompt }, userMessage],
        tools: [tool],
        tool_choice: { type: "function", function: { name: "return_clinical_analysis" } },
      }),
    });

    if (!aiResp.ok) {
      const err = await aiResp.text();
      if (aiResp.status === 429) return new Response(JSON.stringify({ error: "Limite de requisições. Tente novamente em instantes." }), { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      if (aiResp.status === 402) return new Response(JSON.stringify({ error: "Créditos IA esgotados. Adicione créditos no Workspace." }), { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      throw new Error(`AI gateway error ${aiResp.status}: ${err}`);
    }

    const aiJson = await aiResp.json();
    const call = aiJson?.choices?.[0]?.message?.tool_calls?.[0];
    const args = call?.function?.arguments ? JSON.parse(call.function.arguments) : null;
    if (!args?.report_html) throw new Error("Resposta STHIA vazia");

    let savedId: string | null = null;
    if (save) {
      const { data: inserted, error: insErr } = await admin.from("student_clinical_analyses").insert({
        user_id: studentId,
        created_by: actorId,
        title: args.title || "Análise STHIA",
        scope: focus,
        brief: { examText, consultantNotes, focus },
        exam_input: examText || null,
        report_html: args.report_html,
        summary: args.summary || null,
        red_flags: args.red_flags ?? [],
        recommendations: args.recommendations ?? [],
        markers: args.markers ?? [],
        visual_composition: args.visual_composition ?? {},
        model: MODEL_ID,
      }).select("id").maybeSingle();
      if (insErr) console.warn("save failed", insErr);
      savedId = inserted?.id ?? null;
    }

    return new Response(JSON.stringify({ ...args, id: savedId, model: MODEL_ID }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err: any) {
    console.error("sthia-clinical-analysis", err);
    return new Response(JSON.stringify({ error: String(err?.message || err) }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});