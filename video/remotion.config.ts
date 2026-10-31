// Settings for `npm run studio` (the Remotion CLI). `npm run render` uses
// scripts/render.mjs instead, which enforces the review gate first.
import { Config } from "@remotion/cli/config";

Config.setVideoImageFormat("jpeg");
Config.setOverwriteOutput(true);
