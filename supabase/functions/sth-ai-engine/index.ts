import { corsHeaders } from 'npm:@supabase/supabase-js@2/cors';
import { createClient } from 'npm:@supabase/supabase-js@2';

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SERVICE_ROLE = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY')!;
const ANON_KEY = Deno.env.get('SUPABASE_ANON_KEY')!;

type Engine = 'rapida' | 'humanizada' | 'consultor' | 'conversao' | 'retencao' | 'renovacao';
type Action = 'generate' | 'approve' | 'reject' | 'send';

const SYSTEM_BASE = `Você é o STH AI ENGINE, assistente operacional da STH METHOD.
REGRAS ABSOLUTAS:
- Nunca prescreva medicamentos, doses ou condutas clínicas.
- Nunca invente protocolos, planos, valores ou políticas.
- Nunca substitua avaliação profissional; encaminhe para validação humana quando houver dúvida.
- Mantenha tom profissional, claro, neutro e respeitoso (estilo Apple/STH METHOD).
- Use sempre o nome correto da marca: STH METHOD (nunca "STM").
- Use o contexto fornecido (CRM, memória, histórico, templates). Se algo não estiver no contexto, diga que vai confirmar com o time.
- Resposta curta e direta, com no máximo 2 emojis sutis.`;

const ENGINE_GUIDE: Record<Engine, string> = {
  rapida: 'MOTOR ⚡ RÁPIDA: resposta extremamente curta, objetiva, 1-3 frases.',
  humanizada: 'MOTOR ❤️ HUMANIZADA: empática, acolhedora, mantendo profissionalismo.',
  consultor: 'MOTOR 🧠 CONSULTOR: técnica, justifique brevemente o porquê com base no contexto.',
  conversao: 'MOTOR 💰 CONVERSÃO: trate objeções (caro, vou pensar, sem tempo), reforce benefícios STH METHOD, conduza ao próximo passo sem pressão.',
  retencao: 'MOTOR 🔁 RETENÇÃO: aluno em risco/sumido. Reconecte, mostre cuidado, sugira retomada simples.',
  renovacao: 'MOTOR 📈 RENOVAÇÃO: reforce evolução, consistência e continuidade. Nunca soar cobrança.',
};

const INTENT_LIST = ['dieta','treino','protocolo','exames','atualizacao','pagamento','renovacao','cancelamento','duvida_geral','conversao'] as const;

function detectIntent(text: string): string {
  const t = (text || '').toLowerCase();
  if (/(dieta|refeic|alimenta|cardapio|cardápio|macro|prote[ií]na|carbo)/.test(t)) return 'dieta';
  if (/(treino|exerc|s[eé]rie|repeti[cç]|musculac|academia)/.test(t)) return 'treino';
  if (/(protocolo|suplement|ciclo|dose|gh|tirzep|sema)/.test(t)) return 'protocolo';
  if (/(exame|laborator|sangue|tsh|hba1c)/.test(t)) return 'exames';
  if (/(atualiza|foto|peso novo|medida)/.test(t)) return 'atualizacao';
  if (/(pagamento|pix|boleto|cart[aã]o|cobranca|nota fiscal)/.test(t)) return 'pagamento';
  if (/(renovar|renova|vence|expira|continuar)/.test(t)) return 'renovacao';
  if (/(cancelar|desistir|sair)/.test(t)) return 'cancelamento';
  if (/(quero|inscrever|come[cç]ar|valor|plano|quanto custa|caro|pensar)/.test(t)) return 'conversao';
  return 'duvida_geral';
}

function classifyContact(memory: any, hasActiveSub: boolean): string {
  if (!memory) return 'lead';
  if (hasActiveSub) {
    const last = memory.last_interaction_at ? new Date(memory.last_interaction_at).getTime() : 0;
    const days = (Date.now() - last) / 86_400_000;
    if (days >= 21) return 'aluno_inativo';
    return 'aluno_ativo';
  }
  if (memory.plan_name) return 'renovacao';
  return 'lead';
}

