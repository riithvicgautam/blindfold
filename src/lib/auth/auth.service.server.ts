import { conflict, invalidCredentials, unauthorized } from "./errors";
import { signSessionToken, verifySessionToken } from "./jwt.server";
import { hashPassword, verifyPassword } from "./password.server";
import { usersRepository } from "./users.repository.server";
import type { LoginInput, PublicUser, RegisterInput } from "./validation";
import type { UserRow } from "@/db/schema";

function toPublicUser(row: UserRow): PublicUser {
  return {
    id: row.id,
    username: row.username,
    email: row.email,
    createdAt: row.createdAt,
  };
}

/**
 * Service layer — business rules for authentication.
 */
export const authService = {
  async register(input: RegisterInput): Promise<{ user: PublicUser; token: string }> {
    if (await usersRepository.findByEmail(input.email)) {
      throw conflict("An account with that email already exists.");
    }
    if (await usersRepository.findByUsername(input.username)) {
      throw conflict("That username is taken.");
    }

    const passwordHash = await hashPassword(input.password);
    const row = await usersRepository.create({
      username: input.username,
      email: input.email,
      passwordHash,
    });

    const user = toPublicUser(row);
    const token = await signSessionToken({
      sub: user.id,
      username: user.username,
      email: user.email,
    });
    return { user, token };
  },

  async login(input: LoginInput): Promise<{ user: PublicUser; token: string }> {
    const row = await usersRepository.findByEmail(input.email);
    if (!row) {
      // Keep the timing/response shape identical to a wrong password.
      await verifyPassword(input.password, "$2a$10$invalidinvalidinvalidinvalidinvalidinvalidinvalidinvalidinv");
      throw invalidCredentials();
    }
    const ok = await verifyPassword(input.password, row.passwordHash);
    if (!ok) throw invalidCredentials();

    const user = toPublicUser(row);
    const token = await signSessionToken({
      sub: user.id,
      username: user.username,
      email: user.email,
    });
    return { user, token };
  },

  async currentUser(token: string | null): Promise<PublicUser> {
    if (!token) throw unauthorized();
    let sub: string;
    try {
      ({ sub } = await verifySessionToken(token));
    } catch {
      throw unauthorized("Your session has expired. Please sign in again.");
    }
    const row = await usersRepository.findById(sub);
    if (!row) throw unauthorized("This account no longer exists.");
    return toPublicUser(row);
  },
};
