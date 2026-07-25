// Prompt oficial para geração de capas de programas de treino STH METHOD.
// Estética Apple pura: fundo preto profundo, iluminação cinematográfica,
// personagem realista em movimento (homem = faixa azul, mulher = faixa rosa),
// escudo oficial STH METHOD no topo e nome do programa dentro da faixa.
export function buildProgramCoverPrompt(title: string, gender: 'F' | 'M'): string {
  const isF = gender === 'F';

  const character = isF
    ? 'an athletic female fitness model performing a strength-training exercise (dumbbell curl, hip thrust, squat, cable row or similar) — toned defined physique, generic sportswear, dynamic pose, cinematic rim lighting, photographic quality'
    : 'an athletic muscular male fitness model performing a strength-training exercise (dumbbell curl, bench press, squat, cable row or similar) — powerful defined physique, generic sportswear, dynamic pose, cinematic rim lighting, photographic quality';

  // Sutil coloração de rim light por gênero (mantendo composição unificada
  // no estilo da referência: capa fotográfica escura + faixa preta translúcida
  // no rodapé com o título e o escudo STH METHOD ao lado).
  const rimColor = isF ? 'soft warm pink #ff8fb8' : 'electric neon-green #22c26a with cool cyan #1e90ff accents';

  return [
    'Ultra-premium vertical fitness training-card cover (1024x1024), cinematic editorial photography, dark moody atmosphere — pure jet-black background (#000000) with subtle warm/cool gradient falloff. Full-bleed athletic portrait, no borders, no clutter, no extra text, no watermarks, no third-party logos.',
    `MAIN SUBJECT (fills ~85% of the frame from top): ${character}. Tight cropped portrait, intentional pose mid-exercise, defined musculature, dramatic ${rimColor} rim light carving the silhouette against the deep black background. Cinematic depth of field, editorial magazine quality.`,
    `BOTTOM STRIP (lower ~15% of image): a clean, flat, semi-transparent BLACK band (rgba 0,0,0,0.85) spanning full width, sitting flush at the bottom, no rounded corners, no glow. INSIDE the band, LEFT-ALIGNED: the exact program name "${title}" in bold uppercase white sans-serif (Helvetica Neue vibe), tight letter-spacing, sharp legible typography, no typos, no additional words, no subtitles. On the FAR-LEFT of the band, place a small crisp pentagonal shield outlined in emerald green (#22c26a) with a simple geometric "STH" monogram in emerald green inside, and the word "METHOD" in bold uppercase white sans-serif to the right of the shield.`,
    'Overall vibe: premium editorial training card — dark, focused, aspirational. Meticulous typography, tack-sharp focus on the athlete, deep true blacks, cinematic rim lighting.',
    'Strict rules: ONLY the program title and the STH METHOD lockup (shield + word) inside the bottom black band. No captions, no descriptors, no numbers, no duration labels, no third-party logos, no misspellings, no repeated text, no borders around the card.',
  ].join(' ');
}

// Heurística simples para inferir gênero do card a partir do título/detalhes
// quando não há aluno vinculado (uso em regeneração em massa).
export function inferGenderFromText(text: string): 'F' | 'M' {
  const t = (text || '').toLowerCase();
  const female = [
    'femin', 'mulher', 'glute', 'gluteo', 'glúteo', 'posterior', 'lower focus',
    'lower body', 'hip', 'booty', 'butt', 'shape', 'curves', 'lady', 'girl',
  ];
  if (female.some((k) => t.includes(k))) return 'F';
  return 'M';
}