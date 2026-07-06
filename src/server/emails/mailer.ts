import nodemailer from "nodemailer";
import { env } from "../config/env.js";

/**
 * A single shared Nodemailer transport.
 * Call mailer.sendMail({ to, subject, html }) to send an email.
 * When email is disabled, this becomes a no-op transport so auth flows keep working.
 */
const disabledMailer = {
  async sendMail() {
    return { accepted: [], rejected: [] };
  },
};

export const mailer =
  env.EMAIL_ENABLED && env.SMTP_HOST && env.SMTP_USER && env.SMTP_PASS
    ? nodemailer.createTransport({
        host: env.SMTP_HOST,
        port: env.SMTP_PORT,
        auth: {
          user: env.SMTP_USER,
          pass: env.SMTP_PASS,
        },
        from: env.EMAIL_FROM,
      })
    : disabledMailer;
