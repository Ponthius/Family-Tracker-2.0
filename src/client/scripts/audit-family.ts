import { loadBranding } from "../lib/branding.js";

type AuditLog = {
  action: string;
  createdAt: string;
  actorUserId?: string | null;
  targetUserId?: string | null;
};

const auditTableBody = document.getElementById("auditTableBody") as HTMLTableSectionElement;
const noAudit = document.getElementById("noAudit") as HTMLParagraphElement;
const filterSearch = document.getElementById("filterSearch") as HTMLInputElement;
const clearFilterBtn = document.getElementById("clearFilterBtn") as HTMLButtonElement;

let logs: AuditLog[] = [];

function render() {
  const term = filterSearch.value.trim().toLowerCase();
  const filtered = term
    ? logs.filter((log) => log.action.toLowerCase().includes(term) || (log.actorUserId ?? "").toLowerCase().includes(term))
    : logs;

  if (!filtered.length) {
    auditTableBody.innerHTML = "";
    noAudit.classList.remove("hidden");
    return;
  }

  noAudit.classList.add("hidden");
  auditTableBody.innerHTML = filtered.map((log) => {
    const date = new Date(log.createdAt);
    return `<tr class="hover:bg-[#f0ebe3] transition-colors">
      <td class="px-3 py-[10px] border-b border-[#ddd4c8]">${log.actorUserId ?? "—"}</td>
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

loadBranding().catch(() => undefined);
load().catch(() => {
  auditTableBody.innerHTML = `<tr><td colspan="6" class="text-center text-[#7a6e66] py-4">Failed to load audit logs.</td></tr>`;
});
