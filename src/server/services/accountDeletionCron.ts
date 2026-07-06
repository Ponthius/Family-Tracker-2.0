// ─────────────────────────────────────────────────────────────────────────────
//  Family Tracker — Account Deletion Cron Jobs
//  server/cron/accountDeletionCron.ts
//
//  Handles two background jobs:
//
//  JOB 1 — Deletion Reminder Email
//    Schedule : Every hour  →  '0 * * * *'
//    Action   : Finds accounts newly set to 'pending_deletion' that have not
//               yet received a reminder email, and sends one immediately.
//
//  JOB 2 — Permanent Account Deletion
//    Schedule : Daily at midnight  →  '0 0 * * *'
//    Action   : Permanently deletes any pending_deletion account whose
//               7-day grace period has expired.
//
//  Dependencies:
//    npm install node-cron nodemailer pg
//    npm install --save-dev @types/node-cron @types/nodemailer @types/pg
//
//  Usage in server.ts:
//    import { initAccountDeletionCron } from './cron/accountDeletionCron';
//    initAccountDeletionCron(pool);
//
//  pool: pg Pool instance from 'pg'
// ─────────────────────────────────────────────────────────────────────────────

// node-cron is published as an ESM-only package. Import it dynamically
// at runtime to avoid CommonJS/ESM interop issues when this file is
// compiled/loaded as CommonJS.
let cron: any;
import nodemailer, { Transporter, SendMailOptions } from 'nodemailer';
import { Pool, QueryResult } from 'pg';

// ── Types ─────────────────────────────────────────────────────────────────────

type UserRole = 'family_admin' | 'father' | 'mother' | 'child' | 'invited_user';
type AuditStatus = 'Success' | 'Failed';
type CronStatus  = 'success' | 'failed';

interface PendingAccount {
  id         : number;
  username   : string;
  email      : string;
  role       : UserRole;
  family_id  : number | null;
  deletion_date: string;
}

// ── Email Transporter — reads your .env SMTP_* variables ─────────────────────

const transporter: Transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: parseInt(process.env.SMTP_PORT ?? '587', 10),
  secure: process.env.SMTP_PORT === '465',   // true only for port 465
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

const EMAIL_FROM: string = process.env.EMAIL_FROM ?? '"Family Tracker" <no-reply@familytracker.local>';

// ─────────────────────────────────────────────────────────────────────────────
//  JOB 1: Deletion Reminder Email
//  Schedule: Every hour  →  '0 * * * *'
//
//  Finds every account in 'pending_deletion' status where reminder_sent = false.
//  Sends a confirmation email explaining the grace period and how to recover,
//  then marks reminder_sent = true so the email is never sent twice.
// ─────────────────────────────────────────────────────────────────────────────
async function job_sendDeletionReminderEmail(pool: Pool): Promise<number> {
  const result: QueryResult<PendingAccount> = await pool.query(
    `SELECT id, username, email, role, family_id, deletion_date
     FROM   accounts
     WHERE  status         = 'pending_deletion'
       AND  reminder_sent  = false`
  );

  const accounts: PendingAccount[] = result.rows;
  let count: number = 0;

  for (const account of accounts) {
    try {
      await sendDeletionReminderEmail(account);

      await pool.query(
        `UPDATE accounts SET reminder_sent = true WHERE id = $1`,
        [account.id]
      );

      await writeAuditLog(
        pool,
        account.username,
        account.role,
        account.family_id,
        'Deletion Reminder Email Sent',
        'Success'
      );

      count++;
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err);
      console.error(
        `[DeletionReminder] Failed for "${account.username}": ${message}`
      );
      await writeAuditLog(
        pool,
        account.username,
        account.role,
        account.family_id,
        'Deletion Reminder Email Sent',
        'Failed'
      );
    }
  }

  return count;
}

