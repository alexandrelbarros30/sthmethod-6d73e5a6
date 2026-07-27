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
  let unitIsMass = false; // only g/ml are safe for per-100 scaling
  if (perMatch) {
    servingSize = parseFloat(perMatch[1].replace(',', '.')) || 100;
    const u = perMatch[2].toLowerCase();
    servingUnit = u.includes('ml') || u.includes('fl') ? 'ml' : 'g';
    unitIsMass = /^(g|ml|fl\s*oz)$/i.test(u.trim()) || u === 'g' || u === 'ml';
  }
  const num = (re: RegExp) => {
    const r = desc.match(re);
    return r ? parseFloat(r[1].replace(',', '.')) : 0;
  };
  const kcal = num(/Calories:\s*([\d.,]+)\s*kcal/i);
  const fat = num(/Fat:\s*([\d.,]+)\s*g/i);
  const carbs = num(/Carbs:\s*([\d.,]+)\s*g/i);
  const protein = num(/Protein:\s*([\d.,]+)\s*g/i);
  // Guard: if the serving unit is not g/ml (cup, piece, serving, tbsp, oz, tsp...),
  // we cannot safely convert to per-100g — different portions have unpredictable weights.
  // Example bug: "Per 1 cup - Calories: 15 kcal" would scale to 1500 kcal/100g. Reject.
  if (!unitIsMass) return null;
  // Guard: absurd serving sizes (e.g. "Per 0.1 serving") would blow up the factor.
  if (servingSize < 5) return null;
  const factor = servingSize > 0 ? 100 / servingSize : 1;
  const per100 = {
    energy_kcal: kcal * factor,
    protein_g: protein * factor,
    carbs_g: carbs * factor,
    fat_g: fat * factor,
  };
  // Sanity ceiling: no real food exceeds ~900 kcal/100g (pure fat = 884).
  // Anything above indicates a parse/unit mismatch and MUST be rejected.
  if (per100.energy_kcal > 900 || per100.protein_g > 100 || per100.carbs_g > 100 || per100.fat_g > 100) {
    return null;
  }
  return { per100, serving_unit: servingUnit };
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
    if (!raw.length) { fsCache.set(key, null); return null; }
    // Token-overlap guard: só aceita candidatos cujo food_name compartilhe
    // pelo menos um token significativo (>=3 chars) com o nome buscado.
    // Evita casos onde "Nescau Protein" casa em item genérico ("Chocolate drink")
    // e escala calorias absurdas.
    const normalize = (s: string) => (s || '')
      .toLowerCase()
      .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9\s]/g, ' ');
    const searchTokens = new Set(normalize(key).split(/\s+/).filter((t) => t.length >= 3));
    const scored = raw.map((c: any) => {
      const nameTokens = new Set(normalize(c.food_name || '').split(/\s+/).filter((t) => t.length >= 3));
      let overlap = 0;
      for (const t of searchTokens) if (nameTokens.has(t)) overlap++;
      // Prefere match com marca quando o usuário citou marca; senão prefere genérico.
      const brandBonus = c.brand_name ? 0.1 : 0;
      return { c, score: overlap + brandBonus };
    }).filter((x: any) => x.score > 0)
      .sort((a: any, b: any) => b.score - a.score);
    const picked = scored[0]?.c;
    if (!picked) { fsCache.set(key, null); return null; }
    const parsed = fsParseDescription(picked.food_description || '');
    if (!parsed) { fsCache.set(key, null); return null; }
    // Sanity: rejeita per100 fora do envelope físico de bebidas quando o
    // nome buscado sugere líquido (ml, bebida, leite, suco, refri, whey pronto, shake).
    const looksLiquid = /\b(bebida|leite|suco|refri|refrigerante|shake|iogurte liquido|whey (?:ready|pronto)|ml|drink)\b/i.test(key);
    if (looksLiquid && parsed.per100.energy_kcal > 200) {
      // Bebidas raramente passam de 200 kcal/100ml (leite condensado ~320, é exceção).
      // Descarta para forçar cálculo por caps físicos + Atwater.
      fsCache.set(key, null);
      return null;
    }
    const out = { ...parsed, label: picked.food_name };
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
  nutrition_basis?: 'per_100g' | 'per_100ml' | 'per_serving' | 'per_package' | 'per_unit' | 'unknown';
  serving_size_declared?: number;
  servings_per_package?: number;
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
              nutrition_basis: { type: 'string', description: 'per_100g | per_100ml | per_serving | per_package | per_unit | unknown' },
              serving_size_declared: { type: 'number', description: 'Porção lida no rótulo em g/ml; 0 se desconhecido' },
              servings_per_package: { type: 'number', description: 'Porções por embalagem; 0 se desconhecido' },
              nova_group: { type: 'number', description: '1..4 NOVA; 0 se desconhecido' },
              micronutrients: {
                type: 'object',
                description: 'Micronutrientes por item quando disponíveis (unidades no nome do campo).',
                properties: {
                  calcio_mg: { type: 'number' }, ferro_mg: { type: 'number' }, magnesio_mg: { type: 'number' },
                  potassio_mg: { type: 'number' }, zinco_mg: { type: 'number' }, selenio_mcg: { type: 'number' },
                  iodo_mcg: { type: 'number' }, vitamina_a_mcg: { type: 'number' }, vitamina_c_mg: { type: 'number' },
                  vitamina_d_mcg: { type: 'number' }, vitamina_e_mg: { type: 'number' }, vitamina_k_mcg: { type: 'number' },
                  vitamina_b1_mg: { type: 'number' }, vitamina_b2_mg: { type: 'number' }, vitamina_b3_mg: { type: 'number' },
                  vitamina_b6_mg: { type: 'number' }, vitamina_b9_mcg: { type: 'number' }, vitamina_b12_mcg: { type: 'number' },
                  colina_mg: { type: 'number' }, omega3_g: { type: 'number' }, colesterol_mg: { type: 'number' },
                  acucar_g: { type: 'number' }, acucar_adicionado_g: { type: 'number' },
                  gordura_saturada_g: { type: 'number' }, gordura_trans_g: { type: 'number' },
                },
              },
            },
            required: ['name', 'estimated_weight_g', 'unit', 'calories', 'protein_g', 'carbs_g', 'fat_g', 'fiber_g', 'sodium_mg', 'confidence', 'nutrition_basis', 'serving_size_declared', 'servings_per_package'],
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
        sthia_score: { type: 'number', description: '0..100' },
        sthia_score_label: { type: 'string', description: 'Excelente | Boa | Moderada | Necessita melhorias' },
        nova_summary: { type: 'number', description: '0..4 (0 desconhecido)' },
        suggestions: { type: 'array', items: { type: 'string' } },
        objective_fit: { type: 'string', description: 'aligned | neutral | misaligned | unknown' },
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

