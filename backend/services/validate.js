import { invalidInput } from "../middleware/errors.js";

/** Tiny field validators. Each returns an error message or null. */
const USERNAME = /^[a-zA-Z0-9_-]{3,32}$/;
const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export const rules = {
  username: (v) =>
    typeof v !== "string" || !USERNAME.test(v.trim())
      ? "Username must be 3–32 letters, numbers, hyphens or underscores."
      : null,
  email: (v) =>
    typeof v !== "string" || !EMAIL.test(v.trim()) || v.length > 255 ? "Enter a valid email address." : null,
  password: (v) =>
    typeof v !== "string" || v.length < 8 || v.length > 128 ? "Password must be 8–128 characters." : null,
  present: (label) => (v) => (typeof v !== "string" || v.length === 0 || v.length > 128 ? `Enter ${label}.` : null),
};

/** Throws a 400 listing every failing field. */
export function check(body, schema) {
  const details = {};
  for (const [field, rule] of Object.entries(schema)) {
    const msg = rule(body?.[field]);
    if (msg) details[field] = [msg];
  }
  if (Object.keys(details).length) throw invalidInput(details);
}

export const normEmail = (v) => v.trim().toLowerCase();
