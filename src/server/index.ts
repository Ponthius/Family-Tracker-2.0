import "dotenv/config";
import { app } from "./config/app.js";
import { env } from "./config/env.js";
import { Pool } from 'pg';
import { initAccountDeletionCron } from './services/accountDeletionCron';

app.listen(env.PORT, () => {
  console.log(`Server running at http://localhost:${env.PORT}`);
});


const pool = new Pool({ connectionString: process.env.DATABASE_URL });
initAccountDeletionCron(pool);