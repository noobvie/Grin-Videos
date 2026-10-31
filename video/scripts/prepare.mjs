// Reads every videos/<id>/ folder and writes src/generated/videos.json, which
// the Remotion compositions read. Also copies audio files into public/audio/
// so the player can load them. Runs automatically before `studio` and `render`.
//
//   node scripts/prepare.mjs            (problems are printed, other videos still load)
//   node scripts/prepare.mjs --strict   (exit 1 if any video has problems — used by CI)
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { checkGate } from "../../tools/review-gate.mjs";
import { listVideoIds, readNarration, readText, spokenText, videoDir } from "../../tools/video-files.mjs";
import { narrationHash } from "../../tools/voice-text.mjs";
import { timeSceneCues } from "../../tools/captions.mjs";
import {
  DEFAULT_WORDS_PER_SECOND,
  FPS,
  PAUSE_AFTER_AUDIO_S,
  audioSeconds,
  estimateSeconds,
  estimateSpeechSeconds,
  findSceneAudio,
  toFrames,
} from "./lib/durations.mjs";
import { readVoiceManifest } from "./lib/voice-manifest.mjs";
import { readSubtitleTimings, timingBasis } from "./lib/scene-timing.mjs";

const VIDEO_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const GENERATED = path.join(VIDEO_ROOT, "src", "generated", "videos.json");
const PUBLIC_AUDIO = path.join(VIDEO_ROOT, "public", "audio");

const SCENE_TYPES = ["title", "diagram", "callouts", "outro"];
const FORMATS = ["vertical", "landscape", "square"];

/** Returns a list of readable problems with scenes.json / script.md (empty = OK). */
function validate(id, data, narration) {
  const problems = [];
  if (data.id !== id) problems.push(`scenes.json "id" is "${data.id}" but the folder is "${id}".`);
  if (data.template !== "explainer") problems.push(`template "${data.template}" is not built yet (only "explainer").`);
  if (data.format && !FORMATS.includes(data.format)) problems.push(`format must be one of ${FORMATS.join(", ")}.`);
  if ("captions" in data && typeof data.captions !== "boolean") problems.push(`"captions" must be true or false.`);
  if (!Array.isArray(data.scenes) || data.scenes.length === 0) return [...problems, "scenes.json has no scenes."];
  data.scenes.forEach((s, i) => {
    const where = `scene ${i + 1}`;
    if (!SCENE_TYPES.includes(s.type)) problems.push(`${where}: unknown type "${s.type}" (use ${SCENE_TYPES.join(", ")}).`);
    if (s.type === "diagram") {
      const ids = (s.nodes || []).map((n) => n.id);
      if (ids.length === 0) problems.push(`${where}: diagram needs at least one node.`);
      for (const e of s.edges || []) {
        if (!ids.includes(e.from) || !ids.includes(e.to)) problems.push(`${where}: edge ${e.from}→${e.to} uses an unknown node id.`);
      }
    }
    if (s.type === "callouts" && !(s.points || []).length) problems.push(`${where}: callouts need at least one point.`);
  });
  const scriptScenes = Object.keys(narration).map(Number);
  const extra = scriptScenes.filter((n) => n > data.scenes.length);
  if (extra.length) problems.push(`script.md has "## Scene ${extra.join(", ")}" but scenes.json only has ${data.scenes.length} scenes.`);
  return problems;
}

