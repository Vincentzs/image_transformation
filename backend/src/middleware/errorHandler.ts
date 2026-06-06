import type { Request, Response, NextFunction } from "express";
import { MulterError } from "multer";
import { AppError } from "../utils/AppError.js";

/** Final Express error handler — emits a consistent `{ error: { message, code } }` JSON shape. */
export function errorHandler(
  err: unknown,
  _req: Request,
  res: Response,
  _next: NextFunction,
): void {
  if (err instanceof AppError) {
    res.status(err.statusCode).json({ error: { message: err.message, code: err.code } });
    return;
  }

  if (err instanceof MulterError) {
    const message =
      err.code === "LIMIT_FILE_SIZE"
        ? "Image exceeds the 10 MB size limit."
        : "Invalid file upload.";
    res.status(400).json({ error: { message, code: err.code } });
    return;
  }

  console.error("Unexpected error:", err);
  res.status(500).json({ error: { message: "Internal server error.", code: "INTERNAL_ERROR" } });
}
