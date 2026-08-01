// STH METHOD AI — motor do app de IA (Cardápio IA, Treino IA, Central de Análise).
// Aplica a periodização da metodologia STH Method: 1 criação por ciclo + 2 revisões
// (cardápio/treino, 30 dias) e 1 análise completa a cada 60 dias.
import { corsHeaders } from 'npm:@supabase/supabase-js@2/cors';
import { createClient } from 'npm:@supabase/supabase-js@2';

const GATEWAY = 'https://ai.gateway.lovable.dev/v1/chat/completions';
const MODEL = 'openai/gpt-5.6-sol';

type Kind = 'diet' | 'workout' | 'analysis';

const CYCLE_DAYS: Record<Kind, number> = { diet: 30, workout: 30, analysis: 60 };
const MAX_REVISIONS: Record<Kind, number> = { diet: 2, workout: 2, analysis: 1 };

const BASE_RULES = `Você é a inteligência oficial do STH METHOD AI.
Regras invioláveis:
- Português do Brasil, tom técnico, elegante, direto e acolhedor. Markdown escaneável.
- NUNCA prescreva, sugira, cite dose ou estratégia de medicamentos, hormônios, peptídeos, anabolizantes, emagrecedores injetáveis ou qualquer substância terapêutica. Se perguntarem, responda que esse tema pertence exclusivamente ao acompanhamento profissional da STH METHOD.
- Nunca use as palavras "médico", "médica", "medicina" ou "medical". A STH METHOD oferece orientação plena e suporte para o alcance do objetivo.
- Nunca prometa resultados milagrosos nem prazos irreais.
- Justifique decisões pela metodologia (fisiologia, aderência, progressão), nunca por argumento comercial.`;

const PROMPTS: Record<Kind, string> = {
  diet: `${BASE_RULES}

Tarefa: montar um PLANEJAMENTO ALIMENTAR completo de 30 dias.
Estrutura obrigatória:
1. "## Resumo estratégico" (objetivo, calorias-alvo, distribuição de macros e justificativa técnica).
2. "## Refeições" — de 4 a 6 refeições, cada uma com alimentos, quantidades em g/ml e kcal/PTN/CHO/GOR da refeição.
3. "## Substituições inteligentes" — 3 alternativas por refeição, equivalentes em macros.
4. "## Hidratação e rotina".
5. "## Como evoluir no ciclo" — ajustes previstos ao longo dos 30 dias.
Máximo 1100 palavras.`,
  workout: `${BASE_RULES}

Tarefa: montar um PROGRAMA DE TREINO periodizado de 30 dias.
Estrutura obrigatória:
1. "## Resumo estratégico" (divisão, frequência, volume semanal e justificativa).
2. "## Treinos" — um bloco por sessão (Treino A, B, C...), tabela com exercício, séries, repetições, descanso e observação técnica.
3. "## Progressão semanal" — semanas 1 a 4.
4. "## Cuidados e adaptações" — equipamentos limitados, dor, tempo curto.
Respeite o nível de treinamento, os equipamentos e a disponibilidade informados.
Máximo 1100 palavras.`,
  analysis: `${BASE_RULES}

Tarefa: gerar um RELATÓRIO INTELIGENTE DE EVOLUÇÃO.
Estrutura obrigatória:
1. "## Leitura do momento" — o que os números e hábitos mostram.
2. "## Evolução" — variação de peso e medidas, com interpretação.
3. "## Pontos fortes" e "## Pontos de atenção".
4. "## Plano dos próximos 60 dias" — 3 a 5 ações objetivas.
Se houver exames citados pelo usuário, faça apenas leitura educativa de contexto, sem conduta terapêutica.
Se arquivos de exame laboratorial forem anexados, leia-os integralmente e inclua a seção "## Leitura laboratorial" com os marcadores encontrados, valor, referência e interpretação educativa. Se o laudo parecer incompleto (marcadores ausentes ou páginas faltando), avise explicitamente que a análise foi feita com dados parciais e que o exame completo deve ser solicitado ao laboratório.
Máximo 900 palavras.`,
};

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), { status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
}

function daysBetween(a: Date, b: Date) {
  return Math.floor((b.getTime() - a.getTime()) / 86_400_000);
}

async function callAi(system: string, user: string | unknown[]) {
  const key = Deno.env.get('LOVABLE_API_KEY');
  if (!key) throw new Error('LOVABLE_API_KEY ausente');
  const res = await fetch(GATEWAY, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Lovable-API-Key': key },
    body: JSON.stringify({
      model: MODEL,
      reasoning_effort: 'none',
      messages: [
        { role: 'system', content: system },
        { role: 'user', content: user },
      ],
    }),
  });
  if (!res.ok) {
    const text = await res.text();
    if (res.status === 429) throw new Error('Limite de uso da IA atingido. Tente novamente em instantes.');
    if (res.status === 402) throw new Error('Créditos de IA esgotados. Fale com o suporte STH METHOD.');
    throw new Error(`Falha na IA [${res.status}]: ${text.slice(0, 300)}`);
  }
  const data = await res.json();
  const content = data?.choices?.[0]?.message?.content?.trim();
  if (!content) throw new Error('Resposta vazia da IA');
  return content as string;
}

