import { describe, it, expect } from "vitest";
import sharp from "sharp";
import { createSharpImageTransformer } from "../src/services/imageTransform.js";

const { flipHorizontal } = createSharpImageTransformer();

async function makeTwoPixelPng(): Promise<Buffer> {
  // 2x1 RGB: pixel 0 = red, pixel 1 = blue
  const raw = Buffer.from([255, 0, 0, 0, 0, 255]);
  return sharp(raw, { raw: { width: 2, height: 1, channels: 3 } }).png().toBuffer();
}

describe("createSharpImageTransformer", () => {
  it("mirrors the image so left and right pixels swap", async () => {
    const input = await makeTwoPixelPng();

    const flipped = await flipHorizontal(input);

    const { data, info } = await sharp(flipped).raw().toBuffer({ resolveWithObject: true });
    expect(info.width).toBe(2);
    expect(info.height).toBe(1);
    // After flip, left pixel should be blue, right pixel should be red.
    const channels = info.channels;
    const left = [data[0], data[1], data[2]];
    const right = [data[channels], data[channels + 1], data[channels + 2]];
    expect(left).toEqual([0, 0, 255]);
    expect(right).toEqual([255, 0, 0]);
  });

  it("returns a valid PNG", async () => {
    const input = await makeTwoPixelPng();
    const flipped = await flipHorizontal(input);
    const meta = await sharp(flipped).metadata();
    expect(meta.format).toBe("png");
  });
});
