// src/client/scripts/profile.ts
import { api } from "../lib/api";
import { redirectIfGuest } from "../lib/session";
import { t, loadLanguage, setLanguage } from "../lib/i18n";
import { Navbar } from "../components/Navbar";

type User = {
  name: string;
  username: string;
  fullname: string;
  email: string;
};

function showSuccess(msg: string) {
  const el = document.getElementById("success-msg")!;
  el.textContent = msg;
  el.classList.remove("hidden");
  document.getElementById("error-msg")!.classList.add("hidden");
  setTimeout(() => el.classList.add("hidden"), 3000);
}

function showError(msg: string) {
  const el = document.getElementById("error-msg")!;
  el.textContent = msg;
  el.classList.remove("hidden");
  document.getElementById("success-msg")!.classList.add("hidden");
  setTimeout(() => el.classList.add("hidden"), 5000);
}

function applyTranslations() {
  document.querySelectorAll("[data-i18n]").forEach((el) => {
    const key = el.getAttribute("data-i18n");
    if (key) el.textContent = t(key);
  });
}

async function loadProfile() {
  // FIXED: api.get is generic — tell it what shape to expect
  const { user } = await api.get<{ user: User }>("/api/auth/me");

  (document.getElementById("username") as HTMLInputElement).value = user.username ?? "";
  (document.getElementById("fullname") as HTMLInputElement).value = user.fullname ?? "";
  (document.getElementById("email") as HTMLInputElement).value = user.email ?? "";

  document.body.prepend(Navbar({ userName: user.name }));
}

async function saveProfileSettings() {
  const username = (document.getElementById("username") as HTMLInputElement).value.trim();
  const fullname = (document.getElementById("fullname") as HTMLInputElement).value.trim();
  const email = (document.getElementById("email") as HTMLInputElement).value.trim();
  const currentPassword = (document.getElementById("current-password") as HTMLInputElement).value;
  const newPassword = (document.getElementById("new-password") as HTMLInputElement).value;
  const confirmPassword = (document.getElementById("confirm-password") as HTMLInputElement).value;

  if (newPassword || confirmPassword) {
    if (!currentPassword) return showError("Please enter your current password to set a new one.");
    if (newPassword !== confirmPassword) return showError("New passwords do not match.");
    if (newPassword.length < 4) return showError("New password must be at least 4 characters.");
  }

  try {
    // NOTE: confirm with the team these routes exist — not in the documented API reference yet
    // FIXED: api.ts only has GET/POST/PATCH/DELETE — no PUT
    await api.patch("/api/profile", { username, fullname, email });

    if (newPassword && currentPassword) {
      await api.patch("/api/profile/password", { currentPassword, newPassword });
    }

    (document.getElementById("current-password") as HTMLInputElement).value = "";
    (document.getElementById("new-password") as HTMLInputElement).value = "";
    (document.getElementById("confirm-password") as HTMLInputElement).value = "";
    showSuccess(t("messages_success"));
  } catch (err: any) {
    showError(err.message);
  }
}

async function init() {
  redirectIfGuest();
  await loadLanguage();
  applyTranslations();
  await loadProfile();

  document.getElementById("back-btn")!.addEventListener("click", () => history.back());
  document.getElementById("save-btn")!.addEventListener("click", saveProfileSettings);
  document.getElementById("language-select")!.addEventListener("change", (e) => {
    setLanguage((e.target as HTMLSelectElement).value);
    applyTranslations();
  });
  document.getElementById("change-photo-btn")!.addEventListener("click", () => {
    document.getElementById("photo-input")!.click();
  });
}

init();