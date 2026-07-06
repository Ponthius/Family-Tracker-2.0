// ─────────────────────────────────────────────
//  Family Tracker — Super Admin Dashboard
//  super-admin.ts
// ─────────────────────────────────────────────

const API = "/api";
const tenantsBody = document.getElementById("tenantsBody") as HTMLTableSectionElement;
const totalFamilies = document.getElementById("totalFamilies") as HTMLSpanElement;
const totalMembers = document.getElementById("totalMembers") as HTMLSpanElement;
const activeFamilies = document.getElementById("activeFamilies") as HTMLSpanElement;
const messageBox = document.getElementById("messageBox") as HTMLDivElement;

function showMessage(msg: string, kind: "success" | "error" = "error") {
  messageBox.textContent = msg;
  messageBox.className = `rounded-lg border px-4 py-3 text-sm ${
    kind === "success"
      ? "bg-[#e7efe2] text-[#3c5a3c] border-[#b9cdb0]"
      : "bg-[#fceeee] text-[#a13d3d] border-[#e3b5b5]"
  }`;
  messageBox.classList.remove("hidden");
}

async function loadTenants() {
  try {
    const res = await fetch(`${API}/family/tenants`);
    const data = await res.json();
    if (!res.ok) throw new Error(data.error);

    const tenants = data.tenants || [];

    // Stats
    totalFamilies.textContent = String(tenants.length);
    const memberCount = tenants.reduce((sum: number, t: any) => sum + (t.memberCount || 0), 0);
    totalMembers.textContent = String(memberCount);
    const active = tenants.filter((t: any) => !t.deletedAt).length;
    activeFamilies.textContent = String(active);

    if (tenants.length === 0) {
      tenantsBody.innerHTML = '<tr><td colspan="6" class="py-8 text-center text-[#9b8a7a]">No families registered yet.</td></tr>';
      return;
    }

    tenantsBody.innerHTML = tenants.map((t: any) => {
      const created = t.createdAt ? new Date(t.createdAt).toLocaleDateString() : "—";
      const status = t.deletedAt
        ? '<span class="bg-[#fceeee] text-[#a13d3d] text-xs px-2 py-0.5 rounded">Deleted</span>'
        : '<span class="bg-[#e7efe2] text-[#3c5a3c] text-xs px-2 py-0.5 rounded">Active</span>';
      return `<tr class="border-b border-[#e0d6ce]">
        <td class="py-3 font-medium text-[#2c2420]">${t.name}</td>
        <td class="py-3 text-[#5a4e46]">${t.adminUsername}</td>
        <td class="py-3 text-[#5a4e46]">${t.adminEmail}</td>
        <td class="py-3">${t.memberCount}</td>
        <td class="py-3 text-[#7a6e66]">${created}</td>
        <td class="py-3">${status}</td>
      </tr>`;
    }).join("");
  } catch (err) {
    showMessage(err instanceof Error ? err.message : "Failed to load tenants.");
    tenantsBody.innerHTML = '<tr><td colspan="6" class="py-8 text-center text-[#a13d3d]">Access denied. Super admin only.</td></tr>';
  }
}

loadTenants();
loadBranding().catch(() => undefined);
import { loadBranding } from "../lib/branding.js";
