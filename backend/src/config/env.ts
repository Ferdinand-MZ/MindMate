import dotenv from "dotenv";

dotenv.config();

// Centralized, fail-closed environment config.
// Every required variable is validated once at boot : if something is
// missing we throw immediately instead of silently falling back to an
// insecure hardcoded default (e.g. a public JWT secret).
function required(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(
      `Missing required environment variable "${name}". Set it in your .env file.`
    );
  }
  return value;
}

export const env = {
  nodeEnv: process.env.NODE_ENV || "development",
  port: parseInt(process.env.PORT || "3001", 10),
  databaseUrl: required("DATABASE_URL"),
  jwtSecret: required("JWT_SECRET"),
  geminiApiKey: required("GEMINI_API_KEY"),
  anonSecret: required("ANON_SECRET"),
  inngestEventKey: process.env.INNGEST_EVENT_KEY,
  openWeatherMapApiKey: process.env.OPENWEATHERMAP_API_KEY,
  allowedOrigins: (process.env.ALLOWED_ORIGINS || "http://localhost:3000")
    .split(",")
    .map((s) => s.trim()),
};
