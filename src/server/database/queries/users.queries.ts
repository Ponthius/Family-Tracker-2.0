import { prisma } from "../client.js";

export type CreateUserInput = {
  name: string;
  email: string;
  password: string;
};

export function findUserByEmail(email: string) {
  return prisma.user.findUnique({ where: { email } });
}

export function findUserById(id: string) {
  return prisma.user.findUnique({ where: { id } });
}

export function createUser(data: CreateUserInput) {
  return prisma.user.create({ data });
}
