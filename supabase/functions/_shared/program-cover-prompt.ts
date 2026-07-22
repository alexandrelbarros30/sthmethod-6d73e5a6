// Prompt oficial para geração de capas de programas de treino STH METHOD.
// Regras: personagem feminino + faixa rosa/lilás (F) ou personagem masculino +
// faixa azul/verde (M), sempre com wordmark oficial "STH METHOD" no topo.
export function buildProgramCoverPrompt(title: string, gender: 'F' | 'M'): string {
  const isF = gender === 'F';
  const bandColor = isF
    ? 'vibrant pink-to-lilac gradient horizontal band (hot pink #ff2d87 blending into lilac #b967ff)'
    : 'electric blue-to-neon-green gradient horizontal band (royal blue #0a84ff blending into neon green #39ff14)';
  const character = isF
    ? 'a fit, athletic, empowered FEMALE character in the center foreground — modern female athlete silhouette / stylized cinematic illustration, toned body, confident pose, sportswear, feminine features, no explicit face detail required (can be semi-silhouette to avoid uncanny features)'
    : 'a fit, muscular, powerful MALE character in the center foreground — modern male athlete silhouette / stylized cinematic illustration, muscular physique, strong confident pose, athletic wear, masculine features, no explicit face detail required (can be semi-silhouette to avoid uncanny features)';
  const styling = isF
    ? 'subtle feminine styling: soft rose/lilac glow rim light, elegant curves, refined ornamental particles'
    : 'strong masculine styling: sharp geometric edges, metallic steel accents, powerful athletic energy';

  return [
    'Vertical premium fitness program cover art, cinematic Apple-style dark aesthetic on pure black background (#000000).',
    'At the TOP CENTER: the official STH METHOD wordmark — "STH METHOD" in bold clean modern sans-serif, glowing NEON GREEN (#39ff14), high legibility, generous letter-spacing, treated as the official brand logo.',
    `In the CENTER: ${character}, backlit with soft neon glow that matches the band color, integrated seamlessly with the dark background.`,
    `In the LOWER THIRD: a solid ${bandColor} spanning full width, with the exact workout name "${title}" written INSIDE the band in bold uppercase white sans-serif, perfectly centered, high contrast, no typos, no extra words.`,
    `Overall vibe: cinematic minimal fitness poster, subtle particle/light-ray texture, ${styling}.`,
    'No other logos, no additional text anywhere. Only the STH METHOD wordmark on top and the workout name in the colored band.',
    'Background pure black (#000000). Do not distort the wordmark or misspell the workout name.',
  ].join(' ');
}