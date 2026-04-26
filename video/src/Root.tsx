import { Composition } from "remotion";
import {
  PanificioVideo,
  VIDEO_DURATION_FRAMES,
  VIDEO_FPS,
  VIDEO_HEIGHT,
  VIDEO_WIDTH,
} from "./PanificioVideo";

export const Root = () => (
  <Composition
    id="PanificioVideo"
    component={PanificioVideo}
    durationInFrames={VIDEO_DURATION_FRAMES}
    fps={VIDEO_FPS}
    width={VIDEO_WIDTH}
    height={VIDEO_HEIGHT}
  />
);
