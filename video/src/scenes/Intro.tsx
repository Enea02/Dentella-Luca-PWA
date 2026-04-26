import { AbsoluteFill, interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";
import { c } from "../colors";

export const Intro = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const logoScale = spring({ frame, fps, config: { damping: 14 }, durationInFrames: 30 });
  const titleOpacity = interpolate(frame, [18, 42], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const titleY = interpolate(frame, [18, 42], [16, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const subOpacity = interpolate(frame, [36, 60], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const subY = interpolate(frame, [36, 60], [12, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const sceneOpacity = interpolate(frame, [75, 90], [1, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });

  return (
    <AbsoluteFill
      style={{
        backgroundColor: c.slate900,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        flexDirection: "column",
        gap: 32,
        opacity: sceneOpacity,
      }}
    >
      {/* Logo */}
      <div
        style={{
          width: 128,
          height: 128,
          borderRadius: 40,
          backgroundColor: c.white,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          transform: `scale(${logoScale})`,
          boxShadow: "0 32px 64px rgba(0,0,0,0.5)",
        }}
      >
        <span
          style={{
            fontSize: 60,
            fontWeight: 800,
            color: c.slate900,
            fontFamily: "system-ui, -apple-system, sans-serif",
            letterSpacing: -3,
            lineHeight: 1,
          }}
        >
          P
        </span>
      </div>

      <div style={{ textAlign: "center" }}>
        <h1
          style={{
            fontSize: 80,
            fontWeight: 800,
            color: "#ffffff",
            opacity: titleOpacity,
            transform: `translateY(${titleY}px)`,
            margin: 0,
            letterSpacing: -3,
            fontFamily: "system-ui, -apple-system, sans-serif",
            lineHeight: 1,
          }}
        >
          Panificio
        </h1>
        <p
          style={{
            fontSize: 26,
            color: c.slate400,
            opacity: subOpacity,
            transform: `translateY(${subY}px)`,
            margin: "12px 0 0 0",
            fontFamily: "system-ui, -apple-system, sans-serif",
            fontWeight: 400,
            letterSpacing: 0.5,
          }}
        >
          Gestionale per panifici
        </p>
      </div>
    </AbsoluteFill>
  );
};
