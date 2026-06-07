import express, { type Express } from "express";
import cors from "cors";
import { createImagesRouter } from "./routes/images.routes.js";
import { errorHandler } from "./middleware/errorHandler.js";
import type { ImageService } from "./services/ports.js";

export interface AppOptions {
  imageService: ImageService;
  frontendOrigin: string;
}

/** Builds the Express app from injected dependencies (no global lookups). */
export function createApp({ imageService, frontendOrigin }: AppOptions): Express {
  const app = express();

  app.use(cors({ origin: frontendOrigin }));
  app.use(express.json());

  app.get("/api/health", (_req, res) => {
    res.status(200).json({ status: "ok" });
  });

  app.use("/api/images", createImagesRouter(imageService));

  app.use(errorHandler);

  return app;
}
