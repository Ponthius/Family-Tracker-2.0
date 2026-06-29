import session from "express-session";
import { env } from "./env.js";

// Extend express-session's types so req.session.userId is available everywhere.
declare module "express-session" {
  interface SessionData {
    userId: string;
  }
}

export const sessionMiddleware = session({
  secret: env.SESSION_SECRET,
  resave: false,
  saveUninitialized: false,
  cookie: {
    httpOnly: true,
    secure: env.NODE_ENV === "production",
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
  },
});
