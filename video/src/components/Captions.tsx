import React from "react";
import { useCurrentFrame, useVideoConfig } from "remotion";
import { C } from "../brand";
import { useUnit } from "./layout";
import type { Caption } from "../types";

/**
 * Burned-in captions. Most people watch short videos with the sound off.
 * Placed above the bottom ~15% of a vertical video, where TikTok/Shorts/Reels
 * put their own buttons and text.
 */
export const Captions: React.FC<{ captions: Caption[] }> = ({ captions }) => {
  const frame = useCurrentFrame();
  const { width, height } = useVideoConfig();
  const u = useUnit();
  const cue = captions.find((c) => frame >= c.from && frame < c.to);
  if (!cue) return null;
  const vertical = height > width;
  return (
    <div
      style={{
        position: "absolute",
        left: 0,
        right: 0,
        bottom: vertical ? height * 0.15 : height * 0.05,
        display: "flex",
        justifyContent: "center",
        padding: `0 ${70 * u}px`,
      }}
    >
      <div
        style={{
          background: "rgba(14, 17, 22, 0.86)",
          color: C.paper,
          fontSize: 50 * u,
          fontWeight: 600,
          lineHeight: 1.25,
          textAlign: "center",
          padding: `${14 * u}px ${28 * u}px`,
          borderRadius: 16 * u,
          maxWidth: vertical ? "100%" : "70%",
        }}
      >
        {cue.text}
      </div>
    </div>
  );
};
