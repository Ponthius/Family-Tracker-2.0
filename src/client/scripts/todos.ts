import { loadLanguage, t } from "../lib/i18n.js";
import { api } from "../lib/api.js";
import { redirectIfGuest } from "../lib/session.js";
import { TodoItem, type Todo } from "../components/TodoItem.js";
import { Navbar } from "../components/Navbar.js";
import { Modal } from "../components/Modal.js";

redirectIfGuest();

await loadLanguage();

type UserResponse = { user: { id: string; name: string; email: string } };
type TodosResponse = { todos: Todo[] };
type TodoResponse = { todo: Todo };

const { user } = await api.get<UserResponse>("/api/auth/me");

document.body.prepend(Navbar({ userName: user.name }));

const list = document.getElementById("todo-list") as HTMLUListElement;
const form = document.getElementById("add-form") as HTMLFormElement;
const titleInput = document.getElementById("todo-title") as HTMLInputElement;
const emptyMsg = document.getElementById("empty-message") as HTMLParagraphElement;

async function loadTodos() {
  const { todos } = await api.get<TodosResponse>("/api/todos");
  list.innerHTML = "";
  emptyMsg.classList.toggle("hidden", todos.length > 0);

  for (const todo of todos) {
    list.appendChild(
      TodoItem({
        todo,
        onToggle: handleToggle,
        onDelete: handleDelete,
      }),
    );
  }
}

async function handleToggle(id: string, done: boolean) {
  await api.patch<TodoResponse>(`/api/todos/${id}`, { done });
  await loadTodos();
}

function handleDelete(id: string) {
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
  if (!title) return;
  await api.post<TodoResponse>("/api/todos", { title });
  titleInput.value = "";
  await loadTodos();
});

await loadTodos();
