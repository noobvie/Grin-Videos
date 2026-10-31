// Run: node --test tools/
import test from "node:test";
import assert from "node:assert/strict";
import { alignWordTimes, splitCues, timeSceneCues, toSrt } from "./captions.mjs";
import { applyPronunciation, narrationHash, sentences } from "./voice-text.mjs";

const TEXT =
  "Every Grin transaction is built by the sender and the receiver together. Mimblewimble hides the amounts, but not everything.";

test("cues stay short and keep every word in order", () => {
  const cues = splitCues(TEXT);
  assert.ok(cues.every((c) => c.text.length <= 42), JSON.stringify(cues));
  assert.equal(cues.map((c) => c.text).join(" "), TEXT);
  assert.ok(cues.some((c) => c.text.endsWith("together.")), "breaks after a sentence");
});

test("even timing covers the speech and never overlaps", () => {
  const cues = timeSceneCues(TEXT, 8);
  assert.equal(cues[0].start, 0);
  cues.forEach((c, i) => {
    assert.ok(c.end > c.start);
    if (cues[i + 1]) assert.ok(c.end <= cues[i + 1].start + 1e-9);
  });
});

test("alignment uses heard times and interpolates a misheard word", () => {
  const words = ["Grin", "uses", "Mimblewimble", "today."];
  const heard = [
    { text: " Grin", start: 0.0, end: 0.4 },
    { text: " uses", start: 0.4, end: 0.8 },
    { text: " Mumble", start: 0.8, end: 1.2 }, // misheard
    { text: " wimble", start: 1.2, end: 1.6 },
    { text: " today.", start: 1.7, end: 2.1 },
  ];
  const t = alignWordTimes(words, heard, 2.2);
  assert.deepEqual(t[0], { start: 0, end: 0.4 });
  assert.deepEqual(t[3], { start: 1.7, end: 2.1 });
  assert.ok(t[2].start >= 0.8 && t[2].end <= 1.7, "gap word placed between neighbours");
});

test("srt format", () => {
  const srt = toSrt([{ start: 0, end: 1.5, text: "Hello" }, { start: 61.25, end: 3725.004, text: "World" }]);
  assert.equal(srt, "1\n00:00:00,000 --> 00:00:01,500\nHello\n\n2\n00:01:01,250 --> 01:02:05,004\nWorld\n");
});

test("pronunciation replaces whole words only", () => {
  const dict = { "Dandelion++": "Dandelion plus plus", MW: "M W", _comment: "ignored" };
  assert.equal(applyPronunciation("Dandelion++ and MW, not MWEB.", dict), "Dandelion plus plus and M W, not MWEB.");
});

test("narration hash changes when the words change", () => {
  assert.equal(narrationHash("Hello world."), narrationHash("Hello world."));
  assert.notEqual(narrationHash("Hello world."), narrationHash("Hello world!"));
  assert.deepEqual(sentences("One. Two? Three"), ["One.", "Two?", "Three"]);
});

test("a long sentence is split evenly, without orphan words", () => {
  const cues = splitCues("The sender and the receiver build the transaction together.");
  assert.deepEqual(cues.map((c) => c.text), ["The sender and the receiver", "build the transaction together."]);
});
