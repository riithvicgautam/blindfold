# AGENTS.md

- Backend is a standalone Express app in `backend/` written in plain JavaScript with `pg` and parameterized SQL (no ORM, no TypeScript), because the project is meant to be simple to explain in an interview.
- Schema lives in `backend/db/schema.sql` and is applied with `npm --prefix backend run db:migrate`; keep it idempotent (`IF NOT EXISTS`).
- chess.js is the only source of truth for positions; hints and penalties are deterministic in `backend/services/`; the LLM may only reword an approved clue, and `isFaithful` rejects anything else.
- Auth uses a signed JWT in an httpOnly cookie (bearer header accepted as a fallback); protected routes use `requireAuth`.
- Frontend stays TanStack Start at the repo root (the preview needs it); API helpers and the engine are plain JS under `src/lib`, while UI and pages stay TSX so the build keeps working.
- All frontend HTTP calls go through `src/lib/api/client.js`.
