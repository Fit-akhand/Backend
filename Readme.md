# Vidzora

Watch. Create. Connect.

YouTube-style platform: Express REST API (`/api/v1`) plus a React SPA. The working directory may still be named `backend`; the product name is **Vidzora**.

## Architecture overview

```
Browser (Vite :3000)
  → Axios client (cookies + Bearer)
  → Express 5 (`/api/v1`)
  → MongoDB + Cloudinary (uploads)
```

The backend is the source of truth. Frontend types and calls follow `API.md`, `openapi.yaml`, and `FRONTEND_API_CONTRACT.md`.

Docs:

- Backend: `API.md`, `FRONTEND_API_CONTRACT.md`, `PHASE_3_REPORT.md`
- Frontend: `FRONTEND_ARCHITECTURE.md`, `PHASE_4_REPORT.md`–`PHASE_6_REPORT.md`

## Backend setup

1. Copy `.env.example` to `.env` (never commit secrets).
2. Set `MONGODB_URI`, JWT secrets, Cloudinary, and `CORS_ORIGIN=http://localhost:3000`.
3. Install and run:

```bash
npm install
npm run dev
```

API base: `http://localhost:8000/api/v1`  
Health: `GET /api/v1/healthcheck`

### Backend environment (high level)

| Variable | Purpose |
| --- | --- |
| `PORT` | Default 8000 |
| `MONGODB_URI` | Mongo connection |
| `CORS_ORIGIN` | Comma-separated browser origins |
| `ACCESS_TOKEN_SECRET` / `REFRESH_TOKEN_SECRET` | JWT signing |
| `CLOUDINARY_*` | Image/video uploads |
| `COOKIE_SECURE` / `COOKIE_SAMESITE` | Cookie flags (prod HTTPS) |

### Backend commands

```bash
npm run dev
npm start
npm test          # 42 tests (MongoMemoryServer)
npm run lint
```

## Frontend setup

```bash
cd frontend
cp .env.example .env
npm install
npm run dev
```

SPA: `http://localhost:3000`

### Frontend environment

| Variable | Purpose |
| --- | --- |
| `VITE_API_BASE_URL` | API origin + prefix, e.g. `http://localhost:8000/api/v1` |

Do not put Cloudinary keys, Mongo URIs, or JWT secrets in the frontend.

### Frontend commands

```bash
npm run dev
npm run lint
npm run typecheck
npm test
npm run build
```

Auth flow: register (`multipart`) → login → `GET /users/current_user` → protected shell → logout.

Phase 6: Creator Studio, upload, video management, playlists, history, subscriptions feed, account/channel edits, Vidzora branding.
