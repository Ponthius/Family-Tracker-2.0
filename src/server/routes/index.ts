import { Router } from "express";
import { authRouter } from "./auth.routes.js";
import { todosRouter } from "./todos.routes.js";

export const router = Router();

router.use("/auth", authRouter);
router.use("/todos", todosRouter);
