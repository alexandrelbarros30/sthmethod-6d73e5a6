import { Composition } from "remotion";
import { MissionEvolution } from "./MissionEvolution";

export const RemotionRoot = () => (
  <>
    <Composition
      id="main"
      component={MissionEvolution}
      durationInFrames={720}
      fps={30}
      width={1080}
      height={1920}
    />
  </>
);