# video/ — Remotion templates

Turns a `videos/<id>/` folder into a video. Built with [Remotion](https://www.remotion.dev)
(videos written as React code). You don't need to know React to make videos — you only edit
`script.md` and `scenes.json` in the video's folder.

## Commands (run inside this `video` folder)

| Command | What it does |
|---|---|
| `npm install` | First time only (and after `package.json` changes) |
| `npm run studio` | Opens the preview in your browser at http://localhost:3000. Ctrl+C to stop |
| `npm run voice -- 0001` | AI narration per scene → `videos/0001_…/audio/scene-NN.wav` (options: `--voice`, `--engine say`, `--speed`, `--scene N`, `--force`) |
| `npm run subtitles -- 0001` | `videos/0001_…/subtitles/en.srt` + timings for burned-in captions (`--no-whisper` to skip speech recognition) |
| `npm run render -- 0001` | Renders `renders/0001_….mp4` — **only if the review gate is open and the AI audio matches the script** |
| `npm run gate -- 0001` | Just checks the review gate and says what's missing |
| `npm run prepare-data` | Re-reads all video folders and shows each one's length + gate state |
| `npm test` / `npm run typecheck` | Checks run by CI on every pull request |

## Scene length

For each scene, in order:
1. If `videos/<id>/audio/scene-NN.mp3` (or `.wav`, `.m4a`, `.ogg`) exists → audio length + 0.5 s.
2. Otherwise → number of spoken words ÷ `wordsPerSecond` (default 2.5) + 0.8 s,
   with a minimum (title 3 s, outro 5 s, others 4 s).

## Local AI models

Both run on your computer through `@huggingface/transformers` (no Python, no Homebrew). Each
downloads once, on first use, into `video/node_modules/` (deleting `node_modules` re-downloads).

| Used by | Model | Size | Licence |
|---|---|---|---|
| `npm run voice` | `onnx-community/Kokoro-82M-v1.0-ONNX` (via `kokoro-js`) | ~90 MB | Apache 2.0 |
| `npm run subtitles` | `onnx-community/whisper-base.en_timestamped` (English) / `whisper-base_timestamped` (others) | ~80 MB | MIT |

`videos/<id>/audio/voice.json` records which words each AI scene was made from; the render
refuses audio made from older words.

## The "Explainer" template — `scenes.json`

```jsonc
{
  "id": "0001_how-a-grin-transaction-works", // must equal the folder name
  "title": "How a Grin transaction works",
  "template": "explainer",                    // only template built so far
  "language": "en",
  "format": "vertical",                       // vertical 1080×1920 | landscape 1920×1080 | square 1080×1080
  "wordsPerSecond": 2.5,                      // optional, for the estimate
  "captions": true,                           // optional, burned-in captions (default true)
  "voice": { "name": "af_heart", "speed": 1 },// optional, overrides brand/brand.json for this video
  "scenes": [ /* one per "## Scene N" in script.md, same order */ ]
}
```

| `type` | Fields | On screen |
|---|---|---|
| `title` | `heading`, `subheading?` | Kicker "GRIN EXPLAINED · COMMUNITY-MADE", big heading, subheading |
| `diagram` | `heading`, `nodes: [{id, label, sublabel?}]`, `edges: [{from, to, label?}]`, `caption?` | Boxes appear one by one, then arrows draw in the order listed |
| `callouts` | `heading`, `points: [{text, kind?}]` — `kind`: `point` (amber), `note` (teal), `limit` (coral, for honest caveats) | Cards slide in one by one |
| `outro` | `heading?`, `links?: ["docs.grin.mw"]` | Links + the fixed community-made disclaimer |

The narration is **not** in `scenes.json` — it comes from `script.md` (`## Scene N` sections),
so there's only one copy of the words.

## Code map

| File | What |
|---|---|
| `scripts/prepare.mjs` | Reads `videos/*/`, computes durations, writes `src/generated/videos.json` (not in git) |
| `scripts/render.mjs` | Review gate → stale-audio check → prepare → bundle → render MP4 |
| `scripts/voice.mjs`, `scripts/subtitles.mjs` | AI narration; subtitles + caption timings |
| `scripts/lib/audio.mjs` | WAV writing, decoding audio with Remotion's ffmpeg |
| `scripts/lib/durations.mjs` | Audio length / words-per-second estimate |
| `src/Root.tsx` | One composition per video; refuses to render if the gate is closed |
| `src/Explainer.tsx` | The template: scenes in sequence + per-scene audio + captions + community badge |
| `src/scenes/*.tsx` | Title, Diagram, Callouts, Outro |
| `src/brand.ts` | Colours from `../brand/brand.json`, bundled OFL fonts |
