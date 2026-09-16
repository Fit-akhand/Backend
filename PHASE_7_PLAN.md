# PHASE 7 PLAN — Public catalog, search, social, tweets

## Goal

Make Vidzora usable without signing in for **discovery and watch**, keep mutations authenticated, and polish social/subscription/history UX. Backend remains source of truth.

## Genuine backend blocker

Today `router.use(verifyJWT)` on videos, comments, tweets, and `GET /users/c/:username` blocks a public catalog. Phase 6 already documented this. Phase 7 cannot ship a real guest feed without a **small, backward-compatible optional-auth change**.

### Proposed backend (minimal)

Add `optionalJWT`. Attach `req.user` when a valid access token/cookie is present; otherwise continue as guest.

| Method | Path | Auth after change |
| --- | --- | --- |
| GET | `/videos` | Optional. Guests see **published** only |
| GET | `/videos/:videoId` | Optional. Unpublished still 404 unless owner. Views increment. Watch history written **only if** `req.user` |
| GET | `/users/c/:username` | Optional. Hide `email` unless viewer is the channel owner |
| GET | `/comments/:videoId` | Optional |
| GET | `/tweets/user/:userId` | Optional |

POST/PATCH/DELETE unchanged (`verifyJWT` + ownership). Playlists, likes, subscriptions, dashboard, history stay authenticated.

Existing mutation 401 tests stay. Update the Phase 2 test that currently expects `GET /videos` → 401. Add tests for public list/watch.

## Frontend

- Public `AppShell` for `/`, `/search`, `/watch/:id`, `/channel/:username`
- Guests see catalog + search + watch + channel; Sign in for like/comment/subscribe/studio
- Search page: URL `q`, `sortBy`, `sortType`, `page` (API-supported only)
- Related videos on watch: `GET /videos?userId=` (no extra view increment)
- Channel tabs: Videos + Posts (tweets CRUD for owner)
- Subscriptions empty CTA to catalog
- History: continue watching + explicit “management isn’t available yet”
- Modal: do not expose closed dialogs to AT
- Responsive/a11y pass

## Out of scope (no API)

- Clear/remove history
- Nested comment replies
- Combined subscription-video endpoint
- Channel about text
