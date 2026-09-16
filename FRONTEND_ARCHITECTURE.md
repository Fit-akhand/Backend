# Vidzora frontend architecture

## Stack

- React 19 + Vite 8 + TypeScript
- React Router 7
- Tailwind CSS 4 (design tokens in `src/index.css`)
- Axios API client (`src/services/api/client.ts`)
- TanStack Query for server state
- Zustand for **auth session only**
- React Hook Form + Zod for login/register
- Lucide icons
- Vitest + Testing Library

Product name: **Vidzora — Watch. Create. Connect.**  
The UI talks only to the existing Express API at `VITE_API_BASE_URL` (default `http://localhost:8000/api/v1`). Endpoints match `API.md`, `openapi.yaml`, and `FRONTEND_API_CONTRACT.md`.

## Folder structure

```
frontend/src/
  app/           router, providers, env, query client
  brand/         VidzoraLogo
  components/    ui, layout, video, comment, common
  features/      videos, likes, comments, subscriptions, playlists, history, account
  pages/         auth, home, videos, channel, studio, playlists, history, subscriptions, settings
  services/api/  auth, videos, likes, comments, subscriptions, channels, dashboard, playlists
  hooks/         bootstrap, useAuth, debounce
  lib/           tokens, errors, theme, format
  store/         authStore
  types/         API types
```

Phase 6 implements creator studio, upload, video management, playlists, history, subscriptions feed, and account/channel edits.

## Routing

| Path | Access | Notes |
| --- | --- | --- |
| `/` | Public landing or authenticated home | `HomeGate` |
| `/login`, `/register` | Guest only | Real login/register |
| `/watch/:videoId` | Authenticated | Watch + save to playlist |
| `/channel/:username` | Authenticated | Profile + videos; owner sees Edit/Studio |
| `/playlist/:playlistId` | Authenticated | `GET /playlist/:id` |
| `/history` | Authenticated | `GET /users/History` (read-only) |
| `/subscriptions` | Authenticated | Channels + composed video list |
| `/playlists` | Authenticated | `GET /playlist/user/:userId` |
| `/dashboard` | Authenticated | Studio stats |
| `/studio/upload` | Authenticated | `POST /videos` |
| `/studio/videos` | Authenticated | Dashboard video list + mutations |
| `/settings` | Authenticated | Account, avatar, cover, password |
| `*` | Public | 404 |

`ProtectedRoute` / `GuestRoute` are UX only. The API still requires JWT/cookies.

## Authentication

Unchanged from Phase 5: cookies + in-memory Bearer, refresh-on-401, no `localStorage` tokens.

Register is multipart then login.

## API client

- JSON + FormData (do not set multipart `Content-Type` manually)
- Default timeout 20s; video/image uploads use longer per-request timeouts
- Errors mapped to `AppApiError`

Pattern: page → feature hook / store → `services/api` → client.

## State management

- **Server:** TanStack Query. Video mutations invalidate `videos`, `dashboard`, `channel`, `history`, `subscriptions`, `playlists`.
- **Auth:** Zustand `authStore` (`setUser` after profile updates).
- **Theme:** `html.dark` + `localStorage` key `vidzora-theme` (reads legacy `ak-tube-theme`).

## Brand

`VidzoraLogo` variants: `full`, `compact`, `icon`. Favicon: `public/favicon.svg`.

## Security

- No API secrets in the SPA.
- Tokens not in `localStorage`.
- Do not trust route guards.
- Client-side type/size checks before upload.
- User content rendered as text.
- CORS: `http://localhost:3000`.

## Tests

`npm test` (Vitest). API calls mocked. Live Atlas checks are manual.

## Scripts

```
npm run dev          # Vite :3000
npm run lint
npm run typecheck
npm test
npm run build
```
