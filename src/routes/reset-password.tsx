import { Link, createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";

import { Field, PrimaryButton } from "@/components/common/Field";
import { AuthShell } from "@/routes/forgot-password";
import { authApi } from "@/lib/api/auth.service";
import { ApiError } from "@/lib/api/client";
import { resetPasswordSchema } from "@/lib/auth/validation";

type ResetSearch = { token?: string };

export const Route = createFileRoute("/reset-password")({
  validateSearch: (search: Record<string, unknown>): ResetSearch =>
    typeof search["token"] === "string" && search["token"]
      ? { token: search["token"] }
      : {},
  head: () => ({
    meta: [
      { title: "Choose a new password — Blindfold" },
      {
        name: "description",
        content: "Set a new Blindfold password using your secure reset link.",
      },
      { property: "og:title", content: "Choose a new Blindfold password" },
      {
        property: "og:description",
        content: "Finish resetting your password and return to training.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: ResetPasswordPage,
});

function ResetPasswordPage() {
  const { token } = Route.useSearch();
  const navigate = useNavigate();

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [errors, setErrors] = useState<Record<string, string[]>>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);

  if (!token) {
    return (
      <AuthShell
        title="This link is incomplete"
        subtitle="The reset link is missing its token. Request a fresh one and try again."
      >
        <div className="animate-rise rounded-2xl border border-border bg-surface p-6 text-center">
          <Link
            to="/forgot-password"
            className="inline-block rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-opacity hover:opacity-90"
          >
            Request a new link
          </Link>
        </div>
      </AuthShell>
    );
  }

  const resetToken: string = token;

  async function onSubmit(event: React.FormEvent) {
    event.preventDefault();
    const parsed = resetPasswordSchema.safeParse({ password, confirmPassword });
    if (!parsed.success) {
      const next: Record<string, string[]> = {};
      for (const issue of parsed.error.issues) {
        const key = String(issue.path[0] ?? "form");
        (next[key] ??= []).push(issue.message);
      }
      setErrors(next);
      return;
    }

    setErrors({});
    setFormError(null);
    setSubmitting(true);
    try {
      await authApi.resetPassword({ token, password: parsed.data.password });
      setDone(true);
      setTimeout(() => void navigate({ to: "/auth", search: {}, replace: true }), 2200);
    } catch (error) {
      if (error instanceof ApiError) {
        setFormError(error.message);
        if (error.details) setErrors(error.details);
      } else {
        setFormError("Something went wrong. Please try again.");
      }
    } finally {
      setSubmitting(false);
    }
  }

  if (done) {
    return (
      <AuthShell
        title="Password updated"
        subtitle="You can sign in with your new password now. Taking you to sign in…"
      >
        <div className="animate-rise rounded-2xl border border-border bg-surface p-6 text-center">
          <span className="mx-auto grid size-10 place-items-center rounded-xl bg-secondary text-primary">
            ✓
          </span>
          <Link
            to="/auth"
            search={{}}
            className="mt-6 inline-block rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-opacity hover:opacity-90"
          >
            Sign in
          </Link>
        </div>
      </AuthShell>
    );
  }

  return (
    <AuthShell
      title="Choose a new password"
      subtitle="Pick something you haven't used before. The link works once and expires after an hour."
    >
      <form
        onSubmit={onSubmit}
        className="animate-rise rounded-2xl border border-border bg-surface p-6"
      >
        <Field label="New password" error={errors["password"]?.[0]}>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoComplete="new-password"
            placeholder="At least 8 characters"
            className="input-field"
          />
        </Field>
        <Field label="Confirm password" error={errors["confirmPassword"]?.[0]} className="mt-4">
          <input
            type="password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            autoComplete="new-password"
            placeholder="••••••••"
            className="input-field"
          />
        </Field>

        {formError && (
          <p className="mt-4 rounded-lg border border-border bg-background px-3 py-2 text-sm text-destructive">
            {formError}
          </p>
        )}

        <PrimaryButton type="submit" disabled={submitting} className="mt-6 w-full py-2.5">
          {submitting ? "Updating…" : "Update password"}
        </PrimaryButton>
      </form>
    </AuthShell>
  );
}
