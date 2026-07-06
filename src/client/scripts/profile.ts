import { api } from "../lib/api.js";
import { Modal } from "../components/Modal.js";

const familyName = document.getElementById("familyName") as HTMLInputElement;
const logoUrl = document.getElementById("logoUrl") as HTMLInputElement;
const messageBox = document.getElementById("messageBox") as HTMLDivElement;
const brandingForm = document.getElementById("brandingForm") as HTMLFormElement;
const deleteBtn = document.getElementById("deleteAccountBtn") as HTMLButtonElement;

function showMessage(message: string, kind: "success" | "error" = "success") {
  messageBox.textContent = message;
  messageBox.className = `rounded-lg border px-4 py-3 text-sm ${kind === "success" ? "bg-[#e7efe2] text-[#3c5a3c] border-[#b9cdb0]" : "bg-[#fceeee] text-[#a13d3d] border-[#e3b5b5]"}`;
  messageBox.classList.remove("hidden");
}

async function loadProfile() {
  const me = await api.get<{ user: any }>("/api/auth/me");
  familyName.value = me.user.family?.name ?? "";
  logoUrl.value = me.user.family?.logoUrl ?? "";
}

brandingForm.addEventListener("submit", async (e) => {
  e.preventDefault();
  try {
    const data = await api.patch<{ family: any }>("/api/auth/branding", {
      familyName: familyName.value.trim(),
      logoUrl: logoUrl.value.trim() || null,
    });
    showMessage(`Saved branding for ${data.family.name}.`);
  } catch (err) {
    showMessage(err instanceof Error ? err.message : "Unable to update branding.", "error");
  }
});

const modal = Modal({
  title: "Delete account",
  content: "This will suspend your account immediately and permanently remove it after 7 days.",
  confirmLabel: "Delete",
  confirmPhrase: "DELETE",
  onConfirm: async () => {
    try {
      const data = await api.delete<{ message: string }>("/api/auth/me");
      showMessage(data.message);
      setTimeout(() => location.replace("/pages/login.html"), 1200);
    } catch (err) {
      showMessage(err instanceof Error ? err.message : "Unable to delete account.", "error");
    }
  },
});

document.body.appendChild(modal.modal);
deleteBtn.addEventListener("click", () => modal.open());

loadProfile().catch((err) => showMessage(err instanceof Error ? err.message : "Unable to load profile.", "error"));
