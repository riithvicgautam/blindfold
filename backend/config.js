import "dotenv/config";

/** All environment configuration in one place. Required values fail fast. */
const isProduction = process.env.NODE_ENV === "production";

function required(name) {
  const value = process.env[name];
  if (!value) throw new Error(`Missing required environment variable: ${name}`);
  return value;
}

export const config = {
  isProduction,
  port: Number(process.env.PORT || 4000),
  databaseUrl: process.env.DATABASE_URL || "",
  jwtSecret: process.env.JWT_SECRET || (isProduction ? required("JWT_SECRET") : "dev-only-secret-change-me-please-32chars"),
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || "7d",
  cookieName: "blindfold_session",
  corsOrigins: (process.env.CORS_ORIGINS || "http://localhost:8080")
    .split(",")
    .map((o) => o.trim())
    .filter(Boolean),
  aiProvider: (process.env.AI_PROVIDER || "none").toLowerCase(), // gemini | groq | none
  geminiApiKey: process.env.GEMINI_API_KEY || "",
  geminiModel: process.env.GEMINI_MODEL || "gemini-2.0-flash",
  groqApiKey: process.env.GROQ_API_KEY || "",
  groqModel: process.env.GROQ_MODEL || "llama-3.1-8b-instant",
  aiTimeoutMs: Number(process.env.AI_TIMEOUT_MS || 4000),
};

export const cookieOptions = {
  httpOnly: true,
  secure: isProduction,
  sameSite: isProduction ? "none" : "lax",
  path: "/",
  maxAge: 7 * 24 * 60 * 60 * 1000,
};
