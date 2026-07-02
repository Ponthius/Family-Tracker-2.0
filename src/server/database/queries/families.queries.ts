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
