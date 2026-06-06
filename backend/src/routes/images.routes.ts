import { Router } from "express";
import { uploadSingleImage } from "../middleware/upload.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { createImage, getImages, removeImage } from "../controllers/images.controller.js";

export const imagesRouter = Router();

imagesRouter.post("/", uploadSingleImage, asyncHandler(createImage));
imagesRouter.get("/", asyncHandler(getImages));
imagesRouter.delete("/:id(*)", asyncHandler(removeImage));
