import { loadLanguage, t } from "../lib/i18n.js";
import { api } from "../lib/api.js";
import { redirectIfLoggedIn } from "../lib/session.js";

redirectIfLoggedIn();

await loadLanguage();

const form = document.getElementById("registerForm") as HTMLFormElement;
const errorBox = document.getElementById("errorMsg") as HTMLParagraphElement;
const successBox = document.getElementById("successMsg") as HTMLParagraphElement;

function showError(message: string): void {
  errorBox.textContent = message;
  errorBox.classList.remove("hidden");
}

function clearError(): void {
  errorBox.textContent = "";
  errorBox.classList.add("hidden");
}

function showSuccess(message: string): void {
  if (!successBox) return;
  successBox.textContent = message;
  successBox.classList.remove("hidden");
}

function clearSuccess(): void {
  if (!successBox) return;
  successBox.textContent = "";
  successBox.classList.add("hidden");
}

form.addEventListener("submit", async (e) => {
  e.preventDefault();
  clearError();
  clearSuccess();

  const username = (document.getElementById("username") as HTMLInputElement).value.trim();
  const email = (document.getElementById("email") as HTMLInputElement).value.trim();
  const password = (document.getElementById("password") as HTMLInputElement).value;
  const confirmPassword = (document.getElementById("confirmPassword") as HTMLInputElement).value;
  const familyName = (document.getElementById("familyName") as HTMLInputElement).value.trim();

  // Validation
  if (!username || !email || !password || !confirmPassword || !familyName) {
    showError("All fields are required.");
    return;
  }

  if (password !== confirmPassword) {
    showError("Passwords do not match.");
    return;
  }

  if (password.length < 6) {
    showError("Password must be at least 6 characters long.");
    return;
  }

  // Basic email validation
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    showError("Please enter a valid email address.");
    return;
  }

  try {
    const response = await api.post<{ verificationLink?: string }>("/api/auth/register", { username, email, password, familyName });
    if (response.verificationLink) {
      showSuccess(`Account created. Verify your email using this link: ${response.verificationLink}`);
      return;
    }
    showSuccess("Account created. Check your email to verify your account.");
  } catch (err) {
    showError(err instanceof Error ? err.message : "Unable to create your account.");
  }
});

document.querySelector<HTMLElement>("[data-lang]")?.addEventListener("click", () => {
  document.title = t("app_name");
});
