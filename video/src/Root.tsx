import React from "react";
import { Composition, getRemotionEnvironment } from "remotion";
import { Explainer } from "./Explainer";
import type { PreparedVideo, VideoFormat } from "./types";
// Written by scripts/prepare.mjs from videos/*/ — regenerated on every studio/render run.
import videos from "./generated/videos.json";

const SIZES: Record<VideoFormat, { width: number; height: number }> = {
  vertical: { width: 1080, height: 1920 },
  landscape: { width: 1920, height: 1080 },
  square: { width: 1080, height: 1080 },
};

export const RemotionRoot: React.FC = () => (
  <>
    {(videos as PreparedVideo[]).map((video) => (
      <Composition
        key={video.id}
        id={video.compositionId}
        component={Explainer}
        fps={video.fps}
        {...SIZES[video.format]}
        durationInFrames={video.scenes.reduce((sum, s) => sum + s.durationInFrames, 0)}
        defaultProps={{ video }}
        // Review gate, second layer: previewing in the studio is always allowed,
        // rendering (from the CLI, the studio's Render button, or code) is not
        // until all four review boxes in review.md are ticked.
        calculateMetadata={({ props }) => {
          if (getRemotionEnvironment().isRendering && !props.video.reviewApproved) {
            throw new Error(
              `REVIEW GATE CLOSED for ${props.video.id} — not rendering.\n` +
                props.video.gateProblems.join("\n")
            );
          }
          return {};
        }}
      />
    ))}
  </>
);
