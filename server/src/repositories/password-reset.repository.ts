import type { PasswordResetToken } from "@prisma/client";

import { prisma } from "../db/prisma.js";

/** Repository layer for password reset tokens. */
export const passwordResetRepository = {
  create(data: {
    userId: string;
    tokenHash: string;
    expiresAt: Date;
  }): Promise<PasswordResetToken> {
    return prisma.passwordResetToken.create({ data });
  },

  findByTokenHash(tokenHash: string): Promise<PasswordResetToken | null> {
    return prisma.passwordResetToken.findUnique({ where: { tokenHash } });
  },

  async markUsed(id: string): Promise<void> {
    await prisma.passwordResetToken.update({ where: { id }, data: { usedAt: new Date() } });
  },

  async deleteAllForUser(userId: string): Promise<void> {
    await prisma.passwordResetToken.deleteMany({ where: { userId } });
  },
};

export type PasswordResetRepository = typeof passwordResetRepository;
