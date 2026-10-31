// Colours come from brand/brand.json. Fonts are bundled from npm (@fontsource,
// SIL Open Font License) so previews and renders work offline and look the same
// on every PC.
import "@fontsource-variable/inter/wght.css";
import "@fontsource-variable/jetbrains-mono/wght.css";
import { cancelRender, continueRender, delayRender } from "remotion";
import brand from "../../brand/brand.json";

export const C = brand.colors;
export const COMMUNITY_LABEL = brand.communityLabel;
export const DISCLAIMER = brand.disclaimer;

export const FONT_BODY = '"Inter Variable", sans-serif';
export const FONT_MONO = '"JetBrains Mono Variable", monospace';

// Don't capture any frame until the fonts are ready, otherwise the first
// frames could show a fallback font. The sample text pulls in the Latin,
// Vietnamese and Cyrillic files.
const SAMPLE = "Grin ăđơ Жж";
const fontsReady = delayRender("Loading brand fonts");
Promise.all([
  document.fonts.load(`800 40px "Inter Variable"`, SAMPLE),
  document.fonts.load(`500 40px "JetBrains Mono Variable"`, SAMPLE),
])
  .then(() => continueRender(fontsReady))
  .catch((err) => cancelRender(err));
