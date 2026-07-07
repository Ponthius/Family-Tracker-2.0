import { applyTranslations, loadLanguage } from "../lib/i18n.js";
import { loadGlobalSettings } from "../lib/settings.js";

await loadGlobalSettings().catch(() => undefined);
await loadLanguage();
applyTranslations();

const API = "/api";
const schedulesBody = document.getElementById("schedulesBody") as HTMLTableSectionElement;
const createScheduleBtn = document.getElementById("createScheduleBtn") as HTMLButtonElement;
const scheduleModal = document.getElementById("scheduleModal") as HTMLDivElement;
const cancelScheduleBtn = document.getElementById("cancelScheduleBtn") as HTMLButtonElement;
const saveScheduleBtn = document.getElementById("saveScheduleBtn") as HTMLButtonElement;
const scheduleTitle = document.getElementById("scheduleTitle") as HTMLInputElement;
const scheduleDate = document.getElementById("scheduleDate") as HTMLInputElement;
const scheduleTime = document.getElementById("scheduleTime") as HTMLInputElement;
const scheduleStatus = document.getElementById("scheduleStatus") as HTMLSelectElement;

let allSchedules: any[] = [];
let currentRange = "all";

function openModal() { scheduleModal.classList.remove("hidden"); }
function closeModal() { scheduleModal.classList.add("hidden"); }

function getDateRange(range: string): { start: Date; end: Date } | null {
  const now = new Date();
  const start = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  if (range === "all") return null;
  if (range === "today") return { start, end: new Date(start.getTime() + 86400000) };
  if (range === "tomorrow") return { start: new Date(start.getTime() + 86400000), end: new Date(start.getTime() + 2 * 86400000) };
  if (range === "week") return { start, end: new Date(start.getTime() + 7 * 86400000) };
  if (range === "month") return { start, end: new Date(now.getFullYear(), now.getMonth() + 1, 1) };
  return null;
}

function renderSchedules() {
  const range = getDateRange(currentRange);
  const filtered = range
    ? allSchedules.filter((s) => s.dueDate && new Date(s.dueDate) >= range.start && new Date(s.dueDate) < range.end)
    : allSchedules;

  if (!filtered.length) {
    schedulesBody.innerHTML = `<tr><td colspan="6" class="py-8 text-center text-[#9b8a7a]">No schedules for this period.</td></tr>`;
    return;
  }

  schedulesBody.innerHTML = filtered.map((s) => {
    const due = s.dueDate ? new Date(s.dueDate) : null;
    return `<tr class="border-b border-[#e0d6ce]">
      <td class="py-3 text-[#2c2420]">${s.title}</td>
      <td class="py-3 text-[#5a4e46]">${s.assignedToUser?.role ?? "—"}</td>
      <td class="py-3 text-[#5a4e46]">${s.assignedToUser?.username ?? "—"}</td>
      <td class="py-3 text-[#5a4e46]">${due ? due.toLocaleDateString() : "—"}</td>
      <td class="py-3 text-[#5a4e46]">${due ? due.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" }) : "—"}</td>
      <td class="py-3">${s.status === "occupied" ? '<span class="bg-[#fceeee] text-[#a13d3d] text-xs px-2 py-0.5 rounded">Occupied</span>' : '<span class="bg-[#e7efe2] text-[#3c5a3c] text-xs px-2 py-0.5 rounded">Unoccupied</span>'}</td>
    </tr>`;
  }).join("");
}

async function loadSchedules() {
  const res = await fetch(`${API}/family/schedules`, { credentials: "include" });
  const data = await res.json();
  allSchedules = (data.schedules || []).filter((schedule: any) => schedule.status === "occupied" || schedule.status === "unoccupied");
  renderSchedules();
}

createScheduleBtn.addEventListener("click", openModal);
cancelScheduleBtn.addEventListener("click", closeModal);
scheduleModal.addEventListener("click", (e) => { if (e.target === scheduleModal) closeModal(); });

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
      assignedToUserId: null,
    }),
  });
  closeModal();
  await loadSchedules();
});

document.querySelectorAll(".schedule-filter").forEach((btn) => {
  btn.addEventListener("click", () => {
    currentRange = (btn as HTMLElement).getAttribute("data-range") || "all";
    document.querySelectorAll(".schedule-filter").forEach((item) => {
      item.className = "schedule-filter px-4 py-2 rounded-md text-sm bg-[#f5f1ec] text-[#5a4e46] hover:bg-[#e8e0d8] transition-colors";
    });
    btn.className = "schedule-filter px-4 py-2 rounded-md text-sm bg-[#3d3530] text-[#f5f1ec] transition-colors";
    renderSchedules();
  });
});

loadSchedules();
