import dotenv from "dotenv";

dotenv.config({ path: "./.env" });

const nodeEnv = process.env.NODE_ENV || "development";
const isTest = nodeEnv === "test";
const isProd = nodeEnv === "production";

const missing = (name) => {
  throw new Error(`Missing required environment variable: ${name}`);
};

const optional = (name, fallback) => {
  const value = process.env[name];
  return value === undefined || value === "" ? fallback : value;
};

const requireWhen = (needed, name) => {
  if (!needed) {
    return process.env[name] || "";
  }
  if (!process.env[name]) {
    missing(name);
  }
  return process.env[name];
};

if (!isTest) {
  requireWhen(true, "MONGODB_URI");
  requireWhen(true, "ACCESS_TOKEN_SECRET");
  requireWhen(true, "REFRESH_TOKEN_SECRET");
}

if (isProd) {
  ["CLOUDINARY_CLOUD_NAME", "CLOUDINARY_API_KEY", "CLOUDINARY_API_SECRET"].forEach(
    (name) => requireWhen(true, name)
  );
  if ((process.env.ACCESS_TOKEN_SECRET || "").length < 16) {
    throw new Error("ACCESS_TOKEN_SECRET is too short for production");
  }
  if ((process.env.REFRESH_TOKEN_SECRET || "").length < 16) {
    throw new Error("REFRESH_TOKEN_SECRET is too short for production");
  }
}

const parseOrigins = (value) =>
  String(value || "")
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);

export const env = {
  nodeEnv,
  isTest,
  isProd,
  isDev: nodeEnv === "development",
  port: Number.parseInt(optional("PORT", "8000"), 10),
  mongodbUri: process.env.MONGODB_URI || "",
  accessTokenSecret: process.env.ACCESS_TOKEN_SECRET || "test-access-secret",
  refreshTokenSecret: process.env.REFRESH_TOKEN_SECRET || "test-refresh-secret",
  accessTokenExpiry: optional("ACCESS_TOKEN_EXPIRY", "15m"),
  refreshTokenExpiry: optional("REFRESH_TOKEN_EXPIRY", "7d"),
  cloudinary: {
    cloudName: process.env.CLOUDINARY_CLOUD_NAME || "",
    apiKey: process.env.CLOUDINARY_API_KEY || "",
    apiSecret: process.env.CLOUDINARY_API_SECRET || "",
  },
  corsOrigins: parseOrigins(
    process.env.CORS_ORIGIN || process.env.FRONTEND_URL || "http://localhost:3000"
  ),
  frontendUrl: optional("FRONTEND_URL", "http://localhost:3000"),
  cookieSecure: optional("COOKIE_SECURE", isProd ? "true" : "false") === "true",
  cookieSameSite: optional("COOKIE_SAMESITE", isProd ? "none" : "lax"),
  logLevel: optional("LOG_LEVEL", isProd ? "info" : "debug"),
  rateLimitWindowMs: Number.parseInt(optional("RATE_LIMIT_WINDOW_MS", "900000"), 10),
  rateLimitMax: Number.parseInt(optional("RATE_LIMIT_MAX", "300"), 10),
  authRateLimitMax: Number.parseInt(optional("AUTH_RATE_LIMIT_MAX", "20"), 10),
  uploadRateLimitMax: Number.parseInt(optional("UPLOAD_RATE_LIMIT_MAX", "30"), 10),
  jsonLimit: optional("MAX_JSON_SIZE", "32kb"),
  maxImageBytes: Number.parseInt(optional("MAX_IMAGE_SIZE_MB", "5"), 10) * 1024 * 1024,
  maxVideoBytes: Number.parseInt(optional("MAX_VIDEO_SIZE_MB", "100"), 10) * 1024 * 1024,
  bcryptRounds: Number.parseInt(optional("BCRYPT_SALT_ROUNDS", isProd ? "12" : "10"), 10),
  trustProxy: optional("TRUST_PROXY", "false") === "true",
};
