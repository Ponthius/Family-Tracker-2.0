import { prisma } from "../client.js";

export type CreateUserInput = {
  username: string;
  email: string;
  password: string;
  role?: string;
  familyId?: string;
  emailVerified?: boolean;
  verificationToken?: string | null;
  verificationTokenExpiresAt?: Date | null;
};

export function findUserByEmail(email: string) {
  return prisma.user.findUnique({ where: { email }, include: { family: true } });
}

export function findUserById(id: string) {
  return prisma.user.findUnique({ 
    where: { id },
    include: { family: true }
  });
}

export function findActiveUserById(id: string) {
  return prisma.user.findFirst({
    where: {
      id,
      deletedAt: null,
      OR: [
        { family: null },
        { family: { deletedAt: null } },
      ],
    },
    include: { family: true },
  });
}

export function findUserByUsername(username: string) {
  return prisma.user.findUnique({ where: { username }, include: { family: true } });
}

export function createUser(data: CreateUserInput) {
  return prisma.user.create({ data });
}

export function updateUserById(id: string, data: Parameters<typeof prisma.user.update>[0]["data"]) {
  return prisma.user.update({ where: { id }, data });
}

export function listUsersByFamilyId(familyId: string) {
  return prisma.user.findMany({
    where: { familyId, deletedAt: null },
  });
}

export function markUsersDeletedByFamilyId(familyId: string, deletedAt: Date, purgeAt: Date) {
  return prisma.user.updateMany({
    where: { familyId },
    data: { deletedAt, purgeAt },
  });
}

export function markUserDeleted(id: string, deletedAt: Date, purgeAt: Date) {
  return prisma.user.update({
    where: { id },
    data: { deletedAt, purgeAt },
  });
}

export function deleteUsersByFamilyId(familyId: string) {
  return prisma.user.deleteMany({ where: { familyId } });
}

export function deleteUserById(id: string) {
  return prisma.user.delete({ where: { id } });
}

export function findUserByVerificationToken(token: string) {
  return prisma.user.findFirst({ where: { verificationToken: token }, include: { family: true } });
}

export function clearVerificationToken(id: string) {
  return prisma.user.update({
    where: { id },
    data: { verificationToken: null, verificationTokenExpiresAt: null, emailVerified: true },
  });
}
