import sharp from "sharp";

/**
 * Flips an image horizontally (mirror left-to-right) and returns a PNG buffer.
 * `.flop()` is sharp's horizontal mirror; `.flip()` would be vertical.
 */
export async function flipHorizontal(input: Buffer): Promise<Buffer> {
  return sharp(input).flop().png().toBuffer();
}
