import { describe, it, expect, vi } from "vitest";
import { createImageService } from "../src/services/imageService.js";

describe("createImageService", () => {
  it("runs remove-background → flip → upload in order and returns the stored image", async () => {
    const backgroundRemover = { removeBackground: vi.fn().mockResolvedValue(Buffer.from([1])) };
    const transformer = { flipHorizontal: vi.fn().mockResolvedValue(Buffer.from([2])) };
    const stored = { id: "image-transform/abc", url: "https://x/abc.png", createdAt: "2026-06-06T00:00:00Z" };
    const store = { upload: vi.fn().mockResolvedValue(stored), list: vi.fn(), remove: vi.fn() };

    const service = createImageService({ backgroundRemover, transformer, store });
    const input = Buffer.from([0]);
    const result = await service.process(input);

    expect(backgroundRemover.removeBackground).toHaveBeenCalledWith(input);
    expect(transformer.flipHorizontal).toHaveBeenCalledWith(Buffer.from([1]));
    expect(store.upload).toHaveBeenCalledWith(Buffer.from([2]));
    expect(result).toEqual(stored);
  });

  it("delegates list and remove to the store", async () => {
    const store = {
      upload: vi.fn(),
      list: vi.fn().mockResolvedValue([]),
      remove: vi.fn().mockResolvedValue(undefined),
    };
    const service = createImageService({
      backgroundRemover: { removeBackground: vi.fn() },
      transformer: { flipHorizontal: vi.fn() },
      store,
    });

    await service.list();
    await service.remove("image-transform/abc");

    expect(store.list).toHaveBeenCalledOnce();
    expect(store.remove).toHaveBeenCalledWith("image-transform/abc");
  });
});
