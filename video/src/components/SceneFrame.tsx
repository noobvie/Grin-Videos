import React from "react";
import { AbsoluteFill, interpolate, useCurrentFrame, useVideoConfig } from "remotion";
import { C, FONT_BODY } from "../brand";
import { useUnit } from "./layout";

/** Background, safe margins and a short fade in/out shared by every scene. */
export const SceneFrame: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const frame = useCurrentFrame();
  const { durationInFrames, fps } = useVideoConfig();
  const u = useUnit();
  const fade = Math.round(fps * 0.3);
  const opacity = interpolate(frame, [0, fade, durationInFrames - fade, durationInFrames], [0, 1, 1, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const drift = (frame / fps) * 6 * u;

  return (
    <AbsoluteFill style={{ backgroundColor: C.ink, fontFamily: FONT_BODY, color: C.paper }}>
      <AbsoluteFill
        style={{
          backgroundImage: `linear-gradient(${C.line} 1px, transparent 1px), linear-gradient(90deg, ${C.line} 1px, transparent 1px)`,
          backgroundSize: `${90 * u}px ${90 * u}px`,
          backgroundPosition: `0 ${drift}px`,
          opacity: 0.35,
        }}
      />
      <AbsoluteFill style={{ opacity, padding: `${150 * u}px ${80 * u}px` }}>{children}</AbsoluteFill>
    </AbsoluteFill>
  );
};

/** Scene heading with an amber underline that grows in. */
export const Heading: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const u = useUnit();
  const grow = interpolate(frame, [fps * 0.2, fps * 0.8], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  return (
    <div style={{ marginBottom: 50 * u }}>
      <div style={{ fontSize: 72 * u, fontWeight: 800, lineHeight: 1.1 }}>{children}</div>
      <div style={{ height: 8 * u, width: `${30 * grow}%`, background: C.amber, marginTop: 24 * u, borderRadius: 4 * u }} />
    </div>
  );
};
