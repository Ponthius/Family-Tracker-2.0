import type { Request, Response, NextFunction } from "express";
import {
  getTodosForUser,
  addTodo,
  editTodo,
  removeTodo,
  getAssignableFamilyMembers,
} from "../services/todos.service.js";

export async function listTodos(req: Request, res: Response, next: NextFunction) {
  try {
    const todos = await getTodosForUser(req.session.userId!);
    res.json({ todos });
  } catch (err) {
    next(err);
  }
}

export async function createTodo(req: Request, res: Response, next: NextFunction) {
  try {
    const { title, description, dueDate, assignedToUserId } = req.body as {
      title: string;
      description?: string;
      status?: string;
      dueDate?: string;
      assignedToUserId?: string;
    };
    const { status } = req.body as { status?: string };
    const todo = await addTodo(req.session.userId!, { title, description, status, dueDate, assignedToUserId });
    res.status(201).json({ todo });
  } catch (err) {
    next(err);
  }
}

export async function updateTodo(req: Request, res: Response, next: NextFunction) {
  try {
    const todo = await editTodo(
      req.params["id"]!,
      req.session.userId!,
      req.body as { title?: string; done?: boolean },
    );
    res.json({ todo });
  } catch (err) {
    next(err);
  }
}

export async function deleteTodo(req: Request, res: Response, next: NextFunction) {
  try {
    await removeTodo(req.params["id"]!, req.session.userId!);
    res.json({ message: "Todo deleted." });
  } catch (err) {
    next(err);
  }
}

export async function listAssignableMembers(req: Request, res: Response, next: NextFunction) {
  try {
    const members = await getAssignableFamilyMembers(req.session.userId!);
    res.json({ members });
  } catch (err) {
    next(err);
  }
}