// ─────────────────────────────────────────────────────────────────────────────
//  JOB 2: Permanent Account Deletion
//  Schedule: Daily at midnight  →  '0 0 * * *'
//
//  Finds all 'pending_deletion' accounts whose deletion_date has passed.
//  Routes to the correct deletion handler based on role:
//    family_admin → deletes entire family and all associated data
//    all others   → deletes only that user and their personal data
// ─────────────────────────────────────────────────────────────────────────────
async function job_permanentlyDeleteExpiredAccounts(pool: Pool): Promise<number> {
  const result: QueryResult<PendingAccount> = await pool.query(
    `SELECT id, username, email, role, family_id, deletion_date
     FROM   accounts
     WHERE  status        = 'pending_deletion'
       AND  deletion_date <= NOW()`
  );

  const expired: PendingAccount[] = result.rows;
  let count: number = 0;

  for (const account of expired) {
    try {
      if (account.role === 'family_admin') {
        await deleteFamilyAdminAccount(pool, account);
      } else {
        await deleteUserAccount(pool, account);
      }

      await writeAuditLog(
        pool,
        account.username,
        account.role,
        account.family_id,
        'Account Permanently Deleted',
        'Success'
      );

      count++;
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err);
      console.error(
        `[PermanentDeletion] Failed for "${account.username}": ${message}`
      );
      await writeAuditLog(
        pool,
        account.username,
        account.role,
        account.family_id,
        'Account Permanently Deleted',
        'Failed'
      );
    }
  }

  return count;
}

// ─────────────────────────────────────────────────────────────────────────────
//  DELETION HELPERS
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Permanently deletes a Family Admin and ALL associated family data.
 * Cascade order respects foreign key constraints:
 *   tasks → schedules → events → accounts (all members) → families
 */
async function deleteFamilyAdminAccount(
  pool   : Pool,
  account: PendingAccount
): Promise<void> {
  const { id, username, family_id } = account;

  if (!family_id) {
    await pool.query(`DELETE FROM accounts WHERE id = $1`, [id]);
    console.log(
      `[PermanentDeletion] Deleted orphaned admin "${username}" (id:${id}) — no family linked.`
    );
    return;
  }

  await pool.query(`DELETE FROM tasks      WHERE family_id = $1`, [family_id]);
  await pool.query(`DELETE FROM schedules  WHERE family_id = $1`, [family_id]);
  await pool.query(`DELETE FROM events     WHERE family_id = $1`, [family_id]);
  await pool.query(`DELETE FROM accounts   WHERE family_id = $1`, [family_id]);
  await pool.query(`DELETE FROM families   WHERE id        = $1`, [family_id]);

  console.log(
    `[PermanentDeletion] Family admin "${username}" (id:${id}) permanently deleted. ` +
    `All family data removed (family_id:${family_id}).`
  );
}

/**
 * Permanently deletes a single user and their personal data only.
 * Does NOT affect other family members or shared family data.
 */
async function deleteUserAccount(
  pool   : Pool,
  account: PendingAccount
): Promise<void> {
  const { id, username } = account;

  await pool.query(`DELETE FROM tasks      WHERE assigned_to = $1`, [id]);
  await pool.query(`DELETE FROM schedules  WHERE user_id     = $1`, [id]);
  await pool.query(`DELETE FROM accounts   WHERE id          = $1`, [id]);

  console.log(
    `[PermanentDeletion] User "${username}" (id:${id}) permanently deleted. Family data untouched.`
  );
}

// ─────────────────────────────────────────────────────────────────────────────
//  EMAIL SENDER
// ─────────────────────────────────────────────────────────────────────────────
async function sendDeletionReminderEmail(account: PendingAccount): Promise<void> {
  const gracePeriodEnd: string = new Date(account.deletion_date).toLocaleDateString('en-US', {
    weekday: 'long',
    month  : 'long',
    day    : 'numeric',
    year   : 'numeric',
  });

  const mailOptions: SendMailOptions = {
    from   : EMAIL_FROM,
    to     : account.email,
    subject: 'Family Tracker — Your Account is Scheduled for Deletion',
    text   :
      `Hello ${account.username},\n\n` +
      `We received a request to delete your Family Tracker account.\n\n` +
      `Your account has entered a 7-day grace period and will be permanently\n` +
      `deleted on:\n\n` +
      `   ${gracePeriodEnd}\n\n` +
      `──────────────────────────────────────\n` +
      `CHANGED YOUR MIND?\n` +
      `──────────────────────────────────────\n` +
      `You can recover your account any time before ${gracePeriodEnd}\n` +
      `by logging in and selecting "Recover Account".\n\n` +
      `After this date, your account and ALL associated data will be\n` +
      `permanently deleted and cannot be restored.\n\n` +
      `If you did not request this deletion, log in immediately and\n` +
      `change your password to secure your account.\n\n` +
      `— The Family Tracker Team`,
  };

  await transporter.sendMail(mailOptions);

  console.log(
    `[DeletionReminder] Email sent → ${account.email} ` +
    `(${account.username}, grace period ends: ${gracePeriodEnd}).`
  );
}

