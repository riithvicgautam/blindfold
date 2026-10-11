import jwt from "jsonwebtoken";

import { config } from "../config.js";
import { unauthorized } from "./errors.js";

/** JWTs are signed (not encrypted): never put secrets in the payload. */
export function signToken(user) {
  return jwt.sign({ sub: user.id, username: user.username }, config.jwtSecret, {
    expiresIn: config.jwtExpiresIn,
  });
}

function readToken(req) {
  const fromCookie = req.cookies?.[config.cookieName];
  if (fromCookie) return fromCookie;
  const header = req.headers.authorization || "";
  return header.startsWith("Bearer ") ? header.slice(7) : null;
}

function verify(req) {
  const token = readToken(req);
  if (!token) return null;
  try {
    return jwt.verify(token, config.jwtSecret);
  } catch {
    return null;
  }
}

/** Rejects the request unless a valid JWT is present. Sets req.userId. */
export function requireAuth(req, _res, next) {
  const claims = verify(req);
  if (!claims) return next(unauthorized("Your session has expired. Please sign in again."));
  req.userId = claims.sub;
  next();
}

/** Attaches req.userId when signed in, never rejects. */
export function optionalAuth(req, _res, next) {
  req.userId = verify(req)?.sub;
  next();
}
