import { Router } from "express";
import { requireAuth } from "../middlewares/requireAuth.js";
import {
  addFamilyMember,
  familyMembers,
  familyOverview,
  familySchedules,
  superFamilies,
} from "../controllers/family.controller.js";

export const familyRouter = Router();

familyRouter.use(requireAuth);
familyRouter.get("/overview", familyOverview);
familyRouter.get("/members", familyMembers);
familyRouter.get("/schedules", familySchedules);
familyRouter.post("/members", addFamilyMember);
familyRouter.get("/tenants", superFamilies);
