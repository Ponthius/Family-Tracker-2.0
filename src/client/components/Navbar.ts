import { t, setLanguage } from "../lib/i18n.js";
import { api } from "../lib/api.js";

type NavbarOptions = {
  userName: string;
};

/**
 * Creates and returns the top navigation bar element.
 * Inject it at the top of <body>: document.body.prepend(Navbar({ userName }))
 */
export function Navbar({ userName }: NavbarOptions): HTMLElement {
  const nav = document.createElement("nav");
  nav.className =
    "flex items-center justify-between px-6 py-3 bg-indigo-600 text-white shadow";

  const brand = document.createElement("span");
  brand.textContent = t("app_name");
  brand.className = "font-bold text-lg";

  const right = document.createElement("div");
  right.className = "flex items-center gap-4";

  const greeting = document.createElement("span");
  greeting.textContent = t("greeting", { name: userName });
  greeting.className = "text-sm";

  const langSelect = document.createElement("select");
  langSelect.className = "text-sm bg-indigo-700 text-white rounded px-1 py-0.5 cursor-pointer";
  [["en", "English"], ["fr", "Français"]].forEach(([value, label]) => {
    const opt = document.createElement("option");
    opt.value = value;
    opt.textContent = label;
    if (localStorage.getItem("lang") === value) opt.selected = true;
    langSelect.appendChild(opt);
  });
  langSelect.addEventListener("change", () => setLanguage(langSelect.value));

  const logoutBtn = document.createElement("button");
  logoutBtn.textContent = t("logout");
  logoutBtn.className =
    "text-sm bg-white text-indigo-600 font-semibold px-3 py-1 rounded hover:bg-indigo-50 transition-colors";
  logoutBtn.addEventListener("click", async () => {
    try {
      await api.post("/api/auth/logout", {});
    } finally {
      location.replace("/pages/login.html");
    }
  });

  right.append(greeting, langSelect, logoutBtn);
  nav.append(brand, right);
  return nav;
}
