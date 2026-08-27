import { SignJWT, jwtVerify } from "jose";

export const SESSION_COOKIE = "blindfold_session";
export const SESSION_MAX_AGE = 60 * 60 * 24 * 7; // 7 days

const ISSUER = "blindfold";
const AUDIENCE = "blindfold-app";

function getSecret(): Uint8Array {
  // Read at call time: env is injected per request in the server runtime.
  const secret = process.env["AUTH_JWT_SECRET"];
  if (!secret) throw new Error("AUTH_JWT_SECRET is not configured");
  return new TextEncoder().encode(secret);
}

export async function signSessionToken(payload: {
  sub: string;
  username: string;
  email: string;
}): Promise<string> {
  return new SignJWT({ username: payload.username, email: payload.email })
    .setProtectedHeader({ alg: "HS256" })
    .setSubject(payload.sub)
    .setIssuer(ISSUER)
    .setAudience(AUDIENCE)
    .setIssuedAt()
    .setExpirationTime(`${SESSION_MAX_AGE}s`)
    .sign(getSecret());
}

export async function verifySessionToken(token: string): Promise<{ sub: string }> {
  const { payload } = await jwtVerify(token, getSecret(), {
    issuer: ISSUER,
    audience: AUDIENCE,
  });
  if (!payload.sub) throw new Error("Token is missing a subject");
  return { sub: payload.sub };
}

export function buildSessionCookie(token: string): string {
  return [
    `${SESSION_COOKIE}=${token}`,
    "Path=/",
    "HttpOnly",
    "Secure",
    "SameSite=Lax",
    `Max-Age=${SESSION_MAX_AGE}`,
  ].join("; ");
}

export function buildClearedSessionCookie(): string {
  return `${SESSION_COOKIE}=; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=0`;
}

export function readTokenFromRequest(request: Request): string | null {
  const header = request.headers.get("authorization");
  if (header?.toLowerCase().startsWith("bearer ")) {
    return header.slice(7).trim() || null;
  }
  const cookie = request.headers.get("cookie");
  if (!cookie) return null;
  for (const part of cookie.split(";")) {
    const [name, ...rest] = part.trim().split("=");
    if (name === SESSION_COOKIE) return rest.join("=") || null;
  }
  return null;
}
