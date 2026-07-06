import crypto from "node:crypto";

export function createToken(): string {
  return crypto.randomBytes(24).toString("hex");
}
