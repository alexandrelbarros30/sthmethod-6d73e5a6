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
    description: "Moléculas versáteis que podem se converter em estrogênio e DHT. São a base estrutural da maioria dos protocolos.",
    profile: "Equilíbrio entre ganho de massa e força, com maior tendência à retenção hídrica.",
    accentHue: "145",
    compounds: [
      {
        id: "enantato",
        name: "Enantato",
        tag: "Estável",
        image: imgEnantato,
        subheadline: "Estabilidade e leitura limpa do protocolo.",
        essencia: "Éster de liberação gradual e perfil estável.",
        oQueFaz: "Favorece manutenção hormonal, recuperação e suporte à massa muscular.",
        comportamento: "Resposta previsível ao longo dos dias.",
        atencao: "Pode causar retenção, acne e aromatização.",
      },
      {
        id: "cipionato",
        name: "Cipionato",
        tag: "Consistente",
        image: imgCipionato,
        subheadline: "Consistência é o principal valor.",
        essencia: "Forma de ação prolongada e comportamento consistente.",
        oQueFaz: "Atua na força, recuperação e síntese proteica.",
        comportamento: "Mantém níveis relativamente estáveis.",
        atencao: "Pode gerar retenção e elevação estrogênica.",
      },
      {
        id: "propionato",
        name: "Propionato",
        tag: "Rápido",
        image: imgPropionato,
        subheadline: "Rápido, porém menos estável.",
        essencia: "Éster de ação curta e resposta rápida.",
        oQueFaz: "Favorece ação mais ágil no organismo.",
        comportamento: "Exige aplicações mais frequentes.",
        atencao: "Pode causar irritação local e mais variação hormonal.",
      },
      {
        id: "suspensao",
        name: "Suspensão",
        tag: "Imediato",
        image: imgSuspensao,
        subheadline: "Pico rápido. Ação direta.",
        essencia: "Testosterona sem éster, ação imediata.",
        oQueFaz: "Pico hormonal rápido para performance.",
        comportamento: "Absorção muito rápida, efeito de curta duração.",
        atencao: "Exige múltiplas aplicações diárias e controle rigoroso.",
      },
      {
        id: "durateston",
        name: "Durateston",
        tag: "Misto",
        image: imgDurateston,
        subheadline: "Entrega velocidade, mas cobra precisão.",
        essencia: "Blend de testosteronas com tempos diferentes de liberação.",
        oQueFaz: "Combina início mais rápido com sustentação posterior.",
        comportamento: "Pico inicial seguido de manutenção prolongada.",
        atencao: "Pode oscilar mais e exigir maior controle.",
      },
      {
        id: "boldenona",
        name: "Boldenona",
        tag: "Gradual",
        image: imgBoldenona,
        subheadline: "Constância silenciosa.",
        essencia: "Derivado da testosterona com ação prolongada.",
        oQueFaz: "Aumenta massa e resistência.",
        comportamento: "Resposta gradual e contínua.",
        atencao: "Pode aumentar apetite e retenção leve.",
      },
      {
        id: "dianabol",
        name: "Dianabol",
        tag: "Explosivo",
        image: imgDianabol,
        subheadline: "Arranque inicial. Força e volume em curto prazo.",
        essencia: "Derivado com forte ação anabólica.",
        oQueFaz: "Aumenta força e volume rapidamente.",
        comportamento: "Resposta rápida, com tendência à retenção.",
        atencao: "Controle de dose e acompanhamento são essenciais.",
      },
    ],
  },
  {
    id: "dht",
    title: "Família do DHT",
    subheadline: "Estética refinada. Mais definição, menos retenção.",
    description: "Derivados que não aromatizam. Muito utilizados para melhorar densidade muscular e aparência.",
    profile: "Ganhos mais secos, melhora da definição e menor retenção hídrica.",
    accentHue: "200",
    compounds: [
      {
        id: "oxandrolona",
        name: "Oxandrolona",
        tag: "Definição",
        image: imgOxandrolona,
        subheadline: "Controle e previsibilidade.",
        essencia: "Derivado com perfil mais estável.",
        oQueFaz: "Auxilia definição e preservação muscular.",
        comportamento: "Resposta progressiva.",
        atencao: "Ainda exige acompanhamento, apesar do perfil mais controlado.",
      },
      {
        id: "stanozolol",
        name: "Stanozolol",
        tag: "Seco",
        image: imgStanozolol,
        subheadline: "Seco e estético. Foco em definição.",
        essencia: "Derivado do DHT sem aromatização.",
        oQueFaz: "Melhora definição e reduz retenção.",
        comportamento: "Resposta mais limpa e controlada.",
        atencao: "Pode impactar articulações e lipídios.",
      },
      {
        id: "masteron",
        name: "Masteron",
        tag: "Densidade",
        image: imgMasteronProp,
        subheadline: "Densidade e estética com controle.",
        essencia: "Derivado com ação em densidade muscular.",
        oQueFaz: "Contribui para densidade e estética.",
        comportamento: "Resposta ágil com necessidade de frequência.",
        atencao: "Exige controle e acompanhamento.",
      },
      {
        id: "primobolan",
        name: "Primobolan",
        tag: "Limpo",
        image: imgPrimobolan,
        subheadline: "O mais limpo. Consistência acima de tudo.",
        essencia: "Derivado com baixa agressividade.",
        oQueFaz: "Favorece manutenção e qualidade muscular.",
        comportamento: "Resposta mais lenta e estável.",
        atencao: "Resultados dependem de consistência.",
      },
      {
        id: "hemogenin",
        name: "Hemogenin",
        tag: "Volume",
        image: imgHemogenin,
        subheadline: "Volume rápido. Pressão metabólica elevada.",
        essencia: "Derivado do DHT com comportamento único.",
        oQueFaz: "Promove aumento rápido de força e volume.",
        comportamento: "Resposta agressiva e menos previsível.",
        atencao: "Alto impacto fisiológico, exige estratégia.",
      },
    ],
  },
  {
    id: "19nor",
    title: "Família da Nandrolona",
    subheadline: "Potência máxima. Transformação exige controle.",
    description: "Alteração no carbono 19. Compostos altamente anabólicos com maior complexidade de manejo hormonal.",
    profile: "Alta capacidade de transformação corporal, com necessidade de acompanhamento mais estratégico.",
    accentHue: "30",
    compounds: [
      {
        id: "nandrolona",
        name: "Nandrolona",
        tag: "Estrutura",
        image: imgNandrolona,
        subheadline: "Eficiência com necessidade de precisão.",
        essencia: "Forte ação anabólica e suporte estrutural.",
        oQueFaz: "Auxilia recuperação e articulações.",
        comportamento: "Ação duradoura e acumulativa.",
        atencao: "Impacto hormonal relevante.",
      },
      {
        id: "npp",
        name: "NPP",
        tag: "Ágil",
        image: imgNpp,
        subheadline: "Ação rápida dentro da família nandrolona.",
        essencia: "Versão de liberação mais rápida.",
        oQueFaz: "Favorece recuperação e síntese proteica.",
        comportamento: "Resposta mais ágil.",
        atencao: "Exige frequência maior de aplicação.",
      },
      {
        id: "trembolona",
        name: "Trembolona",
        tag: "Potência",
        image: imgTrembolona,
        subheadline: "Potência extrema. Resultado e colateral caminham juntos.",
        essencia: "Derivado altamente anabólico da família 19-nor.",
        oQueFaz: "Aumenta massa muscular e reduz gordura simultaneamente.",
        comportamento: "Resposta intensa e rápida no organismo.",
        atencao: "Exige controle rigoroso devido ao impacto hormonal.",
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
