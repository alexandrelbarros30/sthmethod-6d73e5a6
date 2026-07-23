// Sincroniza SOMENTE as capas (poster/cover) dos programas e treinos STH METHOD
// para o ST Coach. Não altera exercícios, séries, repetições ou intervalos.
//
// Body opcional: { programIds?: string[] }  -> se omitido, sincroniza todos os
// training_programs com supercoach_program_id preenchido.
import { corsHeaders } from 'npm:@supabase/supabase-js@2/cors';
import { createClient } from 'npm:@supabase/supabase-js@2';
import { getSuperCoachToken, SC_COMMON_HEADERS } from '../_shared/supercoach-library.ts';

const SC = 'https://supertreinosapp.com/api/v2';

async function scPatch(token: string, path: string, body: Record<string, any>) {
  const res = await fetch(`${SC}${path}`, {
    method: 'POST',
    headers: {
      ...SC_COMMON_HEADERS,
      authorization: `Bearer ${token}`,
      'content-type': 'application/json',
    },
    body: JSON.stringify({ ...body, _method: 'PATCH' }),
  });
  const text = await res.text();
  if (!res.ok) throw new Error(`ST Coach POST ${path} (${res.status}): ${text.slice(0, 200)}`);
  try { return JSON.parse(text); } catch { return text; }
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  try {
    const authHeader = req.headers.get('Authorization') || '';
    if (!authHeader.startsWith('Bearer ')) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }
    const url = Deno.env.get('SUPABASE_URL')!;
    const anon = Deno.env.get('SUPABASE_ANON_KEY')!;
    const service = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const userClient = createClient(url, anon, { global: { headers: { Authorization: authHeader } } });
    const admin = createClient(url, service);

    const { data: userData, error: authErr } = await userClient.auth.getUser();
    if (authErr || !userData?.user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }
    const { data: roles } = await admin.from('user_roles').select('role').eq('user_id', userData.user.id);
    const isAdmin = (roles || []).some((r: any) => ['admin', 'consultor'].includes(r.role));
    if (!isAdmin) {
      return new Response(JSON.stringify({ error: 'Forbidden' }), { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    const body = await req.json().catch(() => ({} as any));
    const programIds: string[] | undefined = Array.isArray(body?.programIds) ? body.programIds : undefined;

    let progQuery = admin
      .from('training_programs')
      .select('id, title, subtitle, poster_url, supercoach_program_id')
      .not('supercoach_program_id', 'is', null)
      .not('poster_url', 'is', null);
    if (programIds?.length) progQuery = progQuery.in('id', programIds);
    const { data: programs, error: progErr } = await progQuery;
    if (progErr) throw new Error(progErr.message);

    const token = await getSuperCoachToken();

    let programsOk = 0, programsFail = 0, trainingsOk = 0, trainingsFail = 0;
    const failures: Array<{ type: 'program' | 'training'; id: string | number; error: string }> = [];

    for (const prog of programs || []) {
      const scPid = Number(prog.supercoach_program_id);
      if (!scPid) continue;

      // 1) capa do programa
      try {
        await scPatch(token, `/programs/${scPid}`, {
          id: scPid,
          cover_url: prog.poster_url,
          cover_path: true,
          name: prog.title || 'Programa STH METHOD',
          subtitle: prog.subtitle || '',
          published: 1, pay: 0, premium: 0,
        });
        programsOk++;
      } catch (e: any) {
        programsFail++;
        failures.push({ type: 'program', id: prog.id, error: e?.message || String(e) });
        continue; // se o programa falhou, não tenta os trainings dele
      }

      // 2) capa de cada treino do programa
      const { data: tpls } = await admin
        .from('workout_templates')
        .select('id, title, subtitle, image_url, supercoach_training_id')
        .eq('program_id', prog.id)
        .not('supercoach_training_id', 'is', null)
        .not('image_url', 'is', null);

      for (const tpl of tpls || []) {
        const scTid = Number(tpl.supercoach_training_id);
        if (!scTid) continue;
        try {
          await scPatch(token, `/trainings/${scTid}`, {
            id: scTid,
            cover_url: tpl.image_url,
            cover_path: true,
            name: tpl.title || 'Treino',
            subtitle: tpl.subtitle || '',
            program_id: scPid,
            published: 1, pay: 0, premium: 0,
          });
          trainingsOk++;
        } catch (e: any) {
          trainingsFail++;
          failures.push({ type: 'training', id: tpl.id, error: e?.message || String(e) });
        }
      }
    }

    return new Response(JSON.stringify({
      ok: true,
      programs_total: programs?.length || 0,
      programs_synced: programsOk,
      programs_failed: programsFail,
      trainings_synced: trainingsOk,
      trainings_failed: trainingsFail,
      failures: failures.slice(0, 20),
    }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  } catch (e: any) {
    console.error('supercoach-sync-covers error', e);
    return new Response(JSON.stringify({ error: e?.message || 'erro' }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  }
});