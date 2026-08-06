// STH METHOD AI — motor do app de IA (Cardápio IA, Treino IA, Central de Análise).
// Aplica a periodização da metodologia STH Method: 1 criação por ciclo + 3 revisões
// (cardápio/treino, 30 dias) e 1 análise completa a cada 60 dias.
import { corsHeaders } from 'npm:@supabase/supabase-js@2/cors';
import { createClient } from 'npm:@supabase/supabase-js@2';
import { STHIA_TRAINING_DOCTRINE } from '../_shared/sthia-training-doctrine.ts';
import { STHIA_DIET_FORMAT } from '../_shared/sthia-diet-format.ts';
import { recalcDietMacros } from '../_shared/diet-macros.ts';

const GATEWAY = 'https://ai.gateway.lovable.dev/v1/chat/completions';
const MODEL = 'google/gemini-2.0-pro-exp-02-05:free';

type Kind = 'diet' | 'workout' | 'analysis';

const CYCLE_DAYS: Record<Kind, number> = { diet: 30, workout: 30, analysis: 60 };
const MAX_REVISIONS: Record<Kind, number> = { diet: 3, workout: 3, analysis: 1 };

const BASE_RULES = `Você é a inteligência oficial do STH METHOD AI (STHIA).
Regras invioláveis:
- Português do Brasil, tom técnico, elegante, direto e acolhedor. Markdown escaneável.
- NUNCA prescreva, sugira, cite dose ou estratégia de medicamentos, hormônios, peptídeos, anabolizantes, emagrecedores injetáveis ou qualquer substância terapêutica. Se perguntarem, responda que esse tema pertence exclusivamente ao acompanhamento profissional da STH METHOD.
- Nunca use as palavras "médico", "médica", "medicina" ou "medical". A STH METHOD oferece orientação plena e suporte para o alcance do objetivo.
- Nunca prometa resultados milagrosos nem prazos irreais.
- Justifique decisões pela metodologia (fisiologia, aderência, progressão), nunca por argumento comercial.
- PRECISÃO NUTRICIONAL: Você deve ser rigoroso no cálculo de kcal e macros (P=4, C=4, G=9). Use a tabela TACO/FatSecret como referência real. O usuário confia na sua exatidão matemática.`;

