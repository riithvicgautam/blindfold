import bcrypt from "bcryptjs";

const ROUNDS = 12;

/** A valid-shaped hash used to equalise timing when an account does not exist. */
export const DUMMY_HASH = "$2a$12$C6UzMDM.H6dfI/f/IKcEe.Qh0mHU0/0m5GmzZ0eQnEo7cE0uW2Vfy";

export function hashPassword(plain: string): Promise<string> {
  return bcrypt.hash(plain, ROUNDS);
}

export function verifyPassword(plain: string, hash: string): Promise<boolean> {
  return bcrypt.compare(plain, hash);
}
