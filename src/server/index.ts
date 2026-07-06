import "dotenv/config";
import { app } from "./config/app.js";
import { env } from "./config/env.js";
import { startCleanupScheduler } from "./services/cleanup.service.js";
import { ensureDefaultSuperAdmin } from "./services/auth.service.js";

if (env.NODE_ENV !== "test") {
  startCleanupScheduler();
}

void ensureDefaultSuperAdmin().catch((error) => {
  console.error("Failed to seed super admin:", error);
});

app.listen(env.PORT, () => {
  console.log(`Server running at http://localhost:${env.PORT}`);
});
