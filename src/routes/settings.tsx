import { Link, createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";

import { EmptyState } from "@/components/common/EmptyState";
import { GhostButton } from "@/components/common/Field";
import { AppNav, PageHeader } from "@/components/common/PageHeader";
import { SectionCard } from "@/components/common/SectionCard";
import { SettingsSection } from "@/components/settings/SettingsSection";
import { useAuth } from "@/lib/auth/session";

export const Route = createFileRoute("/settings")({
  head: () => ({
    meta: [
      { title: "Settings — Blindfold" },
      {
        name: "description",
        content:
          "Tune Blindfold to your practice: appearance, theme, notification preferences, account and privacy.",
      },
      { property: "og:title", content: "Blindfold settings" },
      {
        property: "og:description",
        content: "Appearance, notifications, account and privacy preferences.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: SettingsPage,
});

type Theme = "dark" | "light" | "system";
type Prefs = {
  theme: Theme;
  reducedMotion: boolean;
  compactMoves: boolean;
  emailDigest: boolean;
  practiceReminders: boolean;
  publicProfile: boolean;
  shareAnalytics: boolean;
};

const DEFAULTS: Prefs = {
  theme: "dark",
  reducedMotion: false,
  compactMoves: false,
  emailDigest: true,
  practiceReminders: false,
  publicProfile: false,
  shareAnalytics: true,
};

const STORAGE_KEY = "blindfold:preferences";

function SettingsPage() {
  const { user, status, logout } = useAuth();
  const [prefs, setPrefs] = useState<Prefs>(DEFAULTS);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      if (raw) setPrefs({ ...DEFAULTS, ...(JSON.parse(raw) as Partial<Prefs>) });
    } catch {
      /* ignore malformed preferences */
    }
    setHydrated(true);
  }, []);

  function update<K extends keyof Prefs>(key: K, value: Prefs[K]) {
    setPrefs((current) => {
      const next = { ...current, [key]: value };
      try {
        window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      } catch {
        /* storage unavailable */
      }
      return next;
    });
    toast.success("Preference saved.");
  }

  return (
    <main className="relative min-h-screen overflow-hidden">
      <div className="pointer-events-none absolute inset-x-0 top-0 h-[420px] halo" />
      <AppNav />

      <div className="relative mx-auto w-full max-w-3xl px-6 pt-6 pb-24">
        <PageHeader
          eyebrow="Preferences"
          title="Settings"
          description="Small choices that shape how Blindfold feels while you train."
        />

        <div className="mt-8 grid gap-6">
          <SectionCard title="Appearance" description="Blindfold is designed dark-first.">
            <SettingsSection
              label="Theme"
              description="Light mode is on the roadmap; dark stays easiest on the eyes for long sessions."
              control={
                <div className="flex rounded-lg border border-border p-1">
                  {(["dark", "light", "system"] as const).map((theme) => (
                    <button
                      key={theme}
                      type="button"
                      disabled={theme !== "dark"}
                      onClick={() => update("theme", theme)}
                      className={`rounded-md px-3 py-1.5 text-sm capitalize transition-colors disabled:opacity-40 ${
                        prefs.theme === theme
                          ? "bg-secondary text-foreground"
                          : "text-muted-foreground hover:text-foreground"
                      }`}
                    >
                      {theme}
                    </button>
                  ))}
                </div>
              }
            />
            <SettingsSection
              label="Reduced motion"
              description="Fade and rise animations are muted throughout the app."
              control={
                <Toggle
                  checked={prefs.reducedMotion}
                  disabled={!hydrated}
                  onChange={(v) => update("reducedMotion", v)}
                  label="Reduced motion"
                />
              }
            />
            <SettingsSection
              label="Compact move list"
              description="Show move history in a denser two-column layout."
              control={
                <Toggle
                  checked={prefs.compactMoves}
                  disabled={!hydrated}
                  onChange={(v) => update("compactMoves", v)}
                  label="Compact move list"
                />
              }
            />
          </SectionCard>

          <SectionCard
            title="Notifications"
            description="Delivery isn't wired up yet — these choices are stored for when it is."
          >
            <SettingsSection
              label="Weekly digest"
              description="A short summary of your training every Monday."
              control={
                <Toggle
                  checked={prefs.emailDigest}
                  disabled={!hydrated}
                  onChange={(v) => update("emailDigest", v)}
                  label="Weekly digest"
                />
              }
            />
            <SettingsSection
              label="Practice reminders"
              description="A nudge when your streak is about to lapse."
              control={
                <Toggle
                  checked={prefs.practiceReminders}
                  disabled={!hydrated}
                  onChange={(v) => update("practiceReminders", v)}
                  label="Practice reminders"
                />
              }
            />
          </SectionCard>

          <SectionCard title="Account" description="Identity, email and password live on your profile.">
            {status === "authenticated" && user ? (
              <>
                <SettingsSection
                  label="Signed in as"
                  description={`@${user.username} · ${user.email}`}
                  control={
                    <Link
                      to="/profile"
                      className="rounded-lg border border-border bg-background px-4 py-2 text-sm transition-colors hover:bg-secondary"
                    >
                      Manage profile
                    </Link>
                  }
                />
                <SettingsSection
                  label="Session"
                  description="Sign out of Blindfold on this device."
                  control={
                    <GhostButton type="button" onClick={() => void logout()}>
                      Sign out
                    </GhostButton>
                  }
                />
              </>
            ) : (
              <EmptyState
                title="You're not signed in"
                description="Sign in to manage your account settings."
                action={
                  <Link
                    to="/auth"
                    search={{ redirect: "/settings" }}
                    className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground"
                  >
                    Sign in
                  </Link>
                }
              />
            )}
          </SectionCard>

          <SectionCard title="Privacy" description="Placeholders until sharing features ship.">
            <SettingsSection
              label="Public profile"
              description="Let others view your streak and accuracy by username."
              control={
                <Toggle
                  checked={prefs.publicProfile}
                  disabled={!hydrated}
                  onChange={(v) => update("publicProfile", v)}
                  label="Public profile"
                />
              }
            />
            <SettingsSection
              label="Share anonymised analytics"
              description="Helps tune difficulty curves. Never includes personal data."
              control={
                <Toggle
                  checked={prefs.shareAnalytics}
                  disabled={!hydrated}
                  onChange={(v) => update("shareAnalytics", v)}
                  label="Share anonymised analytics"
                />
              }
            />
          </SectionCard>
        </div>
      </div>
    </main>
  );
}

function Toggle({
  checked,
  onChange,
  label,
  disabled,
}: {
  checked: boolean;
  onChange: (value: boolean) => void;
  label: string;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      disabled={disabled}
      onClick={() => onChange(!checked)}
      className={`relative h-6 w-11 rounded-full border transition-colors disabled:opacity-50 ${
        checked ? "border-primary bg-primary/80" : "border-border bg-secondary"
      }`}
    >
      <span
        className={`absolute top-0.5 size-4 rounded-full bg-background transition-all ${
          checked ? "left-[1.4rem]" : "left-0.5"
        }`}
      />
    </button>
  );
}
