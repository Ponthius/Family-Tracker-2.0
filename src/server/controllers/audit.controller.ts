import type { Request, Response, NextFunction } from "express";
import { getAuditTrail } from "../services/audit.service.js";
import { getCurrentUser } from "../services/auth.service.js";

export async function listAudit(req: Request, res: Response, next: NextFunction) {
  try {
    const me = await getCurrentUser(req.session.userId!);
    const familyId = me.role === "Admin" || me.role === "SuperAdmin" ? me.familyId ?? undefined : undefined;
    const logs = await getAuditTrail(familyId);
    res.json({ logs });
  } catch (err) {
    next(err);
  }
}
