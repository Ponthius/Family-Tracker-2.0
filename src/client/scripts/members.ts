import { applyTranslations, loadLanguage } from "../lib/i18n.js";
import { loadGlobalSettings } from "../lib/settings.js";

await loadGlobalSettings().catch(() => undefined);
await loadLanguage();
applyTranslations();

const API = "/api";

const membersBody = document.getElementById("membersBody") as HTMLTableSectionElement;
const messageBox = document.getElementById("messageBox") as HTMLDivElement;
const addMemberBtn = document.getElementById("addMemberBtn") as HTMLButtonElement;
const addModal = document.getElementById("addModal") as HTMLDivElement;
const cancelAddBtn = document.getElementById("cancelAddBtn") as HTMLButtonElement;
const addMemberForm = document.getElementById("addMemberForm") as HTMLFormElement;

function showMessage(msg: string, kind: "success" | "error" = "success") {
  messageBox.textContent = msg;
  messageBox.className = `rounded-lg border px-4 py-3 text-sm ${
    kind === "success"
      ? "bg-[#e7efe2] text-[#3c5a3c] border-[#b9cdb0]"
      : "bg-[#fceeee] text-[#a13d3d] border-[#e3b5b5]"
  }`;
  messageBox.classList.remove("hidden");
  setTimeout(() => messageBox.classList.add("hidden"), 5000);
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

    membersBody.innerHTML = members.map((m: any) => {
      const verified = m.emailVerified ? '<span class="text-[#3c5a3c] text-xs">Verified</span>' : '<span class="text-[#a13d3d] text-xs">Pending</span>';
      const roleBadge = m.role === "Admin"
        ? `<span class="bg-[#3d3530] text-[#f5f1ec] text-xs px-2 py-0.5 rounded">${m.role}</span>`
        : `<span class="bg-[#e8e0d8] text-[#5a4e46] text-xs px-2 py-0.5 rounded">${m.role}</span>`;
      return `<tr class="border-b border-[#e0d6ce]">
        <td class="py-3">${roleBadge}</td>
        <td class="py-3 text-[#2c2420]">${m.username || "—"}</td>
        <td class="py-3 text-[#5a4e46]">${m.email || "—"}</td>
        <td class="py-3">${verified}</td>
      </tr>`;
    }).join("");
  } catch (err) {
    showMessage(err instanceof Error ? err.message : "Failed to load members.", "error");
  }
}

addMemberBtn.addEventListener("click", () => addModal.classList.remove("hidden"));
cancelAddBtn.addEventListener("click", () => addModal.classList.add("hidden"));
addModal.addEventListener("click", (e) => { if (e.target === addModal) addModal.classList.add("hidden"); });

addMemberForm.addEventListener("submit", async (e) => {
  e.preventDefault();
  const username = (document.getElementById("newUsername") as HTMLInputElement).value.trim();
  const email = (document.getElementById("newEmail") as HTMLInputElement).value.trim();
  const password = (document.getElementById("newPassword") as HTMLInputElement).value;
  const role = (document.getElementById("newRole") as HTMLSelectElement).value;

  try {
    const res = await fetch(`${API}/family/members`, {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, email, password, role }),
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
