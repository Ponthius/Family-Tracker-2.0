import { findUserByEmail, findUserByUsername, createUser } from "../database/queries/users.queries.js";
import { createFamily } from "../database/queries/families.queries.js";
import { hashPassword, verifyPassword } from "../utils/hash.js";
import { sendWelcomeEmail } from "./email.service.js";
import { AppError } from "../utils/errors.js";

export async function registerUser(username: string, email: string, password: string, familyName: string) {
  // Validate inputs
  if (!username || username.trim().length === 0) {
    throw new AppError(400, "Username is required.");
  }

  if (!familyName || familyName.trim().length === 0) {
    throw new AppError(400, "Family name is required.");
  }

  // Check email uniqueness
  const existingEmail = await findUserByEmail(email);
  if (existingEmail) {
    throw new AppError(409, "An account with that email already exists.");
  }

  // Check username uniqueness
  const existingUsername = await findUserByUsername(username);
  if (existingUsername) {
    throw new AppError(409, "That username is already taken.");
  }

  // Hash password
  const hashed = await hashPassword(password);

  // Create family group
  const family = await createFamily({ name: familyName });

  // Create user with Admin role and link to family
  const user = await createUser({
    username,
    email,
    password: hashed,
    role: "Admin",
    familyId: family.id
  });

  // Send welcome email but don't block registration if it fails
  sendWelcomeEmail(user.email, user.username).catch((err) =>
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
