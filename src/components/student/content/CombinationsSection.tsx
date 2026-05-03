import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Flame, Dumbbell, AlertTriangle, MessageCircle, ChevronDown, Layers, Activity, Shield, TrendingUp, Eye, Brain, Beaker } from "lucide-react";

import comboDefIni from "@/assets/combo-def-iniciante.jpg";
import comboDefInt from "@/assets/combo-def-intermediario.jpg";
import comboDefAdv from "@/assets/combo-def-avancado.jpg";
import comboHipIni from "@/assets/combo-hiper-iniciante.jpg";
import comboHipInt from "@/assets/combo-hiper-intermediario.jpg";
import comboHipAdv from "@/assets/combo-hiper-avancado.jpg";

const G = {
  accent: "hsl(0 0% 96%)",
  accentSoft: "hsl(0 0% 96%)",
  accentBg: "hsl(0 0% 96% / 0.10)",
  accentBorder: "hsl(0 0% 96% / 0.2)",
  accentGlow: "hsl(0 0% 96% / 0.25)",
  bg: "hsl(0 0% 96%)",
  card: "hsl(0 0% 96%)",
  border: "hsl(0 0% 96%)",
  t96: "hsl(0 0% 96%)",
  t92: "hsl(0 0% 96%)",
  t80: "hsl(0 0% 96%)",
  t65: "hsl(0 0% 96%)",
  t50: "hsl(0 0% 96%)",
  t45: "hsl(0 0% 96%)",
  t40: "hsl(0 0% 96%)",
  t30: "hsl(0 0% 96%)",
  t10: "hsl(0 0% 96%)",
};

const levelColors = {
  iniciante: { hue: "145", label: "Iniciante" },
  intermediario: { hue: "45", label: "Intermediário" },
  avancado: { hue: "0", label: "Avançado" },
};

interface ComboCard {
  id: string;
  level: keyof typeof levelColors;
  img: string;
  title: string;
  subheadline: string;
  compounds: string[];
  concept: string;
  insight: string;
  porqueEssaCombinacao: string;
  logicaHormonal: string;
  sinergiaExplicada: string;
  oQueEsperar: string[];
  sinaisDeAtencao: string[];
  examesToWatch: string[];
  erroComum: string;
}

