import multer from "multer";
import { AppError } from "../utils/AppError.js";

const MAX_BYTES = 10 * 1024 * 1024; // 10 MB
const ALLOWED = new Set(["image/png", "image/jpeg", "image/webp"]);

const storage = multer.memoryStorage();

const multerUpload = multer({
  storage,
  limits: { fileSize: MAX_BYTES, files: 1 },
  fileFilter: (_req, file, cb) => {
    if (!ALLOWED.has(file.mimetype)) {
      cb(new AppError(400, "UNSUPPORTED_TYPE", "Only PNG, JPEG, and WEBP images are allowed."));
      return;
    }
    cb(null, true);
  },
});

/** Parses a single `image` field into `req.file` (memory buffer). */
export const uploadSingleImage = multerUpload.single("image");
