import type { ProcessedImage } from "./types.js";

const BASE_URL = import.meta.env.VITE_API_BASE_URL ?? "http://localhost:4000";

async function parseError(res: Response): Promise<string> {
  try {
    const body = await res.json();
    return body?.error?.message ?? "Request failed.";
  } catch {
    return "Request failed.";
  }
}

export async function uploadImage(file: File): Promise<ProcessedImage> {
  const form = new FormData();
  form.append("image", file);
  const res = await fetch(`${BASE_URL}/api/images`, { method: "POST", body: form });
  if (!res.ok) throw new Error(await parseError(res));
  return res.json();
}

export async function listImages(): Promise<ProcessedImage[]> {
  const res = await fetch(`${BASE_URL}/api/images`);
  if (!res.ok) throw new Error(await parseError(res));
  return res.json();
}

export async function deleteImage(id: string): Promise<void> {
  const res = await fetch(`${BASE_URL}/api/images/${id}`, { method: "DELETE" });
  if (!res.ok) throw new Error(await parseError(res));
}
