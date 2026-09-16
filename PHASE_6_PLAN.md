# PHASE 6 PLAN — Creator studio, playlists, history, subscriptions, Vidzora brand

## Goal

Ship the authenticated creator and library layer on top of Phase 5, using **only** `/api/v1` contracts from `API.md`, `openapi.yaml`, and the live controllers. Rebrand the SPA to **Vidzora — Watch. Create. Connect.** Do not rename the physical `backend` folder or invent endpoints.

## Backend source of truth (inspected)

| Capability | Endpoint | Notes |
| --- | --- | --- |
| Channel stats | `GET /dashboard/stats` | `totalVideos`, `totalViews`, `totalLikes`, `totalComments`, `totalSubscribers` for **current user only** |
| Creator videos | `GET /dashboard/videos` | Paginated; includes unpublished; no owner populate |
| Own + others’ videos | `GET /videos?userId=` | Unpublished visible **only** when `userId` is the current user |
| Upload | `POST /videos` | multipart `videoFile` + `thumbnail` + `title` + `description`; **always** `isPublished: true` |
| Update | `PATCH /videos/:videoId` | Owner; `title`, `description`, optional `thumbnail` file |
| Delete | `DELETE /videos/:videoId` | Owner |
| Publish toggle | `PATCH /videos/toggle/publish/:videoId` | Owner; flips `isPublished` |
| Playlists | `POST /playlist`, `GET /playlist/user/:userId`, `GET/PATCH/DELETE /playlist/:id`, add/remove video | JSON `{ name, description }`; add is `$addToSet` |
| History | `GET /users/History` | Array, max 50, newest first. **No remove/clear** |
| Subscribed channels | `GET /subscriptions/u/:subscriberId` | `{ channels, subscribedCount }` — **not a video feed** |
| Channel profile | `GET /users/c/:username` | No channel description field |
| Profile edit | `PATCH /users/update_account`, `/users/avater`, `/users/cover_image`, `POST /users/change_password` | Auth required; self only |

## Will not implement (no API)

- Remove/clear watch history
- Upload as unpublished / draft
- Per-video analytics beyond stored `views` + dashboard totals
- Channel “about” / description text
- Dedicated subscriptions **video** endpoint (compose from channels + `GET /videos?userId=`)
- Watch timestamps on history items (API returns video documents only)

## Pages / routes

| Path | Page |
| --- | --- |
| `/dashboard` | Creator studio overview |
| `/studio/upload` | Upload |
| `/studio/videos` | My videos (manage, edit, publish, delete) |
| `/playlists` | Playlist library |
| `/playlist/:playlistId` | Playlist detail |
| `/history` | Watch history (read-only) |
| `/subscriptions` | Subscribed channels + composed recent videos |
| `/settings` | Account, avatar, cover, password |

All of the above remain behind `ProtectedRoute`.

## Frontend modules

- `VidzoraLogo` + favicon + document title
- `services/api/{dashboard,playlists}` + extend videos, auth, subscriptions
- Feature hooks with query keys and mutation invalidation
- Studio / library pages using existing UI primitives

## Upload contract (strict)

FormData fields only: `videoFile`, `thumbnail`, `title`, `description`.  
Do **not** set `Content-Type` manually. Use a long Axios timeout (Cloudinary).  
Client-side type/size checks: video mp4/webm/quicktime ≤ 100MB; thumbnail jpeg/png/webp/gif ≤ 5MB (backend defaults).

## Testing

Vitest + Testing Library, mocked API modules. Keep Phase 4–5 tests. Add Phase 6 coverage for studio, upload, playlists, history, subscriptions, branding, guards.

## Live verification

Backend `:8000`, frontend `:3000`, MongoDB Atlas. Browser flows listed in the Phase 6 objective.
