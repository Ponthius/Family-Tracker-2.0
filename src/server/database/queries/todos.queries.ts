import { prisma } from "../client.js";

export function findTodosByUser(userId: string) {
  return prisma.todo.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
  });
}

export function findTodoById(id: string) {
  return prisma.todo.findUnique({ where: { id } });
}

export function insertTodo(userId: string, title: string) {
  return prisma.todo.create({ data: { userId, title } });
}

export function updateTodoById(
  id: string,
  data: { title?: string; done?: boolean },
) {
  return prisma.todo.update({ where: { id }, data });
}

export function deleteTodoById(id: string) {
  return prisma.todo.delete({ where: { id } });
}
