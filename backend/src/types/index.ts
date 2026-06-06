export interface ProcessedImage {
  /** Cloudinary public_id (may contain a folder prefix) */
  id: string;
  /** Cloudinary secure_url — the unique, public URL */
  url: string;
  /** ISO 8601 creation timestamp */
  createdAt: string;
}
