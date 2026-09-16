# PROJECT AUDIT

**Project:** `backend` (working name from DB: `ak_tube`)  
**Audit date:** 2026-09-15  
**Audit type:** Read-only (no runtime tests executed; no production database accessed)  
**Verification method:** Full source inspection of routes, controllers, models, middleware, utilities, and package configuration  

**Status legend used in this document**

| Status | Meaning |
| ------ | ------- |
| COMPLETE | Implementation is coherent and, where possible, would work as intended |
| PARTIALLY COMPLETE | Substantial code exists, but gaps, bugs, or missing pieces prevent treating it as done |
| MISSING | Not implemented (stubs, TODOs, or absent entirely) |
| BROKEN | Code exists but cannot work correctly as written |
| UNKNOWN | Could not verify without execution or secrets/environment |

---

## 1. Executive Summary

This repository is a **YouTube-style video platform REST API** (users, videos, comments, likes, tweets/posts, subscriptions, playlists, channel dashboard). It is a **learning / half-finished Express + MongoDB backend**. There is **no frontend**, **no tests**, **no Docker**, **no API documentation**, and **no email, notifications, payments, or RBAC**.

**Technology stack (current):** Node.js (ES modules), Express 5, Mongoose 8, JWT + bcrypt cookies, Multer + Cloudinary, Prettier, Nodemon.

**Architecture (current):** A single Express app with **fat controllers** (no service or repository layer). Models live in `src/models`. Routes mount under `/api/v1/*`. Shared helpers: `asyncHandler`, `ApiError`, `ApiResponse`. Auth is a JWT middleware. File upload is Multer disk storage plus Cloudinary.

**Current completion level (estimate):**

- Overall full-stack application: **~18%**
- Backend: **~28%** (structure + user module drafted; most domain APIs are empty)
- Frontend: **0%**

**Biggest problems**

1. **The server cannot start as written.** Six route modules import `{ verifyJWT }`, but middleware only exports `varifyJWT`. Express loads all routers in `src/app.js`, so this is a boot-time named-export failure, not a per-route issue.
2. **User/auth is the only substantial module, and it is internally inconsistent.** Schema field `refrshToken` vs code using `refreshToken`; cookie access typos (`req.cokkies`, `req.cookie`); refresh-token response returns the literal string `"newrefreshToken"`; avatar/cover `$set` writes the URL as the entire update document.
3. **Video, comment, like, tweet, subscription, playlist, dashboard, and healthcheck are route shells with empty TODO controllers.** They would return no JSON even if the app started.
4. **No global error handler.** `asyncHandler` forwards errors with `next(err)`, but `app.js` never registers an Express error middleware, so `ApiError` will not produce consistent JSON.
5. **No validation library, rate limiting, logging, tests, `.env.example`, or `public/temp` directory** (Multer destination).
6. **No roles.** Every authenticated route is “any logged-in user.” There is no ownership check in domain controllers because those controllers are empty.

**Overall recommended direction**

Do **not** rewrite the project. Keep Express + Mongoose + `/api/v1` + controller/route/model layout.

1. Unblock boot (JWT export name, error middleware, env template).
2. Make the **user/auth/upload** path actually work (field names, cookies, Cloudinary, token persistence).
3. Implement the **existing route contracts** for video → like/comment/subscription → playlist/tweet → dashboard (do not invent parallel APIs).
4. Add tests around auth and ownership.
5. Add a frontend that consumes the existing `/api/v1` contracts.
6. Harden security and deploy last.

---

## 2. Project Structure

```
backend/
├── package.json                 # scripts, dependencies
├── package-lock.json
├── Readme.md                    # one line: "Backend in Java Script"
├── .gitIgnore
├── .prettierrc / .prettierignore
├── src/
│   ├── index.js                 # dotenv, Mongo connect, listen
│   ├── app.js                   # Express, CORS, parsers, route mounts
│   ├── constants.js             # DB_NAME = "ak_tube"
│   ├── db/index.js              # mongoose.connect
│   ├── middlewares/
│   │   ├── auth.middleware.js   # JWT (exported as varifyJWT)
│   │   └── multer.middleware.js # disk storage → ./public/temp
│   ├── models/                  # User, Video, Comment, Like, Tweet, Subscription, Playlist
│   ├── routes/                  # one router per domain
│   ├── controllers/             # business logic (mostly TODOs)
│   └── utils/
│       ├── asyncHandler.js
│       ├── ApiError.js
│       ├── ApiResponse.js
│       └── cloudinary.js
└── public/                      # intended static + temp uploads; not present in repo
```

**Important absences (confirmed by full-tree search, not just folder names):**

- No `frontend/`, React/Vue/HTML app, or templates
- No `tests/`, `*.test.js`, `*.spec.js`
- No `Dockerfile`, `docker-compose`, CI configs
- No Swagger/OpenAPI
- No services/, repositories/, validators/
- No seed scripts, migrations (Mongo is schemaless; none exist)
- No `.env.example` (`.env` is gitignored; not read for this audit)
- Unused / accidental dependency: `cookie-parse` (distinct from `cookie-parser`)

---

## 3. Technology Stack

