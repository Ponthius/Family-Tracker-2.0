import { loadLanguage, t } from "../lib/i18n.js";
import { api } from "../lib/api.js";
import { redirectIfGuest, getCachedUser } from "../lib/session.js";
import { TodoItem, type Todo } from "../components/TodoItem.js";
import { Navbar } from "../components/Navbar.js";
import { Modal } from "../components/Modal.js";
import { addPendingAction } from "../../services/sync.services.ts";

redirectIfGuest();

await loadLanguage();

type UserResponse = { user: { id: string; name: string; email: string } };
type TodosResponse = { todos: Todo[] };
type TodoResponse = { todo: Todo };

type CachedTodos = Todo[];

let user = getCachedUser();
if (navigator.onLine) {
  try {
    const response = await api.get<UserResponse>("/api/auth/me");
    user = response.user;
  } catch {
    user = user ?? null;
  }
}

if (!user) {
  location.replace("/pages/login.html");
} else {
  document.body.prepend(Navbar({ userName: user.name }));
}

const list = document.getElementById("todo-list") as HTMLUListElement;
const form = document.getElementById("add-form") as HTMLFormElement;
const titleInput = document.getElementById("todo-title") as HTMLInputElement;
const emptyMsg = document.getElementById("empty-message") as HTMLParagraphElement;

function getCachedTodos(): CachedTodos {
  const stored = localStorage.getItem("cachedTodos");
  if (!stored) return [];
  try {
    return JSON.parse(stored) as CachedTodos;
  } catch {
    return [];
  }
}

function saveCachedTodos(todos: CachedTodos): void {
  localStorage.setItem("cachedTodos", JSON.stringify(todos));
}

function renderTodos(todos: CachedTodos) {
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

function showNotification(message: string, type: string = "info") {
  const container = document.getElementById("notification-container");
  const msgSpan = document.getElementById("notification-message");
  if (!container || !msgSpan) return;

  msgSpan.textContent = message;
  container.className = "notif-" + type;
  container.style.opacity = "1";
  container.style.pointerEvents = "auto";

  if (type === "success" || type === "info") {
    setTimeout(() => {
      container.style.opacity = "0";
      container.style.pointerEvents = "none";
    }, 3000);
  }
}

async function loadTodos() {
  try {
    const { todos } = await api.get<TodosResponse>("/api/todos");
    saveCachedTodos(todos);
    renderTodos(todos);
    return;
  } catch (err) {
    if (!navigator.onLine) {
      const cached = getCachedTodos();
      showNotification("Offline mode: showing cached todos.", "info");
      renderTodos(cached);
      return;
    }
    console.error("Unable to load todos:", err);
  }
}

async function handleToggle(id: string, done: boolean) {
  if (navigator.onLine) {
    await api.patch<TodoResponse>(`/api/todos/${id}`, { done });
    await loadTodos();
    return;
  }

  addPendingAction({
    endpoint: `/api/todos/${id}`,
    method: "PATCH",
    payload: { done },
  });

  const todos = getCachedTodos();
  const todo = todos.find((item) => item.id === id);
  if (todo) {
    todo.done = done;
    saveCachedTodos(todos);
    renderTodos(todos);
  }

  showNotification("You're offline. Action queued and will sync when online.", "info");
}

function handleDelete(id: string) {
  const { modal, open } = Modal({
    title: t("delete"),
    content: "Are you sure you want to delete this todo?",
    confirmLabel: t("delete"),
    onConfirm: async () => {
      if (navigator.onLine) {
        await api.delete(`/api/todos/${id}`);
        await loadTodos();
        return;
      }

      addPendingAction({
        endpoint: `/api/todos/${id}`,
        method: "DELETE",
        payload: {},
      });

      const todos = getCachedTodos().filter((item) => item.id !== id);
      saveCachedTodos(todos);
      renderTodos(todos);
      showNotification("You're offline. Action queued and will sync when online.", "info");
    },
  });
  document.body.appendChild(modal);
  open();
}

form.addEventListener("submit", async (e) => {
  e.preventDefault();
  const title = titleInput.value.trim();
  if (!title) return;

  if (navigator.onLine) {
    await api.post<TodoResponse>("/api/todos", { title });
    titleInput.value = "";
    await loadTodos();
    return;
  }

  const todos = getCachedTodos();
  const newTodo: Todo = {
    id: crypto.randomUUID(),
    title,
    done: false,
  };

  todos.unshift(newTodo);
  saveCachedTodos(todos);
  renderTodos(todos);
  titleInput.value = "";

  addPendingAction({
    endpoint: "/api/todos",
    method: "POST",
    payload: { title },
  });

  showNotification("You're offline. Action queued and will sync when online.", "info");
});

await loadTodos();
