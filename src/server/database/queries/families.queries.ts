import { prisma } from "../client.js";

export type CreateFamilyInput = {
  name: string;
};

export function createFamily(data: CreateFamilyInput) {
  return prisma.family.create({ data });
}

export function findFamilyById(id: string) {
  return prisma.family.findUnique({
    where: { id },
    include: { members: true }
  });
}

export function findFamilyByName(name: string) {
  return prisma.family.findFirst({
    where: { name },
    include: { members: true }
  });
}

export function getFamilyMembers(familyId: string) {
  return prisma.user.findMany({
    where: { familyId },
    select: {
      id: true,
      username: true,
      email: true,
      role: true,
      createdAt: true
    }
  });
}

export function updateFamilyById(id: string, data: Parameters<typeof prisma.family.update>[0]["data"]) {
  return prisma.family.update({ where: { id }, data });
}

export function markFamilyDeleted(id: string, deletedAt: Date, purgeAt: Date) {
  return prisma.family.update({
    where: { id },
    data: { deletedAt, purgeAt },
  });
}

export function deleteFamilyById(id: string) {
  return prisma.family.delete({ where: { id } });
}

export function listExpiredDeletedFamilies(now: Date) {
  return prisma.family.findMany({
    where: {
      deletedAt: { not: null },
      purgeAt: { lte: now },
    },
  });
}
