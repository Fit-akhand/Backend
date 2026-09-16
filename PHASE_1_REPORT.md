# PHASE 1 REPORT — Backend Stabilization

**Date:** 2026-09-15  
**Scope:** Boot, JWT/cookies, refresh tokens, user avatar/cover, watch-history **read**, error middleware, healthcheck, Mongo startup behavior, minimal tests.  
**Out of scope:** Videos, comments, likes, tweets, subscriptions, playlists, dashboard, frontend.

---

## 1. Problems found (baseline)

Attempted to import the Express app before any fixes:

```text
SyntaxError: The requested module '../middlewares/auth.middleware.js'
does not provide an export named 'verifyJWT'
    at src/routes/tweet.routes.js:8
```

That matches `PROJECT_AUDIT.md`. Additional issues confirmed in code:

| ID | Problem |
| -- | ------- |
| B1 | `verifyJWT` vs `varifyJWT` boot failure |
| B2 | `req.cokkies` in auth middleware |
| B3 | User schema field `refrshToken` vs code `refreshToken` |
| B4 | `req.cookie` in refresh handler |
| B5 | Refresh destructure `newrefreshToken` (always undefined) |
| B6 | Refresh JSON body used literal `"newrefreshToken"` |
| B7 | Logout did not clear `refreshToken` cookie |
| B8 | Avatar/cover `$set: urlString` (invalid update) |
| B9 | Watch history `mongoose.Types.ObjectId()` without `new` |
| B10 | Watch history `$lookup` collection `"user"` instead of `"users"` |
| B12 | Video controller import `uploadOnCloudinary` (boot-blocking after JWT fix) |
| B14 | Healthcheck handler never sent a response |
| B15 | No Express error middleware |
| B16 | User schema used `require` instead of `required` |
| B17 | `password.unique` |
| B21 | Login cookies always `secure: true` (breaks local HTTP) |
| Extra | Refresh JWTs issued in the same second were identical (`_id` only), so rotation could not be detected |

Atlas from this environment: `querySrv ECONNREFUSED _mongodb._tcp.cluster0.dhoranm.mongodb.net` (network/DNS, not an application logic bug).

---

## 2. Files changed

- `src/middlewares/auth.middleware.js`
- `src/middlewares/error.middleware.js` **(new)**
- `src/middlewares/multer.middleware.js`
- `src/models/user.model.js`
- `src/controllers/user.controller.js`
- `src/controllers/healthcheck.controller.js`
- `src/routes/user.routes.js`
- `src/utils/cloudinary.js`
- `src/utils/cookieOptions.js` **(new)**
- `src/app.js`
- `src/index.js`
- `src/db/index.js`
- `package.json`
- `.env.example` **(new)**
- `tests/phase1.test.js` **(new)**
- `PHASE_1_REPORT.md` **(this file)**

DevDependencies added: `supertest`, `mongodb-memory-server`.

---

## 3. What was fixed

### Boot

- Canonical export is `verifyJWT`. User routes now import that name.
- Cloudinary helper still exports `uplodeonCloudinary` and also `uploadOnCloudinary` (alias) so `video.controller.js` can load. Video **business logic was not implemented**.

### JWT / cookies

- Tokens read from `req.cookies.accessToken` or `Authorization: Bearer`.
- Invalid/expired/missing tokens return 401 with a generic message (no JWT library details).
- `req.user` is loaded without `password` or `refreshToken`.

### Refresh token field

- Canonical schema field: **`refreshToken`**.
- Login persists the refresh token, returns it in JSON, and sets httpOnly cookies.
- Refresh reads `req.cookies.refreshToken` or `req.body.refreshToken`, compares to the stored value, rotates, and returns the **actual** new token.
- Refresh JWTs include a `jwtid` so two tokens issued in the same second are distinct.
- Logout `$unset`s `refreshToken` and clears **both** cookies.

### Cookie flags

- `httpOnly: true`
- `secure` only when `NODE_ENV === "production"`
- `sameSite: "lax"`

### Avatar / cover

- `$set: { avatar: avatar.url }` and `$set: { coverImage: coverImage.url }`
- Response includes the updated user (still without password/refreshToken)
- Cloudinary helper: skip real upload when `NODE_ENV === "test"`; alias export; local file unlink is guarded with `existsSync`

### Watch-history **read**

- `new mongoose.Types.ObjectId(req.user._id)`
- Owner lookup collection `users`
- Empty history returns `[]` instead of throwing
- User schema `watchHistory` ref is `"Video"`
- **Write-on-view is still missing** (no video module in this phase)

### Error handling / healthcheck / Mongo

- Central `errorHandler` after routes; shape matches `{ statusCode, data, success, message, errors }`
- Stack traces only when not production; generic 500 message in production
- `GET /api/v1/healthcheck` is public and returns `{ status: "OK" }`
- Mongoose `serverSelectionTimeoutMS: 10000` so a dead Mongo host fails instead of hanging indefinitely
- Failed connect still logs and `process.exit(1)` (existing pattern)

