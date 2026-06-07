import { v2 as defaultCloudinary } from "cloudinary";
import { AppError } from "../utils/AppError.js";
import type { ProcessedImage } from "../types/index.js";
import type { ImageStore } from "./ports.js";

interface CloudinaryResource {
  public_id: string;
  secure_url: string;
  created_at: string;
}

/** The slice of the Cloudinary v2 API this adapter uses (injectable in tests). */
export interface CloudinaryClient {
  config(options: { cloud_name: string; api_key: string; api_secret: string }): unknown;
  uploader: {
    upload(file: string, options: Record<string, unknown>): Promise<CloudinaryResource>;
    destroy(id: string, options: Record<string, unknown>): Promise<{ result?: string }>;
  };
  api: {
    resources(options: Record<string, unknown>): Promise<{ resources?: CloudinaryResource[] }>;
  };
}

export interface CloudinaryStoreOptions {
  cloudName: string;
  apiKey: string;
  apiSecret: string;
  folder: string;
  /** Injectable for testing; defaults to the real Cloudinary SDK. */
  client?: CloudinaryClient;
}

/** Cloudinary adapter for the {@link ImageStore} port. */
export function createCloudinaryImageStore(options: CloudinaryStoreOptions): ImageStore {
  const { cloudName, apiKey, apiSecret, folder } = options;
  const client = options.client ?? (defaultCloudinary as unknown as CloudinaryClient);

  client.config({ cloud_name: cloudName, api_key: apiKey, api_secret: apiSecret });

  const toProcessedImage = (r: CloudinaryResource): ProcessedImage => ({
    id: r.public_id,
    url: r.secure_url,
    createdAt: r.created_at,
  });

  return {
    async upload(image: Buffer): Promise<ProcessedImage> {
      const dataUri = `data:image/png;base64,${image.toString("base64")}`;
      try {
        const result = await client.uploader.upload(dataUri, {
          folder,
          resource_type: "image",
          format: "png",
        });
        return toProcessedImage(result);
      } catch {
        throw new AppError(502, "STORAGE_UPLOAD_FAILED", "Failed to host the processed image.");
      }
    },

    async list(): Promise<ProcessedImage[]> {
      try {
        const result = await client.api.resources({
          type: "upload",
          prefix: `${folder}/`,
          resource_type: "image",
          max_results: 100,
        });
        return (result.resources ?? []).map(toProcessedImage);
      } catch {
        throw new AppError(502, "STORAGE_LIST_FAILED", "Failed to list hosted images.");
      }
    },

    async remove(id: string): Promise<void> {
      let result: { result?: string };
      try {
        result = await client.uploader.destroy(id, { resource_type: "image" });
      } catch {
        throw new AppError(502, "STORAGE_DELETE_FAILED", "Failed to delete the image.");
      }
      if (result.result === "not found") {
        throw new AppError(404, "IMAGE_NOT_FOUND", "Image not found.");
      }
    },
  };
}
