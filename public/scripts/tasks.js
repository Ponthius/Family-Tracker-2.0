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

// src/client/lib/i18n.ts
var translations = {};
async function loadLanguage() {
  const lang = localStorage.getItem("lang") ?? localStorage.getItem("language") ?? "en";
  const res = await fetch(`/locales/${lang}.json`);
  translations = await res.json();
  document.documentElement.lang = lang;
}
function t(key, vars) {
  let text = translations[key] ?? key;
  if (vars) {
    for (const [k, v] of Object.entries(vars)) {
      text = text.replaceAll(`{{${k}}}`, v);
    }
  }
  return text;
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
function redirectIfGuest() {
  if (navigator.onLine) {
    fetch("/api/auth/me", { credentials: "include" }).then((res) => {
      if (!res.ok) location.replace("/pages/login.html");
    }).catch(() => {
      if (!getCachedUser()) location.replace("/pages/login.html");
    });
    return;
  }
  if (!getCachedUser()) {
    location.replace("/pages/login.html");
  }
}

// src/client/scripts/tasks.ts
redirectIfGuest();
await loadGlobalSettings().catch(() => void 0);
await loadLanguage();
applyTranslations();
var tableBody = document.getElementById("taskTableBody");
var noResults = document.getElementById("noResults");
var searchInput = document.getElementById("searchInput");
var confirmation = document.getElementById("confirmation");
var modalOverlay = document.getElementById("modalOverlay");
var createTaskBtn = document.getElementById("createTaskBtn");
var cancelBtn = document.getElementById("cancelBtn");
var saveTaskBtn = document.getElementById("saveTaskBtn");
var assignRole = document.getElementById("assignRole");
var taskName = document.getElementById("taskName");
var taskDesc = document.getElementById("taskDesc");
var taskDate = document.getElementById("taskDate");
var taskTime = document.getElementById("taskTime");
var errAssign = document.getElementById("errAssign");
var errName = document.getElementById("errName");
var errDate = document.getElementById("errDate");
var errTime = document.getElementById("errTime");
var tasks = [];
var members = [];
var schedules = [];
var selectedDueDate = null;
function show(el) {
  el.classList.remove("hidden");
}
function hide(el) {
  el.classList.add("hidden");
}
function formatDateTime(dateStr) {
  if (!dateStr) return "\u2014";
  const d = new Date(dateStr);
  return d.toLocaleString(void 0, {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit"
  });
}
function showNotification(message, kind = "success") {
  confirmation.textContent = message;
  confirmation.className = kind === "success" ? "mb-4 px-4 py-[10px] bg-[#e7efe2] border border-[#b9cdb0] text-[#3c5a3c] text-[0.85rem] rounded-md" : "mb-4 px-4 py-[10px] bg-[#fceeee] border border-[#e3b5b5] text-[#a13d3d] text-[0.85rem] rounded-md";
  show(confirmation);
  setTimeout(() => hide(confirmation), 3e3);
}
function openModal() {
  modalOverlay.classList.remove("hidden");
}
function closeModal() {
  modalOverlay.classList.add("hidden");
  assignRole.value = "";
  taskName.value = "";
  taskDesc.value = "";
  taskDate.value = "";
  taskTime.value = "";
  [errAssign, errName, errDate, errTime].forEach(hide);
}
function renderMembers(currentUserId) {
  const filtered = currentUserId ? members.filter((m) => m.id !== currentUserId) : members;
  assignRole.innerHTML = `<option value="">Select user</option>` + filtered.map((member) => {
    const schedule = selectedDueDate ? schedules.find((item) => item.assignedToUser?.id === member.id && item.dueDate?.startsWith(selectedDueDate ?? "")) : void 0;
    const suffix = schedule ? ` - ${schedule.title} (${schedule.status})` : "";
    return `<option value="${member.id}">${member.username} (${member.role})${suffix}</option>`;
  }).join("");
}
function renderTable(list) {
  tableBody.innerHTML = "";
  if (list.length === 0) {
    show(noResults);
    return;
  }
  hide(noResults);
  for (const task of list) {
    const tr = document.createElement("tr");
    tr.className = "hover:bg-[#f0ebe3] transition-colors";
    tr.innerHTML = `
      <td class="px-3 py-[10px] border-b border-[#ddd4c8] text-[#2c2420]">${task.user?.username ?? "\u2014"}</td>
      <td class="px-3 py-[10px] border-b border-[#ddd4c8] text-[#2c2420]">${task.assignedToUser?.username ?? "Unassigned"}</td>
      <td class="px-3 py-[10px] border-b border-[#ddd4c8] text-[#2c2420]">${task.title}</td>
      <td class="px-3 py-[10px] border-b border-[#ddd4c8] text-[#2c2420]">${task.description ?? "\u2014"}</td>
      <td class="px-3 py-[10px] border-b border-[#ddd4c8] text-[#2c2420] whitespace-nowrap">${formatDateTime(task.dueDate ?? task.createdAt)}</td>
    `;
    tableBody.appendChild(tr);
  }
}
function applySearch() {
  const term = searchInput.value.trim().toLowerCase();
  if (!term) {
    renderTable(tasks);
    return;
  }
  renderTable(
    tasks.filter(
      (task) => task.title.toLowerCase().includes(term) || (task.description ?? "").toLowerCase().includes(term) || (task.user?.username ?? "").toLowerCase().includes(term) || (task.assignedToUser?.username ?? "").toLowerCase().includes(term)
    )
  );
}
async function loadData() {
  const [tasksRes, membersRes, meRes, schedulesRes] = await Promise.all([
    api.get("/api/todos"),
    api.get("/api/todos/members"),
    api.get("/api/auth/me"),
    api.get("/api/family/schedules")
  ]);
  tasks = tasksRes.todos;
  members = membersRes.members;
  schedules = schedulesRes.schedules ?? [];
  renderMembers(meRes.user.id);
  renderTable(tasks);
}
createTaskBtn.addEventListener("click", openModal);
cancelBtn.addEventListener("click", closeModal);
modalOverlay.addEventListener("click", (e) => {
  if (e.target === modalOverlay) closeModal();
});
searchInput.addEventListener("input", applySearch);
saveTaskBtn.addEventListener("click", async () => {
  [errAssign, errName, errDate, errTime].forEach(hide);
  let valid = true;
  if (!assignRole.value) {
    show(errAssign);
    valid = false;
  }
  if (!taskName.value.trim()) {
    show(errName);
    valid = false;
  }
  if (!taskDate.value) {
    show(errDate);
    valid = false;
  }
  if (!taskTime.value) {
    show(errTime);
    valid = false;
  }
  if (!valid) return;
  const dueDate = `${taskDate.value}T${taskTime.value}`;
  selectedDueDate = taskDate.value;
  try {
    const created = await api.post("/api/todos", {
      title: taskName.value.trim(),
      description: taskDesc.value.trim(),
      dueDate,
      status: "task",
      assignedToUserId: assignRole.value
    });
    tasks = [created.todo, ...tasks];
    closeModal();
    renderTable(tasks);
    showNotification(t("task_created"));
  } catch (err) {
    showNotification(err instanceof Error ? err.message : "Unable to create task.", "error");
  }
});
await loadData();
