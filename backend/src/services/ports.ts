import type { ProcessedImage } from "../types/index.js";

/**
 * Ports (abstractions) the application depends on. Concrete adapters
 * (remove.bg, sharp, Cloudinary) implement these so callers depend on
 * behaviour, not vendors — enabling provider swaps and isolated testing.
 */

export interface BackgroundRemover {
  /** Returns the image with its background removed (transparent PNG bytes). */
  removeBackground(input: Buffer): Promise<Buffer>;
}

export interface ImageTransformer {
  /** Mirrors an image left-to-right and returns PNG bytes. */
  flipHorizontal(input: Buffer): Promise<Buffer>;
}

export interface ImageStore {
  /** Hosts an image and returns its unique, public reference. */
  upload(image: Buffer): Promise<ProcessedImage>;
  /** Lists all hosted images. */
  list(): Promise<ProcessedImage[]>;
  /** Deletes a hosted image by id. */
  remove(id: string): Promise<void>;
}

/** Application service: the single facade the HTTP layer depends on. */
export interface ImageService {
  /** Runs the full pipeline: remove background → flip → host. */
  process(input: Buffer): Promise<ProcessedImage>;
  list(): Promise<ProcessedImage[]>;
  remove(id: string): Promise<void>;
}
