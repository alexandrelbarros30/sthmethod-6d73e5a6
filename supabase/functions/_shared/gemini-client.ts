// Cliente Gemini (Google AI Studio) com fallback automático.
// Usa GEMINI_API_KEY como principal e GEMINI_API_KEY_FALLBACK como backup.
// Em caso de 429/quota/timeout/5xx na chave principal, tenta a chave fallback.

export type GeminiMsg = { role: 'user' | 'model'; text: string };

export type GeminiCallOptions = {
  systemPrompt: string;
  history: GeminiMsg[];
  userText: string;
  model?: string;
  fallbackModel?: string;
  temperature?: number;
  maxTokens?: number;
  timeoutMs?: number;
};

export type GeminiCallResult = {
  ok: boolean;
  reply: string;
  usedFallback: boolean;
  status: 'online' | 'fallback' | 'offline';
  error?: string;
  model?: string;
};

const OFFLINE_MSG =
  'Estou com instabilidade temporária no atendimento inteligente. Nossa equipe dará continuidade assim que possível.';

async function callGemini(
  apiKey: string,
  model: string,
  body: unknown,
  timeoutMs: number,
): Promise<{ ok: boolean; status: number; text: string; data?: any }> {
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(
    model,
  )}:generateContent?key=${encodeURIComponent(apiKey)}`;
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), timeoutMs);
  try {
    const r = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
      signal: ctrl.signal,
    });
    const text = await r.text();
    let data: any = undefined;
    try { data = JSON.parse(text); } catch { /* keep raw */ }
    return { ok: r.ok, status: r.status, text, data };
  } catch (e) {
    return { ok: false, status: 0, text: `network_error: ${String((e as Error)?.message || e)}` };
  } finally {
    clearTimeout(t);
  }
}

function shouldFallback(status: number, text: string): boolean {
  if (status === 0) return true; // timeout / network
  if (status === 429) return true;
  if (status >= 500) return true;
  const low = (text || '').toLowerCase();
  return /quota|rate|exhausted|unavailable|timeout|deadline/.test(low);
}

function extractReply(data: any): string {
  const parts = data?.candidates?.[0]?.content?.parts;
  if (!Array.isArray(parts)) return '';
  return parts.map((p: any) => p?.text || '').join('').trim();
}

export async function callGeminiWithFallback(opts: GeminiCallOptions): Promise<GeminiCallResult> {
  const primary = Deno.env.get('GEMINI_API_KEY') || '';
  const fallback = Deno.env.get('GEMINI_API_KEY_FALLBACK') || '';
  if (!primary && !fallback) {
    return { ok: false, reply: OFFLINE_MSG, usedFallback: false, status: 'offline', error: 'no_keys' };
  }

  const model = opts.model || 'gemini-1.5-flash';
  const fbModel = opts.fallbackModel || 'gemini-1.5-flash-8b';
  const timeoutMs = opts.timeoutMs ?? 20000;

  const contents = [
    ...opts.history.map((m) => ({ role: m.role, parts: [{ text: m.text }] })),
    { role: 'user' as const, parts: [{ text: opts.userText }] },
  ];

  const body = {
    systemInstruction: { role: 'system', parts: [{ text: opts.systemPrompt }] },
    contents,
    generationConfig: {
      temperature: opts.temperature ?? 0.4,
      maxOutputTokens: opts.maxTokens ?? 600,
    },
    safetySettings: [
      { category: 'HARM_CATEGORY_HARASSMENT', threshold: 'BLOCK_ONLY_HIGH' },
      { category: 'HARM_CATEGORY_HATE_SPEECH', threshold: 'BLOCK_ONLY_HIGH' },
      { category: 'HARM_CATEGORY_SEXUALLY_EXPLICIT', threshold: 'BLOCK_ONLY_HIGH' },
      { category: 'HARM_CATEGORY_DANGEROUS_CONTENT', threshold: 'BLOCK_ONLY_HIGH' },
    ],
  };

  // 1) tentativa primária
  if (primary) {
    const r = await callGemini(primary, model, body, timeoutMs);
    if (r.ok) {
      const reply = extractReply(r.data);
      if (reply) return { ok: true, reply, usedFallback: false, status: 'online', model };
    }
    if (!shouldFallback(r.status, r.text) && primary && !fallback) {
      return { ok: false, reply: OFFLINE_MSG, usedFallback: false, status: 'offline', error: `primary_${r.status}` };
    }
    console.warn('[gemini] primary failed', r.status, r.text?.slice(0, 200));
  }

  // 2) fallback
  if (fallback) {
    const r2 = await callGemini(fallback, fbModel, body, timeoutMs);
    if (r2.ok) {
      const reply = extractReply(r2.data);
      if (reply) return { ok: true, reply, usedFallback: true, status: 'fallback', model: fbModel };
    }
    console.warn('[gemini] fallback failed', r2.status, r2.text?.slice(0, 200));
    return { ok: false, reply: OFFLINE_MSG, usedFallback: true, status: 'offline', error: `fallback_${r2.status}` };
  }

  return { ok: false, reply: OFFLINE_MSG, usedFallback: false, status: 'offline', error: 'no_fallback' };
}