import { prisma } from "../client.js";

export function findTodosByUser(userId: string) {
  return prisma.todo.findMany({
    where: {
      OR: [{ userId }, { assignedToUserId: userId }],
    },
    orderBy: { createdAt: "desc" },
    include: {
      user: { select: { id: true, username: true, role: true } },
      assignedToUser: { select: { id: true, username: true, role: true } },
    },
  } as never);
}

export function findTodoById(id: string) {
  return prisma.todo.findUnique({
    where: { id },
    include: {
      user: { select: { id: true, username: true, role: true } },
      assignedToUser: { select: { id: true, username: true, role: true } },
    },
  } as never);
}

export function insertTodo(userId: string, data: {
  title: string;
  description?: string;
  dueDate?: Date | null;
  assignedToUserId?: string | null;
  familyId?: string | null;
}) {
  return prisma.todo.create({ data: { userId, ...data } });
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
