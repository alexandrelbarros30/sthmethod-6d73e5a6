// Sugere uma regra treinada (label, keywords, reply) a partir de um arquivo
// JPG/PNG/PDF enviado pelo admin, usando Gemini Vision.

import { corsHeaders } from 'npm:@supabase/supabase-js@2/cors';

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  try {
    const { fileUrl, mimeType, hint } = await req.json();
    if (!fileUrl || !mimeType) {
      return new Response(JSON.stringify({ error: 'fileUrl e mimeType são obrigatórios' }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const fileRes = await fetch(fileUrl);
    if (!fileRes.ok) throw new Error(`Falha ao baixar arquivo (${fileRes.status})`);
    const buf = new Uint8Array(await fileRes.arrayBuffer());
    let b64 = '';
    const CHUNK = 0x8000;
    for (let i = 0; i < buf.length; i += CHUNK) {
      b64 += String.fromCharCode(...buf.subarray(i, i + CHUNK));
    }
    b64 = btoa(b64);

    const apiKey = Deno.env.get('GEMINI_API_KEY') || Deno.env.get('GEMINI_API_KEY_FALLBACK');
    if (!apiKey) throw new Error('GEMINI_API_KEY ausente');

    const prompt = `Você é assistente da STH METHOD. Analise o arquivo (imagem ou PDF) e gere UMA regra de atendimento para o chat robô da STH METHOD em JSON estrito (sem markdown, sem comentários):

{
  "label": "slug_minusculo_underscore",
  "keywords": ["3 a 8 palavras-chave em minúsculas, sem acento"],
  "reply": "Resposta pronta no estilo WhatsApp, curta, humana, em português brasileiro. Pode usar *negrito* e quebras de linha. Use {nome} se fizer sentido."
}

${hint ? `Contexto adicional fornecido pelo admin: ${hint}` : ''}

Foque no que está visível no arquivo. Se for tabela de preço, gere a regra de planos/valores. Se for imagem de protocolo, gere a regra do protocolo. Se for ficha, gere instruções de uso. Responda APENAS o JSON.`;

    const body = {
      contents: [{
        role: 'user',
        parts: [
          { text: prompt },
          { inline_data: { mime_type: mimeType, data: b64 } },
        ],
      }],
      generationConfig: { temperature: 0.3, maxOutputTokens: 800, responseMimeType: 'application/json' },
    };

    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-flash-latest:generateContent?key=${encodeURIComponent(apiKey)}`;
    const r = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    const txt = await r.text();
    if (!r.ok) throw new Error(`Gemini ${r.status}: ${txt.slice(0, 200)}`);
    const data = JSON.parse(txt);
    const raw = data?.candidates?.[0]?.content?.parts?.map((p: any) => p?.text || '').join('').trim() || '';
    let parsed: any;
    try {
      parsed = JSON.parse(raw);
    } catch {
      const m = raw.match(/\{[\s\S]*\}/);
      parsed = m ? JSON.parse(m[0]) : null;
    }
    if (!parsed?.label || !parsed?.reply) throw new Error('Resposta da IA inválida');

    return new Response(JSON.stringify({
      label: String(parsed.label).toLowerCase().replace(/[^a-z0-9_]/g, '_').slice(0, 60),
      keywords: Array.isArray(parsed.keywords) ? parsed.keywords.map((k: any) => String(k).toLowerCase()).slice(0, 12) : [],
      reply: String(parsed.reply),
    }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  } catch (e) {
    console.error('[ai-suggest-rule]', e);
    return new Response(JSON.stringify({ error: (e as Error).message }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});