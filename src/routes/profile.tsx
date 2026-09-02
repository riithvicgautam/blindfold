import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";

import { EmptyState } from "@/components/common/EmptyState";
import { DangerButton, Field, GhostButton, PrimaryButton } from "@/components/common/Field";
import { SkeletonLines } from "@/components/common/LoadingSkeleton";
import { AppNav, PageHeader } from "@/components/common/PageHeader";
import { SectionCard } from "@/components/common/SectionCard";
import { Avatar, ProfileHeader } from "@/components/profile/ProfileHeader";
import { ApiError } from "@/lib/api/client";
import { userApi } from "@/lib/api/user.service";
import { useAuth } from "@/lib/auth/session";
import {
  changePasswordSchema,
  emailChangeSchema,
  profileSchema,
} from "@/lib/auth/validation";

export const Route = createFileRoute("/profile")({
  head: () => ({
    meta: [
      { title: "Your profile — Blindfold" },
      {
        name: "description",
        content:
          "Manage your Blindfold identity: display name, username, avatar, email address and password.",
      },
      { property: "og:title", content: "Your Blindfold profile" },
      {
        property: "og:description",
        content: "Update your name, avatar, email and password in one calm place.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: ProfilePage,
});

type Errors = Record<string, string[]>;

function firstError(errors: Errors, key: string): string | undefined {
  return errors[key]?.[0];
}

function ProfilePage() {
  const { user, status, setUser, logout } = useAuth();
  const navigate = useNavigate();

  if (status === "loading") {
    return (
      <Shell>
        <SkeletonLines lines={6} />
      </Shell>
    );
  }

  if (!user) {
    return (
      <Shell>
        <EmptyState
          title="Sign in to view your profile"
          description="Your profile lives with your account."
          action={
            <Link
              to="/auth"
              search={{ redirect: "/profile" }}
              className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground"
            >
              Sign in
            </Link>
          }
        />
      </Shell>
    );
  }

  return (
    <Shell>
      <ProfileHeader user={user} />
      <div className="mt-6 grid gap-6">
        <IdentityCard />
        <EmailCard />
        <PasswordCard />
        <DangerZone
          onDeleted={async () => {
            setUser(null);
            await navigate({ to: "/", replace: true });
          }}
          onLogout={logout}
        />
      </div>
    </Shell>
  );
}

function Shell({ children }: { children: React.ReactNode }) {
  return (
    <main className="relative min-h-screen overflow-hidden">
      <div className="pointer-events-none absolute inset-x-0 top-0 h-[420px] halo" />
      <AppNav />
      <div className="relative mx-auto w-full max-w-3xl px-6 pt-6 pb-24">
        <PageHeader
          eyebrow="Account"
          title="Your profile"
          description="How you appear inside Blindfold, and the credentials that keep your progress yours."
        />
        <div className="mt-8">{children}</div>
      </div>
    </main>
  );
}

function IdentityCard() {
  const { user, setUser } = useAuth();
  const fileInput = useRef<HTMLInputElement>(null);

  const [username, setUsername] = useState(user?.username ?? "");
  const [displayName, setDisplayName] = useState(user?.displayName ?? "");
  const [avatarUrl, setAvatarUrl] = useState<string | null>(user?.avatarUrl ?? null);
  const [errors, setErrors] = useState<Errors>({});
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!user) return;
    setUsername(user.username);
    setDisplayName(user.displayName ?? "");
    setAvatarUrl(user.avatarUrl ?? null);
  }, [user]);

  if (!user) return null;

  const dirty =
    username !== user.username ||
    (displayName || "") !== (user.displayName ?? "") ||
    avatarUrl !== (user.avatarUrl ?? null);

  function onPickAvatar(file: File) {
    if (!file.type.startsWith("image/")) {
      toast.error("Please choose an image file.");
      return;
    }
    if (file.size > 300_000) {
      toast.error("That image is too large — pick one under 300 KB.");
      return;
    }
    const reader = new FileReader();
    reader.onload = () => setAvatarUrl(String(reader.result));
    reader.readAsDataURL(file);
  }

  async function onSave(event: React.FormEvent) {
    event.preventDefault();
    const parsed = profileSchema.safeParse({ username, displayName: displayName || undefined });
    if (!parsed.success) {
      setErrors(fieldErrorsOf(parsed.error.issues));
      return;
    }

    setErrors({});
    setSaving(true);
    try {
      const { user: updated } = await userApi.updateProfile({
        username: parsed.data.username,
        displayName: parsed.data.displayName ?? null,
        avatarUrl,
      });
      setUser(updated);
      toast.success("Profile updated.");
    } catch (error) {
      handleApiError(error, setErrors);
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={onSave}>
      <SectionCard
        title="Identity"
        description="Your public handle and how your name is displayed."
        footer={
          <>
            <GhostButton
              type="button"
              disabled={!dirty || saving}
              onClick={() => {
                setUsername(user.username);
                setDisplayName(user.displayName ?? "");
                setAvatarUrl(user.avatarUrl ?? null);
                setErrors({});
              }}
            >
              Reset
            </GhostButton>
            <PrimaryButton type="submit" disabled={!dirty || saving}>
              {saving ? "Saving…" : "Save changes"}
            </PrimaryButton>
          </>
        }
      >
        <div className="flex flex-wrap items-center gap-5">
          <Avatar user={{ ...user, avatarUrl }} />
          <div className="flex flex-wrap gap-2">
            <GhostButton type="button" onClick={() => fileInput.current?.click()}>
              Upload avatar
            </GhostButton>
            {avatarUrl && (
              <GhostButton type="button" onClick={() => setAvatarUrl(null)}>
                Remove
              </GhostButton>
            )}
            <input
              ref={fileInput}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) onPickAvatar(file);
                e.target.value = "";
              }}
            />
          </div>
        </div>

        <div className="mt-6 grid gap-4 sm:grid-cols-2">
          <Field label="Username" error={firstError(errors, "username")}>
            <input
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              autoComplete="username"
              className="input-field"
            />
          </Field>
          <Field
            label="Display name"
            hint="Optional — shown instead of your username."
            error={firstError(errors, "displayName")}
          >
            <input
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              placeholder="José Raúl"
              className="input-field"
            />
          </Field>
        </div>
      </SectionCard>
    </form>
  );
}

