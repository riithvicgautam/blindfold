import { pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";

/**
 * Source of truth for the accounts table used by Blindfold's authentication.
 * The matching SQL lives in supabase/migrations.
 */
export const users = pgTable("users", {
  id: uuid("id").primaryKey().defaultRandom(),
  username: text("username").notNull(),
  email: text("email").notNull(),
  passwordHash: text("password_hash").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true, mode: "string" })
    .notNull()
    .defaultNow(),
});

export type UserRow = typeof users.$inferSelect;
export type NewUserRow = typeof users.$inferInsert;
