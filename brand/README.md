# Brand

These videos are **community-made**. The look is deliberately our own — it must never
pass for an official grin.mw production. Don't use the official Grin logo as our logo,
and don't copy the grin.mw website design.

## Colours

Defined once in [`brand.json`](brand.json); the video templates read them from there.
Change a colour in that file and every video picks it up on the next preview/render.

| Name | Hex | Used for |
|---|---|---|
| `ink` | `#0E1116` | Background |
| `inkRaised` | `#171B22` | Cards, diagram boxes |
| `line` | `#2A303B` | Borders, background grid |
| `paper` | `#F4F1EA` | Main text |
| `muted` | `#9AA3B2` | Secondary text, captions |
| `amber` | `#F5B700` | Accent: headings underline, arrows, key points |
| `teal` | `#3CC6B0` | Second accent: "note" callouts, the community label |
| `coral` | `#FF6B5B` | **Limits / myths** callouts — honest caveats, "myth" side of myth-vs-fact |

Contrast: every text colour above passes WCAG AA on both `ink` and `inkRaised` (lowest is
`coral` at 6.2:1). Phones shrink videos a lot, so keep text at 32 px or more in a 1080-wide frame.

## Fonts (free licences only)

| Font | Licence | Used for | Where it comes from |
|---|---|---|---|
| [Inter](https://fonts.google.com/specimen/Inter) | SIL Open Font License 1.1 | All text | Loaded by `@remotion/google-fonts` at preview/render time |
| [JetBrains Mono](https://fonts.google.com/specimen/JetBrains+Mono) | SIL Open Font License 1.1 | Numbers, code, stat cards | Same |

Both fonts cover Latin, Latin-Extended, Cyrillic and Vietnamese. For Chinese/Japanese/Korean
translations add **Noto Sans SC / JP / KR** (also OFL) — that's part of the translations TODO.
Never add a font whose licence forbids video embedding or redistribution.

## Intro (title card)

- First scene of every video. Max ~3–4 s if there is no narration.
- Small kicker at the top: "GRIN EXPLAINED · COMMUNITY-MADE".
- One big question or statement (the hook), then a one-line subheading.
- No logo animation, no music sting yet (music needs its own licence check — TODO).

## Outro

- Last scene of every video, ~4–6 s.
- Fixed text, **not editable from `scenes.json`**:
  "Community-made · Not an official grin.mw production · Educational only, not financial advice".
- "Learn more" links: primary sources only (docs.grin.mw, the RFCs, the GitHub repo).
  No exchanges, no price sites, no referral links.

## Always on screen

A small "COMMUNITY-MADE" label sits in a corner for the whole video, so a clip that gets
cut and re-shared still carries the label.

## Voice (narration)

`npm run voice -- <id>` reads each scene of `script.md` aloud with a local AI voice on your
computer — no account, no cost per video, nothing uploaded.

| Engine | Licence | Use it for | Languages |
|---|---|---|---|
| **Kokoro** (default) — `kokoro-js`, model `Kokoro-82M` | Apache 2.0 (code and voices) | Publishing | English (US `af_*`/`am_*`, UK `bf_*`/`bm_*`) |
| **macOS `say`** (`--engine say`) | Apple's macOS licence | **Preview only** — quick timing tests. Read Apple's terms before publishing with it | Many |

- Default voice: `voice` in [`brand.json`](brand.json) (`af_heart`). Keep one narrator across videos.
  Other good Kokoro voices to try: `af_bella`, `am_michael`, `bf_emma`, `bm_george`.
- Words the voice gets wrong go in [`pronunciation.json`](pronunciation.json) (left: as written,
  right: how to say it). This changes only the voice, never the captions.
- **Disclose the AI voice** in every video description: "Narration: AI voice (Kokoro)". Some
  platforms also have an "altered or synthetic content" setting — use it when it applies.
- Never clone a real person's voice.

## Captions

Burned into the video by default (most people watch short videos muted) and also written as
`.srt` files for platforms that accept uploads. Caption text always comes from `script.md`.
Style: `paper` text on a dark `ink` box near the bottom, at most ~42 characters per caption.
Turn burned-in captions off for one video with `"captions": false` in its `scenes.json`.