| Area | Choice |
| ---- | ------ |
| Language | JavaScript (ES modules, `"type": "module"`) |
| Backend framework | Express `^5.1.0` |
| Database | MongoDB (database name `ak_tube`) |
| ODM | Mongoose `^8.15.1` |
| Pagination plugin | `mongoose-aggregate-paginate-v2` (on Video and Comment schemas only; unused in controllers) |
| Authentication | JWT (`jsonwebtoken`) + httpOnly cookies + Bearer header (intended) |
| Password hashing | `bcrypt` (cost 10) |
| File upload | Multer disk storage |
| Object storage | Cloudinary |
| CORS | `cors` with `credentials: true` and `origin: process.env.CORS_ORIGIN` |
| Validation | **None** (ad-hoc `if` checks in user controller only) |
| Testing | **None** (no test script, no framework) |
| API documentation | **None** |
| Formatting | Prettier |
| Dev server | `nodemon -r dotenv/config --experimental-json-modules src/index.js` |
| Logging | `console.log` only |
| Email / notifications / payments | **None** |
| Docker / CI | **None** |

**Environment variables referenced in code** (names only; values not inspected):

- `PORT`
- `MONGODB_URI` (code appends `/${DB_NAME}`)
- `CORS_ORIGIN`
- `ACCESS_TOKEN_SECRET`, `ACCESS_TOKEN_EXPIRY`
- `REFRESH_TOKEN_SECRET`, `REFRESH_TOKEN_EXPIRY`
- `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET`

---

## 4. Feature Inventory

| Feature | Status | Backend | Database | API | Tests | Notes |
| ------- | ------ | ------- | -------- | --- | ----- | ----- |
| Express bootstrap | PARTIALLY COMPLETE | Routes mounted | N/A | `/api/v1` prefix | None | No error middleware; boot blocked by JWT import |
| MongoDB connection | PARTIALLY COMPLETE | `connentDB()` | URI + `ak_tube` | N/A | None | Typo in function name; no retry/pool config |
| Healthcheck | MISSING | Empty TODO | N/A | GET `/api/v1/healthcheck` | None | Handler never sends a response |
| User registration | PARTIALLY COMPLETE | Implemented | User schema | POST `/users/register` | None | Weak empty-field check; logs email; depends on Cloudinary + Multer |
| Login | PARTIALLY COMPLETE | Implemented | User | POST `/users/login` | None | Tokens saved to `user.refreshToken` but schema field is `refrshToken` |
| Logout | PARTIALLY COMPLETE | Implemented | User | POST `/users/logout` | None | Needs working JWT; does not clear `refreshToken` cookie |
| Refresh access token | BROKEN | Implemented incorrectly | User | POST `/users/refresh-token` | None | `req.cookie` (invalid); destructure mismatch; body returns string literal |
| Change password | PARTIALLY COMPLETE | Implemented | User | POST `/users/change_password` | None | Auth-gated; `validataBeforeSave` typo (ignored extra option) |
| Get current user | PARTIALLY COMPLETE | Implemented | User | GET `/users/current_user` | None | Depends on JWT middleware |
| Update account (name/email) | PARTIALLY COMPLETE | Implemented | User | PATCH `/users/update_account` | None | No email uniqueness check on update |
| Update avatar | BROKEN | Implemented incorrectly | User | PATCH `/users/avater` | None | `$set: avatar.url` is invalid update shape; route typo `avater` |
| Update cover image | BROKEN | Same bug | User | PATCH `/users/cover_image` | None | `$set: coverImage.url` |
| Channel profile | PARTIALLY COMPLETE | Aggregation written | User + Subscription | GET `/users/c/:username` | None | `$lookup` uses collection `subscriptions`; model name has trailing space |
| Watch history (read) | BROKEN | Aggregation written | User + Video | GET `/users/History` | None | `mongoose.Types.ObjectId()` without `new`; lookup `from: "user"` (actual collection `users`) |
| Watch history (write / increment on view) | MISSING | None | `watchHistory[]` unused | None | None | Field exists; no API writes it |
| JWT auth middleware | BROKEN | Exists | User | Used by protected routes | None | `req.cokkies`; `.select("-refreshToken")` vs `refrshToken`; export name |
| File upload (Multer) | PARTIALLY COMPLETE | Middleware exists | N/A | Register + avatar/cover + video routes | None | Original filenames; `./public/temp` not in repo; no MIME/size limits |
| Cloudinary upload | PARTIALLY COMPLETE | Helper exists | URLs on User/Video | Used by user flows | None | Export `uplodeonCloudinary`; video controller imports `uploadOnCloudinary` |
| Videos (list/publish/get/update/delete/publish toggle) | MISSING | Empty TODOs | Video schema exists | Routes exist | None | Also blocked by `verifyJWT` import |
| Comments | MISSING | One incomplete aggregate, rest TODO | Comment schema | Routes exist | None | Aggregates `Video` instead of `Comment`; no `res.json` |
| Likes | MISSING | Empty TODOs | Like schema | Routes exist | None | No unique compound index (duplicate likes possible later) |
| Tweets / community posts | MISSING | Empty TODOs | Tweet schema | Routes exist | None | |
| Subscriptions | MISSING | Empty TODOs | Subscription schema | Routes exist | None | Controller params do not match route params |
| Playlists | MISSING | Empty TODOs | Playlist schema | Routes exist | None | |
| Channel dashboard (stats + videos) | MISSING | Empty TODOs | Video/Sub/Like | Routes exist | None | |
| Request validation | MISSING | Ad-hoc only | Schema `require` typos | N/A | None | Mongoose `require` is not `required` |
| Global error handling | MISSING | `ApiError` unused at app level | N/A | Inconsistent | None | |
| Roles / RBAC / admin | MISSING | None | No role field | Auth only | None | Ownership not enforced |
| Password reset | MISSING | None | None | None | None | |
| Email verification | MISSING | None | None | None | None | |
| Email sending | MISSING | None | N/A | None | None | |
| Notifications | MISSING | None | None | None | None | |
| Payments | MISSING | None | None | None | None | |
| Search / filter / sort (videos) | MISSING | Query params destructured only | Plugin unused | GET `/videos` | None | |
| Pagination | MISSING | Query defaults in comments/videos | Plugin on schemas | Intended | None | |
| API versioning | PARTIALLY COMPLETE | `/api/v1` prefix | N/A | Yes | None | Only v1; no docs |
| Logging | MISSING | console.log | N/A | N/A | None | Logs emails on register/login |
| Rate limiting | MISSING | None | N/A | None | None | |
| Tests | MISSING | None | None | None | **Zero files** | |
| API docs (OpenAPI/Swagger) | MISSING | None | N/A | None | None | |
| Docker / deployment | MISSING | None | None | None | None | |
| Frontend application | MISSING | N/A | N/A | N/A | None | Nothing in repo |
| Seed data | MISSING | None | None | None | None | |

