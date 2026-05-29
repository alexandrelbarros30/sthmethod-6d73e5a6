import { corsHeaders } from 'npm:@supabase/supabase-js@2/cors';
import { createClient } from 'npm:@supabase/supabase-js@2';

// Router de menus do STH One.
// Aceita { phone, text, channel } e retorna { handled, response_sent, status }.
// Pode ser chamado standalone (testador) ou pelos inbounds.

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SERVICE_ROLE = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const ANON_KEY = Deno.env.get('SUPABASE_ANON_KEY')!;

const SESSION_TIMEOUT_MS = 2 * 60 * 60 * 1000; // 2h

const GLOBAL_COMMANDS: Record<string, { menu?: string; queue?: string; tag?: string }> = {
  MENU: { menu: 'main' },
  VOLTAR: { menu: 'main' },
  INICIO: { menu: 'main' },
  INÍCIO: { menu: 'main' },
  SAIR: { menu: 'main' },
  ATENDENTE: { menu: 'main', queue: 'humano', tag: 'HUMANO_NECESSARIO' },
  HUMANO: { menu: 'main', queue: 'humano', tag: 'HUMANO_NECESSARIO' },
  NUTRI: { menu: 'main', queue: 'nutri', tag: 'FALE_COM_NUTRI' },
  FINANCEIRO: { menu: 'financeiro' },
  PLANOS: { menu: 'main', queue: 'comercial', tag: 'INTERESSE_PLANOS' },
  SUPORTE: { menu: 'suporte_tecnico' },
};

const SENSITIVE_RE = /(colateral|tontur[ao]|press[aã]o|glicemia|rea[cç][aã]o|ansiedade|sintoma|sangra|mal[\s-]?estar|emerg[eê]ncia|urgente|\bdor\b|enjoo)/i;

const SENSITIVE_MESSAGE =
  'Entendi. Como envolve uma situação individual e sensível, vou encaminhar sua mensagem para análise do atendimento responsável.\n\n' +
  'Por favor, envie também:\n\n' +
  '1. O que você está sentindo\n' +
  '2. Quando começou\n' +
  '3. Se está usando algum medicamento ou protocolo\n' +
  '4. Se possui exames recentes';

const NUTRI_BLOCKED_MESSAGE =
  'O canal Fale com o Nutri é exclusivo para alunos ativos da consultoria.\n\n' +
  'Para ativar seu acompanhamento, acesse:\n' +
  'sthmethod.com.br/cadastro';

function normalizePhone(raw: string) {
  return String(raw || '').replace(/\D/g, '');
}

function normalizeCommand(t: string) {
  return t.trim().toUpperCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
}

async function sendMessage(channel: string, phone: string, message: string, dryRun: boolean) {
  if (!message || dryRun) return { sent: false, dryRun: true };
  const fn = channel === 'fale_nutri' ? 'send-wapi' : 'send-whatsapp';
  try {
    const r = await fetch(`${SUPABASE_URL}/functions/v1/${fn}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${ANON_KEY}`,
        apikey: ANON_KEY,
      },
      body: JSON.stringify({ phone, message }),
    });
    return { sent: r.ok };
  } catch (e) {
    console.error('send error', e);
    return { sent: false };
  }
}

async function isActiveStudent(supa: any, phone: string): Promise<{ active: boolean; user_id?: string }> {
  const { data: matches } = await supa.rpc('find_profile_by_phone', { _phone: phone });
  const profile = (matches || [])[0];
  if (!profile?.user_id) return { active: false };
  const today = new Date().toISOString().slice(0, 10);
  const { data: sub } = await supa
    .from('subscriptions')
    .select('id')
    .eq('user_id', profile.user_id)
    .gte('end_date', today)
    .limit(1)
    .maybeSingle();
  return { active: !!sub, user_id: profile.user_id };
}

async function buildMenuText(supa: any, menuKey: string): Promise<string> {
  const { data: menu } = await supa
    .from('whatsapp_menus')
    .select('title, header_message, footer_message, active')
    .eq('key', menuKey)
    .maybeSingle();
  if (!menu || !menu.active) return '';
  const { data: opts } = await supa
    .from('whatsapp_menu_options')
    .select('option_number, label, active')
    .eq('menu_key', menuKey)
    .eq('active', true)
    .order('display_order', { ascending: true });
  const numEmojis = ['0️⃣', '1️⃣', '2️⃣', '3️⃣', '4️⃣', '5️⃣', '6️⃣', '7️⃣', '8️⃣', '9️⃣'];
  const lines = (opts || [])
    .map((o: any) => `${numEmojis[o.option_number] ?? o.option_number}  ${o.label}`)
    .join('\n');
  return [menu.header_message, '', lines, '', menu.footer_message].filter(Boolean).join('\n');
}

async function tagSession(supa: any, sessionId: string, tag?: string | null) {
  if (!tag) return;
  await supa.from('whatsapp_session_tags').upsert(
    { session_id: sessionId, tag },
    { onConflict: 'session_id,tag', ignoreDuplicates: true } as any,
  );
}

