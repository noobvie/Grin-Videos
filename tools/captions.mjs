// Caption (subtitle) logic shared by `npm run subtitles` and the burned-in
// captions in the video. Pure functions, no dependencies.
//
// The words always come from script.md (never from speech recognition), so a
// caption can't show a misheard word. Speech recognition (Whisper) is only
// used to find WHEN each word is spoken.

export const MAX_CUE_CHARS = 42; // common subtitle guideline: ≤ 42 characters per line

const norm = (w) => w.toLowerCase().normalize("NFKD").replace(/[^\p{L}\p{N}]/gu, "");

/**
 * Splits spoken text into caption cues of at most `maxChars` characters.
 * Sentences are kept apart; a long sentence is cut at commas first, then into
 * evenly sized pieces (so no cue is left with one or two orphan words).
 * Returns [{ text, from, to }] where from/to are word indexes (to exclusive).
 */
export function splitCues(text, maxChars = MAX_CUE_CHARS) {
  const words = (text || "").split(/\s+/).filter(Boolean);
  const lengthOf = (from, to) => words.slice(from, to).join(" ").length;

  // 1. Segments: sentence ends always break; clause marks break when the sentence is too long.
  const segments = [];
  let from = 0;
  words.forEach((w, i) => {
    const sentenceEnd = /[.!?…]["”')]*$/.test(w);
    const clauseEnd = /[,;:—]$/.test(w);
    if (sentenceEnd || (clauseEnd && lengthOf(from, sentenceEndAfter(i)) > maxChars)) {
      segments.push([from, i + 1]);
      from = i + 1;
    }
  });
  if (from < words.length) segments.push([from, words.length]);

  function sentenceEndAfter(i) {
    let k = i;
    while (k < words.length - 1 && !/[.!?…]["”')]*$/.test(words[k])) k++;
    return k + 1;
  }

  // 2. Long segments → k evenly sized cues.
  const cues = [];
  for (const [a, b] of segments) {
    const total = lengthOf(a, b);
    const k = Math.ceil(total / maxChars);
    const target = total / k;
    let start = a;
    for (let part = 1; part < k; part++) {
      // Cut where this cue's length is closest to the even share.
      let end = start + 1;
      for (let e = start + 1; e <= b - (k - part) && lengthOf(start, e) <= maxChars; e++) {
        if (Math.abs(lengthOf(start, e) - target) < Math.abs(lengthOf(start, end) - target)) end = e;
      }
      cues.push([start, end]);
      start = end;
    }
    cues.push([start, b]);
  }
  return cues.map(([a, b]) => ({ text: words.slice(a, b).join(" "), from: a, to: b }));
}

/** Word timings spread evenly by length over [0, seconds]. */
export function proportionalWordTimes(words, seconds) {
  const weights = words.map((w) => w.length + 1);
  const total = weights.reduce((a, b) => a + b, 0) || 1;
  let t = 0;
  return weights.map((wt) => {
    const start = t;
    t += (wt / total) * seconds;
    return { start, end: t };
  });
}

/**
 * Gives every script word a time, using speech-recognition words where they
 * match (in order) and filling the gaps by interpolation.
 *   scriptWords: ["Every", "Grin", ...]
 *   heard:       [{ text: " Every", start: 0, end: 0.5 }, ...]
 *   seconds:     length of the speech
 */
export function alignWordTimes(scriptWords, heard, seconds) {
  const a = scriptWords.map(norm);
  const b = heard.map((h) => norm(h.text));
  const n = a.length, m = b.length;
  // Longest-common-subsequence table: which script words were heard, in order.
  const L = Array.from({ length: n + 1 }, () => new Int32Array(m + 1));
  for (let i = n - 1; i >= 0; i--)
    for (let j = m - 1; j >= 0; j--)
      L[i][j] = a[i] && a[i] === b[j] ? L[i + 1][j + 1] + 1 : Math.max(L[i + 1][j], L[i][j + 1]);
  const times = new Array(n).fill(null);
  for (let i = 0, j = 0; i < n && j < m; ) {
    if (a[i] && a[i] === b[j]) {
      times[i] = { start: heard[j].start, end: heard[j].end };
      i++, j++;
    } else if (L[i + 1][j] >= L[i][j + 1]) i++;
    else j++;
  }
  // Fill unmatched runs between known neighbours, by word length.
  for (let i = 0; i < n; ) {
    if (times[i]) { i++; continue; }
    let k = i;
    while (k < n && !times[k]) k++;
    const lo = i > 0 ? times[i - 1].end : 0;
    const hi = k < n ? times[k].start : Math.max(seconds, lo);
    const fill = proportionalWordTimes(scriptWords.slice(i, k), Math.max(hi - lo, 0));
    fill.forEach((f, x) => (times[i + x] = { start: lo + f.start, end: lo + f.end }));
    i = k;
  }
  return times;
}

/**
 * Timed cues for one scene, in seconds from the scene start.
 * Pass `heard` (speech-recognition words) to align; omit it to spread evenly.
 */
export function timeSceneCues(spoken, speechSeconds, heard = null, maxChars = MAX_CUE_CHARS) {
  const words = (spoken || "").split(/\s+/).filter(Boolean);
  if (words.length === 0) return [];
  const times = heard && heard.length ? alignWordTimes(words, heard, speechSeconds) : proportionalWordTimes(words, speechSeconds);
  const cues = splitCues(spoken, maxChars).map((c) => ({
    text: c.text,
    start: times[c.from].start,
    end: times[c.to - 1].end,
  }));
  // Readable timing: each cue stays until the next starts (if close), at least 0.7 s.
  cues.forEach((c, i) => {
    const next = cues[i + 1];
    if (next && next.start - c.end < 0.5) c.end = next.start;
    else c.end = c.end + 0.2;
    c.end = Math.max(c.end, c.start + 0.7);
    if (next) c.end = Math.min(c.end, next.start);
  });
  return cues;
}

const srtTime = (s) => {
  const ms = Math.max(0, Math.round(s * 1000));
  const p = (v, n = 2) => String(v).padStart(n, "0");
  return `${p(Math.floor(ms / 3600000))}:${p(Math.floor(ms / 60000) % 60)}:${p(Math.floor(ms / 1000) % 60)},${p(ms % 1000, 3)}`;
};

/** [{ start, end, text }] in seconds → SubRip (.srt) text. */
export function toSrt(cues) {
  return cues.map((c, i) => `${i + 1}\n${srtTime(c.start)} --> ${srtTime(c.end)}\n${c.text}\n`).join("\n");
}
