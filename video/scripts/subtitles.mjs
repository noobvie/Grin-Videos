// Makes subtitles for one video: videos/<id>/subtitles/<lang>.srt (upload this
// to YouTube etc.) and <lang>.json (timings the burned-in captions reuse).
//
//   npm run subtitles -- 0001
//   npm run subtitles -- 0001 --no-whisper   (skip speech recognition, spread evenly)
//
// Caption WORDS always come from script.md. Whisper (speech recognition, runs on
// your computer) only listens to the audio to find when each word is said.
// The first run downloads the Whisper model (~80 MB) once.
import fs from "node:fs";
import path from "node:path";
import { readText, resolveVideoId, videoDir } from "../../tools/video-files.mjs";
import { narrationHash } from "../../tools/voice-text.mjs";
import { timeSceneCues, toSrt } from "../../tools/captions.mjs";
import { prepareVideo } from "./prepare.mjs";
import { DEFAULT_WORDS_PER_SECOND, findSceneAudio } from "./lib/durations.mjs";
import { decodeAudio } from "./lib/audio.mjs";
import { subtitlesPaths, timingBasis } from "./lib/scene-timing.mjs";

const WHISPER_MODEL = { en: "onnx-community/whisper-base.en_timestamped", other: "onnx-community/whisper-base_timestamped" };

let asr = null;
async function heardWords(file, language) {
  if (!asr) {
    console.log("  loading Whisper speech-recognition model (first time downloads ~80 MB)…");
    const { pipeline } = await import("@huggingface/transformers");
    asr = await pipeline("automatic-speech-recognition", WHISPER_MODEL[language === "en" ? "en" : "other"], { dtype: "q8" });
  }
  const options = { return_timestamps: "word", chunk_length_s: 30 };
  if (language !== "en") Object.assign(options, { language, task: "transcribe" });
  const result = await asr(decodeAudio(file, 16000), options);
  return (result.chunks ?? []).map((c) => ({ text: c.text, start: c.timestamp[0], end: c.timestamp[1] ?? c.timestamp[0] }));
}

async function main() {
  const argv = process.argv.slice(2);
  const useWhisper = !argv.includes("--no-whisper");
  const id = resolveVideoId(argv.find((a) => !a.startsWith("--")));
  const dir = videoDir(id);
  const video = await prepareVideo(id);
  const wps = JSON.parse(readText(path.join(dir, "scenes.json"))).wordsPerSecond;

  const timings = { note: "Made by `npm run subtitles`. Times are seconds from each scene's start.", scenes: {} };
  const all = [];
  let sceneStart = 0;
  for (const [i, scene] of video.scenes.entries()) {
    const n = i + 1;
    const audioFile = findSceneAudio(path.join(dir, "audio"), n);
    let heard = null;
    if (scene.narration && audioFile && useWhisper) heard = await heardWords(audioFile, video.language);
    const cues = timeSceneCues(scene.narration, scene.speechSeconds, heard);
    timings.scenes[n] = {
      hash: narrationHash(scene.narration),
      basis: timingBasis(audioFile, wps ?? DEFAULT_WORDS_PER_SECOND),
      method: heard ? "whisper" : "even",
      cues,
    };
    for (const c of cues) all.push({ start: sceneStart + c.start, end: sceneStart + c.end, text: c.text });
    console.log(`  scene ${n}: ${cues.length} captions (${heard ? "Whisper timing" : audioFile ? "even timing" : "no audio yet — estimated timing"})`);
    sceneStart += scene.durationInFrames / video.fps;
  }

  const out = subtitlesPaths(dir, video.language);
  fs.mkdirSync(out.dir, { recursive: true });
  fs.writeFileSync(out.srt, toSrt(all));
  fs.writeFileSync(out.json, JSON.stringify(timings, null, 2) + "\n");
  console.log(`\nWrote ${path.relative(process.cwd(), out.srt)} (${all.length} captions).`);
  if (video.scenes.some((s) => s.narration && s.durationSource !== "audio")) {
    console.log("ℹ Some scenes have no audio yet — re-run this after `npm run voice` for exact timing.");
  }
}

main().catch((err) => {
  console.error("\n" + err.message);
  process.exit(1);
});
