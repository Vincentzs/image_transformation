import { describe, it, expect, vi, beforeEach } from "vitest";
import request from "supertest";
import { createApp } from "../src/app.js";
import { AppError } from "../src/utils/AppError.js";
import type { ImageService } from "../src/services/ports.js";

function makeService(): { [K in keyof ImageService]: ReturnType<typeof vi.fn> } {
  return { process: vi.fn(), list: vi.fn(), remove: vi.fn() };
}

describe("images API", () => {
  let service: ReturnType<typeof makeService>;
  let app: ReturnType<typeof createApp>;

  beforeEach(() => {
    service = makeService();
    app = createApp({
      imageService: service as unknown as ImageService,
      frontendOrigin: "http://localhost:5173",
    });
  });

  it("GET /api/health returns ok", async () => {
    const res = await request(app).get("/api/health");
    expect(res.status).toBe(200);
    expect(res.body).toEqual({ status: "ok" });
  });

  it("POST /api/images processes the upload and returns 201", async () => {
    service.process.mockResolvedValue({
      id: "image-transform/abc",
      url: "https://res.cloudinary.com/c/abc.png",
      createdAt: "2026-06-06T00:00:00Z",
    });

    const res = await request(app)
      .post("/api/images")
      .attach("image", Buffer.from([0x89, 0x50, 0x4e, 0x47]), { filename: "x.png", contentType: "image/png" });

    expect(res.status).toBe(201);
    expect(res.body.id).toBe("image-transform/abc");
    expect(service.process).toHaveBeenCalledOnce();
    expect(service.process.mock.calls[0][0]).toBeInstanceOf(Buffer);
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

  it("POST /api/images maps a service failure to its status", async () => {
    service.process.mockRejectedValue(new AppError(502, "BACKGROUND_REMOVAL_FAILED", "unavailable"));
    const res = await request(app)
      .post("/api/images")
      .attach("image", Buffer.from([0x89, 0x50]), { filename: "x.png", contentType: "image/png" });
    expect(res.status).toBe(502);
    expect(res.body.error.code).toBe("BACKGROUND_REMOVAL_FAILED");
  });

  it("GET /api/images returns the list", async () => {
    service.list.mockResolvedValue([
      { id: "image-transform/a", url: "https://x/a.png", createdAt: "2026-06-06T00:00:00Z" },
    ]);
    const res = await request(app).get("/api/images");
    expect(res.status).toBe(200);
    expect(res.body).toHaveLength(1);
    expect(res.body[0].id).toBe("image-transform/a");
  });

  it("DELETE /api/images/:id deletes folder-qualified ids and returns 204", async () => {
    service.remove.mockResolvedValue(undefined);
    const res = await request(app).delete("/api/images/image-transform/abc");
    expect(res.status).toBe(204);
    expect(service.remove).toHaveBeenCalledWith("image-transform/abc");
  });

  it("DELETE /api/images/:id returns 404 when the image is missing", async () => {
    service.remove.mockRejectedValue(new AppError(404, "IMAGE_NOT_FOUND", "Image not found."));
    const res = await request(app).delete("/api/images/image-transform/missing");
    expect(res.status).toBe(404);
    expect(res.body.error.code).toBe("IMAGE_NOT_FOUND");
  });
});
