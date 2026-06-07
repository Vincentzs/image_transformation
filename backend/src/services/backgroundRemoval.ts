import { AppError } from "../utils/AppError.js";
import type { Logger } from "../utils/logger.js";
import type { BackgroundRemover } from "./ports.js";

export interface RemoveBgOptions {
  apiKey: string;
  endpoint?: string;
  timeoutMs?: number;
  /** Injectable for testing; defaults to the global fetch. */
  fetchFn?: typeof fetch;
  logger?: Logger;
}

/** remove.bg adapter for the {@link BackgroundRemover} port. */
export function createRemoveBgBackgroundRemover(options: RemoveBgOptions): BackgroundRemover {
  const {
    apiKey,
    endpoint = "https://api.remove.bg/v1.0/removebg",
    timeoutMs = 30_000,
    fetchFn = fetch,
    logger,
  } = options;

  return {
    async removeBackground(input: Buffer): Promise<Buffer> {
      const form = new FormData();
      form.append("image_file", new Blob([new Uint8Array(input)]), "upload");
      form.append("size", "auto");

      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), timeoutMs);

      let response: Response;
      try {
        response = await fetchFn(endpoint, {
          method: "POST",
          headers: { "X-Api-Key": apiKey },
          body: form,
          signal: controller.signal,
        });
      } catch {
        throw new AppError(
          502,
          "BACKGROUND_REMOVAL_FAILED",
          "Background removal service is currently unavailable. Please try again.",
        );
      } finally {
        clearTimeout(timeout);
      }

      if (!response.ok) {
        const detail = await response.text().catch(() => "");
        logger?.error(`remove.bg request failed: HTTP ${response.status} ${detail}`.trim());
        throw new AppError(502, "BACKGROUND_REMOVAL_FAILED", messageForStatus(response.status));
      }

      const arrayBuffer = await response.arrayBuffer();
      return Buffer.from(arrayBuffer);
    },
  };
}

function messageForStatus(status: number): string {
  if (status === 401 || status === 403) {
    return "Background removal failed: the remove.bg API key was rejected. Check REMOVE_BG_API_KEY.";
  }
  if (status === 402 || status === 429) {
    return "Background removal failed: the remove.bg account is out of credits or is being rate limited.";
  }
  if (status === 400) {
    return "Background removal failed: remove.bg could not process this image.";
  }
  return "Background removal failed. Please try again.";
}
