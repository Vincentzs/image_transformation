import { Router } from "express";
import { asyncHandler } from "../utils/asyncHandler.js";
import { createUploadMiddleware } from "../middleware/upload.js";
import { createImagesController } from "../controllers/images.controller.js";
import type { ImageService } from "../services/ports.js";

/** Builds the `/api/images` router around an injected {@link ImageService}. */
export function createImagesRouter(service: ImageService): Router {
  const controller = createImagesController(service);
  const router = Router();

  router.post("/", createUploadMiddleware(), asyncHandler(controller.create));
  router.get("/", asyncHandler(controller.list));
  // `:id(*)` so folder-qualified Cloudinary public_ids (e.g. image-transform/abc) round-trip.
  router.delete("/:id(*)", asyncHandler(controller.remove));

  return router;
}
