import type { Request, Response, NextFunction } from "express";

/**
 * Blocks the request if the user is NOT logged in.
 * Use this on every route that requires authentication.
 */
export function requireAuth(req: Request, res: Response, next: NextFunction) {
  if (!req.session.userId) {
    res.status(401).json({ error: "You must be logged in to do that." });
    return;
  }
  next();
}

/**
 * Blocks the request if the user IS already logged in.
 * Use this on login/register routes to prevent double-login.
 */
export function requireGuest(req: Request, res: Response, next: NextFunction) {
  if (req.session.userId) {
    res.status(400).json({ error: "You are already logged in." });
    return;
  }
  next();
}
