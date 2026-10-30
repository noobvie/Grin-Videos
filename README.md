# Grin-Videos

**Community-made** short videos (60–120 s) that explain [Grin](https://grin.mw) and
Mimblewimble — how it works, how to use it, and where its limits are.

> This is a community project. It is **not** an official grin.mw production.
> The videos are educational only: no price talk, no investment advice.

## What's in here

| Folder / file | What it is |
|---|---|
| [`PROCESS.md`](PROCESS.md) | The whole pipeline, step by step, and **where** each step happens |
| [`videos/`](videos/) | One folder per video: script, scene list, sources, review checklist |
| [`topics/backlog.md`](topics/backlog.md) | Content areas and the list of topic ideas |
| [`video/`](video/) | The video templates (built with [Remotion](https://www.remotion.dev), React code) |
| [`brand/`](brand/) | Colours, fonts, intro/outro rules |
| [`tools/`](tools/) | The **review gate** that stops unreviewed videos from being rendered |
| [`CLAUDE.md`](CLAUDE.md) | Ground rules that every AI (Claude) session must follow |

## Start here (beginner path)

1. **Read the ground rules** at the top of [`CLAUDE.md`](CLAUDE.md) — they apply to humans too.
2. **Read [`PROCESS.md`](PROCESS.md)** once, top to bottom. It's the map.
3. **Look at one video folder:** [`videos/0001_how-a-grin-transaction-works/`](videos/0001_how-a-grin-transaction-works/).
   Open `script.md`, `scenes.json`, `sources.md` and `review.md` to see how they fit together.
4. **Preview it on your PC** (Windows):
   1. Install [Node.js LTS](https://nodejs.org) (version 22 or newer) and [Git for Windows](https://git-scm.com/download/win).
   2. Open **PowerShell** and run:
      ```powershell
      git clone https://github.com/noobvie/Grin-Videos.git
      cd Grin-Videos\video
      npm install
      npm run studio
      ```
   3. A browser tab opens at `http://localhost:3000`. Pick a video on the left and press play.
      Press **Ctrl+C** in PowerShell to stop.
5. **Start your first real video:** on GitHub, go to **Issues → New issue → 🎬 New video**,
   pick a topic from [`topics/backlog.md`](topics/backlog.md), and follow the checklist in the issue.

## Words you'll see

- **Script** — the words the narrator says (`script.md`).
- **Scenes** — what's on screen while they say it (`scenes.json`).
- **Render** — turning the scenes + audio into an `.mp4` file.
- **Review gate** — the render refuses to run until a human ticks all four boxes in `review.md`.
- **PR (pull request)** — a proposed change on a branch that others review before it's merged into `main`.
