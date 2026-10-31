import React from "react";
import { interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";
import { C } from "../brand";
import { SceneFrame } from "../components/SceneFrame";
import { useUnit } from "../components/layout";
import type { TitleScene as T } from "../types";

export const TitleScene: React.FC<{ scene: T }> = ({ scene }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const u = useUnit();
  const pop = spring({ frame, fps, config: { damping: 200 } });
  const sub = interpolate(frame, [fps * 0.6, fps * 1.2], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });

  return (
    <SceneFrame>
      <div style={{ flex: 1, display: "flex", flexDirection: "column", justifyContent: "center" }}>
        <div style={{ color: C.amber, fontSize: 32 * u, fontWeight: 600, letterSpacing: 4 * u, marginBottom: 30 * u }}>
          GRIN EXPLAINED · COMMUNITY-MADE
        </div>
        <div
          style={{
            fontSize: 110 * u,
            fontWeight: 800,
            lineHeight: 1.05,
            transform: `translateY(${(1 - pop) * 60 * u}px)`,
            opacity: pop,
          }}
        >
          {scene.heading}
        </div>
        {scene.subheading ? (
          <div style={{ fontSize: 46 * u, color: C.muted, marginTop: 40 * u, lineHeight: 1.3, opacity: sub }}>
            {scene.subheading}
          </div>
        ) : null}
      </div>
    </SceneFrame>
  );
};
