// Prompt oficial para geração de capas de programas de treino STH METHOD.
// Estética Apple pura: fundo preto profundo, iluminação cinematográfica,
// personagem realista em movimento (homem = faixa azul, mulher = faixa rosa),
// escudo oficial STH METHOD no topo e nome do programa dentro da faixa.
export function buildProgramCoverPrompt(title: string, gender: 'F' | 'M'): string {
  const isF = gender === 'F';

  const bandColor = isF
    ? 'a smooth soft-to-vibrant PINK gradient band (from #ff5fa2 to #ff2d87), matte finish, subtle inner glow'
    : 'a smooth deep-to-vibrant BLUE gradient band (from #0a84ff to #1e3ff5), matte finish, subtle inner glow';

  const character = isF
    ? 'a REAL athletic FEMALE athlete performing a strength-training exercise (dumbbell curl, hip thrust, squat, cable row or similar) — toned defined physique, sportswear, dynamic realistic pose, cinematic rim lighting, hyper-real skin and muscle definition'
    : 'a REAL athletic MUSCULAR MALE athlete performing a strength-training exercise (dumbbell curl, bench press, squat, cable row or similar) — powerful defined physique, sportswear, dynamic realistic pose, cinematic rim lighting, hyper-real skin and muscle definition';

  const rimColor = isF ? 'soft pink #ff5fa2' : 'electric blue #1e90ff';

  return [
    'Ultra-premium Apple-style vertical fitness poster (1024x1024), cinematic photographic quality, pure jet-black background (#000000), extremely clean minimalist composition — no clutter, no extra text, no watermarks, no other logos.',
    'AT THE TOP CENTER: the official STH METHOD SHIELD LOGO — a bold pentagonal shield with a thick black outline, filled with vibrant emerald green (#22c26a) featuring a large stylized geometric "STH" monogram in solid black inside the shield, and the word "METHOD" in bold uppercase white sans-serif placed at the bottom of the shield. Reproduce the shield exactly, crisp edges, no distortion, no misspelling.',
    `IN THE CENTER: ${character}, framed from head-to-thighs or 3/4 body, illuminated with dramatic ${rimColor} rim light against the black background, subtle atmospheric haze, cinematic depth of field, photorealistic.`,
    `IN THE LOWER THIRD: ${bandColor} spanning the full width of the image as a clean horizontal band (approx 18% of image height), rounded soft edges, sitting flat over the black background. INSIDE the band write the exact program name "${title}" in bold uppercase white sans-serif (SF Pro Display / Helvetica Neue vibe), perfectly centered horizontally and vertically, generous letter-spacing, sharp legible typography, no typos, no additional words.`,
    'Overall vibe: Apple product-launch keyframe meets Nike premium training campaign — meticulous typography, generous negative space, deep blacks, tack-sharp focus on the athlete, cinematic and aspirational.',
    'Strict rules: only the STH METHOD shield at the top and the program name inside the colored band. No captions, no descriptors, no numbers, no extra logos, no misspellings.',
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