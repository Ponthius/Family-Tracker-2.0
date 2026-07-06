/**
 * Helpers for managing the user's logged-in state on the frontend.
 * The server is the source of truth — these helpers just handle page redirects.
 */

type CachedUser = { id: string; name: string; email: string };

export function getCachedUser(): CachedUser | null {
  const stored = localStorage.getItem("user");
  if (!stored) return null;
  try {
    return JSON.parse(stored) as CachedUser;
  } catch {
    return null;
  }
}

export function redirectIfGuest(): void {
  if (navigator.onLine) {
    fetch("/api/auth/me", { credentials: "include" })
      .then((res) => {
        if (!res.ok) location.replace("/pages/login.html");
      })
      .catch(() => {
        if (!getCachedUser()) location.replace("/pages/login.html");
      });
    return;
  }

  if (!getCachedUser()) {
    location.replace("/pages/login.html");
  }
}

export function redirectIfLoggedIn(): void {
  if (navigator.onLine) {
    fetch("/api/auth/me", { credentials: "include" })
      .then((res) => {
        if (res.ok) location.replace("/pages/dashboard.html");
      })
      .catch(() => {
        if (getCachedUser()) location.replace("/pages/dashboard.html");
      });
    return;
  }

  if (getCachedUser()) {
    location.replace("/pages/dashboard.html");
  }
}
