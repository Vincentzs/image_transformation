import { describe, it, expect, vi } from "vitest";
import { createRemoveBgBackgroundRemover } from "../src/services/backgroundRemoval.js";
import { AppError } from "../src/utils/AppError.js";

function makeRemover(fetchFn: ReturnType<typeof vi.fn>) {
  return createRemoveBgBackgroundRemover({
    apiKey: "test-key",
    fetchFn: fetchFn as unknown as typeof fetch,
    timeoutMs: 1000,
  });
}

describe("createRemoveBgBackgroundRemover", () => {
  it("returns the response bytes on success", async () => {
    const out = new Uint8Array([1, 2, 3, 4]);
    const fetchFn = vi.fn().mockResolvedValue({ ok: true, arrayBuffer: async () => out.buffer });

    const result = await makeRemover(fetchFn).removeBackground(Buffer.from([9, 9, 9]));

    expect(Buffer.from(result)).toEqual(Buffer.from([1, 2, 3, 4]));
    const [url, init] = fetchFn.mock.calls[0];
    expect(url).toBe("https://api.remove.bg/v1.0/removebg");
    expect((init as RequestInit).method).toBe("POST");
    expect((init as { headers: Record<string, string> }).headers["X-Api-Key"]).toBe("test-key");
  });

  it("reports a key/auth problem when remove.bg returns 403", async () => {
    const fetchFn = vi.fn().mockResolvedValue({ ok: false, status: 403, text: async () => "Invalid API Key" });

    await expect(makeRemover(fetchFn).removeBackground(Buffer.from([1]))).rejects.toMatchObject({
      statusCode: 502,
      code: "BACKGROUND_REMOVAL_FAILED",
      message: expect.stringMatching(/api key/i),
    });
  });

  it("reports an image problem when remove.bg returns 400", async () => {
    const fetchFn = vi.fn().mockResolvedValue({ ok: false, status: 400, text: async () => "no foreground" });

    await expect(makeRemover(fetchFn).removeBackground(Buffer.from([1]))).rejects.toMatchObject({
      statusCode: 502,
      code: "BACKGROUND_REMOVAL_FAILED",
      message: expect.stringMatching(/image/i),
    });
  });

  it("throws AppError 502 when fetch rejects (network/timeout)", async () => {
    const fetchFn = vi.fn().mockRejectedValue(new Error("network down"));

    await expect(makeRemover(fetchFn).removeBackground(Buffer.from([1]))).rejects.toBeInstanceOf(AppError);
  });
});
