"use client";

import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { Languages, Check } from "lucide-react";
import { useLanguage } from "@/context/LanguageContext";
import { LANGS, LANG_LABELS, LANG_SHORT, type Lang } from "@/lib/i18n";
import { buttonClasses, cx } from "@/components/ui";

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
        className={buttonClasses("secondary", "md")}
      >
        <Languages className="h-4 w-4" />
        <span className="text-caption font-medium tabular">{LANG_SHORT[lang]}</span>
      </button>

      {open && pos !== null &&
        createPortal(
          <div
            ref={menuRef}
            role="listbox"
            style={{ position: "fixed", top: pos.top, right: pos.right, zIndex: 2147483000 }}
            className="w-44 overflow-hidden rounded-lg border border-line bg-surface shadow-lg"
          >
            {LANGS.map((l) => (
              <button
                key={l}
                role="option"
                aria-selected={l === lang}
                onClick={() => pick(l)}
                className={cx(
                  "flex w-full items-center justify-between gap-2 px-3 py-2.5 text-left text-body transition-colors",
                  l === lang
                    ? "bg-accent-soft font-medium text-accent"
                    : "text-ink-2 hover:bg-surface-2 hover:text-ink"
                )}
              >
                <span>{LANG_LABELS[l]}</span>
                <span className="flex items-center gap-2">
                  <span className="text-caption opacity-60">{LANG_SHORT[l]}</span>
                  {l === lang && <Check className="h-3.5 w-3.5" />}
                </span>
              </button>
            ))}
          </div>,
          document.body
        )}
    </>
  );
}