**Counts (from the table above, unique feature rows):** COMPLETE **0** · PARTIALLY COMPLETE **12** · MISSING **26** · BROKEN **5** · UNKNOWN **0** (43 rows)

---

## 5. API Inventory

Base URL: `http://localhost:{PORT}/api/v1`  
Auth model: JWT in cookie `accessToken` **or** `Authorization: Bearer <token>` (intended). **No roles.**  
Standard success wrapper (when used): `{ statusCode, data, message, success }`.

| Method | Endpoint | Auth | Role | Purpose | Status |
| ------ | -------- | ---- | ---- | ------- | ------ |
| GET | `/healthcheck/` | No | — | Liveness JSON | MISSING (empty handler) |
| POST | `/users/register` | No | — | Register + avatar (required) + optional cover | PARTIALLY COMPLETE |
| POST | `/users/login` | No | — | Login by username or email; set cookies; return tokens | PARTIALLY COMPLETE |
| POST | `/users/logout` | JWT | any user | Clear access cookie; unset refresh on user | PARTIALLY COMPLETE |
| POST | `/users/refresh-token` | Refresh cookie or body | — | Issue new access/refresh | BROKEN |
| POST | `/users/change_password` | JWT | any user | Body: `oldPassword`, `newPassword` | PARTIALLY COMPLETE |
| GET | `/users/current_user` | JWT | any user | Return `req.user` | PARTIALLY COMPLETE |
| PATCH | `/users/update_account` | JWT | any user | Body: `fullname`, `email` | PARTIALLY COMPLETE |
| PATCH | `/users/avater` | JWT | any user | Multipart field `avatar` | BROKEN (typo + `$set`) |
| PATCH | `/users/cover_image` | JWT | any user | Multipart field `coverImage` | BROKEN (`$set`) |
| GET | `/users/c/:username` | JWT | any user | Channel stats (subscribers, subscribed-to, isSubscribed) | PARTIALLY COMPLETE |
| GET | `/users/History` | JWT | any user | Current user’s watch history | BROKEN |
| GET | `/videos/` | JWT (all video routes) | any user | List videos (`page`, `limit`, `query`, `sortBy`, `sortType`, `userId`) | MISSING + BROKEN boot |
| POST | `/videos/` | JWT | any user | Publish video (`videoFile`, `thumbnail`, `title`, `description`) | MISSING + BROKEN boot |
| GET | `/videos/:videoId` | JWT | any user | Get one video | MISSING + BROKEN boot |
| PATCH | `/videos/:videoId` | JWT | any user (ownership **not** implemented) | Update title/description/thumbnail | MISSING + BROKEN boot |
| DELETE | `/videos/:videoId` | JWT | any user (ownership **not** implemented) | Delete video | MISSING + BROKEN boot |
| PATCH | `/videos/toggle/publish/:videoId` | JWT | any user (ownership **not** implemented) | Toggle `isPublished` | MISSING + BROKEN boot |
| GET | `/comments/:videoId` | JWT | any user | Paginated comments (`page`, `limit`) | BROKEN/incomplete |
| POST | `/comments/:videoId` | JWT | any user | Add comment | MISSING |
| PATCH | `/comments/c/:commentId` | JWT | any user (ownership **not** implemented) | Update comment | MISSING |
| DELETE | `/comments/c/:commentId` | JWT | any user (ownership **not** implemented) | Delete comment | MISSING |
| POST | `/likes/toggle/v/:videoId` | JWT | any user | Toggle video like | MISSING |
| POST | `/likes/toggle/c/:commentId` | JWT | any user | Toggle comment like | MISSING |
| POST | `/likes/toggle/t/:tweetId` | JWT | any user | Toggle tweet like | MISSING |
| GET | `/likes/videos` | JWT | any user | Liked videos of current user | MISSING |
| POST | `/tweets/` | JWT | any user | Create tweet | MISSING |
| GET | `/tweets/user/:userId` | JWT | any user | List a user’s tweets | MISSING |
| PATCH | `/tweets/:tweetId` | JWT | any user (ownership **not** implemented) | Update tweet | MISSING |
| DELETE | `/tweets/:tweetId` | JWT | any user (ownership **not** implemented) | Delete tweet | MISSING |
| GET | `/subscriptions/c/:channelId` | JWT | any user | **Routed as** `getSubscribedChannels` | MISSING; **param mismatch** |
| POST | `/subscriptions/c/:channelId` | JWT | any user | Toggle subscribe to channel | MISSING |
| GET | `/subscriptions/u/:subscriberId` | JWT | any user | **Routed as** `getUserChannelSubscribers` | MISSING; **param mismatch** |
| POST | `/playlist/` | JWT | any user | Create playlist (`name`, `description`) | MISSING |
| GET | `/playlist/:playlistId` | JWT | any user | Get playlist | MISSING |
| PATCH | `/playlist/:playlistId` | JWT | any user (ownership **not** implemented) | Update playlist | MISSING |
| DELETE | `/playlist/:playlistId` | JWT | any user (ownership **not** implemented) | Delete playlist | MISSING |
| PATCH | `/playlist/add/:videoId/:playlistId` | JWT | any user (ownership **not** implemented) | Add video | MISSING |
| PATCH | `/playlist/remove/:videoId/:playlistId` | JWT | any user (ownership **not** implemented) | Remove video | MISSING |
| GET | `/playlist/user/:userId` | JWT | any user | User’s playlists | MISSING |
| GET | `/dashboard/stats` | JWT | any user | Channel stats for current user | MISSING |
| GET | `/dashboard/videos` | JWT | any user | Current user’s videos | MISSING |

