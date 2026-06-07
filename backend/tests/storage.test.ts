import { describe, it, expect, vi, beforeEach } from "vitest";
import { createCloudinaryImageStore, type CloudinaryClient } from "../src/services/storage.js";

function makeClient() {
  return {
    config: vi.fn(),
    uploader: { upload: vi.fn(), destroy: vi.fn() },
    api: { resources: vi.fn() },
  };
}

function makeStore(client: ReturnType<typeof makeClient>) {
  return createCloudinaryImageStore({
    cloudName: "c",
    apiKey: "k",
    apiSecret: "s",
    folder: "image-transform",
    client: client as unknown as CloudinaryClient,
  });
}

describe("createCloudinaryImageStore", () => {
  let client: ReturnType<typeof makeClient>;

  beforeEach(() => {
    client = makeClient();
  });

  it("configures the client with the provided credentials", () => {
    makeStore(client);
    expect(client.config).toHaveBeenCalledWith({ cloud_name: "c", api_key: "k", api_secret: "s" });
  });

  it("uploads a buffer and maps the response to ProcessedImage", async () => {
    client.uploader.upload.mockResolvedValue({
      public_id: "image-transform/abc",
      secure_url: "https://res.cloudinary.com/c/image/upload/abc.png",
      created_at: "2026-06-06T00:00:00Z",
    });

    const result = await makeStore(client).upload(Buffer.from([1, 2, 3]));

    expect(result).toEqual({
      id: "image-transform/abc",
      url: "https://res.cloudinary.com/c/image/upload/abc.png",
      createdAt: "2026-06-06T00:00:00Z",
    });
    const [dataUri, opts] = client.uploader.upload.mock.calls[0];
    expect(String(dataUri)).toMatch(/^data:image\/png;base64,/);
    expect(opts).toMatchObject({ folder: "image-transform", resource_type: "image" });
  });

  it("lists images mapped to ProcessedImage", async () => {
    client.api.resources.mockResolvedValue({
      resources: [
        { public_id: "image-transform/a", secure_url: "https://x/a.png", created_at: "2026-06-06T00:00:00Z" },
        { public_id: "image-transform/b", secure_url: "https://x/b.png", created_at: "2026-06-05T00:00:00Z" },
      ],
    });

    const result = await makeStore(client).list();

    expect(result).toEqual([
      { id: "image-transform/a", url: "https://x/a.png", createdAt: "2026-06-06T00:00:00Z" },
      { id: "image-transform/b", url: "https://x/b.png", createdAt: "2026-06-05T00:00:00Z" },
    ]);
    expect(client.api.resources).toHaveBeenCalledWith(
      expect.objectContaining({ type: "upload", prefix: "image-transform/", resource_type: "image" }),
    );
  });

  it("deletes by id", async () => {
    client.uploader.destroy.mockResolvedValue({ result: "ok" });
    await makeStore(client).remove("image-transform/abc");
    expect(client.uploader.destroy).toHaveBeenCalledWith("image-transform/abc", { resource_type: "image" });
  });

  it("throws AppError 404 when deleting a missing id", async () => {
    client.uploader.destroy.mockResolvedValue({ result: "not found" });
    await expect(makeStore(client).remove("image-transform/missing")).rejects.toMatchObject({
      statusCode: 404,
      code: "IMAGE_NOT_FOUND",
    });
  });

  it("wraps upload failures in AppError 502", async () => {
    client.uploader.upload.mockRejectedValue(new Error("cloudinary down"));
    await expect(makeStore(client).upload(Buffer.from([1]))).rejects.toMatchObject({
      statusCode: 502,
      code: "STORAGE_UPLOAD_FAILED",
    });
  });
});
