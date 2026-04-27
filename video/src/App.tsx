import { Player } from "@remotion/player";
import {
  PanificioVideo,
  VIDEO_DURATION_FRAMES,
  VIDEO_FPS,
  VIDEO_HEIGHT,
  VIDEO_WIDTH,
} from "./PanificioVideo";
import { c } from "./colors";

export default function App() {
  return (
    <div
      style={{
        minHeight: "100vh",
        backgroundColor: c.slate900,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        gap: 32,
        padding: "40px 24px",
        fontFamily: "system-ui, -apple-system, sans-serif",
      }}
    >
      {/* Header */}
      <div style={{ textAlign: "center" }}>
        <h1
          style={{
            fontSize: 36,
            fontWeight: 800,
            color: "#ffffff",
            letterSpacing: -1,
            margin: 0,
          }}
        >
          Panificio
        </h1>
        <p style={{ fontSize: 16, color: c.slate400, marginTop: 6 }}>
          Demo del gestionale
        </p>
      </div>

      {/* Player */}
      <div
        style={{
          width: "100%",
          maxWidth: 1200,
          borderRadius: 20,
          overflow: "hidden",
          boxShadow: "0 32px 80px rgba(0,0,0,0.6)",
          border: "1px solid rgba(255,255,255,0.08)",
        }}
      >
        <Player
          component={PanificioVideo}
          durationInFrames={VIDEO_DURATION_FRAMES}
          fps={VIDEO_FPS}
          compositionWidth={VIDEO_WIDTH}
          compositionHeight={VIDEO_HEIGHT}
          style={{ width: "100%" }}
          controls
          autoPlay
          loop
        />
      </div>

      {/* Footer */}
      <p style={{ fontSize: 13, color: c.slate600 }}>
        dentella-luca.vercel.app
      </p>
    </div>
  );
}