**Auth middleware details (intended vs actual)**

- Intended: `req.cookies.accessToken` or `Authorization` Bearer token; load user; attach `req.user`.
- Actual: `req.cokkies?.accessToken` — **cookie auth never reads the cookie**.
- Bearer path can work **if** the header is present and `ACCESS_TOKEN_SECRET` matches.
- User lookup uses `.select("-password -refreshToken")` while the schema field is `refrshToken`.

**Request/response consistency issues (do not change yet; document only)**

- Mixed path styles: `change_password` vs `refresh-token` vs `History` vs `avater`.
- Resource prefix `playlist` is singular; others are plural.
- Login returns tokens in **both** cookies and JSON body.
- Invalid password on login uses **404**, not 401.
- Channel-not-found uses **400**, not 404.
- Success envelope exists but unused on stub endpoints.

---

## 6. Database Analysis

MongoDB via Mongoose. **No migrations.** Indexes are whatever Mongoose creates from schema options.

### Entities / collections (Mongoose default pluralization)

| Model export | `mongoose.model` name | Likely collection | Purpose |
| ------------ | --------------------- | ----------------- | ------- |
| `User` | `"User"` | `users` | Accounts, watch history, tokens |
| `Video` | `"Video"` | `videos` | Uploaded videos |
| `Comment` | `"Comment"` | `comments` | Comments on videos only |
| `Like` | `"Like"` | `likes` | Like on video **or** comment **or** tweet |
| `Tweet` | `"Tweet"` | `tweets` | Short posts |
| `Subscription` | `"Subscription "` (**trailing space**) | **not** reliably `subscriptions` | Subscriber ↔ channel |
| `Playlist` | `"Playlist"` | `playlists` | Named lists of videos |

### Relationships

```
User 1──* Video (owner)
User 1──* Comment (owner)
Video 1──* Comment
User 1──* Tweet (owner)
User 1──* Playlist (owner)
Playlist *──* Video (array of ObjectIds)
User *──* User via Subscription (subscriber, channel)
User *──* Video via watchHistory[]
Like → optional video | comment | tweet + likedBy
```

There are **no Mongoose `ref` constraints that enforce existence**. `owner` on Video/Comment/Tweet/Playlist is **not required**.

### Important schema problems

1. **User fields use `require: true` instead of `required: true`.** Mongoose does not treat `require` as the required validator. Uniqueness still applies where `unique: true` is set (`username`, `email`).
2. **`password: { unique: true }`** is wrong. It can reject two users with the same bcrypt hash (collision) and is not a meaningful constraint.
3. **Typo `refrshToken`** vs application code `refreshToken`. Refresh tokens written on login **are not stored on the documented field**, so refresh-token comparison against `user.refreshToken` will fail unless Mongoose stores a strict path that was never defined (typically **ignored / not persisted** depending on strict mode; schema is strict by default → **field dropped**).
4. **`watchHistory` refs `"video"`** (lowercase) but the model is `"Video"`. Populate by path name may fail; aggregations matching `_id` can still work if IDs are stored.
5. **Subscription model name `"Subscription "`** will not produce collection `subscriptions`. Channel-profile `$lookup.from: "subscriptions"` is therefore **likely empty forever**.
6. **No unique index** on `(subscriber, channel)` → duplicate subscriptions.
7. **No unique index** on like `(likedBy, video|comment|tweet)` → duplicate likes.
8. **No unique index** preventing duplicate videos in a playlist array.
9. **Video.owner, Comment.video/owner, Like.likedBy** are optional.
10. **No TTL or index** on tokens.

### Indexes (declared)

- `User.username`: `unique` + `index: true` (redundant unique index)
- `User.email`: `unique`
- `User.fullname`: `index: true`
- `User.password`: `unique` (harmful)
- Video/Comment: plugin only; **no** indexes on `owner`, `isPublished`, `video`, text search

### Transactions

None. Multi-document operations (like + count, subscribe + stats) are not implemented.

### Cascading

None. Deleting a user/video would leave orphan comments, likes, playlist entries, subscriptions.

### N+1

Not an issue yet (queries unimplemented). Watch-history aggregation is the right idea but uses the wrong collection name (`user` vs `users`).

### Duplicate / integrity

- Email uniqueness on **register** is checked in application code; **update email** is not.
- Username uniqueness checked on register only.

