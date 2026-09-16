# PHASE 5 PLAN — Core frontend product & REST integration

## Goal

Ship the core authenticated experience: home feed → search → watch → channel, using only real `/api/v1` endpoints. No mocks, no invented fields.

**Auth note (contract):** Almost all domain GETs require JWT. Guests see the landing page; signed-in users get the product shell. Authenticated actions (like, comment, subscribe) prompt login if the session is missing.

## Features

| Feature | Behavior |
| --- | --- |
| Home feed | `GET /videos` paginated, newest first |
| Search | Same endpoint with `query` (debounced URL `?q=`), min 2 chars for server text search |
| Video card / grid / feed | Reusable components + shared feed state handling |
| Watch | `GET /videos/:videoId` once (views + history written by backend) |
| Player | Native `<video>` with `videoFile` URL, controls, loading/error |
| Like | `POST /likes/toggle/v/:videoId` → `{ liked, likes }`; initial liked via `GET /likes/videos` |
| Subscribe | Channel `isSubscribed` + `POST /subscriptions/c/:channelId` |
| Channel | `GET /users/c/:username` + `GET /videos?userId=` (email hidden in UI) |
| Comments | List/create/edit/delete via comments API |
| Unauthorized | Redirect to `/login` with `from`, or inline prompt on mutations |

## API endpoints consumed

| Endpoint | Use |
| --- | --- |
| `GET /videos` | Feed, search, channel videos |
| `GET /videos/:videoId` | Watch (view + history side effect) |
| `GET /users/c/:username` | Channel profile |
| `POST /subscriptions/c/:channelId` | Subscribe toggle |
| `POST /likes/toggle/v/:videoId` | Like toggle |
| `GET /likes/videos` | Detect if current user liked video |
| `GET /comments/:videoId` | Comment list |
| `POST /comments/:videoId` | Create |
| `PATCH /comments/c/:commentId` | Edit own |
| `DELETE /comments/c/:commentId` | Delete own |

## Pages

- `/` — HomeGate (landing | HomePage feed)
- `/watch/:videoId` — WatchPage
- `/channel/:username` — ChannelPage (param is username; matches API + existing card links)
- Keep placeholders for history/playlists/dashboard (Phase 6)

## Components

- `VideoCard`, `VideoGrid`, `VideoFeed`
- `VideoPlayer`
- `ExpandableDescription`
- `LikeButton`, `SubscribeButton`
- `CommentsSection` (+ list item with edit/delete for owner)
- `AuthPrompt` (sign-in CTA)

## Hooks / queries / mutations

```
useVideos(params)
useVideo(videoId)          // stale, no window refetch (avoid double view)
useChannel(username)
useChannelVideos(userId)
useComments(videoId, page)
useCreateComment / useUpdateComment / useDeleteComment
useToggleLike(videoId)
useLikedVideos / isVideoLiked helper
useToggleSubscription(channelId)
```

Invalidate narrowly: comments → `["comments", videoId]`; like → `["likes", …]` + video like cache; subscribe → `["channel", username]`.

## Dependencies

No new packages expected (React, Query, Router, existing UI).

## Testing strategy

Vitest + Testing Library with mocked API modules:

- Home: loading / success / empty / error
- Search: query wiring / empty
- Watch: load / not found / like / subscribe
- Channel: profile / videos / subscribe
- Comments: load / create / update / delete

## Acceptance criteria

Matches Phase 5 definition of done. Live Atlas E2E may remain **BLOCKED**; unit tests + build quality must **PASS**; backend **42/42**.

## Known API gaps (document, do not invent)

1. No dedicated “like count / isLiked on video GET” — use toggle response + liked-videos list.
2. Channel profile returns `email` — hide in UI; note as backend debt.
3. Watch view increments on every `GET /videos/:id` — frontend must not refetch aggressively.
4. Domain reads require auth — not a public catalog until API changes.
