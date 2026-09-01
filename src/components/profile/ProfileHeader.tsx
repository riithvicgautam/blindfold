import { displayNameOf, initialsOf, type PublicUser } from "@/lib/auth/validation";

/** Avatar + identity summary shown at the top of the profile page. */
export function ProfileHeader({ user, action }: { user: PublicUser; action?: React.ReactNode }) {
  const joined = new Date(user.createdAt).toLocaleDateString(undefined, {
    month: "long",
    year: "numeric",
  });

  return (
    <div className="animate-rise flex flex-wrap items-center gap-5 rounded-2xl border border-border bg-surface p-6">
      <Avatar user={user} />
      <div className="min-w-0 flex-1">
        <h1 className="truncate text-xl font-semibold tracking-[-0.02em]">
          {displayNameOf(user)}
        </h1>
        <p className="mt-1 truncate text-sm text-muted-foreground">
          @{user.username} · {user.email}
        </p>
        <p className="mt-2 text-xs text-muted-foreground">
          Joined {joined}
          {!user.emailVerified && " · email not verified yet"}
        </p>
      </div>
      {action}
    </div>
  );
}

export function Avatar({
  user,
  size = 64,
}: {
  user: Pick<PublicUser, "avatarUrl" | "displayName" | "username">;
  size?: number;
}) {
  return user.avatarUrl ? (
    <img
      src={user.avatarUrl}
      alt={`${displayNameOf(user)}'s avatar`}
      width={size}
      height={size}
      className="rounded-2xl border border-border object-cover"
      style={{ width: size, height: size }}
    />
  ) : (
    <span
      aria-hidden
      className="grid shrink-0 place-items-center rounded-2xl bg-secondary font-semibold text-primary"
      style={{ width: size, height: size, fontSize: size / 3 }}
    >
      {initialsOf(user)}
    </span>
  );
}
