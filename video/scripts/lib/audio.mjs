// Small audio helpers: write WAV files, and decode any audio file (mp3, wav,
// m4a, ogg) to raw samples using the ffmpeg that ships with Remotion.
import fs from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);

/** Writes mono float samples (-1..1) as a 16-bit PCM WAV file. */
export function writeWav(file, samples, sampleRate) {
  const data = Buffer.alloc(samples.length * 2);
  for (let i = 0; i < samples.length; i++) {
    const s = Math.max(-1, Math.min(1, samples[i]));
    data.writeInt16LE(Math.round(s * 32767), i * 2);
  }
  const h = Buffer.alloc(44);
  h.write("RIFF", 0);
  h.writeUInt32LE(36 + data.length, 4);
  h.write("WAVEfmt ", 8);
  h.writeUInt32LE(16, 16);
  h.writeUInt16LE(1, 20); // PCM
  h.writeUInt16LE(1, 22); // mono
  h.writeUInt32LE(sampleRate, 24);
  h.writeUInt32LE(sampleRate * 2, 28);
  h.writeUInt16LE(2, 32);
  h.writeUInt16LE(16, 34);
  h.write("data", 36);
  h.writeUInt32LE(data.length, 40);
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, Buffer.concat([h, data]));
}

/** Joins sample arrays with `gapSeconds` of silence between them. */
export function joinWithSilence(parts, sampleRate, gapSeconds) {
  const gap = Math.round(gapSeconds * sampleRate);
  const total = parts.reduce((n, p) => n + p.length, 0) + gap * Math.max(parts.length - 1, 0);
  const out = new Float32Array(total);
  let at = 0;
  parts.forEach((p, i) => {
    out.set(p, at);
    at += p.length + (i < parts.length - 1 ? gap : 0);
  });
  return out;
}

/** Any audio file → mono Float32Array at `sampleRate` (default 16 kHz, what Whisper needs). */
export function decodeAudio(file, sampleRate = 16000) {
  // remotion-cli.js sits at the package root, next to dist/ (it isn't in "exports").
  const cli = path.join(path.dirname(require.resolve("@remotion/cli")), "..", "remotion-cli.js");
  const r = spawnSync(
    process.execPath,
    [cli, "ffmpeg", "-v", "error", "-i", file, "-ac", "1", "-ar", String(sampleRate), "-c:a", "pcm_s16le", "-f", "wav", "pipe:1"],
    { maxBuffer: 1024 * 1024 * 1024 }
  );
  if (r.status !== 0) throw new Error(`Could not read ${file}:\n${r.stderr?.toString() || r.error}`);
  return pcm16FromWav(r.stdout);
}

/** Samples of a 16-bit PCM WAV buffer (a streamed WAV has no reliable sizes, so read to the end). */
function pcm16FromWav(buf) {
  let at = 12;
  while (at + 8 <= buf.length) {
    const id = buf.toString("ascii", at, at + 4);
    const size = buf.readUInt32LE(at + 4);
    if (id === "data") {
      const start = at + 8;
      const n = Math.floor((buf.length - start) / 2);
      const out = new Float32Array(n);
      for (let i = 0; i < n; i++) out[i] = buf.readInt16LE(start + i * 2) / 32768;
      return out;
    }
    at += 8 + size + (size % 2);
  }
  throw new Error("No audio data found.");
}
