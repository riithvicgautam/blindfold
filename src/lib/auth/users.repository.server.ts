import { sql } from "drizzle-orm";

import { getDb } from "@/db/client.server";
import { users, type UserRow } from "@/db/schema";

/**
 * Repository layer — the only place that talks to the users table.
 */
export const usersRepository = {
  async findByEmail(email: string): Promise<UserRow | null> {
    const db = getDb();
    const rows = await db
      .select()
      .from(users)
      .where(sql`lower(${users.email}) = ${email.toLowerCase()}`)
      .limit(sql.raw("1"));
    return rows[0] ?? null;
  },

  async findByUsername(username: string): Promise<UserRow | null> {
    const db = getDb();
    const rows = await db
      .select()
      .from(users)
      .where(sql`lower(${users.username}) = ${username.toLowerCase()}`)
      .limit(sql.raw("1"));
    return rows[0] ?? null;
  },

  async findById(id: string): Promise<UserRow | null> {
    const db = getDb();
    const rows = await db
      .select()
      .from(users)
      .where(sql`${users.id}::text = ${id}`)
      .limit(sql.raw("1"));
    return rows[0] ?? null;
  },

  async create(input: {
    username: string;
    email: string;
    passwordHash: string;
  }): Promise<UserRow> {
    const db = getDb();
    const rows = await db
      .insert(users)
      .values({
        username: input.username,
        email: input.email,
        passwordHash: input.passwordHash,
      })
      .returning();
    const created = rows[0];
    if (!created) throw new Error("Failed to create the account");
    return created;
  },
};
