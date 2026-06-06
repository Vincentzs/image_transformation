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
    const detail = await response.text().catch(() => "");
    console.error(`remove.bg request failed: HTTP ${response.status} ${detail}`.trim());

    let message: string;
    if (response.status === 401 || response.status === 403) {
      message =
        "Background removal failed: the remove.bg API key was rejected. Check REMOVE_BG_API_KEY.";
    } else if (response.status === 402 || response.status === 429) {
      message =
        "Background removal failed: the remove.bg account is out of credits or is being rate limited.";
    } else if (response.status === 400) {
      message = "Background removal failed: remove.bg could not process this image.";
    } else {
      message = "Background removal failed. Please try again.";
    }

    throw new AppError(502, "BACKGROUND_REMOVAL_FAILED", message);
  }

  const arrayBuffer = await response.arrayBuffer();
  return Buffer.from(arrayBuffer);
}
