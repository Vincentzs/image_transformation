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
- Frontend: https://image-transformation-frontend.onrender.com
- Backend: https://image-transformation-backend.onrender.com

> Hosted on Render's free tier — the backend spins down after ~15 min idle, so the
> first request after a pause may take ~50 s to cold-start.