async function generate(body: any, sb: any) {
  const phoneRaw: string = (body.phone || '').toString();
  const phone = phoneRaw.replace(/\D/g, '');
  const inbound: string = (body.inbound_text || body.text || '').trim();
  const requestedEngine: Engine | undefined = body.engine;
  const ticket_id: string | null = body.ticket_id || null;

  if (!phone || phone.length < 8 || !inbound) {
    return { status: 400, body: { ok: false, error: 'phone e inbound_text obrigatórios' } };
  }

  // 1) CRM contato + memória
  const { data: contact } = await sb.from('crm_contacts').select('*').eq('phone', phone).maybeSingle();
  const { data: memory } = await sb.from('sth_memory').select('*').eq('phone', phone).maybeSingle();

  // 2) Assinatura ativa
  let hasActiveSub = false;
  if (contact?.user_id || memory?.user_id) {
    const uid = contact?.user_id || memory?.user_id;
    const { data: sub } = await sb.from('subscriptions').select('id,end_date,status')
      .eq('user_id', uid).eq('status', 'active').gte('end_date', new Date().toISOString().slice(0, 10))
      .limit(1).maybeSingle();
    if (sub) hasActiveSub = true;
  }

  // 3) Histórico recente (timeline + últimas mensagens)
  let timeline: any[] = [];
  let recentLearning: any[] = [];
  if (memory?.id) {
    const [{ data: tl }, { data: lr }] = await Promise.all([
      sb.from('sth_memory_timeline').select('event_type,event_title,created_at').eq('memory_id', memory.id).order('created_at', { ascending: false }).limit(8),
      sb.from('sth_memory_learning').select('question,answer,intent,created_at').eq('memory_id', memory.id).order('created_at', { ascending: false }).limit(5),
    ]);
    timeline = tl || [];
    recentLearning = lr || [];
  }

  // 4) Templates ativos relevantes para a intenção detectada
  const intent = detectIntent(inbound);
  const contact_type = classifyContact(memory, hasActiveSub);
  let engine: Engine = requestedEngine || 'humanizada';
  if (!requestedEngine) {
    if (contact_type === 'lead' || intent === 'conversao') engine = 'conversao';
    else if (contact_type === 'aluno_inativo') engine = 'retencao';
    else if (intent === 'renovacao') engine = 'renovacao';
    else if (intent === 'protocolo' || intent === 'exames') engine = 'consultor';
  }

  const { data: templates } = await sb.from('sth_ai_templates')
    .select('id,name,category,engine,body,uses_count').eq('active', true)
    .or(`category.eq.${intent},engine.eq.${engine}`).limit(6);

  // 4b) Knowledge Hub — base oficial STH METHOD
  const intentToKbCategory: Record<string, string> = {
    dieta: 'Nutrição', treino: 'Treinamento', protocolo: 'Consultoria',
    exames: 'Exames', atualizacao: 'Plataforma', pagamento: 'Financeiro',
    renovacao: 'Renovação', conversao: 'Comercial', cancelamento: 'Comercial',
    duvida_geral: 'FAQ',
  };
  const kbCategory = intentToKbCategory[intent] || null;
  let kbArticles: any[] = [];
  try {
    const { data: kb } = await sb.rpc('sth_kb_search', { _query: inbound, _category: kbCategory, _limit: 4 });
    kbArticles = kb || [];
    if (kbArticles.length === 0 && kbCategory) {
      const { data: kb2 } = await sb.rpc('sth_kb_search', { _query: inbound, _category: null, _limit: 3 });
      kbArticles = kb2 || [];
    }
  } catch (e) {
    console.warn('sth_kb_search falhou', e);
  }

  // 5) Prompt
  const contextBlock: string[] = [];
  contextBlock.push(`# CONTATO`);
  contextBlock.push(`Nome: ${memory?.full_name || contact?.full_name || 'desconhecido'}`);
  contextBlock.push(`Telefone: ${phone}`);
  contextBlock.push(`Tipo: ${contact_type}`);
  if (memory?.plan_name) contextBlock.push(`Plano: ${memory.plan_name} (${memory.plan_status || '—'})`);
  if (memory?.objective) contextBlock.push(`Objetivo: ${memory.objective}`);
  if (memory?.current_weight) contextBlock.push(`Peso atual: ${memory.current_weight}kg (inicial: ${memory.initial_weight ?? '—'})`);
  if (memory?.preferred_tone) contextBlock.push(`Tom preferido: ${memory.preferred_tone}`);
  if (memory?.difficulties?.length) contextBlock.push(`Dificuldades: ${memory.difficulties.join(', ')}`);
  contextBlock.push(`Score memória: ${memory?.score ?? 0}/100 (${memory?.temperature || 'frio'})`);

  if (timeline.length) {
    contextBlock.push(`\n# TIMELINE RECENTE`);
    timeline.forEach((t) => contextBlock.push(`- [${t.event_type}] ${t.event_title} (${new Date(t.created_at).toLocaleDateString('pt-BR')})`));
  }
  if (recentLearning.length) {
    contextBlock.push(`\n# CONVERSAS ANTERIORES`);
    recentLearning.forEach((l) => contextBlock.push(`P: ${l.question}\nR: ${l.answer || '—'}`));
  }
  if (templates?.length) {
    contextBlock.push(`\n# TEMPLATES DISPONÍVEIS (use como referência, adapte ao contexto)`);
    templates.forEach((t: any) => contextBlock.push(`[${t.name}] (${t.category}/${t.engine}):\n${t.body}`));
  }
  if (kbArticles.length) {
    contextBlock.push(`\n# BASE DE CONHECIMENTO STH METHOD (fonte oficial — siga rigorosamente)`);
    kbArticles.forEach((k: any) => {
      const body = (k.summary || k.content || '').slice(0, 1200);
      contextBlock.push(`[${k.category}] ${k.title}\n${body}`);
    });
  }

  const systemPrompt = `${SYSTEM_BASE}\n\n${ENGINE_GUIDE[engine]}\n\nINTENÇÃO DETECTADA: ${intent}\nTIPO DE CONTATO: ${contact_type}\n\n${contextBlock.join('\n')}`;

  // 6) Lovable AI Gateway (não-streaming, retornar texto pronto)
  const t0 = Date.now();
  const aiRes = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
    method: 'POST',
    headers: { Authorization: `Bearer ${LOVABLE_API_KEY}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model: 'google/gemini-2.5-flash',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: inbound },
      ],
    }),
  });
  const latency_ms = Date.now() - t0;

  if (!aiRes.ok) {
    if (aiRes.status === 429) return { status: 429, body: { ok: false, error: 'Rate limit. Aguarde alguns segundos.' } };
    if (aiRes.status === 402) return { status: 402, body: { ok: false, error: 'Créditos Lovable AI esgotados.' } };
    const txt = await aiRes.text();
    return { status: 500, body: { ok: false, error: `AI gateway: ${aiRes.status} ${txt.slice(0,200)}` } };
  }
  const aiJson = await aiRes.json();
  const draft_text: string = aiJson?.choices?.[0]?.message?.content?.trim() || '';
  const tokens_in = aiJson?.usage?.prompt_tokens ?? null;
  const tokens_out = aiJson?.usage?.completion_tokens ?? null;

  if (!draft_text) {
    await sb.from('sth_ai_unsolved').insert({ memory_id: memory?.id || null, phone, question: inbound, reason: 'IA não retornou resposta' });
    return { status: 200, body: { ok: false, error: 'sem resposta', logged_unsolved: true } };
  }

  // 7) Salva draft pendente de aprovação
  const { data: draft, error: insErr } = await sb.from('sth_ai_drafts').insert({
    memory_id: memory?.id || null,
    ticket_id,
    phone,
    contact_name: memory?.full_name || contact?.full_name || null,
    contact_type,
    intent,
    engine,
    inbound_text: inbound,
    draft_text,
    model: 'google/gemini-2.5-flash',
    latency_ms,
    tokens_in, tokens_out,
    status: 'pending',
    meta: { templates_used: (templates || []).map((t: any) => t.id) },
  }).select('*').single();

  if (insErr) return { status: 500, body: { ok: false, error: insErr.message } };

  // Increment template usage
  if (templates?.length) {
    for (const t of templates) {
      await sb.from('sth_ai_templates').update({ uses_count: (t.uses_count ?? 0) + 1 }).eq('id', t.id);
    }
  }

  return { status: 200, body: { ok: true, draft, intent, engine, contact_type, latency_ms } };
}

async function approve(body: any, sb: any, userId: string | null) {
  const id = body.draft_id;
  const final_text = (body.final_text || '').trim() || null;
  if (!id) return { status: 400, body: { ok: false, error: 'draft_id obrigatório' } };
  const status = final_text ? 'edited' : 'approved';
  const { data, error } = await sb.from('sth_ai_drafts')
    .update({ status, final_text, approved_by: userId, approved_at: new Date().toISOString() })
    .eq('id', id).select('*').single();
  if (error) return { status: 500, body: { ok: false, error: error.message } };
  return { status: 200, body: { ok: true, draft: data } };
}

async function reject(body: any, sb: any, userId: string | null) {
  const id = body.draft_id;
  if (!id) return { status: 400, body: { ok: false, error: 'draft_id obrigatório' } };
  const { data, error } = await sb.from('sth_ai_drafts')
    .update({ status: 'rejected', rejected_reason: body.reason || null, approved_by: userId, approved_at: new Date().toISOString() })
    .eq('id', id).select('*').single();
  if (error) return { status: 500, body: { ok: false, error: error.message } };
  // Log no unsolved para análise
  if (data) {
    await sb.from('sth_ai_unsolved').insert({ memory_id: data.memory_id, phone: data.phone, question: data.inbound_text, reason: body.reason || 'Rejeitada pelo humano' });
  }
  return { status: 200, body: { ok: true, draft: data } };
}

async function sendDraft(body: any, sb: any, userId: string | null) {
  const id = body.draft_id;
  if (!id) return { status: 400, body: { ok: false, error: 'draft_id obrigatório' } };
  const { data: draft, error } = await sb.from('sth_ai_drafts').select('*').eq('id', id).maybeSingle();
  if (error || !draft) return { status: 404, body: { ok: false, error: 'draft não encontrado' } };
  if (!['approved','edited','pending'].includes(draft.status)) {
    return { status: 400, body: { ok: false, error: `draft em status ${draft.status} não pode ser enviado` } };
  }
  const text = draft.final_text || draft.draft_text;
  // Dispara via send-wapi
  const wapiRes = await fetch(`${SUPABASE_URL}/functions/v1/send-wapi`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${ANON_KEY}`, apikey: ANON_KEY },
    body: JSON.stringify({ phone: draft.phone, message: text }),
  });
  const wapiOk = wapiRes.ok;
  const wapiBody = await wapiRes.text();
  if (!wapiOk) return { status: 502, body: { ok: false, error: `Falha ao enviar via WhatsApp: ${wapiBody.slice(0,200)}` } };

  await sb.from('sth_ai_drafts').update({ status: 'sent', sent_at: new Date().toISOString(), approved_by: userId, final_text: text }).eq('id', id);

  // Aprendizado
  if (draft.memory_id) {
    await sb.from('sth_memory_learning').insert({
      memory_id: draft.memory_id, question: draft.inbound_text, answer: text,
      engine: 'sth-ai-engine', intent: draft.intent, outcome: 'sent',
    });
    await sb.from('sth_memory').update({ last_question: draft.inbound_text, last_answer: text, last_interaction_at: new Date().toISOString() }).eq('id', draft.memory_id);
  }

  return { status: 200, body: { ok: true } };
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  try {
    if (!LOVABLE_API_KEY) throw new Error('LOVABLE_API_KEY não configurado');
    const sb = createClient(SUPABASE_URL, SERVICE_ROLE);

    // userId opcional (vindo do JWT do front)
    let userId: string | null = null;
    const auth = req.headers.get('Authorization');
    if (auth?.startsWith('Bearer ')) {
      try {
        const sbUser = createClient(SUPABASE_URL, ANON_KEY, { global: { headers: { Authorization: auth } } });
        const { data } = await sbUser.auth.getClaims(auth.replace('Bearer ', ''));
        userId = data?.claims?.sub || null;
      } catch { /* ignore */ }
    }

    const body = await req.json().catch(() => ({}));
    const action: Action = body.action || 'generate';

    let result;
    if (action === 'generate') result = await generate(body, sb);
    else if (action === 'approve') result = await approve(body, sb, userId);
    else if (action === 'reject') result = await reject(body, sb, userId);
    else if (action === 'send') result = await sendDraft(body, sb, userId);
    else result = { status: 400, body: { ok: false, error: `action inválida: ${action}` } };

    return new Response(JSON.stringify(result.body), {
      status: result.status, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (err) {
    console.error('sth-ai-engine error', err);
    return new Response(JSON.stringify({ ok: false, error: String(err) }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});