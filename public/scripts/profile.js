// src/client/lib/api.ts
async function request(method, path, body) {
  const res = await fetch(path, {
    method,
    credentials: "include",
    headers: body ? { "Content-Type": "application/json" } : void 0,
    body: body ? JSON.stringify(body) : void 0
  });
  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.error ?? "An unexpected error occurred.");
  }
  return data;
}
var api = {
  get: (path) => request("GET", path),
  post: (path, body) => request("POST", path, body),
  patch: (path, body) => request("PATCH", path, body),
  delete: (path) => request("DELETE", path)
};

// src/client/components/Modal.ts
function Modal({ title, content, onConfirm, confirmLabel = "Confirm", cancelLabel = "Cancel", confirmPhrase }) {
  const overlay = document.createElement("div");
  overlay.className = "fixed inset-0 bg-black/50 flex items-center justify-center z-50 hidden";
  const dialog = document.createElement("div");
  dialog.className = "bg-white rounded-xl shadow-xl p-6 w-full max-w-sm";
  const heading = document.createElement("h2");
  heading.textContent = title;
  heading.className = "text-lg font-semibold text-gray-900 mb-2";
  const body = document.createElement("p");
  body.textContent = content;
  body.className = "text-gray-600 mb-6";
  const confirmInput = document.createElement("input");
  if (confirmPhrase) {
    confirmInput.type = "text";
    confirmInput.placeholder = `Type ${confirmPhrase} to confirm`;
    confirmInput.className = "w-full border border-gray-300 rounded-lg px-3 py-2 mb-4 outline-none focus:border-red-500";
  }
  const actions = document.createElement("div");
  actions.className = "flex justify-end gap-3";
  const cancelBtn = document.createElement("button");
  cancelBtn.textContent = cancelLabel;
  cancelBtn.className = "px-4 py-2 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50 transition-colors";
  cancelBtn.addEventListener("click", close);
  const confirmBtn = document.createElement("button");
  confirmBtn.textContent = confirmLabel;
  confirmBtn.className = "px-4 py-2 rounded-lg bg-red-600 text-white hover:bg-red-700 transition-colors";
  confirmBtn.addEventListener("click", () => {
    if (confirmPhrase && confirmInput.value.trim() !== confirmPhrase) {
      confirmInput.focus();
      return;
    }
    onConfirm();
    close();
  });
  actions.append(cancelBtn, confirmBtn);
  dialog.append(heading, body);
  if (confirmPhrase) dialog.append(confirmInput);
  dialog.append(actions);
  overlay.appendChild(dialog);
  overlay.addEventListener("click", (e) => {
    if (e.target === overlay) close();
  });
  function open() {
    overlay.classList.remove("hidden");
  }
  function close() {
    overlay.classList.add("hidden");
  }
  return { modal: overlay, open, close };
}

// src/client/lib/i18n.ts
var translations = {};
async function loadLanguage() {
  const lang = localStorage.getItem("lang") ?? localStorage.getItem("language") ?? "en";
  const res = await fetch(`/locales/${lang}.json`);
  translations = await res.json();
  document.documentElement.lang = lang;
}
function resolveTemplate(text, vars) {
  let result = text;
  if (vars) {
    for (const [k, v] of Object.entries(vars)) {
      result = result.replaceAll(`{{${k}}}`, v);
    }
  }
  return result;
}
function applyTranslations(root = document) {
  root.querySelectorAll("[data-i18n]").forEach((node) => {
    const key = node.getAttribute("data-i18n");
    if (!key) return;
    const value = translations[key];
    if (value) node.textContent = resolveTemplate(value, node.dataset);
  });
  root.querySelectorAll("[data-i18n-placeholder]").forEach((node) => {
    const key = node.getAttribute("data-i18n-placeholder");
    if (!key) return;
    const value = translations[key];
    if (value) node.placeholder = resolveTemplate(value, node.dataset);
  });
  root.querySelectorAll("[data-i18n-title]").forEach((node) => {
    const key = node.getAttribute("data-i18n-title");
    if (!key) return;
    const value = translations[key];
    if (value) node.setAttribute("title", resolveTemplate(value, node.dataset));
  });
}

