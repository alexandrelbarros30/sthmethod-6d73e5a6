import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Flame, Brain, Sun, Zap, TestTube, BarChart3, ShieldAlert, Dumbbell,
  ChevronLeft, ChevronRight, MessageCircle, ArrowLeft, X
} from "lucide-react";

import imgMetabolismo from "@/assets/dica-metabolismo.jpg";
import imgTrh from "@/assets/dica-trh.jpg";
import imgJejum from "@/assets/dica-jejum.jpg";
import imgDiabetes from "@/assets/dica-diabetes.jpg";
import imgVitd from "@/assets/dica-vitd.jpg";
import imgB12 from "@/assets/dica-b12.jpg";
import imgExames from "@/assets/dica-exames.jpg";
import imgMentiras from "@/assets/dica-mentiras.jpg";

const G = {
  accent: "hsl(0 0% 96%)",
  accentSoft: "hsl(0 0% 70%)",
  accentBg: "hsl(0 0% 96% / 0.10)",
  bg: "hsl(0 0% 3%)",
  card: "hsl(0 0% 6%)",
  border: "hsl(0 0% 14%)",
  t96: "hsl(0 0% 96%)",
  t92: "hsl(0 0% 92%)",
  t80: "hsl(0 0% 80%)",
  t65: "hsl(0 0% 65%)",
  t50: "hsl(0 0% 50%)",
  t40: "hsl(0 0% 40%)",
  t30: "hsl(0 0% 30%)",
  t10: "hsl(0 0% 10%)",
  orange: "hsl(0 0% 96%)",
  orangeBg: "hsl(0 0% 96% / 0.12)",
  red: "hsl(0 0% 96%)",
  redBg: "hsl(0 0% 96% / 0.12)",
  blue: "hsl(0 0% 96%)",
  blueBg: "hsl(0 0% 96% / 0.12)",
  yellow: "hsl(0 0% 96%)",
  yellowBg: "hsl(0 0% 96% / 0.12)",
  purple: "hsl(0 0% 96%)",
  purpleBg: "hsl(0 0% 96% / 0.12)",
};

interface InsightCard {
  type: "problem" | "error" | "truth" | "solution";
  text: string;
}

interface InsightTopic {
  id: string;
  icon: typeof Flame;
  accentColor: string;
  accentBg: string;
  tag: string;
  title: string;
  subheadline: string;
  img: string;
  cards: InsightCard[];
  cta: string;
}

