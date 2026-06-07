import type { Request, Response } from "express";
import { AppError } from "../utils/AppError.js";
import type { ImageService } from "../services/ports.js";

export interface ImagesController {
  create(req: Request, res: Response): Promise<void>;
  list(req: Request, res: Response): Promise<void>;
  remove(req: Request, res: Response): Promise<void>;
}

/** HTTP adapter: translates requests to {@link ImageService} calls and back. */
export function createImagesController(service: ImageService): ImagesController {
  return {
    async create(req, res) {
      if (!req.file) {
        throw new AppError(400, "NO_FILE", "No image file was provided.");
      }
      const image = await service.process(req.file.buffer);
      res.status(201).json(image);
    },

    async list(_req, res) {
      res.status(200).json(await service.list());
    },

    async remove(req, res) {
      const id = req.params.id;
      if (!id) {
        throw new AppError(400, "NO_ID", "No image id was provided.");
      }
      await service.remove(id);
      res.status(204).send();
    },
  };
}
