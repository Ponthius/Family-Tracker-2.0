// ─────────────────────────────────────────────
//  Family Tracker — Tasks Page Logic
//  tasks.ts
//
//  Compile to tasks.js before use:
//    tsc tasks.ts --target ES6 --lib ES6,DOM
// ─────────────────────────────────────────────

// ── Types ──────────────────────────────────────────────────────────────────

interface Task {
  role: string;
  username: string;
  name: string;
  desc: string;
  date: string;
  time: string;
}

// ── In-memory task store ────────────────────────────────────────────────────
// Replace with API fetch calls once your backend is connected.

const tasks: Task[] = [];

// ── DOM References ──────────────────────────────────────────────────────────

const tableBody    = document.getElementById("taskTableBody")  as HTMLTableSectionElement;
const noResults    = document.getElementById("noResults")      as HTMLParagraphElement;
const searchInput  = document.getElementById("searchInput")    as HTMLInputElement;
const confirmation = document.getElementById("confirmation")   as HTMLDivElement;

const modalOverlay  = document.getElementById("modalOverlay")  as HTMLDivElement;
const createTaskBtn = document.getElementById("createTaskBtn") as HTMLButtonElement;
const cancelBtn     = document.getElementById("cancelBtn")     as HTMLButtonElement;
const saveTaskBtn   = document.getElementById("saveTaskBtn")   as HTMLButtonElement;

const assignRole = document.getElementById("assignRole") as HTMLSelectElement;
const taskName   = document.getElementById("taskName")   as HTMLInputElement;
const taskDesc   = document.getElementById("taskDesc")   as HTMLTextAreaElement;
const taskDate   = document.getElementById("taskDate")   as HTMLInputElement;
const taskTime   = document.getElementById("taskTime")   as HTMLInputElement;

const errAssign = document.getElementById("errAssign") as HTMLParagraphElement;
const errName   = document.getElementById("errName")   as HTMLParagraphElement;
const errDate   = document.getElementById("errDate")   as HTMLParagraphElement;
const errTime   = document.getElementById("errTime")   as HTMLParagraphElement;

// ── Helpers ─────────────────────────────────────────────────────────────────

function formatDateTime(dateStr: string, timeStr: string): string {
  if (!dateStr || !timeStr) return "";
  const d = new Date(`${dateStr}T${timeStr}`);
  return d.toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

function isPast(dateStr: string, timeStr: string): boolean {
  const selected = new Date(`${dateStr}T${timeStr}`);
  return selected.getTime() < Date.now();
}

function show(el: HTMLElement): void {
  el.classList.remove("hidden");
}

function hide(el: HTMLElement): void {
  el.classList.add("hidden");
}

// ── Render Table ────────────────────────────────────────────────────────────

function renderTable(list: Task[]): void {
  tableBody.innerHTML = "";

  if (list.length === 0) {
    show(noResults);
    return;
  }
  hide(noResults);

  list.forEach((task: Task) => {
    const tr = document.createElement("tr");
    tr.className = "hover:bg-[#f0ebe3] transition-colors";
    tr.innerHTML = `
      <td class="px-3 py-[10px] border-b border-[#ddd4c8]">
        <span class="inline-block px-[9px] py-[2px] rounded-full text-[0.75rem]
                     bg-[#ece1d2] text-[#5a4038] capitalize">${task.role}</span>
      </td>
      <td class="px-3 py-[10px] border-b border-[#ddd4c8] text-[#2c2420]">${task.username}</td>
      <td class="px-3 py-[10px] border-b border-[#ddd4c8] text-[#2c2420]">${task.name}</td>
      <td class="px-3 py-[10px] border-b border-[#ddd4c8] text-[#2c2420]">${task.desc ? task.desc : "—"}</td>
      <td class="px-3 py-[10px] border-b border-[#ddd4c8] text-[#2c2420] whitespace-nowrap">${formatDateTime(task.date, task.time)}</td>
    `;
    tableBody.appendChild(tr);
  });
}

// ── Search ──────────────────────────────────────────────────────────────────

function applySearch(): void {
  const term = searchInput.value.trim().toLowerCase();
  if (!term) {
    renderTable(tasks);
    return;
  }
  const filtered = tasks.filter((t: Task) =>
    t.name.toLowerCase().includes(term) ||
    t.username.toLowerCase().includes(term) ||
    (t.desc && t.desc.toLowerCase().includes(term))
  );
  renderTable(filtered);
}

searchInput.addEventListener("input", applySearch);

// ── Modal ───────────────────────────────────────────────────────────────────

function openModal(): void {
  modalOverlay.style.display = "flex";
}

function closeModal(): void {
  modalOverlay.style.display = "none";
  assignRole.value = "";
  taskName.value   = "";
  taskDesc.value   = "";
  taskDate.value   = "";
  taskTime.value   = "";
  [errAssign, errName, errDate, errTime].forEach(hide);
}

createTaskBtn.addEventListener("click", openModal);
cancelBtn.addEventListener("click", closeModal);

modalOverlay.addEventListener("click", (e) => {
  if (e.target === modalOverlay) closeModal();
});

// ── Save Task ───────────────────────────────────────────────────────────────

saveTaskBtn.addEventListener("click", () => {
  let valid = true;

  [errAssign, errName, errDate, errTime].forEach(hide);

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

  if (valid && taskDate.value && taskTime.value && isPast(taskDate.value, taskTime.value)) {
    errDate.textContent = "Date/time cannot be in the past.";
    show(errDate);
    valid = false;
  }

  if (!valid) return;

  const [role, username] = assignRole.value.split("|");

  const newTask: Task = {
    role,
    username,
    name: taskName.value.trim(),
    desc: taskDesc.value.trim(),
    date: taskDate.value,
    time: taskTime.value,
  };

  tasks.push(newTask);

  closeModal();
  searchInput.value = "";
  renderTable(tasks);

  show(confirmation);
  setTimeout(() => hide(confirmation), 3000);
});

// ── Init ────────────────────────────────────────────────────────────────────

renderTable(tasks);
