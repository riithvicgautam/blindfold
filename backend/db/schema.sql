-- Blindfold database schema. Safe to run more than once.
CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TABLE IF NOT EXISTS users (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  username       TEXT NOT NULL UNIQUE,
  email          TEXT NOT NULL UNIQUE,
  password_hash  TEXT NOT NULL,
  display_name   TEXT,
  avatar_url     TEXT,
  email_verified BOOLEAN NOT NULL DEFAULT false,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at     TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Single-use, hashed password reset tokens.
CREATE TABLE IF NOT EXISTS password_reset_tokens (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  token_hash TEXT NOT NULL UNIQUE,
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- One row per blindfold game played by a signed-in user.
CREATE TABLE IF NOT EXISTS study_sessions (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id      UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  started_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
  ended_at     TIMESTAMPTZ,
  moves_played INTEGER NOT NULL DEFAULT 0 CHECK (moves_played >= 0),
  hints_used   INTEGER NOT NULL DEFAULT 0 CHECK (hints_used >= 0),
  accuracy     NUMERIC(5,2) CHECK (accuracy BETWEEN 0 AND 100)
);
CREATE INDEX IF NOT EXISTS study_sessions_user_started_idx ON study_sessions (user_id, started_at DESC);

-- Coach hints requested during a session.
CREATE TABLE IF NOT EXISTS review_events (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  session_id    UUID REFERENCES study_sessions(id) ON DELETE SET NULL,
  event_type    TEXT NOT NULL,
  correct       BOOLEAN NOT NULL DEFAULT false,
  hint_used     BOOLEAN NOT NULL DEFAULT false,
  response_time INTEGER NOT NULL DEFAULT 0 CHECK (response_time >= 0),
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS review_events_user_created_idx ON review_events (user_id, created_at DESC);