---

## 7. Authentication & Authorization

### Registration

- Multipart: `avatar` (required), `coverImage` (optional), body: `fullname`, `email`, `username`, `password`.
- Empty-string check uses `.some(field => field?.trim() === "")`, which **does not catch `undefined`/`null`** (`undefined === ""` is false).
- Uploads to Cloudinary; stores `avatar.url`.
- Returns 201 with user document minus password/refreshToken (select path `refreshToken` may not match schema).

### Login

- Body: `email` and/or `username`, `password`.
- `$or` query; bcrypt compare.
- Generates JWT access + refresh; attempts to save refresh on user; sets `httpOnly` + `secure` cookies; also returns tokens in JSON.
- `secure: true` cookies **will not be stored on plain HTTP localhost** in modern browsers unless HTTPS or `secure` is disabled in development.

### Logout

- Requires JWT.
- `$set: { refreshToken: undefined }` (wrong field name vs schema).
- Clears **only** `accessToken` cookie, not `refreshToken`.

### Refresh

- Reads `req.cookie.refreshToken` — Express provides `req.cookies` (plural). **Cookie path is dead.**
- Body `refreshToken` fallback can work.
- Verifies JWT with `REFRESH_TOKEN_SECRET`.
- Compares to `user.refreshToken` (not persisted as schema path).
- `generateAccessAndRefressTokens` returns `{ accessToken, refreshToken }` but caller destructures `{ accessToken, newrefreshToken }` → **`newrefreshToken` is always `undefined`**.
- JSON body sets `refreshToken: "newrefreshToken"` (string literal).
- `save({ validataBeforeSave: false })` — invalid option name; **validation is not skipped** (correct option is `validateBeforeSave`).

### Password hashing

- Pre-save hook hashes when `password` is modified. Cost 10. This part is sound **if** save actually runs.

### JWT payload

- Access: `_id`, `email`, `username`, `fullname`
- Refresh: `_id` only

### Email verification / password reset / session store

Not implemented. Tokens are JWTs; no denylist except intended refresh-token match (which does not work).

### Authorization

- **No roles, no permissions, no admin.**
- Protected routes: “is authenticated” only.
- Domain routes (video delete, comment edit, playlist edit) have **no owner checks** because handlers are empty. When implemented, this is the main IDOR risk.
- Channel profile and playlist-by-user require login even for public read — may be stricter than a typical YouTube UI (frontend will need a token for public pages).

---

## 8. Missing Functionality

### P0 — Critical

1. Fix app boot: export/import JWT middleware name (`varifyJWT` vs `verifyJWT`).
2. Global Express error-handling middleware so `ApiError` becomes JSON.
3. Fix auth middleware cookie access (`req.cookies`).
4. Align User token field (`refrshToken` vs `refreshToken`) everywhere.
5. Fix refresh-token flow (cookies, destructure, persist, response body).
6. Implement healthcheck (needed to know the process is alive).
7. Implement video publish/list/get/update/delete/toggle (core product).
8. `.env.example` + ensure `public/temp` exists (or create on startup).
9. Fix Cloudinary helper import name used by video controller.
10. Fix avatar/cover `$set` updates.

### P1 — High

1. Comments CRUD + pagination that actually queries `comments`.
2. Likes toggle + liked videos; unique constraints.
3. Subscriptions toggle + lists; **fix route/controller param pairing**.
4. Playlists CRUD + add/remove video + ownership.
5. Tweets CRUD + ownership.
6. Dashboard stats and channel videos.
7. Watch-history write path (on video view) and fix read aggregation (`new mongoose.Types.ObjectId`, `from: "users"`).
8. Request validation (body/params/query) and ObjectId checks (`isValidObjectId` is imported but unused).
9. Resource ownership on mutating endpoints.
10. Consistent HTTP status codes (401 for bad credentials).
11. Logout: clear both cookies; persist token invalidation.

### P2 — Medium

1. Pagination/filter/sort/search for videos (plugin already on schema).
2. Indexes: `video.owner`, `comment.video`, text index on title/description, unique subscription/like.
3. Delete cascade or explicit cleanup (Cloudinary `public_id` stored for deletes).
4. Rate limiting on auth and upload.
5. Structured logging (no PII).
6. Password reset + optional email verification.
7. API documentation (OpenAPI).
8. Test suite (unit + API).
9. Public (unauthenticated) video/channel read if the product requires browsing without login — **document as contract change** if routes stay JWT-only.
10. Remove unused `cookie-parse` dependency.

### P3 — Low

1. Normalize route naming (`avatar` not `avater`, kebab-case).
2. Pluralize `/playlist`.
3. Roles (user/admin) if moderation is needed.
4. Notifications, email, payments (not implied by current models).
5. Docker, CI, production process manager.
6. Service layer extraction (only after controllers exist).
7. README with real setup instructions.
8. Fix typos (`connentDB`, `uplodeonCloudinary`, Hindi/English mixed comments — optional).

---

## 9. Bugs / Broken Functionality

