import { describe, it, expect, vi, beforeEach } from "vitest";
import request from "supertest";

vi.mock("../src/config.js", () => ({
  config: { FRONTEND_ORIGIN: "http://localhost:5173" },
  CLOUDINARY_FOLDER: "image-transform",
}));

const {
  removeBackgroundMock,
  flipHorizontalMock,
  uploadImageMock,
  listImagesMock,
  deleteImageMock,
} = vi.hoisted(() => ({
  removeBackgroundMock: vi.fn(),
  flipHorizontalMock: vi.fn(),
  uploadImageMock: vi.fn(),
  listImagesMock: vi.fn(),
  deleteImageMock: vi.fn(),
}));

vi.mock("../src/services/backgroundRemoval.js", () => ({ removeBackground: removeBackgroundMock }));
vi.mock("../src/services/imageTransform.js", () => ({ flipHorizontal: flipHorizontalMock }));
vi.mock("../src/services/storage.js", () => ({
  uploadImage: uploadImageMock,
  listImages: listImagesMock,
  deleteImage: deleteImageMock,
}));

import { createApp } from "../src/app.js";
import { AppError } from "../src/utils/AppError.js";

const app = createApp();

describe("images API", () => {
  beforeEach(() => {
    removeBackgroundMock.mockReset();
    flipHorizontalMock.mockReset();
    uploadImageMock.mockReset();
    listImagesMock.mockReset();
    deleteImageMock.mockReset();
  });

  it("GET /api/health returns ok", async () => {
    const res = await request(app).get("/api/health");
    expect(res.status).toBe(200);
    expect(res.body).toEqual({ status: "ok" });
  });

  it("POST /api/images runs the pipeline and returns 201 with the hosted image", async () => {
    removeBackgroundMock.mockResolvedValue(Buffer.from([1]));
    flipHorizontalMock.mockResolvedValue(Buffer.from([2]));
    uploadImageMock.mockResolvedValue({
      id: "image-transform/abc",
      url: "https://res.cloudinary.com/c/abc.png",
      createdAt: "2026-06-06T00:00:00Z",
    });

    const res = await request(app)
      .post("/api/images")
      .attach("image", Buffer.from([0x89, 0x50, 0x4e, 0x47]), { filename: "x.png", contentType: "image/png" });

    expect(res.status).toBe(201);
    expect(res.body).toEqual({
      id: "image-transform/abc",
      url: "https://res.cloudinary.com/c/abc.png",
      createdAt: "2026-06-06T00:00:00Z",
    });
    expect(removeBackgroundMock).toHaveBeenCalledOnce();
    expect(flipHorizontalMock).toHaveBeenCalledWith(Buffer.from([1]));
    expect(uploadImageMock).toHaveBeenCalledWith(Buffer.from([2]));
  });

  it("POST /api/images returns 400 when no file is attached", async () => {
    const res = await request(app).post("/api/images");
    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe("NO_FILE");
  });

  it("POST /api/images returns 400 for an unsupported type", async () => {
    const res = await request(app)
      .post("/api/images")
      .attach("image", Buffer.from([1, 2, 3]), { filename: "x.txt", contentType: "text/plain" });
    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe("UNSUPPORTED_TYPE");
  });

  it("POST /api/images maps an upstream failure to 502", async () => {
    removeBackgroundMock.mockRejectedValue(
      new AppError(502, "BACKGROUND_REMOVAL_FAILED", "unavailable"),
    );
    const res = await request(app)
      .post("/api/images")
      .attach("image", Buffer.from([0x89, 0x50]), { filename: "x.png", contentType: "image/png" });
    expect(res.status).toBe(502);
    expect(res.body.error.code).toBe("BACKGROUND_REMOVAL_FAILED");
  });

  it("GET /api/images returns the list", async () => {
    listImagesMock.mockResolvedValue([
      { id: "image-transform/a", url: "https://x/a.png", createdAt: "2026-06-06T00:00:00Z" },
    ]);
    const res = await request(app).get("/api/images");
    expect(res.status).toBe(200);
    expect(res.body).toHaveLength(1);
    expect(res.body[0].id).toBe("image-transform/a");
  });

  it("DELETE /api/images/:id deletes folder-qualified ids and returns 204", async () => {
    deleteImageMock.mockResolvedValue(undefined);
    const res = await request(app).delete("/api/images/image-transform/abc");
    expect(res.status).toBe(204);
    expect(deleteImageMock).toHaveBeenCalledWith("image-transform/abc");
  });

  it("DELETE /api/images/:id returns 404 when the image is missing", async () => {
    deleteImageMock.mockRejectedValue(new AppError(404, "IMAGE_NOT_FOUND", "Image not found."));
    const res = await request(app).delete("/api/images/image-transform/missing");
    expect(res.status).toBe(404);
    expect(res.body.error.code).toBe("IMAGE_NOT_FOUND");
  });
});
