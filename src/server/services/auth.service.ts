import { findUserByEmail, createUser } from "../database/queries/users.queries.js";
import { hashPassword, verifyPassword } from "../utils/hash.js";
import { sendWelcomeEmail } from "./email.service.js";
import { AppError } from "../utils/errors.js";

export async function registerUser(name: string, email: string, password: string) {
  const existing = await findUserByEmail(email);
  if (existing) {
    throw new AppError(409, "An account with that email already exists.");
  }

  const hashed = await hashPassword(password);
  const user = await createUser({ name, email, password: hashed });

  // Send welcome email but don't block registration if it fails
  sendWelcomeEmail(user.email, user.name).catch((err) =>
    console.error("Welcome email failed:", err),
  );

  return user;
}

export async function loginUser(email: string, password: string) {
  const user = await findUserByEmail(email);
  if (!user) {
    throw new AppError(401, "Invalid email or password.");
  }

  const valid = await verifyPassword(password, user.password);
  if (!valid) {
    throw new AppError(401, "Invalid email or password.");
  }

  return user;
}
