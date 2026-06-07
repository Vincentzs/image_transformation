import multer from "multer";
import { AppError } from "../utils/AppError.js";
import { UPLOAD_LIMITS } from "../config.js";

/** Builds the single-image upload middleware (memory storage + type/size limits). */
export function createUploadMiddleware() {
  const allowed = new Set<string>(UPLOAD_LIMITS.allowedMimeTypes);

  return multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: UPLOAD_LIMITS.maxBytes, files: 1 },
    fileFilter: (_req, file, cb) => {
      if (!allowed.has(file.mimetype)) {
        cb(new AppError(400, "UNSUPPORTED_TYPE", "Only PNG, JPEG, and WEBP images are allowed."));
        return;
      }
      cb(null, true);
    },
  }).single("image");
}
