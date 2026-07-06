/**
 * Helpers for managing the user's logged-in state on the frontend.
 * The server is the source of truth — these helpers just handle page redirects.
 */
export function redirectIfGuest() {
    // If an API call returns 401, the user is not logged in — send them to login.
    window.addEventListener("unhandledrejection", (e) => {
        if (e.reason instanceof Error && e.reason.message.includes("logged in")) {
            location.replace("/pages/login.html");
        }
    });
}
export function redirectIfLoggedIn() {
    // Call /api/auth/me; if it succeeds, the user is already logged in.
    fetch("/api/auth/me", { credentials: "include" }).then((res) => {
        if (res.ok)
            location.replace("/pages/todos.html");
    });
}
