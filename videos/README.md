# videos/

One folder per video, named `NNNN_short-slug` (e.g. `0001_how-a-grin-transaction-works`).
Copy `_template/` to start a new one, then change `"id"` in `scenes.json` to the folder name.

| File | What it is | Who edits it |
|---|---|---|
| `script.md` | The narration, one `## Scene N` section per scene, with `[S1]` source markers | AI drafts, humans fix |
| `scenes.json` | What appears on screen in each scene (headings, diagram boxes, callouts) | AI drafts, humans fix |
| `sources.md` | One bullet per source `[S1]`, `[S2]`… | AI drafts, humans verify |
| `review.md` | The four review boxes — the **review gate** | **Humans only** |
| `status` | One word: where the video is in the pipeline (see below) | Anyone |
| `audio/` | `scene-01.mp3`, `scene-02.mp3`… (not in git) | You, on your PC |

`status` values, in order: `idea` → `script` → `review` → `audio` → `render` → `subtitles` →
`translations` → `published` → `measured`.

See [`../PROCESS.md`](../PROCESS.md) for the full pipeline.
