import type { Request, Response } from "express";
import { removeBackground } from "../services/backgroundRemoval.js";
import { flipHorizontal } from "../services/imageTransform.js";
import { uploadImage, listImages, deleteImage } from "../services/storage.js";
import { AppError } from "../utils/AppError.js";

export async function createImage(req: Request, res: Response): Promise<void> {
  if (!req.file) {
    throw new AppError(400, "NO_FILE", "No image file was provided.");
  }
  const noBg = await removeBackground(req.file.buffer);
  const flipped = await flipHorizontal(noBg);
  const image = await uploadImage(flipped);
  res.status(201).json(image);
}

export async function getImages(_req: Request, res: Response): Promise<void> {
  const images = await listImages();
  res.status(200).json(images);
}

export async function removeImage(req: Request, res: Response): Promise<void> {
  const id = req.params.id;
  if (!id) {
    throw new AppError(400, "NO_ID", "No image id was provided.");
  }
  await deleteImage(id);
  res.status(204).send();
}
