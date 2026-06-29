import { t } from "../lib/i18n.js";

export type Todo = {
  id: string;
  title: string;
  done: boolean;
};

type TodoItemOptions = {
  todo: Todo;
  onToggle: (id: string, done: boolean) => void;
  onDelete: (id: string) => void;
};

/**
 * Creates and returns a single <li> element representing one todo.
 * The caller is responsible for appending it to the list.
 */
export function TodoItem({ todo, onToggle, onDelete }: TodoItemOptions): HTMLLIElement {
  const li = document.createElement("li");
  li.dataset["id"] = todo.id;
  li.className = "flex items-center gap-3 p-3 rounded-lg border border-gray-200";

  const checkbox = document.createElement("input");
  checkbox.type = "checkbox";
  checkbox.checked = todo.done;
  checkbox.className = "h-5 w-5 cursor-pointer accent-indigo-600";
  checkbox.setAttribute("aria-label", t(todo.done ? "mark_undone" : "mark_done"));
  checkbox.addEventListener("change", () => onToggle(todo.id, checkbox.checked));

  const label = document.createElement("span");
  label.textContent = todo.title;
  label.className = `flex-1 ${todo.done ? "line-through text-gray-400" : "text-gray-800"}`;

  const deleteBtn = document.createElement("button");
  deleteBtn.textContent = t("delete");
  deleteBtn.className =
    "text-sm text-red-500 hover:text-red-700 transition-colors";
  deleteBtn.addEventListener("click", () => onDelete(todo.id));

  li.append(checkbox, label, deleteBtn);
  return li;
}
