// STH FOOD AI — audio transcription (Lovable AI Gateway).
// Recebe áudio em base64 (webm/mp4/wav/ogg) e devolve texto puro.
// Usado pelo Diário Alimentar (aba Áudio) e como fallback do canal
// Sucesso do Aluno quando o áudio não é encaminhado direto pelo WhatsApp.
import { corsHeaders } from 'npm:@supabase/supabase-js@2/cors';

function extFromMime(mime: string): string {
  const m = String(mime || '').toLowerCase();
  if (m.includes('mp4') || m.includes('m4a') || m.includes('aac')) return 'mp4';
  if (m.includes('ogg') || m.includes('opus')) return 'ogg';
  if (m.includes('wav')) return 'wav';
  if (m.includes('mpeg') || m.includes('mp3')) return 'mp3';
  return 'webm';
}

function b64ToBytes(b64: string): Uint8Array {
  const clean = b64.startsWith('data:') ? b64.split(',')[1] || '' : b64;
  const bin = atob(clean);
  const out = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
  return out;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  try {
    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      return new Response(JSON.stringify({ error: 'missing_lovable_api_key', code: 'STH-500' }), {
        status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
    const body = await req.json().catch(() => ({}));
    const audioB64: string | undefined = typeof body?.audio === 'string' ? body.audio : undefined;
    const mime: string = typeof body?.mime === 'string' ? body.mime : 'audio/webm';
    if (!audioB64) {
      return new Response(JSON.stringify({ error: 'audio required', code: 'STH-400' }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
    const bytes = b64ToBytes(audioB64);
    if (!bytes.length || bytes.length > 24 * 1024 * 1024) {
      return new Response(JSON.stringify({ error: 'invalid_audio_size', code: 'STH-400' }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
    const ext = extFromMime(mime);
    const form = new FormData();
    form.append('model', 'openai/gpt-4o-mini-transcribe');
    form.append('file', new Blob([bytes], { type: mime || `audio/${ext}` }), `audio.${ext}`);
    // Não travar por idioma: o modelo faz auto-detect (PT-BR na prática).

    const res = await fetch('https://ai.gateway.lovable.dev/v1/audio/transcriptions', {
      method: 'POST',
      headers: { Authorization: `Bearer ${LOVABLE_API_KEY}` },
      body: form,
    });
    if (!res.ok) {
      const raw = await res.text().catch(() => '');
      const isRate = res.status === 429;
      const isCredit = res.status === 402;
      return new Response(JSON.stringify({
        error: isRate ? 'rate_limited' : isCredit ? 'credits_exhausted' : 'transcription_failed',
        code: isRate ? 'STH-429' : isCredit ? 'STH-402' : 'STH-500',
        details: raw.slice(0, 500),
      }), { status: res.status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }
    const data = await res.json().catch(() => ({}));
    const text = String((data as any)?.text || '').trim();
    return new Response(JSON.stringify({ text }), {
      status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (err) {
    console.error('food-ai-transcribe error', err);
    return new Response(JSON.stringify({ error: 'transcription_failed', code: 'STH-500', details: String(err).slice(0, 500) }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});