import type { Request, Response, NextFunction } from "express";
import {
  deleteAccount,
  getCurrentUser,
  loginUser,
  registerUser,
  resendVerification,
  updateBranding,
  updateUserProfile,
  verifyUserEmail,
} from "../services/auth.service.js";

export async function register(req: Request, res: Response, next: NextFunction) {
  try {
    const { username, email, password, familyName } = req.body as {
      username: string;
      email: string;
      password: string;
      familyName: string;
    };
    const result = await registerUser(username, email, password, familyName);
    const user = result.user;
    res.status(201).json({ 
      user: { 
        id: user.id, 
        username: user.username, 
        fullName: user.fullName,
        email: user.email,
        role: user.role,
        familyId: user.familyId,
        emailVerified: user.emailVerified,
      },
      verificationLink: result.verificationLink,
    });
  } catch (err) {
    next(err);
  }
}

export async function login(req: Request, res: Response, next: NextFunction) {
  try {
    const { username, email, password } = req.body as { username?: string; email?: string; password: string };
    const identifier = email ?? username ?? "";
    const user = await loginUser(identifier, password);
    req.session.userId = user.id;
    res.json({ 
      user: { 
        id: user.id, 
        username: user.username, 
        fullName: user.fullName,
        email: user.email,
        role: user.role,
        familyId: user.familyId,
        emailVerified: user.emailVerified,
      },
    });
  } catch (err) {
    next(err);
  }
}

export async function me(req: Request, res: Response, next: NextFunction) {
  try {
    const user = await getCurrentUser(req.session.userId!);
    res.json({ 
      user: { 
        id: user.id, 
        username: user.username, 
        fullName: user.fullName,
        email: user.email,
        role: user.role,
        familyId: user.familyId,
        family: user.family,
        emailVerified: user.emailVerified,
      },
    });
  } catch (err) {
    next(err);
  }
}

export function logout(req: Request, res: Response, next: NextFunction) {
  req.session.destroy((err) => {
    if (err) return next(err);
    res.clearCookie("connect.sid");
    res.json({ message: "Logged out." });
  });
}

export async function verify(req: Request, res: Response, next: NextFunction) {
  try {
    const token = String(req.query.token ?? "");
    const user = await verifyUserEmail(token);
    res.json({
      message: "Email verified successfully.",
      user: {
        id: user.id,
        username: user.username,
        fullName: user.fullName,
        email: user.email,
        role: user.role,
        familyId: user.familyId,
        emailVerified: user.emailVerified,
      },
    });
  } catch (err) {
    next(err);
  }
}

export async function resendVerificationEmail(req: Request, res: Response, next: NextFunction) {
  try {
    const { identifier } = req.body as { identifier?: string };
    const user = await resendVerification(identifier ?? "");
    res.json({
      message: "Verification email sent.",
      user: {
        id: user.id,
        username: user.username,
        fullName: user.fullName,
        email: user.email,
        emailVerified: user.emailVerified,
      },
    });
  } catch (err) {
    next(err);
  }
}

export async function deleteMe(req: Request, res: Response, next: NextFunction) {
  try {
    const result = await deleteAccount(req.session.userId!);
    req.session.destroy(() => undefined);
    res.json({
      message: "Your account has been scheduled for deletion.",
      deletion: result,
    });
  } catch (err) {
    next(err);
  }
}

export async function updateFamilyBranding(req: Request, res: Response, next: NextFunction) {
  try {
    const { familyName, logoUrl, accentColor } = req.body as { familyName?: string; logoUrl?: string; accentColor?: string };
    const family = await updateBranding(req.session.userId!, familyName ?? "", logoUrl, accentColor);
    res.json({ family });
  } catch (err) {
    next(err);
  }
}

export async function updateProfile(req: Request, res: Response, next: NextFunction) {
  try {
    const { username, fullName, language, currentPassword, newPassword } = req.body as {
      username?: string;
      fullName?: string;
      language?: string;
      currentPassword?: string;
      newPassword?: string;
    };
    const user = await updateUserProfile(req.session.userId!, { username, fullName, language, currentPassword, newPassword });
    res.json({ user: { id: user.id, username: user.username, fullName: user.fullName, email: user.email, role: user.role, language: user.language } });
  } catch (err) {
    next(err);
  }
}
