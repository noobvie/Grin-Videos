import React from "react";
import { spring, useCurrentFrame, useVideoConfig } from "remotion";
import { C } from "../brand";
import { Heading, SceneFrame } from "../components/SceneFrame";
import { useUnit } from "../components/layout";
import type { CalloutKind, CalloutsScene as T } from "../types";

const STYLE: Record<CalloutKind, { color: string; tag: string | null }> = {
  point: { color: C.amber, tag: null },
  note: { color: C.teal, tag: "Note" },
  limit: { color: C.coral, tag: "Limit" },
};

export const CalloutsScene: React.FC<{ scene: T }> = ({ scene }) => {
  const frame = useCurrentFrame();
  const { fps, durationInFrames } = useVideoConfig();
  const u = useUnit();
  // Spread the callouts over the first ~70% of the scene so the last one is
  // on screen while the narrator talks about it.
  const step = (durationInFrames * 0.7) / Math.max(scene.points.length, 1);

  return (
    <SceneFrame>
      <div style={{ marginTop: 80 * u }}>
        <Heading>{scene.heading}</Heading>
      </div>
      <div style={{ flex: 1, display: "flex", flexDirection: "column", justifyContent: "center", gap: 34 * u, paddingBottom: 380 * u }}>
        {scene.points.map((p, i) => {
          const s = STYLE[p.kind ?? "point"];
          const enter = spring({ frame: frame - fps * 0.4 - i * step, fps, config: { damping: 200 } });
          return (
            <div
              key={i}
              style={{
                display: "flex",
                flexDirection: "column",
                gap: 10 * u,
                background: C.inkRaised,
                borderLeft: `${12 * u}px solid ${s.color}`,
                borderRadius: 18 * u,
                padding: `${34 * u}px ${40 * u}px`,
                opacity: enter,
                transform: `translateX(${(1 - enter) * -80 * u}px)`,
              }}
            >
              {s.tag ? (
                <div style={{ color: s.color, fontSize: 28 * u, fontWeight: 800, letterSpacing: 3 * u, textTransform: "uppercase" }}>
                  {s.tag}
                </div>
              ) : null}
              <div style={{ fontSize: 48 * u, lineHeight: 1.25 }}>{p.text}</div>
            </div>
          );
        })}
      </div>
    </SceneFrame>
  );
};