// src/client/lib/settings.ts
function readJson(value) {
  if (!value) return null;
  try {
    return JSON.parse(value);
  } catch {
    return null;
  }
}
function getStoredLanguage() {
  return localStorage.getItem("lang") ?? localStorage.getItem("language") ?? "en";
}
function setRootTheme(mode) {
  document.documentElement.dataset["theme"] = mode;
  document.body?.classList.toggle("dark-mode", mode === "dark");
  localStorage.setItem("display_mode", mode);
}
function applyBranding(branding) {
  if (!branding) return;
  if (branding.name) {
    document.querySelectorAll("[data-family-name]").forEach((node) => {
      node.textContent = branding.name ?? node.textContent ?? "";
    });
  }
  if (branding.accentColor) {
    document.documentElement.style.setProperty("--theme-color", branding.accentColor);
    localStorage.setItem("workspace_theme_color", branding.accentColor);
  }
  localStorage.setItem("familyBranding", JSON.stringify(branding));
}
function refreshTitle(brandName) {
  if (!brandName) return;
  document.title = document.title.replace(/Family Tracker|Super Admin|Members|Tasks|Schedules|Profile/gi, brandName);
}
async function loadGlobalSettings() {
  const storedBranding = readJson(localStorage.getItem("familyBranding"));
  const storedMode = localStorage.getItem("display_mode") ?? "light";
  setRootTheme(storedMode);
  applyBranding(storedBranding);
  refreshTitle(storedBranding?.name);
  const lang = getStoredLanguage();
  document.documentElement.lang = lang;
  if (storedBranding && storedBranding.name) {
    document.title = document.title.replace(/Family Tracker|Super Admin|Members|Tasks|Schedules|Profile/gi, storedBranding.name);
  }
  try {
    const res = await fetch("/api/auth/me", { credentials: "include" });
    if (!res.ok) return;
    const data = await res.json();
    if (data.user?.language) {
      localStorage.setItem("lang", data.user.language);
      localStorage.setItem("language", data.user.language);
      document.documentElement.lang = data.user.language;
    }
    if (data.user?.family) {
      applyBranding(data.user.family);
      refreshTitle(data.user.family.name);
    }
  } catch {
    return;
  }
}
function saveTheme(mode) {
  setRootTheme(mode);
}
function saveLanguage(lang) {
  localStorage.setItem("lang", lang);
  localStorage.setItem("language", lang);
  document.documentElement.lang = lang;
}
function saveBranding(branding) {
  applyBranding(branding);
}

// src/client/scripts/profile.ts
await loadGlobalSettings().catch(() => void 0);
await loadLanguage();
applyTranslations();
var usernameInput = document.getElementById("username");
var fullNameInput = document.getElementById("fullName");
var emailInput = document.getElementById("email");
var languageSelect = document.getElementById("language");
var currentPasswordInput = document.getElementById("currentPassword");
var newPasswordInput = document.getElementById("newPassword");
var confirmPasswordInput = document.getElementById("confirmPassword");
var familyNameInput = document.getElementById("familyName");
var logoUrlInput = document.getElementById("logoUrl");
var accentColorInput = document.getElementById("accentColor");
var colorCode = document.getElementById("colorCode");
var logoImage = document.getElementById("logoImage");
var logoPlaceholder = document.getElementById("logoPlaceholder");
var successMsg = document.getElementById("successMsg");
var errorMsg = document.getElementById("errorMsg");
var saveBtn = document.getElementById("saveBtn");
var deleteBtn = document.getElementById("deleteAccountBtn");
var logoutBtn = document.getElementById("logoutBtn");
var themeToggle = document.getElementById("themeToggle");
var backBtn = document.getElementById("backBtn");
var initialTheme = localStorage.getItem("display_mode") ?? "light";
var initialUser = null;
function showStatus(target, message) {
  target.textContent = message;
  target.hidden = false;
}
function clearStatus(target) {
  target.hidden = true;
  target.textContent = "";
}
function showSuccess(message) {
  clearStatus(errorMsg);
  showStatus(successMsg, message);
}
function showError(message) {
  clearStatus(successMsg);
  showStatus(errorMsg, message);
}
function setThemeMode(mode) {
  saveTheme(mode);
  themeToggle.innerHTML = mode === "dark" ? '<i class="fas fa-sun"></i>' : '<i class="fas fa-moon"></i>';
}
function updateLogoPreview(url) {
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
  const { user } = await api.get("/api/auth/me");
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
    const profilePayload = {};
    const brandingPayload = {};
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
      const response = await api.patch("/api/auth/profile", profilePayload);
      initialUser = { ...initialUser ?? response.user, ...response.user };
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
        ...initialUser ?? {},
        family: {
          name: brandingPayload.familyName ?? initialUser?.family?.name ?? null,
          logoUrl: brandingPayload.logoUrl ?? initialUser?.family?.logoUrl ?? null,
          accentColor: brandingPayload.accentColor ?? initialUser?.family?.accentColor ?? null
        }
      };
      saveBranding({
        name: brandingPayload.familyName ?? initialUser?.family?.name ?? null,
        logoUrl: brandingPayload.logoUrl ?? initialUser?.family?.logoUrl ?? null,
        accentColor: brandingPayload.accentColor ?? initialUser?.family?.accentColor ?? null
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
var deleteModal = Modal({
  title: "Delete Account",
  content: "This will suspend your account now and permanently remove it after 7 days.",
  confirmLabel: "DELETE",
  confirmPhrase: "DELETE",
  onConfirm: async () => {
    await api.delete("/api/auth/me");
    location.replace("/pages/login.html");
  }
});
document.body.appendChild(deleteModal.modal);
deleteBtn.addEventListener("click", () => deleteModal.open());
logoutBtn.addEventListener("click", async () => {
  await api.post("/api/auth/logout", {});
  location.replace("/pages/login.html");
});
loadLocalPreferences();
loadProfile().catch((error) => showError(error instanceof Error ? error.message : "Failed to load profile."));
