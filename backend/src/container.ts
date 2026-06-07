import {
  config,
  CLOUDINARY_FOLDER,
  REMOVE_BG_ENDPOINT,
  REMOVE_BG_TIMEOUT_MS,
} from "./config.js";
import { consoleLogger } from "./utils/logger.js";
import { createRemoveBgBackgroundRemover } from "./services/backgroundRemoval.js";
import { createSharpImageTransformer } from "./services/imageTransform.js";
import { createCloudinaryImageStore } from "./services/storage.js";
import { createImageService } from "./services/imageService.js";
import type { ImageService } from "./services/ports.js";

/**
 * Composition root: builds and wires the concrete adapters into the
 * application service. The only place that knows about real vendors.
 */
export function buildImageService(): ImageService {
  const backgroundRemover = createRemoveBgBackgroundRemover({
    apiKey: config.REMOVE_BG_API_KEY,
    endpoint: REMOVE_BG_ENDPOINT,
    timeoutMs: REMOVE_BG_TIMEOUT_MS,
    logger: consoleLogger,
  });

  const transformer = createSharpImageTransformer();

  const store = createCloudinaryImageStore({
    cloudName: config.CLOUDINARY_CLOUD_NAME,
    apiKey: config.CLOUDINARY_API_KEY,
    apiSecret: config.CLOUDINARY_API_SECRET,
    folder: CLOUDINARY_FOLDER,
  });

  return createImageService({ backgroundRemover, transformer, store });
}
