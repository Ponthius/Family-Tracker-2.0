import { api } from "../lib/api.js";
import { Modal } from "../components/Modal.js";
import { loadBranding } from "../lib/branding.js";

const usernameInput = document.getElementById("username") as HTMLInputElement;
const fullNameInput = document.getElementById("fullName") as HTMLInputElement;
const emailInput = document.getElementById("email") as HTMLInputElement;
const languageSelect = document.getElementById("language") as HTMLSelectElement;
const currentPasswordInput = document.getElementById("currentPassword") as HTMLInputElement;
const newPasswordInput = document.getElementById("newPassword") as HTMLInputElement;
const confirmPasswordInput = document.getElementById("confirmPassword") as HTMLInputElement;
const familyNameInput = document.getElementById("familyName") as HTMLInputElement;
const logoUrlInput = document.getElementById("logoUrl") as HTMLInputElement;
const accentColorInput = document.getElementById("accentColor") as HTMLInputElement;
const colorCode = document.getElementById("colorCode") as HTMLSpanElement;
const logoImage = document.getElementById("logoImage") as HTMLImageElement;
const logoPlaceholder = document.getElementById("logoPlaceholder") as HTMLElement;
const successMsg = document.getElementById("successMsg") as HTMLDivElement;
const errorMsg = document.getElementById("errorMsg") as HTMLDivElement;
const saveBtn = document.getElementById("saveBtn") as HTMLButtonElement;
const deleteBtn = document.getElementById("deleteAccountBtn") as HTMLButtonElement;
const logoutBtn = document.getElementById("logoutBtn") as HTMLButtonElement;
const themeToggle = document.getElementById("themeToggle") as HTMLButtonElement;
const backBtn = document.getElementById("backBtn") as HTMLButtonElement;

function showStatus(target: HTMLDivElement, message: string) {
  target.textContent = message;
  target.hidden = false;
}

function clearStatus(target: HTMLDivElement) {
  target.hidden = true;
  target.textContent = "";
}

function showSuccess(message: string) {
  clearStatus(errorMsg);
  showStatus(successMsg, message);
}

function showError(message: string) {
  clearStatus(successMsg);
  showStatus(errorMsg, message);
}

function setThemeMode(mode: "light" | "dark") {
  document.body.classList.toggle("dark-mode", mode === "dark");
  localStorage.setItem("display_mode", mode);
  themeToggle.innerHTML = mode === "dark" ? '<i class="fas fa-sun"></i>' : '<i class="fas fa-moon"></i>';
}

function updateLogoPreview(url: string) {
  if (url.trim()) {
    logoImage.src = url.trim();
    logoImage.hidden = false;
    logoPlaceholder.hidden = true;
  } else {
    logoImage.hidden = true;
    logoPlaceholder.hidden = false;
  }
}

function loadLocalPreferences() {
  const savedMode = (localStorage.getItem("display_mode") as "light" | "dark" | null) ?? "light";
  setThemeMode(savedMode);
  const savedAccent = localStorage.getItem("workspace_theme_color");
  if (savedAccent) {
    accentColorInput.value = savedAccent;
    colorCode.textContent = savedAccent.toUpperCase();
  }
}

async function loadProfile() {
  const { user } = await api.get<{
    user: {
      username: string;
      fullName?: string | null;
      email: string;
      language?: string | null;
      family?: { name?: string | null; logoUrl?: string | null; accentColor?: string | null } | null;
    };
  }>("/api/auth/me");

  usernameInput.value = user.username ?? "";
  fullNameInput.value = user.fullName ?? "";
  emailInput.value = user.email ?? "";
  languageSelect.value = user.language ?? "en";
  familyNameInput.value = user.family?.name ?? "";
  logoUrlInput.value = user.family?.logoUrl ?? "";
  accentColorInput.value = user.family?.accentColor ?? accentColorInput.value;
  colorCode.textContent = accentColorInput.value.toUpperCase();
  updateLogoPreview(logoUrlInput.value);
}

themeToggle.addEventListener("click", () => {
  setThemeMode(document.body.classList.contains("dark-mode") ? "light" : "dark");
});

backBtn.addEventListener("click", () => history.back());

logoUrlInput.addEventListener("input", () => updateLogoPreview(logoUrlInput.value));
accentColorInput.addEventListener("input", () => {
  colorCode.textContent = accentColorInput.value.toUpperCase();
  localStorage.setItem("workspace_theme_color", accentColorInput.value);
});

saveBtn.addEventListener("click", async () => {
  try {
    const passwordFieldsFilled = Boolean(currentPasswordInput.value || newPasswordInput.value || confirmPasswordInput.value);
    if (passwordFieldsFilled) {
      if (!currentPasswordInput.value) throw new Error("Enter your current password to change it.");
      if (newPasswordInput.value.length < 8) throw new Error("New password must be at least 8 characters.");
      if (newPasswordInput.value !== confirmPasswordInput.value) throw new Error("New passwords do not match.");
    }

    await api.patch("/api/auth/profile", {
      username: usernameInput.value.trim(),
      fullName: fullNameInput.value.trim(),
      language: languageSelect.value,
      currentPassword: currentPasswordInput.value || undefined,
      newPassword: newPasswordInput.value || undefined,
    });

    await api.patch("/api/auth/branding", {
      familyName: familyNameInput.value.trim(),
      logoUrl: logoUrlInput.value.trim() || null,
      accentColor: accentColorInput.value,
    });

    localStorage.setItem("workspace_theme_color", accentColorInput.value);
    showSuccess("Profile saved successfully.");
    currentPasswordInput.value = "";
    newPasswordInput.value = "";
    confirmPasswordInput.value = "";
  } catch (error) {
    showError(error instanceof Error ? error.message : "Unable to save profile.");
  }
});

const deleteModal = Modal({
  title: "Delete Account",
  content: "This will suspend your account now and permanently remove it after 7 days.",
  confirmLabel: "DELETE",
  confirmPhrase: "DELETE",
  onConfirm: async () => {
    await api.delete("/api/auth/me");
    location.replace("/pages/login.html");
  },
});

document.body.appendChild(deleteModal.modal);
deleteBtn.addEventListener("click", () => deleteModal.open());
logoutBtn.addEventListener("click", async () => {
  await api.post("/api/auth/logout", {});
  location.replace("/pages/login.html");
});

loadLocalPreferences();
loadBranding().catch(() => undefined);
loadProfile().catch((error) => showError(error instanceof Error ? error.message : "Failed to load profile."));
