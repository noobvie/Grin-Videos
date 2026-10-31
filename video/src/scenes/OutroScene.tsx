import React from "react";
import { interpolate, useCurrentFrame, useVideoConfig } from "remotion";
import { C, COMMUNITY_LABEL, DISCLAIMER, FONT_MONO } from "../brand";
import { SceneFrame } from "../components/SceneFrame";
import { useUnit } from "../components/layout";
import type { OutroScene as T } from "../types";

export const OutroScene: React.FC<{ scene: T }> = ({ scene }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const u = useUnit();
  const show = (start: number) =>
    interpolate(frame, [fps * start, fps * (start + 0.5)], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });

  return (
    <SceneFrame>
      <div style={{ flex: 1, display: "flex", flexDirection: "column", justifyContent: "center", gap: 60 * u }}>
        <div style={{ opacity: show(0.1) }}>
          <div style={{ fontSize: 80 * u, fontWeight: 800 }}>{scene.heading ?? "Learn more"}</div>
          {(scene.links ?? []).map((link) => (
            <div key={link} style={{ fontFamily: FONT_MONO, color: C.amber, fontSize: 44 * u, marginTop: 24 * u }}>
              {link}
            </div>
          ))}
        </div>
        {/* Fixed text — deliberately not editable from scenes.json. */}
        <div
          style={{
            opacity: show(0.6),
            border: `${4 * u}px solid ${C.teal}`,
            borderRadius: 24 * u,
            padding: `${40 * u}px ${44 * u}px`,
          }}
        >
          <div style={{ color: C.teal, fontSize: 52 * u, fontWeight: 800, textTransform: "uppercase", letterSpacing: 3 * u }}>
            {COMMUNITY_LABEL}
          </div>
          <div style={{ color: C.paper, fontSize: 38 * u, marginTop: 18 * u, lineHeight: 1.35 }}>{DISCLAIMER}</div>
        </div>
      </div>
    </SceneFrame>
  );
};
