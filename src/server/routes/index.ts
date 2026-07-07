import { Router } from "express";

import { authRouter } from "./auth.routes.js";

import { todosRouter } from "./todos.routes.js";

import { dashboardRouter } from "./dashboard.routes.js";

import { auditRouter } from "./audit.routes.js";

import { familyRouter } from "./family.routes.js";



export const router = Router();



router.use("/auth", authRouter);

// Debug route — exposes current session (development only)
router.get("/debug/session", (req, res) => {
	try {
		res.json({ session: req.session });
	} catch (err) {
		res.json({ error: String(err) });
	}
});

router.use("/todos", todosRouter);

router.use("/dashboard", dashboardRouter);

router.use("/audit", auditRouter);

router.use("/family", familyRouter);
