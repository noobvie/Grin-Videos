// Turns narration into the exact text a voice engine reads, and fingerprints
// it so we can tell when audio is older than the script.
import crypto from "node:crypto";

/**
 * Applies brand/pronunciation.json: { "written": "how to say it" }.
 * Whole words only, case-sensitive, longest entries first.
 */
export function applyPronunciation(text, dictionary = {}) {
  let out = text;
  const keys = Object.keys(dictionary).filter((k) => !k.startsWith("_")).sort((a, b) => b.length - a.length);
  for (const key of keys) {
    const esc = key.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const pre = /^[\p{L}\p{N}]/u.test(key) ? "(?<![\\p{L}\\p{N}])" : "";
    const post = /[\p{L}\p{N}]$/u.test(key) ? "(?![\\p{L}\\p{N}])" : "";
    out = out.replace(new RegExp(pre + esc + post, "gu"), dictionary[key]);
  }
  return out;
}

/** Short fingerprint of a scene's spoken text (from script.md, markers removed). */
export function narrationHash(spoken) {
  return crypto.createHash("sha256").update(spoken.normalize("NFC")).digest("hex").slice(0, 16);
}

/** Splits text into sentences so long scenes are voiced in safe-size pieces. */
export function sentences(text) {
  return text.split(/(?<=[.!?…])\s+/).map((s) => s.trim()).filter(Boolean);
}
