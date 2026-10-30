// How long each scene lasts.
//   1. If videos/<id>/audio/scene-NN.<ext> exists → its length + a short pause.
//   2. Otherwise → estimate from the narration's word count (wordsPerSecond).
import fs from "node:fs";
import path from "node:path";
import { parseFile } from "music-metadata";

export const FPS = 30;
export const DEFAULT_WORDS_PER_SECOND = 2.5; // ≈150 words/minute, a calm explainer pace
export const AUDIO_EXTENSIONS = ["mp3", "wav", "m4a", "ogg"];

const PAUSE_AFTER_AUDIO_S = 0.5; // breathing room before the next scene
const PAUSE_AFTER_ESTIMATE_S = 0.8;
const MIN_SCENE_S = { title: 3, outro: 5, diagram: 4, callouts: 4 };

export function countWords(text) {
  return (text || "").split(/\s+/).filter(Boolean).length;
}

export function estimateSeconds(sceneType, spoken, wordsPerSecond = DEFAULT_WORDS_PER_SECOND) {
  const min = MIN_SCENE_S[sceneType] ?? 3;
  const words = countWords(spoken);
  if (words === 0) return min;
  return Math.max(min, words / wordsPerSecond + PAUSE_AFTER_ESTIMATE_S);
}

/** scene-01.mp3 etc. for scene number n (1-based), or null. */
export function findSceneAudio(audioDir, n) {
  const base = "scene-" + String(n).padStart(2, "0");
  for (const ext of AUDIO_EXTENSIONS) {
    const file = path.join(audioDir, `${base}.${ext}`);
    if (fs.existsSync(file)) return file;
  }
  return null;
}

export async function audioSeconds(file) {
  const meta = await parseFile(file, { duration: true });
  if (!meta.format.duration) throw new Error(`Could not read the length of ${file}`);
  return meta.format.duration + PAUSE_AFTER_AUDIO_S;
}

export const toFrames = (seconds, fps = FPS) => Math.ceil(seconds * fps);
