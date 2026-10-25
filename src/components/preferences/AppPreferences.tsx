"use client";

import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { Languages, Moon, Sun } from "lucide-react";

type Locale = "fr" | "en";
type Theme = "light" | "dark";
type Preferences = { locale: Locale; theme: Theme; t: (fr: string, en: string) => string };

const PreferencesContext = createContext<Preferences>({ locale: "fr", theme: "light", t: (fr) => fr });

export function useAppPreferences() {
  return useContext(PreferencesContext);
}

export function AppPreferences({ children }: Readonly<{ children: ReactNode }>) {
  const [locale, setLocale] = useState<Locale>("fr");
  const [theme, setTheme] = useState<Theme>("light");
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      const savedLocale = localStorage.getItem("terra-locale");
      const savedTheme = localStorage.getItem("terra-theme");
      if (savedLocale === "en" || savedLocale === "fr") setLocale(savedLocale);
      if (savedTheme === "dark" || savedTheme === "light") setTheme(savedTheme);
      setReady(true);
    }, 0);
    return () => window.clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (!ready) return;
    document.documentElement.lang = locale;
    document.documentElement.dataset.theme = theme;
    localStorage.setItem("terra-locale", locale);
    localStorage.setItem("terra-theme", theme);
  }, [locale, theme, ready]);

  const value = useMemo(() => ({ locale, theme, t: (fr: string, en: string) => locale === "en" ? en : fr }), [locale, theme]);
  return <PreferencesContext.Provider value={value}>
    <div className="app-preference-controls" aria-label={locale === "en" ? "Display preferences" : "Préférences d’affichage"}>
      <button type="button" onClick={() => setLocale((current) => current === "fr" ? "en" : "fr")} aria-label={locale === "en" ? "Switch to French" : "Switch to English"} title={locale === "en" ? "Switch to French" : "Switch to English"}>
        <Languages size={15} /><span>{locale.toUpperCase()}</span>
      </button>
      <button type="button" onClick={() => setTheme((current) => current === "light" ? "dark" : "light")} aria-label={theme === "dark" ? (locale === "en" ? "Switch to light mode" : "Activer le mode clair") : (locale === "en" ? "Switch to dark mode" : "Activer le mode nuit")} title={theme === "dark" ? (locale === "en" ? "Light mode" : "Mode clair") : (locale === "en" ? "Dark mode" : "Mode nuit")}>
        {theme === "dark" ? <Sun size={15} /> : <Moon size={15} />}<span>{theme === "dark" ? (locale === "en" ? "Light" : "Clair") : (locale === "en" ? "Dark" : "Nuit")}</span>
      </button>
    </div>
    <div className="app-preferences-content">{children}</div>
  </PreferencesContext.Provider>;
}