| ID | Location | Problem | Effect |
| -- | -------- | ------- | ------ |
| B1 | `src/routes/{video,comment,like,tweet,subscription,playlist,dashboard}.routes.js` | Import `{ verifyJWT }` but export is `varifyJWT` | **Process fails on startup** when `app.js` loads routers |
| B2 | `src/middlewares/auth.middleware.js` | `req.cokkies` | Cookie-based auth never sees the token |
| B3 | `src/models/user.model.js` vs controllers | `refrshToken` vs `refreshToken` | Refresh token not stored/compared on schema path |
| B4 | `src/controllers/user.controller.js` `refreshAccessToken` | `req.cookie` | Cookie refresh never read |
| B5 | Same | Destructure `newrefreshToken` from `{ refreshToken }` | New refresh cookie is `undefined` |
| B6 | Same | `refreshToken: "newrefreshToken"` | Client receives a useless string |
| B7 | Same | `logout` does not `clearCookie("refreshToken")` | Refresh cookie remains |
| B8 | Same | `updateUserAvatar` / `updateUserCoverimage` `$set: urlString` | Mongoose update is invalid; avatar/cover not saved |
| B9 | Same | `getWatchHistory` `mongoose.Types.ObjectId(id)` | Mongoose 8 requires `new`; likely throws |
| B10 | Same | `$lookup.from: "user"` | Wrong collection; owner never populated |
| B11 | `src/models/subscription.model.js` | Model name `"Subscription "` | Collection name mismatch vs `$lookup: "subscriptions"` |
| B12 | `src/controllers/video.controller.js` | Import `uploadOnCloudinary` | Named export is `uplodeonCloudinary` (would crash if handler ran) |
| B13 | `src/controllers/comment.controller.js` | Incomplete `Video.aggregate`; no `return res` | Request hangs |
| B14 | All TODO controllers | Empty `asyncHandler` | Request hangs (never sends response) |
| B15 | `src/app.js` | No error middleware | Unhandled `ApiError` is not a stable JSON API |
| B16 | `src/models/user.model.js` | `require` not `required` | Missing fields can be saved |
| B17 | User schema | `password.unique` | Accidental unique index on hashes |
| B18 | `src/controllers/subscription.controller.js` vs routes | GET `/c/:channelId` calls `getSubscribedChannels` which reads `subscriberId`; GET `/u/:subscriberId` reads `channelId` | Even after implementation, lists would be wired backwards unless fixed |
| B19 | Multer | Destination `./public/temp` | Upload fails if directory missing |
| B20 | `src/index.js` ESM import order | `app` imported before `dotenv.config()` | Relies on `nodemon -r dotenv/config`; `node src/index.js` may miss env |
| B21 | Login cookies | `secure: true` always | Local HTTP browsers drop cookies |
| B22 | Register validation | `undefined` fields pass | Incomplete bodies may reach Cloudinary/DB |
| B23 | `generateAccessAndRefressTokens` | `validataBeforeSave` | Does not skip validation |
| B24 | Channel `$lookup` | Depends on B11 | `subscriberCount` likely always 0 |
| B25 | Healthcheck | Empty | No OK JSON |

**Whether APIs “actually work”:** None were executed in this audit. By static analysis, **no endpoint is COMPLETE**. Register/login **might** partially work if the server were started with only user routes and env + Cloudinary + Mongo, but **the current `app.js` cannot load**.

---

## 10. Security Findings

Do not exploit. No secrets from `.env` are included.

| Severity | Location | Problem | Impact | Recommended fix |
| -------- | -------- | ------- | ------ | --------------- |
| Critical | Route JWT imports | App may fail closed (good) or, if “fixed” by removing auth, fail open | Availability; if someone stubs `verifyJWT` as no-op, all data exposed | Export one correctly named middleware; never no-op auth |
| High | Missing ownership on all mutating domain routes (when filled in) | Any authenticated user could operate on any ID | IDOR / privilege escalation | Check `resource.owner.equals(req.user._id)` |
| High | Refresh token not persisted / comparison broken | Refresh cannot be revoked; or refresh always fails | Session integrity | Store hash of refresh token on user; rotate; clear on logout |
| High | JWTs returned in JSON **and** cookies | XSS on a future frontend can steal body tokens | Account takeover | Prefer httpOnly cookies only, or document SPA storage risk |
| High | Multer: original filename, no MIME/size/type filter | Path overwrite, huge uploads, non-media files to Cloudinary | DoS, storage abuse | UUID filenames; allowlist mime; size limits; authenticated uploads only (videos already JWT) |
| High | Register is unauthenticated file upload | Anonymous users can push files to disk/Cloudinary | Cost / DoS | Rate limit; validate; consider CAPTCHA later |
| Medium | No rate limiting on login/register | Credential stuffing | Account compromise | express-rate-limit on `/users/login` and `/register` |
| Medium | CORS `origin: process.env.CORS_ORIGIN` | If env is `*` with `credentials: true`, browsers reject or misconfigure | Depending on env, CSRF-like issues | Explicit origin list; never `*` with credentials |
| Medium | `cookie-parse` dependency | Extra unused package (supply-chain surface) | Unnecessary risk | Remove unused dependency |
| Medium | Login logs `email`; register logs `email` | PII in logs | Privacy | Remove or redact |
| Medium | `ApiError` catch in JWT middleware returns `error.message` from `jwt.verify` | Information leakage | Slightly easier probing | Generic “Invalid access token” |
| Medium | Weak password rules | No min length/complexity | Weak accounts | Validate length ≥ 8; do not unique-index passwords |
| Medium | `secure: true` cookies without `sameSite` | CSRF on cookie auth if frontend is on another site | Unwanted authenticated requests | `sameSite: "strict"` or `"lax"`; CSRF strategy if cookie auth cross-site |
| Low | Access token embeds email/username/fullname | Stale PII in JWT until expiry | Privacy | Minimal claims (`_id` only) |
| Low | Cloudinary `resource_type: "auto"` | Unexpected file types | Storage policy | Restrict to image/video |
| Low | No helmet / body size 16kb JSON but multipart unbounded | Inconsistent limits | DoS | Align limits |
| Info | `.env` gitignored | Good | — | Add `.env.example` with empty placeholders only |
| Info | No SQL injection | Mongoose parameterized queries | Low for NoSQL operator injection if raw `$` in JSON | Avoid passing raw `req.body` into `find` |
| Info | XSS | API returns JSON; no HTML renderer | Frontend must encode | Keep JSON-only |
| Info | CSRF | Cookie+CORS credentials | Relevant once frontend exists | sameSite + origin checks |