const definicaoCards: ComboCard[] = [
  {
    id: "def-1",
    level: "iniciante",
    img: comboDefIni,
    title: "Base leve de definição",
    subheadline: "Controle e adaptação do corpo",
    compounds: ["Testosterona (base)", "Oxandrolona"],
    concept: "Foco em adaptação metabólica e preservação de massa muscular enquanto o corpo se ajusta a um ambiente hormonal otimizado.",
    insight: "Menos agressivo, mais controlado — ideal para quem nunca manipulou hormônios antes.",
    porqueEssaCombinacao: "A testosterona mantém o ambiente anabólico basal (evitando catabolismo), enquanto a oxandrolona atua de forma seletiva no tecido muscular sem causar retenção hídrica significativa. É a combinação mais segura para quem está começando porque ambos os compostos têm perfis de efeitos colaterais bem documentados e previsíveis.",
    logicaHormonal: "A testosterona em dose fisiológica a levemente suprafisiológica sustenta a libido, o humor e a síntese proteica. A oxandrolona, por ser derivada da DHT, não aromatiza (não converte em estrogênio), o que significa menos retenção de líquido e um visual mais 'seco' mesmo em déficit calórico moderado.",
    sinergiaExplicada: "Enquanto a testosterona garante que o corpo mantenha funções essenciais e não entre em modo de 'sobrevivência' (cortisol alto, tireoide lenta), a oxandrolona adiciona um efeito anti-catabólico extra que protege a massa magra durante a restrição calórica.",
    oQueEsperar: [
      "Preservação da massa muscular mesmo em déficit calórico",
      "Melhora gradual da definição nas primeiras 4-6 semanas",
      "Força mantida ou levemente aumentada nos treinos",
      "Sensação de 'músculos mais cheios' sem retenção excessiva",
      "Recuperação entre treinos mais eficiente",
    ],
    sinaisDeAtencao: [
      "Alterações no colesterol (HDL pode cair com oxandrolona)",
      "Pele mais oleosa ou surgimento de acne",
      "Alterações na pressão arterial — monitorar regularmente",
      "Alterações no humor ou padrão de sono",
    ],
    examesToWatch: ["Hemograma completo", "Lipidograma (HDL/LDL)", "TGO/TGP (fígado)", "Testosterona total e livre", "Estradiol"],
    erroComum: "Achar que pode usar oxandrolona sozinha sem base de testosterona. Sem testosterona, o eixo hormonal é suprimido e o corpo perde funções essenciais como libido, disposição e até massa muscular — o oposto do objetivo.",
  },
  {
    id: "def-2",
    level: "intermediario",
    img: comboDefInt,
    title: "Definição com refinamento",
    subheadline: "Mais estética, menos retenção",
    compounds: ["Testosterona", "Oxandrolona", "Stanozolol"],
    concept: "Aumento da densidade muscular visual e redução de retenção hídrica subcutânea, criando um visual mais 'granítico'.",
    insight: "Exige maior controle do ambiente hormonal — dois derivados de DHT juntos intensificam efeitos positivos e negativos.",
    porqueEssaCombinacao: "A adição do stanozolol ao protocolo base cria um efeito sinérgico de 'secagem' que vai além do que testosterona + oxandrolona conseguem. O stanozolol reduz a SHBG (globulina ligadora de hormônios sexuais), liberando mais testosterona para agir nos tecidos. O resultado é um visual mais denso e vascularizado.",
    logicaHormonal: "O stanozolol é um dos compostos que mais reduz a SHBG circulante. Com menos SHBG, a testosterona que você já está usando se torna mais 'biodisponível' — ou seja, mais dela fica livre para agir no músculo. Isso potencializa toda a combinação sem necessariamente aumentar a dose de testosterona.",
    sinergiaExplicada: "Testosterona sustenta o ambiente anabólico. Oxandrolona protege a massa magra em déficit. Stanozolol intensifica o efeito estético (densidade + vascularização) e potencializa os outros dois compostos através da redução de SHBG. Os três juntos criam um ciclo de definição mais completo do que qualquer um deles isoladamente.",
    oQueEsperar: [
      "Aparência muscular mais densa e vascularizada a partir da semana 3",
      "Redução visível da retenção subcutânea",
      "Aumento de força mesmo em déficit calórico",
      "Maior definição muscular, especialmente ombros, braços e abdômen",
      "Pele mais fina e aparente — as veias ficam mais visíveis",
    ],
    sinaisDeAtencao: [
      "Impacto hepático — stanozolol é C17-alfa alquilado (passa pelo fígado)",
      "Queda mais agressiva do HDL (dois compostos DHT-derivados)",
      "Ressecamento articular — stanozolol reduz líquido sinovial",
      "Possível queda de cabelo acelerada em pessoas predispostas",
      "Aumento da rigidez tendinosa — cuidado com cargas muito altas",
    ],
    examesToWatch: ["TGO/TGP e GGT (função hepática)", "Lipidograma completo", "Hemograma", "Testosterona e SHBG", "Ácido úrico"],
    erroComum: "Usar stanozolol por períodos longos sem monitorar o fígado. Muitos ignoram que a hepatotoxicidade é cumulativa — não é porque você 'se sente bem' que o fígado está bem. Exames a cada 4 semanas são essenciais nessa combinação.",
  },
  {
    id: "def-3",
    level: "avancado",
    img: comboDefAdv,
    title: "Estética extrema",
    subheadline: "Alta definição e controle fino",
    compounds: ["Testosterona", "Masteron", "Stanozolol ou Oxandrolona"],
    concept: "Máximo foco em densidade muscular, separação entre grupos musculares e estética de palco. Reservado para quem já tem experiência significativa.",
    insight: "Pequenos erros geram grandes impactos — cada variável precisa estar calibrada.",
    porqueEssaCombinacao: "O Masteron (drostanolona) é o composto que mais contribui para o 'look' de definição extrema. Ele atua como anti-estrogênico leve, endurece a musculatura e dá uma aparência granulada quando o percentual de gordura já está baixo (<12%). Combinado com testosterona em dose controlada e um finalizador (stano ou oxan), o resultado é o máximo de qualidade muscular visual possível.",
    logicaHormonal: "O Masteron compete com o estrogênio nos receptores, reduzindo os efeitos estrogênicos da testosterona sem a necessidade de usar inibidores de aromatase em doses altas. Isso significa menos retenção, menos inchaço e uma aparência mais 'seca' naturalmente. É por isso que competidores usam Masteron nas últimas semanas antes de subir no palco.",
    sinergiaExplicada: "A testosterona mantém o anabolismo e as funções fisiológicas. O Masteron 'seca' e endurece a aparência muscular bloqueando parcialmente o estrogênio. O stanozolol ou oxandrolona finaliza o visual com vascularização e separação muscular. Os três juntos criam o efeito de 'pele colada no músculo' que é impossível de alcançar com apenas um ou dois compostos.",
    oQueEsperar: [
      "Separação muscular extrema visível entre grupos musculares",
      "Aparência 'granítica' e vascularização pronunciada",
      "Músculos com aspecto mais 'duro' e tridimensional",
      "Definição abdominal acentuada (com gordura corporal <12%)",
      "Sensação de 'corpo cheio' mesmo em déficit calórico agressivo",
    ],
    sinaisDeAtencao: [
      "Três compostos androgênicos juntos = pressão no perfil lipídico",
      "Risco aumentado de queda capilar (alta carga androgênica)",
      "Possível impacto no humor — irritabilidade e insônia",
      "Sobrecarga hepática se stanozolol estiver na combinação",
      "Necessidade de controle rigoroso de estradiol (nem alto, nem baixo demais)",
    ],
    examesToWatch: ["Lipidograma completo", "Hemograma com hematócrito", "TGO/TGP/GGT", "Estradiol sensível", "PSA (próstata)", "Pressão arterial seriada"],
    erroComum: "Usar Masteron com percentual de gordura alto (>15%). O Masteron não 'queima gordura' — ele revela a definição que já existe. Se a gordura corporal não estiver controlada pela dieta e treino, o efeito visual do Masteron é praticamente invisível e você só acumula efeitos colaterais sem benefício estético.",
  },
];

