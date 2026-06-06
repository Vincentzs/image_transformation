import { config } from "../config.js";
import { AppError } from "../utils/AppError.js";

const REMOVE_BG_URL = "https://api.remove.bg/v1.0/removebg";
const TIMEOUT_MS = 30_000;

/**
 * Sends an image to remove.bg and returns the background-removed PNG bytes.
 * Throws AppError(502) on any upstream failure or timeout.
 */
export async function removeBackground(input: Buffer): Promise<Buffer> {
  const form = new FormData();
  form.append("image_file", new Blob([new Uint8Array(input)]), "upload");
  form.append("size", "auto");

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), TIMEOUT_MS);

  let response: Response;
  try {
    response = await fetch(REMOVE_BG_URL, {
      method: "POST",
      headers: { "X-Api-Key": config.REMOVE_BG_API_KEY },
      body: form,
      signal: controller.signal,
    });
  } catch (err) {
    throw new AppError(
      502,
      "BACKGROUND_REMOVAL_FAILED",
      "Background removal service is currently unavailable. Please try again.",
    );
  } finally {
    clearTimeout(timeout);
  }

  if (!response.ok) {
    throw new AppError(
      502,
      "BACKGROUND_REMOVAL_FAILED",
      "Background removal failed. The service may be over quota or rejected the image.",
    );
  }

  const arrayBuffer = await response.arrayBuffer();
  return Buffer.from(arrayBuffer);
}
