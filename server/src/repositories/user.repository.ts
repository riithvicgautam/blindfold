import type { User } from "@prisma/client";

import { prisma } from "../db/prisma.js";

/**
 * Repository layer — the only place that touches the users table.
 * Contains no business rules.
 */
export const userRepository = {
  findById(id: string): Promise<User | null> {
    return prisma.user.findUnique({ where: { id } });
  },

  findByEmail(email: string): Promise<User | null> {
    return prisma.user.findUnique({ where: { email: email.toLowerCase() } });
  },

  findByUsername(username: string): Promise<User | null> {
    return prisma.user.findFirst({
      where: { username: { equals: username, mode: "insensitive" } },
    });
  },

  create(data: { username: string; email: string; passwordHash: string }): Promise<User> {
    return prisma.user.create({
      data: {
        username: data.username,
        email: data.email.toLowerCase(),
        passwordHash: data.passwordHash,
      },
    });
  },
};

export type UserRepository = typeof userRepository;
