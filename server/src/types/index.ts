import "@fastify/jwt";

/** Claims embedded in the signed session token. */
export type SessionClaims = {
  sub: string;
  username: string;
  email: string;
};

/** The user shape that is safe to return over the wire. */
export type PublicUser = {
  id: string;
  username: string;
  email: string;
  createdAt: string;
};

declare module "@fastify/jwt" {
  interface FastifyJWT {
    payload: SessionClaims;
    user: SessionClaims;
  }
}

declare module "fastify" {
  interface FastifyRequest {
    /** Populated by the authenticate middleware on protected routes. */
    currentUser?: SessionClaims;
  }
}
