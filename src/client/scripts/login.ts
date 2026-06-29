import { loadLanguage, t } from "../lib/i18n.js";
import { api } from "../lib/api.js";
import { redirectIfLoggedIn } from "../lib/session.js";

redirectIfLoggedIn();

await loadLanguage();

const form = document.getElementById("login-form") as HTMLFormElement;
const errorBox = document.getElementById("error-message") as HTMLParagraphElement;

form.addEventListener("submit", async (e) => {
  e.preventDefault();
  errorBox.textContent = "";

  const email = (document.getElementById("email") as HTMLInputElement).value;
  const password = (document.getElementById("password") as HTMLInputElement).value;

  try {
    await api.post("/api/auth/login", { email, password });
    location.replace("/pages/todos.html");
  } catch (err) {
    errorBox.textContent = err instanceof Error ? err.message : t("error_empty_title");
  }
});
