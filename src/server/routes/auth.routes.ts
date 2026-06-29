import { Router } from "express";
import { login, logout, me, register } from "../controllers/auth.controller.js";
import { requireAuth, requireGuest } from "../middlewares/requireAuth.js";

export const authRouter = Router();

// POST /api/auth/register
authRouter.post("/register", requireGuest, register);

// POST /api/auth/login
authRouter.post("/login", requireGuest, login);

// GET  /api/auth/me
authRouter.get("/me", requireAuth, me);

// POST /api/auth/logout
authRouter.post("/logout", requireAuth, logout);
