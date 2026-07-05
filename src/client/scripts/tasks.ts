import { api } from "../lib/api.js";
import { loadLanguage, t } from "../lib/i18n.js";
import { redirectIfGuest } from "../lib/session.js";

redirectIfGuest();
await loadLanguage();

type FamilyMember = {
  id: string;
  username: string;
  role: string;
};

type Task = {
  id: string;
  title: string;
  description?: string | null;
  done: boolean;
  dueDate?: string | null;
  user?: { username: string } | null;
  assignedToUser?: { username: string } | null;
  createdAt: string;
};

const tableBody = document.getElementById("taskTableBody") as HTMLTableSectionElement;
const noResults = document.getElementById("noResults") as HTMLParagraphElement;
const searchInput = document.getElementById("searchInput") as HTMLInputElement;
const confirmation = document.getElementById("confirmation") as HTMLDivElement;
const modalOverlay = document.getElementById("modalOverlay") as HTMLDivElement;
const createTaskBtn = document.getElementById("createTaskBtn") as HTMLButtonElement;
const cancelBtn = document.getElementById("cancelBtn") as HTMLButtonElement;
const saveTaskBtn = document.getElementById("saveTaskBtn") as HTMLButtonElement;
const assignRole = document.getElementById("assignRole") as HTMLSelectElement;
const taskName = document.getElementById("taskName") as HTMLInputElement;
const taskDesc = document.getElementById("taskDesc") as HTMLTextAreaElement;
const taskDate = document.getElementById("taskDate") as HTMLInputElement;
const taskTime = document.getElementById("taskTime") as HTMLInputElement;
const errAssign = document.getElementById("errAssign") as HTMLParagraphElement;
const errName = document.getElementById("errName") as HTMLParagraphElement;
const errDate = document.getElementById("errDate") as HTMLParagraphElement;
const errTime = document.getElementById("errTime") as HTMLParagraphElement;

let tasks: Task[] = [];
let members: FamilyMember[] = [];

function show(el: HTMLElement): void {
  el.classList.remove("hidden");
}

function hide(el: HTMLElement): void {
  el.classList.add("hidden");
}

function formatDateTime(dateStr?: string | null): string {
  if (!dateStr) return "—";
  const d = new Date(dateStr);
  return d.toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

function showNotification(message: string, kind: "success" | "error" = "success") {
  confirmation.textContent = message;
  confirmation.className =
    kind === "success"
      ? "mb-4 px-4 py-[10px] bg-[#e7efe2] border border-[#b9cdb0] text-[#3c5a3c] text-[0.85rem] rounded-md"
      : "mb-4 px-4 py-[10px] bg-[#fceeee] border border-[#e3b5b5] text-[#a13d3d] text-[0.85rem] rounded-md";
  show(confirmation);
  setTimeout(() => hide(confirmation), 3000);
}

function openModal(): void {
  modalOverlay.classList.remove("hidden");
}

function closeModal(): void {
  modalOverlay.classList.add("hidden");
  assignRole.value = "";
  taskName.value = "";
  taskDesc.value = "";
  taskDate.value = "";
  taskTime.value = "";
  [errAssign, errName, errDate, errTime].forEach(hide);
}

function renderMembers() {
  assignRole.innerHTML =
    `<option value="">Select user</option>` +
    members.map((member) => `<option value="${member.id}">${member.username} (${member.role})</option>`).join("");
}

function renderTable(list: Task[]): void {
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
      <td class="px-3 py-[10px] border-b border-[#ddd4c8] text-[#2c2420]">${task.user?.username ?? "—"}</td>
      <td class="px-3 py-[10px] border-b border-[#ddd4c8] text-[#2c2420]">${task.assignedToUser?.username ?? "Unassigned"}</td>
      <td class="px-3 py-[10px] border-b border-[#ddd4c8] text-[#2c2420]">${task.title}</td>
      <td class="px-3 py-[10px] border-b border-[#ddd4c8] text-[#2c2420]">${task.description ?? "—"}</td>
      <td class="px-3 py-[10px] border-b border-[#ddd4c8] text-[#2c2420] whitespace-nowrap">${formatDateTime(task.dueDate ?? task.createdAt)}</td>
    `;
    tableBody.appendChild(tr);
  }
}

function applySearch(): void {
  const term = searchInput.value.trim().toLowerCase();
  if (!term) {
    renderTable(tasks);
    return;
  }
  renderTable(
    tasks.filter(
      (task) =>
        task.title.toLowerCase().includes(term) ||
        (task.description ?? "").toLowerCase().includes(term) ||
        (task.user?.username ?? "").toLowerCase().includes(term) ||
        (task.assignedToUser?.username ?? "").toLowerCase().includes(term),
    ),
  );
}

async function loadData() {
  const [tasksRes, membersRes] = await Promise.all([
    api.get<{ todos: Task[] }>("/api/todos"),
    api.get<{ members: FamilyMember[] }>("/api/todos/members"),
  ]);
  tasks = tasksRes.todos;
  members = membersRes.members;
  renderMembers();
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

  try {
    const created = await api.post<{ todo: Task }>("/api/todos", {
      title: taskName.value.trim(),
      description: taskDesc.value.trim(),
      dueDate,
      assignedToUserId: assignRole.value,
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