const PROMPTS: Record<Kind, string> = {
  diet: `${BASE_RULES}

ATENÇÃO — SOBREPOSIÇÃO DE FORMATO: para o CARDÁPIO, a regra de "markdown" acima NÃO se aplica. A saída deve ser 100% HTML puro. É PROIBIDO usar "#", "##", "###", "**", "-" de lista ou qualquer marcação markdown. Qualquer resposta em markdown é considerada inválida.

Tarefa: montar um PLANEJAMENTO ALIMENTAR completo de 30 dias, com a MESMA identidade visual e textual do cardápio do portal STH METHOD.
Saída em HTML puro (nunca markdown), na ordem:
1. <h3>Resumo estratégico</h3> — objetivo, GET, meta de kcal, distribuição de macros e justificativa técnica.
2. As refeições (4 a 6), cada uma com refeição BASE + 5 opções (Opção 2 a 6), exatamente no formato abaixo.
3. <h3>Hidratação e rotina</h3>.
4. <h3>Como evoluir no ciclo</h3> — ajustes previstos ao longo dos 30 dias.
${STHIA_DIET_FORMAT}
REGRAS DE ENERGIA: quando o briefing trouxer o gasto energético total (GET/TDEE) e a meta de kcal e macros, use EXATAMENTE esses números como alvo — o somatório das refeições deve fechar a meta com tolerância de ±5%. Nunca recalcule por conta própria nem arredonde para múltiplos de 100. Exiba o GET e a meta na seção "Resumo estratégico".
OBJETIVO: a meta de kcal enviada no briefing JÁ contempla o objetivo do usuário (manutenção = manter o GET, emagrecimento = déficit, hipertrofia = superávit). É PROIBIDO aplicar déficit ou superávit adicional por conta própria: se o objetivo é manter peso, o cardápio fecha exatamente na meta de manutenção.
AUDITORIA NUTRICIONAL AUTOMÁTICA: as kcal e macros do cabeçalho de cada refeição são RECALCULADOS pelo sistema, item a item, sobre a refeição BASE (tabela TACO). Por isso: (a) escolha as porções da BASE de modo que os alimentos realmente entreguem a energia declarada; (b) todo item da BASE precisa ter quantidade explícita em g/ml (ou "2 ovos (100g)"), separada por " + "; (c) use nomes simples de alimentos brasileiros (arroz branco, frango grelhado, aveia, banana, azeite...). Números inventados serão substituídos pelos reais.
RESTRIÇÃO DE PROTOCOLO: nunca consulte, cite ou considere protocolos, medicamentos, hormônios, peptídeos ou suplementação terapêutica registrados na STH METHOD. O cardápio é exclusivamente alimentar.
Máximo 1100 palavras.`,
  workout: `${BASE_RULES}

Tarefa: montar um PROGRAMA DE TREINO periodizado de 30 dias.
Estrutura obrigatória:
1. "## Resumo estratégico" (divisão, frequência, volume semanal e justificativa).
2. "## Treinos" — um bloco por sessão com título no formato "### Treino A — Peito e Tríceps". Dentro de cada sessão, uma tabela markdown com EXATAMENTE as colunas: | Exercício | Séries | Repetições | Descanso | Observação |
3. O cardio e o abdominal/core entram DENTRO das tabelas dos treinos (A, B, C...), conforme a doutrina STHIA abaixo. Não crie seção separada "## Cardio".
4. "## Progressão semanal" — semanas 1 a 4.
5. "## Cuidados e adaptações" — equipamentos limitados, dor, tempo curto.
Respeite o nível de treinamento, os equipamentos e a disponibilidade informados.
REGRA CRÍTICA DE BIBLIOTECA: na coluna "Exercício" use SOMENTE nomes que existam, escritos de forma idêntica (mesma grafia e acentuação), na BIBLIOTECA OFICIAL ST COACH enviada no contexto. É proibido inventar nomes ou usar variações não listadas — todo exercício precisa ter vídeo do ST Coach para ser exibido ao aluno. Se faltar o exercício ideal, escolha o mais próximo que exista na biblioteca.
${STHIA_TRAINING_DOCTRINE}
Máximo 1500 palavras.`,
  analysis: `${BASE_RULES}

Tarefa: gerar um RELATÓRIO INTELIGENTE DE EVOLUÇÃO.
Estrutura obrigatória:
1. "## Leitura do momento" — o que os números e hábitos mostram.
2. "## Evolução" — variação de peso e medidas, com interpretação.
3. "## Pontos fortes" e "## Pontos de atenção".
4. "## Plano dos próximos 60 dias" — 3 a 5 ações objetivas.
Se houver exames citados pelo usuário, faça apenas leitura educativa de contexto, sem conduta terapêutica.
Se arquivos de exame laboratorial forem anexados, leia-os integralmente e inclua OBRIGATORIAMENTE a seção "## Interpretação laboratorial" contendo uma tabela markdown com EXATAMENTE estas colunas e nesta ordem:
| Marcador | Valor | Referência | Status | Leitura |
Regras da tabela: uma linha por marcador encontrado; "Valor" com número e unidade (ex: 512 ng/dL); "Referência" com a faixa no formato "240 a 950" ou "< 100"; "Status" apenas com uma destas palavras: Baixo, Ótimo, Atenção ou Alto; "Leitura" com uma frase curta educativa. Nunca use listas no lugar da tabela. Se o laudo parecer incompleto (marcadores ausentes ou páginas faltando), avise explicitamente que a análise foi feita com dados parciais e que o exame completo deve ser solicitado ao laboratório.
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

function profileBlock(p: any, measurements: any[], master?: any) {
  const a = p?.answers ?? {};
  const lines = [
    `Nome: ${p?.full_name ?? '—'}`,
    `Idade: ${p?.age ?? '—'} | Sexo: ${p?.sex ?? '—'}`,
    `Peso: ${p?.weight_kg ?? '—'} kg | Altura: ${p?.height_cm ?? '—'} cm`,
    `Objetivo: ${p?.goal ?? '—'} | Nível: ${p?.training_level ?? '—'}`,
  ];
  const comorb = p?.comorbidities ?? a?.comorbidities ?? master?.comorbidities ?? '';
  const meds = p?.medications ?? a?.medications ?? master?.medications ?? '';
  lines.push(
    '⚠️ DADOS CLÍNICOS SENSÍVEIS (obrigatório considerar em cardápio, treino e análise):',
    `- Comorbidades: ${comorb || 'não informado'}`,
    `- Medicamentos em uso: ${meds || 'não informado'}`,
    'Adapte alimentos, distribuição de macros, volume/intensidade do treino e recomendações a essas condições e possíveis interações. Nunca prescreva, altere ou sugira suspensão de medicamentos — oriente sempre a falar com a consultoria.',
  );
  const extras = Object.entries(a)
    .filter(([, v]) => v !== null && v !== '' && v !== undefined)
    .map(([k, v]) => `${k}: ${Array.isArray(v) ? v.join(', ') : v}`);
  if (extras.length) lines.push('Perfil avançado:', ...extras);
  if (master) {
    const masterLabels: Record<string, string> = {
      objective: 'Objetivo declarado no cadastro',
      physical_activity: 'Atividade física',
      physical_activity_level: 'Nível de atividade diária (NEAT)',
      activity_type: 'Tipo de treino',
      does_cardio: 'Faz cardio',
      current_protocol: 'Protocolo atual em uso',
      additional_info: 'Informações adicionais relatadas',
      training_days_per_week: 'Treinos por semana',
      training_duration_minutes: 'Duração do treino (min)',
      training_intensity: 'Intensidade do treino',
      cardio_days_per_week: 'Cardio por semana',
      cardio_duration_minutes: 'Duração do cardio (min)',
      cardio_intensity: 'Intensidade do cardio',
      daily_calories: 'Meta calórica calculada (kcal)',
      protein_g: 'Proteína alvo (g)',
      carbs_g: 'Carboidrato alvo (g)',
      fat_g: 'Gordura alvo (g)',
      bmr: 'TMB', tdee: 'GET (TDEE)', gender: 'Sexo', birth_date: 'Data de nascimento',
    };
    const masterLines = Object.entries(masterLabels)
      .map(([k, label]) => [label, (master as any)[k]] as const)
      .filter(([, v]) => v !== null && v !== undefined && v !== '')
      .map(([label, v]) => `- ${label}: ${typeof v === 'boolean' ? (v ? 'sim' : 'não') : v}`);
    if (masterLines.length) {
      lines.push(
        'CADASTRO COMPLETO STH METHOD (uso obrigatório — cada campo abaixo, inclusive os de texto livre, deve influenciar as decisões do plano):',
        ...masterLines,
      );
    }
  }
  lines.push('REGRA INEGOCIÁVEL: todos os dados do cadastro acima são insumo obrigatório. Nenhum campo preenchido pode ser ignorado na construção do cardápio, do treino ou da análise.');
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

    // ===== Admin / contas demo bypass (testes internos e apresentação) =====
    const { data: isAdmin } = await supabase.rpc('has_role', { _user_id: userId, _role: 'admin' });
    const DEMO_EMAILS = ['alexandrelbarros30@gmail.com'];
    const claimEmail = String((auth?.claims as any)?.email ?? '').trim().toLowerCase();
    const unlimited = Boolean(isAdmin) || DEMO_EMAILS.includes(claimEmail);

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
    if (!sub && !unlimited) return json({ error: 'subscription_required', message: 'Assinatura do STH Method AI inativa.' }, 402);

    // ===== Perfil =====
    const { data: profile } = await supabase.from('ai_app_profiles').select('*').eq('user_id', userId).maybeSingle();
    if (!profile?.phase1_complete) return json({ error: 'profile_required', message: 'Conclua o cadastro essencial primeiro.' }, 400);
    const { data: master } = await supabase
      .from('profiles')
      .select('full_name, objective, physical_activity, physical_activity_level, activity_type, does_cardio, current_protocol, comorbidities, medications, additional_info, training_days_per_week, training_duration_minutes, training_intensity, cardio_days_per_week, cardio_duration_minutes, cardio_intensity, daily_calories, protein_g, carbs_g, fat_g, bmr, tdee, gender, birth_date')
      .eq('user_id', userId)
      .maybeSingle();
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

    if (mode === 'create' && last && elapsed < cycle && !exceptionReason && !unlimited) {
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
      if (last.revisions >= MAX_REVISIONS[kind] && !unlimited) {
        return json({ error: 'revisions_exhausted', message: 'As revisões deste ciclo foram utilizadas. A próxima criação libera no novo ciclo.' }, 409);
      }
      if (!instruction) return json({ error: 'instruction_required', message: 'Descreva o que deseja ajustar.' }, 400);
    }

    const context = profileBlock(profile, measurements ?? [], master);
    const fbContext = feedbackBlock(feedbacks ?? []);

    // ===== Biblioteca oficial de exercícios do ST COACH (somente itens com vídeo) =====
    let libraryBlock = '';
    let libraryNames: string[] = [];
    if (kind === 'workout') {
      const { data: lib } = await supabase.rpc('get_stcoach_exercise_catalog');
      libraryNames = (lib ?? []).map((e: any) => String(e.name));
      if (libraryNames.length) {
        libraryBlock = `BIBLIOTECA OFICIAL ST COACH (use apenas estes nomes, grafia idêntica):\n${libraryNames.join('; ')}`;
      }
    }

    const userPrompt = mode === 'revise'
      ? `Perfil do usuário:\n${context}\n${fbContext ? `\n${fbContext}\n` : ''}${libraryBlock ? `\n${libraryBlock}\n` : ''}\nVERSÃO ANTERIOR (a ser corrigida):\n${last!.content}\n\nAJUSTE PEDIDO (CONTRA-RESPOSTA): ${instruction}\n\nINSTRUÇÃO CRÍTICA (RIGOR TOTAL): O usuário não gostou da versão anterior e está enviando uma contra-resposta específica. Analise os detalhes acima e REFAÇA o plano incorporando EXATAMENTE as mudanças pedidas (ex: inclusão de gelatina zero, substituição de alimentos específicos, correção de kcal). O cumprimento das solicitações de ajuste e inclusão de novos alimentos é MANDATÓRIO e prioritário sobre a versão anterior. Se o usuário pedir um alimento específico (ex: Gelatina Zero), ele DEVE aparecer na BASE ou nas opções. Mantenha a estrutura e o que não foi criticado. Não repita o erro da versão anterior. Realize cálculos internos precisos (padrão FatSecret/TACO) para garantir que os macros e kcal reflitam a realidade dos alimentos solicitados. Adicione ao final a seção "## O que mudou nesta revisão".`
      : `Perfil do usuário:\n${context}\n${fbContext ? `\n${fbContext}\n` : ''}${libraryBlock ? `\n${libraryBlock}\n` : ''}${instruction ? `\nObservações do usuário: ${instruction}` : ''}${exceptionReason ? `\nExceção registrada: ${exceptionReason}` : ''}`;

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

    let content = await callAi(PROMPTS[kind], aiInput);

    // Auditoria nutricional: kcal/macros das refeições recalculados sobre a BASE (TACO).
    let dietTotals: unknown = null;
    if (kind === 'diet') {
      // Alvos vindos do briefing confirmado pelo usuário.
      const num = (re: RegExp) => {
        const m = String(instruction ?? '').match(re);
        return m ? Number(m[1]) : null;
      };
      const targetKcal = num(/Kcal alvo:\s*([\d.]+)/i);
      const targetP = num(/Prote[ií]na:\s*([\d.]+)/i);
      const targetC = num(/Carboidrato:\s*([\d.]+)/i);
      const targetF = num(/Lip[ií]dio:\s*([\d.]+)/i);

      let audit = recalcDietMacros(content);

      // Ciclo de convergência: enquanto o somatório real (TACO) estiver fora de ±5%
      // do alvo, a IA reajusta as PORÇÕES das refeições BASE e recalculamos de novo.
      if (targetKcal && targetKcal > 0) {
        for (let attempt = 0; attempt < 2; attempt++) {
          const diff = audit.totals.kcal - targetKcal;
          if (Math.abs(diff) / targetKcal <= 0.05) break;
          const fix = `Auditoria nutricional do sistema (tabela TACO, calculada item a item sobre as refeições BASE):
- Total atual: ${Math.round(audit.totals.kcal)} kcal | P ${Math.round(audit.totals.p)}g / C ${Math.round(audit.totals.c)}g / G ${Math.round(audit.totals.f)}g
- Meta obrigatória: ${targetKcal} kcal${targetP ? ` | P ${targetP}g` : ''}${targetC ? ` / C ${targetC}g` : ''}${targetF ? ` / G ${targetF}g` : ''}
- Desvio: ${diff > 0 ? '+' : ''}${Math.round(diff)} kcal (${((diff / targetKcal) * 100).toFixed(1)}%)

Reescreva o MESMO cardápio integralmente (HTML puro, mesma estrutura, mesmas refeições e mesmo formato), ${diff > 0 ? 'REDUZINDO' : 'AUMENTANDO'} as porções em gramas/ml dos itens das refeições BASE e das opções até que o somatório real feche a meta com tolerância de ±5%. Ajuste preferencialmente carboidratos e gorduras, preservando a proteína próxima do alvo. Toda quantidade deve continuar explícita em g/ml. Não invente números nos cabeçalhos: o sistema recalcula.`;
          try {
            content = await callAi(PROMPTS[kind], `${userPrompt}\n\nVersão atual do cardápio:\n${content}\n\n${fix}`);
            audit = recalcDietMacros(content);
          } catch (_e) {
            break;
          }
        }
      }

      content = audit.html;
      dietTotals = {
        kcal: Math.round(audit.totals.kcal),
        protein_g: Math.round(audit.totals.p),
        carbs_g: Math.round(audit.totals.c),
        fat_g: Math.round(audit.totals.f),
        meals_recalculated: audit.recalculated,
        target_kcal: targetKcal,
        target_protein_g: targetP,
        target_carbs_g: targetC,
        target_fat_g: targetF,
      };
    }

    // Quais exercícios da biblioteca foram efetivamente usados (para render em cards com vídeo).
    const usedExercises = kind === 'workout'
      ? libraryNames.filter((n) => content.toLowerCase().includes(n.toLowerCase())).slice(0, 120)
      : [];


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
          meta: { plan: sub?.plan ?? 'admin', model: MODEL, library_exercises: usedExercises, diet_totals: dietTotals },
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