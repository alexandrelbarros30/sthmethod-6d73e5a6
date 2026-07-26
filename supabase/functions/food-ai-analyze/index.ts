// STH METHOD FOOD AI — analyze a plate photo, a free-text description or a label image.
// Combines Gemini multimodal via Lovable AI Gateway with FatSecret reconciliation.
import { corsHeaders } from 'npm:@supabase/supabase-js@2/cors';
import { createClient } from 'npm:@supabase/supabase-js@2';
import { FOOD_AI_SYSTEM_PROMPT } from '../_shared/food-ai-prompt.ts';

// ============= FatSecret integration (reused pattern from analyze-diet) =============
const FS_CLIENT_ID = Deno.env.get('FATSECRET_CLIENT_ID');
const FS_CLIENT_SECRET = Deno.env.get('FATSECRET_CLIENT_SECRET');
let fsToken: { token: string; exp: number } | null = null;

async function fsGetToken(): Promise<string | null> {
  if (!FS_CLIENT_ID || !FS_CLIENT_SECRET) return null;
  if (fsToken && fsToken.exp > Date.now() + 60_000) return fsToken.token;
  try {
    const basic = btoa(`${FS_CLIENT_ID}:${FS_CLIENT_SECRET}`);
    const res = await fetch('https://oauth.fatsecret.com/connect/token', {
      method: 'POST',
      headers: { Authorization: `Basic ${basic}`, 'Content-Type': 'application/x-www-form-urlencoded' },
      body: 'grant_type=client_credentials&scope=basic',
    });
    const json = await res.json();
    if (!res.ok || !json.access_token) return null;
    fsToken = { token: json.access_token, exp: Date.now() + (json.expires_in ?? 86400) * 1000 };
    return fsToken.token;
  } catch { return null; }
}

function fsParseDescription(desc: string) {
  if (!desc) return null;
  const perMatch = desc.match(/Per\s+([\d.,]+)\s*(g|ml|oz|fl oz|cup|piece|unit|tbsp|tsp|serving)/i);
  let servingSize = 100;
  let servingUnit: 'g' | 'ml' = 'g';
  if (perMatch) {
    servingSize = parseFloat(perMatch[1].replace(',', '.')) || 100;
    const u = perMatch[2].toLowerCase();
    servingUnit = u.includes('ml') || u.includes('fl') ? 'ml' : 'g';
  }
  const num = (re: RegExp) => {
    const r = desc.match(re);
    return r ? parseFloat(r[1].replace(',', '.')) : 0;
  };
  const kcal = num(/Calories:\s*([\d.,]+)\s*kcal/i);
  const fat = num(/Fat:\s*([\d.,]+)\s*g/i);
  const carbs = num(/Carbs:\s*([\d.,]+)\s*g/i);
  const protein = num(/Protein:\s*([\d.,]+)\s*g/i);
  const factor = servingSize > 0 ? 100 / servingSize : 1;
  return {
    per100: {
      energy_kcal: kcal * factor,
      protein_g: protein * factor,
      carbs_g: carbs * factor,
      fat_g: fat * factor,
    },
    serving_unit: servingUnit,
  };
}

