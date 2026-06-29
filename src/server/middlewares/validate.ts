import type { Request, Response, NextFunction } from "express";
import { ZodSchema, ZodError } from "zod";

/**
 * Returns a middleware that validates req.body against a Zod schema.
 * If validation fails, it sends a 400 response with the list of errors.
 * If it passes, the validated (and typed) data is available as req.body.
 *
 * Usage in a route file:
 *   router.post("/login", validate(loginSchema), login);
 */
export function validate(schema: ZodSchema) {
  return (req: Request, res: Response, next: NextFunction) => {
    const result = schema.safeParse(req.body);
    if (!result.success) {
      const errors = formatZodError(result.error);
      res.status(400).json({ error: "Validation failed", errors });
      return;
    }
    req.body = result.data;
    next();
  };
}

function formatZodError(error: ZodError) {
  return error.errors.map((e) => ({
    field: e.path.join("."),
    message: e.message,
  }));
}
