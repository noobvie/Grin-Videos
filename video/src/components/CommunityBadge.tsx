import React from "react";
import { C, COMMUNITY_LABEL } from "../brand";
import { useUnit } from "./layout";

/**
 * Always on screen, in every scene, so a clipped re-share still says it is
 * community-made. Not configurable from scenes.json on purpose.
 */
export const CommunityBadge: React.FC = () => {
  const u = useUnit();
  return (
    <div
      style={{
        position: "absolute",
        top: 60 * u,
        left: 60 * u,
        padding: `${10 * u}px ${22 * u}px`,
        border: `${3 * u}px solid ${C.teal}`,
        borderRadius: 999,
        color: C.teal,
        fontSize: 28 * u,
        fontWeight: 600,
        letterSpacing: 3 * u,
        textTransform: "uppercase",
        background: C.ink,
      }}
    >
      {COMMUNITY_LABEL}
    </div>
  );
};
