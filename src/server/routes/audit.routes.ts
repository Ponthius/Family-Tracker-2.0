import { Router } from "express";
import { listAudit } from "../controllers/audit.controller.js";
import { requireAuth } from "../middlewares/requireAuth.js";

export const auditRouter = Router();

auditRouter.get("/", requireAuth, listAudit);