const hipertrofiaCards: ComboCard[] = [
  {
    id: "hip-1",
    level: "iniciante",
    img: comboHipIni,
    title: "Construção controlada",
    subheadline: "Base sólida de evolução",
    compounds: ["Testosterona", "Dianabol (fase inicial)"],
    concept: "Ganho de força rápido (Dianabol) combinado com base hormonal estável (testosterona). O Dianabol 'chuta' o início do ciclo enquanto a testosterona leva 2-3 semanas para atingir níveis estáveis.",
    insight: "Foco na resposta inicial do corpo — o Dianabol entra e sai rápido, a testosterona sustenta.",
    porqueEssaCombinacao: "O Dianabol (metandrostenolona) é um dos anabolizantes orais mais antigos e mais estudados. Ele causa ganho rápido de força e volume nas primeiras 4-6 semanas. A testosterona, por ser injetável com éster longo, demora para atingir níveis estáveis no sangue. O Dianabol 'cobre' esse período inicial, garantindo que o aluno sinta resultados desde a primeira semana.",
    logicaHormonal: "O Dianabol é um composto que aromatiza fortemente (converte em estrogênio), o que causa retenção hídrica e dá a sensação de 'estar grande e cheio'. Isso não é necessariamente ruim — o estrogênio tem papel importante na síntese proteica e na saúde articular. A chave é o controle: usar por período curto (4-6 semanas) e ter a testosterona como base para o restante do ciclo.",
    sinergiaExplicada: "O Dianabol fornece um 'boost' anabólico imediato (força + volume) enquanto a testosterona injetável sobe gradualmente. Quando o Dianabol é retirado (semana 4-6), a testosterona já está em nível ótimo e mantém os ganhos. É uma estratégia de 'ponte' — um composto entrega enquanto o outro carrega.",
    oQueEsperar: [
      "Ganho rápido de força nas primeiras 2 semanas (5-15% nos lifts principais)",
      "Aumento de volume muscular + retenção hídrica (3-5kg nas primeiras semanas)",
      "Sensação de 'músculos cheios' o dia todo",
      "Pump intenso durante os treinos",
      "Parte do peso ganho é água e será perdido ao retirar o Dianabol — isso é normal",
    ],
    sinaisDeAtencao: [
      "Retenção hídrica excessiva (inchaço no rosto, mãos e pés)",
      "Pressão arterial elevada — monitorar semanalmente",
      "Hepatotoxicidade (Dianabol é C17-alfa alquilado)",
      "Ginecomastia — sensibilidade ou caroço no mamilo exige ação imediata",
      "Back pumps (dores lombares durante exercícios) — sinal de retenção",
    ],
    examesToWatch: ["TGO/TGP (fígado — antes, durante e após)", "Estradiol", "Pressão arterial", "Hemograma", "Prolactina"],
    erroComum: "Manter o Dianabol por mais de 6 semanas 'porque está funcionando'. A hepatotoxicidade é cumulativa e silenciosa. Não importa se você se sente bem — o fígado pode estar sobrecarregado. Retire na semana combinada e deixe a testosterona fazer o trabalho.",
  },
  {
    id: "hip-2",
    level: "intermediario",
    img: comboHipInt,
    title: "Evolução estrutural",
    subheadline: "Força + recuperação profunda",
    compounds: ["Testosterona", "Nandrolona (Deca ou NPP)"],
    concept: "Aumento sustentado de síntese proteica com suporte articular e recuperação superior. Combinação clássica da 'era de ouro' do fisiculturismo por um motivo: funciona consistentemente.",
    insight: "A recuperação começa a ser o diferencial — quem se recupera melhor, treina mais e cresce mais.",
    porqueEssaCombinacao: "A nandrolona (decanoato ou fenilpropionato) é única entre os anabolizantes por seus efeitos positivos nas articulações e tendões. Ela aumenta a síntese de colágeno e retém líquido sinovial, o que protege as articulações durante treinos pesados. Combinada com testosterona, cria um ambiente de crescimento sustentável — o aluno consegue treinar pesado com menor risco de lesão.",
    logicaHormonal: "A nandrolona é um composto 19-nor (derivado da 19-nortestosterona) que se converte em compostos menos androgênicos que a testosterona. Isso significa menos acne, menos queda capilar e menos agressividade — mas também pode afetar a libido se a testosterona base não estiver suficiente. A regra de ouro é: a testosterona deve estar em dose igual ou superior à nandrolona.",
    sinergiaExplicada: "A testosterona garante a libido, o humor e o 'drive' anabólico geral. A nandrolona adiciona uma camada extra de síntese proteica e, crucialmente, protege articulações e tendões que sofrem com cargas crescentes. É por isso que essa combinação permite progressão de carga sustentada por meses — o corpo repara não só o músculo, mas toda a estrutura de suporte.",
    oQueEsperar: [
      "Ganho de massa muscular gradual e consistente (0.5-1kg/semana nas primeiras semanas)",
      "Melhora significativa na recuperação entre treinos (consegue treinar mais vezes)",
      "Redução de dores articulares, especialmente ombros e joelhos",
      "Força progressiva e sustentada ao longo de semanas",
      "Sensação de 'corpo mais robusto' — ganho de espessura muscular, não só volume",
      "Resultados reais começam a aparecer a partir da semana 4-6 (paciência é chave)",
    ],
    sinaisDeAtencao: [
      "Disfunção erétil ('deca dick') se a proporção testosterona/nandrolona estiver errada",
      "Aumento de prolactina — pode causar sensibilidade no mamilo",
      "Retenção hídrica moderada a alta",
      "Supressão do eixo HPT mais intensa que testosterona sozinha",
      "Humor: ansiedade ou depressão em pessoas sensíveis a alterações de prolactina",
    ],
    examesToWatch: ["Prolactina", "Estradiol", "Progesterona", "Hemograma com hematócrito", "Lipidograma", "Testosterona total e livre"],
    erroComum: "Usar nandrolona com dose de testosterona muito baixa (ou sem testosterona). A nandrolona suprime a produção natural de testosterona e seus metabólitos não ativam os receptores androgênicos da mesma forma. Resultado: perda de libido, problemas de ereção e humor depressivo. A testosterona SEMPRE deve ser base.",
  },
  {
    id: "hip-3",
    level: "avancado",
    img: comboHipAdv,
    title: "Máxima transformação",
    subheadline: "Massa + recomposição extrema",
    compounds: ["Testosterona", "Trembolona", "(variação com Nandrolona ou outros)"],
    concept: "Alta capacidade de transformação corporal em tempo reduzido. A trembolona é considerada o anabolizante mais potente disponível — e também o que exige mais responsabilidade.",
    insight: "Exige leitura precisa do organismo — sintomas sutis precisam ser identificados rapidamente.",
    porqueEssaCombinacao: "A trembolona tem um perfil anabólico/androgênico 5x mais potente que a testosterona. Ela não aromatiza, não retém água e tem a capacidade rara de aumentar massa muscular enquanto reduz gordura simultaneamente (recomposição corporal). Combinada com testosterona como base hormonal, o potencial de transformação é máximo — mas os riscos também são proporcionais.",
    logicaHormonal: "A trembolona se liga ao receptor androgênico com afinidade muito superior à testosterona. Ela também se liga ao receptor de progesterona e tem efeitos na sensibilidade à insulina e no metabolismo de nutrientes. O corpo se torna extremamente eficiente em usar proteínas e carboidratos para construir músculo. Ela também aumenta a produção de IGF-1 (fator de crescimento semelhante à insulina) no tecido muscular local.",
    sinergiaExplicada: "A testosterona mantém as funções fisiológicas que a trembolona não consegue suprir (libido, humor, funções cognitivas). A trembolona faz o 'trabalho pesado' de hipertrofia e recomposição — é o motor da transformação. A variação com nandrolona (em fases de volume) ou outros compostos finalizadores permite personalizar o resultado conforme o objetivo específico.",
    oQueEsperar: [
      "Mudanças visíveis na composição corporal em 2-3 semanas",
      "Aumento significativo de força (10-20% nos lifts principais)",
      "Recomposição: ganho de massa com redução simultânea de gordura",
      "Vascularização e densidade muscular superiores a qualquer outro composto",
      "Pump muscular extremo — especialmente ombros e trapézio (alta concentração de receptores)",
      "Suores noturnos e aumento de temperatura corporal (sinal de metabolismo acelerado)",
    ],
    sinaisDeAtencao: [
      "Insônia e suores noturnos intensos (efeito direto no sistema nervoso central)",
      "Tosse após injeção ('tren cough') — reação temporária mas desconfortável",
      "Aumento agressivo da pressão arterial",
      "Impacto cardiovascular significativo (hematócrito, lipídeos)",
      "Alterações de humor: irritabilidade, ansiedade, paranoia em casos extremos",
      "Comprometimento da capacidade cardiorrespiratória (dificuldade em cardio)",
      "Supressão severa do eixo HPT — a recuperação pós-ciclo será mais difícil",
    ],
    examesToWatch: ["Hemograma com hematócrito (risco de policitemia)", "Lipidograma completo", "TGO/TGP/GGT", "Prolactina", "Pressão arterial seriada", "Ecocardiograma (se uso prolongado)", "Glicemia e insulina"],
    erroComum: "Usar trembolona como primeiro ou segundo ciclo. A trembolona exige que o usuário já conheça como seu corpo responde a hormônios mais leves, tenha experiência com controle de efeitos colaterais e saiba identificar sinais de alerta. Pular etapas com trembolona é a forma mais rápida de gerar problemas sérios de saúde.",
  },
];

