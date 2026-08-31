import { env } from "../config/env.js";
import { passwordResetRepository } from "../repositories/password-reset.repository.js";
import { userRepository } from "../repositories/user.repository.js";
import type { ForgotPasswordInput, ResetPasswordInput } from "../schemas/password-reset.schema.js";
import { badRequest } from "../utils/errors.js";
import { hashPassword } from "../utils/password.js";
import { generateResetToken, hashToken } from "../utils/tokens.js";

const TOKEN_TTL_MINUTES = 30;

export type ResetDelivery = { resetUrl: string; expiresAt: string };

/**
 * Password reset business rules.
 *
 * Delivery is intentionally pluggable: today `deliver` logs the link, later it
 * becomes an email provider call without touching the rest of this service.
 */
export const passwordResetService = {
  /** Always resolves — never reveals whether an account exists. */
  async request(
    input: ForgotPasswordInput,
    deliver: (payload: { email: string } & ResetDelivery) => void,
  ): Promise<void> {
    const user = await userRepository.findByEmail(input.email);
    if (!user) return;

    await passwordResetRepository.deleteAllForUser(user.id);

    const { token, tokenHash } = generateResetToken();
    const expiresAt = new Date(Date.now() + TOKEN_TTL_MINUTES * 60_000);
    await passwordResetRepository.create({ userId: user.id, tokenHash, expiresAt });

    const origin = env.CORS_ORIGINS[0] ?? "http://localhost:8080";
    deliver({
      email: user.email,
      resetUrl: `${origin}/reset-password?token=${token}`,
      expiresAt: expiresAt.toISOString(),
    });
  },

  async reset(input: ResetPasswordInput): Promise<void> {
    const record = await passwordResetRepository.findByTokenHash(hashToken(input.token));

    if (!record || record.usedAt || record.expiresAt.getTime() < Date.now()) {
      throw badRequest("This reset link is invalid or has expired. Please request a new one.");
    }

    await userRepository.update(record.userId, {
      passwordHash: await hashPassword(input.password),
    });
    await passwordResetRepository.markUsed(record.id);
    await passwordResetRepository.deleteAllForUser(record.userId);
  },
};
