// Webhook Mercado Pago do STH METHOD AI — ativa a assinatura após aprovação.
import { corsHeaders } from 'npm:@supabase/supabase-js@2/cors';
import { createClient } from 'npm:@supabase/supabase-js@2';

const MONTHS: Record<string, number> = { mensal: 1, trimestral: 3, semestral: 6, anual: 12 };

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  try {
    const payload = await req.json().catch(() => ({}));
    const paymentId = payload?.data?.id ?? payload?.id;
    if (!paymentId) return new Response('ok', { headers: corsHeaders });

    const token = Deno.env.get('MP_ACCESS_TOKEN')!;
    const res = await fetch(`https://api.mercadopago.com/v1/payments/${paymentId}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok) {
      console.error('MP lookup failed', res.status, await res.text());
      return new Response('ok', { headers: corsHeaders });
    }
    const payment = await res.json();
    const ref: string = payment?.external_reference ?? '';
    if (!ref.startsWith('sthai:')) return new Response('ok', { headers: corsHeaders });

    const admin = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? Deno.env.get('SUPABASE_ANON_KEY')!,
    );
    const id = ref.slice('sthai:'.length);
    const { data: sub } = await admin.from('ai_app_subscriptions').select('*').eq('id', id).maybeSingle();
    if (!sub) return new Response('ok', { headers: corsHeaders });

    if (payment.status === 'approved') {
      const started = new Date();
      const expires = new Date(started);
      expires.setMonth(expires.getMonth() + (MONTHS[sub.plan] ?? 1));
      await admin.from('ai_app_subscriptions').update({
        status: 'active',
        started_at: started.toISOString(),
        expires_at: expires.toISOString(),
      }).eq('id', id);
    } else if (['rejected', 'cancelled', 'refunded', 'charged_back'].includes(payment.status)) {
      await admin.from('ai_app_subscriptions').update({ status: 'failed' }).eq('id', id);
    }

    return new Response('ok', { headers: corsHeaders });
  } catch (err) {
    console.error('sth-ai-mp-webhook', err);
    return new Response('ok', { headers: corsHeaders });
  }
});