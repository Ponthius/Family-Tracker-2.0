import { Router } from "express";
import { authRouter } from "./auth.routes.js";
import { todosRouter } from "./todos.routes.js";
import { dashboardRouter } from "./dashboard.routes.js";
import { auditRouter } from "./audit.routes.js";

export const router = Router();

router.use("/auth", authRouter);
router.use("/todos", todosRouter);
router.use("/dashboard", dashboardRouter);
router.use("/audit", auditRouter);
