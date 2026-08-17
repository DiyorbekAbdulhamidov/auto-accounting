"use client";

import { createContext, useCallback, useContext, useMemo } from "react";
import { usePathname } from "next/navigation";
import { translate, LANG_TO_LOCALE, type Lang, type Locale } from "@/lib/i18n";
import { switchLocale } from "@/lib/routes";

// ============================================================
// ТИЛ — энди МАНЗИЛДА
// ------------------------------------------------------------
// Илгари тил `localStorage` да турарди. Иккита муаммо бор эди:
//   1. Google уни УМУМАН кўрмасди — қидирув тизими фақат битта
//      (стандарт) вариантни индекслайди, русча қидирган буxгалтер
//      эса ҳеч қачон топмасди.
//   2. Сервер ва браузер ҳар хил HTML чиқарарди (гидратация).
//
// Энди тил `app/[locale]/layout.tsx` дан ПРОП бўлиб келади, яъни
// сервер ва клиент айнан бир хил матн чизади. `useSyncExternalStore`
// ва localStorage'дан ўқиш КЕРАК ЭМАС.
//
// Тил алмаштирилганда одам ЎША саҳифасида қолади — фақат манзилнинг
// биринчи бўлаги ўзгаради (`switchLocale`).
// ============================================================

/** Проxи келгуси сафар тўғри тилга йўналтириши учун */
const LOCALE_COOKIE = "NEXT_LOCALE";

interface LanguageValue {
  lang: Lang;
  locale: Locale;
  setLang: (l: Lang) => void;
  /** Кирилл матнни жорий тилга ўгиради */
  t: (text: string) => string;
}

const LanguageContext = createContext<LanguageValue>({
  lang: "uz-latn",
  locale: "uz",
  setLang: () => {},
  t: (text) => text,
});

export function LanguageProvider({
  lang,
  locale,
  children,
}: {
  lang: Lang;
  locale: Locale;
  children: React.ReactNode;
}) {
  const pathname = usePathname();

  const setLang = useCallback(
    (l: Lang) => {
      const next = LANG_TO_LOCALE[l];
      try {
        // Бир йил — тил танлови камдан-кам ўзгаради
        document.cookie = `${LOCALE_COOKIE}=${next}; path=/; max-age=31536000; samesite=lax`;
      } catch {}
      // ТЎЛИҚ саҳифа юклаш, `router.push` ЭМАС. Иккита сабаб, иккиси
      // ҳам браузерда ЎЛЧАНГАН (2026-08-17):
      //
      //  1. Тил манзилнинг БИРИНЧИ бўлагида, яъни илдиз layout
      //     алмашади. React бутун дарахтни қайта монтаж қилади ва
      //     layout'даги тема скриптини КЛИЕНТДА яратишга уринади —
      //     браузер уни бажармайди, консолда хато чиқади.
      //  2. Юмшоқ ўтишнинг фойдаси ҳам йўқ эди: ўлчовда `<main>` ва
      //     `<header>` тугунлари барибир ЯНГИДАН яратилди, яъни
      //     компонент ҳолати (юкланган файл, ўқилган ҳисобот)
      //     `router.push` да ҳам сақланмасди.
      //
      // Тўлиқ юклашда `<html lang>`, мета маълумот ва cookie бир
      // марта, аниқ ҳолда қўйилади.
      window.location.assign(switchLocale(pathname, next));
    },
    [pathname]
  );

  const t = useCallback((text: string) => translate(text, lang), [lang]);

  const value = useMemo(() => ({ lang, locale, setLang, t }), [lang, locale, setLang, t]);

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

/** Ҳавола қуриш учун: `path("pricing", useLocale())` */
export function useLocale(): Locale {
  return useContext(LanguageContext).locale;
}
