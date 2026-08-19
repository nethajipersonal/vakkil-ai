"use client";

import { useEffect, useState, useCallback } from "react";

export type AccentColor = "indigo" | "violet" | "rose" | "emerald" | "amber" | "sky" | "orange";
export type FontFamily = "inter" | "poppins" | "outfit" | "dm_sans" | "lato";

export const ACCENT_COLORS: Record<AccentColor, { name: string; h: number; s: number; l: number; hex: string; sidebar: string }> = {
  indigo:  { name: "Indigo",  h: 238, s: 84,  l: 62, hex: "#6366f1", sidebar: "226 45% 10%" },
  violet:  { name: "Violet",  h: 262, s: 83,  l: 58, hex: "#7c3aed", sidebar: "258 45% 10%" },
  rose:    { name: "Rose",    h: 350, s: 80,  l: 58, hex: "#f43f5e", sidebar: "345 45% 8%"  },
  emerald: { name: "Emerald", h: 160, s: 70,  l: 38, hex: "#10b981", sidebar: "155 45% 8%"  },
  amber:   { name: "Amber",   h: 38,  s: 92,  l: 50, hex: "#f59e0b", sidebar: "34 45% 8%"   },
  sky:     { name: "Sky",     h: 199, s: 89,  l: 48, hex: "#0ea5e9", sidebar: "195 45% 9%"  },
  orange:  { name: "Orange",  h: 25,  s: 95,  l: 53, hex: "#f97316", sidebar: "22 45% 8%"   },
};

export const FONT_FAMILIES: Record<FontFamily, { name: string; url: string; sample: string }> = {
  inter:   { name: "Inter",    url: "",                                                                         sample: "Advocate's Daily OS" },
  poppins: { name: "Poppins",  url: "https://fonts.googleapis.com/css2?family=Poppins:wght@300;400;500;600;700&display=swap", sample: "Advocate's Daily OS" },
  outfit:  { name: "Outfit",   url: "https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700&display=swap",  sample: "Advocate's Daily OS" },
  dm_sans: { name: "DM Sans",  url: "https://fonts.googleapis.com/css2?family=DM+Sans:wght@300;400;500;600;700&display=swap", sample: "Advocate's Daily OS" },
  lato:    { name: "Lato",     url: "https://fonts.googleapis.com/css2?family=Lato:wght@300;400;700&display=swap",           sample: "Advocate's Daily OS" },
};

const FONT_CSS_MAP: Record<FontFamily, string> = {
  inter:   "Inter, sans-serif",
  poppins: "'Poppins', sans-serif",
  outfit:  "'Outfit', sans-serif",
  dm_sans: "'DM Sans', sans-serif",
  lato:    "'Lato', sans-serif",
};

interface ThemeSettings {
  accent: AccentColor;
  font: FontFamily;
}

export function applyAccent(color: AccentColor) {
  const { h, s, l, sidebar } = ACCENT_COLORS[color];
  const root = document.documentElement;
  root.style.setProperty("--primary", `${h} ${s}% ${l}%`);
  root.style.setProperty("--accent",  `${h} ${s}% ${l}%`);
  root.style.setProperty("--ring",    `${h} ${s}% ${l}%`);
  const lDark = Math.min(l + 8, 88);
  root.style.setProperty("--primary-dark", `${h} ${s}% ${lDark}%`);
  root.style.setProperty("--sidebar", sidebar);
  const sidebarBorderH = h; const sidebarBorderS = Math.max(s - 20, 20); const sidebarBorderL = Math.min(l - 25, 30);
  root.style.setProperty("--sidebar-border", `${sidebarBorderH} ${sidebarBorderS}% ${sidebarBorderL}%`);
}

export function applyFont(font: FontFamily) {
  // Inject Google Fonts link if needed
  const url = FONT_FAMILIES[font].url;
  if (url) {
    const existing = document.getElementById(`gfont-${font}`);
    if (!existing) {
      const link = document.createElement("link");
      link.id = `gfont-${font}`;
      link.rel = "stylesheet";
      link.href = url;
      document.head.appendChild(link);
    }
  }
  document.documentElement.style.setProperty("--font-sans", FONT_CSS_MAP[font]);
  document.body.style.fontFamily = FONT_CSS_MAP[font];
}

export function useThemeSettings() {
  const [settings, setSettings] = useState<ThemeSettings>({ accent: "indigo", font: "inter" });

  useEffect(() => {
    try {
      const saved = localStorage.getItem("vakkil-theme");
      if (saved) {
        const parsed = JSON.parse(saved) as ThemeSettings;
        setSettings(parsed);
        applyAccent(parsed.accent);
        applyFont(parsed.font);
      }
    } catch {}
  }, []);

  const updateAccent = useCallback((accent: AccentColor) => {
    setSettings((prev) => {
      const next = { ...prev, accent };
      localStorage.setItem("vakkil-theme", JSON.stringify(next));
      applyAccent(accent);
      return next;
    });
  }, []);

  const updateFont = useCallback((font: FontFamily) => {
    setSettings((prev) => {
      const next = { ...prev, font };
      localStorage.setItem("vakkil-theme", JSON.stringify(next));
      applyFont(font);
      return next;
    });
  }, []);

  return { settings, updateAccent, updateFont };
}
