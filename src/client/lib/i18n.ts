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
  const lang = localStorage.getItem("lang") ?? "en";
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
  location.reload();
}
