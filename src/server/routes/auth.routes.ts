import { Router } from "express";
import { deleteMe, login, logout, me, register, resendVerificationEmail, updateFamilyBranding, verify } from "../controllers/auth.controller.js";
import { requireAuth, requireGuest } from "../middlewares/requireAuth.js";

export const authRouter = Router();

// POST /api/auth/register
authRouter.post("/register", requireGuest, register);

// POST /api/auth/login
authRouter.post("/login", requireGuest, login);

// GET /api/auth/verify?token=...
authRouter.get("/verify", verify);

// POST /api/auth/resend-verification
authRouter.post("/resend-verification", requireGuest, resendVerificationEmail);

// GET  /api/auth/me
authRouter.get("/me", requireAuth, me);

// POST /api/auth/logout
authRouter.post("/logout", requireAuth, logout);

// DELETE /api/auth/me
authRouter.delete("/me", requireAuth, deleteMe);

// PATCH /api/auth/branding
authRouter.patch("/branding", requireAuth, updateFamilyBranding);
