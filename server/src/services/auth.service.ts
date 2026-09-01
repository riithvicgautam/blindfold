import { userRepository } from "../repositories/user.repository.js";
import type { LoginInput, RegisterInput } from "../schemas/auth.schema.js";
import type { PublicUser, SessionClaims } from "../types/index.js";
import { conflict, invalidCredentials, unauthorized } from "../utils/errors.js";
import { toPublicUser } from "../utils/mappers.js";
import { DUMMY_HASH, hashPassword, verifyPassword } from "../utils/password.js";

function toClaims(user: PublicUser): SessionClaims {
  return { sub: user.id, username: user.username, email: user.email };
}

/**
 * Service layer — all authentication business rules live here.
 * Controllers only translate HTTP to/from these calls.
 */
export const authService = {
  async register(input: RegisterInput): Promise<{ user: PublicUser; claims: SessionClaims }> {
    if (await userRepository.findByEmail(input.email)) {
      throw conflict("An account with that email already exists.");
    }
    if (await userRepository.findByUsername(input.username)) {
      throw conflict("That username is taken.");
    }

    const passwordHash = await hashPassword(input.password);
    const created = await userRepository.create({
      username: input.username,
      email: input.email,
      passwordHash,
    });

    const user = toPublicUser(created);
    return { user, claims: toClaims(user) };
  },

  async login(input: LoginInput): Promise<{ user: PublicUser; claims: SessionClaims }> {
    const found = await userRepository.findByEmail(input.email);
    if (!found) {
      // Equalise timing so a missing account is indistinguishable from a bad password.
      await verifyPassword(input.password, DUMMY_HASH);
      throw invalidCredentials();
    }

    const ok = await verifyPassword(input.password, found.passwordHash);
    if (!ok) throw invalidCredentials();

    const user = toPublicUser(found);
    return { user, claims: toClaims(user) };
  },

  /** Resolve the user behind a verified token, rejecting deleted accounts. */
  async currentUser(claims: SessionClaims): Promise<PublicUser> {
    const found = await userRepository.findById(claims.sub);
    if (!found) throw unauthorized("This account no longer exists.");
    return toPublicUser(found);
  },
};
