import {
  clearVerificationToken,
  createUser,
  findActiveUserById,
  findUserByEmail,
  findUserByUsername,
  findUserByVerificationToken,
  markUserDeleted,
  markUsersDeletedByFamilyId,
  updateUserById,
} from "../database/queries/users.queries.js";
import {
  createFamily,
  findFamilyById,
  markFamilyDeleted,
  updateFamilyById,
} from "../database/queries/families.queries.js";
import { prisma } from "../database/client.js";
import { hashPassword, verifyPassword } from "../utils/hash.js";
import { AppError } from "../utils/errors.js";
import { logAction } from "./audit.service.js";

const GRACE_PERIOD_MS = 7 * 24 * 60 * 60 * 1000;

function buildVerificationLink(token: string) {
  return `http://localhost:3000/pages/verify.html?token=${encodeURIComponent(token)}`;
}

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
    familyId: family.id,
    emailVerified: true,
  });

  void logAction({
    action: "user.registered",
    actorUserId: user.id,
    familyId: user.familyId,
    targetUserId: user.id,
    metadata: { verificationEnabled: Boolean(process.env["EMAIL_ENABLED"] === "true") },
  });

  return { user, verificationLink: null };
}

export async function loginUser(identifier: string, password: string) {
  // Try email first, then username
  let user = await findUserByEmail(identifier);
  if (!user) {
    user = await findUserByUsername(identifier);
  }
  if (!user) {
    throw new AppError(401, "Invalid email or password.");
  }

  if (user.deletedAt || user.family?.deletedAt) {
    throw new AppError(401, "This account no longer exists. Please contact your family admin.");
  }

  const valid = await verifyPassword(password, user.password);
  if (!valid) {
    throw new AppError(401, "Invalid email or password.");
  }

  void logAction({
    action: "user.logged_in",
    actorUserId: user.id,
    familyId: user.familyId,
    targetUserId: user.id,
  });

  return user;
}

export async function verifyUserEmail(token: string) {
  if (!token) throw new AppError(400, "Verification token is required.");
  const user = await findUserByVerificationToken(token);
  if (!user) throw new AppError(400, "Verification link is invalid or expired.");
  const verified = await clearVerificationToken(user.id);
  void logAction({ action: "user.verified", actorUserId: verified.id, familyId: verified.familyId, targetUserId: verified.id });
  return verified;
}

export async function resendVerification(identifier: string) {
  const user = (await findUserByEmail(identifier)) ?? (await findUserByUsername(identifier));
  if (!user) throw new AppError(404, "Account not found.");
  return user;
}

export async function deleteAccount(userId: string) {
  const user = await findActiveUserById(userId);
  if (!user) throw new AppError(404, "Account not found.");

  const deletedAt = new Date();
  const purgeAt = new Date(deletedAt.getTime() + GRACE_PERIOD_MS);

  if (user.role === "Admin" && user.familyId) {
    await markFamilyDeleted(user.familyId, deletedAt, purgeAt);
    await markUsersDeletedByFamilyId(user.familyId, deletedAt, purgeAt);
    void logAction({ action: "family.deleted", actorUserId: user.id, familyId: user.familyId, targetUserId: user.id, metadata: { purgeAt } });
  } else {
    await markUserDeleted(user.id, deletedAt, purgeAt);
    void logAction({ action: "user.deleted", actorUserId: user.id, familyId: user.familyId, targetUserId: user.id, metadata: { purgeAt } });
  }

  return { deletedAt, purgeAt, familyId: user.familyId, role: user.role };
}

export async function updateUserProfile(userId: string, data: { username?: string; fullName?: string; language?: string; currentPassword?: string; newPassword?: string }) {
  const user = await findActiveUserById(userId);
  if (!user) throw new AppError(404, "Account not found.");

  const update: Record<string, unknown> = {};

  if (data.username && data.username !== user.username) {
    const existing = await findUserByUsername(data.username);
    if (existing) throw new AppError(409, "Username is already taken.");
    update.username = data.username;
  }

  if (typeof data.fullName === "string") {
    update.fullName = data.fullName.trim() || null;
  }

  if (typeof data.language === "string" && data.language.trim()) {
    update.language = data.language.trim();
  }

  if (data.currentPassword && data.newPassword) {
    const valid = await verifyPassword(data.currentPassword, user.password);
    if (!valid) throw new AppError(401, "Current password is incorrect.");
    update.password = await hashPassword(data.newPassword);
  }

  if (Object.keys(update).length === 0) {
    return user;
  }

  return updateUserById(userId, update);
}

export async function updateBranding(userId: string, familyName: string, logoUrl?: string, accentColor?: string) {
  const user = await findActiveUserById(userId);
  if (!user?.familyId) throw new AppError(404, "Family not found.");
  if (user.role !== "Admin") throw new AppError(403, "Only admins can update family branding.");

  return updateFamilyById(user.familyId, {
    name: familyName,
    logoUrl: logoUrl ?? null,
    accentColor: accentColor ?? null,
  });
}

export async function getCurrentUser(userId: string) {
  const user = await findActiveUserById(userId);
  if (!user) throw new AppError(401, "Not authenticated.");
  return user;
}

export async function ensureDefaultSuperAdmin() {
  const email = "superadmin@gmail.com";
  const existing = await findUserByEmail(email);
  if (existing) return existing;

  const password = await hashPassword("superadmin123");
  return prisma.user.create({
    data: {
      username: "superadmin",
      email,
      password,
      role: "SuperAdmin",
      emailVerified: true,
      language: "en",
    },
  });
}
