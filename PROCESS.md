# Process — from topic to measured video

Every video goes through the same nine steps, always in this order.
The `status` file in the video's folder holds the current step (one word).

| # | Step | Where it happens | Who | `status` after |
|---|---|---|---|---|
| 1 | Topic | **GitHub** (Issues) | Human | `idea` |
| 2 | Script | **claude.ai/code** → a pull request on GitHub | AI drafts, human edits | `script` |
| 3 | Review (4 gates) | **GitHub** (the pull request) | **Humans only** | `review` |
| 4 | Audio | **Your computer** (`npm run voice`) | AI voice, human listens | `audio` |
| 5 | Subtitles | **Your computer** (`npm run subtitles`) | Automatic, human checks | `subtitles` |
| 6 | Render | **Your computer** (`npm run render`) | Human | `render` |
| 7 | Translations | *TODO* | — | `translations` |
| 8 | Publish | **Social platforms** | Human | `published` |
| 9 | Measure (7 days later) | **Social platforms** → **GitHub** issue | Human | `measured` |

```
GitHub issue ─► claude.ai/code ─► GitHub PR + review ─► your computer (voice, subtitles, render) ─► socials ─► GitHub issue (metrics)
```

Subtitles come **before** the render because the captions are burned into the video, and the
render uses the subtitle timings. "Your computer" = your Mac (or a Windows PC); commands are the same.
Everything in steps 4–6 runs **locally**: no accounts, no cost per video, nothing uploaded.

---

## 1. Topic — GitHub

