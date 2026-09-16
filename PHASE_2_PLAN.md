# PHASE 2 PLAN

Reconciled with current code (post–Phase 1), not the original audit alone.

## Current state

- User auth (register/login/logout/refresh/current user/avatar/cover/channel/history **read**) works and is tested.
- Password change and account update exist but need tighter validation (email uniqueness, password rules).
- No password-reset route exists — **will not invent one**.
- Video, comment, like, tweet, subscription, playlist, dashboard controllers are empty TODOs (they hang).
- All of those routers already `verifyJWT` every route — **keep that contract**.
- Subscription model is still `"Subscription "` (trailing space).
- Playlist `GET /user/:userId` is registered **after** `/:playlistId` and would never match.
- Subscription GET handlers are wired to the wrong param names.
- `mongoose-aggregate-paginate-v2` is on Video and Comment only.
- Tests use MongoMemoryServer. Atlas remains unreachable — do not change `.env`.

## Constraints

- No frontend, no architecture rewrite, no fake domain data.
- One validation approach: small helpers in `src/utils/http.js` (no extra validation library).
- Controllers stay the HTTP layer; shared helpers for IDs, ownership, pagination, like-toggle.
- Preserve `/api/v1` paths except wiring bugs that make routes unusable.

## Implementation order

| Step | Module | Depends on | Notes |
| ---- | ------ | ---------- | ----- |
| 0 | Shared helpers + schema indexes | Phase 1 | IDs, pagination, owner checks, 404 handler |
| 2A | User/account polish | 0 | Validation only; no new auth architecture |
| 2B | Videos | 0, Cloudinary | Upload, CRUD, publish toggle, search/sort/page, ownership |
| 2C | Watch history write | 2B | On `GET /videos/:videoId`; keep existing `GET /users/History` |
| 2D | Comments | 2B | CRUD + pagination + owner checks |
| 2E | Likes | 2B, 2D, tweets later | Toggle video/comment/tweet; unique partial indexes |
| 2F | Subscriptions | User | Fix model name + route wiring; unique pair; no self-sub |
| 2G | Tweets | User | CRUD + list; likes already cover tweets |
| 2H | Playlists | 2B | Reorder routes; `$addToSet`; owner checks |
| 2I | Dashboard | 2B, 2E, 2F | Real aggregations for current user |
| 2J | Healthcheck | Phase 1 | Add DB readyState; stay 200 for liveness |
| Tests | `tests/phase2.test.js` | All | Keep Phase 1 file intact; `--test-concurrency=1` |
| Docs | `API.md` + `PHASE_2_REPORT.md` | All | Honest Atlas status |

## Route contracts to implement (existing)

See `API.md` after implementation. Wiring fix only:

- `GET /subscriptions/c/:channelId` → subscribers of that channel
- `GET /subscriptions/u/:subscriberId` → channels that user subscribed to
- `POST /subscriptions/c/:channelId` → toggle (unchanged)

## Authorization model (no admin role in schema)

| Access | Endpoints |
| ------ | --------- |
| Public | `GET /healthcheck` |
| Authenticated | All other existing `/api/v1` routes |
| Owner only | Video update/delete/toggle; comment update/delete; tweet update/delete; playlist mutate |
| Authenticated read | Another user’s published videos, playlists, tweets, channel |

Unpublished videos: owner only (404 to others).

## Watch history (no new routes)

On authenticated `GET /videos/:videoId`: `$inc views`, move video to front of `watchHistory` (`$pull` then `$push`). Uniques by video id; recency preserved. No clear/remove API in current routes.

## Verification

- Automated: MongoMemoryServer (Phase 1 + Phase 2).
- Atlas: BLOCKED unless connectivity is proven; do not claim it.
