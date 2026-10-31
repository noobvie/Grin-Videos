// videos/<id>/audio/voice.json remembers which script words each AI-voiced
// scene was made from, so stale audio can be detected. It lives next to the
// audio (not in git) because it describes those files.
import fs from "node:fs";
import path from "node:path";

export const MANIFEST_NAME = "voice.json";

export function readVoiceManifest(audioDir) {
  try {
    const m = JSON.parse(fs.readFileSync(path.join(audioDir, MANIFEST_NAME), "utf8"));
    return { scenes: m.scenes ?? {} };
  } catch {
    return { scenes: {} };
  }
}

export function writeVoiceManifest(audioDir, manifest) {
  fs.mkdirSync(audioDir, { recursive: true });
  fs.writeFileSync(path.join(audioDir, MANIFEST_NAME), JSON.stringify(manifest, null, 2) + "\n");
}
