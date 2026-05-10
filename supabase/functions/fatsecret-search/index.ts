import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const CLIENT_ID = Deno.env.get('FATSECRET_CLIENT_ID');
const CLIENT_SECRET = Deno.env.get('FATSECRET_CLIENT_SECRET');

let cachedToken: { token: string; exp: number } | null = null;

async function getToken(): Promise<string> {
  if (cachedToken && cachedToken.exp > Date.now() + 60_000) return cachedToken.token;
  const basic = btoa(`${CLIENT_ID}:${CLIENT_SECRET}`);
  const res = await fetch('https://oauth.fatsecret.com/connect/token', {
    method: 'POST',
    headers: {
      'Authorization': `Basic ${basic}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: 'grant_type=client_credentials&scope=basic',
  });
  const json = await res.json();
  if (!res.ok || !json.access_token) {
    throw new Error(`FatSecret OAuth failed [${res.status}]: ${JSON.stringify(json)}`);
  }
  cachedToken = { token: json.access_token, exp: Date.now() + (json.expires_in ?? 86400) * 1000 };
  return cachedToken.token;
}

// Parse FatSecret food description string:
// "Per 100g - Calories: 89kcal | Fat: 0.33g | Carbs: 22.84g | Protein: 1.09g"
function parseDescription(desc: string) {
  if (!desc) return null;
  const result: any = { kcal: 0, protein: 0, carbs: 0, fat: 0, servingSize: 100, servingUnit: 'g' };
  const perMatch = desc.match(/Per\s+([\d.,]+)\s*(g|ml|oz|fl oz|cup|piece|unit|tbsp|tsp|serving)/i);
  if (perMatch) {
    result.servingSize = parseFloat(perMatch[1].replace(',', '.')) || 100;
    const u = perMatch[2].toLowerCase();
    result.servingUnit = u.includes('ml') || u.includes('fl') ? 'ml' : 'g';
  }
  const m = (re: RegExp) => {
    const r = desc.match(re);
    return r ? parseFloat(r[1].replace(',', '.')) : 0;
  };
  result.kcal = m(/Calories:\s*([\d.,]+)\s*kcal/i);
  result.fat = m(/Fat:\s*([\d.,]+)\s*g/i);
  result.carbs = m(/Carbs:\s*([\d.,]+)\s*g/i);
  result.protein = m(/Protein:\s*([\d.,]+)\s*g/i);
  // Normalize to per-100g/ml
  const factor = result.servingSize > 0 ? 100 / result.servingSize : 1;
  return {
    energy_kcal: +(result.kcal * factor).toFixed(1),
    protein_g: +(result.protein * factor).toFixed(2),
    carbs_g: +(result.carbs * factor).toFixed(2),
    fat_g: +(result.fat * factor).toFixed(2),
    serving_unit: result.servingUnit,
  };
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  try {
    if (!CLIENT_ID || !CLIENT_SECRET) {
      throw new Error('FatSecret credentials not configured');
    }
    const { query, page = 0, maxResults = 30 } = await req.json();
    if (!query || typeof query !== 'string' || query.trim().length < 2) {
      return new Response(JSON.stringify({ foods: [] }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const token = await getToken();
    const params = new URLSearchParams({
      method: 'foods.search',
      search_expression: query.trim(),
      page_number: String(page),
      max_results: String(Math.min(maxResults, 50)),
      format: 'json',
      region: 'BR',
      language: 'pt',
    });

    const res = await fetch(`https://platform.fatsecret.com/rest/server.api?${params}`, {
      headers: { 'Authorization': `Bearer ${token}` },
    });
    const json = await res.json();
    if (!res.ok) {
      throw new Error(`FatSecret search failed [${res.status}]: ${JSON.stringify(json)}`);
    }
    if (json.error) {
      throw new Error(`FatSecret error: ${JSON.stringify(json.error)}`);
    }

    const rawFoods = json.foods?.food
      ? Array.isArray(json.foods.food) ? json.foods.food : [json.foods.food]
      : [];

    const foods = rawFoods
      .map((f: any) => {
        const macros = parseDescription(f.food_description || '');
        if (!macros) return null;
        const brand = f.brand_name ? ` (${f.brand_name})` : '';
        return {
          id: `fs_${f.food_id}`,
          fatsecret_id: f.food_id,
          name: `${f.food_name}${brand}`,
          source: 'FatSecret',
          category: f.food_type || 'Outros',
          serving_unit: macros.serving_unit,
          energy_kcal: macros.energy_kcal,
          protein_g: macros.protein_g,
          carbs_g: macros.carbs_g,
          fat_g: macros.fat_g,
          fiber_g: 0,
          sugar_g: 0,
          sodium_mg: 0,
          cholesterol_mg: 0,
        };
      })
      .filter(Boolean);

    return new Response(JSON.stringify({ foods }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    console.error('fatsecret-search error:', message);
    return new Response(JSON.stringify({ foods: [], error: message }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});