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
import { DEFAULT_WORDS_PER_SECOND, FPS, audioSeconds, estimateSeconds, findSceneAudio, toFrames } from "./lib/durations.mjs";

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
  const gate = checkGate(id);

  const scenes = [];
  for (const [i, scene] of data.scenes.entries()) {
    const n = i + 1;
    const spoken = spokenText(narration[n]);
    const audioFile = findSceneAudio(path.join(dir, "audio"), n);
    let seconds, audioSrc = null;
    if (audioFile) {
      seconds = await audioSeconds(audioFile);
      audioSrc = `audio/${id}/${path.basename(audioFile)}`;
      fs.mkdirSync(path.join(PUBLIC_AUDIO, id), { recursive: true });
      fs.copyFileSync(audioFile, path.join(VIDEO_ROOT, "public", audioSrc));
    } else {
      seconds = estimateSeconds(scene.type, spoken, wps);
    }
    scenes.push({ ...scene, narration: spoken, durationInFrames: toFrames(seconds, fps), durationSource: audioFile ? "audio" : "estimate", audioSrc });
  }

  return {
    id,
    // Remotion composition ids may not contain "_".
    compositionId: id.replace(/_/g, "-"),
    title: data.title,
    template: data.template,
    language: data.language ?? "en",
    format: data.format ?? "vertical",
    fps,
    reviewApproved: gate.open,
    gateProblems: gate.problems,
    scenes,
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
