import type { User } from "@prisma/client";

import type { PublicUser } from "../types/index.js";

/** Single place that decides which user fields leave the server. */
export function toPublicUser(user: User): PublicUser {
  return {
    id: user.id,
    username: user.username,
    email: user.email,
    emailVerified: user.emailVerified,
    displayName: user.displayName ?? null,
    avatarUrl: user.avatarUrl ?? null,
    createdAt: user.createdAt.toISOString(),
    updatedAt: user.updatedAt.toISOString(),
  };
}
