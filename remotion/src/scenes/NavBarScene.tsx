import { AbsoluteFill, useCurrentFrame, useVideoConfig, spring, interpolate } from "remotion";

const TABS = [
  { label: "Início", icon: "🏠" },
  { label: "Protocolo", icon: "💊" },
  { label: "Dieta", icon: "🥗" },
  { label: "Treino", icon: "💪" },
  { label: "Atualização", icon: "📈" },
  { label: "Perfil", icon: "👤" },
];

export const NavBarScene = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const barY = spring({ frame, fps, config: { damping: 18, stiffness: 120 } });
  const titleOpacity = interpolate(frame, [10, 30], [0, 1], { extrapolateRight: "clamp" });
  const highlightScale = spring({ frame: frame - 35, fps, config: { damping: 10, stiffness: 140 } });
  const arrowY = interpolate(frame % 40, [0, 20, 40], [0, -18, 0]);
  const pulse = 0.55 + 0.45 * Math.sin((frame / fps) * 4);
  const outFade = interpolate(frame, [95, 110], [1, 0], { extrapolateLeft: "clamp" });

  const activeIdx = 4;

  return (
    <AbsoluteFill style={{ justifyContent: "center", alignItems: "center", padding: 60, opacity: outFade }}>
      <div style={{ fontSize: 44, color: "rgba(255,255,255,0.6)", opacity: titleOpacity, marginBottom: 24, textAlign: "center", fontWeight: 600 }}>
        Passo 1
      </div>
      <div style={{ fontSize: 68, fontWeight: 800, color: "#fff", textAlign: "center", opacity: titleOpacity, letterSpacing: -2, lineHeight: 1.05, maxWidth: 900 }}>
        Toque em <span style={{ color: "hsl(145 70% 55%)" }}>Atualização</span><br/>entre Treino e Perfil
      </div>

      {/* Phone mock */}
      <div
        style={{
          marginTop: 80,
          width: 720,
          height: 900,
          borderRadius: 60,
          background: "linear-gradient(180deg, #0a0a0a 0%, #050505 100%)",
          border: "4px solid rgba(255,255,255,0.12)",
          boxShadow: "0 0 80px rgba(0,255,120,0.15)",
          position: "relative",
          overflow: "hidden",
          transform: `translateY(${interpolate(barY, [0, 1], [80, 0])}px)`,
          opacity: barY,
        }}
      >
        {/* Fake content area */}
        <div style={{ position: "absolute", top: 60, left: 40, right: 40, display: "flex", flexDirection: "column", gap: 20 }}>
          <div style={{ height: 80, borderRadius: 20, background: "rgba(255,255,255,0.04)" }} />
          <div style={{ height: 180, borderRadius: 24, background: "rgba(255,255,255,0.05)" }} />
          <div style={{ height: 120, borderRadius: 20, background: "rgba(255,255,255,0.04)" }} />
          <div style={{ height: 120, borderRadius: 20, background: "rgba(255,255,255,0.04)" }} />
        </div>

        {/* Bottom nav bar */}
        <div
          style={{
            position: "absolute",
            bottom: 0,
            left: 0,
            right: 0,
            height: 160,
            background: "rgba(10,10,10,0.95)",
            borderTop: "1px solid rgba(255,255,255,0.08)",
            backdropFilter: "blur(20px)",
            display: "flex",
            justifyContent: "space-around",
            alignItems: "center",
            paddingBottom: 24,
          }}
        >
          {TABS.map((tab, i) => {
            const isActive = i === activeIdx;
            return (
              <div
                key={tab.label}
                style={{
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  gap: 6,
                  transform: isActive ? `scale(${1 + 0.15 * highlightScale})` : "scale(1)",
                  position: "relative",
                }}
              >
                {isActive && (
                  <div
                    style={{
                      position: "absolute",
                      inset: -20,
                      borderRadius: 24,
                      background: `hsl(145 70% 50% / ${0.15 * pulse})`,
                      border: `2px solid hsl(145 70% 55% / ${pulse})`,
                      boxShadow: `0 0 40px hsl(145 70% 50% / ${pulse})`,
                    }}
                  />
                )}
                <div style={{ fontSize: 40, filter: isActive ? "drop-shadow(0 0 12px hsl(145 70% 55%))" : "grayscale(0.3)", opacity: isActive ? 1 : 0.55 }}>
                  {tab.icon}
                </div>
                <div style={{ fontSize: 20, color: isActive ? "hsl(145 70% 65%)" : "rgba(255,255,255,0.5)", fontWeight: isActive ? 700 : 500 }}>
                  {tab.label}
                </div>
              </div>
            );
          })}
        </div>

        {/* Pointing arrow */}
        <div
          style={{
            position: "absolute",
            bottom: 180,
            left: `${(100 / TABS.length) * (activeIdx + 0.5)}%`,
            transform: `translateX(-50%) translateY(${arrowY}px)`,
            fontSize: 72,
            filter: "drop-shadow(0 0 20px hsl(145 70% 55%))",
            opacity: highlightScale,
          }}
        >
          👇
        </div>
      </div>
    </AbsoluteFill>
  );
};