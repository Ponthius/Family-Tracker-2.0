import { env } from "../config/env.js";

const isDev = env.NODE_ENV === "development";

export const logger = {
  info: (...args: unknown[]) => console.log("[INFO]", ...args),
  warn: (...args: unknown[]) => console.warn("[WARN]", ...args),
  error: (...args: unknown[]) => console.error("[ERROR]", ...args),
  debug: (...args: unknown[]) => {
    if (isDev) console.log("[DEBUG]", ...args);
  },
};
