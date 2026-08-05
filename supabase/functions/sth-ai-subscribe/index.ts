// Cria preferência Mercado Pago para a assinatura do STH METHOD AI.
import { corsHeaders } from 'npm:@supabase/supabase-js@2/cors';
import { createClient } from 'npm:@supabase/supabase-js@2';

export const AI_PLANS: Record<string, { label: string; amount: number; months: number }> = {
  mensal_oferta: { label: 'STH AI Mensal (Lançamento)', amount: 39.9, months: 1 },
  anual_fundador: { label: 'STH AI Anual Fundador', amount: 399.9, months: 12 },
  mensal: { label: 'STH AI Mensal', amount: 59.9, months: 1 },
  trimestral: { label: 'STH AI Trimestral', amount: 159.9, months: 3 },
  semestral: { label: 'STH AI Semestral', amount: 299.9, months: 6 },
  anual: { label: 'STH AI Anual', amount: 499.9, months: 12 },
};

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), { status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) return json({ error: 'Unauthorized' }, 401);

    const supabase = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_ANON_KEY')!, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: auth } = await supabase.auth.getClaims(authHeader.replace('Bearer ', ''));
    const userId = auth?.claims?.sub as string | undefined;
    const email = (auth?.claims as any)?.email as string | undefined;
    if (!userId) return json({ error: 'Unauthorized' }, 401);

    const { plan, offer_id: offerId, coupon_code: couponCode, payment_method } = await req.json().catch(() => ({}));
    const config = AI_PLANS[plan];
    if (!config) return json({ error: 'Plano inválido' }, 400);

    const admin = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? Deno.env.get('SUPABASE_ANON_KEY')!,
    );

    let discountPct = 0;
    
    // 1. Validação de Cupom (Novo Fluxo)
    if (couponCode) {
      const { data: couponValid } = await admin.functions.invoke('validate-coupon', {
        body: { code: couponCode, plan_id: plan, payment_method: payment_method || 'pix' }
      });
      
      if (couponValid?.valid && couponValid.discount_type === 'percentage') {
        discountPct = Number(couponValid.discount_value);
      }
    }

    // 2. Fallback para Ofertas Legadas (se não houver cupom)
    if (discountPct === 0 && offerId) {
      const { data: o } = await admin
        .from('ai_app_offers')
        .select('id, plan, discount_pct, status, expires_at')
        .eq('id', offerId)
        .eq('user_id', userId)
        .eq('status', 'active')
        .maybeSingle();
      if (o && o.plan === plan && new Date(o.expires_at) > new Date()) {
        discountPct = Math.min(30, Math.max(0, Number(o.discount_pct) || 0));
      }
    }

    const amount = Number((config.amount * (1 - discountPct / 100)).toFixed(2));

    const { data: record, error } = await admin
      .from('ai_app_subscriptions')
      .insert({ user_id: userId, plan, amount, status: 'pending' })
      .select()
      .single();
    if (error) throw error;

    const token = Deno.env.get('MERCADO_PAGO_ACCESS_TOKEN') ?? Deno.env.get('MP_ACCESS_TOKEN');
    if (!token) return json({ error: 'Pagamento indisponível no momento.' }, 500);

    const origin = req.headers.get('origin') || 'https://sthmethod.com.br';
    const preference = {
      items: [{
        title: discountPct > 0 ? `${config.label} (-${discountPct}%)` : config.label,
        description: 'Assinatura STH METHOD AI',
        quantity: 1,
        unit_price: amount,
        currency_id: 'BRL',
      }],
      payer: { email: email || 'usuario@sthmethod.com.br' },
      external_reference: `sthai:${record.id}`,
      back_urls: {
        success: `${origin}/ai/assinatura?status=approved`,
        failure: `${origin}/ai/assinatura?status=failed`,
        pending: `${origin}/ai/assinatura?status=pending`,
      },
      auto_return: 'approved',
      notification_url: `${Deno.env.get('SUPABASE_URL')}/functions/v1/sth-ai-mp-webhook`,
    };

    const mpRes = await fetch('https://api.mercadopago.com/checkout/preferences', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify(preference),
    });
    const mpData = await mpRes.json();
    if (!mpRes.ok) {
      console.error('MP error', mpRes.status, JSON.stringify(mpData));
      return json({ error: `Falha no checkout [${mpRes.status}]`, details: mpData }, mpRes.status);
    }

    await admin.from('ai_app_subscriptions').update({ external_reference: String(mpData.id) }).eq('id', record.id);
    if (offer) {
      await admin.from('ai_app_offers').update({ status: 'used', updated_at: new Date().toISOString() }).eq('id', offer.id);
    }

    return json({ init_point: mpData.init_point, subscription_id: record.id, amount, discount_pct: discountPct });
  } catch (err) {
    console.error('sth-ai-subscribe', err);
    return json({ error: String((err as Error)?.message ?? err) }, 500);
  }
});