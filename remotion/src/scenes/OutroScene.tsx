import { AbsoluteFill, useCurrentFrame, useVideoConfig, spring, interpolate } from "remotion";

export const OutroScene = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const scale = spring({ frame, fps, config: { damping: 10 } });
  const barsWidth = interpolate(frame, [20, 60], [0, 100], { extrapolateRight: "clamp" });
  return (
    <AbsoluteFill style={{ justifyContent: "center", alignItems: "center", padding: 80 }}>
      <div style={{ fontSize: 180, transform: `scale(${scale})`, filter: "drop-shadow(0 0 80px hsl(145 60% 50%))" }}>🏆</div>
      <div style={{ fontSize: 84, fontWeight: 800, color: "#fff", marginTop: 30, letterSpacing: -2, textAlign: "center" }}>
        Missão Completa!
      </div>
      <div style={{ fontSize: 40, color: "rgba(255,255,255,0.7)", marginTop: 24 }}>
        3/3 conquistas
      </div>
      <div style={{ marginTop: 60, width: 600, height: 16, borderRadius: 8, background: "rgba(255,255,255,0.1)", overflow: "hidden" }}>
        <div style={{ width: `${barsWidth}%`, height: "100%", background: "linear-gradient(90deg, hsl(145 60% 50%), hsl(210 90% 60%), hsl(35 90% 60%))", boxShadow: "0 0 30px hsl(145 60% 50%)" }} />
      </div>
    </AbsoluteFill>
  );
};