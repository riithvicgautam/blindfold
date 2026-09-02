import { Link, createFileRoute } from "@tanstack/react-router";
import { useState } from "react";

import { Field, PrimaryButton } from "@/components/common/Field";
import { authApi } from "@/lib/api/auth.service";
import { ApiError } from "@/lib/api/client";
import { forgotPasswordSchema } from "@/lib/auth/validation";

export const Route = createFileRoute("/forgot-password")({
  head: () => ({
    meta: [
      { title: "Forgot your password — Blindfold" },
      {
        name: "description",
        content:
          "Request a Blindfold password reset link and get back to your visualization training.",
      },
      { property: "og:title", content: "Reset your Blindfold password" },
      {
        property: "og:description",
        content: "Send yourself a secure link to choose a new password.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: ForgotPasswordPage,
});

function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [error, setError] = useState<string | undefined>();
  const [sent, setSent] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  async function onSubmit(event: React.FormEvent) {
    event.preventDefault();
    const parsed = forgotPasswordSchema.safeParse({ email });
    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message);
      return;
    }

    setError(undefined);
    setSubmitting(true);
    try {
      await authApi.forgotPassword(parsed.data);
      setSent(true);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Something went wrong. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <AuthShell
      title={sent ? "Check your inbox" : "Forgot your password?"}
      subtitle={
        sent
          ? "If an account exists for that address, a reset link is on its way. The link expires in one hour."
          : "Enter the email you signed up with and we'll send you a link to choose a new password."
      }
    >
      {sent ? (
        <div className="animate-rise rounded-2xl border border-border bg-surface p-6 text-center">
          <span className="mx-auto grid size-10 place-items-center rounded-xl bg-secondary text-primary">
            ✓
          </span>
          <p className="mt-4 text-sm leading-relaxed text-muted-foreground">
            Didn't get anything? Check spam, or{" "}
            <button
              type="button"
              onClick={() => setSent(false)}
              className="text-foreground underline underline-offset-4 hover:text-primary"
            >
              try another address
            </button>
            .
          </p>
          <Link
            to="/auth"
            search={{}}
            className="mt-6 inline-block rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-opacity hover:opacity-90"
          >
            Back to sign in
          </Link>
        </div>
      ) : (
        <form
          onSubmit={onSubmit}
          className="animate-rise rounded-2xl border border-border bg-surface p-6"
        >
          <Field label="Email" error={error}>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoComplete="email"
              placeholder="you@example.com"
              className="input-field"
            />
          </Field>
          <PrimaryButton type="submit" disabled={submitting} className="mt-6 w-full py-2.5">
            {submitting ? "Sending…" : "Send reset link"}
          </PrimaryButton>
          <p className="mt-5 text-center text-sm text-muted-foreground">
            Remembered it?{" "}
            <Link
              to="/auth"
              search={{}}
              className="text-foreground underline underline-offset-4 hover:text-primary"
            >
              Sign in
            </Link>
          </p>
        </form>
      )}
    </AuthShell>
  );
}

export function AuthShell({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle: string;
  children: React.ReactNode;
}) {
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
          <h1 className="text-3xl font-semibold tracking-[-0.02em]">{title}</h1>
          <p className="mt-3 text-sm leading-relaxed text-muted-foreground">{subtitle}</p>
        </div>
        <div className="mt-10">{children}</div>
      </section>
    </main>
  );
}
