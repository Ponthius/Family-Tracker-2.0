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

// src/client/scripts/dashboard.ts
await loadGlobalSettings().catch(() => void 0);
await loadLanguage();
applyTranslations();
var API = "/api";
var isOnline = navigator.onLine;
window.addEventListener("offline", () => {
  isOnline = false;
});
window.addEventListener("online", () => {
  isOnline = true;
});
function getStoredUser() {
  try {
    return JSON.parse(localStorage.getItem("user") || "{}");
  } catch (e) {
    return {};
  }
}
function getTimeGreeting() {
  const hour = (/* @__PURE__ */ new Date()).getHours();
  if (hour < 12) return "Good Morning";
  if (hour < 17) return "Good Afternoon";
  return "Good Evening";
}
function updateUserGreeting() {
  const user = getStoredUser();
  const username = user.name || user.username || "Family";
  const gt = document.getElementById("greetingText");
  const ud = document.getElementById("usernameDisplay");
  if (gt) gt.textContent = getTimeGreeting();
  if (ud) ud.textContent = username;
}
function setActiveNavItem(page) {
  document.querySelectorAll("[data-page]").forEach((el) => {
    el.classList.toggle("active", el.getAttribute("data-page") === page);
  });
}
var path = window.location.pathname;
var currentPage = path.split("/").pop()?.replace(".html", "") || "dashboard";
setActiveNavItem(currentPage);
updateUserGreeting();
var hamburger = document.getElementById("hamburgerBtn");
var overlay = document.getElementById("mobileSidebarOverlay");
var mobileSidebar = document.getElementById("mobileSidebar");
var closeBtn = document.getElementById("closeSidebarBtn");
function openSidebar() {
  if (mobileSidebar) mobileSidebar.classList.add("open");
  if (overlay) overlay.classList.add("active");
  document.body.style.overflow = "hidden";
}
function closeSidebar() {
  if (mobileSidebar) mobileSidebar.classList.remove("open");
  if (overlay) overlay.classList.remove("active");
  document.body.style.overflow = "";
}
if (hamburger) hamburger.addEventListener("click", openSidebar);
if (closeBtn) closeBtn.addEventListener("click", closeSidebar);
if (overlay) overlay.addEventListener("click", closeSidebar);
document.querySelectorAll(".mobile-nav-item").forEach((l) => l.addEventListener("click", closeSidebar));
var backBtn = document.getElementById("myBackButton");
if (backBtn) {
  backBtn.addEventListener("click", () => {
    window.history.back();
  });
}
async function loadKPIs() {
  try {
    const res = await fetch(API + "/dashboard/stats");
    const data = await res.json();
    if (!res.ok || !data.success) throw new Error(data.error);
    const kpiTasks = document.getElementById("kpiTasks");
    const kpiMembers = document.getElementById("kpiMembers");
    const kpiSchedules = document.getElementById("kpiSchedules");
    const kpiUpcoming = document.getElementById("kpiUpcoming");
    const activityScore = document.getElementById("activityScore");
    if (kpiTasks) kpiTasks.textContent = String(data.stats.tasks).padStart(2, "0");
    if (kpiMembers) kpiMembers.textContent = String(data.stats.members).padStart(2, "0");
    if (kpiSchedules) kpiSchedules.textContent = String(data.stats.schedules).padStart(2, "0");
    if (kpiUpcoming) kpiUpcoming.textContent = String(data.stats.upcoming).padStart(2, "0");
    if (activityScore) activityScore.textContent = data.stats.tasks + " pending \xB7 " + data.stats.members + " members";
  } catch (err) {
    console.error("KPI load error:", err);
  }
}
async function loadRecentTasks() {
  try {
    const res = await fetch(API + "/dashboard/recent-tasks");
    const data = await res.json();
    if (!res.ok || !data.success) throw new Error(data.error);
    const tbody = document.getElementById("recentEventsBody");
    if (!tbody) return;
    if (!data.tasks || data.tasks.length === 0) {
      tbody.innerHTML = '<tr class="data-placeholder"><td colspan="3">No completed tasks yet</td></tr>';
      return;
    }
    tbody.innerHTML = data.tasks.map((t) => {
      const d = new Date(t.EventDate);
      const dateStr = d.toLocaleDateString(void 0, { month: "short", day: "numeric", year: "numeric" });
      return `<tr><td>${t.EventName}</td><td>${dateStr}</td><td><span class="badge">Done</span></td></tr>`;
    }).join("");
  } catch (err) {
    console.error("Recent tasks error:", err);
  }
}
async function loadUpcomingTasks() {
  try {
    const res = await fetch(API + "/dashboard/upcoming-tasks");
    const data = await res.json();
    if (!res.ok || !data.success) throw new Error(data.error);
    const tbody = document.getElementById("upcomingEventsBody");
    if (!tbody) return;
    if (!data.tasks || data.tasks.length === 0) {
      tbody.innerHTML = '<tr class="data-placeholder"><td colspan="3">No upcoming tasks</td></tr>';
      return;
    }
    tbody.innerHTML = data.tasks.map((t) => {
      const d = new Date((t.TaskDate || "").includes("T") ? t.TaskDate : t.TaskDate + "T" + (t.TaskTime || "00:00"));
      const dtStr = d.toLocaleString(void 0, { month: "short", day: "numeric", year: "numeric", hour: "numeric", minute: "2-digit" });
      return `<tr><td>${t.EventName}</td><td>${dtStr}</td><td><span class="badge">${t.Username || "\u2014"}</span></td></tr>`;
    }).join("");
  } catch (err) {
    console.error("Upcoming tasks error:", err);
  }
}
loadKPIs();
loadRecentTasks();
loadUpcomingTasks();
