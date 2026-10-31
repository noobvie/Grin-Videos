// Shared helpers for reading a video folder (videos/<id>/).
// Used by the review gate and by the Remotion prepare/render scripts,
// so every tool reads script.md and sources.md the same way.
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

export const REPO_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
export const VIDEOS_DIR = path.join(REPO_ROOT, "videos");

// Video ids look like "0001_how-a-grin-transaction-works".
export const VIDEO_ID_RE = /^\d{4}_[a-z0-9-]+$/;

/** All real video ids (the _template folder is skipped). */
export function listVideoIds() {
  if (!fs.existsSync(VIDEOS_DIR)) return [];
  return fs
    .readdirSync(VIDEOS_DIR, { withFileTypes: true })
    .filter((d) => d.isDirectory() && VIDEO_ID_RE.test(d.name))
    .map((d) => d.name)
    .sort();
}

/**
 * Accepts a full id ("0001_how-a-grin-transaction-works") or just the
 * number ("0001" or "1") and returns the full id. Throws a readable error otherwise.
 */
export function resolveVideoId(input) {
  if (!input) throw new Error("No video id given. Example: npm run render -- 0001");
  const ids = listVideoIds();
  if (ids.includes(input)) return input;
  if (/^\d+$/.test(input)) {
    const prefix = input.padStart(4, "0") + "_";
    const match = ids.filter((id) => id.startsWith(prefix));
    if (match.length === 1) return match[0];
  }
  throw new Error(
    `Unknown video "${input}". Known videos:\n` + (ids.map((id) => "  " + id).join("\n") || "  (none)")
  );
}

export function videoDir(id) {
  return path.join(VIDEOS_DIR, id);
}

export function readText(file) {
  return fs.existsSync(file) ? fs.readFileSync(file, "utf8") : null;
}

/**
 * Narration lives in script.md under headings "## Scene 1", "## Scene 2", ...
 * Anything after the number on the heading line is a free label.
 * HTML comments and lines starting with ">" (writer notes) are not narration.
 * Returns a map { 1: "text", 2: "text", ... } with source markers kept.
 */
export function readNarration(scriptMd) {
  const out = {};
  if (!scriptMd) return out;
  const text = scriptMd.replace(/<!--[\s\S]*?-->/g, "");
  let current = null;
  for (const line of text.split(/\r?\n/)) {
    const h = line.match(/^##\s+Scene\s+(\d+)\b/i);
    if (h) {
      current = Number(h[1]);
      out[current] = "";
      continue;
    }
    if (/^#{1,2}\s/.test(line)) {
      current = null; // any other top-level heading ends the scene
      continue;
    }
    if (current === null || /^\s*>/.test(line)) continue;
    out[current] += line + "\n";
  }
  for (const k of Object.keys(out)) out[k] = out[k].replace(/\s+/g, " ").trim();
  return out;
}

const SOURCE_MARKER_RE = /\[S(\d+)\]/g;

/** Narration as it should be spoken: source markers like [S1] removed ("together [S1]." → "together."). */
export function spokenText(narration) {
  return (narration || "").replace(/\s*\[S\d+\]/g, "").replace(/\s+/g, " ").trim();
}

/** Source ids cited in a piece of text, e.g. "... [S1] ... [S3]" -> ["S1","S3"]. */
export function citedSources(text) {
  return [...new Set([...(text || "").matchAll(SOURCE_MARKER_RE)].map((m) => "S" + m[1]))];
}

/** Source ids defined in sources.md as list items starting with [S1], **[S1]** etc. */
export function definedSources(sourcesMd) {
  const ids = new Set();
  for (const line of (sourcesMd || "").replace(/<!--[\s\S]*?-->/g, "").split(/\r?\n/)) {
    const m = line.match(/^\s*[-*]\s*\**\[S(\d+)\]/);
    if (m) ids.add("S" + m[1]);
  }
  return [...ids];
}
