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

// src/client/scripts/super-admin.ts
await loadGlobalSettings().catch(() => void 0);
await loadLanguage();
applyTranslations();
var API = "/api";
var tenantsBody = document.getElementById("tenantsBody");
var totalFamilies = document.getElementById("totalFamilies");
var totalMembers = document.getElementById("totalMembers");
var activeFamilies = document.getElementById("activeFamilies");
var messageBox = document.getElementById("messageBox");
function showMessage(msg, kind = "error") {
  messageBox.textContent = msg;
  messageBox.className = `rounded-lg border px-4 py-3 text-sm ${kind === "success" ? "bg-[#e7efe2] text-[#3c5a3c] border-[#b9cdb0]" : "bg-[#fceeee] text-[#a13d3d] border-[#e3b5b5]"}`;
  messageBox.classList.remove("hidden");
}
async function loadTenants() {
  try {
    const res = await fetch(`${API}/family/tenants`, { credentials: "include" });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error);
    const tenants = data.tenants || [];
    totalFamilies.textContent = String(tenants.length);
    totalMembers.textContent = String(tenants.reduce((sum, t) => sum + (t.memberCount || 0), 0));
    activeFamilies.textContent = String(tenants.filter((t) => !t.deletedAt).length);
    if (tenants.length === 0) {
      tenantsBody.innerHTML = '<tr><td colspan="6" class="py-8 text-center text-[#9b8a7a]">No families registered yet.</td></tr>';
      return;
    }
    tenantsBody.innerHTML = tenants.map((t) => {
      const created = t.createdAt ? new Date(t.createdAt).toLocaleDateString() : "\u2014";
      const status = t.deletedAt ? '<span class="bg-[#fceeee] text-[#a13d3d] text-xs px-2 py-0.5 rounded">Deleted</span>' : '<span class="bg-[#e7efe2] text-[#3c5a3c] text-xs px-2 py-0.5 rounded">Active</span>';
      return `<tr class="border-b border-[#e0d6ce]">
        <td class="py-3 font-medium text-[#2c2420]">${t.name}</td>
        <td class="py-3 text-[#5a4e46]">${t.adminUsername}</td>
        <td class="py-3 text-[#5a4e46]">${t.adminEmail}</td>
        <td class="py-3">${t.memberCount}</td>
        <td class="py-3 text-[#7a6e66]">${created}</td>
        <td class="py-3">${status}</td>
      </tr>`;
    }).join("");
  } catch (err) {
    showMessage(err instanceof Error ? err.message : "Failed to load tenants.");
    tenantsBody.innerHTML = '<tr><td colspan="6" class="py-8 text-center text-[#a13d3d]">Access denied. Super admin only.</td></tr>';
  }
}
loadTenants();
