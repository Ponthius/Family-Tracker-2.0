import "dotenv/config";
import { app } from "./config/app.js";
import { env } from "./config/env.js";
import { startCleanupScheduler } from "./services/cleanup.service.js";

if (env.NODE_ENV !== "test") {
  startCleanupScheduler();
}

app.listen(env.PORT, () => {
  console.log(`Server running at http://localhost:${env.PORT}`);
});