### Other small auth-related schema fixes

- `required` instead of `require` on user fields
- Removed `unique` on `password`

---

## 4. API behavior changes

Existing paths were **not renamed** (`/avater`, `/History`, `/change_password` remain).

| Change | Compatibility |
| ------ | ------------- |
| Refresh body now returns the real `refreshToken` string instead of `"newrefreshToken"` | Breaking for any client that depended on the literal (none exist) |
| Avatar/cover success `data` is the user object, not `{}` | Additive |
| Cookies `secure` is false outside production | Local HTTP clients can store cookies |
| Logout also clears `refreshToken` cookie | Additive |
| Register rejects missing (`undefined`) fields, not only empty strings | Stricter 400 |
| Login requires `password` | Stricter 400 |
| Error JSON always includes `success: false` via middleware | New consistency for thrown `ApiError` |

---

## 5. Tests added

`tests/phase1.test.js` using Node’s built-in test runner + Supertest + MongoMemoryServer.

Covers: app export, healthcheck, register (valid/invalid/duplicate/hash), login, cookies, missing/invalid/expired JWT, current user (header + cookie), refresh rotation + reuse rejection, avatar, cover, watch-history read, logout, error payload.

Cloudinary is stubbed when `NODE_ENV=test`.

---

## 6. Commands used for verification

```bash
node --input-type=module -e "import('./src/app.js')..."   # baseline + post-fix import
npm install --save-dev supertest mongodb-memory-server
npm test
# memory-mongo spawn of src/index.js + fetch /api/v1/healthcheck
# connentDB against mongodb://127.0.0.1:1
```

Scripts:

- Dev: `npm run dev`
- Start: `npm start`
- Test: `npm test`

---

## 7. Test results

```text
# tests 18
# pass 18
# fail 0
```

---

## 8. Remaining problems

- Domain modules still empty (videos, comments, likes, tweets, subscriptions, playlists, dashboard). Calling those routes still hangs because handlers never send a response.
- Subscription model name `"Subscription "` (trailing space) still wrong for `$lookup: "subscriptions"`.
- Watch-history **write** (on video view) is not implemented.
- No real Cloudinary upload in tests; production Cloudinary not exercised here.
- Configured Atlas cluster was **not reachable** from this environment (`querySrv ECONNREFUSED`).
- Unused dependency `cookie-parse` remains.
- `npm audit` reported vulnerabilities (not addressed in Phase 1).
- `connentDB` still `process.exit(1)` internally, so `index.js` `.catch` is mostly unreachable.
- No rate limiting, RBAC, password reset, or OpenAPI (intentionally later).

---

## 9. Anything that could not be verified

| Item | Status | Why |
| ---- | ------ | --- |
| App import after JWT fix | VERIFIED | `APP_IMPORT_OK` |
| HTTP listen + healthcheck | VERIFIED | Memory Mongo on port 8010, status 200 |
| Atlas / `.env` MongoDB | NOT VERIFIED | SRV lookup `ECONNREFUSED` from this environment |
| Real Cloudinary uploads | NOT VERIFIED | Tests stub uploads when `NODE_ENV=test` |
| Browser cookie `secure`/`sameSite` behavior | NOT VERIFIED | No frontend / browser run |
| Watch-history populated with videos | NOT VERIFIED | No video write API yet; empty array verified |

---

## 10. Recommended Phase 2 tasks

1. Implement existing video routes (publish, list, get, update, delete, publish toggle) with **owner checks**.
2. Increment views + append watch history on get-video.
3. Comments, likes, subscriptions (fix model name + route params), playlists, tweets, dashboard.
4. Stop empty controllers from hanging (always `res.json` or throw `ApiError`).
5. Keep `/api/v1` contracts; document any breaking change before changing paths.

---

## Status legend for Phase 1 items

| Item | Code | Runtime |
| ---- | ---- | ------- |
| JWT import mismatch | FIXED | VERIFIED |
| App starts (memory Mongo) | FIXED | VERIFIED |
| Healthcheck | FIXED | VERIFIED |
| JWT auth | FIXED | VERIFIED |
| Cookies | FIXED | VERIFIED (Supertest) |
| Refresh token field + flow | FIXED | VERIFIED |
| Login / logout / current user | FIXED | VERIFIED |
| Avatar / cover DB update | FIXED | VERIFIED (stub storage) |
| Watch-history read | FIXED | VERIFIED (empty list) |
| Watch-history write | REMAINING | NOT VERIFIED |
| Error middleware | FIXED | VERIFIED |
| Mongo failure surfacing | FIXED (timeout + exit 1) | VERIFIED against `127.0.0.1:1` |
| Configured Atlas | REMAINING / env | NOT VERIFIED |
