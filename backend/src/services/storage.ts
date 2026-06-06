import { v2 as cloudinary } from "cloudinary";
import { config, CLOUDINARY_FOLDER } from "../config.js";
import { AppError } from "../utils/AppError.js";
import type { ProcessedImage } from "../types/index.js";

cloudinary.config({
  cloud_name: config.CLOUDINARY_CLOUD_NAME,
  api_key: config.CLOUDINARY_API_KEY,
  api_secret: config.CLOUDINARY_API_SECRET,
});

interface CloudinaryResource {
  public_id: string;
  secure_url: string;
  created_at: string;
}

function toProcessedImage(r: CloudinaryResource): ProcessedImage {
  return { id: r.public_id, url: r.secure_url, createdAt: r.created_at };
}

export async function uploadImage(buffer: Buffer): Promise<ProcessedImage> {
  const dataUri = `data:image/png;base64,${buffer.toString("base64")}`;
  try {
    const result = await cloudinary.uploader.upload(dataUri, {
      folder: CLOUDINARY_FOLDER,
      resource_type: "image",
      format: "png",
    });
    return toProcessedImage(result as unknown as CloudinaryResource);
  } catch {
    throw new AppError(502, "STORAGE_UPLOAD_FAILED", "Failed to host the processed image.");
  }
}

export async function listImages(): Promise<ProcessedImage[]> {
  try {
    const result = await cloudinary.api.resources({
      type: "upload",
      prefix: `${CLOUDINARY_FOLDER}/`,
      resource_type: "image",
      max_results: 100,
    });
    const resources = (result.resources ?? []) as CloudinaryResource[];
    return resources.map(toProcessedImage);
  } catch {
    throw new AppError(502, "STORAGE_LIST_FAILED", "Failed to list hosted images.");
  }
}

export async function deleteImage(id: string): Promise<void> {
  let result: { result?: string };
  try {
    result = await cloudinary.uploader.destroy(id, { resource_type: "image" });
  } catch {
    throw new AppError(502, "STORAGE_DELETE_FAILED", "Failed to delete the image.");
  }
  if (result.result === "not found") {
    throw new AppError(404, "IMAGE_NOT_FOUND", "Image not found.");
  }
}