export async function prepareVideo(id) {
  const dir = videoDir(id);
  const data = JSON.parse(readText(path.join(dir, "scenes.json")) ?? "null");
  if (!data) throw new Error(`${id}: scenes.json is missing.`);
  const narration = readNarration(readText(path.join(dir, "script.md")));
  const problems = validate(id, data, narration);
  if (problems.length) throw new Error(`${id}: ` + problems.join(`\n${id}: `));

  const wps = data.wordsPerSecond ?? DEFAULT_WORDS_PER_SECOND;
  const fps = data.fps ?? FPS;
  const language = data.language ?? "en";
  const gate = checkGate(id);
  const audioDir = path.join(dir, "audio");
  const voiceManifest = readVoiceManifest(audioDir);
  const savedTimings = readSubtitleTimings(dir, language);
  const warnings = [];

  const scenes = [];
  for (const [i, scene] of data.scenes.entries()) {
    const n = i + 1;
    const spoken = spokenText(narration[n]);
    const audioFile = findSceneAudio(audioDir, n);
    let seconds, speechSeconds, audioSrc = null, audioStale = false, audioEngine = null;
    if (audioFile) {
      speechSeconds = await audioSeconds(audioFile);
      seconds = speechSeconds + PAUSE_AFTER_AUDIO_S;
      audioSrc = `audio/${id}/${path.basename(audioFile)}`;
      fs.mkdirSync(path.join(PUBLIC_AUDIO, id), { recursive: true });
      fs.copyFileSync(audioFile, path.join(VIDEO_ROOT, "public", audioSrc));
      const made = voiceManifest.scenes[n];
      if (made && made.file === path.basename(audioFile)) {
        audioEngine = made.engine;
        audioStale = made.hash !== narrationHash(spoken);
        if (audioStale) warnings.push(`Scene ${n}: the AI voice was made from older words — run "npm run voice -- ${id.slice(0, 4)}".`);
      }
    } else {
      seconds = estimateSeconds(scene.type, spoken, wps);
      speechSeconds = Math.min(estimateSpeechSeconds(spoken, wps), seconds);
    }

    // Captions for this scene: saved (Whisper-aligned) timings if they still match, else even spread.
    const basis = timingBasis(audioFile, wps);
    const saved = savedTimings?.scenes?.[n];
    const fresh = saved && saved.hash === narrationHash(spoken) && saved.basis === basis;
    const cues = fresh ? saved.cues : timeSceneCues(spoken, speechSeconds);
    if (audioFile && spoken && !fresh) warnings.push(`Scene ${n}: captions use estimated timing — run "npm run subtitles -- ${id.slice(0, 4)}" for exact timing.`);

    scenes.push({
      ...scene,
      narration: spoken,
      durationInFrames: toFrames(seconds, fps),
      durationSource: audioFile ? "audio" : "estimate",
      speechSeconds,
      audioSrc,
      audioStale,
      audioEngine,
      cues,
    });
  }

  // Absolute caption timeline in frames, for the burned-in captions.
  const captions = [];
  let startFrame = 0;
  for (const s of scenes) {
    for (const c of s.cues) {
      const from = startFrame + Math.round(c.start * fps);
      const to = Math.min(startFrame + Math.round(c.end * fps), startFrame + s.durationInFrames);
      if (to > from) captions.push({ from, to, text: c.text });
    }
    startFrame += s.durationInFrames;
  }

  return {
    id,
    // Remotion composition ids may not contain "_".
    compositionId: id.replace(/_/g, "-"),
    title: data.title,
    template: data.template,
    language,
    format: data.format ?? "vertical",
    fps,
    reviewApproved: gate.open,
    gateProblems: gate.problems,
    captionsEnabled: data.captions ?? true,
    captions,
    warnings,
    scenes: scenes.map(({ cues, ...rest }) => rest),
  };
}

export async function prepareAll({ quiet = false } = {}) {
  const videos = [];
  const failed = [];
  for (const id of listVideoIds()) {
    try {
      const v = await prepareVideo(id);
      videos.push(v);
      if (!quiet) {
        const total = v.scenes.reduce((s, sc) => s + sc.durationInFrames, 0) / v.fps;
        const audio = v.scenes.filter((s) => s.durationSource === "audio").length;
        console.log(
          `  ✓ ${id}  ${total.toFixed(1)} s  (audio for ${audio}/${v.scenes.length} scenes)  review gate: ${v.reviewApproved ? "OPEN" : "closed"}`
        );
        if (total > 120) console.log(`    ⚠ longer than 120 s — trim the script.`);
        for (const w of v.warnings) console.log(`    ⚠ ${w}`);
      }
    } catch (err) {
      failed.push(id);
      console.error(`  ✗ ${err.message}`);
    }
  }
  fs.mkdirSync(path.dirname(GENERATED), { recursive: true });
  fs.writeFileSync(GENERATED, JSON.stringify(videos, null, 2));
  return { videos, failed };
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  console.log("Preparing videos/ …");
  const { failed } = await prepareAll();
  if (failed.length) {
    console.error(`\n${failed.length} video(s) skipped — fix the problems above to see them in the studio.`);
    if (process.argv.includes("--strict")) process.exit(1);
  }
}
