// Prompt oficial para geração de capas de programas de treino STH METHOD.
// Estética Apple pura: fundo preto profundo, iluminação cinematográfica,
// personagem realista em movimento (homem = faixa azul, mulher = faixa rosa),
// escudo oficial STH METHOD no topo e nome do programa dentro da faixa.
export function buildProgramCoverPrompt(title: string, gender: 'F' | 'M'): string {
  const isF = gender === 'F';

  const athlete = isF
    ? [
        'ATLETA: mulher atlética real, aproximadamente 25-32 anos, visual elegante, forte e feminina.',
        'Cintura proporcional, pernas desenvolvidas, glúteos desenvolvidos, abdômen definido, baixo percentual de gordura sem exageros irreais.',
        'Expressão de foco absoluto, concentrada no exercício. Vestindo top esportivo neutro e legging de academia, sem estampas, sem escritas, sem marcas visíveis.',
      ].join(' ')
    : [
        'ATLETA: homem atlético real, aproximadamente 25-35 anos, muito definido, visual saudável.',
        'Musculatura proporcional, baixo percentual de gordura, sem exageros irreais.',
        'Expressão determinada, olhando para frente ou totalmente concentrado no exercício. Vestindo regata esportiva neutra ou sem camisa com shorts de academia, sem estampas, sem escritas, sem marcas visíveis.',
      ].join(' ');

  return [
    // Contexto de marca / direção de arte
    `Você é o Diretor de Arte Oficial da STH METHOD gerando a imagem principal (background) de um card para o programa de treino "${title}".`,
    'A imagem deve transmitir performance, evolução, disciplina, saúde, estética, força, determinação, exclusividade e alto padrão — como uma campanha publicitária internacional premium.',

    // Estilo
    'ESTILO: Ultra Photorealistic, Fitness Commercial Photography, Premium Sports Campaign, Luxury Fitness Brand, Cinematic Lighting, Professional Studio Photography, Hyper Detailed, HDR, 8K, High Contrast, Professional Color Grading, Natural Skin, Sharp Focus, Magazine Cover Quality, Luxury Branding.',
    'PROIBIDO: aparência de IA, cartoon, ilustração, desenho, render 3D estilizado. SEMPRE fotografia hiper-realista.',

    // Formato
    'FORMATO: vertical 9:16, 1080x1920. O atleta deve ocupar aproximadamente 80% da composição. Os ~20% inferiores da imagem devem ficar como fundo LIMPO, escuro e sem elementos — reservados para o sistema STH METHOD inserir depois faixa, nome do programa e logomarca. NÃO desenhar essa faixa. NÃO inserir nenhum texto, letra, número, logotipo, marca, watermark, moldura, banner ou placa.',

    // Atleta
    athlete,

    // Cena
    'CENA: escolher a melhor composição para um programa de treino de força/hipertrofia — supino, agachamento, desenvolvimento, barra fixa, levantamento terra, leg press, rosca direta, remada curvada, cabos ou halteres, com biomecânica perfeita. Nunca gerar movimentos incorretos.',

    // Ambiente
    'AMBIENTE: academia moderna e premium, equipamentos de alto padrão, fundo desfocado com profundidade de campo, poucos elementos, visual limpo, atmosfera escura e sofisticada, nada poluído.',

    // Iluminação
    'ILUMINAÇÃO: cinematográfica, luz lateral e superior realçando os músculos, sombras profundas, reflexos discretos, pele natural, volume muscular evidente.',

    // Paleta
    'PALETA: predominância de preto, cinza escuro e grafite, com detalhes verdes discretos. Nunca usar cores vibrantes em excesso.',

    // Composição
    'COMPOSIÇÃO: plano médio ou plano americano, leve ângulo inferior (visual heroico), olhar poderoso, postura perfeita, corpo ocupando quase toda a imagem, com os ~20% inferiores limpos para a arte do card.',

    // Qualidade
    'QUALIDADE: Ultra Realistic, Photorealistic, Commercial Fitness Campaign, Award Winning Photography, Professional Sports Photography, High Detail, Natural Skin Texture, Perfect Anatomy, Professional Gym Lighting, Extremely Detailed Muscles, Hyper Realistic, 8K, HDR, Sharp Focus, Magazine Cover.',

    // Regras rígidas
    'REGRAS RÍGIDAS: sem texto, sem letras, sem números, sem logotipos, sem marcas, sem watermark, sem molduras, sem banners, sem placas, sem camisetas com escrita. Não cortar mãos nem pés, não gerar dedos extras, não deformar músculos, anatomia perfeitamente correta. O resultado final deve parecer uma fotografia profissional feita para uma campanha oficial da STH METHOD, digna de capa de aplicativo fitness premium.',
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