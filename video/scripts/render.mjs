// Renders one video to renders/<id>.mp4 — ONLY if its review gate is open.
//
//   npm run render -- 0001
//   npm run render -- 0001_how-a-grin-transaction-works
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { bundle } from "@remotion/bundler";
import { renderMedia, selectComposition } from "@remotion/renderer";
import { assertGateOpen } from "../../tools/review-gate.mjs";
import { REPO_ROOT, resolveVideoId } from "../../tools/video-files.mjs";
import { prepareAll } from "./prepare.mjs";

const VIDEO_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

async function main() {
  const id = resolveVideoId(process.argv[2]);

  // 1. Review gate — refuse before doing any work.
  assertGateOpen(id);
  console.log(`Review gate open for ${id}.`);

  // 2. Refresh scene data + durations.
  const { videos } = await prepareAll({ quiet: true });
  const video = videos.find((v) => v.id === id);
  if (!video) throw new Error(`${id} has problems in scenes.json/script.md — run "npm run prepare-data" to see them.`);
  const fromAudio = video.scenes.filter((s) => s.durationSource === "audio").length;
  if (fromAudio < video.scenes.length) {
    console.log(`⚠ Only ${fromAudio}/${video.scenes.length} scenes have audio; the rest use estimated lengths.`);
  }

  // 3. Bundle and render.
  console.log("Bundling…");
  const serveUrl = await bundle({ entryPoint: path.join(VIDEO_ROOT, "src", "index.ts") });
  // Optional: use an already-installed Chrome/Chromium instead of Remotion's download.
  const browserExecutable = process.env.REMOTION_BROWSER_EXECUTABLE || null;
  const composition = await selectComposition({ serveUrl, id: video.compositionId, inputProps: {}, browserExecutable });

  const outDir = path.join(REPO_ROOT, "renders");
  fs.mkdirSync(outDir, { recursive: true });
  const outputLocation = path.join(outDir, `${id}.mp4`);
  let lastShown = -10;
  await renderMedia({
    composition,
    serveUrl,
    codec: "h264",
    outputLocation,
    browserExecutable,
    onProgress: ({ progress }) => {
      const pct = Math.floor(progress * 100);
      if (pct >= lastShown + 10) {
        lastShown = pct;
        console.log(`  rendering… ${pct}%`);
      }
    },
  });
  console.log(`\nDone: ${path.relative(process.cwd(), outputLocation)}`);
}

main().catch((err) => {
  console.error("\n" + err.message);
  process.exit(1);
});