export async function routeMenu(opts: {
  phone: string;
  text: string;
  channel?: string;
  dryRun?: boolean;
}): Promise<{ handled: boolean; reply?: string; status?: string; queue?: string; menu?: string; sent?: boolean }> {
  const supa = createClient(SUPABASE_URL, SERVICE_ROLE);
  const phone = normalizePhone(opts.phone);
  const text = String(opts.text || '').trim();
  const channel = opts.channel || 'sth_one';
  const dryRun = !!opts.dryRun;
  if (!phone) return { handled: false };

  // get/create session
  let { data: session } = await supa
    .from('whatsapp_sessions')
    .select('*')
    .eq('phone', phone)
    .maybeSingle();

  const now = Date.now();
  const expired = session ? now - new Date(session.last_interaction_at).getTime() > SESSION_TIMEOUT_MS : false;

  if (!session) {
    const { data: created } = await supa
      .from('whatsapp_sessions')
      .insert({ phone, current_menu_key: 'main', status: 'NOVO' })
      .select('*')
      .single();
    session = created;
  } else if (expired || session.status === 'FINALIZADO') {
    await supa
      .from('whatsapp_sessions')
      .update({ current_menu_key: 'main', status: 'NOVO', assigned_queue: null, last_interaction_at: new Date().toISOString() })
      .eq('id', session.id);
    session = { ...session, current_menu_key: 'main', status: 'NOVO', assigned_queue: null };
  }

  // If human took over, do not bot
  if (session.status === 'EM_ATENDIMENTO' || session.status === 'TRANSFERIDO') {
    return { handled: false, status: session.status };
  }

  // Sensitive content check (always wins)
  if (SENSITIVE_RE.test(text)) {
    await supa
      .from('whatsapp_sessions')
      .update({ status: 'PRIORIDADE', assigned_queue: 'nutri', last_interaction_at: new Date().toISOString() })
      .eq('id', session.id);
    await tagSession(supa, session.id, 'PRIORIDADE_CLINICA');
    const res = await sendMessage(channel, phone, SENSITIVE_MESSAGE, dryRun);
    return { handled: true, reply: SENSITIVE_MESSAGE, status: 'PRIORIDADE', queue: 'nutri', sent: res.sent };
  }

  // Global commands
  const upper = normalizeCommand(text);
  const cmd = GLOBAL_COMMANDS[upper];
  if (cmd) {
    const target = cmd.menu || 'main';
    const menuText = await buildMenuText(supa, target);
    await supa.from('whatsapp_sessions').update({
      current_menu_key: target,
      status: cmd.queue ? 'AGUARDANDO_HUMANO' : 'EM_TRIAGEM',
      assigned_queue: cmd.queue || null,
      last_interaction_at: new Date().toISOString(),
    }).eq('id', session.id);
    await tagSession(supa, session.id, cmd.tag || null);
    const res = await sendMessage(channel, phone, menuText, dryRun);
    return { handled: true, reply: menuText, menu: target, queue: cmd.queue, sent: res.sent };
  }

  // If first contact / new session, show main menu (unless message is a number)
  if (session.status === 'NOVO' && !/^\d{1,2}$/.test(text)) {
    const menuText = await buildMenuText(supa, 'main');
    await supa.from('whatsapp_sessions').update({
      current_menu_key: 'main',
      status: 'EM_TRIAGEM',
      last_interaction_at: new Date().toISOString(),
    }).eq('id', session.id);
    const res = await sendMessage(channel, phone, menuText, dryRun);
    return { handled: true, reply: menuText, menu: 'main', sent: res.sent };
  }

  // Numeric option
  const num = parseInt(text, 10);
  if (!isNaN(num) && /^\d{1,2}$/.test(text)) {
    const currentMenu = session.current_menu_key || 'main';
    const { data: opt } = await supa
      .from('whatsapp_menu_options')
      .select('*')
      .eq('menu_key', currentMenu)
      .eq('option_number', num)
      .eq('active', true)
      .maybeSingle();
    if (!opt) {
      const menuText = await buildMenuText(supa, currentMenu);
      const reply = `Opção inválida. Tente novamente:\n\n${menuText}`;
      const res = await sendMessage(channel, phone, reply, dryRun);
      return { handled: true, reply, menu: currentMenu, sent: res.sent };
    }

    // requires active student?
    if (opt.requires_active_student) {
      const { active } = await isActiveStudent(supa, phone);
      if (!active) {
        await tagSession(supa, session.id, 'TENTOU_FALE_COM_NUTRI_SEM_PLANO');
        const res = await sendMessage(channel, phone, NUTRI_BLOCKED_MESSAGE, dryRun);
        return { handled: true, reply: NUTRI_BLOCKED_MESSAGE, sent: res.sent };
      }
    }

    await tagSession(supa, session.id, opt.tag);

    let newStatus = 'EM_TRIAGEM';
    if (opt.queue) newStatus = 'AGUARDANDO_HUMANO';
    if (opt.ends_session) newStatus = 'FINALIZADO';

    const nextMenu = opt.next_menu_key || (opt.returns_to_menu ? 'main' : currentMenu);

    await supa.from('whatsapp_sessions').update({
      current_menu_key: nextMenu,
      status: newStatus,
      assigned_queue: opt.queue || session.assigned_queue,
      last_interaction_at: new Date().toISOString(),
    }).eq('id', session.id);

    let reply = opt.response_message || '';
    if (opt.next_menu_key) {
      const submenuText = await buildMenuText(supa, opt.next_menu_key);
      reply = reply ? `${reply}\n\n${submenuText}` : submenuText;
    } else if (opt.returns_to_menu) {
      const mainText = await buildMenuText(supa, 'main');
      reply = reply ? `${reply}\n\n${mainText}` : mainText;
    }

    const targetChannel = opt.channel || channel;
    const res = await sendMessage(targetChannel, phone, reply, dryRun);
    return { handled: true, reply, menu: nextMenu, queue: opt.queue, status: newStatus, sent: res.sent };
  }

  // Not a recognized menu input — let upstream IA handle it
  return { handled: false };
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  try {
    const body = await req.json().catch(() => ({}));
    const result = await routeMenu({
      phone: body.phone,
      text: body.text || body.message || '',
      channel: body.channel,
      dryRun: body.dryRun === true,
    });
    return new Response(JSON.stringify({ ok: true, ...result }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (err) {
    console.error('whatsapp-menu-router error', err);
    return new Response(JSON.stringify({ ok: false, error: String(err) }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
