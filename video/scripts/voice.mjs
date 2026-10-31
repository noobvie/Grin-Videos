// Makes the narration audio for one video with a local AI voice.
// One file per scene: videos/<id>/audio/scene-01.wav, scene-02.wav, …
// Scenes whose words haven't changed since last time are skipped.
//
//   npm run voice -- 0001                    (default voice from brand/brand.json)
//   npm run voice -- 0001 --voice am_michael (try another Kokoro voice)
//   npm run voice -- 0001 --engine say       (macOS built-in voice, preview only)
//   npm run voice -- 0001 --force            (redo every scene)
//
// The first Kokoro run downloads the voice model (~90 MB) once.
import fs from "node:fs";
import path from "node:path";
import os from "node:os";
import { spawnSync } from "node:child_process";
import { checkGate } from "../../tools/review-gate.mjs";
import { REPO_ROOT, readNarration, readText, resolveVideoId, spokenText, videoDir } from "../../tools/video-files.mjs";
import { applyPronunciation, narrationHash, sentences } from "../../tools/voice-text.mjs";
import { AUDIO_EXTENSIONS, audioSeconds } from "./lib/durations.mjs";
import { joinWithSilence, writeWav } from "./lib/audio.mjs";
import { readVoiceManifest, writeVoiceManifest } from "./lib/voice-manifest.mjs";

const KOKORO_MODEL = "onnx-community/Kokoro-82M-v1.0-ONNX";
const KOKORO_DTYPE = "q8"; // good quality, small and fast; "fp32" is slightly better and ~4× bigger
const SENTENCE_GAP_S = 0.25;

function parseArgs(argv) {
  const args = { id: null, force: false };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === "--force") args.force = true;
    else if (a === "--engine" || a === "--voice" || a === "--speed" || a === "--scene") args[a.slice(2)] = argv[++i];
    else if (!args.id) args.id = a;
    else throw new Error(`Unknown option "${a}".`);
  }
  return args;
}

let kokoro = null;
async function kokoroSpeak(text, voice, speed) {
  if (!kokoro) {
    console.log("  loading Kokoro voice model (first time downloads ~90 MB)…");
    const { KokoroTTS } = await import("kokoro-js");
    kokoro = await KokoroTTS.from_pretrained(KOKORO_MODEL, { dtype: KOKORO_DTYPE, device: "cpu" });
    if (!kokoro.voices[voice]) {
      throw new Error(`Kokoro has no voice "${voice}". Available: ${Object.keys(kokoro.voices).join(", ")}`);
    }
  }
  const parts = [];
  let rate = 24000;
  for (const s of sentences(text)) {
    const audio = await kokoro.generate(s, { voice, speed });
    rate = audio.sampling_rate;
    parts.push(audio.audio);
  }
  return { samples: joinWithSilence(parts, rate, SENTENCE_GAP_S), rate };
}

function saySpeak(text, voice, speed, file) {
  if (process.platform !== "darwin") throw new Error('The "say" engine only exists on macOS.');
  const args = ["-r", String(Math.round(175 * speed)), "-o", file, "--file-format=WAVE", "--data-format=LEI16@24000"];
  if (voice) args.unshift("-v", voice);
  const tmp = path.join(os.tmpdir(), `grin-videos-say-${process.pid}.txt`);
  fs.writeFileSync(tmp, text);
  const r = spawnSync("say", [...args, "-f", tmp]);
  fs.rmSync(tmp, { force: true });
  if (r.status !== 0) throw new Error(`"say" failed: ${r.stderr?.toString()}`);
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const id = resolveVideoId(args.id);
  const dir = videoDir(id);
  const brand = JSON.parse(readText(path.join(REPO_ROOT, "brand", "brand.json")));
  const scenes = JSON.parse(readText(path.join(dir, "scenes.json")));
  const dictionary = JSON.parse(readText(path.join(REPO_ROOT, "brand", "pronunciation.json")) ?? "{}");

  const engine = args.engine ?? scenes.voice?.engine ?? brand.voice.engine;
  const voice = args.voice ?? scenes.voice?.name ?? (engine === "kokoro" ? brand.voice.name : null);
  const speed = Number(args.speed ?? scenes.voice?.speed ?? brand.voice.speed ?? 1);
  if (!["kokoro", "say"].includes(engine)) throw new Error(`Unknown engine "${engine}" (use kokoro or say).`);
  if (engine === "kokoro" && (scenes.language ?? "en") !== "en") {
    throw new Error(`Kokoro voices are English only; this video's language is "${scenes.language}". Use --engine say to preview.`);
  }

  console.log(`Voice for ${id}: ${engine}${voice ? " / " + voice : ""}, speed ${speed}`);
  if (engine === "say") console.log("  ⚠ macOS 'say' is for previews. Check Apple's terms before publishing with it.");
  if (!checkGate(id).open) {
    console.log("  ℹ Review gate is still closed — fine for previewing. If the script changes, re-run this;");
    console.log("    the render refuses audio that no longer matches the script.");
  }

  const audioDir = path.join(dir, "audio");
  const manifest = readVoiceManifest(audioDir);
  const narration = readNarration(readText(path.join(dir, "script.md")));
  const only = args.scene ? Number(args.scene) : null;

  for (let n = 1; n <= scenes.scenes.length; n++) {
    if (only && n !== only) continue;
    const base = "scene-" + String(n).padStart(2, "0");
    const file = path.join(audioDir, `${base}.wav`);
    const spoken = spokenText(narration[n]);
    const hash = narrationHash(spoken);
    const entry = manifest.scenes[n];

    // Never touch a recording a person made (any scene-NN.* file this tool didn't create).
    const own = AUDIO_EXTENSIONS.map((ext) => path.join(audioDir, `${base}.${ext}`)).find(
      (f) => fs.existsSync(f) && !(entry && path.basename(f) === entry.file)
    );
    if (own) {
      console.log(`  scene ${n}: kept your recording ${path.basename(own)} (delete it to use the AI voice)`);
      continue;
    }
    if (!spoken) {
      if (entry) fs.rmSync(path.join(audioDir, entry.file), { force: true });
      delete manifest.scenes[n];
      console.log(`  scene ${n}: no narration — no audio`);
      continue;
    }
    const same = entry && entry.hash === hash && entry.engine === engine && entry.voice === voice && entry.speed === speed;
    if (same && !args.force && fs.existsSync(file)) {
      console.log(`  scene ${n}: up to date`);
      continue;
    }

    const text = applyPronunciation(spoken, dictionary);
    fs.mkdirSync(audioDir, { recursive: true });
    if (engine === "kokoro") {
      const { samples, rate } = await kokoroSpeak(text, voice, speed);
      writeWav(file, samples, rate);
    } else {
      saySpeak(text, voice, speed, file);
    }
    manifest.scenes[n] = { file: path.basename(file), hash, engine, voice, speed, created: new Date().toISOString() };
    writeVoiceManifest(audioDir, manifest);
    console.log(`  scene ${n}: ✓ ${(await audioSeconds(file)).toFixed(1)} s`);
  }

  console.log(`\nDone. Next: npm run subtitles -- ${id.slice(0, 4)}   then   npm run studio`);
}

main().catch((err) => {
  console.error("\n" + err.message);
  process.exit(1);
});
