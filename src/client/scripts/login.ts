// ─────────────────────────────────────────────
//  Family Tracker — Login Page Logic
//  login.ts
// ─────────────────────────────────────────────

import { loadLanguage, t } from "../lib/i18n.js";
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
    const res = await fetch("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, password }),
    });

    const data = await res.json();

    if (!res.ok) {
      showError(data.error || "Invalid username or password.");
      return;
    }

    // Store user info for UI use
    localStorage.setItem("user", JSON.stringify(data.user));
    window.location.href = "/pages/dashboard.html";
  } catch {
    showError("Unable to reach the server. Please try again.");
  }
});