**Not found:** payments, admin backdoors, hardcoded API keys in source (Cloudinary/JWT read from env).  
**Dependency vulnerabilities:** not scanned in this audit (no `npm audit` run). Treat as UNKNOWN until scanned in a later phase.

---

## 11. Testing Gaps

**Existing tests:** none. **Failing tests:** none (no suite).

**How to run locally (from repo scripts and code — not executed here)**

| Action | Command / step |
| ------ | ---------------- |
| Install | `npm install` |
| Dev | `npm run dev` (Nodemon + dotenv preload) |
| Test | **Missing** — no `npm test` |
| Build | **Missing** — interpreted JS, no build |
| Database | MongoDB reachable at `MONGODB_URI`; DB name appended as `ak_tube` |
| Migration | **None** (Mongoose syncs on first write) |
| Seed | **None** |
| Env | Create `.env` with the variable names in section 3 |
| Uploads | Create `public/temp` |

Do not point `MONGODB_URI` at production while developing.

**What must be tested once code exists**

1. App starts and healthcheck returns 200 JSON.
2. Register validation (missing avatar, duplicate email/username, success).
3. Login success/failure status codes; cookies set in dev.
4. Authenticated routes reject missing/invalid/expired JWT.
5. Refresh rotation; reuse of old refresh rejected.
6. Logout invalidates refresh and clears cookies.
7. Avatar/cover actually persist URLs.
8. Video CRUD + **only owner** can update/delete/toggle publish.
9. Unpublished videos hidden from other users’ lists.
10. Comments pagination; only owner edits/deletes.
11. Like toggle idempotence (no duplicate like docs).
12. Subscribe toggle; no self-subscribe; unique pair.
13. Playlist ownership; add/remove video.
14. Dashboard numbers match aggregations.
15. Authorization negatives (user A cannot delete user B’s video).
16. Invalid ObjectIds return 400, not 500.
17. Multer rejection of disallowed types.
18. Error middleware shape `{ success: false, message }` for all failures.

---

## 12. Frontend Requirements

There is **no frontend**. The following is **derived from the backend as it exists** (including empty routes). Do not redesign APIs yet.

### Roles

- Single role: **authenticated user**. No admin UI unless added later.

### Auth flow

1. Register (multipart form: avatar required).
2. Login → store tokens (cookies if `secure`/CORS allow; else body tokens — currently both).
3. Attach Bearer token to all `/api/v1` calls except register/login/refresh/health.
4. Refresh on 401; logout.

**Frontend-hostile issues (document only):**

- Inconsistent path casing (`History`, `avater`, snake_case vs kebab-case).
- Almost all reads require JWT (home feed, public channel, public playlist).
- `secure` cookies vs local HTTP.
- Hanging endpoints (no JSON) will spin forever in the UI.
- Channel email is exposed in channel profile projection.

### Pages / screens implied

| Page | Why |
| ---- | --- |
| Landing / video feed | GET `/videos` |
| Search results | `query`, `sortBy`, `sortType` on GET `/videos` |
| Video watch | GET `/videos/:id`, comments, likes, subscribe, add to playlist, views/history |
| Upload video | POST `/videos` (video + thumbnail + title + description) |
| Edit video / unpublish | PATCH video, toggle publish |
| Channel public | GET `/users/c/:username` |
| Channel dashboard | GET `/dashboard/stats`, `/dashboard/videos` |
| Tweets / community | `/tweets` |
| Playlists list/detail/edit | `/playlist` |
| Liked videos | GET `/likes/videos` |
| Subscriptions | `/subscriptions` |
| Watch history | GET `/users/History` |
| Settings / profile | current user, update account, avatar, cover, password |
| Login / register / logout | user routes |

### Layouts

- Public marketing (optional) + **app shell**: navbar (search, upload, avatar), sidebar (home, history, liked, subscriptions, playlists, dashboard).
- Watch layout: player + metadata + comments.
- Auth layout: centered forms.

### Components / forms / tables

- Auth forms (register with file inputs).
- Video card grid; pagination controls (`page`, `limit`).
- Upload form (two files + text).
- Comment list + editor.
- Like button (video/comment/tweet).
- Subscribe button.
- Playlist picker modal.
- Dashboard: stat cards (views, subscribers, videos, likes) + video table (title, views, published, actions).
- Profile editors (avatar/cover crop optional).

### Workflows

1. Register → auto-login (not implemented server-side; frontend can login after register).
2. Upload → appear in dashboard → publish toggle → appear in feed.
3. Watch → increment views + push watch history (**view increment not implemented**).
4. Comment / like / subscribe / save to playlist.
5. Create tweet on channel.
6. Manage playlists.

### Notifications / payments / reports

- **Not in backend.** Do not build UI that pretends they exist.
- “Reports” ≈ dashboard stats only.

---

## 13. Recommended Architecture

Preserve the current layout: `routes → controllers → models → utils`.

