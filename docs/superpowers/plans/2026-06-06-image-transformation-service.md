# Image Transformation Service Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a full-stack app where a user uploads one image, the backend removes its background (remove.bg) and flips it horizontally (sharp), hosts it on Cloudinary, returns a unique URL, and lets the user list and delete hosted images.

**Architecture:** Monorepo with a stateless Express + TypeScript REST backend and a React + Vite + TypeScript SPA frontend. Cloudinary is the source of truth — no database. Three single-responsibility backend services (background removal, image transform, storage) are orchestrated by one controller.

**Tech Stack:** Node 18, Express 4, TypeScript, sharp, Cloudinary SDK, zod, multer, vitest, supertest (backend); React 18, Vite, TypeScript, Vitest + Testing Library (frontend).

**Spec:** `docs/superpowers/specs/2026-06-06-image-transformation-service-design.md`

---

## File Structure

```
image_transformation/
  backend/
    src/
      index.ts                       # server bootstrap
      app.ts                         # express app factory (middleware + routes)
      config.ts                      # zod-validated env
      types/index.ts                 # ProcessedImage and shared types
      utils/AppError.ts              # typed operational error
      utils/asyncHandler.ts          # async route error funnel
      services/imageTransform.ts     # sharp horizontal flip
      services/backgroundRemoval.ts  # remove.bg client
      services/storage.ts            # cloudinary upload/list/delete
      middleware/upload.ts           # multer memory storage + validation
      middleware/errorHandler.ts     # central JSON error formatter
      controllers/images.controller.ts
      routes/images.routes.ts
    tests/
      imageTransform.test.ts
      backgroundRemoval.test.ts
      storage.test.ts
      images.routes.test.ts
    package.json  tsconfig.json  vitest.config.ts  .env.example  .gitignore
  frontend/
    src/
      main.tsx  App.tsx  App.css  index.css
      api.ts                         # REST client
      types.ts                       # ProcessedImage
      components/UploadDropzone.tsx
      components/ProcessingState.tsx
      components/ResultCard.tsx
      components/Gallery.tsx
    tests/App.test.tsx
    index.html  package.json  tsconfig.json  vite.config.ts  .env.example
  README.md
  .gitignore
```

---

## Task 1: Repo-level gitignore

**Files:**
- Create: `.gitignore`

- [ ] **Step 1: Create root .gitignore**

```
node_modules/
dist/
.env
.env.local
*.log
.DS_Store
```

- [ ] **Step 2: Commit**

```bash
git add .gitignore
git commit -m "chore: add root gitignore"
```

---

## Task 2: Backend project scaffold

**Files:**
- Create: `backend/package.json`, `backend/tsconfig.json`, `backend/vitest.config.ts`, `backend/.gitignore`, `backend/.env.example`

- [ ] **Step 1: Create `backend/package.json`**

```json
{
  "name": "image-transformation-backend",
  "version": "1.0.0",
  "private": true,
  "type": "module",
  "scripts": {
    "dev": "tsx watch src/index.ts",
    "build": "tsc",
    "start": "node dist/index.js",
    "test": "vitest run",
    "test:watch": "vitest"
  },
  "dependencies": {
    "cloudinary": "^2.5.1",
    "cors": "^2.8.5",
    "dotenv": "^16.4.5",
    "express": "^4.21.2",
    "multer": "^1.4.5-lts.1",
    "sharp": "^0.33.5",
    "zod": "^3.23.8"
  },
  "devDependencies": {
    "@types/cors": "^2.8.17",
    "@types/express": "^4.17.21",
    "@types/multer": "^1.4.12",
    "@types/node": "^20.14.0",
    "@types/supertest": "^6.0.2",
    "supertest": "^7.0.0",
    "tsx": "^4.19.2",
    "typescript": "^5.6.3",
    "vitest": "^2.1.8"
  }
}
```

- [ ] **Step 2: Create `backend/tsconfig.json`**

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "ESNext",
    "moduleResolution": "Bundler",
    "outDir": "dist",
    "rootDir": "src",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "resolveJsonModule": true,
    "declaration": false,
    "sourceMap": true
  },
  "include": ["src"],
  "exclude": ["node_modules", "dist", "tests"]
}
```

- [ ] **Step 3: Create `backend/vitest.config.ts`**

```ts
import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    environment: "node",
    include: ["tests/**/*.test.ts"],
  },
});
```

- [ ] **Step 4: Create `backend/.gitignore`**

```
node_modules/
dist/
.env
```

- [ ] **Step 5: Create `backend/.env.example`**

```
PORT=4000
FRONTEND_ORIGIN=http://localhost:5173
REMOVE_BG_API_KEY=your_remove_bg_api_key
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_cloudinary_api_key
CLOUDINARY_API_SECRET=your_cloudinary_api_secret
```

- [ ] **Step 6: Install dependencies**

Run: `cd backend && npm install`
Expected: dependencies install with no errors; `node_modules/` created.

- [ ] **Step 7: Commit**

```bash
git add backend/package.json backend/tsconfig.json backend/vitest.config.ts backend/.gitignore backend/.env.example backend/package-lock.json
git commit -m "chore: scaffold backend project"
```

---

## Task 3: Shared types

**Files:**
- Create: `backend/src/types/index.ts`

- [ ] **Step 1: Create the types file**

```ts
export interface ProcessedImage {
  /** Cloudinary public_id (may contain a folder prefix) */
  id: string;
  /** Cloudinary secure_url — the unique, public URL */
  url: string;
  /** ISO 8601 creation timestamp */
  createdAt: string;
}
```

- [ ] **Step 2: Commit**

```bash
git add backend/src/types/index.ts
git commit -m "feat: add ProcessedImage type"
```

---

## Task 4: AppError + asyncHandler utilities

**Files:**
- Create: `backend/src/utils/AppError.ts`, `backend/src/utils/asyncHandler.ts`

- [ ] **Step 1: Create `backend/src/utils/AppError.ts`**

```ts
export class AppError extends Error {
  readonly statusCode: number;
  readonly code: string;

