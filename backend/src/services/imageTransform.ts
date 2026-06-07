import sharp from "sharp";
import type { ImageTransformer } from "./ports.js";

/**
 * Image transformer backed by sharp. `.flop()` mirrors horizontally
 * (`.flip()` would be vertical).
 */
export function createSharpImageTransformer(): ImageTransformer {
  return {
    async flipHorizontal(input: Buffer): Promise<Buffer> {
      return sharp(input).flop().png().toBuffer();
    },
  };
}
