"use client";

import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { Languages, Check } from "lucide-react";
import { useLanguage } from "@/context/LanguageContext";
import { LANGS, LANG_LABELS, LANG_SHORT, type Lang } from "@/lib/i18n";

/**
 * Тил танлаш.
 *
 * Рўйхат ПОРТАЛ орқали <body> га чиқарилади, оддий `absolute` эмас.
 * Сабаби: саҳифалардаги карточкалар ва панеллар ўз stacking-контекстини
 * ярatadi (`relative z-10`, `overflow-hidden`, `backdrop-filter`), шунда
 * рўйхат уларнинг ОРҚАСИДА қолиб кетарди ва устига босганда босиш
 * карточкага тушиб, менюда ҳеч нарса танланмасди. z-index'ни ошириш
 * бу муаммони ҳар янги саҳифада қайтадан келтириб чиқарарди — портал
 * эса контекстдан бутунлай чиқиб кетади.
 */
export default function LanguageToggle() {
  const { lang, setLang, t } = useLanguage();
  const [open, setOpen] = useState(false);
  const [pos, setPos] = useState<{ top: number; right: number } | null>(null);
  const btnRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  const place = useCallback(() => {
    const r = btnRef.current?.getBoundingClientRect();
    if (!r) return;
    setPos({ top: r.bottom + 8, right: Math.max(8, window.innerWidth - r.right) });
  }, []);

  useLayoutEffect(() => {
    if (open) place();
  }, [open, place]);

  useEffect(() => {
    if (!open) return;

    function onDown(e: MouseEvent) {
      const target = e.target as Node;
      // Тугмага ёки менюнинг ўзига босилса — ёпмаймиз
      if (btnRef.current?.contains(target)) return;
      if (menuRef.current?.contains(target)) return;
      setOpen(false);
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    // Саҳифа сурилса меню тугмадан ажралиб қолмаслиги учун ёпамиз
    function onScroll() {
      setOpen(false);
    }

    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    window.addEventListener("resize", place);
    window.addEventListener("scroll", onScroll, true);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey);
      window.removeEventListener("resize", place);
      window.removeEventListener("scroll", onScroll, true);
    };
  }, [open, place]);

  const pick = (l: Lang) => {
    setLang(l);
    setOpen(false);
  };

  return (
    <>
      <button
        ref={btnRef}
        suppressHydrationWarning
        onClick={() => setOpen((o) => !o)}
        title={t("Тилни танлаш")}
        aria-haspopup="listbox"
        aria-expanded={open}
        className="flex items-center gap-1.5 px-2.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/60 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all duration-300"
      >
        <Languages className="w-4 h-4" />
        <span className="text-xs font-bold tabular">{LANG_SHORT[lang]}</span>
      </button>

      {open && pos !== null &&
        createPortal(
          <div
            ref={menuRef}
            role="listbox"
            style={{ position: "fixed", top: pos.top, right: pos.right, zIndex: 2147483000 }}
            className="w-44 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-2xl overflow-hidden"
          >
            {LANGS.map((l) => (
              <button
                key={l}
                role="option"
                aria-selected={l === lang}
                onClick={() => pick(l)}
                className={`w-full flex items-center justify-between gap-2 px-3.5 py-2.5 text-sm text-left transition-colors ${
                  l === lang
                    ? "bg-indigo-500/10 text-indigo-700 dark:text-indigo-300 font-bold"
                    : "text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
                }`}
              >
                <span>{LANG_LABELS[l]}</span>
                <span className="flex items-center gap-2">
                  <span className="text-[10px] font-bold opacity-60">{LANG_SHORT[l]}</span>
                  {l === lang && <Check className="w-3.5 h-3.5" />}
                </span>
              </button>
            ))}
          </div>,
          document.body
        )}
    </>
  );
}
