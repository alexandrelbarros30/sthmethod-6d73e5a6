// Prompt oficial para geração de capas de programas de treino STH METHOD.
// Estética Apple pura: fundo preto profundo, iluminação cinematográfica,
// personagem realista em movimento (homem = faixa azul, mulher = faixa rosa),
// escudo oficial STH METHOD no topo e nome do programa dentro da faixa.
export function buildProgramCoverPrompt(title: string, gender: 'F' | 'M'): string {
  const isF = gender === 'F';

  const character = isF
    ? 'a real athletic fitness female bodybuilder in intense strength training — dumbbell curl, hip thrust, glute kickback, cable row or heavy squat. Toned defined feminine physique, glutes and hamstrings visible, wearing generic sports bra and gym leggings, dynamic mid-exercise pose, sweat on skin, cinematic editorial photography quality'
    : 'a real athletic muscular male bodybuilder in intense strength training — heavy bench press, bicep curl, deadlift, cable row or dumbbell press. Powerful defined masculine physique, striated chest and arms visible, wearing generic athletic tank or shirtless with gym shorts, dynamic mid-exercise pose, sweat on skin, cinematic editorial photography quality';

  const rimColor = isF ? 'soft warm pink #ff5fa2 rim light' : 'cool electric blue #2388ff rim light';

  return [
    'Ultra-premium SQUARE fitness training-card cover (1024x1024), cinematic editorial photography, dark gym atmosphere — pure jet-black background (#000000) with dramatic side lighting. Full-bleed photorealistic athlete portrait, magazine-cover quality. No borders, no clutter, no watermarks, no third-party logos.',
    `MAIN SUBJECT (fills the ENTIRE frame from top edge down to ~85%): ${character}. Tight cropped portrait framing the torso and upper body prominently, intentional pose captured mid-exercise, tack-sharp focus on defined musculature, dramatic ${rimColor} carving the silhouette against the deep black background. Cinematic depth of field, shallow blur, editorial magazine quality, hyper-realistic skin and texture.`,
    `BOTTOM STRIP (lower ~15% of image, flush with bottom edge): a clean flat SEMI-TRANSPARENT BLACK band (rgba 0,0,0,0.9) spanning full width, no rounded corners. Inside the band, CENTER-ALIGNED: the exact program name "${title}" in bold uppercase EMERALD GREEN (#22c26a) sans-serif typography (Helvetica Neue bold), tight letter-spacing, sharp legible, no typos, no subtitles, no extra words. Directly below the title in smaller bold uppercase WHITE sans-serif: the lockup "STH METHOD" preceded by a small emerald-green (#22c26a) pentagonal shield icon containing a stylized "STH" monogram.`,
    'Overall vibe: premium editorial fitness magazine cover — dark, focused, aspirational, aggressive. Tack-sharp athlete, deep true blacks, cinematic rim lighting. The composition MUST match the reference style: athlete photo dominating the frame with a black bottom band containing green title + STH METHOD lockup.',
    'Strict rules: ONLY the program title (green) and the "STH METHOD" lockup (shield + white text) inside the bottom black band. No captions, no descriptors, no numbers, no duration labels, no third-party logos, no misspellings, no repeated text, no borders.',
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