import { corsHeaders } from 'npm:@supabase/supabase-js@2/cors';
import { createClient } from 'npm:@supabase/supabase-js@2';

// Public webhook (no JWT). Use ?provider=zapi|wapi and ?secret=... in URL.
// Z-API → channel "comercial" (STH One)
// W-API → channel "nutri" (Fale com o Nutri)

function normalizePhone(raw: string): string {
  let d = String(raw || '').replace(/\D+/g, '').replace(/^0+/, '');
  if (d.length >= 12 && d.startsWith('55')) return d;
  if (d.length === 10 || d.length === 11) return '55' + d;
  return d;
}

function phoneCandidates(d: string): string[] {
  if (!d) return [];
  const set = new Set<string>([d]);
  const local = d.startsWith('55') ? d.slice(2) : d;
  if (local) {
    set.add(local);
    set.add('55' + local);
    if (local.length === 11 && local[2] === '9') set.add(local.slice(0,2) + local.slice(3));
    if (local.length === 10) set.add(local.slice(0,2) + '9' + local.slice(2));
  }
  return Array.from(set);
}

// Triagem por palavras-chave
function classify(text: string): { queue: 'comercial'|'nutri'|'financeiro'|null; nutriCategory: string | null; tags: string[] } {
  const t = String(text || '').toLowerCase();
  const tags: string[] = [];
  let queue: any = null;
  let nutriCategory: string | null = null;

  const has = (...kw: string[]) => kw.some(k => t.includes(k));

  // Financeiro
  if (has('cobran', 'pagamento', 'pagar', 'pix', 'boleto', 'comprovante', 'fatura', 'cartao', 'cartão')) {
    queue = 'financeiro'; tags.push('FINANCEIRO','PAGAMENTO');
  }
  // Comercial
  else if (has('preço','preco','plano','planos','contratar','assinar','quero entrar','quero começar','quero comecar','quanto custa','valor','valores')) {
    queue = 'comercial'; tags.push('COMERCIAL','INTERESSE');
  }
  else if (has('renovar','renovação','renovacao','reativar')) {
    queue = 'comercial'; tags.push('COMERCIAL','RENOVACAO');
  }
  // Nutri
  else if (has('dieta','refeição','refeicao','cardápio','cardapio','calorias','macros')) {
    queue = 'nutri'; nutriCategory = 'Dieta'; tags.push('NUTRI','DIETA');
  }
  else if (has('treino','exercicio','exercício','série','serie','academia','musculação','musculacao')) {
    queue = 'nutri'; nutriCategory = 'Treino'; tags.push('NUTRI','TREINO');
  }
  else if (has('protocolo','suplemento','hormonio','hormônio','peptide','peptideo','peptídeo','ciclo')) {
    queue = 'nutri'; nutriCategory = 'Protocolo'; tags.push('NUTRI','PROTOCOLO');
  }
  else if (has('exame','exames','laboratório','laboratorio','sangue','hemograma')) {
    queue = 'nutri'; nutriCategory = 'Exames'; tags.push('NUTRI','EXAMES');
  }
  else if (has('peso','medidas','foto','evolução','evolucao','atualização','atualizacao','progresso')) {
    queue = 'nutri'; nutriCategory = 'Atualização'; tags.push('NUTRI','ATUALIZACAO');
  }
  else if (has('urgente','urgência','urgencia','prioridade','emergência','emergencia')) {
    queue = 'nutri'; nutriCategory = 'Prioridade'; tags.push('NUTRI','PRIORIDADE');
  }

  return { queue, nutriCategory, tags };
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  try {
    const url = new URL(req.url);
    const provider = (url.searchParams.get('provider') || 'wapi').toLowerCase(); // zapi | wapi
    const expectedSecret = Deno.env.get('MP_WEBHOOK_SECRET') || '';
    const provided = req.headers.get('x-webhook-secret') || url.searchParams.get('secret') || '';
    if (expectedSecret && provided !== expectedSecret) {
      return new Response(JSON.stringify({ error: 'invalid secret' }), { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    const payload = await req.json().catch(() => ({})) as any;
    const phoneRaw = payload?.phone || payload?.from || payload?.data?.from || payload?.message?.from || '';
    const body = payload?.message || payload?.text || payload?.body || payload?.data?.message?.text || '';
    const externalId = payload?.messageId || payload?.id || null;
    const name = payload?.senderName || payload?.pushName || null;

    const phone = normalizePhone(phoneRaw);
    if (!phone || !body) {
      return new Response(JSON.stringify({ ok: true, skipped: true }), { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    const admin = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!);

    // 1. lookup profile + subscription
    const candidates = phoneCandidates(phone);
    const { data: profiles } = await admin.from('profiles').select('user_id, full_name, objective').in('phone', candidates).limit(1);
    const profile = profiles?.[0];
    let displayName = name || profile?.full_name || null;
    let isLead = !profile;
    let queueOverride: string | null = null;
    const tagsToApply: string[] = [];

    if (profile) {
      const { data: subs } = await admin.from('subscriptions').select('end_date,status').eq('user_id', profile.user_id).order('end_date', { ascending: false }).limit(1);
      const sub = subs?.[0];
      if (sub) {
        const days = Math.floor((new Date(sub.end_date).getTime() - Date.now()) / 86400000);
        if (days < 0) { tagsToApply.push('RENOVACAO'); queueOverride = 'comercial'; }
        else { tagsToApply.push('ALUNO_ATIVO'); }
      } else {
        tagsToApply.push('LEAD'); isLead = true;
      }
    } else {
      tagsToApply.push('LEAD');
    }

    // 2. classify message
    const cls = classify(body);
    const finalQueue = queueOverride || cls.queue || (provider === 'zapi' ? 'comercial' : 'nutri');
    for (const t of cls.tags) if (!tagsToApply.includes(t)) tagsToApply.push(t);

    // 3. upsert conversation
    let { data: conv } = await admin.from('crm_conversations').select('id, queue_type').eq('phone', phone).maybeSingle();
    if (!conv) {
      const ins = await admin.from('crm_conversations').insert({
        phone, display_name: displayName, channel: 'whatsapp', status: 'open',
        provider, queue_type: finalQueue, nutri_category: cls.nutriCategory, is_lead: isLead,
      }).select('id, queue_type').single();
      conv = ins.data;
    } else {
      const upd: any = { provider };
      if (displayName) upd.display_name = displayName;
      if (!conv.queue_type) upd.queue_type = finalQueue;
      if (cls.nutriCategory) upd.nutri_category = cls.nutriCategory;
      upd.is_lead = isLead;
      await admin.from('crm_conversations').update(upd).eq('id', conv.id);
    }

    // 4. insert message
    await admin.from('crm_messages').insert({
      conversation_id: conv!.id, direction: 'in', body: String(body),
      source: provider === 'zapi' ? 'zapi' : 'wapi', external_id: externalId, status: 'received',
    });

    // 5. apply tags
    if (tagsToApply.length) {
      const { data: tagRows } = await admin.from('crm_tags').select('id,name').in('name', tagsToApply);
      const existing = await admin.from('crm_conversation_tags').select('tag_id').eq('conversation_id', conv!.id);
      const existSet = new Set((existing.data || []).map((r: any) => r.tag_id));
      const toInsert = (tagRows || []).filter((t: any) => !existSet.has(t.id)).map((t: any) => ({ conversation_id: conv!.id, tag_id: t.id }));
      if (toInsert.length) await admin.from('crm_conversation_tags').insert(toInsert);
    }

    // 6. enqueue
    const queueName = finalQueue === 'comercial' ? 'Atendimento Comercial'
      : finalQueue === 'financeiro' ? 'Financeiro'
      : (cls.nutriCategory || 'Dieta');
    const { data: queue } = await admin.from('crm_queues').select('id').eq('name', queueName).maybeSingle();
    if (queue) {
      const { data: openItem } = await admin.from('crm_queue_items').select('id').eq('conversation_id', conv!.id).is('closed_at', null).maybeSingle();
      if (!openItem) {
        await admin.from('crm_queue_items').insert({
          queue_id: queue.id, conversation_id: conv!.id, phone,
          priority: finalQueue === 'comercial' ? 2 : (cls.nutriCategory === 'Prioridade' ? 0 : 5),
        });
      }
    }

    return new Response(JSON.stringify({ ok: true, queue: finalQueue, is_lead: isLead, tags: tagsToApply }), {
      status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (err) {
    console.error('crm-inbound-webhook', err);
    return new Response(JSON.stringify({ error: String(err) }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  }
});