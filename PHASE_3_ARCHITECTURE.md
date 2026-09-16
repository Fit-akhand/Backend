# PHASE 3 ARCHITECTURE

## Request path (current, post–Phase 2)

```
HTTP request
  → Express (JSON/urlencoded/static/cookie/CORS)
  → Router (`/api/v1/...`)
  → verifyJWT (except healthcheck, register, login, refresh)
  → Multer (upload routes only)
  → Controller (validation + business logic + Mongoose)
  → MongoDB / Cloudinary
  → ApiResponse JSON
  → errorHandler (if thrown)
```

There is **no separate service layer**. Controllers own HTTP + domain rules. That is acceptable for this size; Phase 3 adds shared middleware/utilities rather than a new framework.

## Responsibility mix (kept vs split)

| Mixed today | Phase 3 action |
| ----------- | -------------- |
| Controllers validate + query DB | Keep; shared `http.js` helpers |
| `app.js` reads `process.env` at import | **Move** to `src/config/env.js` |
| `console.log` in index/db | **Replace** with structured logger |
| Raw refresh JWT stored on User | **Hash** at rest (API still returns JWT) |
| Multer trusts originalname/mimetype | **Restrict** type/size/filename |
| No request correlation | **Add** `X-Request-ID` |
| Healthcheck = liveness only | **Add** `/ready` without breaking healthcheck |
| No rate limits / security headers | **Add** helmet + rate limit |
| Query `$` operators possible | **Sanitize** body/query/params |

## Target path

```
Request
  → trust proxy (optional)
  → request ID
  → helmet
  → CORS (allowlist)
  → body parsers (bounded)
  → cookie parser
  → mongo operator sanitize
  → request log
  → rate limit (auth vs general vs upload)
  → route
  → JWT / ownership
  → file filter (uploads)
  → controller
  → Mongoose (indexed, unique where needed) / Cloudinary
  → ApiResponse
  → errorHandler (errorCode + requestId, no prod stack)
```

## Auth model (unchanged contract)

- Access JWT (short-lived) in cookie or `Authorization: Bearer`
- Refresh JWT in cookie or body; **hash stored** on `User.refreshToken`
- Single persisted refresh token (one active refresh session per user)
- Password change sets `passwordChangedAt` → existing access JWTs rejected
- No RBAC/admin; owner checks on mutations
- Almost all domain reads require authentication (existing routers)

## Data stores

- MongoDB `ak_tube` (app) / memory server (tests)
- Embedded `User.watchHistory` (capped on read; future: collection)
- Cloudinary for media (`NODE_ENV=test` stub)

## Why we are not rewriting

Express + Mongoose + JWT + fat controllers already match the product. Phase 3 hardens the edges (config, auth storage, HTTP, uploads, observability, CI) instead of introducing Nest/Prisma/Redis.
