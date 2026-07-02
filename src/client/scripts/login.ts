import { loadLanguage, t } from "../lib/i18n.js";
import { api } from "../lib/api.js";
import { redirectIfLoggedIn } from "../lib/session.js";
import { storeOfflineAuth, validateOfflineLogin } from "../lib/offlineAuth.js";

redirectIfLoggedIn();

await loadLanguage();

const form = document.getElementById("login-form") as HTMLFormElement;
const errorBox = document.getElementById("error-message") as HTMLParagraphElement;

function isNetworkError(error: unknown): boolean {
  return (
    error instanceof Error &&
    /failed to fetch|networkerror|network error/i.test(error.message)
  );
}

form.addEventListener("submit", async (e) => {
  e.preventDefault();
  errorBox.textContent = "";

  const email = (document.getElementById("email") as HTMLInputElement).value;
  const password = (document.getElementById("password") as HTMLInputElement).value;

  if (!email || !password) {
    errorBox.textContent = t("error_empty_title");
    return;
  }

  if (navigator.onLine) {
    try {
      const response = await api.post<{ user: { id: string; name: string; email: string } }>(
        "/api/auth/login",
        { email, password },
      );
      if (response.user) {
        localStorage.setItem("user", JSON.stringify(response.user));
        await storeOfflineAuth(email, password, response.user);
      }
      location.replace("/pages/dashboard.html");
      return;
    } catch (err) {
      if (isNetworkError(err)) {
        try {
          await validateOfflineLogin(email, password);
          location.replace("/pages/dashboard.html");
          return;
        } catch (offlineErr) {
          errorBox.textContent = offlineErr instanceof Error ? offlineErr.message : String(offlineErr);
          return;
        }
      }
      errorBox.textContent = err instanceof Error ? err.message : t("error_empty_title");
      return;
    }
  }

  try {
    await validateOfflineLogin(email, password);
    location.replace("/pages/dashboard.html");
  } catch (err) {
    errorBox.textContent = err instanceof Error ? err.message : t("error_empty_title");
  }
});
