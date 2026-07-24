import { AbsoluteFill, useCurrentFrame, useVideoConfig, spring, interpolate } from "remotion";

interface Props {
  number: number;
  title: string;
  subtitle: string;
  accent: string;
  icon: string;
  bullets: string[];
}

export const StageScene = ({ number, title, subtitle, accent, icon, bullets }: Props) => {
  const frame = useCurrentFrame();
  const { fps, durationInFrames } = useVideoConfig();
  const badgeScale = spring({ frame, fps, config: { damping: 10, stiffness: 140 } });
  const titleShift = spring({ frame: frame - 8, fps, config: { damping: 20 } });
  const iconPop = spring({ frame: frame - 20, fps, config: { damping: 8, stiffness: 160 } });
  const outFade = interpolate(frame, [durationInFrames - 20, durationInFrames], [1, 0], { extrapolateLeft: "clamp" });
  return (
    <AbsoluteFill style={{ padding: 80, opacity: outFade }}>
      <div style={{ display: "flex", alignItems: "center", gap: 32, marginTop: 100 }}>
        <div style={{ width: 140, height: 140, borderRadius: 40, background: `hsl(${accent} / 0.18)`, border: `4px solid hsl(${accent})`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 70, fontWeight: 800, color: `hsl(${accent})`, transform: `scale(${badgeScale})`, boxShadow: `0 0 80px hsl(${accent} / 0.5)` }}>
          {number}
        </div>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 30, color: `hsl(${accent})`, fontWeight: 700, letterSpacing: 2, textTransform: "uppercase", opacity: titleShift }}>
            Etapa {number}
          </div>
          <div style={{ fontSize: 72, color: "#fff", fontWeight: 800, lineHeight: 1.05, transform: `translateX(${interpolate(titleShift, [0, 1], [-40, 0])}px)`, opacity: titleShift, letterSpacing: -2, marginTop: 8 }}>
            {title}
          </div>
        </div>
      </div>
      <div style={{ fontSize: 36, color: "rgba(255,255,255,0.72)", marginTop: 40, opacity: interpolate(frame, [15, 35], [0, 1], { extrapolateRight: "clamp" }) }}>
        {subtitle}
      </div>
      <div style={{ marginTop: 80, marginBottom: 40, background: `hsl(${accent} / 0.08)`, border: `2px solid hsl(${accent} / 0.5)`, borderRadius: 40, padding: 60, display: "flex", flexDirection: "column", alignItems: "center", transform: `scale(${iconPop})`, boxShadow: `0 0 60px hsl(${accent} / 0.3)` }}>
        <div style={{ fontSize: 220, lineHeight: 1, marginBottom: 30 }}>{icon}</div>
        <div style={{ display: "flex", flexDirection: "column", gap: 24, width: "100%" }}>
          {bullets.map((b, i) => {
            const appear = interpolate(frame, [50 + i * 20, 70 + i * 20], [0, 1], { extrapolateRight: "clamp", extrapolateLeft: "clamp" });
            return (
              <div key={i} style={{ display: "flex", alignItems: "center", gap: 24, fontSize: 44, color: "#fff", fontWeight: 600, opacity: appear, transform: `translateX(${interpolate(appear, [0, 1], [-30, 0])}px)` }}>
                <div style={{ width: 54, height: 54, borderRadius: 16, background: `hsl(${accent})`, color: "#000", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 800, fontSize: 32, flexShrink: 0 }}>
                  ✓
                </div>
                {b}
              </div>
            );
          })}
        </div>
      </div>
      <div style={{ marginTop: 40, alignSelf: "stretch", padding: "32px 40px", borderRadius: 24, background: `hsl(${accent})`, color: "#000", fontSize: 44, fontWeight: 800, textAlign: "center", boxShadow: `0 0 40px hsl(${accent} / 0.5)`, opacity: interpolate(frame, [130, 150], [0, 1], { extrapolateRight: "clamp", extrapolateLeft: "clamp" }), transform: `scale(${interpolate(frame, [130, 150], [0.9, 1], { extrapolateRight: "clamp", extrapolateLeft: "clamp" })})` }}>
        ✓ Confirmar & salvar etapa {number}
      </div>
    </AbsoluteFill>
  );
};