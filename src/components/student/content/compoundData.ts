import imgEnantato from "@/assets/compound-enantato.jpg";
import imgCipionato from "@/assets/compound-cipionato.jpg";
import imgPropionato from "@/assets/compound-propionato.jpg";
import imgSuspensao from "@/assets/compound-suspensao.jpg";
import imgDurateston from "@/assets/compound-durateston.jpg";
import imgBoldenona from "@/assets/compound-boldenona.jpg";
import imgDianabol from "@/assets/compound-dianabol.jpg";
import imgOxandrolona from "@/assets/compound-oxandrolona.jpg";
import imgStanozolol from "@/assets/compound-stanozolol.jpg";
import imgMasteronProp from "@/assets/compound-masteron-prop.jpg";
import imgPrimobolan from "@/assets/compound-primobolan.jpg";
import imgHemogenin from "@/assets/compound-hemogenin.jpg";
import imgNandrolona from "@/assets/compound-nandrolona.jpg";
import imgNpp from "@/assets/compound-npp.jpg";
import imgTrembolona from "@/assets/compound-trembolona.jpg";
import imgFamilyTestosterona from "@/assets/family-testosterona.jpg";
import imgFamilyDht from "@/assets/family-dht.jpg";
import imgFamily19nor from "@/assets/family-19nor.jpg";

export interface Compound {
  id: string;
  name: string;
  tag: string;
  image: string;
  subheadline: string;
  essencia: string;
  oQueFaz: string;
  comportamento: string;
  atencao: string;
}

export interface Family {
  id: string;
  title: string;
  subheadline: string;
  description: string;
  profile: string;
  accentHue: string;
  image: string;
  compounds: Compound[];
}

