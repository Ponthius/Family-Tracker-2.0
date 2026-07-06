type FamilyBranding = {
  name?: string | null;
  logoUrl?: string | null;
  accentColor?: string | null;
};

function readBranding(): FamilyBranding | null {
  const stored = localStorage.getItem("familyBranding");
  if (!stored) return null;
  try {
    return JSON.parse(stored) as FamilyBranding;
  } catch {
    return null;
  }
}

export async function loadBranding() {
  let branding = readBranding();
  if (!branding) {
    try {
      const res = await fetch("/api/auth/me", { credentials: "include" });
      if (res.ok) {
        const data = await res.json();
        branding = data.user?.family ?? null;
        if (branding) localStorage.setItem("familyBranding", JSON.stringify(branding));
        if (data.user?.language) localStorage.setItem("language", data.user.language);
      }
    } catch {
      branding = null;
    }
  }

  if (!branding) return;

  if (branding.name) {
    document.querySelectorAll("[data-family-name]").forEach((node) => {
      node.textContent = branding?.name ?? "";
    });
  }

  if (branding.accentColor) {
    document.documentElement.style.setProperty("--theme-color", branding.accentColor);
  }
}
