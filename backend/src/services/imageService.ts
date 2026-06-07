import type { ProcessedImage } from "../types/index.js";
import type {
  BackgroundRemover,
  ImageService,
  ImageStore,
  ImageTransformer,
} from "./ports.js";

export interface ImageServiceDeps {
  backgroundRemover: BackgroundRemover;
  transformer: ImageTransformer;
  store: ImageStore;
}

/**
 * Orchestrates the image pipeline. Owns the business workflow so the HTTP
 * layer stays thin, and depends only on ports so any adapter can be swapped.
 */
export function createImageService(deps: ImageServiceDeps): ImageService {
  const { backgroundRemover, transformer, store } = deps;

  return {
    async process(input: Buffer): Promise<ProcessedImage> {
      const withoutBackground = await backgroundRemover.removeBackground(input);
      const flipped = await transformer.flipHorizontal(withoutBackground);
      return store.upload(flipped);
    },
    list: () => store.list(),
    remove: (id) => store.remove(id),
  };
}
