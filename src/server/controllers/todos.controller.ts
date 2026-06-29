import type { Request, Response, NextFunction } from "express";
import {
  getTodosForUser,
  addTodo,
  editTodo,
  removeTodo,
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
    const { title } = req.body as { title: string };
    const todo = await addTodo(req.session.userId!, title);
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
