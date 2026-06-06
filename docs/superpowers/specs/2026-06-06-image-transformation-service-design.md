# Image Transformation Service — Design

**Date:** 2026-06-06
**Status:** Approved
**Source:** Uplane Take-Home Engineering Challenge (`Uplane.pdf`)

## Objective

A full-stack application where a user uploads a single image, the backend removes
its background (via a third-party service) and flips it horizontally, hosts the
result online, returns a unique URL, and lets the user delete hosted images.

## Requirements (from the assignment)

1. **Image Upload** — frontend lets a user upload a single image file.
2. **Image Processing** — backend removes the background (third-party service, free
   tier) then horizontally flips the image.
3. **Image Hosting & Retrieval** — processed image is hosted online; user receives a
   unique URL to access it.
4. **Image Deletion** — user can delete their hosted images.

**Technical constraints:**
- Backend must be TypeScript.
- App (frontend + backend) must be deployed live with a public URL.
- Source code on GitHub.
- Evaluated on: UX/design with clear feedback (loading states), clean API structure
  and error handling, efficient process management across the third-party call /
  flip / storage, code quality (types, modularity, secure secret + upload handling).

## Stack

| Concern | Choice | Rationale |
|---|---|---|
| Backend | Node + Express + TypeScript | Standard, readable; clean route/service separation |
| Frontend | React + Vite + TypeScript | Default modern SPA tooling; fast |
| Background removal | remove.bg API | 50 free calls/mo; canonical third-party bg-removal service |
| Horizontal flip | sharp | Native, fast; `.flop()` mirrors horizontally |
| Hosting / storage | Cloudinary | Free tier; returns hosted unique URL; simple delete-by-id |
| Deployment | Render (backend) + Render static / Netlify (frontend) | Free, no credit card to start; easy secret management |

**No database.** Cloudinary is the source of truth — its `secure_url` is the unique
URL, deletion is `destroy(public_id)`, and the gallery is a listing of a Cloudinary
folder. This keeps the backend stateless and is fully compliant with requirements 3
and 4. (A DB could be added later for richer metadata, but is not needed — YAGNI.)

**Scope:** Single-file upload only, matching the assignment's "upload a single image
file." The gallery accumulates multiple images across repeated single uploads.
Batch/multi-select upload is explicitly out of scope.

## Architecture

Monorepo with two clearly separated apps:

```
image_transformation/
  backend/    # Express + TypeScript REST API
  frontend/   # React + Vite + TypeScript SPA
  docs/
```

The frontend is a static SPA that calls the backend over REST. The backend is
stateless; Cloudinary holds all state.

### Backend structure

```
backend/src/
  index.ts                      # server bootstrap (port, listen)
  app.ts                        # express app + middleware wiring + routes
  config.ts                     # zod-validated env; fails fast on missing keys
  routes/images.routes.ts       # endpoint definitions
  controllers/images.controller.ts
  services/
    backgroundRemoval.ts        # remove.bg client (buffer in -> transparent PNG buffer out)
    imageTransform.ts           # sharp horizontal flip (buffer in -> PNG buffer out)
    storage.ts                  # cloudinary upload / list / delete
  middleware/
    upload.ts                   # multer memory storage; size + mime validation
    errorHandler.ts             # central JSON error formatter
  types/                        # shared interfaces (ProcessedImage, etc.)
  utils/                        # helpers (e.g. AppError)
```

Each service has a single responsibility and a narrow interface, so providers can be
mocked in tests and swapped without touching callers.

### API endpoints

| Method | Path | Purpose | Success response |
|---|---|---|---|
| `POST` | `/api/images` | Upload → remove bg → flip → host | `201 { id, url, createdAt }` |
| `GET` | `/api/images` | List hosted images (Cloudinary folder) | `200 [{ id, url, createdAt }]` |
| `DELETE` | `/api/images/:id` | Delete from Cloudinary by id | `204` (no body) |
| `GET` | `/api/health` | Liveness check | `200 { status: "ok" }` |

`id` is the Cloudinary `public_id`. `url` is the Cloudinary `secure_url`.
`createdAt` is the Cloudinary resource creation timestamp (ISO 8601).