  constructor(statusCode: number, code: string, message: string) {
    super(message);
    this.name = "AppError";
    this.statusCode = statusCode;
    this.code = code;
  }
}
```

- [ ] **Step 2: Create `backend/src/utils/asyncHandler.ts`**

```ts
import type { Request, Response, NextFunction, RequestHandler } from "express";

/** Wraps an async route handler so rejected promises reach Express's error pipeline. */
export function asyncHandler(
  fn: (req: Request, res: Response, next: NextFunction) => Promise<unknown>,
): RequestHandler {
  return (req, res, next) => {
    fn(req, res, next).catch(next);
  };
}
```

- [ ] **Step 3: Commit**

```bash
git add backend/src/utils/AppError.ts backend/src/utils/asyncHandler.ts
git commit -m "feat: add AppError and asyncHandler utilities"
```

---

## Task 5: Config with zod env validation

**Files:**
- Create: `backend/src/config.ts`

- [ ] **Step 1: Create `backend/src/config.ts`**

```ts
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

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  const issues = parsed.error.issues.map((i) => `  - ${i.path.join(".")}: ${i.message}`).join("\n");
  throw new Error(`Invalid environment configuration:\n${issues}`);
}

export const config = parsed.data;
export const CLOUDINARY_FOLDER = "image-transform";
```

- [ ] **Step 2: Commit**

```bash
git add backend/src/config.ts
git commit -m "feat: add zod-validated config"
```

---

## Task 6: imageTransform service (sharp horizontal flip)

**Files:**
- Create: `backend/src/services/imageTransform.ts`
- Test: `backend/tests/imageTransform.test.ts`

- [ ] **Step 1: Write the failing test**

The test builds a 2×1 PNG whose left pixel is red and right pixel is blue, flips it, and asserts the pixels swapped (left now blue, right now red).

```ts
import { describe, it, expect } from "vitest";
import sharp from "sharp";
import { flipHorizontal } from "../src/services/imageTransform.js";

async function makeTwoPixelPng(): Promise<Buffer> {
  // 2x1 RGB: pixel 0 = red, pixel 1 = blue
  const raw = Buffer.from([255, 0, 0, 0, 0, 255]);
  return sharp(raw, { raw: { width: 2, height: 1, channels: 3 } }).png().toBuffer();
}

