import { useVideoConfig } from "remotion";

/** Scale unit: 1 = 1px in a 1080-wide frame, so sizes work in every format. */
export const useUnit = () => {
  const { width, height } = useVideoConfig();
  return Math.min(width, height) / 1080;
};

export const useIsVertical = () => {
  const { width, height } = useVideoConfig();
  return height > width;
};
