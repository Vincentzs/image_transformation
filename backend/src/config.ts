import dotenv from "dotenv";
import { z } from "zod";

dotenv.config();

const envSchema = z.object({
  PORT: z.coerce.number().default(4000),
  FRONTEND_ORIGIN: z.string().default("http://localhost:5173"),
  REMOVE_BG_API_KEY: z.string().min(1, "REMOVE_BG_API_KEY is required"),
  CLOUDINARY_CLOUD_NAME: z.string().min(1, "CLOUDINARY_CLOUD_NAME is required"),
  CLOUDINARY_API_KEY: z.string().min(1, "CLOUDINARY_API_KEY is required"),
  CLOUDINARY_API_SECRET: z.string().min(1, "CLOUDINARY_API_SECRET is required"),
});

export type Config = z.infer<typeof envSchema>;

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  const issues = parsed.error.issues.map((i) => `  - ${i.path.join(".")}: ${i.message}`).join("\n");
  throw new Error(`Invalid environment configuration:\n${issues}`);
}

export const config = parsed.data;

/** Application constants, centralized so they aren't scattered across modules. */
export const CLOUDINARY_FOLDER = "image-transform";
export const REMOVE_BG_ENDPOINT = "https://api.remove.bg/v1.0/removebg";
export const REMOVE_BG_TIMEOUT_MS = 30_000;
export const UPLOAD_LIMITS = {
  maxBytes: 10 * 1024 * 1024, // 10 MB
  allowedMimeTypes: ["image/png", "image/jpeg", "image/webp"] as const,
};
