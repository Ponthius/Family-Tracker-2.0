import { Router } from "express";
import {
  listTodos,
  createTodo,
  updateTodo,
  deleteTodo,
} from "../controllers/todos.controller.js";
import { requireAuth } from "../middlewares/requireAuth.js";

export const todosRouter = Router();

// All todo routes require a logged-in user
todosRouter.use(requireAuth);

// GET    /api/todos       — list all todos for the current user
todosRouter.get("/", listTodos);

// POST   /api/todos       — create a new todo
todosRouter.post("/", createTodo);

// PATCH  /api/todos/:id   — update a todo (e.g. toggle done, rename)
todosRouter.patch("/:id", updateTodo);

// DELETE /api/todos/:id   — delete a todo
todosRouter.delete("/:id", deleteTodo);
