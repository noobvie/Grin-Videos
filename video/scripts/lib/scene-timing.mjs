// Where each scene's captions come from, and how to tell if saved caption
// timings (videos/<id>/subtitles/<lang>.json) still fit the current script + audio.
import fs from "node:fs";
import path from "node:path";

/** Identifies the timing source of a scene: its audio file (name + size) or the estimate. */
export function timingBasis(audioFile, wordsPerSecond) {
  if (!audioFile) return `estimate:${wordsPerSecond}`;
  return `audio:${path.basename(audioFile)}:${fs.statSync(audioFile).size}`;
}

export function subtitlesPaths(videoDir, language) {
  const dir = path.join(videoDir, "subtitles");
  return { dir, srt: path.join(dir, `${language}.srt`), json: path.join(dir, `${language}.json`) };
}

export function readSubtitleTimings(videoDir, language) {
  try {
    return JSON.parse(fs.readFileSync(subtitlesPaths(videoDir, language).json, "utf8"));
  } catch {
    return null;
  }
}
