import nodemailer from "nodemailer";
import { env } from "../config/env.js";

/**
 * A single shared Nodemailer transport.
 * Call mailer.sendMail({ to, subject, html }) to send an email.
 */
export const mailer = nodemailer.createTransport({
  host: env.SMTP_HOST,
  port: env.SMTP_PORT,
  auth: {
    user: env.SMTP_USER,
    pass: env.SMTP_PASS,
  },
  from: env.EMAIL_FROM,
});
