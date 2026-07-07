import { api } from "../lib/api.js";
import { Modal } from "../components/Modal.js";
import { applyTranslations, loadLanguage, t } from "../lib/i18n.js";
import { loadGlobalSettings, saveBranding, saveLanguage, saveTheme } from "../lib/settings.js";

await loadGlobalSettings().catch(() => undefined);
await loadLanguage();
applyTranslations();

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

let initialTheme = (localStorage.getItem("display_mode") as "light" | "dark" | null) ?? "light";

type CurrentUser = {
  username: string;
  fullName?: string | null;
  email: string;
  language?: string | null;
  family?: { name?: string | null; logoUrl?: string | null; accentColor?: string | null } | null;
};

let initialUser: CurrentUser | null = null;

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
  saveTheme(mode);
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
  setThemeMode(initialTheme);
  const savedAccent = localStorage.getItem("workspace_theme_color");
  if (savedAccent) {
    accentColorInput.value = savedAccent;
    colorCode.textContent = savedAccent.toUpperCase();
  }
}

async function loadProfile() {
  const { user } = await api.get<{ user: CurrentUser }>("/api/auth/me");
  initialUser = user;
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
  initialTheme = initialTheme === "dark" ? "light" : "dark";
  setThemeMode(initialTheme);
});

backBtn.addEventListener("click", () => history.back());

logoUrlInput.addEventListener("input", () => updateLogoPreview(logoUrlInput.value));
accentColorInput.addEventListener("input", () => {
  colorCode.textContent = accentColorInput.value.toUpperCase();
});

saveBtn.addEventListener("click", async () => {
  try {
    const profilePayload: Record<string, string | undefined> = {};
    const brandingPayload: Record<string, string | null | undefined> = {};

    if (usernameInput.value.trim() !== (initialUser?.username ?? "")) profilePayload.username = usernameInput.value.trim();
    if (fullNameInput.value.trim() !== (initialUser?.fullName ?? "")) profilePayload.fullName = fullNameInput.value.trim();
    if (languageSelect.value !== (initialUser?.language ?? "en")) profilePayload.language = languageSelect.value;

    const passwordFieldsFilled = Boolean(currentPasswordInput.value || newPasswordInput.value || confirmPasswordInput.value);
    if (passwordFieldsFilled) {
      if (!currentPasswordInput.value) throw new Error("Enter your current password to change it.");
      if (newPasswordInput.value.length < 8) throw new Error("New password must be at least 8 characters.");
      if (newPasswordInput.value !== confirmPasswordInput.value) throw new Error("New passwords do not match.");
      profilePayload.currentPassword = currentPasswordInput.value;
      profilePayload.newPassword = newPasswordInput.value;
    }

    const familyName = familyNameInput.value.trim();
    const logoUrl = logoUrlInput.value.trim();
    const accentColor = accentColorInput.value;

    if (familyName !== (initialUser?.family?.name ?? "")) brandingPayload.familyName = familyName;
    if (logoUrl !== (initialUser?.family?.logoUrl ?? "")) brandingPayload.logoUrl = logoUrl || null;
    if (accentColor !== (initialUser?.family?.accentColor ?? "")) brandingPayload.accentColor = accentColor;

    if (Object.keys(profilePayload).length > 0) {
      const response = await api.patch<{ user: CurrentUser }>("/api/auth/profile", profilePayload);
      initialUser = { ...(initialUser ?? response.user), ...response.user };
      if (response.user.language) {
        saveLanguage(response.user.language);
      } else if (profilePayload.language) {
        saveLanguage(profilePayload.language);
      }
      if (response.user.language || profilePayload.language) {
        await loadLanguage();
        applyTranslations();
      }
    }

    if (Object.keys(brandingPayload).length > 0) {
      await api.patch("/api/auth/branding", brandingPayload);
      initialUser = {
        ...(initialUser ?? ({} as CurrentUser)),
        family: {
          name: brandingPayload.familyName ?? initialUser?.family?.name ?? null,
          logoUrl: brandingPayload.logoUrl ?? initialUser?.family?.logoUrl ?? null,
          accentColor: brandingPayload.accentColor ?? initialUser?.family?.accentColor ?? null,
        },
      };
      saveBranding({
        name: brandingPayload.familyName ?? initialUser?.family?.name ?? null,
        logoUrl: brandingPayload.logoUrl ?? initialUser?.family?.logoUrl ?? null,
        accentColor: brandingPayload.accentColor ?? initialUser?.family?.accentColor ?? null,
      });
    }

    currentPasswordInput.value = "";
    newPasswordInput.value = "";
    confirmPasswordInput.value = "";
    showSuccess("Profile saved successfully.");
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
loadProfile().catch((error) => showError(error instanceof Error ? error.message : "Failed to load profile."));
