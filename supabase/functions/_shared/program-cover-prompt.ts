// Prompt oficial para geração de capas de programas de treino STH METHOD.
// MODELO OFICIAL (Opção 3): moldura verde fina, escudo STH METHOD no canto
// superior direito, atleta real fotográfico em fundo escuro premium e barra
// verde oficial na base (corte diagonal) com o nome do treino em branco.
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

    // Formato / LAYOUT OFICIAL (Opção 3)
    'FORMATO OBRIGATÓRIO: imagem VERTICAL retrato, proporção 9:16 (1080x1920). NUNCA gerar imagem quadrada ou horizontal.',
    'LAYOUT OFICIAL OBRIGATÓRIO (modelo aprovado): (1) moldura/contorno fino em verde oficial STH METHOD acompanhando as bordas do card; (2) escudo oficial STH METHOD no CANTO SUPERIOR DIREITO, fiel à logomarca — escudo verde #22A05E com as letras "STH" vazadas e a palavra "METHOD" abaixo, sem alterar formato, proporção ou cor; (3) o atleta ocupando o centro da composição; (4) na BASE, uma BARRA SÓLIDA em VERDE OFICIAL da logomarca, largura total, com um leve CORTE DIAGONAL na borda superior da barra.',
    `TEXTO: exatamente e somente o nome do treino "${title.toUpperCase()}" escrito sobre a barra verde, em caixa alta, sans-serif bold, branco puro, bem centralizado e totalmente contido na barra (sem cortar letras, sem sobrepor a imagem).`,
    'NENHUM outro texto, número, watermark, banner ou marca deve aparecer na imagem.',

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
    'COMPOSIÇÃO: plano médio ou plano americano, leve ângulo inferior (visual heroico), postura perfeita, corpo ocupando quase toda a imagem, deixando a base livre para a barra verde com o nome do treino.',

    // Qualidade
    'QUALIDADE: Ultra Realistic, Photorealistic, Commercial Fitness Campaign, Award Winning Photography, Professional Sports Photography, High Detail, Natural Skin Texture, Perfect Anatomy, Professional Gym Lighting, Extremely Detailed Muscles, Hyper Realistic, 8K, HDR, Sharp Focus, Magazine Cover.',

    // Regras rígidas
    'REGRAS RÍGIDAS: os ÚNICOS elementos gráficos permitidos são a moldura verde fina, o escudo STH METHOD no canto superior direito e a barra verde inferior com o nome do treino. Sem watermark, sem outros logotipos, sem escritas em roupas, sem placas. Não cortar mãos nem pés, não gerar dedos extras, não deformar músculos, anatomia perfeitamente correta. O resultado final deve parecer uma fotografia profissional de campanha oficial da STH METHOD, digna de capa de aplicativo fitness premium.',
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