// ─────────────────────────────────────────────────────────────────────────────
//  AUDIT LOGGER
//  Writes to the audit_logs table. Silently swallows errors so a logging
//  failure never crashes a running job.
// ─────────────────────────────────────────────────────────────────────────────
async function writeAuditLog(
  pool    : Pool,
  username: string,
  userRole: string,
  familyId: number | null,
  action  : string,
  status  : AuditStatus
): Promise<void> {
  try {
    await pool.query(
      `INSERT INTO audit_logs
         (username, user_role, family_id, action, status, created_at)
       VALUES ($1, $2, $3, $4, $5, NOW())`,
      [username, userRole, familyId, action, status]
    );
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    console.error(
      `[AuditLog] Failed to write record — action:"${action}", user:"${username}": ${message}`
    );
  }
}

// ─────────────────────────────────────────────────────────────────────────────
//  CRON AUDIT LOGGER
//  Writes a summary record to cron_audit_log after every job execution.
// ─────────────────────────────────────────────────────────────────────────────
async function writeCronAuditLog(
  pool            : Pool,
  jobName         : string,
  status          : CronStatus,
  recordsProcessed: number,
  notes           : string
): Promise<void> {
  const now           = new Date();
  const executionDate = now.toISOString().split('T')[0];
  const executionTime = now.toTimeString().split(' ')[0];

  try {
    await pool.query(
      `INSERT INTO cron_audit_log
         (job_name, execution_date, execution_time, status, records_processed, notes)
       VALUES ($1, $2, $3, $4, $5, $6)`,
      [jobName, executionDate, executionTime, status, recordsProcessed, notes]
    );
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    console.error(`[CronAuditLog] Failed to write record for "${jobName}": ${message}`);
  }
}

// ─────────────────────────────────────────────────────────────────────────────
//  JOB RUNNER WRAPPER
//  Catches any unhandled error so one failing job never stops the other.
// ─────────────────────────────────────────────────────────────────────────────
async function runJob(
  pool   : Pool,
  jobName: string,
  jobFn  : (pool: Pool) => Promise<number>
): Promise<void> {
  console.log(`[${new Date().toISOString()}] CRON START — ${jobName}`);
  try {
    const recordsProcessed: number = await jobFn(pool);
    await writeCronAuditLog(pool, jobName, 'success', recordsProcessed, '');
    console.log(
      `[${new Date().toISOString()}] CRON DONE  — ${jobName} | records: ${recordsProcessed}`
    );
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    await writeCronAuditLog(pool, jobName, 'failed', 0, message);
    console.error(`[${new Date().toISOString()}] CRON FAIL  — ${jobName} | ${message}`);
  }
}

// ─────────────────────────────────────────────────────────────────────────────
//  INIT — Register schedules
//  Call once in server.ts after your pg Pool is ready.
// ─────────────────────────────────────────────────────────────────────────────
export function initAccountDeletionCron(pool: Pool): void {

  // dynamic import to support ESM-only node-cron when running under CommonJS
  void (async () => {
    try {
      const mod = await import('node-cron');
      cron = (mod && (mod.default ?? mod));

      // Every hour — send reminder emails to newly pending accounts
      cron.schedule('0 * * * *', (): void => {
        runJob(pool, 'Deletion Reminder Email', job_sendDeletionReminderEmail);
      });

      // Daily at midnight — permanently delete expired accounts
      cron.schedule('0 0 * * *', (): void => {
        runJob(pool, 'Permanent Account Deletion', job_permanentlyDeleteExpiredAccounts);
      });

      console.log('[AccountDeletionCron] Jobs registered:');
      console.log('  Every hour  — Deletion Reminder Email');
      console.log('  00:00 daily — Permanent Account Deletion');
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err);
      console.error(`[AccountDeletionCron] Failed to load node-cron: ${message}`);
    }
  })();
}
