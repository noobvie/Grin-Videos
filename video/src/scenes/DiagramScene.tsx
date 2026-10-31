import React from "react";
import { AbsoluteFill, interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";
import { C } from "../brand";
import { Heading, SceneFrame } from "../components/SceneFrame";
import { useUnit } from "../components/layout";
import type { DiagramScene as T } from "../types";

type Box = { cx: number; cy: number; w: number; h: number };
type Pt = { x: number; y: number };

/**
 * Animated flow diagram: boxes appear one after another, then the arrows draw
 * themselves in the order they are listed in scenes.json.
 * Vertical videos stack boxes top-to-bottom; landscape/square go left-to-right.
 * Arrows between neighbours are straight; arrows that skip a box curve around
 * (forward to the right/top, backward to the left/bottom).
 */
export const DiagramScene: React.FC<{ scene: T }> = ({ scene }) => {
  const frame = useCurrentFrame();
  const { fps, width: W, height: H, durationInFrames } = useVideoConfig();
  const u = useUnit();
  const vertical = H > W;
  const n = scene.nodes.length;

  const boxes: Box[] = scene.nodes.map((_, i) => {
    if (vertical) {
      const y0 = H * 0.27, span = H * 0.42; // leaves room for the caption line and burned-in captions
      return { cx: W / 2, cy: y0 + ((i + 0.5) * span) / n, w: W * 0.56, h: Math.min(170 * u, (span / n) * 0.5) };
    }
    const x0 = W * 0.06, span = W * 0.88;
    return { cx: x0 + ((i + 0.5) * span) / n, cy: H * 0.55, w: Math.min(400 * u, (span / n) * 0.62), h: 170 * u };
  });
  const indexOf = (id: string) => scene.nodes.findIndex((nd) => nd.id === id);

  // Timeline: boxes during the first part, arrows during the second.
  const start = fps * 0.3;
  const end = durationInFrames * 0.8;
  const nodeWindow = (end - start) * 0.45;
  const edgeWindow = end - start - nodeWindow;
  const nodeStep = nodeWindow / Math.max(n, 1);
  const edgeStep = edgeWindow / Math.max(scene.edges.length, 1);

  const edgeGeometry = (fromI: number, toI: number) => {
    const a = boxes[fromI], b = boxes[toI];
    const forward = toI > fromI;
    if (Math.abs(toI - fromI) === 1) {
      const s: Pt = vertical
        ? { x: a.cx, y: a.cy + (forward ? a.h / 2 : -a.h / 2) }
        : { x: a.cx + (forward ? a.w / 2 : -a.w / 2), y: a.cy };
      const e: Pt = vertical
        ? { x: b.cx, y: b.cy + (forward ? -b.h / 2 : b.h / 2) }
        : { x: b.cx + (forward ? -b.w / 2 : b.w / 2), y: b.cy };
      return { d: `M ${s.x} ${s.y} L ${e.x} ${e.y}`, mid: { x: (s.x + e.x) / 2, y: (s.y + e.y) / 2 } };
    }
    const sign = forward ? 1 : -1;
    const s: Pt = vertical ? { x: a.cx + (sign * a.w) / 2, y: a.cy } : { x: a.cx, y: a.cy - (sign * a.h) / 2 };
    const e: Pt = vertical ? { x: b.cx + (sign * b.w) / 2, y: b.cy } : { x: b.cx, y: b.cy - (sign * b.h) / 2 };
    const bulge = vertical ? W * 0.17 : H * 0.13;
    const c: Pt = vertical
      ? { x: s.x + sign * bulge, y: (s.y + e.y) / 2 }
      : { x: (s.x + e.x) / 2, y: s.y - sign * bulge };
    return {
      d: `M ${s.x} ${s.y} Q ${c.x} ${c.y} ${e.x} ${e.y}`,
      mid: { x: 0.25 * s.x + 0.5 * c.x + 0.25 * e.x, y: 0.25 * s.y + 0.5 * c.y + 0.25 * e.y },
    };
  };

  return (
    <SceneFrame>
      <div style={{ marginTop: 80 * u }}>
        <Heading>{scene.heading}</Heading>
      </div>
      <AbsoluteFill>
        <svg width={W} height={H} style={{ position: "absolute", inset: 0 }}>
          <defs>
            <marker id="arrow" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="5" markerHeight="5" orient="auto-start-reverse">
              <path d="M 0 0 L 10 5 L 0 10 z" fill={C.amber} />
            </marker>
          </defs>
          {scene.edges.map((edge, i) => {
            const g = edgeGeometry(indexOf(edge.from), indexOf(edge.to));
            const t0 = start + nodeWindow + i * edgeStep;
            const p = interpolate(frame, [t0, t0 + Math.min(edgeStep, fps * 0.8)], [0, 1], {
              extrapolateLeft: "clamp",
              extrapolateRight: "clamp",
            });
            return (
              <path
                key={i}
                d={g.d}
                pathLength={1}
                fill="none"
                stroke={C.amber}
                strokeWidth={7 * u}
                strokeLinecap="round"
                strokeDasharray={1}
                strokeDashoffset={1 - p}
                markerEnd={p > 0.97 ? "url(#arrow)" : undefined}
              />
            );
          })}
        </svg>

        {scene.nodes.map((node, i) => {
          const b = boxes[i];
          const enter = spring({ frame: frame - start - i * nodeStep, fps, config: { damping: 200 } });
          return (
            <div
              key={node.id}
              style={{
                position: "absolute",
                left: b.cx - b.w / 2,
                top: b.cy - b.h / 2,
                width: b.w,
                height: b.h,
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                textAlign: "center",
                background: C.inkRaised,
                border: `${4 * u}px solid ${C.line}`,
                borderRadius: 24 * u,
                opacity: enter,
                transform: `scale(${0.85 + 0.15 * enter})`,
              }}
            >
              <div style={{ fontSize: 46 * u, fontWeight: 800 }}>{node.label}</div>
              {node.sublabel ? <div style={{ fontSize: 30 * u, color: C.muted, marginTop: 6 * u }}>{node.sublabel}</div> : null}
            </div>
          );
        })}

        {scene.edges.map((edge, i) => {
          if (!edge.label) return null;
          const g = edgeGeometry(indexOf(edge.from), indexOf(edge.to));
          const t0 = start + nodeWindow + i * edgeStep;
          const o = interpolate(frame, [t0 + fps * 0.3, t0 + fps * 0.7], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
          return (
            <div
              key={i}
              style={{
                position: "absolute",
                left: g.mid.x,
                top: g.mid.y,
                transform: "translate(-50%, -50%)",
                background: C.ink,
                color: C.amber,
                border: `${3 * u}px solid ${C.amber}`,
                borderRadius: 999,
                padding: `${6 * u}px ${20 * u}px`,
                fontSize: 30 * u,
                fontWeight: 600,
                whiteSpace: "nowrap",
                opacity: o,
              }}
            >
              {edge.label}
            </div>
          );
        })}

        {scene.caption ? (
          <div
            style={{
              position: "absolute",
              left: 80 * u,
              right: 80 * u,
              top: vertical ? H * 0.715 : H * 0.8,
              fontSize: 42 * u,
              color: C.muted,
              textAlign: "center",
              lineHeight: 1.3,
              opacity: interpolate(frame, [end - fps * 0.5, end], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" }),
            }}
          >
            {scene.caption}
          </div>
        ) : null}
      </AbsoluteFill>
    </SceneFrame>
  );
};
