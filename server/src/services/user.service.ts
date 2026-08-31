import { userRepository } from "../repositories/user.repository.js";
import { passwordResetRepository } from "../repositories/password-reset.repository.js";
import type {
  ChangePasswordInput,
  DeleteAccountInput,
  UpdateEmailInput,
  UpdateProfileInput,
} from "../schemas/user.schema.js";
import type { PublicUser, SessionClaims } from "../types/index.js";
import { conflict, unauthorized, validationFailed } from "../utils/errors.js";
import { toPublicUser } from "../utils/mappers.js";
import { hashPassword, verifyPassword } from "../utils/password.js";

async function requireUser(userId: string) {
  const user = await userRepository.findById(userId);
  if (!user) throw unauthorized("This account no longer exists.");
  return user;
}

function claimsFor(user: PublicUser): SessionClaims {
  return { sub: user.id, username: user.username, email: user.email };
}

/**
 * Service layer — every profile business rule lives here.
 * Controllers only translate HTTP to/from these calls.
 */
export const userService = {
  async profile(userId: string): Promise<PublicUser> {
    return toPublicUser(await requireUser(userId));
  },

  async updateProfile(
    userId: string,
    input: UpdateProfileInput,
  ): Promise<{ user: PublicUser; claims: SessionClaims }> {
    const current = await requireUser(userId);

    if (input.username && input.username.toLowerCase() !== current.username.toLowerCase()) {
      const taken = await userRepository.findByUsername(input.username);
      if (taken && taken.id !== userId) throw conflict("That username is taken.");
    }

    const updated = await userRepository.update(userId, {
      ...(input.username !== undefined ? { username: input.username } : {}),
      ...(input.displayName !== undefined ? { displayName: input.displayName } : {}),
      ...(input.avatarUrl !== undefined ? { avatarUrl: input.avatarUrl } : {}),
    });

    const user = toPublicUser(updated);
    return { user, claims: claimsFor(user) };
  },

  /**
   * Email changes require the password. `emailVerified` is reset to false so a
   * verification step can be layered on later without another migration.
   */
  async updateEmail(
    userId: string,
    input: UpdateEmailInput,
  ): Promise<{ user: PublicUser; claims: SessionClaims }> {
    const current = await requireUser(userId);

    const ok = await verifyPassword(input.currentPassword, current.passwordHash);
    if (!ok) throw validationFailed({ currentPassword: ["That password is not right."] });

    if (input.email !== current.email) {
      const taken = await userRepository.findByEmail(input.email);
      if (taken && taken.id !== userId) {
        throw conflict("An account with that email already exists.");
      }
    }

    const updated = await userRepository.update(userId, {
      email: input.email,
      emailVerified: false,
    });

    const user = toPublicUser(updated);
    return { user, claims: claimsFor(user) };
  },

  async changePassword(userId: string, input: ChangePasswordInput): Promise<void> {
    const current = await requireUser(userId);

    const ok = await verifyPassword(input.currentPassword, current.passwordHash);
    if (!ok) throw validationFailed({ currentPassword: ["That password is not right."] });

    await userRepository.update(userId, {
      passwordHash: await hashPassword(input.newPassword),
    });
    // Any outstanding reset links become invalid once the password changes.
    await passwordResetRepository.deleteAllForUser(userId);
  },

  async deleteAccount(userId: string, input: DeleteAccountInput): Promise<void> {
    const current = await requireUser(userId);

    const ok = await verifyPassword(input.currentPassword, current.passwordHash);
    if (!ok) throw validationFailed({ currentPassword: ["That password is not right."] });

    await userRepository.delete(userId);
  },
};
