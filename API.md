# API reference (`/api/v1`)

Auth: JWT in `Authorization: Bearer <accessToken>` or httpOnly cookie `accessToken`, unless noted.

Success: `{ statusCode, data, message, success: true }`  
Error: `{ statusCode, data: null, message, success: false, errors, errorCode, requestId }`  
Header: `X-Request-ID` (generated if missing/unsafe).

Also: `GET /api/v1/ready` (503 if Mongo is down). OpenAPI: `openapi.yaml`. Frontend: `FRONTEND_API_CONTRACT.md`.

Pagination (list endpoints): `page` (default 1), `limit` (default 10, max 50).  
`data` includes `results`, `page`, `limit`, `total`, `totalPages`, `hasNextPage`, `hasPreviousPage` unless noted.

There is **no admin role**. Mutating another user’s resource returns **403**.

## Health

| Method | Path | Auth | Notes |
| ------ | ---- | ---- | ----- |
| GET | `/healthcheck` | No | Liveness. `{ status: "OK", database: ... }` |
| GET | `/healthcheck/ready` | No | Same as `/ready` |
| GET | `/ready` | No | Readiness. 503 if DB not connected |

## Users

| Method | Path | Auth | Body / notes |
| ------ | ---- | ---- | ------------ |
| POST | `/users/register` | No | multipart: `fullname`, `email`, `username`, `password` (≥8), `avatar` required, `coverImage` optional |
| POST | `/users/login` | No | `{ email or username, password }` → user + tokens + cookies |
| POST | `/users/logout` | Yes | Clears access/refresh cookies |
| POST | `/users/refresh-token` | Refresh cookie or `{ refreshToken }` | Rotates tokens |
| POST | `/users/change_password` | Yes | `{ oldPassword, newPassword }` |
| GET | `/users/current_user` | Yes | No password/refreshToken |
| PATCH | `/users/update_account` | Yes | `{ fullname, email }` |
| PATCH | `/users/avater` | Yes | multipart `avatar` |
| PATCH | `/users/cover_image` | Yes | multipart `coverImage` |
| GET | `/users/c/:username` | Optional | Channel profile + subscriber counts. `email` only for the owner |
| GET | `/users/History` | Yes | Watch history (most recent first) |

## Videos

| Method | Path | Auth | Notes |
| ------ | ---- | ---- | ----- |
| GET | `/videos` | Optional | Query: `page`, `limit`, `query` (title/description, escaped), `sortBy` (`createdAt`\|`views`\|`title`\|`duration`), `sortType` (`asc`\|`desc`), `userId`. Unpublished hidden unless listing **own** `userId`. |
| POST | `/videos` | Yes | multipart `videoFile`, `thumbnail`, fields `title`, `description` |
| GET | `/videos/:videoId` | Optional | Increments views; writes watch history **only if authenticated**. Unpublished → 404 unless owner |
| PATCH | `/videos/:videoId` | Owner | `title`, `description`, optional `thumbnail` file |
| DELETE | `/videos/:videoId` | Owner | Also removes comments, likes, playlist refs, history refs |
| PATCH | `/videos/toggle/publish/:videoId` | Owner | Toggles `isPublished` |

## Comments

| Method | Path | Auth | Notes |
| ------ | ---- | ---- | ----- |
| GET | `/comments/:videoId` | Optional | Paginated |
| POST | `/comments/:videoId` | Yes | `{ content }` |
| PATCH | `/comments/c/:commentId` | Owner | `{ content }` |
| DELETE | `/comments/c/:commentId` | Owner | |

## Likes

| Method | Path | Auth | Notes |
| ------ | ---- | ---- | ----- |
| POST | `/likes/toggle/v/:videoId` | Yes | `{ liked, likes }` |
| POST | `/likes/toggle/c/:commentId` | Yes | |
| POST | `/likes/toggle/t/:tweetId` | Yes | |
| GET | `/likes/videos` | Yes | Current user’s liked videos (paginated) |

## Subscriptions

| Method | Path | Auth | Notes |
| ------ | ---- | ---- | ----- |
| POST | `/subscriptions/c/:channelId` | Yes | Toggle. No self-subscribe. `{ subscribed }` |
| GET | `/subscriptions/c/:channelId` | Yes | Subscribers of that channel |
| GET | `/subscriptions/u/:subscriberId` | Yes | Channels that user subscribed to |

GET wiring was corrected (param names now match handlers). No prior clients existed.

## Tweets

| Method | Path | Auth | Notes |
| ------ | ---- | ---- | ----- |
| POST | `/tweets` | Yes | `{ content }` |
| GET | `/tweets/user/:userId` | Optional | Paginated |
| PATCH | `/tweets/:tweetId` | Owner | `{ content }` |
| DELETE | `/tweets/:tweetId` | Owner | |

## Playlists

| Method | Path | Auth | Notes |
| ------ | ---- | ---- | ----- |
| POST | `/playlist` | Yes | `{ name, description }` |
| GET | `/playlist/user/:userId` | Yes | |
| GET | `/playlist/:playlistId` | Yes | Non-owners only see published videos |
| PATCH | `/playlist/:playlistId` | Owner | `{ name?, description? }` |
| DELETE | `/playlist/:playlistId` | Owner | |
| PATCH | `/playlist/add/:videoId/:playlistId` | Owner | `$addToSet` (no duplicates) |
| PATCH | `/playlist/remove/:videoId/:playlistId` | Owner | |

## Dashboard

| Method | Path | Auth | Notes |
| ------ | ---- | ---- | ----- |
| GET | `/dashboard/stats` | Yes | Current user: videos, views, likes, comments, subscribers |
| GET | `/dashboard/videos` | Yes | Current user’s videos, paginated |

## Watch history

Written on `GET /videos/:videoId`. Read via `GET /users/History`. No clear/remove route in this API.
