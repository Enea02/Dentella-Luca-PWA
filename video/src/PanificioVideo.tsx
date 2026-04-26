import { AbsoluteFill, Series } from "remotion";
import { Intro } from "./scenes/Intro";
import { Ordini } from "./scenes/Ordini";
import { WorkMode } from "./scenes/WorkMode";
import { Produzione } from "./scenes/Produzione";
import { Totali } from "./scenes/Totali";
import { Outro } from "./scenes/Outro";

export const VIDEO_WIDTH = 1920;
export const VIDEO_HEIGHT = 1080;
export const VIDEO_FPS = 30;
// 3 + 8 + 5 + 7 + 4 + 3 = 30 seconds
export const VIDEO_DURATION_FRAMES = 900;

export const PanificioVideo = () => (
  <AbsoluteFill style={{ backgroundColor: "#f1f5f9" }}>
    <Series>
      <Series.Sequence durationInFrames={90}>
        <Intro />
      </Series.Sequence>
      <Series.Sequence durationInFrames={240}>
        <Ordini />
      </Series.Sequence>
      <Series.Sequence durationInFrames={150}>
        <WorkMode />
      </Series.Sequence>
      <Series.Sequence durationInFrames={210}>
        <Produzione />
      </Series.Sequence>
      <Series.Sequence durationInFrames={120}>
        <Totali />
      </Series.Sequence>
      <Series.Sequence durationInFrames={90}>
        <Outro />
      </Series.Sequence>
    </Series>
  </AbsoluteFill>
);
