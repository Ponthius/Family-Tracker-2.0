/**
 * Simple client-side translation helper.
 *
 * Usage:
 *   await loadLanguage();          // call once when the page loads
 *   t("add_todo")                  // returns the translated string
 *   t("greeting", { name: "Ali" }) // supports variable substitution
 */

type Translations = Record<string, string>;

let translations: Translations = {};

export async function loadLanguage(): Promise<void> {
  const lang = localStorage.getItem("lang") ?? localStorage.getItem("language") ?? "en";
  const res = await fetch(`/locales/${lang}.json`);
  translations = await res.json();
  document.documentElement.lang = lang;
}

export function t(key: string, vars?: Record<string, string>): string {
  let text = translations[key] ?? key;
  if (vars) {
    for (const [k, v] of Object.entries(vars)) {
      text = text.replaceAll(`{{${k}}}`, v);
    }
  }
  return text;
}

export function setLanguage(lang: string): void {
  localStorage.setItem("lang", lang);
  localStorage.setItem("language", lang);
  document.documentElement.lang = lang;
}

function resolveTemplate(text: string, vars?: Record<string, string>): string {
  let result = text;
  if (vars) {
    for (const [k, v] of Object.entries(vars)) {
      result = result.replaceAll(`{{${k}}}`, v);
    }
  }
  return result;
}

export function applyTranslations(root: ParentNode = document): void {
  root.querySelectorAll<HTMLElement>("[data-i18n]").forEach((node) => {
    const key = node.getAttribute("data-i18n");
    if (!key) return;
    const value = translations[key];
    if (value) node.textContent = resolveTemplate(value, node.dataset);
  });

  root.querySelectorAll<HTMLInputElement | HTMLTextAreaElement>("[data-i18n-placeholder]").forEach((node) => {
    const key = node.getAttribute("data-i18n-placeholder");
    if (!key) return;
    const value = translations[key];
    if (value) node.placeholder = resolveTemplate(value, node.dataset);
  });

  root.querySelectorAll<HTMLElement>("[data-i18n-title]").forEach((node) => {
    const key = node.getAttribute("data-i18n-title");
    if (!key) return;
    const value = translations[key];
    if (value) node.setAttribute("title", resolveTemplate(value, node.dataset));
  });
}
