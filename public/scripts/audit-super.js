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

// src/client/scripts/audit-super.ts
await loadGlobalSettings().catch(() => void 0);
await loadLanguage();
applyTranslations();
var tenantsBody = document.getElementById("tenantsBody");
var auditBody = document.getElementById("auditTableBody");
var messageBox = document.getElementById("messageBox");
var totalFamilies = document.getElementById("totalFamilies");
var totalMembers = document.getElementById("totalMembers");
var activeFamilies = document.getElementById("activeFamilies");
function showMessage(message) {
  messageBox.textContent = message;
  messageBox.classList.remove("hidden");
}
async function loadTenants() {
  const res = await fetch("/api/family/tenants", { credentials: "include" });
  if (!res.ok) throw new Error("Failed to load tenants.");
  const data = await res.json();
  const tenants = data.tenants || [];
  totalFamilies.textContent = String(tenants.length);
  totalMembers.textContent = String(tenants.reduce((sum, tenant) => sum + (tenant.memberCount || 0), 0));
  activeFamilies.textContent = String(tenants.filter((tenant) => !tenant.deletedAt).length);
  tenantsBody.innerHTML = tenants.map((tenant) => {
    const created = new Date(tenant.createdAt).toLocaleDateString();
    const status = tenant.deletedAt ? '<span class="bg-[#fceeee] text-[#a13d3d] text-xs px-2 py-0.5 rounded">Deleted</span>' : '<span class="bg-[#e7efe2] text-[#3c5a3c] text-xs px-2 py-0.5 rounded">Active</span>';
    return `<tr class="border-b border-[#e0d6ce]">
      <td class="py-3 font-medium text-[#2c2420]">${tenant.name}</td>
      <td class="py-3 text-[#5a4e46]">${tenant.adminUsername}</td>
      <td class="py-3 text-[#5a4e46]">${tenant.adminEmail ?? "\u2014"}</td>
      <td class="py-3">${tenant.memberCount}</td>
      <td class="py-3 text-[#7a6e66]">${created}</td>
      <td class="py-3">${status}</td>
    </tr>`;
  }).join("");
}
async function loadAuditLogs() {
  const res = await fetch("/api/audit", { credentials: "include" });
  if (!res.ok) throw new Error("Failed to load audit logs.");
  const data = await res.json();
  const logs = data.logs || [];
  auditBody.innerHTML = logs.map((log) => {
    const date = new Date(log.createdAt);
    return `<tr class="border-b border-[#e0d6ce]">
      <td class="py-3 text-[#2c2420]">${log.actorUserId ?? "\u2014"}</td>
      <td class="py-3 text-[#5a4e46]">Super Admin</td>
      <td class="py-3 text-[#5a4e46]">${log.familyId ?? "All Families"}</td>
      <td class="py-3 text-[#5a4e46]">${log.action}</td>
      <td class="py-3 text-[#5a4e46]">${date.toLocaleDateString()}</td>
      <td class="py-3 text-[#5a4e46]">${date.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" })}</td>
      <td class="py-3"><span class="bg-[#e7efe2] text-[#3c5a3c] text-xs px-2 py-0.5 rounded">Success</span></td>
    </tr>`;
  }).join("");
}
loadTenants().catch((error) => showMessage(error instanceof Error ? error.message : "Failed to load tenants."));
loadAuditLogs().catch((error) => showMessage(error instanceof Error ? error.message : "Failed to load audit logs."));
