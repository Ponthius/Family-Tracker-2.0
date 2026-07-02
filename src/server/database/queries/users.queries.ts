import { prisma } from "../client.js";

export type CreateUserInput = {
  username: string;
  email: string;
  password: string;
  role?: string;
  familyId?: string;
};

export function findUserByEmail(email: string) {
  return prisma.user.findUnique({ where: { email } });
}

export function findUserById(id: string) {
  return prisma.user.findUnique({ 
    where: { id },
    include: { family: true }
  });
}

export function findUserByUsername(username: string) {
  return prisma.user.findUnique({ where: { username } });
}

export function createUser(data: CreateUserInput) {
  return prisma.user.create({ data });
}
