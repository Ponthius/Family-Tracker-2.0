import { Router } from "express";
import {
  listTodos,
  createTodo,
  updateTodo,
  deleteTodo,
  listAssignableMembers,
} from "../controllers/todos.controller.js";
import { requireAuth } from "../middlewares/requireAuth.js";

export const todosRouter = Router();

todosRouter.use(requireAuth);

todosRouter.get("/", listTodos);
todosRouter.get("/members", listAssignableMembers);
todosRouter.post("/", createTodo);
todosRouter.patch("/:id", updateTodo);
todosRouter.delete("/:id", deleteTodo);