export const families: Family[] = [
  {
    id: "testosterona",
    title: "Família da Testosterona",
    subheadline: "A base de tudo. Equilíbrio entre construção, força e resposta hormonal.",
    description: "Moléculas versáteis que podem se converter em estrogênio (via aromatase) e em DHT (via 5-alfa-redutase). São a base estrutural da maioria dos protocolos porque sustentam o eixo hormonal masculino — sem testosterona como base, o corpo perde referência metabólica e hormonal.",
    profile: "Equilíbrio entre ganho de massa e força, com maior tendência à retenção hídrica. A família da testosterona é a mais estudada clinicamente e a mais previsível em termos de resposta fisiológica.",
    accentHue: "145",
    image: imgFamilyTestosterona,
    compounds: [
      {
        id: "enantato",
        name: "Enantato",
        tag: "Estável",
        image: imgEnantato,
        subheadline: "Estabilidade e leitura limpa do protocolo.",
        essencia: "Éster de liberação gradual (meia-vida de ~4,5 dias) que permite aplicações espaçadas e mantém níveis séricos mais estáveis ao longo da semana. É o éster mais utilizado clinicamente em TRT e protocolos de performance.",
        oQueFaz: "Sustenta os níveis de testosterona total e livre, favorecendo recuperação muscular, síntese proteica, manutenção de massa magra, libido e disposição. Contribui para a retenção de nitrogênio nos tecidos musculares.",
        comportamento: "Atinge pico sérico em 24–48h após aplicação, com queda gradual ao longo de 5–7 dias. Resposta previsível que facilita a leitura de exames e ajustes de protocolo. Ideal para quem busca estabilidade hormonal.",
        atencao: "Pode causar retenção hídrica, acne, aumento de estradiol (aromatização) e elevação de hematócrito. Monitoramento de estradiol, hemograma e PSA é recomendado. A conversão em DHT pode acelerar queda capilar em predispostos.",
      },
      {
        id: "cipionato",
        name: "Cipionato",
        tag: "Consistente",
        image: imgCipionato,
        subheadline: "Consistência e comportamento previsível.",
        essencia: "Éster muito similar ao enantato, com meia-vida ligeiramente maior (~5 dias). Amplamente utilizado nos EUA como padrão para reposição hormonal. A diferença prática entre cipionato e enantato é mínima — a escolha geralmente depende de disponibilidade.",
        oQueFaz: "Atua na força, recuperação, síntese proteica e manutenção do drive anabólico. Sustenta o eixo hormonal de forma consistente, permitindo ganhos progressivos de massa e força sem oscilações bruscas de humor ou energia.",
        comportamento: "Mantém níveis séricos relativamente estáveis entre aplicações, com comportamento quase idêntico ao enantato. Pode ser aplicado 1–2x por semana com boa previsibilidade. A curva hormonal é suave e fácil de monitorar.",
        atencao: "Mesmos riscos do enantato: retenção hídrica, elevação estrogênica, impacto em lipídios (pode reduzir HDL) e aumento de hematócrito. Controle periódico de estradiol e hemograma é essencial para segurança.",
      },
      {
        id: "propionato",
        name: "Propionato",
        tag: "Rápido",
        image: imgPropionato,
        subheadline: "Ação rápida com controle mais fino.",
        essencia: "Éster de ação curta (meia-vida de ~0,8 dia) que permite ajustes rápidos e saída mais veloz do organismo. Muito utilizado em fases de preparação onde o controle fino de retenção hídrica é prioridade.",
        oQueFaz: "Eleva rapidamente os níveis de testosterona, favorecendo força explosiva e recuperação imediata. Por ter saída rápida, permite controle mais preciso do ambiente estrogênico — útil em fases de definição.",
        comportamento: "Pico sérico em poucas horas, com necessidade de aplicações a cada 1–2 dias para manter estabilidade. A frequência maior de aplicação gera níveis mais estáveis que ésteres longos em alguns contextos, mas exige disciplina.",
        atencao: "Pode causar irritação e dor no local de aplicação (PIP) devido à concentração do solvente. A frequência de aplicação pode ser inconveniente. Ainda aromatiza, embora o controle estrogênico seja mais ágil pela saída rápida.",
      },
      {
        id: "suspensao",
        name: "Suspensão",
        tag: "Imediato",
        image: imgSuspensao,
        subheadline: "Pico instantâneo. Ação direta sem éster.",
        essencia: "Testosterona pura em suspensão aquosa, sem éster ligado. Isso significa absorção quase imediata e pico hormonal em menos de 1 hora. É a forma mais rápida e potente de elevação de testosterona disponível.",
        oQueFaz: "Gera um pico hormonal agressivo que pode ser usado pré-treino para maximizar força e agressividade. Utilizada em contextos muito específicos de performance, não é indicada para uso contínuo como base hormonal.",
        comportamento: "Absorção em minutos, pico em 30–60 min, duração de poucas horas. Exige múltiplas aplicações diárias se o objetivo for manutenção de níveis. Na prática, é usada pontualmente, não como base de protocolo.",
        atencao: "Dor intensa no local de aplicação, risco de abscesso se não houver assepsia rigorosa. Oscilação hormonal extrema entre picos e vales. Uso contínuo sobrecarrega o eixo e dificulta qualquer leitura laboratorial.",
      },
      {
        id: "durateston",
        name: "Durateston",
        tag: "Misto",
        image: imgDurateston,
        subheadline: "Blend de 4 ésteres com tempos diferentes.",
        essencia: "Combinação de propionato, fenilpropionato, isocaproato e decanoato de testosterona. A ideia é oferecer um pico inicial rápido (propionato) e sustentação prolongada (decanoato). Na prática, a curva hormonal é menos previsível que ésteres únicos.",
        oQueFaz: "Combina início rápido de ação com manutenção mais longa dos níveis. Pode ser útil para quem busca praticidade com menos frequência de aplicação, embora a estabilidade hormonal seja inferior à de ésteres simples.",
        comportamento: "Pico inicial em 24h (pelo propionato), seguido de sustentação por 2–3 semanas. Porém, os vales entre aplicações podem ser significativos, gerando oscilação de humor, energia e libido — especialmente com intervalos longos.",
        atencao: "A oscilação hormonal é o principal ponto negativo. Muitos profissionais preferem ésteres únicos pela previsibilidade. Monitoramento de estradiol é importante, pois o pico inicial pode gerar aromatização elevada nos primeiros dias.",
      },
      {
        id: "boldenona",
        name: "Boldenona",
        tag: "Gradual",
        image: imgBoldenona,
        subheadline: "Ganhos lentos, constantes e de qualidade.",
        essencia: "Derivado da testosterona com dupla ligação na posição C1-C2, o que reduz sua androgenicidade e aromatização. Meia-vida longa (~14 dias) com éster undecilenoato. Conhecida pela constância — os resultados são graduais mas consistentes.",
        oQueFaz: "Aumenta a síntese proteica, estimula a eritropoiese (produção de hemácias), melhora a vascularização e pode aumentar significativamente o apetite. Favorece ganhos de massa magra de qualidade sem retenção excessiva.",
        comportamento: "Resposta lenta — leva 4–6 semanas para resultados visíveis. Níveis séricos sobem gradualmente e se mantêm por longos períodos. É um composto de paciência: quem espera colhe resultados sólidos e duradouros.",
        atencao: "Pode elevar hematócrito significativamente (risco de policitemia). Aumento de apetite pode dificultar fases de déficit calórico. Detecção prolongada em exames antidoping. Monitorar hemograma com atenção redobrada.",
      },
      {
        id: "dianabol",
        name: "Dianabol",
        tag: "Explosivo",
        image: imgDianabol,
        subheadline: "Arranque de força e volume em dias.",
        essencia: "Metandrostenolona — derivado oral da testosterona com metilação em C17-alfa para sobreviver à primeira passagem hepática. É o anabolizante oral mais clássico da história, usado desde os anos 60. Ação rápida e potente.",
        oQueFaz: "Promove retenção de nitrogênio agressiva, glicogenólise aumentada e ganho rápido de força e volume muscular. Muitos relatam ganhos visíveis em 7–14 dias. É frequentemente usado como 'kickstart' no início de ciclos com ésteres longos.",
        comportamento: "Resposta extremamente rápida (dias). Porém, boa parte do ganho inicial é retenção hídrica intra e extracelular. Os ganhos 'reais' de tecido são menores do que parecem no espelho. Ao suspender, perda de volume é significativa.",
        atencao: "Hepatotoxicidade significativa por ser 17-alfa-alquilado. Aromatização elevada que pode causar ginecomastia. Elevação de pressão arterial pela retenção. Uso deve ser limitado em tempo (4–6 semanas) com suporte hepático.",
      },
    ],
  },
  {
    id: "dht",
    title: "Família do DHT",
    subheadline: "Estética refinada. Mais definição, menos retenção.",
    description: "Derivados da di-hidrotestosterona — não aromatizam em estrogênio, o que elimina retenção hídrica e ginecomastia. São os compostos de escolha para quem busca qualidade muscular, densidade e aparência seca. Porém, por serem androgênicos, podem acelerar calvície e impactar próstata em predispostos.",
    profile: "Ganhos mais secos, melhora significativa da definição e densidade muscular, menor retenção hídrica. Ideais para fases de cutting ou preparação estética. A família DHT prioriza qualidade sobre quantidade.",
    accentHue: "200",
    image: imgFamilyDht,
    compounds: [
      {
        id: "oxandrolona",
        name: "Oxandrolona",
        tag: "Definição",
        image: imgOxandrolona,
        subheadline: "O composto oral mais controlável da categoria.",
        essencia: "Derivado do DHT com modificação no anel A (substituição de C2 por oxigênio), tornando-o resistente à redução pela 5-alfa-redutase. Meia-vida de ~9 horas. É o anabolizante oral com menor relação androgênica/anabólica, o que o torna mais previsível.",
        oQueFaz: "Preserva massa magra em déficit calórico, aumenta força sem ganho significativo de peso, melhora a síntese de creatina fosfato e favorece lipólise abdominal. Muito utilizado em fases de definição e por público feminino pela baixa androgenicidade.",
        comportamento: "Resposta progressiva e controlada ao longo de 4–8 semanas. Não causa retenção hídrica significativa. Os ganhos são 'limpos' — o que você vê no espelho é o que realmente ganhou. Melhora estética perceptível sem mudanças drásticas.",
        atencao: "Apesar do perfil mais seguro, ainda é 17-alfa-alquilado e pode impactar o fígado e os lipídios (redução de HDL). Suprime o eixo HPT mesmo em doses baixas. Não deve ser considerado 'inofensivo' — acompanhamento laboratorial continua essencial.",
      },
      {
        id: "stanozolol",
        name: "Stanozolol",
        tag: "Seco",
        image: imgStanozolol,
        subheadline: "Aspecto seco, definição e densidade muscular.",
        essencia: "Derivado do DHT com um anel pirazol ligado ao anel A. Disponível em versão oral e injetável. Não aromatiza e possui forte ação na síntese proteica com baixa retenção. Meia-vida oral de ~9h, injetável de ~24h.",
        oQueFaz: "Reduz significativamente a retenção hídrica subcutânea, melhora a aparência de 'secura' e vascularização. Aumenta a produção de colágeno tipo III (mas reduz tipo I, impactando tendões). Forte impacto visual em definição.",
        comportamento: "Resposta relativamente rápida (2–3 semanas). A aparência seca é visível antes dos ganhos reais de massa. É um composto mais estético do que anabólico — prioriza aparência sobre volume. Resultados muito dependentes da composição corporal.",
        atencao: "Impacto significativo nos lipídios — pode reduzir HDL em até 50%. Risco articular por reduzir o líquido sinovial. Hepatotóxico na versão oral. Pode causar ressecamento articular e dor, especialmente em atletas de alto volume de treino.",
      },
      {
        id: "masteron",
        name: "Masteron",
        tag: "Densidade",
        image: imgMasteronProp,
        subheadline: "Densidade, estética e controle estrogênico natural.",
        essencia: "Drostanolona — derivado do DHT com ação anti-estrogênica moderada. Disponível como propionato (meia-vida ~2,5 dias) ou enantato (~10 dias). Originalmente desenvolvido como tratamento de câncer de mama pela sua capacidade de competir com estrogênio.",
        oQueFaz: "Melhora densidade muscular, 'grão' do músculo e sensação de dureza. Possui efeito anti-estrogênico leve, podendo reduzir a necessidade de inibidores de aromatase. Contribui para aparência atlética e vascularização.",
        comportamento: "Resultados mais perceptíveis em indivíduos com gordura corporal abaixo de 12–15%. Em percentuais mais altos, o efeito visual é mínimo. É um composto 'finalizador' — brilha quando o corpo já está próximo do objetivo.",
        atencao: "Alta androgenicidade: risco elevado de aceleração de calvície, acne e crescimento de pelos corporais. Impacto nos lipídios similar a outros DHT. Não deve ser usado como base hormonal — sempre combinado com testosterona.",
      },
      {
        id: "primobolan",
        name: "Primobolan",
        tag: "Limpo",
        image: imgPrimobolan,
        subheadline: "O composto mais 'limpo' em termos de efeitos colaterais.",
        essencia: "Metenolona — disponível como acetato (oral) ou enantato (injetável). Meia-vida injetável de ~10 dias. Considerado um dos anabolizantes mais seguros pelo perfil de efeitos colaterais. Baixa androgenicidade e zero aromatização.",
        oQueFaz: "Favorece manutenção e ganho gradual de massa muscular de qualidade. Excelente para preservação em déficit calórico. Melhora a qualidade do tecido sem retenção. É o composto de escolha para quem prioriza saúde acima de tudo.",
        comportamento: "Resposta lenta e progressiva — resultados significativos levam 8–12 semanas. Exige paciência e consistência. Não é o composto para quem busca transformação rápida, mas sim para quem busca evolução sustentável e saudável.",
        atencao: "Supressão do eixo HPT existe, mesmo sendo considerado 'leve'. A versão oral é 17-alfa-alquilada e impacta o fígado. O custo é significativamente maior que outros compostos. Falsificações são extremamente comuns no mercado.",
      },
      {
        id: "hemogenin",
        name: "Hemogenin",
        tag: "Volume",
        image: imgHemogenin,
        subheadline: "O oral mais potente em ganho de volume e força.",
        essencia: "Oximetolona — apesar de derivado do DHT, tem comportamento único: promove retenção hídrica intensa e não segue o padrão 'seco' da família. Meia-vida de ~8–9 horas. É o anabolizante oral mais potente em termos de ganho de peso e força bruta.",
        oQueFaz: "Ganho agressivo de volume, força e peso corporal em poucas semanas. Estimula eritropoiese intensamente (foi desenvolvido para tratar anemia). Pode adicionar 5–10kg em 4–6 semanas, embora boa parte seja retenção.",
        comportamento: "Resposta extremamente rápida e agressiva. Pico de resultados entre semana 2–4. Após esse período, os ganhos desaceleram e os efeitos colaterais tendem a se intensificar. É um composto de uso muito curto e controlado.",
        atencao: "Hepatotoxicidade severa — é um dos orais mais agressivos para o fígado. Pode causar elevação significativa de pressão arterial, retenção excessiva, dores de cabeça e perda de apetite paradoxal. Monitoramento de TGO, TGP e bilirrubina é obrigatório.",
      },
    ],
  },
  {
    id: "19nor",
    title: "Família da Nandrolona",
    subheadline: "Potência máxima. Transformação exige controle.",
    description: "Compostos com alteração no carbono 19 (remoção do grupo metil). Altamente anabólicos com menor androgenicidade relativa, mas com complexidade hormonal única: convertem em di-hidronandrolona (DHN) ao invés de DHT, e interagem com receptores de progesterona — o que exige manejo estratégico diferente.",
    profile: "Alta capacidade de transformação corporal com suporte articular e recuperação superior. Porém, a supressão do eixo HPT é mais profunda e a recuperação pós-uso é mais lenta. Requerem acompanhamento estratégico rigoroso.",
    accentHue: "30",
    image: imgFamily19nor,
    compounds: [
      {
        id: "nandrolona",
        name: "Nandrolona",
        tag: "Estrutura",
        image: imgNandrolona,
        subheadline: "O composto estrutural por excelência.",
        essencia: "Nandrolona decanoato (Deca-Durabolin) — éster de liberação muito lenta (meia-vida ~15 dias). Um dos anabolizantes mais antigos e estudados. Relação anabólica/androgênica de 125:37, muito favorável para ganho de tecido com menos efeitos androgênicos.",
        oQueFaz: "Aumenta significativamente a síntese proteica, a retenção de nitrogênio e o conteúdo mineral ósseo. Melhora a produção de líquido sinovial, aliviando dores articulares. Favorece ganho de massa magra gradual e consistente com boa recuperação.",
        comportamento: "Ação extremamente lenta — resultados perceptíveis a partir da semana 4–6. Meia-vida longa significa que permanece no organismo por semanas após a suspensão. Exige planejamento de saída para TPC. Ganhos são sólidos e duradouros.",
        atencao: "Supressão profunda do eixo HPT — recuperação hormonal pode levar meses. Atividade progestogênica pode causar ginecomastia mesmo sem aromatização direta. Pode causar disfunção erétil ('deca dick') por supressão de DHT. Detectável por até 18 meses em antidoping.",
      },
      {
        id: "npp",
        name: "NPP",
        tag: "Ágil",
        image: imgNpp,
        subheadline: "Mesma nandrolona, saída mais rápida.",
        essencia: "Nandrolona fenilpropionato — mesma molécula base, mas com éster de ação mais curta (meia-vida ~4 dias). Permite ajustes mais rápidos e saída mais veloz em caso de efeitos colaterais. Oferece os mesmos benefícios da Deca com mais controle.",
        oQueFaz: "Todos os benefícios da nandrolona — síntese proteica, suporte articular, recuperação — mas com pico mais rápido e clearance mais ágil. Ideal para quem quer os benefícios da família 19-nor com possibilidade de ajuste rápido.",
        comportamento: "Pico em 1–2 dias, estabilidade com aplicações a cada 2–3 dias. Resultados começam a aparecer antes que com Deca (semana 2–3). A frequência maior de aplicação compensa pela flexibilidade e controle que oferece.",
        atencao: "Mesma supressão do eixo que a Deca, embora a recuperação possa ser mais rápida pela saída mais veloz. Mesmos riscos de atividade progestogênica. Frequência de aplicação pode ser inconveniente. Monitoramento de prolactina é recomendado.",
      },
      {
        id: "trembolona",
        name: "Trembolona",
        tag: "Potência",
        image: imgTrembolona,
        subheadline: "O composto mais potente e mais exigente que existe.",
        essencia: "Modificação 19-nor com tripla ligação (C9-C11) que impede aromatização e confere potência anabólica 5x maior que testosterona. Meia-vida do acetato ~3 dias, enantato ~10 dias. Não existe versão 'leve' de trembolona — é sempre um composto de alto impacto.",
        oQueFaz: "Aumenta dramaticamente a síntese proteica, a retenção de nitrogênio e a eficiência alimentar (mais resultado por caloria ingerida). Simultaneamente anabólico e anti-catabólico. Capaz de promover ganho de massa e perda de gordura ao mesmo tempo.",
        comportamento: "Resposta rápida e intensa em 1–2 semanas. Transformação corporal visível em poucas semanas. Porém, a intensidade dos efeitos colaterais acompanha a potência: insônia, sudorese noturna, agressividade, tosse pós-aplicação ('tren cough') são comuns.",
        atencao: "Altamente supressor do eixo HPT. Impacto cardiovascular significativo (redução de HDL, aumento de pressão). Nefrotóxico. Pode causar ansiedade, insônia severa e alterações de comportamento. Não recomendado para iniciantes em nenhuma circunstância. Exige leitura precisa de exames e acompanhamento constante.",
      },
    ],
  },
];

export const TOTAL_COMPOUNDS = families.reduce((sum, f) => sum + f.compounds.length, 0);

export const cardFields = [
  { key: "essencia" as const, label: "Essência" },
  { key: "oQueFaz" as const, label: "O que faz" },
  { key: "comportamento" as const, label: "Comportamento" },
  { key: "atencao" as const, label: "Pontos de atenção" },
];
