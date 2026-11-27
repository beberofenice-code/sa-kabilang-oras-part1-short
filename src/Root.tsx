import React from "react";
import { Composition } from "remotion";
import { KabilangShort, KABILANG_FRAMES } from "./videos/kabilang/KabilangShort";
import { FPS } from "./videos/kabilang/story";

export const RemotionRoot: React.FC = () => (
  <>
    <Composition
      id="KabilangShort"
      component={KabilangShort}
      durationInFrames={KABILANG_FRAMES}
      fps={FPS}
      width={1080}
      height={1920}
    />
  </>
);
