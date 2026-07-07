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

// src/client/scripts/members.ts
await loadGlobalSettings().catch(() => void 0);
await loadLanguage();
applyTranslations();
var API = "/api";
var membersBody = document.getElementById("membersBody");
var messageBox = document.getElementById("messageBox");
var addMemberBtn = document.getElementById("addMemberBtn");
var addModal = document.getElementById("addModal");
var cancelAddBtn = document.getElementById("cancelAddBtn");
var addMemberForm = document.getElementById("addMemberForm");
function showMessage(msg, kind = "success") {
  messageBox.textContent = msg;
  messageBox.className = `rounded-lg border px-4 py-3 text-sm ${kind === "success" ? "bg-[#e7efe2] text-[#3c5a3c] border-[#b9cdb0]" : "bg-[#fceeee] text-[#a13d3d] border-[#e3b5b5]"}`;
  messageBox.classList.remove("hidden");
  setTimeout(() => messageBox.classList.add("hidden"), 5e3);
}
async function loadMembers() {
  try {
    const res = await fetch(`${API}/family/members`, { credentials: "include" });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error);
    const members = data.members || [];
    if (members.length === 0) {
      membersBody.innerHTML = '<tr><td colspan="4" class="py-8 text-center text-[#9b8a7a]">No family members yet.</td></tr>';
      return;
    }
    membersBody.innerHTML = members.map((m) => {
      const verified = m.emailVerified ? '<span class="text-[#3c5a3c] text-xs">Verified</span>' : '<span class="text-[#a13d3d] text-xs">Pending</span>';
      const roleBadge = m.role === "Admin" ? `<span class="bg-[#3d3530] text-[#f5f1ec] text-xs px-2 py-0.5 rounded">${m.role}</span>` : `<span class="bg-[#e8e0d8] text-[#5a4e46] text-xs px-2 py-0.5 rounded">${m.role}</span>`;
      return `<tr class="border-b border-[#e0d6ce]">
        <td class="py-3">${roleBadge}</td>
        <td class="py-3 text-[#2c2420]">${m.username || "\u2014"}</td>
        <td class="py-3 text-[#5a4e46]">${m.email || "\u2014"}</td>
        <td class="py-3">${verified}</td>
      </tr>`;
    }).join("");
  } catch (err) {
    showMessage(err instanceof Error ? err.message : "Failed to load members.", "error");
  }
}
addMemberBtn.addEventListener("click", () => addModal.classList.remove("hidden"));
cancelAddBtn.addEventListener("click", () => addModal.classList.add("hidden"));
addModal.addEventListener("click", (e) => {
  if (e.target === addModal) addModal.classList.add("hidden");
});
addMemberForm.addEventListener("submit", async (e) => {
  e.preventDefault();
  const username = document.getElementById("newUsername").value.trim();
  const email = document.getElementById("newEmail").value.trim();
  const password = document.getElementById("newPassword").value;
  const role = document.getElementById("newRole").value;
  try {
    const res = await fetch(`${API}/family/members`, {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, email, password, role })
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error);
    showMessage(`Added ${data.member.username} as ${data.member.role}.`);
    addModal.classList.add("hidden");
    addMemberForm.reset();
    await loadMembers();
  } catch (err) {
    showMessage(err instanceof Error ? err.message : "Failed to add member.", "error");
  }
});
loadMembers();