function profileBlock(p: any, measurements: any[]) {
  const a = p?.answers ?? {};
  const lines = [
    `Nome: ${p?.full_name ?? '—'}`,
    `Idade: ${p?.age ?? '—'} | Sexo: ${p?.sex ?? '—'}`,
    `Peso: ${p?.weight_kg ?? '—'} kg | Altura: ${p?.height_cm ?? '—'} cm`,
    `Objetivo: ${p?.goal ?? '—'} | Nível: ${p?.training_level ?? '—'}`,
  ];
  const extras = Object.entries(a)
    .filter(([, v]) => v !== null && v !== '' && v !== undefined)
    .map(([k, v]) => `${k}: ${Array.isArray(v) ? v.join(', ') : v}`);
  if (extras.length) lines.push('Perfil avançado:', ...extras);
  if (measurements.length) {
    lines.push('Medidas recentes:');
    for (const m of measurements.slice(0, 6)) {
      lines.push(`- ${m.measured_on}: peso ${m.weight_kg ?? '—'} kg, cintura ${m.waist_cm ?? '—'} cm, quadril ${m.hip_cm ?? '—'} cm, braço ${m.arm_cm ?? '—'} cm`);
    }
  }
  return lines.join('\n');
}

// ===== Etapa 6 — feedback estruturado que realimenta a IA =====
function feedbackBlock(rows: any[]) {
  if (!rows?.length) return '';
  const lines: string[] = ['Feedback estruturado dos ciclos anteriores (do mais recente ao mais antigo):'];
  for (const f of rows) {
    const parts = [
      `- ${new Date(f.created_at).toISOString().slice(0, 10)}`,
      `nota ${f.rating}/5`,
      f.difficulty ? `dificuldade ${f.difficulty}/5` : '',
      f.energy ? `energia ${f.energy}/5` : '',
      f.adherence_pct !== null && f.adherence_pct !== undefined ? `adesão ${f.adherence_pct}%` : '',
    ].filter(Boolean);
    lines.push(parts.join(' | '));
    if (f.worked?.length) lines.push(`  funcionou: ${f.worked.join(', ')}`);
    if (f.blocked?.length) lines.push(`  atrapalhou: ${f.blocked.join(', ')}`);
    if (f.comment) lines.push(`  relato: ${String(f.comment).slice(0, 300)}`);
  }
  lines.push(
    'Diretriz obrigatória: preserve e amplifique o que funcionou, corrija ativamente o que atrapalhou e calibre volume/complexidade pela adesão relatada (adesão abaixo de 70% exige simplificação real do plano). Encerre com a seção "## O que mudou pelo seu feedback" explicando, em até 5 linhas, quais decisões vieram das respostas do usuário.',
  );
  return lines.join('\n');
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) return json({ error: 'Unauthorized' }, 401);

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_ANON_KEY')!,
      { global: { headers: { Authorization: authHeader } } },
    );
    const { data: auth } = await supabase.auth.getClaims(authHeader.replace('Bearer ', ''));
    const userId = auth?.claims?.sub as string | undefined;
    if (!userId) return json({ error: 'Unauthorized' }, 401);

    const body = await req.json().catch(() => ({}));
    const kind = body?.kind as Kind;
    const mode = (body?.mode as 'create' | 'revise') ?? 'create';
    const instruction = typeof body?.instruction === 'string' ? body.instruction.slice(0, 2000) : '';
    const exceptionReason = typeof body?.exception_reason === 'string' ? body.exception_reason.slice(0, 400) : '';
    const fileIds: string[] = Array.isArray(body?.file_ids) ? body.file_ids.filter((x: unknown) => typeof x === 'string').slice(0, 4) : [];
    if (!kind || !PROMPTS[kind]) return json({ error: 'kind inválido' }, 400);

    // ===== Admin bypass (testes internos) =====
    const { data: isAdmin } = await supabase.rpc('has_role', { _user_id: userId, _role: 'admin' });

    // ===== Assinatura ativa =====
    const { data: sub } = await supabase
      .from('ai_app_subscriptions')
      .select('plan, status, expires_at')
      .eq('user_id', userId)
      .eq('status', 'active')
      .gt('expires_at', new Date().toISOString())
      .order('expires_at', { ascending: false })
      .limit(1)
      .maybeSingle();
    if (!sub && !isAdmin) return json({ error: 'subscription_required', message: 'Assinatura do STH Method AI inativa.' }, 402);

    // ===== Perfil =====
    const { data: profile } = await supabase.from('ai_app_profiles').select('*').eq('user_id', userId).maybeSingle();
    if (!profile?.phase1_complete) return json({ error: 'profile_required', message: 'Conclua o cadastro essencial primeiro.' }, 400);
    const { data: measurements } = await supabase
      .from('ai_app_measurements')
      .select('*')
      .eq('user_id', userId)
      .order('measured_on', { ascending: false })
      .limit(8);

    const { data: feedbacks } = await supabase
      .from('ai_app_feedback')
      .select('rating, difficulty, energy, adherence_pct, worked, blocked, comment, created_at')
      .eq('user_id', userId)
      .eq('kind', kind)
      .order('created_at', { ascending: false })
      .limit(4);

    // ===== Periodização =====
    const { data: last } = await supabase
      .from('ai_app_generations')
      .select('*')
      .eq('user_id', userId)
      .eq('kind', kind)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    const cycle = CYCLE_DAYS[kind];
    const elapsed = last ? daysBetween(new Date(last.cycle_start + 'T00:00:00Z'), new Date()) : cycle;

    if (mode === 'create' && last && elapsed < cycle && !exceptionReason) {
      return json({
        error: 'cycle_locked',
        message: `Seu ciclo atual ainda tem ${cycle - elapsed} dia(s). Use uma revisão para ajustar o que precisa — a estrutura principal é preservada por decisão metodológica.`,
        days_remaining: cycle - elapsed,
        revisions_used: last.revisions,
        revisions_left: Math.max(0, MAX_REVISIONS[kind] - last.revisions),
      }, 409);
    }
    if (mode === 'revise') {
      if (!last) return json({ error: 'nothing_to_revise', message: 'Nada gerado ainda neste módulo.' }, 400);
      if (last.revisions >= MAX_REVISIONS[kind]) {
        return json({ error: 'revisions_exhausted', message: 'As revisões deste ciclo foram utilizadas. A próxima criação libera no novo ciclo.' }, 409);
      }
      if (!instruction) return json({ error: 'instruction_required', message: 'Descreva o que deseja ajustar.' }, 400);
    }

    const context = profileBlock(profile, measurements ?? []);
    const fbContext = feedbackBlock(feedbacks ?? []);
    const userPrompt = mode === 'revise'
      ? `Perfil do usuário:\n${context}\n${fbContext ? `\n${fbContext}\n` : ''}\nVersão atual:\n${last!.content}\n\nAjuste pedido: ${instruction}\n\nPreserve a estrutura principal e altere apenas o necessário. Adicione ao final a seção "## O que mudou nesta revisão".`
      : `Perfil do usuário:\n${context}\n${fbContext ? `\n${fbContext}\n` : ''}${instruction ? `\nObservações do usuário: ${instruction}` : ''}${exceptionReason ? `\nExceção registrada: ${exceptionReason}` : ''}`;

    // ===== Anexos de exame laboratorial (somente Central de Análise) =====
    const parts: unknown[] = [];
    if (kind === 'analysis' && fileIds.length) {
      const { data: attachRows } = await supabase
        .from('ai_app_files')
        .select('id, file_name, storage_path')
        .eq('user_id', userId)
        .eq('kind', 'exam')
        .in('id', fileIds);
      for (const row of attachRows ?? []) {
        try {
          const { data: blob, error: dlErr } = await supabase.storage.from('sth-ai').download(row.storage_path);
          if (dlErr || !blob) continue;
          const buf = new Uint8Array(await blob.arrayBuffer());
          if (buf.byteLength > 8 * 1024 * 1024) continue;
          let binary = '';
          for (let i = 0; i < buf.length; i += 8192) binary += String.fromCharCode(...buf.subarray(i, i + 8192));
          const b64 = btoa(binary);
          const name = String(row.file_name ?? 'exame');
          const mime = blob.type || (name.toLowerCase().endsWith('.pdf') ? 'application/pdf' : 'image/jpeg');
          if (mime.startsWith('image/')) {
            parts.push({ type: 'image_url', image_url: { url: `data:${mime};base64,${b64}` } });
          } else {
            parts.push({ type: 'file', file: { filename: name, file_data: `data:${mime};base64,${b64}` } });
          }
        } catch (_e) { /* ignora anexo inválido */ }
      }
    }

    const aiInput = parts.length
      ? [{ type: 'text', text: `${userPrompt}\n\nExames laboratoriais anexados pelo usuário estão em anexo. Leia todos integralmente.` }, ...parts]
      : userPrompt;

    const content = await callAi(PROMPTS[kind], aiInput);


    let saved;
    if (mode === 'revise') {
      const { data, error } = await supabase
        .from('ai_app_generations')
        .update({ content, revisions: last!.revisions + 1 })
        .eq('id', last!.id)
        .select()
        .single();
      if (error) throw error;
      saved = data;
    } else {
      const { data, error } = await supabase
        .from('ai_app_generations')
        .insert({
          user_id: userId,
          kind,
          content,
          revisions: 0,
          exception_reason: exceptionReason || null,
          meta: { plan: sub.plan, model: MODEL },
        })
        .select()
        .single();
      if (error) throw error;
      saved = data;
    }

    return json({
      generation: saved,
      revisions_left: Math.max(0, MAX_REVISIONS[kind] - saved.revisions),
      cycle_days: cycle,
    });
  } catch (err) {
    console.error('sth-ai-app', err);
    return json({ error: String((err as Error)?.message ?? err) }, 500);
  }
});