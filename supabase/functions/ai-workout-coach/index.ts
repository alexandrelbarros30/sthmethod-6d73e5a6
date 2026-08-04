// STHIA — Elite Coach AI. Gera programas de treino, opera como copiloto de
// ajustes e realiza análise visual de estética corporal, usando o dossiê do
// aluno + o prompt-mestre editável (crm_settings.ai_prompt_treino).
import { corsHeaders } from 'npm:@supabase/supabase-js@2/cors';
import { createClient } from 'npm:@supabase/supabase-js@2';
import { buildStudentContext } from '../_shared/student-context.ts';
import { getSuperCoachLibrary } from '../_shared/supercoach-library.ts';
import { STHIA_TRAINING_DOCTRINE } from '../_shared/sthia-training-doctrine.ts';

type Mode = 'generate' | 'copilot' | 'analyze';

interface Body {
  studentId?: string;
  mode: Mode;
  instruction?: string;
  imageUrls?: string[]; // https URLs ou data URLs (base64)
  history?: { role: 'user' | 'assistant'; content: string }[];
  stream?: boolean;
}

const DEFAULT_PROMPT = 'Você é o STH METHOD ELITE COACH. Monte respostas técnicas e humanas em português do Brasil, formatadas em Markdown.';

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_ANON_KEY')!,
      { global: { headers: { Authorization: authHeader } } },
    );
    const admin = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
    );

    const { data: auth } = await supabase.auth.getClaims(authHeader.replace('Bearer ', ''));
    const userId = auth?.claims?.sub as string | undefined;
    if (!userId) return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });

    // Autorização: apenas admin ou consultant
    const { data: rolesData } = await admin.from('user_roles').select('role').eq('user_id', userId);
    const roles = (rolesData || []).map((r: any) => r.role);
    if (!roles.includes('admin') && !roles.includes('consultant') && !roles.includes('consultor')) {
      return new Response(JSON.stringify({ error: 'Forbidden' }), { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    const body = (await req.json().catch(() => ({}))) as Body;
    const mode: Mode = (body.mode || 'generate') as Mode;
    const instruction = (body.instruction || '').trim();
    if (!instruction && mode !== 'analyze') {
      return new Response(JSON.stringify({ error: 'instruction required' }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    // Prompt-mestre editável
    const { data: cfg } = await admin.from('crm_settings').select('value').eq('key', 'ai_prompt_treino').maybeSingle();
    const stored = (cfg?.value as any)?.prompt;
    const systemPrompt = (typeof stored === 'string' && stored.trim()) ? stored.trim() : DEFAULT_PROMPT;

    // Dossiê do aluno (se informado)
    let dossier = '';
    // Gênero explícito do aluno (para direcionar a prescrição corretamente)
    let studentGenderDirective = '';
    // Imagens corporais do aluno (atuais + históricas para comparação evolutiva)
    const studentImageUrls: string[] = [];
    let imagesSummary = '';
    if (body.studentId) {
      try {
        dossier = await buildStudentContext(admin, body.studentId);
      } catch (_) { /* silencioso */ }
      try {
        const { data: prof } = await admin
          .from('profiles')
          .select('gender, full_name')
          .eq('id', body.studentId)
          .maybeSingle();
        const g = String(prof?.gender || '').toLowerCase();
        const nome = String(prof?.full_name || '').split(' ')[0] || 'o(a) aluno(a)';
        if (g.startsWith('f') || g.includes('fem') || g.includes('mulher')) {
          studentGenderDirective = `ATENÇÃO — GÊNERO DO(A) ALUNO(A): FEMININO (${nome}). Toda a prescrição deve priorizar objetivos e ênfases femininas típicas (glúteos, posterior de coxa, abdutores, membros inferiores, redução de cintura, postura, ombros com ênfase estética), seleção de exercícios, volume e linguagem no feminino. NÃO monte um treino masculinizado.`;
        } else if (g.startsWith('m') || g.includes('masc') || g.includes('homem')) {
          studentGenderDirective = `ATENÇÃO — GÊNERO DO(A) ALUNO(A): MASCULINO (${nome}). Prescrição com ênfase em hipertrofia global, membros superiores, densidade e força, linguagem no masculino.`;
        } else {
          studentGenderDirective = `ATENÇÃO — GÊNERO DO(A) ALUNO(A) NÃO INFORMADO. Pergunte antes de assumir; se precisar seguir, mantenha linguagem neutra.`;
        }
      } catch (_) { /* silencioso */ }
      try {
        const { data: imgs } = await admin
          .from('body_images')
          .select('type, storage_path, image_url, uploaded_at, is_current')
          .eq('user_id', body.studentId)
          .order('uploaded_at', { ascending: false })
          .limit(24);
        if (Array.isArray(imgs) && imgs.length) {
          // Assina URLs do bucket body-images quando houver storage_path
          const signed = await Promise.all(imgs.map(async (im: any) => {
            let url: string | null = null;
            if (im.storage_path) {
              const { data: s } = await admin.storage
                .from('body-images')
                .createSignedUrl(im.storage_path, 60 * 60);
              url = s?.signedUrl ?? null;
            }
            if (!url && typeof im.image_url === 'string' && im.image_url.startsWith('http')) {
              url = im.image_url;
            }
            return url ? { ...im, _url: url } : null;
          }));
          const valid = signed.filter(Boolean) as any[];

          // Seleciona: até 3 atuais (front/back/profile) + até 3 mais antigas para comparação
          const current = valid.filter((v) => v.is_current);
          const older = valid.filter((v) => !v.is_current);
          const picked = [...current.slice(0, 3), ...older.slice(0, 3)];
          for (const p of picked) studentImageUrls.push(p._url);

          const fmt = (d: string) => new Date(d).toLocaleDateString('pt-BR');
          const lines = picked.map((p) => `- ${p.type} · ${p.is_current ? 'ATUAL' : 'anterior'} · ${fmt(p.uploaded_at)}`);
          imagesSummary = `\nImagens corporais anexadas para análise (${picked.length}):\n${lines.join('\n')}\n(Use as ATUAIS para o estado presente e as anteriores para comparação evolutiva.)`;
        }
      } catch (e) {
        console.error('body_images fetch error', e);
      }
    }

    // Instrução específica por modo
    const modeInstr = mode === 'generate'
      ? 'MODO: GERADOR COMPLETO. Entregue um programa de treino individualizado (anamnese usando o dossiê acima quando disponível → perfil → estratégia → periodização → divisão semanal → treinos completos com séries, reps, descanso, RPE/RIR → progressão → indicadores → critérios de revisão). Termine com o bloco "PLANO DE EXECUÇÃO NA PLATAFORMA" resumindo: nome sugerido do programa, semanas, dias/semana, minutos/dia, e lista de treinos com exercícios (nome — séries x reps — descanso).'
      : mode === 'copilot'
        ? 'MODO: COPILOTO. Responda de forma cirúrgica a instrução do treinador (sugerir progressão, trocar exercício, ajustar volume, redistribuir semana, corrigir ponto fraco, etc.). Seja direto, técnico e prático, com justificativa curta. Não repita o programa inteiro se não for pedido.'
        : 'MODO: ANÁLISE VISUAL. Faça a avaliação estética corporal com base nas imagens fornecidas: proporções, desenvolvimento por grupo muscular (escala Muito abaixo/Abaixo/Adequado/Bom/Excelente), pontos fortes e fracos, estimativas visuais (deixando claro que são visuais), e estratégia recomendada. Se houver mais de uma imagem de momentos distintos, faça também a comparação evolutiva. Fundamente APENAS no que é visível.';

    // Catálogo obrigatório de exercícios (ST Coach) — a IA deve usar SOMENTE itens desta lista.
    let libraryBlock = '';
    let libraryCount = 0;
    try {
      const lib = await getSuperCoachLibrary();
      if (lib.length) {
        // Dedup por nome, preservando o primeiro id.
        const seen = new Set<string>();
        const unique: { id: string | number; name: string }[] = [];
        for (const e of lib) {
          const key = e.name.trim();
          if (!key || seen.has(key.toLowerCase())) continue;
          seen.add(key.toLowerCase());
          unique.push({ id: e.id, name: key });
        }
        unique.sort((a, b) => a.name.localeCompare(b.name, 'pt-BR'));
        // Cap agressivo — catálogo enorme (1200+ exercícios) estava estourando
        // o wall-clock da edge function quando combinado com streaming +
        // multimodal, causando "Failed to fetch" no cliente.
        const capped = unique.slice(0, 400);
        libraryCount = capped.length;
        libraryBlock = [
          '',
          '=== CATÁLOGO OFICIAL DE EXERCÍCIOS (ST Coach) — FONTE ÚNICA E OBRIGATÓRIA ===',
          'REGRA INEGOCIÁVEL (não há exceção):',
          '1) Você SÓ pode prescrever exercícios cujo nome apareça EXATAMENTE nesta lista (mesma grafia, incluindo acentos e maiúsculas).',
          '2) É PROIBIDO inventar, traduzir, abreviar, adaptar, combinar ou "criar variação nova" de exercício. Nada fora deste catálogo pode ir para o treino final.',
          '3) Ao citar um exercício no plano final, SEMPRE anexe o tag do ST Coach no formato `[SC:<id>]` logo após o nome. Exemplo: `Supino reto com barra [SC:1234] — 4x8 — 90s`.',
          '4) Se o estímulo ideal não existir no catálogo, escolha a alternativa mais próxima QUE EXISTA na lista e justifique a substituição em uma linha.',
          '5) Se por algum motivo você não conseguir localizar um exercício adequado na lista, diga explicitamente "sem correspondente no ST Coach" — NUNCA fabrique um nome.',
          `Total disponível nesta chamada: ${libraryCount}${unique.length > libraryCount ? ` (de ${unique.length}, limitado por contexto)` : ''}.`,
          'Formato de cada linha: `<id> | <nome oficial>`',
          capped.map((e) => `${e.id} | ${e.name}`).join('\n'),
          '=== FIM DO CATÁLOGO ===',
        ].join('\n');
      }
    } catch (e) {
      console.error('supercoach library fetch failed', e);
    }

    // Reforço no system prompt — a IA precisa entender que a fonte é o banco do ST Coach.
    const reinforcedSystem = [
      systemPrompt,
      '',
      STHIA_TRAINING_DOCTRINE,
      '',
      studentGenderDirective,
      '',
      'REGRA ABSOLUTA DE EXERCÍCIOS:',
      '1. Use EXCLUSIVAMENTE a lista do ST Coach injetada abaixo. PROIBIDO inventar.',
      '2. Cada exercício selecionado DEVE ser seguido de [SC:<id>].',
      '3. Respeite rigorosamente a divisão A-B-C-D-E e volumes definidos na Doutrina STHIA.',
      libraryCount ? `Catálogo desta sessão contém ${libraryCount} exercícios do ST Coach.` : 'ATENÇÃO: catálogo do ST Coach indisponível nesta chamada — avise o treinador e não invente exercícios.',
    ].filter(Boolean).join('\n');

    const userText = [
      dossier,
      imagesSummary,
      libraryBlock,
      modeInstr,
      instruction ? `\nInstrução do treinador:\n${instruction}` : '',
    ].filter(Boolean).join('\n\n');

    // Monta mensagens (multimodal para modo analyze)
    const messages: any[] = [{ role: 'system', content: reinforcedSystem }];
    if (Array.isArray(body.history)) {
      for (const h of body.history.slice(-8)) {
        if (h?.role && h?.content) messages.push({ role: h.role, content: h.content });
      }
    }

    // Combina imagens enviadas manualmente + imagens automáticas do dossiê do aluno
    const allImages: string[] = [];
    if (Array.isArray(body.imageUrls)) {
      for (const u of body.imageUrls) if (typeof u === 'string' && u.trim()) allImages.push(u.trim());
    }
    for (const u of studentImageUrls) if (!allImages.includes(u)) allImages.push(u);

    if (allImages.length) {
      const content: any[] = [{ type: 'text', text: userText }];
      for (const url of allImages.slice(0, 8)) {
        content.push({ type: 'image_url', image_url: { url } });
      }
      messages.push({ role: 'user', content });
    } else {
      messages.push({ role: 'user', content: userText });
    }

    const apiKey = Deno.env.get('LOVABLE_API_KEY');
    if (!apiKey) throw new Error('LOVABLE_API_KEY missing');
    // Modelo estável do gateway. `gemini-3-flash-preview` era o preview e
    // vinha derrubando conexões longas com contexto grande.
    const model = 'google/gemini-3.6-flash';
    const wantStream = body.stream === true;

    if (wantStream) {
      let upstream: Response;
      try {
        upstream = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${apiKey}` },
          body: JSON.stringify({ model, messages, stream: true }),
        });
      } catch (e) {
        console.error('upstream fetch failed', e);
        return new Response(JSON.stringify({ error: 'Falha ao conectar com o provedor de IA. Tente novamente.', code: 502, model, details: String((e as any)?.message || e), when: new Date().toISOString() }), { status: 502, headers: { ...corsHeaders, 'Content-Type': 'application/json', 'X-Model': model } });
      }
      if (upstream.status === 429) {
        return new Response(JSON.stringify({ error: 'Limite de uso da IA atingido. Aguarde alguns instantes e tente novamente.', code: 429, model }), { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json', 'X-Model': model } });
      }
      if (upstream.status === 402) {
        return new Response(JSON.stringify({ error: 'Créditos de IA esgotados no workspace. Adicione créditos para continuar.', code: 402, model }), { status: 402, headers: { ...corsHeaders, 'Content-Type': 'application/json', 'X-Model': model } });
      }
      if (!upstream.ok || !upstream.body) {
        const t = await upstream.text().catch(() => '');
        return new Response(JSON.stringify({ error: 'Falha no provedor de IA. Tente novamente em instantes.', code: upstream.status || 500, model, details: (t || '').slice(0, 800), when: new Date().toISOString() }), { status: upstream.status || 500, headers: { ...corsHeaders, 'Content-Type': 'application/json', 'X-Model': model } });
      }
      return new Response(upstream.body, {
        status: 200,
        headers: {
          ...corsHeaders,
          'Content-Type': 'text/event-stream',
          'Cache-Control': 'no-cache',
          'Connection': 'keep-alive',
          'X-Model': model,
        },
      });
    }

    const resp = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${apiKey}` },
      body: JSON.stringify({ model, messages }),
    });
    const data = await resp.json().catch(() => ({}));
    if (resp.status === 429) {
      return new Response(JSON.stringify({ error: 'Limite de uso da IA atingido. Aguarde alguns instantes e tente novamente.', code: 429, model }), { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json', 'X-Model': model } });
    }
    if (resp.status === 402) {
      return new Response(JSON.stringify({ error: 'Créditos de IA esgotados no workspace. Adicione créditos para continuar.', code: 402, model }), { status: 402, headers: { ...corsHeaders, 'Content-Type': 'application/json', 'X-Model': model } });
    }
    if (!resp.ok) {
      return new Response(JSON.stringify({ error: 'Falha no provedor de IA.', code: resp.status, model, details: JSON.stringify(data).slice(0, 800), when: new Date().toISOString() }), { status: resp.status, headers: { ...corsHeaders, 'Content-Type': 'application/json', 'X-Model': model } });
    }
    const response = (data as any)?.choices?.[0]?.message?.content || '';
    const usage = (data as any)?.usage || null;

    // Log leve para auditoria
    try {
      await admin.from('crm_ai_runs').insert({
        prompt: userText.slice(0, 8000),
        response: response.slice(0, 12000),
        model,
        created_at: new Date().toISOString(),
      });
    } catch (_) { /* ignore */ }

    return new Response(JSON.stringify({ response, model, mode, usage }), { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json', 'X-Model': model } });
  } catch (err) {
    console.error('ai-workout-coach', err);
    return new Response(JSON.stringify({ error: String((err as any)?.message || err), code: 500, model: 'google/gemini-3.6-flash', when: new Date().toISOString() }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  }
});