const fsCache = new Map<string, any>();
async function fsLookup(name: string) {
  const key = (name || '').trim().toLowerCase();
  if (!key) return null;
  if (fsCache.has(key)) return fsCache.get(key);
  const token = await fsGetToken();
  if (!token) { fsCache.set(key, null); return null; }
  try {
    const params = new URLSearchParams({
      method: 'foods.search', search_expression: key, page_number: '0',
      max_results: '5', format: 'json', region: 'BR', language: 'pt',
    });
    const res = await fetch(`https://platform.fatsecret.com/rest/server.api?${params}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    const json = await res.json();
    if (!res.ok || json.error) { fsCache.set(key, null); return null; }
    const raw = json.foods?.food ? (Array.isArray(json.foods.food) ? json.foods.food : [json.foods.food]) : [];
    const generic = raw.find((f: any) => !f.brand_name) || raw[0];
    if (!generic) { fsCache.set(key, null); return null; }
    const parsed = fsParseDescription(generic.food_description || '');
    if (!parsed) { fsCache.set(key, null); return null; }
    const out = { ...parsed, label: generic.food_name };
    fsCache.set(key, out);
    return out;
  } catch { fsCache.set(key, null); return null; }
}

// ============= AI call =============
type Mode = 'photo' | 'text' | 'label';

interface FoodItem {
  name: string;
  estimated_weight_g: number;
  unit: 'g' | 'ml';
  calories: number;
  protein_g: number;
  carbs_g: number;
  fat_g: number;
  fiber_g: number;
  sodium_mg: number;
  confidence: number;
}

const toolSchema = {
  type: 'function',
  function: {
    name: 'return_food_analysis',
    parameters: {
      type: 'object',
      properties: {
        analysis_type: { type: 'string' },
        confidence: { type: 'number' },
        foods: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              name: { type: 'string' },
              estimated_weight_g: { type: 'number' },
              unit: { type: 'string' },
              calories: { type: 'number' },
              protein_g: { type: 'number' },
              carbs_g: { type: 'number' },
              fat_g: { type: 'number' },
              fiber_g: { type: 'number' },
              sodium_mg: { type: 'number' },
              confidence: { type: 'number' },
            },
            required: ['name', 'estimated_weight_g', 'unit', 'calories', 'protein_g', 'carbs_g', 'fat_g', 'fiber_g', 'sodium_mg', 'confidence'],
          },
        },
        totals: {
          type: 'object',
          properties: {
            calories: { type: 'number' },
            protein_g: { type: 'number' },
            carbs_g: { type: 'number' },
            fat_g: { type: 'number' },
            fiber_g: { type: 'number' },
            sodium_mg: { type: 'number' },
          },
          required: ['calories', 'protein_g', 'carbs_g', 'fat_g', 'fiber_g', 'sodium_mg'],
        },
        quality_score: { type: 'number' },
        classification: { type: 'string' },
        alerts: { type: 'array', items: { type: 'string' } },
        source: { type: 'string' },
        notes: { type: 'string' },
      },
      required: ['analysis_type', 'confidence', 'foods', 'totals', 'quality_score', 'classification', 'alerts', 'source', 'notes'],
    },
  },
};

function buildUserContent(mode: Mode, text?: string, imageDataUrl?: string) {
  const instr = mode === 'photo'
    ? 'Analise a foto do prato/refeição. Identifique cada alimento, estime peso em gramas usando pistas visuais (talheres, prato, copo) e retorne a análise via tool call.'
    : mode === 'label'
      ? 'Analise a foto do rótulo/embalagem. Extraia tabela nutricional, ingredientes e porção. Se possível, identifique marca/produto. Retorne via tool call.'
      : `Analise esta descrição de refeição em pt-BR e retorne via tool call:\n${text || ''}`;
  const content: any[] = [{ type: 'text', text: instr }];
  if (imageDataUrl && (mode === 'photo' || mode === 'label')) {
    content.push({ type: 'image_url', image_url: { url: imageDataUrl } });
  }
  return content;
}

async function callGemini(apiKey: string, mode: Mode, text?: string, imageDataUrl?: string) {
  const res = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
    method: 'POST',
    headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model: 'google/gemini-2.5-flash',
      temperature: 0.2,
      messages: [
        { role: 'system', content: FOOD_AI_SYSTEM_PROMPT },
        { role: 'user', content: buildUserContent(mode, text, imageDataUrl) },
      ],
      tools: [toolSchema],
      tool_choice: { type: 'function', function: { name: 'return_food_analysis' } },
    }),
  });
  if (!res.ok) {
    const body = await res.text();
    throw new Error(`ai_gateway_${res.status}:${body.slice(0, 300)}`);
  }
  const data = await res.json();
  const tc = data.choices?.[0]?.message?.tool_calls?.[0];
  if (!tc) throw new Error('tool_call_missing');
  return JSON.parse(tc.function.arguments);
}

async function reconcileFoods(foods: FoodItem[]): Promise<{ foods: FoodItem[]; reconciledCount: number }> {
  let reconciled = 0;
  const out: FoodItem[] = [];
  for (const f of foods) {
    // Sanity clamp on weight: a single food item rarely exceeds ~1500g.
    // Anything beyond is almost certainly a hallucinated portion estimate.
    const rawWeight = Number(f.estimated_weight_g) || 0;
    const weightSuspect = rawWeight <= 0 || rawWeight > 1500;
    const safeWeight = weightSuspect ? Math.min(Math.max(rawWeight || 100, 1), 300) : rawWeight;

    const hit = await fsLookup(f.name);
    if (hit && rawWeight > 0 && !weightSuspect) {
      const factor = safeWeight / 100;
      // Blend AI confidence with FatSecret trust; never blindly inflate to 0.9.
      const blended = Math.min(0.9, Math.max(0.6, (Number(f.confidence) || 0.5) * 0.5 + 0.45));
      out.push({
        ...f,
        estimated_weight_g: safeWeight,
        calories: +(hit.per100.energy_kcal * factor).toFixed(1),
        protein_g: +(hit.per100.protein_g * factor).toFixed(2),
        carbs_g: +(hit.per100.carbs_g * factor).toFixed(2),
        fat_g: +(hit.per100.fat_g * factor).toFixed(2),
        confidence: blended,
      });
      reconciled++;
    } else {
      // Kcal/g sanity guard: no real food exceeds ~9.5 kcal/g (pure fat).
      const kcalPerG = safeWeight > 0 ? (Number(f.calories) || 0) / safeWeight : 0;
      const kcalSuspect = kcalPerG > 9.5;
      let adj = { ...f, estimated_weight_g: safeWeight };
      if (weightSuspect || kcalSuspect) {
        // Rescale kcal/macros to the clamped weight to prevent absurd totals.
        if (rawWeight > 0) {
          const rescale = safeWeight / rawWeight;
          adj.calories = +(((Number(f.calories) || 0) * rescale)).toFixed(1);
          adj.protein_g = +(((Number(f.protein_g) || 0) * rescale)).toFixed(2);
          adj.carbs_g = +(((Number(f.carbs_g) || 0) * rescale)).toFixed(2);
          adj.fat_g = +(((Number(f.fat_g) || 0) * rescale)).toFixed(2);
        }
        adj.confidence = Math.min(Number(f.confidence) || 0.4, 0.4);
      }
      out.push(adj);
    }
  }
  return { foods: out, reconciledCount: reconciled };
}

function recomputeTotals(foods: FoodItem[]) {
  const t = { calories: 0, protein_g: 0, carbs_g: 0, fat_g: 0, fiber_g: 0, sodium_mg: 0 };
  for (const f of foods) {
    t.calories += f.calories || 0;
    t.protein_g += f.protein_g || 0;
    t.carbs_g += f.carbs_g || 0;
    t.fat_g += f.fat_g || 0;
    t.fiber_g += f.fiber_g || 0;
    t.sodium_mg += f.sodium_mg || 0;
  }
  return {
    calories: +t.calories.toFixed(1),
    protein_g: +t.protein_g.toFixed(2),
    carbs_g: +t.carbs_g.toFixed(2),
    fat_g: +t.fat_g.toFixed(2),
    fiber_g: +t.fiber_g.toFixed(2),
    sodium_mg: +t.sodium_mg.toFixed(1),
  };
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  const started = Date.now();
  const admin = (() => {
    const url = Deno.env.get('SUPABASE_URL');
    const key = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    return url && key ? createClient(url, key) : null;
  })();
  try {
    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) throw new Error('missing_lovable_api_key');

    const body = await req.json().catch(() => ({}));
    const mode: Mode = (body?.mode as Mode) || (body?.image ? 'photo' : 'text');
    const text: string | undefined = typeof body?.text === 'string' ? body.text : undefined;
    const imageBase64: string | undefined = typeof body?.image === 'string' ? body.image : undefined;
    const mime: string = typeof body?.mime === 'string' ? body.mime : 'image/jpeg';
    const auditSource: string = typeof body?.audit_source === 'string' ? body.audit_source : 'edge';
    const studentId: string | null = typeof body?.student_id === 'string' ? body.student_id : null;
    const adminId: string | null = typeof body?.admin_id === 'string' ? body.admin_id : null;

    if (mode !== 'text' && !imageBase64) {
      return new Response(JSON.stringify({ error: 'image required for photo/label mode' }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
    if (mode === 'text' && !text?.trim()) {
      return new Response(JSON.stringify({ error: 'text required for text mode' }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const imageDataUrl = imageBase64
      ? (imageBase64.startsWith('data:') ? imageBase64 : `data:${mime};base64,${imageBase64}`)
      : undefined;

    const aiResult = await callGemini(LOVABLE_API_KEY, mode, text, imageDataUrl);
    const initialFoods: FoodItem[] = Array.isArray(aiResult?.foods) ? aiResult.foods : [];

    const { foods: reconciledFoods, reconciledCount } = await reconcileFoods(initialFoods);
    const totals = recomputeTotals(reconciledFoods);

    const source = reconciledCount === reconciledFoods.length && reconciledFoods.length > 0
      ? 'fatsecret'
      : reconciledCount > 0 ? 'fatsecret+ia' : (aiResult?.source || 'ia_estimativa');

    // Global confidence = min(item confidences) so a single suspect item lowers the whole batch.
    const itemConfs = reconciledFoods.map((f) => Number(f.confidence) || 0);
    const minItemConf = itemConfs.length ? Math.min(...itemConfs) : 0.5;
    const globalConfidence = Math.min(Number(aiResult?.confidence) || 0.7, minItemConf);
    const extraAlerts: string[] = [];
    if (reconciledFoods.some((f) => (Number(f.confidence) || 0) <= 0.4)) extraAlerts.push('peso_suspeito');

    const payload = {
      analysis_type: aiResult?.analysis_type || mode,
      confidence: globalConfidence,
      foods: reconciledFoods,
      totals,
      quality_score: aiResult?.quality_score ?? 6,
      classification: aiResult?.classification || 'Moderado',
      alerts: [...(Array.isArray(aiResult?.alerts) ? aiResult.alerts : []), ...extraAlerts],
      notes: aiResult?.notes || '',
      source,
      reconciled_count: reconciledCount,
      total_count: reconciledFoods.length,
    };

    // Fire-and-forget audit log (never blocks the response).
    if (admin) {
      admin.from('food_ai_logs').insert({
        student_id: studentId,
        admin_id: adminId,
        source: auditSource,
        mode,
        input_text: mode === 'text' ? (text || null) : null,
        input_image_meta: imageBase64 ? { size_b64: imageBase64.length, mime } : null,
        confidence: payload.confidence,
        quality_score: payload.quality_score,
        classification: payload.classification,
        foods: payload.foods as any,
        totals: payload.totals as any,
        alerts: payload.alerts as any,
        notes: payload.notes,
        ai_source: payload.source,
        reconciled_count: payload.reconciled_count,
        total_count: payload.total_count,
        status: 'analyzed',
        needs_review: payload.confidence < 0.7,
        duration_ms: Date.now() - started,
      }).then(({ error }) => { if (error) console.error('food_ai_logs edge insert', error); });
    }

    return new Response(JSON.stringify(payload), { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  } catch (err) {
    console.error('food-ai-analyze error', err);
    const msg = err instanceof Error ? err.message : String(err);
    const isRate = msg.includes('ai_gateway_429');
    const isCredit = msg.includes('ai_gateway_402');
    if (admin) {
      admin.from('food_ai_logs').insert({
        source: 'edge',
        mode: 'text',
        status: 'error',
        error_code: isRate ? 'STH-429' : isCredit ? 'STH-402' : 'STH-500',
        error_details: String(msg).slice(0, 2000),
        duration_ms: Date.now() - started,
      }).then(({ error }) => { if (error) console.error('food_ai_logs error insert', error); });
    }
    return new Response(JSON.stringify({
      error: isRate ? 'rate_limited' : isCredit ? 'credits_exhausted' : 'analysis_failed',
      details: msg,
      code: isRate ? 'STH-429' : isCredit ? 'STH-402' : 'STH-500',
    }), {
      status: isRate ? 429 : isCredit ? 402 : 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
