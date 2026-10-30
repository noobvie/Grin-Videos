// Tests for the review gate. Run: node --test tools/
import test from "node:test";
import assert from "node:assert/strict";
import { checkReviewMd, checkSources } from "./review-gate.mjs";
import { readNarration, spokenText } from "./video-files.mjs";

const box = (gate, ticked) => `- [${ticked ? "x" : " "}] **${gate}** — checked`;
const review = (t) =>
  ["Technical", "Facts", "Knowledge", "Tone"].map((g, i) => box(g, t[i])).join("\n");

test("all four boxes ticked opens the gate", () => {
  assert.deepEqual(checkReviewMd(review([1, 1, 1, 1])), []);
});

test("one unticked box closes the gate", () => {
  const p = checkReviewMd(review([1, 1, 0, 1]));
  assert.equal(p.length, 1);
  assert.match(p[0], /Knowledge.*not ticked/);
});

test("missing review.md closes the gate", () => {
  assert.match(checkReviewMd(null)[0], /missing/);
});

test("a ticked box inside an HTML comment does not count", () => {
  const md = review([1, 1, 1, 0]) + "\n<!-- - [x] **Tone** -->";
  assert.match(checkReviewMd(md)[0], /Tone.*not ticked/);
});

test("duplicated box closes the gate", () => {
  const md = review([1, 1, 1, 1]) + "\n" + box("Tone", true);
  assert.match(checkReviewMd(md)[0], /appears 2 times/);
});

test("cited source missing from sources.md closes the gate", () => {
  const script = "## Scene 1\nGrin has no addresses on chain [S1] [S2].";
  const p = checkSources(script, "- **[S1]** Grin docs — https://docs.grin.mw");
  assert.deepEqual(p, ["script.md cites [S2] but sources.md does not list it."]);
});

test("narration is read per scene, notes and comments skipped", () => {
  const md = "# Title\n## Scene 1 · hook\nHello [S1]\n> note\n<!-- hidden -->\n## Scene 2\nWorld\n## Notes\nignored";
  const n = readNarration(md);
  assert.deepEqual(n, { 1: "Hello [S1]", 2: "World" });
  assert.equal(spokenText(n[1]), "Hello");
});
