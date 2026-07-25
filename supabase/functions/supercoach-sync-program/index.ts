// Sincroniza APENAS os metadados (nome/subtítulo/capa) do programa no ST Coach.
// Não depende de templates com exercícios — usado quando o admin edita o programa.
import { corsHeaders } from 'npm:@supabase/supabase-js@2/cors';
import { createClient } from 'npm:@supabase/supabase-js@2';
import { getSuperCoachToken, SC_COMMON_HEADERS } from '../_shared/supercoach-library.ts';

const SC = 'https://supertreinosapp.com/api/v2';

interface Body { programId?: string; accessToken?: string }

async function scFetch(token: string, path: string, init: RequestInit = {}) {
  const res = await fetch(`${SC}${path}`, {
    ...init,
    headers: { ...SC_COMMON_HEADERS, authorization: `Bearer ${token}`, ...(init.headers || {}) },
  });
  const text = await res.text();
  let json: any = null;
  try { json = JSON.parse(text); } catch { /* keep text */ }
  if (!res.ok) throw new Error(`ST Coach ${init.method || 'GET'} ${path} (${res.status}): ${text.slice(0, 220)}`);
  return json ?? {};
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  try {
    const body = (await req.json().catch(() => ({}))) as Body;
    const bodyToken = String(body.accessToken || '').trim();
    const headerAuth = req.headers.get('Authorization') || '';
    const auth = headerAuth.startsWith('Bearer ')
      ? headerAuth
      : bodyToken
        ? `Bearer ${bodyToken}`
        : '';
    if (!auth.startsWith('Bearer ')) throw new Error('Não autenticado');
    const url = Deno.env.get('SUPABASE_URL')!;
    const anon = Deno.env.get('SUPABASE_ANON_KEY')!;
    const service = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const asUser = createClient(url, anon, { global: { headers: { Authorization: auth } } });
    const { data: userRes, error: userErr } = await asUser.auth.getUser();
    if (userErr || !userRes?.user) throw new Error('Não autenticado');
    const admin = createClient(url, service);
    const { data: roles } = await admin.from('user_roles').select('role').eq('user_id', userRes.user.id).in('role', ['admin', 'consultor']);
    if (!roles?.length) throw new Error('Apenas admin/consultor podem sincronizar');

    const { programId } = body;
    if (!programId) throw new Error('programId obrigatório');

    const { data: prog, error } = await admin
      .from('training_programs')
      .select('id, title, subtitle, poster_url, supercoach_program_id, difficulty')
      .eq('id', programId)
      .maybeSingle();
    if (error) throw error;
    if (!prog) throw new Error('Programa não encontrado');

    const token = await getSuperCoachToken();
    let scProgramId = prog.supercoach_program_id ? Number(prog.supercoach_program_id) : null;

    // Se não existe no ST Coach, cria
    if (!scProgramId) {
      const created = await scFetch(token, '/programs/', {
        method: 'POST', headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          id: 0, cover_path: true, name: prog.title || 'Programa STH METHOD',
          user_id: 0, subtitle: prog.subtitle || '',
          category: 1, goal: 1, gender: 'ambos', location: 'qualquer', focus: 'completo',
          difficulty_level: prog.difficulty === 'avancado' ? 'Avançado' : prog.difficulty === 'iniciante' ? 'Iniciante' : 'Intermediário',
          video_url: 'https://player.vimeo.com/video/', description: '',
          weeks: '', days_per_week: '', minutes_per_day: '',
          sort: 0, pay: 0, published: 1, premium: 0,
          cover_url: prog.poster_url || 'https://supertreinosapp.com/img/PROGRAMA-BANNER-PADRAO.jpg',
          translations: '', clone: 'original',
        }),
      });
      scProgramId = Number(created?.program?.id);
      if (!scProgramId) throw new Error('Falha ao criar programa no ST Coach');
      await admin.from('training_programs').update({ supercoach_program_id: scProgramId }).eq('id', prog.id);
      await admin.from('workout_templates').update({ supercoach_program_id: scProgramId }).eq('program_id', prog.id);
    } else {
      // PATCH metadados
      await scFetch(token, `/programs/${scProgramId}`, {
        method: 'POST', headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          id: scProgramId,
          name: prog.title || 'Programa STH METHOD',
          subtitle: prog.subtitle || '',
          ...(prog.poster_url ? { cover_url: prog.poster_url, cover_path: true } : {}),
          published: 1, pay: 0, premium: 0,
          _method: 'PATCH',
        }),
      });
    }

    return new Response(JSON.stringify({ ok: true, supercoach_program_id: scProgramId }), {
      headers: { ...corsHeaders, 'content-type': 'application/json' },
    });
  } catch (e: any) {
    return new Response(JSON.stringify({ ok: false, error: e.message || String(e) }), {
      status: 200, headers: { ...corsHeaders, 'content-type': 'application/json' },
    });
  }
});