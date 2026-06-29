import type { Request, Response, NextFunction } from "express";

/**
 * A custom error class that carries an HTTP status code.
 * Throw this from services and controllers to send a consistent error response.
 *
 * Example:
 *   throw new AppError(404, "Todo not found");
 */
export class AppError extends Error {
  constructor(
    public readonly statusCode: number,
    message: string,
  ) {
    super(message);
    this.name = "AppError";
  }
}

/**
 * Global Express error handler. Register this LAST in app.ts (after all routes).
 * It catches any error passed to next(error) and sends a JSON response.
 */
export function errorHandler(
  err: unknown,
  _req: Request,
  res: Response,
  _next: NextFunction,
) {
  if (err instanceof AppError) {
    res.status(err.statusCode).json({ error: err.message });
    return;
  }
  console.error("Unexpected error:", err);
  res.status(500).json({ error: "Something went wrong. Please try again." });
}