const topics: InsightTopic[] = [
  {
    id: "adaptacao", icon: Flame, accentColor: G.orange, accentBg: G.orangeBg,
    tag: "Metabolismo", title: "Seu corpo não travou… você travou ele.",
    subheadline: "Você acha que está em platô. Na verdade, criou um ambiente que impede o progresso.",
    img: imgMetabolismo,
    cards: [
      { type: "problem", text: "Quando você restringe calorias demais por semanas seguidas, o corpo interpreta como ameaça. Ele reduz a taxa metabólica basal (TMB) em até 15-20%, diminui a produção de T3 (hormônio tireoidiano ativo) e aumenta o cortisol. Resultado: você come cada vez menos e mesmo assim não emagrece." },
      { type: "problem", text: "O corpo é uma máquina adaptativa. Se você treina os mesmos exercícios, com a mesma carga e o mesmo volume há meses, seu organismo já se adaptou. Isso se chama acomodação neural — o estímulo não é mais suficiente para gerar resposta hipertrófica ou metabólica significativa." },
      { type: "error", text: "O platô não é falta de esforço — é excesso de monotonia. Estudos mostram que a periodização ondulada (alternar intensidade e volume semanalmente) gera até 28% mais ganho de força que treinos lineares repetitivos. A maioria ignora isso." },
      { type: "truth", text: "O refeed estratégico (1-2 dias com aumento controlado de carboidratos) restaura os níveis de leptina, o hormônio da saciedade que despenca em dietas prolongadas. Leptina baixa = metabolismo lento, fome descontrolada e perda de massa magra." },
      { type: "solution", text: "A solução é o ciclo metabólico inteligente: fases de déficit moderado (nunca extremo), intercaladas com dias de refeed calculados, combinadas com periodização de treino que alterna estímulos de força, hipertrofia e metabólico. Isso mantém o metabolismo ativo e os hormônios regulados." },
    ],
    cta: "Quer sair do platô de verdade?",
  },
  {
    id: "trh", icon: TestTube, accentColor: G.accent, accentBg: G.accentBg,
    tag: "Hormonal", title: "Pode não ser disciplina. Pode ser hormonal.",
    subheadline: "Baixa energia, libido, dificuldade de resultado… isso não é normal.",
    img: imgTrh,
    cards: [
      { type: "problem", text: "A testosterona no homem começa a cair cerca de 1-2% ao ano após os 30. Na mulher, flutuações de estradiol e progesterona afetam diretamente humor, retenção hídrica, ganho de gordura abdominal e capacidade de recuperação muscular. Esses sinais são frequentemente ignorados." },
      { type: "error", text: "\"É coisa da idade\" é a desculpa mais perigosa da medicina. Fadiga crônica, irritabilidade, perda de libido, dificuldade de concentração e acúmulo de gordura visceral NÃO são normais em nenhuma idade — são sinais de desequilíbrio hormonal que podem e devem ser tratados." },
      { type: "truth", text: "Hormônios são mensageiros químicos que regulam TUDO: metabolismo energético (tireoide), composição corporal (testosterona, GH, insulina), humor e cognição (serotonina, dopamina), sono (melatonina) e estresse (cortisol, DHEA). Um eixo desregulado compromete todos os outros." },
      { type: "truth", text: "A TRH (Terapia de Reposição Hormonal) moderna é individualizada e baseada em evidências. Não se trata de 'bombar' — é restaurar níveis fisiológicos otimizados com acompanhamento de exames regulares, ajuste de dose e monitoramento de marcadores de segurança (hematócrito, PSA, lipídios, função hepática)." },
      { type: "solution", text: "O primeiro passo é um painel hormonal completo: Testosterona Total e Livre, SHBG, Estradiol, LH, FSH, Prolactina, TSH, T3L, T4L, Cortisol, DHEA-S, IGF-1 e Insulina de jejum. Sem esses dados, qualquer estratégia é achismo. Com eles, é ciência aplicada." },
    ],
    cta: "Faça seu painel completo",
  },
  {
    id: "jejum", icon: Dumbbell, accentColor: G.blue, accentBg: G.blueBg,
    tag: "Treino", title: "Treinar em jejum queima mais gordura?",
    subheadline: "Depende… e quase ninguém te explica isso certo.",
    img: imgJejum,
    cards: [
      { type: "truth", text: "Quando você treina em jejum, os níveis de insulina estão baixos e a oxidação de ácidos graxos (queima de gordura como combustível) aumenta. Porém, isso NÃO significa que você vai perder mais gordura ao final do dia — o que importa é o balanço energético total de 24h, não o substrato usado durante o treino." },
      { type: "error", text: "O grande risco: treinar em jejum com cortisol alto (estresse crônico, sono ruim) e sem aminoácidos circulantes aumenta drasticamente o catabolismo muscular. Seu corpo quebra proteína do músculo para gerar glicose (gliconeogênese). Você perde o tecido que mais te ajuda a queimar gordura em repouso." },
      { type: "problem", text: "Jejum intermitente combinado com dieta hipocalórica severa e treino intenso é a receita para o desastre metabólico: redução de T3, aumento de cortisol, queda de testosterona, perda de massa magra e rebote de gordura quando voltar a comer normalmente. É o ciclo mais comum e mais destrutivo." },
      { type: "truth", text: "Jejum pode funcionar QUANDO: você dorme bem (7-8h), seus hormônios estão equilibrados, a dieta nos períodos de alimentação é nutricionalmente completa, e o treino é periodizado. Nesse cenário, o jejum 16:8 pode melhorar sensibilidade à insulina e autofagia celular." },
      { type: "solution", text: "A estratégia inteligente: se for treinar em jejum, use aminoácidos essenciais (EAAs) 20min antes para proteger a massa muscular sem quebrar significativamente o estado de jejum metabólico. E nunca combine jejum com déficit calórico agressivo — escolha um ou outro, nunca os dois juntos." },
    ],
    cta: "Quer usar isso do jeito certo?",
  },
  {
    id: "diabetes", icon: ShieldAlert, accentColor: G.red, accentBg: G.redBg,
    tag: "Saúde", title: "Diabetes tipo 2 começa antes do diagnóstico.",
    subheadline: "Você não \"descobre\"… você constrói.",
    img: imgDiabetes,
    cards: [
      { type: "problem", text: "A resistência à insulina é silenciosa e começa anos antes da glicemia subir. Seu pâncreas produz cada vez mais insulina para manter a glicose normal, mas esse excesso de insulina (hiperinsulinemia) promove acúmulo de gordura visceral, inflamação sistêmica, dislipidemia e hipertensão. Quando a glicemia finalmente sobe, o dano já está avançado." },
      { type: "error", text: "Açúcar não é o único vilão. Sedentarismo reduz a expressão de GLUT4 (transportadores de glicose nos músculos), sono ruim aumenta cortisol e resistência insulínica em até 40%, estresse crônico eleva cronicamente a glicemia, e gordura visceral secreta citocinas inflamatórias que pioram todo o quadro. É um problema SISTÊMICO." },
      { type: "truth", text: "O treino resistido (musculação) é o medicamento mais poderoso contra a resistência à insulina. Músculos em contração captam glicose INDEPENDENTE de insulina. Quanto mais massa muscular você tem, maior sua capacidade de 'limpar' a glicose do sangue. Estudos mostram redução de até 58% no risco de diabetes tipo 2 com exercício regular." },
      { type: "truth", text: "Marcadores que você deveria pedir ANTES de ter diabetes: Insulina de jejum, HOMA-IR (índice de resistência), Hemoglobina Glicada (HbA1c), Peptídeo C, Triglicerídeos/HDL ratio e PCR ultrassensível. Se o HOMA-IR está acima de 2.5, já existe resistência à insulina — mesmo com glicemia 'normal'." },
      { type: "solution", text: "Protocolo preventivo: treino resistido 3-4x/semana + caminhada diária pós-refeição (reduz pico glicêmico em até 30%) + dieta com proteína adequada em cada refeição (0.4-0.5g/kg por refeição) + sono de qualidade + controle de estresse. Isso reverte resistência à insulina em estágios iniciais sem medicação." },
    ],
    cta: "Prevenir é mais fácil que remediar",
  },
  {
    id: "vitd", icon: Sun, accentColor: G.yellow, accentBg: G.yellowBg,
    tag: "Integrativa", title: "Vitamina D não é vitamina. É hormônio.",
    subheadline: "Afeta imunidade, testosterona, humor e metabolismo.",
    img: imgVitd,
    cards: [
      { type: "truth", text: "A vitamina D3 (colecalciferol) é tecnicamente um pró-hormônio esteroide. Ela é convertida no fígado em 25(OH)D (calcidiol) e depois nos rins em 1,25(OH)2D (calcitriol), a forma ativa que regula a expressão de mais de 200 genes envolvidos em imunidade, metabolismo ósseo, função muscular e produção hormonal." },
      { type: "problem", text: "Estima-se que 70-80% da população brasileira tenha níveis insuficientes de vitamina D (<30 ng/mL). Isso ocorre porque: trabalho indoor reduz exposição solar, protetor solar bloqueia 95% da síntese cutânea, pele mais escura requer mais tempo de exposição, e a dieta fornece quantidades mínimas (apenas peixes gordos e gema de ovo são fontes relevantes)." },
      { type: "error", text: "\"Tomo sol, então estou bem\" é um mito perigoso. A síntese depende do ângulo solar (UVB só penetra quando o sol está acima de 45°), latitude, estação, tom de pele e idade. Após os 50, a capacidade da pele de sintetizar D3 cai pela metade. A ÚNICA forma de saber é dosar o exame 25(OH)D sérica." },
      { type: "truth", text: "Níveis ótimos de vitamina D (40-60 ng/mL) estão associados a: +20% na produção de testosterona, redução de 40% no risco de infecções respiratórias, melhora significativa no humor e cognição, melhor absorção de cálcio e saúde óssea, e redução de marcadores inflamatórios. É um dos micronutrientes com maior impacto na saúde global." },
      { type: "solution", text: "Protocolo: dosagem sérica de 25(OH)D → suplementação individualizada (geralmente 2.000-5.000 UI/dia para manutenção, podendo chegar a 10.000 UI/dia em deficiências severas) + cofatores essenciais: Vitamina K2 (MK-7, 100-200mcg/dia) para direcionar cálcio aos ossos, e Magnésio (300-400mg/dia) que é necessário para ativar a D3. Sem K2 e Magnésio, a D3 sozinha é incompleta." },
    ],
    cta: "Descubra seus níveis reais",
  },
  {
    id: "b12", icon: Zap, accentColor: G.purple, accentBg: G.purpleBg,
    tag: "Nutrição", title: "Cansaço constante? Pode ser B12.",
    subheadline: "Fadiga, falta de foco, desânimo — sintomas ignorados.",
    img: imgB12,
    cards: [
      { type: "problem", text: "A vitamina B12 (cobalamina) é essencial para a síntese de DNA, formação de glóbulos vermelhos e manutenção da bainha de mielina dos neurônios. Sua deficiência causa anemia megaloblástica, fadiga profunda, formigamento nas extremidades, falhas de memória, depressão e até danos neurológicos irreversíveis se não tratada." },
      { type: "error", text: "\"Como carne, então estou bem\" — nem sempre. A absorção de B12 depende de: ácido clorídrico no estômago (reduzido por antiácidos como omeprazol), fator intrínseco gástrico (reduzido em gastrite), e saúde do íleo terminal. Uso crônico de metformina também depleta B12 em até 30%. Muitas pessoas comem B12 mas não absorvem." },
      { type: "truth", text: "O valor de referência laboratorial (>200 pg/mL) é controverso. Muitos especialistas consideram que níveis abaixo de 400-500 pg/mL já causam sintomas subclínicos. Além da B12 sérica, o exame de Ácido Metilmalônico (MMA) e Homocisteína são marcadores mais sensíveis de deficiência funcional — se elevados, há deficiência real mesmo com B12 'normal'." },
      { type: "truth", text: "A B12 trabalha em sinergia com o Folato (B9) e a B6. Deficiência de qualquer uma delas eleva a homocisteína — um fator de risco cardiovascular independente associado a AVC, trombose e declínio cognitivo. O complexo B completo é mais eficaz que B12 isolada na maioria dos casos." },
      { type: "solution", text: "Avaliação: B12 sérica + Ácido Metilmalônico + Homocisteína. Se deficiente: suplementação com metilcobalamina (forma ativa, melhor absorvida) via sublingual ou intramuscular, associada a metilfolato e P5P (B6 ativa). Dose de manutenção: 1.000-5.000mcg/dia sublingual. Reavaliação em 60-90 dias para ajuste." },
    ],
    cta: "Avalie seus níveis agora",
  },
  {
    id: "exames", icon: BarChart3, accentColor: G.accent, accentBg: G.accentBg,
    tag: "Diagnóstico", title: "Você não melhora o que não mede.",
    subheadline: "Treinar e fazer dieta sem exame é tentativa e erro.",
    img: imgExames,
    cards: [
      { type: "truth", text: "O corpo funciona como um sistema integrado. Um único exame de glicemia ou colesterol total é como olhar uma peça de um quebra-cabeça de 1000 peças. O painel completo revela: eixo hormonal (testosterona, estradiol, tireoide, cortisol), saúde metabólica (insulina, HOMA-IR, HbA1c), inflamação (PCR-us, ferritina), vitaminas (D, B12, B9) e função hepática/renal." },
      { type: "error", text: "Valores 'dentro da faixa de referência' não significam valores ótimos. As faixas laboratoriais são baseadas na média da população — que inclui pessoas sedentárias, obesas e doentes. Para quem busca performance e longevidade, os alvos são diferentes. Exemplo: Testosterona 'normal' é 300-1000 ng/dL, mas valores abaixo de 500 já comprometem composição corporal e energia." },
      { type: "truth", text: "O timing importa: cortisol deve ser coletado entre 7-9h da manhã (pico circadiano), testosterona também pela manhã (cai até 30% à tarde), insulina e glicose em jejum de 8-12h. Treino intenso nas 24h anteriores pode alterar CK, LDH e marcadores inflamatórios. Uma coleta mal planejada gera resultados enganosos." },
      { type: "solution", text: "Painel ST&H Completo inclui: Hemograma, Glicemia, Insulina, HOMA-IR, HbA1c, Colesterol Total, HDL, LDL, Triglicerídeos, TGO, TGP, GGT, Creatinina, Ureia, Ácido Úrico, TSH, T3L, T4L, Testosterona Total e Livre, SHBG, Estradiol, LH, FSH, Cortisol, DHEA-S, IGF-1, Vitamina D, B12, Ferritina, PCR-us e Homocisteína. Leitura estratégica com foco em otimização, não apenas 'normalidade'." },
    ],
    cta: "Solicitar painel completo",
  },
  {
    id: "mentiras", icon: Brain, accentColor: G.red, accentBg: G.redBg,
    tag: "Mindset", title: "As mentiras que travam seu resultado.",
    subheadline: "O maior obstáculo não é o treino. É o que você acredita.",
    img: imgMentiras,
    cards: [
      { type: "error", text: "\"Só dieta resolve\" — A dieta isolada sem treino resistido leva a perda de massa magra junto com gordura. Estudos mostram que até 25% do peso perdido com dieta sozinha é massa muscular. Menos músculo = metabolismo mais lento = efeito sanfona garantido. Dieta sem treino é estratégia de fracasso a longo prazo." },
      { type: "error", text: "\"Só treino resolve\" — Você não supera uma dieta ruim no treino. Uma hora de musculação intensa queima ~300-400 kcal. Um combo de fast food tem 1.200+ kcal. Treino constrói o motor (massa muscular), mas a dieta fornece o combustível certo. Um sem o outro é como ter um carro de corrida com gasolina adulterada." },
      { type: "error", text: "\"Hormônio é milagre\" — Reposição hormonal sem dieta e treino adequados não transforma o corpo. Testosterona ajuda a particionar nutrientes (direcionar para músculo ao invés de gordura), mas se não há estímulo de treino e substrato nutricional, o efeito é mínimo. Hormônio potencializa o trabalho — não substitui." },
      { type: "error", text: "\"Déficit calórico eterno funciona\" — Manter déficit por meses sem pausa destrói o metabolismo. A adaptive thermogenesis reduz o gasto em 10-15% além do esperado pela perda de peso. A leptina despenca, o cortisol dispara, a tireoide desacelera. Por isso existem fases de manutenção e refeed — não é fraqueza, é CIÊNCIA." },
      { type: "truth", text: "O resultado sustentável vem da combinação estratégica dos 4 pilares: Treino periodizado (estímulo muscular progressivo), Nutrição individualizada (com fases de déficit, manutenção e superávit), Equilíbrio hormonal (verificado por exames e otimizado quando necessário) e Recuperação (sono, manejo de estresse, desload). Quem tenta otimizar apenas um pilar, falha nos outros três." },
    ],
    cta: "Pare de tentar sozinho",
  },
];

