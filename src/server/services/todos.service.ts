import {
  findTodosByUser,
  findTodoById,
  insertTodo,
  updateTodoById,
  deleteTodoById,
} from "../database/queries/todos.queries.js";
import { AppError } from "../utils/errors.js";
import { getFamilyMembers } from "../database/queries/families.queries.js";
import { getCurrentUser } from "./auth.service.js";

export function getTodosForUser(userId: string) {
  return findTodosByUser(userId);
}

export async function getAssignableFamilyMembers(userId: string) {
  const user = await getCurrentUser(userId);
  if (!user.familyId) {
    return [];
  }
  return getFamilyMembers(user.familyId);
}

export async function addTodo(userId: string, data: {
  title: string;
  description?: string;
  status?: string;
  dueDate?: string;
  assignedToUserId?: string;
}) {
  const user = await getCurrentUser(userId);
  if (!data.title.trim()) {
    throw new AppError(400, "Todo title cannot be empty.");
  }

  let dueDate: Date | null | undefined;
  if (data.dueDate) {
    const parsed = new Date(data.dueDate);
    if (Number.isNaN(parsed.getTime())) {
      throw new AppError(400, "Invalid due date.");
    }
    dueDate = parsed;
  }

  if (!user.familyId) {
    throw new AppError(400, "Family account is required.");
  }

  if (data.assignedToUserId) {
    const familyMembers = await getFamilyMembers(user.familyId);
    if (!familyMembers.some((member) => member.id === data.assignedToUserId)) {
      throw new AppError(404, "Assigned user not found.");
    }
  }

  return insertTodo(userId, {
    title: data.title.trim(),
    description: data.description?.trim() || undefined,
    status: data.status ?? "unoccupied",
    dueDate: dueDate ?? null,
    assignedToUserId: data.assignedToUserId ?? null,
    familyId: user.familyId,
  });
}

export async function editTodo(
  todoId: string,
  userId: string,
  data: { title?: string; done?: boolean },
) {
  const todo = await findTodoById(todoId);
  if (!todo || todo.userId !== userId) {
    throw new AppError(404, "Todo not found.");
  }
  return updateTodoById(todoId, data);
}

export async function removeTodo(todoId: string, userId: string) {
  const todo = await findTodoById(todoId);
  if (!todo || todo.userId !== userId) {
    throw new AppError(404, "Todo not found.");
  }
  return deleteTodoById(todoId);
}