const whatsappUrl =
  "https://wa.me/5521998496289?text=Fala,%20quero%20ajustar%20meu%20protocolo%20com%20base%20no%20meu%20objetivo";

const InfoBlock = ({ icon, title, children, accentColor }: { icon: React.ReactNode; title: string; children: React.ReactNode; accentColor: string }) => (
  <div className="rounded-xl p-3 space-y-1.5" style={{ background: G.t10, borderLeft: `2px solid ${accentColor}` }}>
    <div className="flex items-center gap-2">
      {icon}
      <p className="text-[10px] uppercase tracking-[0.15em] font-bold" style={{ color: accentColor }}>{title}</p>
    </div>
    {children}
  </div>
);

const ComboCardComponent = ({ card, index }: { card: ComboCard; index: number }) => {
  const [expanded, setExpanded] = useState(false);
  const lc = levelColors[card.level];
  const accent = `hsl(0 0% 96%)`;
  const accentSoft = `hsl(0 0% 96%)`;
  const accentBg = `hsl(0 0% 96% / 0.12)`;
  const accentBorder = `hsl(0 0% 96% / 0.25)`;

  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.1, duration: 0.5 }}
      className="rounded-2xl overflow-hidden"
      style={{ border: `0.5px solid ${G.border}`, background: G.card }}
    >
      {/* Image */}
      <div className="relative h-52 overflow-hidden">
        <motion.img
          src={card.img}
          alt={card.title}
          className="w-full h-full object-cover"
          loading="lazy"
          width={640}
          height={896}
          whileHover={{ scale: 1.05 }}
          transition={{ duration: 0.6 }}
        />
        <div
          className="absolute inset-0"
          style={{
            background: `linear-gradient(to top, hsl(0 0% 96% / 0.95) 0%, hsl(0 0% 96% / 0.4) 50%, transparent 100%)`,
          }}
        />
        <div className="absolute top-3 left-3">
          <span
            className="text-[10px] uppercase tracking-[0.2em] font-bold px-3 py-1.5 rounded-full backdrop-blur-md"
            style={{ background: accentBg, color: accent, border: `0.5px solid ${accentBorder}` }}
          >
            {lc.label}
          </span>
        </div>
        <div className="absolute bottom-0 left-0 right-0 p-4 space-y-1">
          <h3 className="text-lg font-bold tracking-tight" style={{ color: G.t96 }}>{card.title}</h3>
          <p className="text-[12px] font-medium" style={{ color: accent }}>{card.subheadline}</p>
        </div>
      </div>

      {/* Expandable trigger */}
      <motion.button
        onClick={() => setExpanded(!expanded)}
        className="w-full px-4 py-3 flex items-center justify-between"
        style={{ borderTop: `0.5px solid ${G.border}` }}
      >
        <div className="flex items-center gap-2">
          <Layers className="w-3.5 h-3.5" style={{ color: accent }} />
          <span className="text-[12px] font-semibold" style={{ color: G.t80 }}>
            Ver análise completa da combinação
          </span>
        </div>
        <motion.div animate={{ rotate: expanded ? 180 : 0 }} transition={{ duration: 0.3 }}>
          <ChevronDown className="w-4 h-4" style={{ color: G.t45 }} />
        </motion.div>
      </motion.button>

      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.4, ease: "easeInOut" }}
            className="overflow-hidden"
          >
            <div className="px-4 pb-5 space-y-4">
              {/* Compounds tags */}
              <div className="flex flex-wrap gap-1.5">
                {card.compounds.map((c) => (
                  <span key={c} className="text-[11px] font-medium px-2.5 py-1.5 rounded-lg" style={{ background: G.t10, color: G.t92 }}>
                    {c}
                  </span>
                ))}
              </div>

              {/* Conceito */}
              <div className="rounded-xl p-3 space-y-1" style={{ background: G.t10 }}>
                <p className="text-[10px] uppercase tracking-widest font-semibold" style={{ color: G.t40 }}>Conceito</p>
                <p className="text-[13px] leading-relaxed" style={{ color: G.t80 }}>{card.concept}</p>
              </div>

              {/* Por que essa combinação */}
              <InfoBlock icon={<Brain className="w-3.5 h-3.5" style={{ color: accentSoft }} />} title="Por que essa combinação?" accentColor={accentSoft}>
                <p className="text-[12px] leading-relaxed" style={{ color: G.t80 }}>{card.porqueEssaCombinacao}</p>
              </InfoBlock>

              {/* Lógica hormonal */}
              <InfoBlock icon={<Beaker className="w-3.5 h-3.5" style={{ color: "hsl(0 0% 96%)" }} />} title="Lógica hormonal" accentColor="hsl(0 0% 96%)">
                <p className="text-[12px] leading-relaxed" style={{ color: G.t80 }}>{card.logicaHormonal}</p>
              </InfoBlock>

              {/* Sinergia explicada */}
              <InfoBlock icon={<TrendingUp className="w-3.5 h-3.5" style={{ color: "hsl(0 0% 96%)" }} />} title="Sinergia explicada" accentColor="hsl(0 0% 96%)">
                <p className="text-[12px] leading-relaxed" style={{ color: G.t80 }}>{card.sinergiaExplicada}</p>
              </InfoBlock>

              {/* O que esperar */}
              <InfoBlock icon={<Eye className="w-3.5 h-3.5" style={{ color: G.accentSoft }} />} title="O que esperar" accentColor={G.accentSoft}>
                <ul className="space-y-1.5">
                  {card.oQueEsperar.map((item, i) => (
                    <li key={i} className="text-[12px] leading-relaxed flex items-start gap-2" style={{ color: G.t80 }}>
                      <span className="mt-1.5 w-1.5 h-1.5 rounded-full shrink-0" style={{ background: G.accent }} />
                      {item}
                    </li>
                  ))}
                </ul>
              </InfoBlock>

              {/* Sinais de atenção */}
              <InfoBlock icon={<Shield className="w-3.5 h-3.5" style={{ color: "hsl(0 0% 96%)" }} />} title="Sinais de atenção" accentColor="hsl(0 0% 96%)">
                <ul className="space-y-1.5">
                  {card.sinaisDeAtencao.map((item, i) => (
                    <li key={i} className="text-[12px] leading-relaxed flex items-start gap-2" style={{ color: G.t80 }}>
                      <span className="mt-1.5 w-1.5 h-1.5 rounded-full shrink-0" style={{ background: "hsl(0 0% 96%)" }} />
                      {item}
                    </li>
                  ))}
                </ul>
              </InfoBlock>

              {/* Exames */}
              <InfoBlock icon={<Activity className="w-3.5 h-3.5" style={{ color: "hsl(0 0% 96%)" }} />} title="Exames recomendados" accentColor="hsl(0 0% 96%)">
                <div className="flex flex-wrap gap-1.5">
                  {card.examesToWatch.map((exam) => (
                    <span key={exam} className="text-[10px] font-medium px-2 py-1 rounded-md" style={{ background: "hsl(0 0% 96% / 0.1)", color: "hsl(0 0% 96%)", border: "0.5px solid hsl(0 0% 96% / 0.2)" }}>
                      {exam}
                    </span>
                  ))}
                </div>
              </InfoBlock>

              {/* Erro comum */}
              <div className="rounded-xl p-3 flex items-start gap-2.5" style={{ background: "hsl(0 0% 96% / 0.08)", border: `0.5px solid hsl(0 0% 96% / 0.2)` }}>
                <AlertTriangle className="w-4 h-4 mt-0.5 flex-shrink-0" style={{ color: "hsl(0 0% 96%)" }} />
                <div>
                  <p className="text-[10px] uppercase tracking-widest font-bold mb-1" style={{ color: "hsl(0 0% 96%)" }}>Erro comum</p>
                  <p className="text-[12px] leading-relaxed" style={{ color: G.t80 }}>{card.erroComum}</p>
                </div>
              </div>

              {/* Insight final */}
              <div className="rounded-xl p-3 flex items-start gap-2.5" style={{ background: accentBg, border: `0.5px solid ${accentBorder}` }}>
                <AlertTriangle className="w-3.5 h-3.5 mt-0.5 flex-shrink-0" style={{ color: accent }} />
                <p className="text-[12px] leading-relaxed font-medium" style={{ color: accent }}>{card.insight}</p>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

