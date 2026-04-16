"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import {
  DEFAULT_LANGUAGE,
  LANGUAGES,
  type Language,
} from "@loppemarked/shared";
import { translations, type TranslationKey } from "./translations";

interface LanguageContextValue {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: TranslationKey) => string;
  ready: boolean;
}

const LanguageContext = createContext<LanguageContextValue | null>(null);

const STORAGE_KEY = "loppemarked-language";

function detectBrowserLanguage(): Language {
  if (typeof navigator === "undefined") return DEFAULT_LANGUAGE;
  const browserLang = navigator.language.split("-")[0];
  if (LANGUAGES.includes(browserLang as Language)) {
    return browserLang as Language;
  }
  return DEFAULT_LANGUAGE;
}

function readStoredLanguage(): Language | null {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored && LANGUAGES.includes(stored as Language)) {
      return stored as Language;
    }
  } catch {
    // localStorage unavailable (SSR, private browsing, etc.)
  }
  return null;
}

function persistLanguage(lang: Language): void {
  try {
    localStorage.setItem(STORAGE_KEY, lang);
  } catch {
    // localStorage unavailable
  }
}

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [language, setLanguageState] = useState<Language>(DEFAULT_LANGUAGE);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const stored = readStoredLanguage();
    const resolved = stored ?? detectBrowserLanguage();
    setLanguageState(resolved);
    persistLanguage(resolved);
    setReady(true);
  }, []);

  const setLanguage = useCallback((lang: Language) => {
    setLanguageState(lang);
    persistLanguage(lang);
  }, []);

  useEffect(() => {
    document.documentElement.lang = language;
  }, [language]);

  const t = useCallback(
    (key: TranslationKey): string => {
      return translations[language][key] ?? key;
    },
    [language],
  );

  const value = useMemo(
    () => ({ language, setLanguage, t, ready }),
    [language, setLanguage, t, ready],
  );

  return (
    <LanguageContext.Provider value={value}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage(): LanguageContextValue {
  const ctx = useContext(LanguageContext);
  if (!ctx) {
    throw new Error("useLanguage must be used within a LanguageProvider");
  }
  return ctx;
}
