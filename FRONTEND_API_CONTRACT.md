# Frontend API contract

Base URL: `http://localhost:8000/api/v1` (dev). Production: your API origin.

## Auth

1. `POST /users/register` (multipart) then `POST /users/login`.
2. Store `accessToken` and `refreshToken` from login `data` **or** rely on httpOnly cookies (`accessToken`, `refreshToken`).
3. Send `Authorization: Bearer <accessToken>` on mutating routes and private reads. Public reads: `GET /videos`, `GET /videos/:id`, `GET /users/c/:username`, `GET /comments/:videoId`, `GET /tweets/user/:userId`.
4. Cookies: `credentials: 'include'` on `fetch`/`axios`. CORS origin must match `CORS_ORIGIN`.
5. On 401, call `POST /users/refresh-token` with cookie or `{ refreshToken }`, then retry once.
6. Logout: `POST /users/logout`. Access JWTs may live until expiry; refresh is invalidated. Password change invalidates access JWTs immediately.

Dev cookies: `Secure=false`, `SameSite=lax`.  
Prod: set `COOKIE_SECURE=true`, `COOKIE_SAMESITE=none` only if the frontend is on another site over HTTPS.

There is **one role**: authenticated user. No admin. Mutations require **resource ownership** (403 otherwise).

Published video **reads** (list, watch, channel profile, comment list, tweet list) are public. Mutations and private resources (history, dashboard, likes, subscriptions, playlists) still require a JWT.

## Response shape

Success:

```json
{ "statusCode": 200, "data": {}, "message": "...", "success": true }
```

Error:

```json
{
  "statusCode": 400,
  "data": null,
  "message": "human text",
  "success": false,
  "errors": [],
  "errorCode": "VALIDATION_ERROR",
  "requestId": "uuid"
}
```

Echo `X-Request-ID` from responses when reporting bugs.

`errorCode` values: `VALIDATION_ERROR`, `UNAUTHORIZED`, `FORBIDDEN`, `NOT_FOUND`, `CONFLICT`, `RATE_LIMITED`, `UPSTREAM_ERROR`, `INTERNAL_ERROR`.

## Pagination

Query: `page` (default 1), `limit` (default 10, max 50).

List `data` (videos, comments, tweets, liked videos, dashboard videos):

```json
{
  "results": [],
  "page": 1,
  "limit": 10,
  "total": 0,
  "totalPages": 0,
  "hasNextPage": false,
  "hasPreviousPage": false
}
```

Watch history (`GET /users/History`) still returns an **array** (capped at 50, newest first).

## Uploads

- Images: jpeg/png/webp/gif, size `MAX_IMAGE_SIZE_MB` (default 5).
- Videos: mp4/webm/quicktime, size `MAX_VIDEO_SIZE_MB` (default 100).
- Register: fields `fullname`, `email`, `username`, `password` (≥8), file `avatar` required, `coverImage` optional.
- Publish video: files `videoFile` + `thumbnail`, fields `title`, `description`.

## Resources (see API.md)

Users, videos, comments, likes, subscriptions, tweets, playlists, dashboard, health.

Unpublished videos: 404 for non-owners.  
Playlists: any logged-in user with the id can read; unpublished videos stripped for non-owners.

## CORS

Allowlist from `CORS_ORIGIN` (comma-separated). Never `*` with cookies.

## Rate limits (skipped in tests)

Configurable via env. 429 body uses the same error JSON. Auth and uploads are stricter than general API.
