import { query } from "../db/index.js";

/** The only fields that ever leave the server. */
export function toPublicUser(row) {
  return {
    id: row.id,
    username: row.username,
    email: row.email,
    emailVerified: row.email_verified,
    displayName: row.display_name,
    avatarUrl: row.avatar_url,
    createdAt: new Date(row.created_at).toISOString(),
    updatedAt: new Date(row.updated_at).toISOString(),
  };
}

export async function findById(id) {
  const { rows } = await query("SELECT * FROM users WHERE id = $1", [id]);
  return rows[0] || null;
}

export async function findByEmail(email) {
  const { rows } = await query("SELECT * FROM users WHERE email = $1", [email]);
  return rows[0] || null;
}

export async function findByUsername(username) {
  const { rows } = await query("SELECT * FROM users WHERE lower(username) = lower($1)", [username]);
  return rows[0] || null;
}
