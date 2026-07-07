type FamilyBranding = {
  name?: string | null;
  logoUrl?: string | null;
  accentColor?: string | null;
};

type SessionUser = {
  language?: string | null;
  family?: FamilyBranding | null;
};

function readJson<T>(value: string | null): T | null {
  if (!value) return null;
  try {
    return JSON.parse(value) as T;
  } catch {
    return null;
  }
}

function getStoredLanguage(): string {
  return localStorage.getItem("lang") ?? localStorage.getItem("language") ?? "en";
}

function setRootTheme(mode: "light" | "dark") {
  document.documentElement.dataset["theme"] = mode;
  document.body?.classList.toggle("dark-mode", mode === "dark");
  localStorage.setItem("display_mode", mode);
}

function applyBranding(branding: FamilyBranding | null) {
  if (!branding) return;
  if (branding.name) {
    document.querySelectorAll<HTMLElement>("[data-family-name]").forEach((node) => {
      node.textContent = branding.name ?? node.textContent ?? "";
    });
  }
  if (branding.accentColor) {
    document.documentElement.style.setProperty("--theme-color", branding.accentColor);
    localStorage.setItem("workspace_theme_color", branding.accentColor);
  }
  localStorage.setItem("familyBranding", JSON.stringify(branding));
}

function refreshTitle(brandName?: string | null) {
  if (!brandName) return;
  document.title = document.title.replace(/Family Tracker|Super Admin|Members|Tasks|Schedules|Profile/gi, brandName);
}

export async function loadGlobalSettings() {
  const storedBranding = readJson<FamilyBranding>(localStorage.getItem("familyBranding"));
  const storedMode = (localStorage.getItem("display_mode") as "light" | "dark" | null) ?? "light";
  setRootTheme(storedMode);
  applyBranding(storedBranding);
  refreshTitle(storedBranding?.name);

  const lang = getStoredLanguage();
  document.documentElement.lang = lang;

  if (storedBranding && storedBranding.name) {
    document.title = document.title.replace(/Family Tracker|Super Admin|Members|Tasks|Schedules|Profile/gi, storedBranding.name);
  }

  try {
    const res = await fetch("/api/auth/me", { credentials: "include" });
    if (!res.ok) return;
    const data: { user?: SessionUser } = await res.json();
    if (data.user?.language) {
      localStorage.setItem("lang", data.user.language);
      localStorage.setItem("language", data.user.language);
      document.documentElement.lang = data.user.language;
    }
    if (data.user?.family) {
      applyBranding(data.user.family);
      refreshTitle(data.user.family.name);
    }
  } catch {
    return;
  }
}

export function saveTheme(mode: "light" | "dark") {
  setRootTheme(mode);
}

export function saveLanguage(lang: string) {
  localStorage.setItem("lang", lang);
  localStorage.setItem("language", lang);
  document.documentElement.lang = lang;
}

export function saveBranding(branding: FamilyBranding) {
  applyBranding(branding);
}
