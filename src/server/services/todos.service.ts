import {
  findTodosByUser,
  findTodoById,
  insertTodo,
  updateTodoById,
  deleteTodoById,
} from "../database/queries/todos.queries.js";
import { AppError } from "../utils/errors.js";

export function getTodosForUser(userId: string) {
  return findTodosByUser(userId);
}

export function addTodo(userId: string, title: string) {
  const trimmed = title.trim();
  if (!trimmed) {
    throw new AppError(400, "Todo title cannot be empty.");
  }
  return insertTodo(userId, trimmed);
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
