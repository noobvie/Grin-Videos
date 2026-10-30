import React from "react";
import { AbsoluteFill, Audio, Series, staticFile } from "remotion";
import { C, FONT_BODY } from "./brand";
import { CommunityBadge } from "./components/CommunityBadge";
import { CalloutsScene } from "./scenes/CalloutsScene";
import { DiagramScene } from "./scenes/DiagramScene";
import { OutroScene } from "./scenes/OutroScene";
import { TitleScene } from "./scenes/TitleScene";
import type { PreparedScene, PreparedVideo } from "./types";

const SceneSwitch: React.FC<{ scene: PreparedScene }> = ({ scene }) => {
  switch (scene.type) {
    case "title":
      return <TitleScene scene={scene} />;
    case "diagram":
      return <DiagramScene scene={scene} />;
    case "callouts":
      return <CalloutsScene scene={scene} />;
    case "outro":
      return <OutroScene scene={scene} />;
  }
};

/**
 * The "Explainer" template: title card → diagram / callout scenes → outro.
 * Each scene lasts as long as its audio file (or the words-per-second estimate
 * when there is no audio yet) — computed by scripts/prepare.mjs.
 */
export const Explainer: React.FC<{ video: PreparedVideo }> = ({ video }) => (
  <AbsoluteFill style={{ backgroundColor: C.ink, fontFamily: FONT_BODY }}>
    <Series>
      {video.scenes.map((scene, i) => (
        <Series.Sequence key={i} durationInFrames={scene.durationInFrames} name={`Scene ${i + 1} · ${scene.type}`}>
          <SceneSwitch scene={scene} />
          {scene.audioSrc ? <Audio src={staticFile(scene.audioSrc)} /> : null}
        </Series.Sequence>
      ))}
    </Series>
    <CommunityBadge />
  </AbsoluteFill>
);
