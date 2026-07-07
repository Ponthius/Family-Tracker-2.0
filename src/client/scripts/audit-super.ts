import { applyTranslations, loadLanguage } from "../lib/i18n.js";
import { loadGlobalSettings } from "../lib/settings.js";

await loadGlobalSettings().catch(() => undefined);
await loadLanguage();
applyTranslations();

type Tenant = {
  name: string;
  adminUsername: string;
  adminEmail?: string;
  memberCount: number;
  deletedAt?: string | null;
  createdAt: string;
};

type AuditLog = {
  action: string;
  createdAt: string;
  actorUserId?: string | null;
  familyId?: string | null;
};

const tenantsBody = document.getElementById("tenantsBody") as HTMLTableSectionElement;
const auditBody = document.getElementById("auditTableBody") as HTMLTableSectionElement;
const messageBox = document.getElementById("messageBox") as HTMLDivElement;
const totalFamilies = document.getElementById("totalFamilies") as HTMLSpanElement;
const totalMembers = document.getElementById("totalMembers") as HTMLSpanElement;
const activeFamilies = document.getElementById("activeFamilies") as HTMLSpanElement;

function showMessage(message: string) {
  messageBox.textContent = message;
  messageBox.classList.remove("hidden");
}

async function loadTenants() {
  const res = await fetch("/api/family/tenants", { credentials: "include" });
  if (!res.ok) throw new Error("Failed to load tenants.");
  const data = await res.json();
  const tenants: Tenant[] = data.tenants || [];
  totalFamilies.textContent = String(tenants.length);
  totalMembers.textContent = String(tenants.reduce((sum, tenant) => sum + (tenant.memberCount || 0), 0));
  activeFamilies.textContent = String(tenants.filter((tenant) => !tenant.deletedAt).length);
  tenantsBody.innerHTML = tenants.map((tenant) => {
    const created = new Date(tenant.createdAt).toLocaleDateString();
    const status = tenant.deletedAt
      ? '<span class="bg-[#fceeee] text-[#a13d3d] text-xs px-2 py-0.5 rounded">Deleted</span>'
      : '<span class="bg-[#e7efe2] text-[#3c5a3c] text-xs px-2 py-0.5 rounded">Active</span>';
    return `<tr class="border-b border-[#e0d6ce]">
      <td class="py-3 font-medium text-[#2c2420]">${tenant.name}</td>
      <td class="py-3 text-[#5a4e46]">${tenant.adminUsername}</td>
      <td class="py-3 text-[#5a4e46]">${tenant.adminEmail ?? "—"}</td>
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
  const logs: AuditLog[] = data.logs || [];
  auditBody.innerHTML = logs.map((log) => {
    const date = new Date(log.createdAt);
    return `<tr class="border-b border-[#e0d6ce]">
      <td class="py-3 text-[#2c2420]">${log.actorUserId ?? "—"}</td>
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
