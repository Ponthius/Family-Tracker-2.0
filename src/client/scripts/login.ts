// ─────────────────────────────────────────────
//  Family Tracker — Login Page Logic
//  login.ts
// ─────────────────────────────────────────────

import { loadLanguage, t } from "../lib/i18n.js";
import { api } from "../lib/api.js";
import { redirectIfLoggedIn } from "../lib/session.js";

redirectIfLoggedIn();

await loadLanguage();

const form = document.getElementById("loginForm") as HTMLFormElement;
const usernameInput = document.getElementById("username") as HTMLInputElement;
const passwordInput = document.getElementById("password") as HTMLInputElement;
const errorMsg = document.getElementById("errorMsg") as HTMLParagraphElement;

function showError(message: string): void {
  errorMsg.textContent = message;
  errorMsg.classList.remove("hidden");
}

function clearError(): void {
  errorMsg.textContent = "";
  errorMsg.classList.add("hidden");
}

form.addEventListener("submit", async (e: SubmitEvent) => {
  e.preventDefault();
  clearError();

  const username = usernameInput.value.trim();
  const password = passwordInput.value.trim();

  if (!username || !password) {
    showError("Please enter both username and password.");
    return;
  }

  try {
    const data = await api.post<{ user: { role?: string } }>("/api/auth/login", { username, password });
    localStorage.setItem("user", JSON.stringify(data.user));
    const me = await api.get<{ user: { family?: { name?: string | null; logoUrl?: string | null; accentColor?: string | null }; language?: string | null } }>("/api/auth/me");
    localStorage.setItem("familyBranding", JSON.stringify(me.user.family ?? {}));
    localStorage.setItem("language", me.user.language || "en");

    window.location.href = data.user.role === "SuperAdmin" ? "/pages/super-admin.html" : "/pages/dashboard.html";
  } catch (err) {
    showError(err instanceof Error ? err.message : "Unable to reach the server. Please try again.");
  }
});