function EmailCard() {
  const { user, setUser } = useAuth();
  const [email, setEmail] = useState(user?.email ?? "");
  const [currentPassword, setCurrentPassword] = useState("");
  const [errors, setErrors] = useState<Errors>({});
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (user) setEmail(user.email);
  }, [user]);

  if (!user) return null;

  async function onSubmit(event: React.FormEvent) {
    event.preventDefault();
    const parsed = emailChangeSchema.safeParse({ email, currentPassword });
    if (!parsed.success) {
      setErrors(fieldErrorsOf(parsed.error.issues));
      return;
    }

    setErrors({});
    setSaving(true);
    try {
      const { user: updated } = await userApi.updateEmail(parsed.data);
      setUser(updated);
      setCurrentPassword("");
      toast.success("Email updated. Verification will be added soon.");
    } catch (error) {
      handleApiError(error, setErrors);
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={onSubmit}>
      <SectionCard
        title="Email address"
        description="Used for signing in and, later, for verification and password resets."
        footer={
          <PrimaryButton type="submit" disabled={saving}>
            {saving ? "Updating…" : "Update email"}
          </PrimaryButton>
        }
      >
        <div className="grid gap-4 sm:grid-cols-2">
          <Field
            label="Email"
            error={firstError(errors, "email")}
            hint={user.emailVerified ? "Verified" : "Not verified yet"}
          >
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoComplete="email"
              className="input-field"
            />
          </Field>
          <Field label="Current password" error={firstError(errors, "currentPassword")}>
            <input
              type="password"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              autoComplete="current-password"
              placeholder="••••••••"
              className="input-field"
            />
          </Field>
        </div>
      </SectionCard>
    </form>
  );
}

