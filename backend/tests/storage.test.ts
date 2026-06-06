import { describe, it, expect, vi, beforeEach } from "vitest";

const { uploadMock, destroyMock, resourcesMock, configMock } = vi.hoisted(() => ({
  uploadMock: vi.fn(),
  destroyMock: vi.fn(),
  resourcesMock: vi.fn(),
  configMock: vi.fn(),
}));

vi.mock("cloudinary", () => ({
  v2: {
    config: configMock,
    uploader: { upload: uploadMock, destroy: destroyMock },
    api: { resources: resourcesMock },
  },
}));

vi.mock("../src/config.js", () => ({
  config: {
    CLOUDINARY_CLOUD_NAME: "c",
    CLOUDINARY_API_KEY: "k",
    CLOUDINARY_API_SECRET: "s",
  },
  CLOUDINARY_FOLDER: "image-transform",
}));

import { uploadImage, listImages, deleteImage } from "../src/services/storage.js";
import { AppError } from "../src/utils/AppError.js";

describe("storage service", () => {
  beforeEach(() => {
    uploadMock.mockReset();
    destroyMock.mockReset();
    resourcesMock.mockReset();
  });

  it("uploads a buffer and maps the response to ProcessedImage", async () => {
    uploadMock.mockResolvedValue({
      public_id: "image-transform/abc",
      secure_url: "https://res.cloudinary.com/c/image/upload/abc.png",
      created_at: "2026-06-06T00:00:00Z",
    });

    const result = await uploadImage(Buffer.from([1, 2, 3]));

    expect(result).toEqual({
      id: "image-transform/abc",
      url: "https://res.cloudinary.com/c/image/upload/abc.png",
      createdAt: "2026-06-06T00:00:00Z",
    });
    const [dataUri, opts] = uploadMock.mock.calls[0];
    expect(String(dataUri)).toMatch(/^data:image\/png;base64,/);
    expect(opts).toMatchObject({ folder: "image-transform", resource_type: "image" });
  });

  it("lists images mapped to ProcessedImage, newest first", async () => {
    resourcesMock.mockResolvedValue({
      resources: [
        { public_id: "image-transform/a", secure_url: "https://x/a.png", created_at: "2026-06-06T00:00:00Z" },
        { public_id: "image-transform/b", secure_url: "https://x/b.png", created_at: "2026-06-05T00:00:00Z" },
      ],
    });

    const result = await listImages();

    expect(result).toEqual([
      { id: "image-transform/a", url: "https://x/a.png", createdAt: "2026-06-06T00:00:00Z" },
      { id: "image-transform/b", url: "https://x/b.png", createdAt: "2026-06-05T00:00:00Z" },
    ]);
    expect(resourcesMock).toHaveBeenCalledWith(
      expect.objectContaining({ type: "upload", prefix: "image-transform/", resource_type: "image" }),
    );
  });

  it("deletes by id", async () => {
    destroyMock.mockResolvedValue({ result: "ok" });
    await deleteImage("image-transform/abc");
    expect(destroyMock).toHaveBeenCalledWith("image-transform/abc", { resource_type: "image" });
  });

  it("throws AppError 404 when deleting a missing id", async () => {
    destroyMock.mockResolvedValue({ result: "not found" });
    await expect(deleteImage("image-transform/missing")).rejects.toMatchObject({
      statusCode: 404,
      code: "IMAGE_NOT_FOUND",
    });
  });

  it("wraps upload failures in AppError 502", async () => {
    uploadMock.mockRejectedValue(new Error("cloudinary down"));
    await expect(uploadImage(Buffer.from([1]))).rejects.toBeInstanceOf(AppError);
  });
});
