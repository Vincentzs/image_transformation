import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

vi.mock("../src/config.js", () => ({
  config: { REMOVE_BG_API_KEY: "test-key" },
  CLOUDINARY_FOLDER: "image-transform",
}));

import { removeBackground } from "../src/services/backgroundRemoval.js";
import { AppError } from "../src/utils/AppError.js";

describe("removeBackground", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("returns the response bytes on success", async () => {
    const out = new Uint8Array([1, 2, 3, 4]);
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      arrayBuffer: async () => out.buffer,
    }) as unknown as typeof fetch;

    const result = await removeBackground(Buffer.from([9, 9, 9]));

    expect(Buffer.from(result)).toEqual(Buffer.from([1, 2, 3, 4]));
    expect(global.fetch).toHaveBeenCalledOnce();
    const [url, init] = (global.fetch as ReturnType<typeof vi.fn>).mock.calls[0];
    expect(url).toBe("https://api.remove.bg/v1.0/removebg");
    expect((init as RequestInit).method).toBe("POST");
    expect((init as any).headers["X-Api-Key"]).toBe("test-key");
  });

  it("throws AppError 502 when remove.bg returns a non-ok status", async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 402,
      text: async () => "Payment required",
    }) as unknown as typeof fetch;

    await expect(removeBackground(Buffer.from([1]))).rejects.toMatchObject({
      statusCode: 502,
      code: "BACKGROUND_REMOVAL_FAILED",
    });
  });

  it("throws AppError 502 when fetch rejects (network/timeout)", async () => {
    global.fetch = vi.fn().mockRejectedValue(new Error("network down")) as unknown as typeof fetch;

    await expect(removeBackground(Buffer.from([1]))).rejects.toBeInstanceOf(AppError);
  });
});
