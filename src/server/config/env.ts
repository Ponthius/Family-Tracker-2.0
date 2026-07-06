/**
 * Reads environment variables from process.env and fails fast if any required
 * variable is missing. Import `env` anywhere instead of accessing process.env
 * directly — this gives you type safety and a clear error at startup.
 */

function require(name: string): string {
  const value = process.env[name];
  if (!value) throw new Error(`Missing required environment variable: ${name}`);
  return value;
}

export const env = {
  PORT: parseInt(process.env["PORT"] ?? "3000", 10),
  NODE_ENV: process.env["NODE_ENV"] ?? "development",
  DATABASE_URL: require("DATABASE_URL"),
  SESSION_SECRET: require("SESSION_SECRET"),
  SMTP_HOST: process.env["SMTP_HOST"] ?? "",
  SMTP_PORT: parseInt(process.env["SMTP_PORT"] ?? "587", 10),
  SMTP_USER: process.env["SMTP_USER"] ?? "",
  SMTP_PASS: process.env["SMTP_PASS"] ?? "",
  EMAIL_FROM: process.env["EMAIL_FROM"] ?? "Family Tracker <no-reply@example.com>",
  EMAIL_ENABLED: (process.env["EMAIL_ENABLED"] ?? "false").toLowerCase() === "true",
};
