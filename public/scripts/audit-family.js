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

// src/client/scripts/audit-family.ts
await loadGlobalSettings().catch(() => void 0);
await loadLanguage();
applyTranslations();
var auditTableBody = document.getElementById("auditTableBody");
var noAudit = document.getElementById("noAudit");
var filterSearch = document.getElementById("filterSearch");
var clearFilterBtn = document.getElementById("clearFilterBtn");
var logs = [];
function render() {
  const term = filterSearch.value.trim().toLowerCase();
  const filtered = term ? logs.filter((log) => log.action.toLowerCase().includes(term) || (log.actorUserId ?? "").toLowerCase().includes(term)) : logs;
  if (!filtered.length) {
    auditTableBody.innerHTML = "";
    noAudit.classList.remove("hidden");
    return;
  }
  noAudit.classList.add("hidden");
  auditTableBody.innerHTML = filtered.map((log) => {
    const date = new Date(log.createdAt);
    return `<tr class="hover:bg-[#f0ebe3] transition-colors">
      <td class="px-3 py-[10px] border-b border-[#ddd4c8]">${log.actorUserId ?? "\u2014"}</td>
      <td class="px-3 py-[10px] border-b border-[#ddd4c8]">Family</td>
      <td class="px-3 py-[10px] border-b border-[#ddd4c8]">${log.action}</td>
      <td class="px-3 py-[10px] border-b border-[#ddd4c8] whitespace-nowrap">${date.toLocaleDateString()}</td>
      <td class="px-3 py-[10px] border-b border-[#ddd4c8] whitespace-nowrap">${date.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" })}</td>
      <td class="px-3 py-[10px] border-b border-[#ddd4c8]"><span class="inline-block px-[9px] py-[2px] rounded-full text-[0.75rem] font-semibold bg-[#dff0d8] text-[#3c5a3c]">Success</span></td>
    </tr>`;
  }).join("");
}
async function load() {
  const res = await fetch("/api/audit", { credentials: "include" });
  const data = await res.json();
  logs = data.logs || [];
  render();
}
filterSearch.addEventListener("input", render);
clearFilterBtn.addEventListener("click", () => {
  filterSearch.value = "";
  render();
});
load().catch(() => {
  auditTableBody.innerHTML = `<tr><td colspan="6" class="text-center text-[#7a6e66] py-4">Failed to load audit logs.</td></tr>`;
});
