# Blindfold — Fastify API

Standalone Node.js backend for Blindfold. Runs independently of the frontend and
is deployed to any standard Node host (Railway, Render, Fly.io, a VPS).

## Stack

Fastify 5 · TypeScript · PostgreSQL · Prisma · Zod · @fastify/jwt · @fastify/cookie ·
@fastify/cors · bcrypt · dotenv

## Layered architecture

```
Route → Controller → Service → Repository → Database
```

- `config/` — env parsing and validation (fails fast on bad config)
- `plugins/` — cors, cookie, jwt, prisma (Fastify plugins)
- `routes/` — wiring only
- `controllers/` — HTTP concerns: validation, cookies, status codes
- `services/` — all business rules
- `repositories/` — the only code that touches the database
- `middleware/` — authentication + centralized error handler
- `schemas/` — Zod request schemas
- `db/` — Prisma client
- `utils/`, `types/`

Business logic never lives in routes or controllers.

## Endpoints

| Method | Path                 | Auth | Description                 |
| ------ | -------------------- | ---- | --------------------------- |
| GET    | `/api/health`        | —    | Liveness probe              |
| POST   | `/api/auth/register` | —    | Create account, set session |
| POST   | `/api/auth/login`    | —    | Sign in, set session        |
| POST   | `/api/auth/logout`   | —    | Clear session cookie        |
| GET    | `/api/auth/me`       | JWT  | Current user context        |

The JWT is issued in an httpOnly, SameSite=Lax cookie (and also returned in the
body for non-browser clients). Protected routes use the `authenticate`
preHandler, which reads the cookie or an `Authorization: Bearer` header.

## Setup

```bash
cd server
cp .env.example .env      # set DATABASE_URL and a 32+ char JWT_SECRET
npm install
npm run prisma:migrate    # or: npm run prisma:deploy in production
npm run dev               # http://localhost:4000
```

## Production

```bash
npm run build && npm start
```
