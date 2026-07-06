/**
 * A reusable modal dialog component.
 *
 * Usage:
 *   const { modal, open, close } = Modal({
 *     title: "Confirm delete",
 *     content: "Are you sure?",
 *     onConfirm: () => deleteTodo(id),
 *   });
 *   document.body.appendChild(modal);
 *   open();
 */
export function Modal({ title, content, onConfirm, confirmLabel = "Confirm", cancelLabel = "Cancel" }) {
    const overlay = document.createElement("div");
    overlay.className =
        "fixed inset-0 bg-black/50 flex items-center justify-center z-50 hidden";
    const dialog = document.createElement("div");
    dialog.className = "bg-white rounded-xl shadow-xl p-6 w-full max-w-sm";
    const heading = document.createElement("h2");
    heading.textContent = title;
    heading.className = "text-lg font-semibold text-gray-900 mb-2";
    const body = document.createElement("p");
    body.textContent = content;
    body.className = "text-gray-600 mb-6";
    const actions = document.createElement("div");
    actions.className = "flex justify-end gap-3";
    const cancelBtn = document.createElement("button");
    cancelBtn.textContent = cancelLabel;
    cancelBtn.className =
        "px-4 py-2 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50 transition-colors";
    cancelBtn.addEventListener("click", close);
    const confirmBtn = document.createElement("button");
    confirmBtn.textContent = confirmLabel;
    confirmBtn.className =
        "px-4 py-2 rounded-lg bg-red-600 text-white hover:bg-red-700 transition-colors";
    confirmBtn.addEventListener("click", () => {
        onConfirm();
        close();
    });
    actions.append(cancelBtn, confirmBtn);
    dialog.append(heading, body, actions);
    overlay.appendChild(dialog);
    overlay.addEventListener("click", (e) => {
        if (e.target === overlay)
            close();
    });
    function open() {
        overlay.classList.remove("hidden");
    }
    function close() {
        overlay.classList.add("hidden");
    }
    return { modal: overlay, open, close };
}
