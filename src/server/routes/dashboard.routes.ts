import { Router } from "express";
import { requireAuth } from "../middlewares/requireAuth.js";
import { getStats, getRecent, getUpcoming } from "../controllers/dashboard.controller.js";

export const dashboardRouter = Router();

dashboardRouter.get("/stats", requireAuth, getStats);
dashboardRouter.get("/recent-tasks", requireAuth, getRecent);
dashboardRouter.get("/upcoming-tasks", requireAuth, getUpcoming);
