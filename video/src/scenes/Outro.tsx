import { AbsoluteFill, interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";
import { c } from "../colors";

export const Outro = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const fadeIn = interpolate(frame, [0, 20], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });

  const logoScale = spring({ frame, fps, config: { damping: 14 }, durationInFrames: 30 });

  const line1Opacity = interpolate(frame, [15, 35], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const line1Y = interpolate(frame, [15, 35], [12, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });

  const line2Opacity = interpolate(frame, [30, 50], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const line2Y = interpolate(frame, [30, 50], [12, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });

  const urlOpacity = interpolate(frame, [50, 70], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const urlY = interpolate(frame, [50, 70], [10, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });

  // PWA badge
  const pwaOpacity = interpolate(frame, [55, 75], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });

  return (
    <AbsoluteFill
      style={{
        backgroundColor: c.slate900,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        flexDirection: "column",
        gap: 28,
        opacity: fadeIn,
      }}
    >
      {/* Logo */}
      <div style={{
        width: 100,
        height: 100,
        borderRadius: 32,
        backgroundColor: c.white,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        transform: `scale(${logoScale})`,
        boxShadow: "0 24px 48px rgba(0,0,0,0.4)",
      }}>
        <span style={{
          fontSize: 48,
          fontWeight: 800,
          color: c.slate900,
          fontFamily: "system-ui, -apple-system, sans-serif",
          letterSpacing: -2,
          lineHeight: 1,
        }}>P</span>
      </div>

      {/* Text content */}
      <div style={{ textAlign: "center", display: "flex", flexDirection: "column", gap: 12 }}>
        <h1 style={{
          margin: 0,
          fontSize: 64,
          fontWeight: 800,
          color: "#ffffff",
          opacity: line1Opacity,
          transform: `translateY(${line1Y}px)`,
          letterSpacing: -2,
          fontFamily: "system-ui, -apple-system, sans-serif",
        }}>
          Panificio
        </h1>

        <p style={{
          margin: 0,
          fontSize: 22,
          color: c.slate400,
          opacity: line2Opacity,
          transform: `translateY(${line2Y}px)`,
          fontFamily: "system-ui, -apple-system, sans-serif",
          fontWeight: 400,
        }}>
          Gestionale per panifici — disponibile come app
        </p>

        {/* URL pill */}
        <div style={{
          marginTop: 8,
          opacity: urlOpacity,
          transform: `translateY(${urlY}px)`,
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          gap: 12,
        }}>
          <div style={{
            padding: "10px 28px",
            borderRadius: 999,
            backgroundColor: "rgba(255,255,255,0.08)",
            border: "1px solid rgba(255,255,255,0.15)",
            fontSize: 18,
            color: "#ffffff",
            fontFamily: "monospace",
            letterSpacing: 0.5,
          }}>
            dentella-luca.vercel.app
          </div>
        </div>
      </div>

      {/* PWA badge row */}
      <div style={{ display: "flex", gap: 16, opacity: pwaOpacity, marginTop: 8 }}>
        {["Ordini", "Produzione", "Totali", "Gestione"].map((feature) => (
          <div key={feature} style={{
            padding: "8px 20px",
            borderRadius: 999,
            backgroundColor: "rgba(255,255,255,0.06)",
            border: "1px solid rgba(255,255,255,0.1)",
            fontSize: 14,
            color: c.slate400,
            fontFamily: "system-ui, -apple-system, sans-serif",
          }}>
            {feature}
          </div>
        ))}
      </div>
    </AbsoluteFill>
  );
};
