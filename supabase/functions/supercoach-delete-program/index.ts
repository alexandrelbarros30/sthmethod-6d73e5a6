// Exclui um programa (e opcionalmente um único training) no ST Coach.
// Chamado ANTES da exclusão local para tentar manter os dois lados alinhados.
// Sempre responde 200; o cliente decide se prossegue mesmo em falha remota.
import { corsHeaders } from 'npm:@supabase/supabase-js@2/cors';
import { createClient } from 'npm:@supabase/supabase-js@2';
import { getSuperCoachToken, SC_COMMON_HEADERS } from '../_shared/supercoach-library.ts';

interface Body { programId?: string; templateId?: string }

const SC = 'https://supertreinosapp.com/api/v2';

async function scDelete(token: string, path: string) {
  const res = await fetch(`${SC}${path}`, {
    method: 'POST',
    headers: {
      ...SC_COMMON_HEADERS,
      authorization: `Bearer ${token}`,
      'content-type': 'application/json',
    },
    body: JSON.stringify({ _method: 'DELETE' }),
  });
  const text = await res.text();
  if (!res.ok) throw new Error(`ST Coach DELETE ${path} (${res.status}): ${text.slice(0, 200)}`);
  return text;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  try {
    const auth = req.headers.get('Authorization') || '';
    if (!auth.startsWith('Bearer ')) throw new Error('Não autenticado');

    const url = Deno.env.get('SUPABASE_URL')!;
    const anon = Deno.env.get('SUPABASE_ANON_KEY')!;
    const service = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const asUser = createClient(url, anon, { global: { headers: { Authorization: auth } } });
    const { data: userRes, error: userErr } = await asUser.auth.getUser();
    if (userErr || !userRes?.user) throw new Error('Não autenticado');
    const admin = createClient(url, service);
    const { data: roles } = await admin
      .from('user_roles').select('role').eq('user_id', userRes.user.id).in('role', ['admin', 'consultor']);
    if (!roles?.length) throw new Error('Apenas admin/consultor podem excluir no ST Coach');

    const body = (await req.json().catch(() => ({}))) as Body;
    if (!body.programId && !body.templateId) throw new Error('programId ou templateId obrigatório');

    const token = await getSuperCoachToken();
    const results: any = { deletedTrainings: [], deletedProgram: null, errors: [] };

    // Coleta ids do ST Coach a partir do banco
    let scProgramId: number | null = null;
    const scTrainingIds: number[] = [];

    if (body.templateId) {
      const { data: tpl } = await admin
        .from('workout_templates')
        .select('supercoach_training_id, supercoach_program_id, program_id')
        .eq('id', body.templateId).maybeSingle();
      if (tpl?.supercoach_training_id) scTrainingIds.push(Number(tpl.supercoach_training_id));
    }

    if (body.programId) {
      const { data: prog } = await admin
        .from('training_programs')
        .select('supercoach_program_id')
        .eq('id', body.programId).maybeSingle();
      if (prog?.supercoach_program_id) scProgramId = Number(prog.supercoach_program_id);
      const { data: tpls } = await admin
        .from('workout_templates')
        .select('supercoach_training_id')
        .eq('program_id', body.programId);
      for (const t of tpls || []) {
        if (t.supercoach_training_id) scTrainingIds.push(Number(t.supercoach_training_id));
      }
    }

    // Deleta trainings primeiro
    for (const tid of Array.from(new Set(scTrainingIds))) {
      try {
        await scDelete(token, `/trainings/${tid}`);
        results.deletedTrainings.push(tid);
      } catch (e: any) {
        results.errors.push({ training: tid, message: e?.message });
      }
    }

    // Depois o programa (só se foi um delete de programa inteiro)
    if (body.programId && scProgramId) {
      try {
        await scDelete(token, `/programs/${scProgramId}`);
        results.deletedProgram = scProgramId;
      } catch (e: any) {
        results.errors.push({ program: scProgramId, message: e?.message });
      }
    }

    return new Response(JSON.stringify({ ok: results.errors.length === 0, ...results }), {
      status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (err) {
    const msg = (err as any)?.message || String(err);
    console.error('[supercoach-delete-program]', msg);
    return new Response(JSON.stringify({ ok: false, error: msg }), {
      status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});