describe("flipHorizontal", () => {
  it("mirrors the image so left and right pixels swap", async () => {
    const input = await makeTwoPixelPng();

    const flipped = await flipHorizontal(input);

    const { data, info } = await sharp(flipped).raw().toBuffer({ resolveWithObject: true });
    expect(info.width).toBe(2);
    expect(info.height).toBe(1);
    // After flip, left pixel should be blue, right pixel should be red.
    const channels = info.channels;
    const left = [data[0], data[1], data[2]];
    const right = [data[channels], data[channels + 1], data[channels + 2]];
    expect(left).toEqual([0, 0, 255]);
    expect(right).toEqual([255, 0, 0]);
  });

  it("returns a valid PNG", async () => {
    const input = await makeTwoPixelPng();
    const flipped = await flipHorizontal(input);
    const meta = await sharp(flipped).metadata();
    expect(meta.format).toBe("png");
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd backend && npx vitest run tests/imageTransform.test.ts`
Expected: FAIL — cannot resolve `../src/services/imageTransform.js` / `flipHorizontal` is not defined.

- [ ] **Step 3: Write minimal implementation**

```ts
import sharp from "sharp";

/**
 * Flips an image horizontally (mirror left-to-right) and returns a PNG buffer.
 * `.flop()` is sharp's horizontal mirror; `.flip()` would be vertical.
 */
export async function flipHorizontal(input: Buffer): Promise<Buffer> {
  return sharp(input).flop().png().toBuffer();
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `cd backend && npx vitest run tests/imageTransform.test.ts`
Expected: PASS (2 tests).

- [ ] **Step 5: Commit**

```bash
git add backend/src/services/imageTransform.ts backend/tests/imageTransform.test.ts
git commit -m "feat: add imageTransform service with horizontal flip"
```

---

## Task 7: backgroundRemoval service (remove.bg client)

**Files:**
- Create: `backend/src/services/backgroundRemoval.ts`
- Test: `backend/tests/backgroundRemoval.test.ts`

Uses the global `fetch`, `FormData`, and `Blob` (Node 18+). Tests stub `global.fetch`.

- [ ] **Step 1: Write the failing test**

```ts
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

vi.mock("../src/config.js", () => ({
  config: { REMOVE_BG_API_KEY: "test-key" },
  CLOUDINARY_FOLDER: "image-transform",
}));

import { removeBackground } from "../src/services/backgroundRemoval.js";
import { AppError } from "../src/utils/AppError.js";

describe("removeBackground", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("returns the response bytes on success", async () => {
    const out = new Uint8Array([1, 2, 3, 4]);
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      arrayBuffer: async () => out.buffer,
    }) as unknown as typeof fetch;

    const result = await removeBackground(Buffer.from([9, 9, 9]));

    expect(Buffer.from(result)).toEqual(Buffer.from([1, 2, 3, 4]));
    expect(global.fetch).toHaveBeenCalledOnce();
    const [url, init] = (global.fetch as ReturnType<typeof vi.fn>).mock.calls[0];
    expect(url).toBe("https://api.remove.bg/v1.0/removebg");
    expect((init as RequestInit).method).toBe("POST");
    expect((init as any).headers["X-Api-Key"]).toBe("test-key");
  });

  it("throws AppError 502 when remove.bg returns a non-ok status", async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 402,
      text: async () => "Payment required",
    }) as unknown as typeof fetch;

    await expect(removeBackground(Buffer.from([1]))).rejects.toMatchObject({
      statusCode: 502,
      code: "BACKGROUND_REMOVAL_FAILED",
    });
  });

  it("throws AppError 502 when fetch rejects (network/timeout)", async () => {
    global.fetch = vi.fn().mockRejectedValue(new Error("network down")) as unknown as typeof fetch;

    await expect(removeBackground(Buffer.from([1]))).rejects.toBeInstanceOf(AppError);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd backend && npx vitest run tests/backgroundRemoval.test.ts`
Expected: FAIL — `removeBackground` not defined.

- [ ] **Step 3: Write minimal implementation**

```ts
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
  form.append("image_file", new Blob([input]), "upload");
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
    throw new AppError(
      502,
      "BACKGROUND_REMOVAL_FAILED",
      "Background removal failed. The service may be over quota or rejected the image.",
    );
  }

  const arrayBuffer = await response.arrayBuffer();
  return Buffer.from(arrayBuffer);
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `cd backend && npx vitest run tests/backgroundRemoval.test.ts`
Expected: PASS (3 tests).

- [ ] **Step 5: Commit**

```bash
git add backend/src/services/backgroundRemoval.ts backend/tests/backgroundRemoval.test.ts
git commit -m "feat: add remove.bg background removal service"
```

---

## Task 8: storage service (Cloudinary)

**Files:**
- Create: `backend/src/services/storage.ts`
- Test: `backend/tests/storage.test.ts`

Mocks the `cloudinary` module. Uploads via a base64 data URI (simplest buffer path).

- [ ] **Step 1: Write the failing test**

```ts
import { describe, it, expect, vi, beforeEach } from "vitest";

const uploadMock = vi.fn();
const destroyMock = vi.fn();
const resourcesMock = vi.fn();
const configMock = vi.fn();

vi.mock("cloudinary", () => ({
  v2: {
    config: configMock,
    uploader: { upload: uploadMock, destroy: destroyMock },
    api: { resources: resourcesMock },
  },
}));

vi.mock("../src/config.js", () => ({
  config: {
    CLOUDINARY_CLOUD_NAME: "c",
    CLOUDINARY_API_KEY: "k",
    CLOUDINARY_API_SECRET: "s",
  },
  CLOUDINARY_FOLDER: "image-transform",
}));

import { uploadImage, listImages, deleteImage } from "../src/services/storage.js";
import { AppError } from "../src/utils/AppError.js";

describe("storage service", () => {
  beforeEach(() => {
    uploadMock.mockReset();
    destroyMock.mockReset();
    resourcesMock.mockReset();
  });

  it("uploads a buffer and maps the response to ProcessedImage", async () => {
    uploadMock.mockResolvedValue({
      public_id: "image-transform/abc",
      secure_url: "https://res.cloudinary.com/c/image/upload/abc.png",
      created_at: "2026-06-06T00:00:00Z",
    });

    const result = await uploadImage(Buffer.from([1, 2, 3]));

    expect(result).toEqual({
      id: "image-transform/abc",
      url: "https://res.cloudinary.com/c/image/upload/abc.png",
      createdAt: "2026-06-06T00:00:00Z",
    });
    const [dataUri, opts] = uploadMock.mock.calls[0];
    expect(String(dataUri)).toMatch(/^data:image\/png;base64,/);
    expect(opts).toMatchObject({ folder: "image-transform", resource_type: "image" });
  });

  it("lists images mapped to ProcessedImage, newest first", async () => {
    resourcesMock.mockResolvedValue({
      resources: [
        { public_id: "image-transform/a", secure_url: "https://x/a.png", created_at: "2026-06-06T00:00:00Z" },
        { public_id: "image-transform/b", secure_url: "https://x/b.png", created_at: "2026-06-05T00:00:00Z" },
      ],
    });

    const result = await listImages();

    expect(result).toEqual([
      { id: "image-transform/a", url: "https://x/a.png", createdAt: "2026-06-06T00:00:00Z" },
      { id: "image-transform/b", url: "https://x/b.png", createdAt: "2026-06-05T00:00:00Z" },
    ]);
    expect(resourcesMock).toHaveBeenCalledWith(
      expect.objectContaining({ type: "upload", prefix: "image-transform/", resource_type: "image" }),
    );
  });

  it("deletes by id", async () => {
    destroyMock.mockResolvedValue({ result: "ok" });
    await deleteImage("image-transform/abc");
    expect(destroyMock).toHaveBeenCalledWith("image-transform/abc", { resource_type: "image" });
  });

  it("throws AppError 404 when deleting a missing id", async () => {
    destroyMock.mockResolvedValue({ result: "not found" });
    await expect(deleteImage("image-transform/missing")).rejects.toMatchObject({
      statusCode: 404,
      code: "IMAGE_NOT_FOUND",
    });
  });

  it("wraps upload failures in AppError 502", async () => {
    uploadMock.mockRejectedValue(new Error("cloudinary down"));
    await expect(uploadImage(Buffer.from([1]))).rejects.toBeInstanceOf(AppError);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd backend && npx vitest run tests/storage.test.ts`
Expected: FAIL — `uploadImage`/`listImages`/`deleteImage` not defined.

- [ ] **Step 3: Write minimal implementation**

```ts
import { v2 as cloudinary } from "cloudinary";
import { config, CLOUDINARY_FOLDER } from "../config.js";
import { AppError } from "../utils/AppError.js";
import type { ProcessedImage } from "../types/index.js";

cloudinary.config({
  cloud_name: config.CLOUDINARY_CLOUD_NAME,
  api_key: config.CLOUDINARY_API_KEY,
  api_secret: config.CLOUDINARY_API_SECRET,
});

interface CloudinaryResource {
  public_id: string;
  secure_url: string;
  created_at: string;
}

function toProcessedImage(r: CloudinaryResource): ProcessedImage {
  return { id: r.public_id, url: r.secure_url, createdAt: r.created_at };
}

export async function uploadImage(buffer: Buffer): Promise<ProcessedImage> {
  const dataUri = `data:image/png;base64,${buffer.toString("base64")}`;
  try {
    const result = await cloudinary.uploader.upload(dataUri, {
      folder: CLOUDINARY_FOLDER,
      resource_type: "image",
      format: "png",
    });
    return toProcessedImage(result as unknown as CloudinaryResource);
  } catch {
    throw new AppError(502, "STORAGE_UPLOAD_FAILED", "Failed to host the processed image.");
  }
}

export async function listImages(): Promise<ProcessedImage[]> {
  try {
    const result = await cloudinary.api.resources({
      type: "upload",
      prefix: `${CLOUDINARY_FOLDER}/`,
      resource_type: "image",
      max_results: 100,
    });
    const resources = (result.resources ?? []) as CloudinaryResource[];
    return resources.map(toProcessedImage);
  } catch {
    throw new AppError(502, "STORAGE_LIST_FAILED", "Failed to list hosted images.");
  }
}

export async function deleteImage(id: string): Promise<void> {
  let result: { result?: string };
  try {
    result = await cloudinary.uploader.destroy(id, { resource_type: "image" });
  } catch {
    throw new AppError(502, "STORAGE_DELETE_FAILED", "Failed to delete the image.");
  }
  if (result.result === "not found") {
    throw new AppError(404, "IMAGE_NOT_FOUND", "Image not found.");
  }
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `cd backend && npx vitest run tests/storage.test.ts`
Expected: PASS (5 tests).

- [ ] **Step 5: Commit**

```bash
git add backend/src/services/storage.ts backend/tests/storage.test.ts
git commit -m "feat: add Cloudinary storage service"
```

---

## Task 9: upload middleware (multer + validation)

**Files:**
- Create: `backend/src/middleware/upload.ts`

No standalone test (its behavior is covered by the route integration tests in Task 12).

- [ ] **Step 1: Create `backend/src/middleware/upload.ts`**

```ts
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
```

- [ ] **Step 2: Commit**

```bash
git add backend/src/middleware/upload.ts
git commit -m "feat: add multer upload middleware with type/size limits"
```

---

## Task 10: error handler middleware

**Files:**
- Create: `backend/src/middleware/errorHandler.ts`

- [ ] **Step 1: Create `backend/src/middleware/errorHandler.ts`**

```ts
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
```

- [ ] **Step 2: Commit**

```bash
git add backend/src/middleware/errorHandler.ts
git commit -m "feat: add central error handler middleware"
```

---

## Task 11: images controller + routes

**Files:**
- Create: `backend/src/controllers/images.controller.ts`, `backend/src/routes/images.routes.ts`

No standalone test (covered by Task 12 integration tests).

- [ ] **Step 1: Create `backend/src/controllers/images.controller.ts`**

```ts
import type { Request, Response } from "express";
import { removeBackground } from "../services/backgroundRemoval.js";
import { flipHorizontal } from "../services/imageTransform.js";
import { uploadImage, listImages, deleteImage } from "../services/storage.js";
import { AppError } from "../utils/AppError.js";

export async function createImage(req: Request, res: Response): Promise<void> {
  if (!req.file) {
    throw new AppError(400, "NO_FILE", "No image file was provided.");
  }
  const noBg = await removeBackground(req.file.buffer);
  const flipped = await flipHorizontal(noBg);
  const image = await uploadImage(flipped);
  res.status(201).json(image);
}

export async function getImages(_req: Request, res: Response): Promise<void> {
  const images = await listImages();
  res.status(200).json(images);
}

export async function removeImage(req: Request, res: Response): Promise<void> {
  const id = req.params.id;
  if (!id) {
    throw new AppError(400, "NO_ID", "No image id was provided.");
  }
  await deleteImage(id);
  res.status(204).send();
}
```

- [ ] **Step 2: Create `backend/src/routes/images.routes.ts`**

The delete route uses `:id(*)` so folder-qualified ids (e.g. `image-transform/abc`) round-trip without being split on `/`.

```ts
import { Router } from "express";
import { uploadSingleImage } from "../middleware/upload.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { createImage, getImages, removeImage } from "../controllers/images.controller.js";

export const imagesRouter = Router();

imagesRouter.post("/", uploadSingleImage, asyncHandler(createImage));
imagesRouter.get("/", asyncHandler(getImages));
imagesRouter.delete("/:id(*)", asyncHandler(removeImage));
```

- [ ] **Step 3: Commit**

```bash
git add backend/src/controllers/images.controller.ts backend/src/routes/images.routes.ts
git commit -m "feat: add images controller and routes"
```

---

## Task 12: app factory + route integration tests

**Files:**
- Create: `backend/src/app.ts`
- Test: `backend/tests/images.routes.test.ts`

- [ ] **Step 1: Create `backend/src/app.ts`**

```ts
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
```

- [ ] **Step 2: Write the failing integration test**

Mocks all three services so no real network calls happen. Verifies the full pipeline wiring and error mapping via HTTP.

```ts
import { describe, it, expect, vi, beforeEach } from "vitest";
import request from "supertest";

vi.mock("../src/config.js", () => ({
  config: { FRONTEND_ORIGIN: "http://localhost:5173" },
  CLOUDINARY_FOLDER: "image-transform",
}));

const removeBackgroundMock = vi.fn();
const flipHorizontalMock = vi.fn();
const uploadImageMock = vi.fn();
const listImagesMock = vi.fn();
const deleteImageMock = vi.fn();

vi.mock("../src/services/backgroundRemoval.js", () => ({ removeBackground: removeBackgroundMock }));
vi.mock("../src/services/imageTransform.js", () => ({ flipHorizontal: flipHorizontalMock }));
vi.mock("../src/services/storage.js", () => ({
  uploadImage: uploadImageMock,
  listImages: listImagesMock,
  deleteImage: deleteImageMock,
}));

import { createApp } from "../src/app.js";
import { AppError } from "../src/utils/AppError.js";

const app = createApp();

describe("images API", () => {
  beforeEach(() => {
    removeBackgroundMock.mockReset();
    flipHorizontalMock.mockReset();
    uploadImageMock.mockReset();
    listImagesMock.mockReset();
    deleteImageMock.mockReset();
  });

  it("GET /api/health returns ok", async () => {
    const res = await request(app).get("/api/health");
    expect(res.status).toBe(200);
    expect(res.body).toEqual({ status: "ok" });
  });

  it("POST /api/images runs the pipeline and returns 201 with the hosted image", async () => {
    removeBackgroundMock.mockResolvedValue(Buffer.from([1]));
    flipHorizontalMock.mockResolvedValue(Buffer.from([2]));
    uploadImageMock.mockResolvedValue({
      id: "image-transform/abc",
      url: "https://res.cloudinary.com/c/abc.png",
      createdAt: "2026-06-06T00:00:00Z",
    });

    const res = await request(app)
      .post("/api/images")
      .attach("image", Buffer.from([0x89, 0x50, 0x4e, 0x47]), { filename: "x.png", contentType: "image/png" });

    expect(res.status).toBe(201);
    expect(res.body).toEqual({
      id: "image-transform/abc",
      url: "https://res.cloudinary.com/c/abc.png",
      createdAt: "2026-06-06T00:00:00Z",
    });
    expect(removeBackgroundMock).toHaveBeenCalledOnce();
    expect(flipHorizontalMock).toHaveBeenCalledWith(Buffer.from([1]));
    expect(uploadImageMock).toHaveBeenCalledWith(Buffer.from([2]));
  });

  it("POST /api/images returns 400 when no file is attached", async () => {
    const res = await request(app).post("/api/images");
    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe("NO_FILE");
  });

  it("POST /api/images returns 400 for an unsupported type", async () => {
    const res = await request(app)
      .post("/api/images")
      .attach("image", Buffer.from([1, 2, 3]), { filename: "x.txt", contentType: "text/plain" });
    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe("UNSUPPORTED_TYPE");
  });

  it("POST /api/images maps an upstream failure to 502", async () => {
    removeBackgroundMock.mockRejectedValue(
      new AppError(502, "BACKGROUND_REMOVAL_FAILED", "unavailable"),
    );
    const res = await request(app)
      .post("/api/images")
      .attach("image", Buffer.from([0x89, 0x50]), { filename: "x.png", contentType: "image/png" });
    expect(res.status).toBe(502);
    expect(res.body.error.code).toBe("BACKGROUND_REMOVAL_FAILED");
  });

  it("GET /api/images returns the list", async () => {
    listImagesMock.mockResolvedValue([
      { id: "image-transform/a", url: "https://x/a.png", createdAt: "2026-06-06T00:00:00Z" },
    ]);
    const res = await request(app).get("/api/images");
    expect(res.status).toBe(200);
    expect(res.body).toHaveLength(1);
    expect(res.body[0].id).toBe("image-transform/a");
  });

  it("DELETE /api/images/:id deletes folder-qualified ids and returns 204", async () => {
    deleteImageMock.mockResolvedValue(undefined);
    const res = await request(app).delete("/api/images/image-transform/abc");
    expect(res.status).toBe(204);
    expect(deleteImageMock).toHaveBeenCalledWith("image-transform/abc");
  });

  it("DELETE /api/images/:id returns 404 when the image is missing", async () => {
    deleteImageMock.mockRejectedValue(new AppError(404, "IMAGE_NOT_FOUND", "Image not found."));
    const res = await request(app).delete("/api/images/image-transform/missing");
    expect(res.status).toBe(404);
    expect(res.body.error.code).toBe("IMAGE_NOT_FOUND");
  });
});
```

- [ ] **Step 3: Run test to verify it fails**

Run: `cd backend && npx vitest run tests/images.routes.test.ts`
Expected: FAIL — `../src/app.js` resolves but assertions fail, OR fails to import until `app.ts` exists. (If you wrote `app.ts` in Step 1 first, failures should be limited to any wiring mismatch; fix until green.)

- [ ] **Step 4: Run test to verify it passes**

Run: `cd backend && npx vitest run tests/images.routes.test.ts`
Expected: PASS (8 tests).

- [ ] **Step 5: Run the full backend suite**

Run: `cd backend && npm test`
Expected: PASS — all backend test files green.

- [ ] **Step 6: Commit**

```bash
git add backend/src/app.ts backend/tests/images.routes.test.ts
git commit -m "feat: add app factory with route integration tests"
```

---

## Task 13: server bootstrap

**Files:**
- Create: `backend/src/index.ts`

- [ ] **Step 1: Create `backend/src/index.ts`**

```ts
import { createApp } from "./app.js";
import { config } from "./config.js";

const app = createApp();

app.listen(config.PORT, () => {
  console.log(`Backend listening on http://localhost:${config.PORT}`);
});
```

- [ ] **Step 2: Verify the build compiles**

Run: `cd backend && npm run build`
Expected: `tsc` completes with no errors; `dist/` is produced.

- [ ] **Step 3: Commit**

```bash
git add backend/src/index.ts
git commit -m "feat: add server bootstrap"
```

---

## Task 14: Frontend scaffold

**Files:**
- Create: `frontend/package.json`, `frontend/tsconfig.json`, `frontend/vite.config.ts`, `frontend/index.html`, `frontend/.env.example`, `frontend/src/main.tsx`, `frontend/src/index.css`, `frontend/src/types.ts`

- [ ] **Step 1: Create `frontend/package.json`**

```json
{
  "name": "image-transformation-frontend",
  "version": "1.0.0",
  "private": true,
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "tsc && vite build",
    "preview": "vite preview",
    "test": "vitest run"
  },
  "dependencies": {
    "react": "^18.3.1",
    "react-dom": "^18.3.1"
  },
  "devDependencies": {
    "@testing-library/jest-dom": "^6.6.3",
    "@testing-library/react": "^16.1.0",
    "@testing-library/user-event": "^14.5.2",
    "@types/react": "^18.3.12",
    "@types/react-dom": "^18.3.1",
    "@vitejs/plugin-react": "^4.3.4",
    "jsdom": "^25.0.1",
    "typescript": "^5.6.3",
    "vite": "^6.0.3",
    "vitest": "^2.1.8"
  }
}
```

- [ ] **Step 2: Create `frontend/tsconfig.json`**

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "useDefineForClassFields": true,
    "lib": ["ES2022", "DOM", "DOM.Iterable"],
    "module": "ESNext",
    "moduleResolution": "Bundler",
    "jsx": "react-jsx",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "noEmit": true,
    "types": ["vitest/globals", "@testing-library/jest-dom"]
  },
  "include": ["src", "tests"]
}
```

- [ ] **Step 3: Create `frontend/vite.config.ts`**

```ts
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  test: {
    globals: true,
    environment: "jsdom",
    setupFiles: ["./tests/setup.ts"],
    include: ["tests/**/*.test.tsx"],
  },
});
```

- [ ] **Step 4: Create `frontend/index.html`**

```html
<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Image Transformer</title>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.tsx"></script>
  </body>
</html>
```

- [ ] **Step 5: Create `frontend/.env.example`**

```
VITE_API_BASE_URL=http://localhost:4000
```

- [ ] **Step 6: Create `frontend/src/types.ts`**

```ts
export interface ProcessedImage {
  id: string;
  url: string;
  createdAt: string;
}
```

- [ ] **Step 7: Create `frontend/src/index.css`**

```css
:root { font-family: system-ui, sans-serif; color: #1a1a1a; }
* { box-sizing: border-box; }
body { margin: 0; background: #f5f6f8; }
```

- [ ] **Step 8: Create `frontend/src/main.tsx`**

```tsx
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import App from "./App.js";
import "./index.css";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
```

- [ ] **Step 9: Install dependencies**

Run: `cd frontend && npm install`
Expected: dependencies install cleanly.

- [ ] **Step 10: Commit**

```bash
git add frontend/package.json frontend/tsconfig.json frontend/vite.config.ts frontend/index.html frontend/.env.example frontend/src/main.tsx frontend/src/index.css frontend/src/types.ts frontend/package-lock.json
git commit -m "chore: scaffold frontend project"
```

---

## Task 15: API client

**Files:**
- Create: `frontend/src/api.ts`

- [ ] **Step 1: Create `frontend/src/api.ts`**

```ts
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
```

- [ ] **Step 2: Commit**

```bash
git add frontend/src/api.ts
git commit -m "feat: add frontend API client"
```

---

## Task 16: Presentational components

**Files:**
- Create: `frontend/src/components/UploadDropzone.tsx`, `frontend/src/components/ProcessingState.tsx`, `frontend/src/components/ResultCard.tsx`, `frontend/src/components/Gallery.tsx`

- [ ] **Step 1: Create `frontend/src/components/UploadDropzone.tsx`**

```tsx
import { useRef, useState } from "react";

interface Props {
  onFileSelected: (file: File) => void;
  disabled: boolean;
}

const ACCEPT = "image/png,image/jpeg,image/webp";

export function UploadDropzone({ onFileSelected, disabled }: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragOver, setDragOver] = useState(false);

  function handleFiles(files: FileList | null) {
    if (files && files.length > 0) onFileSelected(files[0]);
  }

  return (
    <div
      role="button"
      tabIndex={0}
      aria-label="Upload an image"
      onClick={() => !disabled && inputRef.current?.click()}
      onKeyDown={(e) => {
        if (!disabled && (e.key === "Enter" || e.key === " ")) inputRef.current?.click();
      }}
      onDragOver={(e) => {
        e.preventDefault();
        if (!disabled) setDragOver(true);
      }}
      onDragLeave={() => setDragOver(false)}
      onDrop={(e) => {
        e.preventDefault();
        setDragOver(false);
        if (!disabled) handleFiles(e.dataTransfer.files);
      }}
      style={{
        border: `2px dashed ${dragOver ? "#3b82f6" : "#c4c8cf"}`,
        borderRadius: 12,
        padding: "2.5rem",
        textAlign: "center",
        background: dragOver ? "#eef4ff" : "#fff",
        cursor: disabled ? "not-allowed" : "pointer",
        opacity: disabled ? 0.6 : 1,
      }}
    >
      <p style={{ margin: 0, fontWeight: 600 }}>Drop an image here or click to upload</p>
      <p style={{ margin: "0.5rem 0 0", color: "#6b7280", fontSize: 14 }}>
        PNG, JPEG, or WEBP · max 10 MB
      </p>
      <input
        ref={inputRef}
        type="file"
        accept={ACCEPT}
        hidden
        onChange={(e) => handleFiles(e.target.files)}
      />
    </div>
  );
}
```

- [ ] **Step 2: Create `frontend/src/components/ProcessingState.tsx`**

```tsx
export function ProcessingState() {
  return (
    <div
      role="status"
      aria-live="polite"
      style={{ display: "flex", alignItems: "center", gap: 12, padding: "1rem 0" }}
    >
      <span
        style={{
          width: 18,
          height: 18,
          border: "3px solid #c4c8cf",
          borderTopColor: "#3b82f6",
          borderRadius: "50%",
          animation: "spin 0.8s linear infinite",
          display: "inline-block",
        }}
      />
      <span>Removing background and flipping…</span>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
```

- [ ] **Step 3: Create `frontend/src/components/ResultCard.tsx`**

```tsx
import { useState } from "react";
import type { ProcessedImage } from "../types.js";

interface Props {
  image: ProcessedImage;
}

export function ResultCard({ image }: Props) {
  const [copied, setCopied] = useState(false);

  async function copy() {
    await navigator.clipboard.writeText(image.url);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }

  return (
    <div style={{ background: "#fff", borderRadius: 12, padding: "1rem", marginTop: "1rem" }}>
      <h2 style={{ marginTop: 0, fontSize: 18 }}>Result</h2>
      <img
        src={image.url}
        alt="Processed result"
        style={{ maxWidth: "100%", borderRadius: 8, background: "#eef0f3" }}
      />
      <div style={{ display: "flex", gap: 8, marginTop: 12 }}>
        <input
          readOnly
          value={image.url}
          aria-label="Image URL"
          style={{ flex: 1, padding: 8, borderRadius: 6, border: "1px solid #d1d5db" }}
        />
        <button onClick={copy} style={{ padding: "8px 14px", borderRadius: 6, cursor: "pointer" }}>
          {copied ? "Copied!" : "Copy URL"}
        </button>
      </div>
    </div>
  );
}
```

- [ ] **Step 4: Create `frontend/src/components/Gallery.tsx`**

```tsx
import type { ProcessedImage } from "../types.js";

interface Props {
  images: ProcessedImage[];
  onDelete: (id: string) => void;
  deletingId: string | null;
}

export function Gallery({ images, onDelete, deletingId }: Props) {
  if (images.length === 0) {
    return <p style={{ color: "#6b7280" }}>No images yet. Upload one to get started.</p>;
  }

  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fill, minmax(160px, 1fr))",
        gap: 12,
      }}
    >
      {images.map((img) => (
        <div key={img.id} style={{ background: "#fff", borderRadius: 10, padding: 8 }}>
          <img
            src={img.url}
            alt="Hosted result"
            style={{ width: "100%", height: 120, objectFit: "contain", background: "#eef0f3", borderRadius: 6 }}
          />
          <button
            onClick={() => onDelete(img.id)}
            disabled={deletingId === img.id}
            style={{ marginTop: 8, width: "100%", padding: 6, borderRadius: 6, cursor: "pointer" }}
          >
            {deletingId === img.id ? "Deleting…" : "Delete"}
          </button>
        </div>
      ))}
    </div>
  );
}
```

- [ ] **Step 5: Commit**

```bash
git add frontend/src/components/
git commit -m "feat: add frontend presentational components"
```

---

## Task 17: App container

**Files:**
- Create: `frontend/src/App.tsx`

- [ ] **Step 1: Create `frontend/src/App.tsx`**

```tsx
import { useEffect, useState } from "react";
import * as api from "./api.js";
import type { ProcessedImage } from "./types.js";
import { UploadDropzone } from "./components/UploadDropzone.js";
import { ProcessingState } from "./components/ProcessingState.js";
import { ResultCard } from "./components/ResultCard.js";
import { Gallery } from "./components/Gallery.js";

export default function App() {
  const [images, setImages] = useState<ProcessedImage[]>([]);
  const [latest, setLatest] = useState<ProcessedImage | null>(null);
  const [processing, setProcessing] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function refresh() {
    try {
      setImages(await api.listImages());
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load images.");
    }
  }

  useEffect(() => {
    void refresh();
  }, []);

  async function handleUpload(file: File) {
    setError(null);
    setLatest(null);
    setProcessing(true);
    try {
      const result = await api.uploadImage(file);
      setLatest(result);
      await refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Upload failed.");
    } finally {
      setProcessing(false);
    }
  }

  async function handleDelete(id: string) {
    setError(null);
    setDeletingId(id);
    try {
      await api.deleteImage(id);
      if (latest?.id === id) setLatest(null);
      await refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Delete failed.");
    } finally {
      setDeletingId(null);
    }
  }

  return (
    <main style={{ maxWidth: 760, margin: "0 auto", padding: "2rem 1rem" }}>
      <h1 style={{ fontSize: 28 }}>Image Transformer</h1>
      <p style={{ color: "#6b7280", marginTop: -8 }}>
        Upload an image — we remove the background and flip it horizontally.
      </p>

      <UploadDropzone onFileSelected={handleUpload} disabled={processing} />

      {processing && <ProcessingState />}

      {error && (
        <div role="alert" style={{ color: "#b91c1c", marginTop: 12 }}>
          {error}
        </div>
      )}

      {latest && <ResultCard image={latest} />}

      <h2 style={{ fontSize: 20, marginTop: "2rem" }}>Your images</h2>
      <Gallery images={images} onDelete={handleDelete} deletingId={deletingId} />
    </main>
  );
}
```

- [ ] **Step 2: Verify the build compiles**

Run: `cd frontend && npm run build`
Expected: `tsc` + `vite build` succeed; `dist/` produced.

- [ ] **Step 3: Commit**

```bash
git add frontend/src/App.tsx
git commit -m "feat: add App container wiring upload, result, and gallery"
```

---

## Task 18: Frontend happy-path test

**Files:**
- Create: `frontend/tests/setup.ts`, `frontend/tests/App.test.tsx`

- [ ] **Step 1: Create `frontend/tests/setup.ts`**

```ts
import "@testing-library/jest-dom";
```

- [ ] **Step 2: Write the failing test**

Mocks the `api` module so no network is hit. Verifies: initial list renders, uploading shows processing then the result, and the gallery refreshes.

```tsx
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";

vi.mock("../src/api.js", () => ({
  listImages: vi.fn(),
  uploadImage: vi.fn(),
  deleteImage: vi.fn(),
}));

import App from "../src/App.js";
import * as api from "../src/api.js";

const listImages = api.listImages as ReturnType<typeof vi.fn>;
const uploadImage = api.uploadImage as ReturnType<typeof vi.fn>;

describe("App", () => {
  beforeEach(() => {
    listImages.mockReset();
    uploadImage.mockReset();
  });

  it("uploads a file, shows the result, and refreshes the gallery", async () => {
    listImages
      .mockResolvedValueOnce([]) // initial load
      .mockResolvedValueOnce([
        { id: "image-transform/abc", url: "https://x/abc.png", createdAt: "2026-06-06T00:00:00Z" },
      ]); // after upload
    uploadImage.mockResolvedValue({
      id: "image-transform/abc",
      url: "https://x/abc.png",
      createdAt: "2026-06-06T00:00:00Z",
    });

    render(<App />);

    await screen.findByText("No images yet. Upload one to get started.");

    const file = new File(["x"], "photo.png", { type: "image/png" });
    const input = document.querySelector('input[type="file"]') as HTMLInputElement;
    fireEvent.change(input, { target: { files: [file] } });

    await waitFor(() => expect(uploadImage).toHaveBeenCalledWith(file));
    expect(await screen.findByText("Result")).toBeInTheDocument();
    await waitFor(() =>
      expect(screen.getAllByRole("img").some((img) => img.getAttribute("src") === "https://x/abc.png")).toBe(true),
    );
  });
});
```

- [ ] **Step 3: Run test to verify it fails (then passes)**

Run: `cd frontend && npx vitest run tests/App.test.tsx`
Expected: With `App.tsx` already implemented (Task 17), this should PASS. If it fails, fix wiring until green.

- [ ] **Step 4: Commit**

```bash
git add frontend/tests/setup.ts frontend/tests/App.test.tsx
git commit -m "test: add frontend upload happy-path test"
```

---

## Task 19: README and deployment notes

**Files:**
- Create: `README.md`

- [ ] **Step 1: Create `README.md`**

````markdown
# Image Transformation Service

Upload an image → background removed (remove.bg) → flipped horizontally (sharp) →
hosted on Cloudinary with a unique URL. List and delete hosted images.

## Stack
- **Backend:** Express + TypeScript (`backend/`)
- **Frontend:** React + Vite + TypeScript (`frontend/`)
- **Background removal:** remove.bg API
- **Hosting:** Cloudinary (source of truth — no database)

## Prerequisites
- Node 18+
- A free [remove.bg](https://www.remove.bg/api) API key
- A free [Cloudinary](https://cloudinary.com/) account (cloud name, API key, API secret)

## Local setup

### Backend
```bash
cd backend
cp .env.example .env   # fill in REMOVE_BG_API_KEY and CLOUDINARY_* values
npm install
npm run dev            # http://localhost:4000
```

### Frontend
```bash
cd frontend
cp .env.example .env   # VITE_API_BASE_URL=http://localhost:4000
npm install
npm run dev            # http://localhost:5173
```

## Tests
```bash
cd backend && npm test
cd frontend && npm test
```

## API
| Method | Path | Description |
|---|---|---|
| `POST` | `/api/images` | multipart `image` field → `{ id, url, createdAt }` |
| `GET` | `/api/images` | list hosted images |
| `DELETE` | `/api/images/:id` | delete by Cloudinary public_id |
| `GET` | `/api/health` | health check |

## Deployment
- **Backend (Render web service):** build `npm ci && npm run build`, start `node dist/index.js`.
  Set env vars: `PORT`, `FRONTEND_ORIGIN`, `REMOVE_BG_API_KEY`, `CLOUDINARY_CLOUD_NAME`,
  `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET`.
- **Frontend (Render static site / Netlify):** build `npm ci && npm run build`, publish `dist/`.
  Set `VITE_API_BASE_URL` to the deployed backend URL.

## Live URLs
- Frontend: _add after deploy_
- Backend: _add after deploy_
````

- [ ] **Step 2: Commit**

```bash
git add README.md
git commit -m "docs: add README with setup, API, and deployment notes"
```

---

## Task 20: Full verification

- [ ] **Step 1: Run the complete backend suite**

Run: `cd backend && npm test`
Expected: PASS — `imageTransform`, `backgroundRemoval`, `storage`, `images.routes` all green.

- [ ] **Step 2: Run the frontend suite**

Run: `cd frontend && npm test`
Expected: PASS — `App.test.tsx` green.

- [ ] **Step 3: Confirm both builds compile**

Run: `cd backend && npm run build && cd ../frontend && npm run build`
Expected: both succeed with no type errors.

- [ ] **Step 4: Manual smoke test (requires real .env keys)**

Start backend (`npm run dev`) and frontend (`npm run dev`), upload a real photo, confirm: processing indicator shows, result image appears with a copyable Cloudinary URL, the gallery lists it, and deleting removes it. Confirm the bg is removed and the image is mirrored.

---

## Notes for the implementer

- **ESM + `.js` import specifiers:** both projects use `"type": "module"`. In TypeScript with `Bundler`/`ESNext` resolution, relative imports use `.js` extensions even though the source is `.ts`/`.tsx` (e.g. `import { foo } from "./bar.js"`). Keep this consistent — it's already reflected in every code block above.
- **`vi.mock` hoisting:** Vitest hoists `vi.mock` calls above imports, so the mock declarations appear before the `import` of the module under test in each test file. Keep that ordering.
- **remove.bg free tier:** 50 calls/month. During manual testing, reuse results where possible to conserve credits.
- **Express 4 vs 5:** `package.json` pins Express `^4` so the `:id(*)` wildcard route syntax works as written. Do not upgrade to Express 5 without updating the route param syntax.