**Minimum necessary improvements (no rewrite):**

1. Keep controllers for HTTP mapping; extract **small helpers** only when duplication appears (e.g. `getTokens(userId)` already exists).
2. Add **one** `src/middlewares/error.middleware.js` and register last in `app.js`.
3. Add **one** validation approach (even simple Joi/Zod or a thin `validate` middleware) — do not mix three libraries.
4. Export JWT as `verifyJWT` **and** keep `varifyJWT` as an alias if needed for user routes (avoid breaking either import).
5. Fix schema field names with a **one-time** Mongoose path rename (`refreshToken`); document as a data migration note (existing `refrshToken` values if any).
6. Store Cloudinary `public_id` when implementing video delete.
7. Do **not** add Nest, Prisma, Redis, GraphQL, or a new API version for these fixes.
8. Frontend: later SPA (React/Vite or similar) talking to `/api/v1` with credentials; not part of this audit phase.

---

## 14. Implementation Roadmap

### PHASE 1 — Backend fixes

- **Objective:** Process starts; auth cookies/JWT and user profile mutations work; errors are JSON.
- **Tasks:** Unify `verifyJWT` export; fix cookies; rename `refreshToken`; fix refresh/logout/avatar `$set`; error middleware; `public/temp`; `.env.example`; healthcheck; Cloudinary export alias; ObjectId `new`; subscription model name; login cookie `secure` based on env.
- **Dependencies:** None.
- **Files likely to change:** `auth.middleware.js`, all `*.routes.js` imports, `user.model.js`, `user.controller.js`, `app.js`, `cloudinary.js`, `subscription.model.js`, `healthcheck.controller.js`, `index.js`.
- **Verification:** `npm run dev` listens; GET healthcheck 200; register/login/refresh/logout/current_user/avatar round-trip against local Mongo.

### PHASE 2 — Backend completion

- **Objective:** Implement every existing route contract (videos → comments/likes/subs → playlists/tweets → dashboard → watch history write).
- **Tasks:** Fill TODO controllers; ownership checks; unique indexes; fix subscription param names **without silently swapping API meaning** — prefer matching controller to route and documenting if clients expected the other behavior (there are no clients yet).
- **Dependencies:** Phase 1.
- **Files likely to change:** all domain controllers, models (indexes, required owner), possibly routes only if param names must stay.
- **Verification:** Manual or scripted HTTP for each row in the API inventory returns coherent `ApiResponse` / `ApiError`.

### PHASE 3 — Backend testing

- **Objective:** Automated confidence on auth and IDOR.
- **Tasks:** Add test runner (e.g. Vitest/Jest + Supertest); in-memory or test Mongo; tests listed in section 11.
- **Dependencies:** Phase 2 for domain tests; Phase 1 for auth tests.
- **Files likely to change:** `package.json`, new `tests/` or `src/**/*.test.js`.
- **Verification:** `npm test` green in CI-like local run.

### PHASE 4 — Frontend foundation

- **Objective:** SPA skeleton, routing, API client, auth header/cookie handling.
- **Tasks:** App shell, env `VITE_API_BASE_URL`, error/hanging-request timeouts.
- **Dependencies:** Phase 1 at minimum (login). Prefer Phase 2 for real pages.
- **Files likely to change:** new frontend package (sibling or `frontend/`).
- **Verification:** App loads; API base reachable; 401 handling.

### PHASE 5 — Authentication frontend

- **Objective:** Register, login, logout, refresh, profile, password, avatar/cover.
- **Dependencies:** Phase 1 + 4.
- **Files:** auth pages, protected route wrapper.
- **Verification:** Full auth loop in browser.

### PHASE 6 — Core frontend modules

- **Objective:** Watch, upload, comments, likes, subscribe, playlists, tweets, history.
- **Dependencies:** Phase 2 + 5.
- **Verification:** User journeys in browser against real API (no mock APIs).

### PHASE 7 — Dashboards

- **Objective:** Channel stats and video table from `/dashboard/*`.
- **Dependencies:** Phase 2 dashboard + Phase 6.
- **Verification:** Stats match DB for a seeded user.

### PHASE 8 — API integration

- **Objective:** Tighten client types to actual payloads; loading/empty/error states; pagination.
- **Dependencies:** Phases 6–7.
- **Verification:** No placeholder/mock data; all screens use live endpoints.

### PHASE 9 — End-to-end testing

- **Objective:** Playwright/Cypress critical paths.
- **Dependencies:** Phase 8.
- **Verification:** CI e2e on register → upload → watch → comment.

### PHASE 10 — Security/performance

- **Objective:** Rate limit, helmet, upload limits, indexes, `npm audit`, no PII logs, cookie flags.
- **Dependencies:** Stable API (Phase 2).
- **Verification:** Audit checklist; load test list endpoint.

### PHASE 11 — Production/deployment

- **Objective:** Dockerfile, process env, HTTPS, Cloudinary prod, Mongo prod, reverse proxy.
- **Dependencies:** Phases 3 and 10.
- **Verification:** Healthcheck on deployed URL; secrets only in host env.

---

## Local run reference (non-destructive)

```bash
npm install
# create .env (never commit). Required names listed in section 3.
mkdir -p public/temp
npm run dev
```

There is no seed, migrate, test, or build command today.

---

## Audit constraints (this phase)

- No code was modified except the creation of this file.
- No frontend work was started.
- No secrets were copied from environment files.
- Endpoints were **not** marked COMPLETE because they were not executed and static review found blocking defects.