const CombinationsSection = () => (
  <div className="space-y-8">
    {/* Section 1 — Definição */}
    <div className="space-y-4">
      <div className="flex items-center gap-2.5">
        <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: "hsl(0 0% 96% / 0.12)" }}>
          <Flame className="w-4 h-4" style={{ color: "hsl(0 0% 96%)" }} />
        </div>
        <div>
          <h2 className="text-base font-bold tracking-tight" style={{ color: G.t96 }}>Emagrecimento / Definição</h2>
          <p className="text-[11px]" style={{ color: G.t45 }}>Foco em estética, redução e controle</p>
        </div>
      </div>
      <div className="space-y-4">
        {definicaoCards.map((card, i) => (
          <ComboCardComponent key={card.id} card={card} index={i} />
        ))}
      </div>
    </div>

    {/* Section 2 — Hipertrofia */}
    <div className="space-y-4">
      <div className="flex items-center gap-2.5">
        <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: "hsl(0 0% 96% / 0.12)" }}>
          <Dumbbell className="w-4 h-4" style={{ color: "hsl(0 0% 96%)" }} />
        </div>
        <div>
          <h2 className="text-base font-bold tracking-tight" style={{ color: G.t96 }}>Hipertrofia / Construção</h2>
          <p className="text-[11px]" style={{ color: G.t45 }}>Foco em massa, força e recuperação</p>
        </div>
      </div>
      <div className="space-y-4">
        {hipertrofiaCards.map((card, i) => (
          <ComboCardComponent key={card.id} card={card} index={i + 3} />
        ))}
      </div>
    </div>

    {/* Responsible disclaimer */}
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ delay: 0.5 }}
      className="rounded-2xl p-5 space-y-2"
      style={{ background: G.t10, border: `0.5px solid hsl(0 0% 96% / 0.2)` }}
    >
      <div className="flex items-center gap-2">
        <AlertTriangle className="w-4 h-4" style={{ color: "hsl(0 0% 96%)" }} />
        <h3 className="text-sm font-bold" style={{ color: "hsl(0 0% 96%)" }}>Isso não é protocolo</h3>
      </div>
      <p className="text-[13px] leading-relaxed" style={{ color: G.t65 }}>
        Essas combinações representam padrões observados na prática clínica. Cada organismo responde de forma individual. O resultado real depende de exames atualizados, histórico de saúde, dieta, treino e acompanhamento profissional contínuo. Nenhuma informação aqui substitui uma consulta individualizada.
      </p>
    </motion.div>

    {/* CTA */}
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.6 }}
      className="rounded-2xl p-6 text-center space-y-4"
      style={{
        background: `linear-gradient(160deg, hsl(0 0% 96% / 0.06), ${G.card})`,
        border: `0.5px solid ${G.accentBorder}`,
      }}
    >
      <h3 className="text-lg font-bold" style={{ color: G.t96 }}>O resultado não está na combinação. Está no ajuste.</h3>
      <p className="text-sm leading-relaxed" style={{ color: G.t50 }}>
        A mesma combinação pode funcionar perfeitamente ou causar problemas — tudo depende do contexto individual. Seu corpo responde ao que é feito de forma estratégica e personalizada.
      </p>
      <motion.a
        href={whatsappUrl}
        target="_blank"
        rel="noopener noreferrer"
        whileTap={{ scale: 0.97 }}
        className="inline-flex items-center justify-center gap-2 rounded-xl px-6 py-3 text-sm font-semibold transition-all"
        style={{
          background: `linear-gradient(135deg, ${G.accent}, hsl(0 0% 96%))`,
          color: "hsl(0 0% 96%)",
          boxShadow: `0 4px 20px ${G.accentGlow}`,
        }}
      >
        <MessageCircle className="w-4 h-4" />
        Solicitar ajuste de protocolo
      </motion.a>
    </motion.div>
  </div>
);

export default CombinationsSection;
