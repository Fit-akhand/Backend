# PHASE 4 REPORT — Production frontend foundation

## Status

**PHASE 4 STATUS: COMPLETE** (foundation delivered)  
**Live end-to-end API session against a running server: BLOCKED** (MongoDB Atlas SRV)

## Frontend stack

| Piece | Choice |
| --- | --- |
| UI | React 19 |
| Bundler | Vite 8 |
| Language | TypeScript |
| Routing | React Router 7 |
| Styles | Tailwind CSS 4 + CSS variables |
| HTTP | Axios (`withCredentials`) |
| Server state | TanStack Query |
| Client auth state | Zustand |
| Forms | React Hook Form + Zod |
| Icons | Lucide React |
| Tests | Vitest + Testing Library + jsdom |

## Architecture

Layering: **page → feature hook / auth store → `services/api` → Axios client → Express `/api/v1`**.

- Tokens: in-memory only (`tokenMemory`), plus httpOnly cookies from the API.
- Auth statuses: `loading` | `authenticated` | `unauthenticated`.
- Bootstrap calls `GET /users/current_user` before routes render.
- Home: landing when guest; authenticated shell + video feed (`GET /videos`) when signed in.
- Later product areas: route placeholders only (no fake APIs).

See `FRONTEND_ARCHITECTURE.md`.

## Folder structure (key)

```
frontend/src/
  app/router, providers, config
  components/ui, layout, video, common
  features/videos
  pages/auth, home, settings, ComingSoon, NotFound
  services/api/{client,auth,videos}
  store/authStore
  lib/{apiError,tokenMemory,theme}
  types/api.ts
```

## Routes

| Route | Behavior |
| --- | --- |
| `/` | Landing or authenticated home |
| `/login`, `/register` | Guest; real auth APIs |
| `/watch/:videoId`, `/channel/:userId`, `/playlist/:playlistId`, `/history`, `/subscriptions`, `/playlists`, `/dashboard` | Protected placeholders |
| `/settings` | Protected; live current-user display |
| `*` | 404 |

## Authentication

Aligned with `FRONTEND_API_CONTRACT.md`:

- Register: `POST /users/register` (multipart + avatar) then login
- Login: `POST /users/login`
- Session: `GET /users/current_user`
- Refresh: `POST /users/refresh-token` on 401 (retry once)
- Logout: `POST /users/logout`

## API client

Central Axios instance: base URL from `VITE_API_BASE_URL`, JSON/FormData, Bearer + cookies, `X-Request-ID`, 20s timeout, `AppApiError` normalization.

## State management

- Auth: Zustand only
- Lists/detail: TanStack Query
- Theme preference: `localStorage` key `ak-tube-theme` (not tokens)

## UI system

Button, Input, Textarea, Select, Modal, ConfirmDialog, Dropdown, Avatar, Badge, Card, Skeleton, Spinner, Toast, Tabs, Pagination, EmptyState, ErrorState + AppShell (desktop sidebar + mobile bottom nav) + light/dark tokens.

## Responsive design

Header search on all widths; collapsible sidebar; bottom nav on small screens; video grid responsive.

## Security

No secrets in SPA; tokens not in `localStorage`; credentials included for cookies; route guards are UX only; avatar MIME/size checked client-side before upload; errors sanitized for display.

## Tests

`frontend`: **11/11** Vitest tests (guards, login, register, logout, bootstrap, error copy).  
API helpers mocked in unit tests — not a fake production backend.

## Build

| Check | Result |
| --- | --- |
| `npm run lint` | PASS (0 warnings after Toast split) |
| `npm run typecheck` | PASS |
| `npm test` | PASS (11) |
| `npm run build` | PASS |

## Backend compatibility

| Check | Result |
| --- | --- |
| `npm test` (root) | **42/42 PASS** |
| Live `npm start` | **BLOCKED** — `querySrv ECONNREFUSED _mongodb._tcp.cluster0.dhoranm.mongodb.net` |

One backend fix required for the entrypoint: `src/index.js` imported `../config/env.js` (missing) instead of `./config/env.js`. Tests import `app.js` and were unaffected; this unblocks process boot once Atlas/network is available.

## Real API integration matrix

| Concern | Status |
| --- | --- |
| Endpoints match contract | **IMPLEMENTED** |
| Login/register/logout/current-user wired to real paths | **IMPLEMENTED** |
| Unit tests of auth wiring | **VERIFIED** |
| Live healthcheck / login against running API + Mongo | **BLOCKED** (Atlas SRV refused) |
| Full browser auth flow (STEP 23) | **NOT VERIFIED** (depends on live API) |

## Files created/changed (high level)

**Created / expanded**

- `frontend/` app (router, pages, providers, tests, vitest config)
- `FRONTEND_ARCHITECTURE.md`
- `PHASE_4_REPORT.md`
- Root `README.md` rewrite
- CI frontend job in `.github/workflows/ci.yml`

**Changed**

- `src/index.js` env import path (boot fix)
- Frontend package scripts: `typecheck`, `test`

## Known limitations

1. MongoDB Atlas unreachable from this environment → no live cookie/session E2E.
2. Register requires Cloudinary for avatars; live Cloudinary still **NOT VERIFIED** (Phase 3).
3. Video watch, comments, likes, playlists, tweets, dashboard analytics, history UIs are placeholders.
4. Almost all domain GETs require JWT (by design) — guests see landing, not the catalog.
5. Vitest uses a merged Vite config; setup injects `React` for JSX under Vitest + Vite 8.

## NOT implemented (by design — Phase 5+)

Full upload UI, comments, likes, subscriptions UI, tweets, playlists CRUD UI, dashboard analytics, watch history page, advanced search.

## Next recommended phase

**PHASE 5 — Core frontend features and real REST API integration** (watch, feed polish, upload, comments, likes, subscriptions) once a reachable MongoDB is available for live verification.
