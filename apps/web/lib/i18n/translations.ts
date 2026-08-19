import en from "@/messages/en.json";
import ta from "@/messages/ta.json";
import te from "@/messages/te.json";
import hi from "@/messages/hi.json";

export const SUPPORTED_LOCALES = ["en", "ta", "te", "hi"] as const;
export type Locale = (typeof SUPPORTED_LOCALES)[number];

export const LOCALE_LABELS: Record<Locale, { label: string; native: string; font: string }> = {
  en: { label: "English", native: "English", font: "font-sans" },
  ta: { label: "Tamil", native: "தமிழ்", font: "font-tamil" },
  te: { label: "Telugu", native: "తెలుగు", font: "font-telugu" },
  hi: { label: "Hindi", native: "हिंदी", font: "font-hindi" },
};

export const MESSAGES: Record<Locale, typeof en> = { en, ta, te, hi };

export function isLocale(value: string | null | undefined): value is Locale {
  return !!value && (SUPPORTED_LOCALES as readonly string[]).includes(value);
}
