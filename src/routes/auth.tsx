import { Link, createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";

import { AuthRequestError, useAuth } from "@/lib/auth/session";

type AuthSearch = { redirect?: string };

export const Route = createFileRoute("/auth")({
  validateSearch: (search: Record<string, unknown>): AuthSearch => {
    const raw = typeof search["redirect"] === "string" ? (search["redirect"] as string) : "";
    // Only same-origin relative paths are allowed.
    const safe = raw.startsWith("/") && !raw.startsWith("//") ? raw : undefined;
    return safe ? { redirect: safe } : {};
  },
  head: () => ({
    meta: [
      { title: "Sign in — Blindfold" },
      {
        name: "description",
        content:
          "Sign in to Blindfold to keep your visualization training, difficulty and game history with you.",
      },
      { property: "og:title", content: "Sign in to Blindfold" },
      {
        property: "og:description",
        content: "One quiet account for your boardless chess practice.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: AuthPage,
});

type Mode = "login" | "register";

function AuthPage() {
  const { redirect } = Route.useSearch();
  const navigate = useNavigate();
  const { user, status, login, register } = useAuth();

  const [mode, setMode] = useState<Mode>("login");
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string[]>>({});

  const destination = redirect ?? "/play";

  useEffect(() => {
    if (status === "authenticated" && user) {
      void navigate({ to: destination, replace: true });
    }
  }, [status, user, destination, navigate]);

  async function onSubmit(event: React.FormEvent) {
    event.preventDefault();
    setSubmitting(true);
    setFormError(null);
    setFieldErrors({});
    try {
      if (mode === "login") {
        await login({ email, password });
      } else {
        await register({ username, email, password });
      }
      void navigate({ to: destination, replace: true });
    } catch (error) {
      if (error instanceof AuthRequestError) {
        setFormError(error.message);
        if (error.details) setFieldErrors(error.details);
      } else {
        setFormError("Something went wrong. Please try again.");
      }
    } finally {
      setSubmitting(false);
    }
  }

  const fieldError = (name: string) => fieldErrors[name]?.[0];

  return (
    <main className="relative min-h-screen overflow-hidden">
      <div className="pointer-events-none absolute inset-x-0 top-0 h-[560px] halo" />

      <header className="relative mx-auto flex max-w-6xl items-center justify-between px-6 py-6">
        <Link to="/" className="flex items-center gap-2.5">
          <span className="grid size-7 place-items-center rounded-lg bg-secondary text-[13px] font-semibold text-primary">
            ♞
          </span>
          <span className="text-sm font-semibold tracking-tight">Blindfold</span>
        </Link>
        <Link
          to="/how-it-works"
          className="rounded-lg px-3 py-1.5 text-sm text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
        >
          How it works
        </Link>
      </header>

      <section className="relative mx-auto w-full max-w-[26rem] px-6 pt-16 pb-24">
        <div className="animate-fade text-center">
          <h1 className="text-3xl font-semibold tracking-[-0.02em]">
            {mode === "login" ? "Welcome back" : "Create your account"}
          </h1>
          <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
            {mode === "login"
              ? "Sign in to pick up your training where you left it."
              : "A single account to keep your blindfold practice together."}
          </p>
        </div>

        <form
          onSubmit={onSubmit}
          className="animate-rise mt-10 rounded-2xl border border-border bg-surface p-6 [animation-delay:60ms]"
        >
          {mode === "register" && (
            <Field label="Username" error={fieldError("username")}>
              <input
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                autoComplete="username"
                placeholder="capablanca"
                className="input-field"
              />
            </Field>
          )}

          <Field label="Email" error={fieldError("email")}>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoComplete="email"
              placeholder="you@example.com"
              className="input-field"
            />
          </Field>

          <Field label="Password" error={fieldError("password")}>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete={mode === "login" ? "current-password" : "new-password"}
              placeholder={mode === "login" ? "••••••••" : "At least 8 characters"}
              className="input-field"
            />
          </Field>

          {mode === "login" && (
            <p className="mt-3 text-right text-sm">
              <Link
                to="/forgot-password"
                className="text-muted-foreground underline underline-offset-4 transition-colors hover:text-foreground"
              >
                Forgot your password?
              </Link>
            </p>
          )}

          {formError && (
            <p className="mt-4 rounded-lg border border-border bg-background px-3 py-2 text-sm text-destructive">
              {formError}
            </p>
          )}

          <button
            type="submit"
            disabled={submitting}
            className="mt-6 w-full rounded-lg bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground transition-opacity hover:opacity-90 disabled:opacity-50"
          >
            {submitting
              ? "One moment…"
              : mode === "login"
                ? "Sign in"
                : "Create account"}
          </button>

          <p className="mt-5 text-center text-sm text-muted-foreground">
            {mode === "login" ? "New to Blindfold?" : "Already have an account?"}{" "}
            <button
              type="button"
              onClick={() => {
                setMode(mode === "login" ? "register" : "login");
                setFormError(null);
                setFieldErrors({});
              }}
              className="text-foreground underline underline-offset-4 transition-colors hover:text-primary"
            >
              {mode === "login" ? "Create an account" : "Sign in"}
            </button>
          </p>
        </form>

        <p className="mt-6 text-center text-xs text-muted-foreground">
          You can keep playing without an account — signing in just keeps your progress.
        </p>
      </section>
    </main>
  );
}

function Field({
  label,
  error,
  children,
}: {
  label: string;
  error?: string | undefined;
  children: React.ReactNode;
}) {
  return (
    <label className="mt-4 block first:mt-0">
      <span className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
        {label}
      </span>
      <div className="mt-2">{children}</div>
      {error && <span className="mt-1.5 block text-xs text-destructive">{error}</span>}
    </label>
  );
}
