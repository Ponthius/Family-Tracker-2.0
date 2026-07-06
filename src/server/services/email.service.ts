import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { env } from "../config/env.js";
import { mailer } from "../emails/mailer.js";

const __dirname = dirname(fileURLToPath(import.meta.url));

function loadTemplate(name: string, vars: Record<string, string>): string {
  const file = join(__dirname, "../emails/templates", name);
  let html = readFileSync(file, "utf-8");
  for (const [key, value] of Object.entries(vars)) {
    html = html.replaceAll(`{{${key}}}`, value);
  }
  return html;
}

async function sendMail(to: string, subject: string, html: string) {
  await mailer.sendMail({ to, subject, html, from: env.EMAIL_FROM });
}

export async function sendWelcomeEmail(to: string, name: string) {
  const html = loadTemplate("welcome.html", { name });
  await sendMail(to, "Welcome to Family Tracker", html);
}

export async function sendVerificationEmail(to: string, name: string, verificationLink: string) {
  const html = loadTemplate("verify-email.html", { name, verificationLink });
  await sendMail(to, "Verify your Family Tracker account", html);
}

export async function sendPasswordResetEmail(to: string, resetLink: string) {
  const html = loadTemplate("reset-password.html", { resetLink });
  await sendMail(to, "Reset your password", html);
}
