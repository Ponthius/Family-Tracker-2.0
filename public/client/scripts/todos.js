import { loadLanguage, t } from "../lib/i18n.js";
import { api } from "../lib/api.js";
import { redirectIfGuest } from "../lib/session.js";
import { TodoItem } from "../components/TodoItem.js";
import { Navbar } from "../components/Navbar.js";
import { Modal } from "../components/Modal.js";
redirectIfGuest();
await loadLanguage();
const { user } = await api.get("/api/auth/me");
document.body.prepend(Navbar({ userName: user.name }));
const list = document.getElementById("todo-list");
const form = document.getElementById("add-form");
const titleInput = document.getElementById("todo-title");
const emptyMsg = document.getElementById("empty-message");
async function loadTodos() {
    const { todos } = await api.get("/api/todos");
    list.innerHTML = "";
    emptyMsg.classList.toggle("hidden", todos.length > 0);
    for (const todo of todos) {
        list.appendChild(TodoItem({
            todo,
            onToggle: handleToggle,
            onDelete: handleDelete,
        }));
    }
}
async function handleToggle(id, done) {
    await api.patch(`/api/todos/${id}`, { done });
    await loadTodos();
}
function handleDelete(id) {
    const { modal, open } = Modal({
        title: t("delete"),
        content: "Are you sure you want to delete this todo?",
        confirmLabel: t("delete"),
        onConfirm: async () => {
            await api.delete(`/api/todos/${id}`);
            await loadTodos();
        },
    });
    document.body.appendChild(modal);
    open();
}
form.addEventListener("submit", async (e) => {
    e.preventDefault();
    const title = titleInput.value.trim();
    if (!title)
        return;
    await api.post("/api/todos", { title });
    titleInput.value = "";
    await loadTodos();
});
await loadTodos();
