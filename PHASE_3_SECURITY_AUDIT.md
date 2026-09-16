# PHASE 3 SECURITY AUDIT

Reviewed against the implemented Phase 3 code. No exploits were performed.

## Findings (current)

| Severity | Location | Problem | Impact | Fix | Verification |
| -------- | -------- | ------- | ------ | --- | ------------ |
| Medium | `POST /users/login` | Invalid credentials still return **404** (legacy contract) | Username/email enumeration | Prefer 401 in a documented API version bump | Tests still expect 404 |
| Medium | JWT access token | Logout does not denylist access tokens | Stolen access token works until expiry | Keep access TTL short (default 15m); password change invalidates via `passwordChangedAt` | Phase 3 test |
| Medium | User.refreshToken | Single stored refresh (one device) | New login kicks previous refresh session | Document; future refresh-token table | Code review |
| Low | Channel profile | Returns `email` | Email exposure to any logged-in user | Remove in a later compatible field hide | NOT changed (compat) |
| Low | Views | Incremented on every GET | Easy inflation | Future: per-user/session cap | Documented |
| Info | npm audit | 9 reported vulns (not blindly upgraded) | Supply-chain | Review in a dedicated upgrade PR | `npm audit` listed, not auto-fixed |
| Info | Atlas | Unreachable | Cannot attest prod DB | Network/DNS | BLOCKED |

## Mitigations implemented this phase

- Hashed refresh tokens at rest (SHA-256); client still receives JWT
- Dual compare supports leftover plaintext until re-login
- `password.select: false`
- Password change sets `passwordChangedAt` and clears refresh
- Helmet, CORS allowlist, configurable cookie flags
- Rate limits (auth/upload/general; skipped in tests)
- Mongo operator stripping on JSON bodies
- Sort/search field whitelist; regex escape fallback
- Pagination cap 50; watch history `$slice` 50
- Upload MIME + size + safe filenames
- Unpublished videos/comments/likes hidden from non-owners
- Unique indexes on likes/subscriptions
- Request IDs; no tokens/passwords in logs
- Production error responses omit stacks
- Removed unused `cookie-parse`

## Checklist

- [x] No secrets committed (`.env` gitignored; `.env.example` placeholders)
- [x] Passwords bcrypt (cost from env, 12 in production)
- [x] Hashes never returned / default `select: false`
- [x] JWT secrets from env; production length check
- [x] Refresh hashed at rest
- [x] Auth + owner checks
- [x] IDOR tests
- [x] Input validation on domain writes
- [x] No raw `$` from JSON body
- [x] No mass assignment on updates
- [x] Upload restrictions
- [x] CORS not `*` with credentials
- [x] httpOnly cookies
- [x] Rate limiting
- [x] Pagination bounded
- [x] Indexes for hot paths
- [x] Race: unique indexes + hashed refresh rotation
