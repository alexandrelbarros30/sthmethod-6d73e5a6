import { AbsoluteFill, useCurrentFrame, useVideoConfig, spring, interpolate } from "remotion";

export const IntroScene = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const trophyScale = spring({ frame, fps, config: { damping: 12, stiffness: 120 } });
  const titleY = spring({ frame: frame - 10, fps, config: { damping: 20 } });
  const subOpacity = interpolate(frame, [25, 45], [0, 1], { extrapolateRight: "clamp" });
  const badgesOpacity = interpolate(frame, [40, 60], [0, 1], { extrapolateRight: "clamp" });
  const outFade = interpolate(frame, [75, 90], [1, 0], { extrapolateLeft: "clamp" });
  return (
    <AbsoluteFill style={{ justifyContent: "center", alignItems: "center", padding: 80, opacity: outFade }}>
      <div style={{ fontSize: 200, transform: `scale(${trophyScale})`, filter: "drop-shadow(0 0 60px hsl(145 60% 50% / 0.8))", marginBottom: 40 }}>🏆</div>
      <div style={{ fontSize: 96, fontWeight: 800, color: "#fff", textAlign: "center", transform: `translateY(${interpolate(titleY, [0, 1], [40, 0])}px)`, opacity: titleY, letterSpacing: -3, lineHeight: 1 }}>
        Missão<br /><span style={{ color: "hsl(145 70% 55%)" }}>Evolução</span>
      </div>
      <div style={{ fontSize: 40, color: "rgba(255,255,255,0.75)", marginTop: 40, textAlign: "center", opacity: subOpacity, maxWidth: 800 }}>
        3 etapas gamificadas para acompanhar sua evolução
      </div>
      <div style={{ display: "flex", gap: 20, marginTop: 60, opacity: badgesOpacity }}>
        {["1", "2", "3"].map((n, i) => (
          <div key={n} style={{ width: 90, height: 90, borderRadius: 24, background: `hsl(${[145, 210, 35][i]} 60% 20%)`, border: `3px solid hsl(${[145, 210, 35][i]} 70% 55%)`, color: `hsl(${[145, 210, 35][i]} 70% 65%)`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 48, fontWeight: 800 }}>
            {n}
          </div>
        ))}
      </div>
    </AbsoluteFill>
  );
};