1. Open [`topics/backlog.md`](topics/backlog.md) and pick an idea (or add a new one — check it
   isn't a duplicate first).
2. On GitHub: **Issues → New issue → 🎬 New video**. Fill in the title, content area, template
   and language. Submit.
3. Add the matching labels on the right side of the issue (`area:…`, `template:…`, `lang:…`).
   *(The form can't add them automatically.)*
4. The issue is your to-do list for this video: tick its boxes as you go.

## 2. Script — claude.ai/code

1. Open [claude.ai/code](https://claude.ai/code), choose this repository, and ask something like:
   > Draft video for issue #12: create `videos/0002_what-is-mimblewimble/` from `_template`,
   > write script.md, scenes.json and sources.md, open a pull request. Don't tick review boxes.
2. Claude creates a branch, copies `videos/_template/`, drafts the three files, sets
   `status` to `script`, and opens a **pull request** (PR).
3. **You** read the draft in the PR. Edit anything you like — on GitHub (open the file in the PR →
   "…" → *Edit file*), or ask Claude to change it.

What a good draft has:
- 60–120 s → **150–300 words** of narration (≈2.5 words per second).
- One idea. Plain words. Jargon only when explained.
- A `[S1]` marker after every factual claim, each listed in `sources.md`.
- For anything about privacy: at least one honest limit.

Preview while you edit: on your PC run `npm run studio` (see [README](README.md#start-here-beginner-path)).
The studio shows the PR's version after you `git pull` its branch.

## 3. Review — GitHub (humans only)

Four boxes in the video's `review.md`. Each one is ticked by a **human** — never by AI.
Ideally a different person ticks each gate (or at least Technical and Facts).

| Gate | The reviewer checks |
|---|---|
| **Technical** | Mimblewimble/Grin mechanics are right; the diagram matches the words |
| **Facts** | Every claim has a `[S#]` marker; every source is real, relevant and says what we claim |
| **Knowledge** | A newcomer can follow it; jargon explained; privacy limits stated, not overstated |
| **Tone** | Educational, not promotional; no price/"moon"/advice; says community-made; nothing looks official |

How to tick a box: in the PR, open `videos/<id>/review.md` → *Edit file* → change `- [ ]` to
`- [x]` and write your name after `by: @` → *Commit changes* (to the same branch).

**The review gate:** `npm run render` (and any future render workflow) checks `review.md` first.
If any of the four boxes is unticked — or the script cites a source that isn't in
`sources.md` — it **refuses to render** and says why. You can check any time with:
```powershell
cd video
npm run gate -- 0001
```
If the script changes after review, untick the affected boxes so it gets checked again.

When all four are ticked: set `status` to `review`, and **merge the PR** into `main`.

## 4. Audio — your computer

**Option A — AI voice (default).** In Terminal (Mac) or PowerShell (Windows):
```bash
cd video
npm run voice -- 0001
```
- Reads every `## Scene N` of `script.md` with the **Kokoro** voice (free, Apache-2.0 licence,
  runs on your computer). Writes `videos/<id>/audio/scene-01.wav`, `scene-02.wav`… (not in git).
- The first run downloads the voice model (~90 MB) once. After that a whole video takes about a minute.
- Run it again any time: scenes whose words didn't change are skipped.
- A word sounds wrong (e.g. "Dandelion++")? Add it to `brand/pronunciation.json` and run with `--force`.
- Other voices: `npm run voice -- 0001 --voice am_michael` (list in `brand/README.md`).
  Quick preview with the Mac's built-in voice: `--engine say` (preview only, not for publishing).
- **Listen to every scene.** You're the quality check.

**Option B — your own voice.** Record one file per scene (skip `[S1]` markers and `>` notes),
e.g. with [Audacity](https://www.audacityteam.org), and save as `videos/<id>/audio/scene-01.mp3`, …
Your recordings always win: `npm run voice` never overwrites them.

Either way, `npm run studio` now times each scene to its audio (+ a short pause).
Set `status` to `audio`.

> **Safety check:** the AI voice remembers which words it read. If `script.md` changes later,
> `npm run render` refuses until you run `npm run voice` again — so the video can never say
> something the reviewers didn't approve.

## 5. Subtitles — your computer

```bash
npm run subtitles -- 0001
```
- Writes `videos/<id>/subtitles/en.srt` (upload this to YouTube etc.) and `en.json` (timings the
  video reuses). Both are small text files — commit them.
- The **words** always come from `script.md`. **Whisper** (speech recognition, runs on your
  computer, ~80 MB download once) only listens to find *when* each word is said.
  `--no-whisper` spreads the captions evenly instead.
- Captions are also **burned into the video** (most people watch muted). To turn that off for one
  video: `"captions": false` in its `scenes.json`.
- Check them in `npm run studio`. Set `status` to `subtitles`.

## 6. Render — your computer

```bash
npm run render -- 0001
```
- Checks the review gate → checks the audio still matches the script → writes `renders/0001_….mp4` (not in git).
- First render downloads a headless Chrome (~100 MB) once. Rendering a 90 s video takes a few minutes.
- Watch the whole MP4 once, with sound, before publishing. Set `status` to `render`.

## 7. Translations — TODO (see below)

Kokoro's voices are English only; other languages need another voice (part of this TODO).

## 8. Publish — social platforms

1. Upload the MP4 (YouTube Shorts / TikTok / Instagram Reels / X / Mastodon …). Where the
   platform accepts subtitle files, also upload `subtitles/en.srt`. If the platform asks about
   "altered or synthetic content", answer honestly for the AI voice.
2. Description template:
   ```
   <one-line summary>
   Community-made explainer — not an official grin.mw production. Educational only, not financial advice.
   Narration: AI voice (Kokoro).
   Sources:
   [S1] <title> — <link>
   [S2] …
   ```
3. Paste the links to every post into the issue. Set `status` to `published`.

## 9. Measure — 7 days later

1. Exactly 7 days after publishing, read each platform's analytics: views, average watch time
   (or % watched), likes, comments, shares.
2. Write them in the issue's **Metrics** section as a comment, tick the metrics boxes, set
   `status` to `measured`, close the issue.
3. Note anything learned (e.g. "first 3 s lost half the viewers") — that feeds the next script.

---

## GitHub Projects board (one-time setup)

1. Repo → **Projects** tab → **Link a project ▾ → New project** → template **Board** →
   name it "Grin Videos". (Creating it from the repo's tab links it to this repo.)
2. In the board, click the *Status* column menu → edit options so the columns are:
   `Idea`, `Script`, `Review`, `Audio`, `Render`, `Publish`, `Measure`, `Done`.
3. Board menu **⋯ → Workflows**:
   - **Auto-add to project** → repository `Grin-Videos`, filter `is:issue` → *Save and turn on*.
   - **Item added to project** → set Status `Idea` → turn on.
   - **Item closed** → set Status `Done` → turn on.
4. Optional: **⋯ → Settings → Custom fields** → add a *Single select* "Area" if you want to
   group by area (the `area:*` labels already show on cards).
5. As a video moves on, drag its card to the column that matches its `status` file.

## Labels

Defined in [`.github/labels.yml`](.github/labels.yml). The **Sync labels** workflow creates/updates
them on every push to `main`, or run it by hand: **Actions → Sync labels → Run workflow**.
Labels not in the file are left alone. `blocked` = waiting on something; say what in a comment.

---

## TODO — not built yet

These are planned but **not** part of the current setup:

- [x] ~~TTS integration~~ — done: `npm run voice` (Kokoro, local). Still to do: voices for other languages.
- [x] ~~Subtitles~~ — done: `npm run subtitles` (Whisper timing, local) + burned-in captions.
- [ ] **Translations** — AI draft of `script.md` + on-screen text per language, reviewed by a native
      speaker (same four gates); CJK fonts (Noto Sans SC/JP/KR, OFL); a voice per language.
- [ ] **Rendering on GitHub Actions** — a workflow that runs `node tools/review-gate.mjs <id>`
      first, renders, and uploads the MP4 as an artifact (never committed).
- [ ] **Weekly scheduled routine** — e.g. weekly-stats videos and a backlog check.
- [ ] More templates: `myth-fact`, `step-by-step`, `comparison`, `stat-card`, `timeline`.
- [ ] Background music (needs a licence check).