Note: `public_id` may contain `/` (folder prefix). The delete route captures the
full id (e.g. wildcard / `*` param) so folder-qualified ids round-trip correctly.

## Data flow — upload pipeline

1. Frontend sends `POST /api/images` as `multipart/form-data` with a single file
   field (`image`).
2. **upload middleware (multer, memory storage)** parses the file to a buffer;
   rejects non-`image/(png|jpeg|webp)` types and files over 10 MB → `400`.
3. **backgroundRemoval** POSTs the buffer to remove.bg; receives a transparent PNG
   buffer. Explicit request timeout.
4. **imageTransform** runs `sharp(buffer).flop().png().toBuffer()` to flip
   horizontally.
5. **storage** uploads the resulting buffer to Cloudinary (folder
   `image-transform`, `resource_type: image`); receives `{ public_id, secure_url,
   created_at }`.
6. Controller responds `201 { id: public_id, url: secure_url, createdAt: created_at }`.

The controller orchestrates the three services sequentially; each service is unaware
of the others.

## Error handling

- **Validation** (bad type/size, missing file) → `400 { error: { message, code } }`.
- **remove.bg** quota/`402`/`429` → `502` with a clear "background removal currently
  unavailable" message; other upstream failures → `502`.
- **Cloudinary** failures → `502`.
- **Timeouts** on both external calls, surfaced as `502`.
- A single `errorHandler` middleware catches all errors (via an `AppError` type
  carrying `statusCode` + `code`) and emits the consistent JSON shape
  `{ error: { message, code } }`. Unexpected errors → `500` with a generic message
  (no internal details leaked).

## Secrets & security

- Env vars, loaded and validated in `config.ts` via zod (fail fast at boot):
  `REMOVE_BG_API_KEY`, `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`,
  `CLOUDINARY_API_SECRET`, `PORT`, `FRONTEND_ORIGIN`.
- Secrets never leave the backend / are never sent to the client.
- `.env.example` is committed; `.env` is gitignored.
- **CORS** restricted to `FRONTEND_ORIGIN`.
- File **size (10 MB) and mime-type** limits enforced server-side.

## Frontend (single page)

Components:
- **UploadDropzone** — drag-drop + file picker; client-side type/size hint before
  sending.
- **ProcessingState** — clear loading indicator while the backend runs the pipeline
  (the pipeline takes a few seconds; feedback is explicitly evaluated).
- **ResultCard** — the hosted image preview + the unique URL with a copy button.
- **Gallery** — lists existing hosted images (from `GET /api/images`), each with a
  delete button; refetches on delete.
- **App** — composition + top-level loading/error state.
- **api.ts** — thin REST client; `VITE_API_BASE_URL` configures the backend origin.

Every async action shows loading and surfaces errors to the user.

## Testing

- **Backend (vitest + supertest):**
  - Unit-test `imageTransform`: flip a known fixture and assert the output is the
    horizontal mirror (compare against a pre-flipped fixture or check edge pixels).
  - Unit-test `backgroundRemoval` and `storage` with the HTTP/Cloudinary clients
    **mocked** (success + failure paths).
  - Route integration tests for all four endpoints with providers mocked
    (happy path + validation `400` + upstream `502`).
- **Frontend (Vitest + Testing Library):** one happy-path test of the upload flow
  against a mocked API. Kept intentionally light.

## Deployment

- **Backend** → Render web service. Build `npm ci && npm run build` (tsc → `dist/`),
  start `node dist/index.js`. Secrets set as dashboard env vars.
- **Frontend** → Render static site (or Netlify). Build `npm ci && npm run build`
  (`vite build` → `dist/`), publish `dist/`. `VITE_API_BASE_URL` set to the deployed
  backend URL.
- Root `README.md` documents local setup, env vars, and the live URLs.

## Out of scope

- Batch / multi-file upload.
- User accounts / auth (no per-user ownership; gallery reflects the shared
  Cloudinary folder).
- Database / persistent metadata beyond what Cloudinary stores.
- Image editing beyond background removal + horizontal flip.
