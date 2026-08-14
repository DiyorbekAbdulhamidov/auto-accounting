"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useSyncExternalStore } from "react";
import { DEFAULT_LANG, isLang, translate, type Lang } from "@/lib/i18n";

const STORAGE_KEY = "lang";

// ------------------------------------------------------------
// Тил — localStorage'да турадиган ТАШҚИ ҳолат. Уни useState +
// useEffect билан ўқиш иккита муаммо туғдирарди: сервер ва браузер
// ҳар хил HTML чиқариши (hydration хатоси) ва эффект ичида setState
// (кетма-кет рендерлар). useSyncExternalStore айнан шунинг учун
// мўлжалланган: серверда getServerSnapshot, браузерда getSnapshot.
// ------------------------------------------------------------

const listeners = new Set<() => void>();

function subscribe(cb: () => void): () => void {
  listeners.add(cb);
  // Бошқа ойнада тил ўзгарса, бу ойна ҳам хабардор бўлсин
  window.addEventListener("storage", cb);
  return () => {
    listeners.delete(cb);
    window.removeEventListener("storage", cb);
  };
}

function getSnapshot(): Lang {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    return isLang(saved) ? saved : DEFAULT_LANG;
  } catch {
    // localStorage ёпиқ бўлса — стандарт тилда ишлайверамиз
    return DEFAULT_LANG;
  }
}

/** Серверда ва гидратация пайтида ҲАР ДОИМ стандарт тил */
function getServerSnapshot(): Lang {
  return DEFAULT_LANG;
}

function writeLang(l: Lang): void {
  try {
    localStorage.setItem(STORAGE_KEY, l);
  } catch {}
  for (const cb of listeners) cb();
}

interface LanguageValue {
  lang: Lang;
  setLang: (l: Lang) => void;
  /** Кирилл матнни жорий тилга ўгиради */
  t: (text: string) => string;
}

const LanguageContext = createContext<LanguageValue>({
  lang: DEFAULT_LANG,
  setLang: () => {},
  t: (text) => text,
});

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const lang = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);

  // <html lang> ни жорий тилга мослаш — браузер ва скрин-ридерлар учун
  useEffect(() => {
    document.documentElement.lang = lang === "ru" ? "ru" : lang === "en" ? "en" : "uz";
  }, [lang]);

  const setLang = useCallback((l: Lang) => writeLang(l), []);

  const t = useCallback((text: string) => translate(text, lang), [lang]);

  const value = useMemo(() => ({ lang, setLang, t }), [lang, setLang, t]);

  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>;
}

/** Жорий тил, уни ўзгартириш ва таржима функцияси */
export function useLanguage(): LanguageValue {
  return useContext(LanguageContext);
}

/** Фақат таржима функцияси керак бўлганда: `const t = useT()` */
export function useT(): (text: string) => string {
  return useContext(LanguageContext).t;
}
