import type { Request, Response, NextFunction } from "express";
import {
  getDashboardStats,
  getRecentTasks,
  getUpcomingTasks,
} from "../services/dashboard.service.js";

export async function getStats(req: Request, res: Response, next: NextFunction) {
  try {
    const stats = await getDashboardStats(req.session.userId!);
    res.json({ success: true, stats });
  } catch (err) {
    next(err);
  }
}

export async function getRecent(req: Request, res: Response, next: NextFunction) {
  try {
    const tasks = await getRecentTasks(req.session.userId!);
    res.json({ success: true, tasks });
  } catch (err) {
    next(err);
  }
}

export async function getUpcoming(req: Request, res: Response, next: NextFunction) {
  try {
    const tasks = await getUpcomingTasks(req.session.userId!);
    res.json({ success: true, tasks });
  } catch (err) {
    next(err);
  }
}