const typeConfig: Record<string, { label: string; color: string; bg: string }> = {
  problem: { label: "DOR", color: G.red, bg: G.redBg },
  error: { label: "ERRO", color: G.orange, bg: G.orangeBg },
  truth: { label: "VERDADE", color: G.accent, bg: G.accentBg },
  solution: { label: "SOLUÇÃO", color: G.blue, bg: G.blueBg },
};

const whatsappUrl =
  "https://wa.me/5521998496289?text=Fala,%20vi%20o%20conteudo%20estrategico%20e%20quero%20saber%20mais";

const InsightCarousel = () => {
  const [openTopic, setOpenTopic] = useState<InsightTopic | null>(null);
  const [cardIdx, setCardIdx] = useState(0);

  const handleOpen = (topic: InsightTopic) => {
    setOpenTopic(topic);
    setCardIdx(0);
  };

  const handleClose = () => {
    setOpenTopic(null);
  };

  // ── DETAIL VIEW ──
  if (openTopic) {
    const tc = typeConfig[openTopic.cards[cardIdx].type];

    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="space-y-4"
      >
        {/* Back */}
        <button onClick={handleClose} className="flex items-center gap-2 text-sm font-medium" style={{ color: G.t50 }}>
          <ArrowLeft className="w-4 h-4" /> Dicas Estratégicas
        </button>

        {/* Hero image */}
        <div className="rounded-2xl overflow-hidden relative" style={{ border: `0.5px solid ${G.border}` }}>
          <img src={openTopic.img} alt={openTopic.title} className="w-full h-44 object-cover" style={{ filter: "brightness(1.2) contrast(1.03) saturate(0.9)" }} width={800} height={512} />
          <div
            className="absolute inset-0 flex flex-col justify-end p-5 space-y-1.5"
            style={{ background: "linear-gradient(to top, hsl(0 0% 0% / 0.16) 0%, transparent 40%, hsl(0 0% 100% / 0.18) 100%)" }}
          >
            <span
              className="inline-flex items-center gap-1.5 text-[10px] uppercase tracking-[0.2em] font-semibold px-2.5 py-1 rounded-full backdrop-blur-sm w-fit"
              style={{ background: openTopic.accentBg, color: openTopic.accentColor, border: `0.5px solid ${openTopic.accentColor}33` }}
            >
              <openTopic.icon className="w-3 h-3" />
              {openTopic.tag}
            </span>
            <h2 className="text-lg font-bold tracking-tight leading-tight" style={{ color: G.t96, textShadow: "0 2px 14px rgb(0 0 0 / 0.5)" }}>
              {openTopic.title}
            </h2>
          </div>
        </div>

        {/* Subheadline */}
        <p className="text-sm leading-relaxed" style={{ color: G.t65 }}>
          {openTopic.subheadline}
        </p>

        {/* Card carousel */}
        <div className="rounded-xl p-5 space-y-4" style={{ background: G.card, border: `0.5px solid ${G.border}` }}>
          {/* Badge + counter */}
          <div className="flex items-center justify-between">
            <span
              className="text-[10px] uppercase tracking-widest font-bold px-2.5 py-1 rounded-full"
              style={{ color: tc.color, background: tc.bg }}
            >
              {tc.label}
            </span>
            <span className="text-[11px] font-mono" style={{ color: G.t40 }}>
              {cardIdx + 1}/{openTopic.cards.length}
            </span>
          </div>

          {/* Content */}
          <AnimatePresence mode="wait">
            <motion.p
              key={cardIdx}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.2 }}
              className="text-[15px] font-medium leading-relaxed min-h-[56px] flex items-center"
              style={{ color: G.t92 }}
            >
              {openTopic.cards[cardIdx].text}
            </motion.p>
          </AnimatePresence>

          {/* Progress dots */}
          <div className="flex items-center justify-center gap-1.5">
            {openTopic.cards.map((_, i) => (
              <button
                key={i}
                onClick={() => setCardIdx(i)}
                className="rounded-full transition-all"
                style={{
                  width: i === cardIdx ? 18 : 6,
                  height: 6,
                  background: i === cardIdx ? openTopic.accentColor : G.t30,
                }}
              />
            ))}
          </div>

          {/* Navigation */}
          <div className="flex items-center justify-between">
            <button
              onClick={() => setCardIdx(Math.max(0, cardIdx - 1))}
              disabled={cardIdx === 0}
              className="p-2 rounded-lg transition-colors disabled:opacity-20"
              style={{ background: G.t10 }}
            >
              <ChevronLeft className="w-4 h-4" style={{ color: G.t65 }} />
            </button>

            {cardIdx === openTopic.cards.length - 1 ? (
              <motion.a
                href={whatsappUrl}
                target="_blank"
                rel="noopener noreferrer"
                initial={{ scale: 0.9 }}
                animate={{ scale: 1 }}
                className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold"
                style={{ background: openTopic.accentColor, color: "hsl(0 0% 96%)" }}
              >
                <MessageCircle className="w-3.5 h-3.5" />
                {openTopic.cta}
              </motion.a>
            ) : (
              <button
                onClick={() => setCardIdx(cardIdx + 1)}
                className="flex items-center gap-1 px-3 py-2 rounded-lg text-xs font-medium"
                style={{ background: G.t10, color: G.t65 }}
              >
                Próximo <ChevronRight className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
      </motion.div>
    );
  }

  // ── GRID VIEW ──
  return (
    <div className="space-y-4">
      <div className="space-y-1">
        <p className="text-[11px] uppercase tracking-[0.25em] font-medium" style={{ color: G.accent }}>
          Dicas Estratégicas
        </p>
        <h2 className="text-lg font-bold tracking-tight" style={{ color: G.t96 }}>
          Conteúdo que transforma
        </h2>
        <p className="text-xs" style={{ color: G.t50 }}>
          {topics.length} temas essenciais. Toque para explorar.
        </p>
      </div>

      <div className="space-y-3">
        {topics.map((topic, i) => {
          const Icon = topic.icon;
          return (
            <motion.button
              key={topic.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.05 * i, duration: 0.4 }}
              whileTap={{ scale: 0.97 }}
              onClick={() => handleOpen(topic)}
              className="w-full text-left rounded-2xl overflow-hidden relative group"
              style={{ border: `0.5px solid ${G.border}` }}
            >
              {/* Image */}
              <img
                src={topic.img}
                alt={topic.title}
                className="w-full h-36 object-cover transition-transform duration-700 group-hover:scale-105"
                style={{ filter: "brightness(1.2) contrast(1.03) saturate(0.9)" }}
                width={800}
                height={512}
                loading="lazy"
              />

              {/* Overlay */}
              <div
                className="absolute inset-0 flex flex-col justify-end p-4 space-y-1.5"
                style={{ background: "linear-gradient(to top, hsl(0 0% 0% / 0.16) 0%, transparent 40%, hsl(0 0% 100% / 0.18) 100%)" }}
              >
                {/* Tag */}
                <span
                  className="inline-flex items-center gap-1 text-[10px] uppercase tracking-[0.18em] font-semibold px-2 py-0.5 rounded-full backdrop-blur-sm w-fit"
                  style={{ background: topic.accentBg, color: topic.accentColor, border: `0.5px solid ${topic.accentColor}33` }}
                >
                  <Icon className="w-3 h-3" />
                  {topic.tag}
                </span>

                {/* Title */}
                <h3 className="text-[15px] font-bold tracking-tight leading-snug" style={{ color: G.t96, textShadow: "0 2px 14px rgb(0 0 0 / 0.5)" }}>
                  {topic.title}
                </h3>

                {/* Subtitle preview */}
                <p className="text-[11px] leading-relaxed line-clamp-2" style={{ color: G.t80, textShadow: "0 2px 10px rgb(0 0 0 / 0.4)" }}>
                  {topic.subheadline}
                </p>

                {/* CTA hint */}
                <div className="flex items-center gap-1 pt-0.5">
                  <span className="text-[10px] font-semibold" style={{ color: topic.accentColor }}>Ler mais</span>
                  <motion.div
                    animate={{ x: [0, 3, 0] }}
                    transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
                  >
                    <ChevronRight className="w-3 h-3" style={{ color: topic.accentColor }} />
                  </motion.div>
                </div>
              </div>
            </motion.button>
          );
        })}
      </div>
    </div>
  );
};

export default InsightCarousel;