function PasswordCard() {
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [errors, setErrors] = useState<Errors>({});
  const [saving, setSaving] = useState(false);

  async function onSubmit(event: React.FormEvent) {
    event.preventDefault();
    const parsed = changePasswordSchema.safeParse({
      currentPassword,
      newPassword,
      confirmPassword,
    });
    if (!parsed.success) {
      setErrors(fieldErrorsOf(parsed.error.issues));
      return;
    }

    setErrors({});
    setSaving(true);
    try {
      await userApi.changePassword({
        currentPassword: parsed.data.currentPassword,
        newPassword: parsed.data.newPassword,
      });
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      toast.success("Password changed.");
    } catch (error) {
      handleApiError(error, setErrors);
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={onSubmit}>
      <SectionCard
        title="Password"
        description="Changing your password invalidates any outstanding reset links."
        footer={
          <PrimaryButton type="submit" disabled={saving}>
            {saving ? "Saving…" : "Change password"}
          </PrimaryButton>
        }
      >
        <div className="grid gap-4 sm:grid-cols-3">
          <Field label="Current" error={firstError(errors, "currentPassword")}>
            <input
              type="password"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              autoComplete="current-password"
              className="input-field"
            />
          </Field>
          <Field label="New" error={firstError(errors, "newPassword")}>
            <input
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              autoComplete="new-password"
              className="input-field"
            />
          </Field>
          <Field label="Confirm" error={firstError(errors, "confirmPassword")}>
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              autoComplete="new-password"
              className="input-field"
            />
          </Field>
        </div>
      </SectionCard>
    </form>
  );
}

function DangerZone({
  onDeleted,
  onLogout,
}: {
  onDeleted: () => Promise<void>;
  onLogout: () => Promise<void>;
}) {
  const [confirming, setConfirming] = useState(false);
  const [password, setPassword] = useState("");
  const [errors, setErrors] = useState<Errors>({});
  const [busy, setBusy] = useState(false);

  async function onDelete(event: React.FormEvent) {
    event.preventDefault();
    if (!password) {
      setErrors({ currentPassword: ["Enter your password to confirm."] });
      return;
    }
    setBusy(true);
    try {
      await userApi.deleteAccount({ currentPassword: password });
      toast.success("Your account has been deleted.");
      await onDeleted();
    } catch (error) {
      handleApiError(error, setErrors);
    } finally {
      setBusy(false);
    }
  }

  return (
    <SectionCard
      title="Danger zone"
      description="Sign out of this device, or permanently remove your account and all training data."
      className="border-destructive/30"
    >
      <div className="flex flex-wrap items-center gap-3">
        <GhostButton type="button" onClick={() => void onLogout()}>
          Sign out
        </GhostButton>
        {!confirming && (
          <DangerButton type="button" onClick={() => setConfirming(true)}>
            Delete account
          </DangerButton>
        )}
      </div>

      {confirming && (
        <form onSubmit={onDelete} className="mt-5 rounded-xl border border-destructive/30 p-4">
          <p className="text-sm text-muted-foreground">
            This cannot be undone. Enter your password to confirm.
          </p>
          <div className="mt-4 flex flex-wrap items-end gap-3">
            <Field
              label="Password"
              error={firstError(errors, "currentPassword")}
              className="min-w-[14rem] flex-1"
            >
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete="current-password"
                className="input-field"
              />
            </Field>
            <div className="flex gap-2">
              <GhostButton
                type="button"
                onClick={() => {
                  setConfirming(false);
                  setPassword("");
                  setErrors({});
                }}
              >
                Cancel
              </GhostButton>
              <DangerButton type="submit" disabled={busy}>
                {busy ? "Deleting…" : "Delete forever"}
              </DangerButton>
            </div>
          </div>
        </form>
      )}
    </SectionCard>
  );
}

function fieldErrorsOf(issues: { path: (string | number)[]; message: string }[]): Errors {
  const out: Errors = {};
  for (const issue of issues) {
    const key = String(issue.path[0] ?? "form");
    (out[key] ??= []).push(issue.message);
  }
  return out;
}

function handleApiError(error: unknown, setErrors: (errors: Errors) => void) {
  if (error instanceof ApiError) {
    if (error.details) setErrors(error.details);
    toast.error(error.message);
    return;
  }
  toast.error("Something went wrong. Please try again.");
}