interface Correction {
  item: string;
  rule: 'weight_clamp' | 'kcal_per_g_clamp' | 'atwater_rewrite' | 'atwater_fill' | 'hard_ceiling' | 'db_reconcile' | 'basis_unknown';
  field: 'calories' | 'weight' | 'macros';
  before: number;
  after: number;
  note?: string;
}

async function reconcileFoods(foods: FoodItem[]): Promise<{ foods: FoodItem[]; reconciledCount: number; corrections: Correction[] }> {
  let reconciled = 0;
  const out: FoodItem[] = [];
  const corrections: Correction[] = [];
  for (const f of foods) {
    // Sanity clamp on weight: a single food item rarely exceeds ~1500g.
    // Anything beyond is almost certainly a hallucinated portion estimate.
    const rawWeight = Number(f.estimated_weight_g) || 0;
    const weightSuspect = rawWeight <= 0 || rawWeight > 1500;
    const safeWeight = weightSuspect ? Math.min(Math.max(rawWeight || 100, 1), 300) : rawWeight;
    if (weightSuspect) {
      corrections.push({ item: f.name, rule: 'weight_clamp', field: 'weight', before: rawWeight, after: safeWeight, note: 'peso fora do intervalo plausível (0-1500 g)' });
    }

    const hit = await fsLookup(f.name);
    if (hit && rawWeight > 0 && !weightSuspect) {
      const factor = safeWeight / 100;
      // Blend AI confidence with FatSecret trust; never blindly inflate to 0.9.
      const blended = Math.min(0.9, Math.max(0.6, (Number(f.confidence) || 0.5) * 0.5 + 0.45));
      const rewritten = {
        ...f,
        estimated_weight_g: safeWeight,
        calories: +(hit.per100.energy_kcal * factor).toFixed(1),
        protein_g: +(hit.per100.protein_g * factor).toFixed(2),
        carbs_g: +(hit.per100.carbs_g * factor).toFixed(2),
        fat_g: +(hit.per100.fat_g * factor).toFixed(2),
        confidence: blended,
      };
      // Sanity check ANTES de aceitar o rewrite:
      // 1) cap físico kcal/g ou kcal/ml (líquido não passa de 2.0 kcal/ml).
      // 2) Atwater precisa bater com o kcal calculado (±25%).
      // 3) delta absoluto vs. o que a IA já tinha: se >100% e IA estava plausível,
      //    descarta o hit (provável mismatch nome↔item FS).
      const isLiquid = String(rewritten.unit || '').toLowerCase() === 'ml';
      const perUnitCap = isLiquid ? 2.0 : 9.5;
      const kcalPerUnit = safeWeight > 0 ? rewritten.calories / safeWeight : 0;
      const atwater = rewritten.protein_g * 4 + rewritten.carbs_g * 4 + rewritten.fat_g * 9;
      const atwaterOk = atwater > 5
        ? Math.abs(rewritten.calories - atwater) / Math.max(atwater, 1) <= 0.25
        : true;
      const aiKcal = Number(f.calories) || 0;
      const aiKcalPerUnit = safeWeight > 0 ? aiKcal / safeWeight : 0;
      const aiPlausible = aiKcal > 0 && aiKcalPerUnit <= perUnitCap;
      const rewriteExplodesKcal = aiPlausible && rewritten.calories > aiKcal * 2.5;
      const dbLooksWrong = kcalPerUnit > perUnitCap || !atwaterOk || rewriteExplodesKcal;

      if (dbLooksWrong) {
        // Rejeita o rewrite: cai no ramo de heurística (caps físicos + Atwater).
        corrections.push({
          item: f.name,
          rule: 'db_reconcile',
          field: 'calories',
          before: aiKcal,
          after: aiKcal,
          note: `hit da base descartado (kcal/${isLiquid ? 'ml' : 'g'}=${kcalPerUnit.toFixed(2)}, atwaterOk=${atwaterOk}, explodesKcal=${rewriteExplodesKcal})`,
        });
        // Deixa o fluxo cair no else — reprocessa via caps físicos abaixo.
      } else {
        if (Math.abs(aiKcal - rewritten.calories) > 5) {
          corrections.push({ item: f.name, rule: 'db_reconcile', field: 'calories', before: aiKcal, after: rewritten.calories, note: 'sobrescrito pela base de dados nutricional' });
        }
        out.push(rewritten);
        reconciled++;
        continue;
      }
    } else {
      // Kcal/g sanity guard: no real food exceeds ~9.5 kcal/g (pure fat).
      // Beverages (unit=ml) are much lower: milk-based drinks ~0.4-1.0 kcal/ml,
      // sugary sodas ~0.5 kcal/ml. Cap at 2.0 kcal/ml — anything above is a
      // label-reading hallucination (e.g. Nescau 250ml lida como 1003 kcal).
    }
    {
      const isLiquid = String(f.unit || '').toLowerCase() === 'ml';
      const perUnitCap = isLiquid ? 2.0 : 9.5;
      const kcalPerG = safeWeight > 0 ? (Number(f.calories) || 0) / safeWeight : 0;
      const kcalSuspect = kcalPerG > perUnitCap;
      let adj = { ...f, estimated_weight_g: safeWeight };
      if (weightSuspect || kcalSuspect) {
        const beforeKcal = Number(f.calories) || 0;
        // Two-stage rescale:
        //  a) if weight was clamped, scale kcal/macros by the weight change;
        //  b) if kcal/unit still exceeds the physical cap for the food state
        //     (solid vs liquid), scale kcal AND all macros down proportionally
        //     so Atwater keeps balancing after the correction.
        if (rawWeight > 0 && weightSuspect) {
          const rescale = safeWeight / rawWeight;
          adj.calories = +(((Number(f.calories) || 0) * rescale)).toFixed(1);
          adj.protein_g = +(((Number(f.protein_g) || 0) * rescale)).toFixed(2);
          adj.carbs_g = +(((Number(f.carbs_g) || 0) * rescale)).toFixed(2);
          adj.fat_g = +(((Number(f.fat_g) || 0) * rescale)).toFixed(2);
        }
        const currKcal = Number(adj.calories) || 0;
        const currPerUnit = safeWeight > 0 ? currKcal / safeWeight : 0;
        if (currPerUnit > perUnitCap && safeWeight > 0) {
          const target = perUnitCap * safeWeight;
          const factor = currKcal > 0 ? target / currKcal : 0;
          adj.calories = +target.toFixed(1);
          adj.protein_g = +(((Number(adj.protein_g) || 0) * factor)).toFixed(2);
          adj.carbs_g = +(((Number(adj.carbs_g) || 0) * factor)).toFixed(2);
          adj.fat_g = +(((Number(adj.fat_g) || 0) * factor)).toFixed(2);
        }
        adj.confidence = Math.min(Number(f.confidence) || 0.4, 0.4);
        if (kcalSuspect) {
          corrections.push({ item: f.name, rule: 'kcal_per_g_clamp', field: 'calories', before: beforeKcal, after: adj.calories, note: `${isLiquid ? 'kcal/ml' : 'kcal/g'} > ${perUnitCap} (${kcalPerG.toFixed(2)})` });
        }
      }
      // Atwater cross-check: expected kcal = P*4 + C*4 + F*9. If the AI-declared
      // kcal deviates >25% from Atwater, trust the macros and rewrite kcal.
      // This catches classic label bugs (e.g. per-package total shown as per-serving)
      // that produced things like a 1000 kcal reading for a single serving.
      const atwater = (Number(adj.protein_g) || 0) * 4 + (Number(adj.carbs_g) || 0) * 4 + (Number(adj.fat_g) || 0) * 9;
      const declared = Number(adj.calories) || 0;
      if (atwater > 5 && declared > 0) {
        const ratio = declared / atwater;
        if (ratio > 1.25 || ratio < 0.75) {
          const before = declared;
          adj.calories = +atwater.toFixed(1);
          adj.confidence = Math.min(Number(adj.confidence) || 0.5, 0.5);
          corrections.push({ item: f.name, rule: 'atwater_rewrite', field: 'calories', before, after: adj.calories, note: `Atwater divergiu ${(((ratio-1))*100).toFixed(0)}% do declarado` });
        }
      } else if (atwater > 5 && declared === 0) {
        adj.calories = +atwater.toFixed(1);
        corrections.push({ item: f.name, rule: 'atwater_fill', field: 'calories', before: 0, after: adj.calories, note: 'kcal ausente, calculado via Atwater' });
      }
      // Hard ceiling per single item: cannot exceed weight * 9 kcal/g (pure fat).
      if (safeWeight > 0 && adj.calories > safeWeight * 9) {
        const before = adj.calories;
        adj.calories = +(safeWeight * 9).toFixed(1);
        adj.confidence = Math.min(Number(adj.confidence) || 0.4, 0.4);
        corrections.push({ item: f.name, rule: 'hard_ceiling', field: 'calories', before, after: adj.calories, note: 'kcal > peso*9 (teto físico)' });
      }
      out.push(adj);
    }
  }
  return { foods: out, reconciledCount: reconciled, corrections };
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
    const skipServerLog: boolean = body?.skip_server_log === true;

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

    const { foods: reconciledFoods, reconciledCount, corrections } = await reconcileFoods(initialFoods);
    const totals = recomputeTotals(reconciledFoods);

    // Internal audit tag only — never surfaced to end users.
    const source = reconciledCount === reconciledFoods.length && reconciledFoods.length > 0
      ? 'sthia_db'
      : reconciledCount > 0 ? 'sthia_hibrido' : 'sthia_visao';

    // Global confidence = min(item confidences) so a single suspect item lowers the whole batch.
    const itemConfs = reconciledFoods.map((f) => Number(f.confidence) || 0);
    const minItemConf = itemConfs.length ? Math.min(...itemConfs) : 0.5;
    const globalConfidence = Math.min(Number(aiResult?.confidence) || 0.7, minItemConf);
    const extraAlerts: string[] = [];
    if (reconciledFoods.some((f) => (Number(f.confidence) || 0) <= 0.4)) extraAlerts.push('peso_suspeito');

    // Second-evidence gate: any severe correction (>50% delta on kcal) or a hard
    // ceiling / atwater rewrite on LABEL mode means we can't safely conclude
    // from a single frame — ask for a second photo of the nutrition panel/portion.
    const severe = corrections.filter((c) => {
      if (c.field !== 'calories') return false;
      const b = Math.abs(c.before);
      const a = Math.abs(c.after);
      const base = Math.max(b, a, 1);
      return Math.abs(b - a) / base > 0.5;
    });
    const labelHardTrigger = mode === 'label' && corrections.some((c) => c.rule === 'atwater_rewrite' || c.rule === 'hard_ceiling');
    // Ambiguous-basis gate: se em modo label/photo a IA declarou nutrition_basis='unknown'
    // (ou não declarou), NÃO podemos concluir com segurança — pedimos segunda foto e
    // registramos a correção para auditoria, sem manter kcal potencialmente escalados errado.
    // Basis ambiguity só é bloqueante quando a IA de fato tentou LER um rótulo
    // (analysis_type === 'label'). Em fotos de prato (mode='photo' + analysis_type='meal_photo'),
    // o peso vem da estimativa visual e o kcal é reconciliado via FS/TACO — não faz sentido
    // exigir "base da tabela nutricional" nesse caso. Também aceitamos per_unit como base válida.
    const aiTypeLabel = String(aiResult?.analysis_type || '').toLowerCase() === 'label';
    const gateActive = mode === 'label' || (mode === 'photo' && aiTypeLabel);
    const ambiguousBasisItems = reconciledFoods.filter((f) => {
      const nb = String((f as any).nutrition_basis || '').toLowerCase();
      return !nb || nb === 'unknown';
    });
    if (gateActive && ambiguousBasisItems.length > 0) {
      for (const f of ambiguousBasisItems) {
        corrections.push({
          item: f.name,
          rule: 'basis_unknown',
          field: 'calories',
          before: Number(f.calories) || 0,
          after: Number(f.calories) || 0,
          note: 'IA não declarou a base da tabela nutricional (per_100g/per_serving/etc). Escala bloqueada.',
        });
        // Colapsa confiança do item ambíguo — a UI já esconde recomendações abaixo de 0.4
        (f as any).confidence = Math.min(Number(f.confidence) || 0.3, 0.3);
      }
      extraAlerts.push('base_nutricional_ambigua');
    }
    const basisAmbiguous = gateActive && ambiguousBasisItems.length > 0;
    const needsSecondEvidence = severe.length > 0 || labelHardTrigger || basisAmbiguous;
    let secondEvidenceReason: string | null = null;
    if (needsSecondEvidence) {
      if (basisAmbiguous && mode === 'label') {
        secondEvidenceReason = 'Não foi possível identificar se a tabela nutricional está expressa por 100 g/ml ou por porção. Envie uma segunda foto nítida mostrando o cabeçalho da tabela (ex: "Porção de 200 ml" ou "Valores por 100 g") e a lateral da embalagem.';
      } else if (basisAmbiguous) {
        secondEvidenceReason = 'Preciso de mais contexto para dimensionar a porção com segurança. Envie uma segunda foto com um referencial (talher, mão, embalagem ao lado).';
      } else if (mode === 'label') {
        secondEvidenceReason = 'Divergência entre kcal declarado e kcal calculado pelos macros. Envie uma segunda foto nítida do painel nutricional e da porção indicada para confirmar.';
      } else {
        secondEvidenceReason = 'Não foi possível estimar com segurança. Envie uma segunda foto com mais luz, focada no prato inteiro e, se possível, um referencial de tamanho (talher, mão).';
      }
      extraAlerts.push('segunda_evidencia_requerida');
    }

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
      corrections,
      needs_second_evidence: needsSecondEvidence,
      second_evidence_reason: secondEvidenceReason,
      status: needsSecondEvidence ? 'pending_second_evidence' : 'analyzed',
    };

    // Fire-and-forget audit log (never blocks the response).
    if (admin && !skipServerLog) {
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
        status: payload.status,
        needs_review: payload.confidence < 0.7 || needsSecondEvidence,
        corrections: corrections as any,
        needs_second_evidence: needsSecondEvidence,
        second_evidence_reason: secondEvidenceReason,
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
