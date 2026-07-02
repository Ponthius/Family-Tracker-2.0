import type { Request, Response, NextFunction } from "express";
import { registerUser, loginUser } from "../services/auth.service.js";
import { findUserById } from "../database/queries/users.queries.js";

export async function register(req: Request, res: Response, next: NextFunction) {
  try {
    const { username, email, password, familyName } = req.body as {
      username: string;
      email: string;
      password: string;
      familyName: string;
    };
    const user = await registerUser(username, email, password, familyName);
    req.session.userId = user.id;
    res.status(201).json({ 
      user: { 
        id: user.id, 
        username: user.username, 
        email: user.email,
        role: user.role,
        familyId: user.familyId
      } 
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
        email: user.email,
        role: user.role,
        familyId: user.familyId
      } 
    });
  } catch (err) {
    next(err);
  }
}

export async function me(req: Request, res: Response, next: NextFunction) {
  try {
    const user = await findUserById(req.session.userId!);
    if (!user) {
      res.status(401).json({ error: "Not authenticated." });
      return;
    }
    res.json({ 
      user: { 
        id: user.id, 
        username: user.username, 
        email: user.email,
        role: user.role,
        familyId: user.familyId,
        family: user.family
      } 
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
