import express, { type Express } from "express";
import cors from "cors";
import { config } from "./config.js";
import { imagesRouter } from "./routes/images.routes.js";
import { errorHandler } from "./middleware/errorHandler.js";

export function createApp(): Express {
  const app = express();

  app.use(cors({ origin: config.FRONTEND_ORIGIN }));
  app.use(express.json());

  app.get("/api/health", (_req, res) => {
    res.status(200).json({ status: "ok" });
  });

  app.use("/api/images", imagesRouter);

  app.use(errorHandler);

  return app;
}
