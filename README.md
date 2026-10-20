# Blindfold

Design a premium modern web application for a project called "Blindfold".

The concept is that users play chess WITHOUT ever seeing the chessboard. The entire experience relies on imagination.

Style:

- Minimal

- Elegant

- Dark theme

- Inspired by Linear, Raycast, Vercel and Notion

- Professional, not cyberpunk or hacker

- Rounded corners

- Excellent spacing

- Clean typography

- Smooth subtle animations

Landing page:

- Large hero section

- Tagline:

  "Can you play chess without ever seeing the board?"

- Primary CTA: Start Playing

- Secondary CTA: How it Works

Game page:

- Left sidebar:

    Move history

    Game controls

- Center:

    Conversation-style gameplay where moves appear as messages.

    Example:

      White: e4

      Black is thinking...

      Black: c5

- Bottom:

    Large command input similar to Raycast/Terminal

    Placeholder:

    "Type your move... (e.g. Nf3)"

- Right sidebar:

    Current turn

    Difficulty

    Player names

    Game status

Use a premium design system.

Avoid neon colors, hacker aesthetics, glowing green terminals, or fake command prompt styling.

Make it feel like a real modern SaaS product.

Focus on typography, whitespace, and usability.

This project was built with [Lovable](https://lovable.dev).

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/0978259f-a581-4b2d-89bf-abaf9916e175).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Project structure

```
blindfold/
├── src/       → React frontend (TanStack Start + Vite). API helpers + engine in plain JS.
└── backend/   → Express + plain JavaScript + PostgreSQL (pg, parameterized SQL)
    ├── server.js / app.js   start-up, CORS, cookies, routes, error handler
    ├── config.js            every environment variable
    ├── db/                  pg pool, schema.sql, migrate.js
    ├── middleware/          auth.js (JWT), errors.js
    ├── routes/              auth, users, coach, sessions, analytics
    ├── services/            hints.js, penalties.js, ai.js, users.js, validate.js
    └── tests/               node:test suites
```

## Setup and run

```sh
npm install                          # frontend
npm run install:server               # backend
cp backend/.env.example backend/.env # set DATABASE_URL and JWT_SECRET
createdb blindfold
npm --prefix backend run db:migrate  # applies backend/db/schema.sql
npm run dev                          # frontend :8080 + backend :4000
```

Required: `DATABASE_URL`, `JWT_SECRET` (mandatory in production). Optional: `PORT`,
`CORS_ORIGINS`, `AI_PROVIDER` (`gemini` | `groq` | `none`), `GEMINI_API_KEY`, `GROQ_API_KEY`,
model names, `AI_TIMEOUT_MS`. Frontend: `VITE_API_URL` (default `http://localhost:4000/api`).

Tests: `TEST_DATABASE_URL=postgres://... npm run test:server` (API suite skips without a DB).

## Request flow

React → `src/lib/api/client.js` (fetch, `credentials: "include"`) → Express route →
`requireAuth` verifies the JWT cookie → parameterized `pg` query → JSON → React.

## Coaching flow

1. Play page sends the FEN + question to `POST /api/coach/hint`.
2. `services/hints.js` loads the FEN in chess.js, finds the named piece (asks which one if several).
3. Clue by level: side of board → rank → file → exact square.
4. `services/penalties.js`: −2 broad, −5 rank/file, −10 exact, repeats free.
5. `services/ai.js` optionally rewords via Gemini/Groq; replies adding any coordinate, timeouts and
   errors fall back to the original clue. No key → original clue.
6. Signed-in players' hints are saved in `review_events`, linked to the game's `study_sessions` row.

The LLM never sees the board, never picks moves, and never calculates scores.
