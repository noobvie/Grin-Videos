// Shapes of videos/<id>/scenes.json after scripts/prepare.mjs has added
// narration (from script.md) and a duration to every scene.

export type DiagramNode = { id: string; label: string; sublabel?: string };
export type DiagramEdge = { from: string; to: string; label?: string };
export type CalloutKind = "point" | "note" | "limit";
export type Callout = { text: string; kind?: CalloutKind };

export type TitleScene = { type: "title"; heading: string; subheading?: string };
export type DiagramScene = {
  type: "diagram";
  heading: string;
  nodes: DiagramNode[];
  edges: DiagramEdge[];
  caption?: string;
};
export type CalloutsScene = { type: "callouts"; heading: string; points: Callout[] };
export type OutroScene = { type: "outro"; heading?: string; links?: string[] };

export type Scene = TitleScene | DiagramScene | CalloutsScene | OutroScene;

export type PreparedScene = Scene & {
  narration: string;
  durationInFrames: number;
  durationSource: "audio" | "estimate";
  audioSrc: string | null; // path under video/public/, for staticFile()
};

export type VideoFormat = "vertical" | "landscape" | "square";

export type PreparedVideo = {
  id: string;
  compositionId: string;
  title: string;
  template: "explainer";
  language: string;
  format: VideoFormat;
  fps: number;
  reviewApproved: boolean;
  gateProblems: string[];
  scenes: PreparedScene[];
};
