import type { Request, Response, NextFunction } from "express";
import {
  createFamilyMember,
  getFamilyDashboard,
  listFamilyMembers,
  listFamilySchedules,
  listTenants,
} from "../services/family.service.js";
import { getCurrentUser } from "../services/auth.service.js";
import { AppError } from "../utils/errors.js";

export async function familyOverview(req: Request, res: Response, next: NextFunction) {
  try {
    const data = await getFamilyDashboard(req.session.userId!);
    res.json(data);
  } catch (err) {
    next(err);
  }
}

export async function familyMembers(req: Request, res: Response, next: NextFunction) {
  try {
    const members = await listFamilyMembers(req.session.userId!);
    res.json({ members });
  } catch (err) {
    next(err);
  }
}

export async function familySchedules(req: Request, res: Response, next: NextFunction) {
  try {
    const schedules = await listFamilySchedules(req.session.userId!);
    res.json({ schedules });
  } catch (err) {
    next(err);
  }
}

export async function addFamilyMember(req: Request, res: Response, next: NextFunction) {
  try {
    const { username, email, password, role } = req.body as {
      username?: string;
      email?: string;
      password?: string;
      role?: string;
    };
    if (!username || !email || !password) {
      throw new AppError(400, "Username, email, and password are required.");
    }
    const member = await createFamilyMember(req.session.userId!, { username, email, password, role });
    res.status(201).json({ member });
  } catch (err) {
    next(err);
  }
}

export async function superFamilies(req: Request, res: Response, next: NextFunction) {
  try {
    const me = await getCurrentUser(req.session.userId!);
    if (me.role !== "SuperAdmin") throw new AppError(403, "Only super admins can view tenants.");
    const tenants = await listTenants();
    res.json({ tenants });
  } catch (err) {
    next(err);
  }
}
