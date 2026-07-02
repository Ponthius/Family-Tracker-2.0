import { loadLanguage, t } from "../lib/i18n.js";
import { api } from "../lib/api.js";
import { redirectIfLoggedIn } from "../lib/session.js";

redirectIfLoggedIn();

await loadLanguage();

const form = document.getElementById("login-form") as HTMLFormElement;
const errorBox = document.getElementById("error-message") as HTMLParagraphElement;

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

  const payload: LoginPayload = {
    username: usernameInput.value.trim(),
    password: passwordInput.value.trim(),
  };

  if (!payload.username || !payload.password) {
    showError("Please enter both username and password.");
    return;
  }

  try {
    const response = await api.post("/api/auth/login", { email, password });
    if (response.user) {
      localStorage.setItem('user', JSON.stringify(response.user));
    }
    location.replace("/pages/dashboard.html");
  } catch (err) {
    errorBox.textContent = err instanceof Error ? err.message : t("error_empty_title");
  }
});
