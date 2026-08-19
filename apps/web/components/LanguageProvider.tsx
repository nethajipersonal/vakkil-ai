"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { LOCALE_LABELS, MESSAGES, SUPPORTED_LOCALES, isLocale, type Locale } from "@/lib/i18n/translations";

type Messages = (typeof MESSAGES)[Locale];
type Section = keyof Messages;

interface LanguageContextValue {
  locale: Locale;
  setLocale: (locale: Locale) => void;
  t: <S extends Section>(section: S, key: keyof Messages[S]) => string;
}

const STORAGE_KEY = "vakkil-locale";

const LanguageContext = createContext<LanguageContextValue | null>(null);

function applyLocale(locale: Locale) {
  document.documentElement.lang = locale;
  document.documentElement.classList.remove(
    ...SUPPORTED_LOCALES.map((l) => LOCALE_LABELS[l].font)
  );
  document.documentElement.classList.add(LOCALE_LABELS[locale].font);
}

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>("en");

  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (isLocale(saved)) {
        setLocaleState(saved);
        applyLocale(saved);
      }
    } catch {}
  }, []);

  const setLocale = useCallback((next: Locale) => {
    setLocaleState(next);
    try {
      localStorage.setItem(STORAGE_KEY, next);
    } catch {}
    applyLocale(next);
  }, []);

  const t = useCallback(
    <S extends Section>(section: S, key: keyof Messages[S]): string => {
      const value = MESSAGES[locale][section][key];
      return typeof value === "string" ? value : String(MESSAGES.en[section][key]);
    },
    [locale]
  );

  const value = useMemo(() => ({ locale, setLocale, t }), [locale, setLocale, t]);

  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>;
}

export function useLanguage(): LanguageContextValue {
  const ctx = useContext(LanguageContext);
  if (!ctx) throw new Error("useLanguage must be used within LanguageProvider");
  return ctx;
}
