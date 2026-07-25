import { AbsoluteFill, useCurrentFrame, interpolate, useVideoConfig, Sequence } from "remotion";
import { loadFont } from "@remotion/google-fonts/Inter";
import { IntroScene } from "./scenes/IntroScene";
import { NavBarScene } from "./scenes/NavBarScene";
import { StageScene } from "./scenes/StageScene";
import { OutroScene } from "./scenes/OutroScene";

loadFont("normal", { weights: ["400", "600", "700", "800"], subsets: ["latin"] });

export const MissionEvolution = () => {
  return (
    <AbsoluteFill style={{ background: "#000", fontFamily: "Inter, sans-serif" }}>
      <BackgroundGlow />
      <Sequence from={0} durationInFrames={120}>
        <NavBarScene />
      </Sequence>
      <Sequence from={120} durationInFrames={90}>
        <IntroScene />
      </Sequence>
      <Sequence from={210} durationInFrames={180}>
        <StageScene
          number={1}
          title="Peso & Mensagem"
          subtitle="Opcional — envie o que quiser, quando quiser"
          accent="145 60% 50%"
          icon="⚖️"
          bullets={["Digite o peso atual (opcional)", "Escreva como está se sentindo", "Confirmar & salvar · +50 XP"]}
        />
      </Sequence>
      <Sequence from={390} durationInFrames={180}>
        <StageScene
          number={2}
          title="Fotos Corporais"
          subtitle="Confirma antes de enviar — as antigas ficam salvas"
          accent="210 90% 60%"
          icon="📸"
          bullets={["Frente, lado e costas", "Boa iluminação", "Confirmar & enviar · +50 XP"]}
        />
      </Sequence>
      <Sequence from={570} durationInFrames={180}>
        <StageScene
          number={3}
          title="Rotina"
          subtitle="Só se mudou de verdade — trabalho, saúde ou treino"
          accent="35 90% 60%"
          icon="🏃"
          bullets={["Mudou trabalho ou horário?", "Nova lesão, gestação, cirurgia?", "Confirmar & salvar · +50 XP"]}
        />
      </Sequence>
      <Sequence from={750} durationInFrames={90}>
        <OutroScene />
      </Sequence>
    </AbsoluteFill>
  );
};

const BackgroundGlow = () => {
  const frame = useCurrentFrame();
  const { durationInFrames } = useVideoConfig();
  const hue = interpolate(frame, [0, durationInFrames], [140, 210]);
  return (
    <AbsoluteFill
      style={{
        background: `radial-gradient(ellipse at 50% 30%, hsl(${hue} 70% 15%) 0%, #000 70%)`,
        opacity: 0.9,
      }}
    />
  );
};