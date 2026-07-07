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

// src/client/scripts/schedules.ts
await loadGlobalSettings().catch(() => void 0);
await loadLanguage();
applyTranslations();
var API = "/api";
var schedulesBody = document.getElementById("schedulesBody");
var createScheduleBtn = document.getElementById("createScheduleBtn");
var scheduleModal = document.getElementById("scheduleModal");
var cancelScheduleBtn = document.getElementById("cancelScheduleBtn");
var saveScheduleBtn = document.getElementById("saveScheduleBtn");
var scheduleTitle = document.getElementById("scheduleTitle");
var scheduleDate = document.getElementById("scheduleDate");
var scheduleTime = document.getElementById("scheduleTime");
var scheduleStatus = document.getElementById("scheduleStatus");
var allSchedules = [];
var currentRange = "all";
function openModal() {
  scheduleModal.classList.remove("hidden");
}
function closeModal() {
  scheduleModal.classList.add("hidden");
}
function getDateRange(range) {
  const now = /* @__PURE__ */ new Date();
  const start = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  if (range === "all") return null;
  if (range === "today") return { start, end: new Date(start.getTime() + 864e5) };
  if (range === "tomorrow") return { start: new Date(start.getTime() + 864e5), end: new Date(start.getTime() + 2 * 864e5) };
  if (range === "week") return { start, end: new Date(start.getTime() + 7 * 864e5) };
  if (range === "month") return { start, end: new Date(now.getFullYear(), now.getMonth() + 1, 1) };
  return null;
}
function renderSchedules() {
  const range = getDateRange(currentRange);
  const filtered = range ? allSchedules.filter((s) => s.dueDate && new Date(s.dueDate) >= range.start && new Date(s.dueDate) < range.end) : allSchedules;
  if (!filtered.length) {
    schedulesBody.innerHTML = `<tr><td colspan="6" class="py-8 text-center text-[#9b8a7a]">No schedules for this period.</td></tr>`;
    return;
  }
  schedulesBody.innerHTML = filtered.map((s) => {
    const due = s.dueDate ? new Date(s.dueDate) : null;
    return `<tr class="border-b border-[#e0d6ce]">
      <td class="py-3 text-[#2c2420]">${s.title}</td>
      <td class="py-3 text-[#5a4e46]">${s.assignedToUser?.role ?? "\u2014"}</td>
      <td class="py-3 text-[#5a4e46]">${s.assignedToUser?.username ?? "\u2014"}</td>
      <td class="py-3 text-[#5a4e46]">${due ? due.toLocaleDateString() : "\u2014"}</td>
      <td class="py-3 text-[#5a4e46]">${due ? due.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" }) : "\u2014"}</td>
      <td class="py-3">${s.status === "occupied" ? '<span class="bg-[#fceeee] text-[#a13d3d] text-xs px-2 py-0.5 rounded">Occupied</span>' : '<span class="bg-[#e7efe2] text-[#3c5a3c] text-xs px-2 py-0.5 rounded">Unoccupied</span>'}</td>
    </tr>`;
  }).join("");
}
async function loadSchedules() {
  const res = await fetch(`${API}/family/schedules`, { credentials: "include" });
  const data = await res.json();
  allSchedules = (data.schedules || []).filter((schedule) => schedule.status === "occupied" || schedule.status === "unoccupied");
  renderSchedules();
}
createScheduleBtn.addEventListener("click", openModal);
cancelScheduleBtn.addEventListener("click", closeModal);
scheduleModal.addEventListener("click", (e) => {
  if (e.target === scheduleModal) closeModal();
});
saveScheduleBtn.addEventListener("click", async () => {
  const dueDate = `${scheduleDate.value}T${scheduleTime.value}`;
  await fetch(`${API}/todos`, {
    method: "POST",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      title: scheduleTitle.value.trim(),
      dueDate,
      status: scheduleStatus.value,
      assignedToUserId: null
    })
  });
  closeModal();
  await loadSchedules();
});
document.querySelectorAll(".schedule-filter").forEach((btn) => {
  btn.addEventListener("click", () => {
    currentRange = btn.getAttribute("data-range") || "all";
    document.querySelectorAll(".schedule-filter").forEach((item) => {
      item.className = "schedule-filter px-4 py-2 rounded-md text-sm bg-[#f5f1ec] text-[#5a4e46] hover:bg-[#e8e0d8] transition-colors";
    });
    btn.className = "schedule-filter px-4 py-2 rounded-md text-sm bg-[#3d3530] text-[#f5f1ec] transition-colors";
    renderSchedules();
  });
});
loadSchedules();
