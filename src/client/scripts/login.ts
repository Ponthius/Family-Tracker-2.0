// ─────────────────────────────────────────────
//  Family Tracker — Login Page Logic
//  login.ts
// ─────────────────────────────────────────────

interface LoginPayload {
  username: string;
  password: string;
}

interface LoginErrorResponse {
  error?: string;
}

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

  const payload: LoginPayload = {
    username: usernameInput.value.trim(),
    password: passwordInput.value.trim(),
  };

  if (!payload.username || !payload.password) {
    showError("Please enter both username and password.");
    return;
  }

  try {
    const res = await fetch("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
      const data: LoginErrorResponse = await res.json().catch(() => ({}));
      showError(data.error || "Invalid username or password.");
      return;
    }

    window.location.href = "/dashboard";
  } catch {
    showError("Unable to reach the server. Please try again.");
  }
});
