#!/usr/bin/env node
// REVIEW GATE — a video may only be rendered when a human has ticked all
// four review boxes in videos/<id>/review.md, and every source the script
// cites ([S1], [S2], ...) is listed in sources.md.
//
// Every render path must call this first:
//   - video/scripts/render.mjs          (npm run render -- <id>)
//   - any future GitHub Actions render  (node tools/review-gate.mjs <id>)
// The Remotion composition also refuses to render if the gate is closed.
//
// CLI:   node tools/review-gate.mjs 0001
// Exit:  0 = gate open, 1 = gate closed (reasons are printed)
import path from "node:path";
import { fileURLToPath } from "node:url";
import {
  citedSources,
  definedSources,
  readNarration,
  readText,
  resolveVideoId,
  videoDir,
} from "./video-files.mjs";

// The four human review gates. The bold word on each checkbox line in
// review.md must match these names exactly.
export const REVIEW_GATES = ["Technical", "Facts", "Knowledge", "Tone"];

/** Checks review.md text only. Returns a list of problems (empty = all ticked). */
export function checkReviewMd(reviewMd) {
  if (reviewMd == null) return ["review.md is missing."];
  const text = reviewMd.replace(/<!--[\s\S]*?-->/g, "");
  const problems = [];
  for (const gate of REVIEW_GATES) {
    const re = new RegExp(String.raw`^\s*[-*]\s*\[([ xX])\]\s*\*\*${gate}\*\*`, "gm");
    const hits = [...text.matchAll(re)];
    if (hits.length === 0) problems.push(`Review box "${gate}" not found in review.md.`);
    else if (hits.length > 1) problems.push(`Review box "${gate}" appears ${hits.length} times; keep exactly one.`);
    else if (hits[0][1] === " ") problems.push(`Review box "${gate}" is not ticked.`);
  }
  return problems;
}

/** Checks that cited sources exist. Returns a list of problems. */
export function checkSources(scriptMd, sourcesMd) {
  const problems = [];
  const defined = definedSources(sourcesMd);
  if (defined.length === 0) problems.push("sources.md lists no sources ([S1], [S2], ...).");
  const narration = Object.values(readNarration(scriptMd)).join(" ");
  for (const id of citedSources(narration)) {
    if (!defined.includes(id)) problems.push(`script.md cites [${id}] but sources.md does not list it.`);
  }
  return problems;
}

/** Full gate for one video id. Returns { id, open, problems }. */
export function checkGate(idOrNumber) {
  const id = resolveVideoId(idOrNumber);
  const dir = videoDir(id);
  const problems = [
    ...checkReviewMd(readText(path.join(dir, "review.md"))),
    ...checkSources(readText(path.join(dir, "script.md")), readText(path.join(dir, "sources.md"))),
  ];
  return { id, open: problems.length === 0, problems };
}

/** Throws with a readable message when the gate is closed. */
export function assertGateOpen(idOrNumber) {
  const result = checkGate(idOrNumber);
  if (!result.open) {
    throw new Error(
      `REVIEW GATE CLOSED for ${result.id} — not rendering.\n` +
        result.problems.map((p) => "  ✗ " + p).join("\n") +
        `\nA human reviewer must fix these in videos/${result.id}/ (see PROCESS.md, step 3).`
    );
  }
  return result;
}

// Run as a CLI only when executed directly (not when imported).
if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  try {
    const { id } = assertGateOpen(process.argv[2]);
    console.log(`REVIEW GATE OPEN for ${id} — all ${REVIEW_GATES.length} review boxes ticked.`);
  } catch (err) {
    console.error(err.message);
    process.exit(1);
  }
}
