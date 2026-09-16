# Vidzora frontend

React + TypeScript + Vite SPA for **Vidzora — Watch. Create. Connect.**

Talks to the Express API at `VITE_API_BASE_URL` (default `http://localhost:8000/api/v1`).

```bash
cp .env.example .env
npm install
npm run dev
```

Runs on `http://localhost:3000`. CORS on the API must include that origin.

```bash
npm run lint
npm run typecheck
npm test
npm run build
```

See `../FRONTEND_ARCHITECTURE.md` and `../PHASE_6_REPORT.md`.
