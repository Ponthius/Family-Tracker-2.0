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

// src/client/lib/session.ts
function getCachedUser() {
  const stored = localStorage.getItem("user");
  if (!stored) return null;
  try {
    return JSON.parse(stored);
  } catch {
    return null;
  }
}
function redirectIfLoggedIn() {
  if (navigator.onLine) {
    fetch("/api/auth/me", { credentials: "include" }).then((res) => {
      if (res.ok) location.replace("/pages/dashboard.html");
    }).catch(() => {
      if (getCachedUser()) location.replace("/pages/dashboard.html");
    });
    return;
  }
  if (getCachedUser()) {
    location.replace("/pages/dashboard.html");
  }
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

// src/client/scripts/login.ts
redirectIfLoggedIn();
await loadGlobalSettings().catch(() => void 0);
await loadLanguage();
applyTranslations();
var form = document.getElementById("loginForm");
var usernameInput = document.getElementById("username");
var passwordInput = document.getElementById("password");
var errorMsg = document.getElementById("errorMsg");
function showError(message) {
  errorMsg.textContent = message;
  errorMsg.classList.remove("hidden");
}
function clearError() {
  errorMsg.textContent = "";
  errorMsg.classList.add("hidden");
}
form.addEventListener("submit", async (e) => {
  e.preventDefault();
  clearError();
  const username = usernameInput.value.trim();
  const password = passwordInput.value.trim();
  if (!username || !password) {
    showError("Please enter both username and password.");
    return;
  }
  try {
    const data = await api.post("/api/auth/login", { username, password });
    localStorage.setItem("user", JSON.stringify(data.user));
    const me = await api.get("/api/auth/me");
    localStorage.setItem("familyBranding", JSON.stringify(me.user.family ?? {}));
    localStorage.setItem("language", me.user.language || "en");
    window.location.href = data.user.role === "SuperAdmin" ? "/pages/super-admin.html" : "/pages/dashboard.html";
  } catch (err) {
    showError(err instanceof Error ? err.message : "Unable to reach the server. Please try again.");
  }
});
