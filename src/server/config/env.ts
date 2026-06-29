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
  SMTP_HOST: require("SMTP_HOST"),
  SMTP_PORT: parseInt(process.env["SMTP_PORT"] ?? "587", 10),
  SMTP_USER: require("SMTP_USER"),
  SMTP_PASS: require("SMTP_PASS"),
  EMAIL_FROM: require("EMAIL_FROM"),
};
