# Grin-Videos — instructions for every Claude session

Community-made pipeline for short (60–120 s) educational videos about Grin (Mimblewimble).
The owner is new to video production: keep everything simple, explain steps, prefer
small clear changes over clever ones. Pipeline and "where each step happens" → `PROCESS.md`.

## Ground rules (non-negotiable)

1. **Educational, never promotional.** No price talk, no "moon", no "buy", no investment
   advice, no exchange or referral links — in scripts, on screen, in descriptions.
2. **Always labelled "community-made".** Never imply an official grin.mw production. Don't use
   the official Grin logo as our branding. The on-screen label and outro disclaimer are hard-coded
   in the template (`video/src/components/CommunityBadge.tsx`, `OutroScene.tsx`) — don't make them optional.
3. **Never overstate Grin's privacy.** Say what Mimblewimble hides (amounts, no addresses on
   chain) *and* what it doesn't: the transaction graph can leak (e.g. to nodes watching
   transactions before aggregation; Dandelion++ helps but isn't perfect), IP addresses are not
   hidden by the protocol, metadata off-chain (exchanges, slatepack exchange) can identify people.
   Every video that touches privacy states at least one honest limit.
4. **Every factual claim needs a source.** In `script.md`, end each claim with `[S1]`-style markers;
   each marker must be listed in that video's `sources.md` (Grin docs, RFCs, Grin code, original
   papers). Don't invent sources or URLs — if you can't verify a claim, flag it for the human
   reviewer instead of writing it as fact.
5. **AI drafts; only a human ticks review boxes.** Never tick (`[x]`) any box in a `review.md`,
   never tick review/metrics boxes in issues, never edit the gate to make it pass, never
   remove or weaken `tools/review-gate.mjs` or the check in `video/src/Root.tsx`.
6. **Big binaries never go in git**: audio, renders, `*.mp4`, `*.wav`, `*.mp3` etc. (see `.gitignore`).
   Small text/code and the bundled-by-npm fonts are fine.
7. **Work on a branch and open a pull request; never push to `main`.**

## Repo map

| Path | What |
|---|---|
| `videos/NNNN_slug/` | One video: `script.md`, `scenes.json`, `sources.md`, `review.md`, `status` (+ `audio/`, not in git) |
| `videos/_template/` | Copy this to start a video; change `"id"` in `scenes.json` to the folder name |
| `topics/backlog.md` | Content areas, target counts, topic ideas — check for duplicates before adding |
| `video/` | Remotion project (templates). `npm run studio`, `npm run render -- <id>` |
| `tools/review-gate.mjs` | The review gate. Every render path must call it first |
| `brand/` | Colours (`brand.json`), fonts, intro/outro rules |
| `.github/` | Issue form "🎬 New video", labels + "Sync labels" workflow, checks |

## Conventions

- Video ids: `NNNN_kebab-slug`, 4-digit, never reused or renumbered.
- `script.md`: one `## Scene N` section per entry in `scenes.json`, same order. Only spoken words
  under a heading; `>` lines are reviewer notes. ~2.5 words/s → 150–300 words for 60–120 s.
- Plain words first, jargon second (and explained). One idea per video.
- Templates: only `explainer` is built. Others (`myth-fact`, `step-by-step`, `comparison`,
  `stat-card`, `timeline`) are planned — don't pick them in `scenes.json` until built.
- Before committing: `cd video && npm test && npm run typecheck && npm run prepare-data`.
