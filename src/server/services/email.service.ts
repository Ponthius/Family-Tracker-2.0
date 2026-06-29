import { mailer } from "../emails/mailer.js";
import { readFileSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));

function loadTemplate(name: string, vars: Record<string, string>): string {
  const file = join(__dirname, "../emails/templates", name);
  let html = readFileSync(file, "utf-8");
  for (const [key, value] of Object.entries(vars)) {
    html = html.replaceAll(`{{${key}}}`, value);
  }
  return html;
}

export async function sendWelcomeEmail(to: string, name: string) {
  const html = loadTemplate("welcome.html", { name });
  await mailer.sendMail({
    to,
    subject: "Welcome to Todo App!",
    html,
  });
}

export async function sendPasswordResetEmail(to: string, resetLink: string) {
  const html = loadTemplate("reset-password.html", { resetLink });
  await mailer.sendMail({
    to,
    subject: "Reset your password",
    html,
  });
}
