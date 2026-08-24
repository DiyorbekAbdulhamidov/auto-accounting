"use client";

import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { Check, Monitor, Moon, Sun } from "lucide-react";
import { useT } from "@/context/LanguageContext";
import { buttonClasses, cx } from "@/components/ui";

// ============================================================
// ТЕМА — УЧТА ВАРИАНТ, РЎЙХАТДАН ТАНЛАНАДИ
// ------------------------------------------------------------
// СТАНДАРТ ҲОЛАТ — «қурилма»: одам ҳеч нарса танламаган бўлса,
// сайт унинг телефонидаги/тизимидаги созламага эргашади ва кун
// давомида ЎЗИ алмашади. Танласа — танлови эслаб қолинади.
//
// НЕГА РЎЙХАТ, АЙЛАНМА ТУГМА ЭМАС. Айланма тугмада учта ҳолат
// бор, лекин уларнинг БОРЛИГИ кўринмайди: одам биттасини босиб,
// нима бўлганини тахмин қилиши керак эди. Рўйхатда учаласи ҳам
// ёзилган ва қайси бири ёқилгани белги билан кўрсатилган.
//
// БУ ТУГМАДА ҲОЛАТ САҚЛАНМАЙДИ — атайлаб.
//
// Илгари у `useState(() => document.documentElement.classList
// .contains('dark'))` дан бошланарди. Сервер уни ҳар доим `false`
// деб чизарди (`window` йўқ), клиент эса тунги режимда `true` —
// натижада сервер «ой», клиент «қуёш» белгисини чизарди. Иккиси
// БОШҚА SVG, яъни тузилма мос келмасди ва React бутун саҳифани
// гидратация қила олмасдан клиентда ҚАЙТА чизарди (2026-08-17 да
// браузер консолида ўлчанган: «Hydration failed»).
//
// Шунинг учун ТУГМАДАГИ белги: учаласи ҳам чизилади, қайси бири
// кўриниши CSS'да ҳал бўлади (`html[data-theme-pref]`).
// РЎЙХАТ ичида эса ҳолатни DOM'дан ўқиса бўлади — у фақат одам
// босгандан кейин, яъни ФАҚАТ клиентда пайдо бўлади.
//
// Рўйхат ПОРТАЛ орқали <body> га чиқарилади (`LanguageToggle`
// билан бир хил сабаб): саҳифадаги карта ва панеллар ўз
// stacking-контекстини яратади ва оддий `absolute` рўйхат
// уларнинг орқасида қолиб кетарди.
// ============================================================

type Pref = "system" | "light" | "dark";

const OPTIONS: { key: Pref; label: string; Icon: typeof Monitor }[] = [
  { key: "system", label: "Қурилмадагидек", Icon: Monitor },
  { key: "light", label: "Ёруғ", Icon: Sun },
  { key: "dark", label: "Тунги", Icon: Moon },
];

function readPref(): Pref {
  const v = document.documentElement.getAttribute("data-theme-pref");
  return v === "light" || v === "dark" ? v : "system";
}

/** Танловни қўллайди: синф, атрибут ва хотира — учаласи бирга */
function applyPref(pref: Pref) {
  const el = document.documentElement;
  const dark =
    pref === "dark" ||
    (pref === "system" && matchMedia("(prefers-color-scheme: dark)").matches);
  el.classList.toggle("dark", dark);
  el.setAttribute("data-theme-pref", pref);
  try {
    if (pref === "system") localStorage.removeItem("theme");
    else localStorage.setItem("theme", pref);
  } catch {}
}

export default function ThemeToggle() {
  const t = useT();
  const [open, setOpen] = useState(false);
  const [pref, setPref] = useState<Pref>("system");
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

  /* Ҳозирги танлов рўйхат ОЧИЛАЁТГАНДА ўқилади — эффект ичида
     эмас. Сабаб: эффект ичидаги `setState` қўшимча чизишни
     келтириб чиқаради (eslint `set-state-in-effect` ҳам шуни
     айтади), бу ерда эса ҳолат фақат босилганда ўзгаради. */
  const toggle = () => {
    const next = !open;
    if (next) setPref(readPref());
    setOpen(next);
  };

  /* «Қурилма» ҳолатида тизим созламаси ЖОНЛИ кузатилади: одам
     телефонида тунги режимга ўтса, сайт саҳифани янгиламасдан
     ўзгаради. Қўлда танланган бўлса — тегилмайди. */
  useEffect(() => {
    const mq = matchMedia("(prefers-color-scheme: dark)");
    const onChange = () => {
      if (readPref() === "system") applyPref("system");
    };
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, []);

  useEffect(() => {
    if (!open) return;

    function onDown(e: MouseEvent) {
      const target = e.target as Node;
      if (btnRef.current?.contains(target)) return;
      if (menuRef.current?.contains(target)) return;
      setOpen(false);
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
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

  const pick = (p: Pref) => {
    applyPref(p);
    setPref(p);
    setOpen(false);
  };

  return (
    <>
      <button
        ref={btnRef}
        onClick={toggle}
        title={t("Тема")}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-label={t("Тема")}
        className={buttonClasses("secondary", "md", { iconOnly: true })}
      >
        <Monitor className="theme-icon theme-icon-system h-4 w-4" />
        <Sun className="theme-icon theme-icon-light h-4 w-4" />
        <Moon className="theme-icon theme-icon-dark h-4 w-4" />
      </button>

      {open &&
        pos &&
        createPortal(
          <div
            ref={menuRef}
            role="listbox"
            aria-label={t("Тема")}
            style={{ top: pos.top, right: pos.right }}
            className="fixed z-50 min-w-52 overflow-hidden rounded-md border border-line bg-surface shadow-3"
          >
            {OPTIONS.map(({ key, label, Icon }) => {
              const active = pref === key;
              return (
                <button
                  key={key}
                  role="option"
                  aria-selected={active}
                  onClick={() => pick(key)}
                  className={cx(
                    "flex w-full items-center gap-2.5 px-3 py-2.5 text-left text-body transition-colors",
                    active ? "bg-surface-2 text-ink" : "text-ink-2 hover:bg-surface-2"
                  )}
                >
                  <Icon className="h-4 w-4 shrink-0 text-ink-3" />
                  <span className="flex-1">{t(label)}</span>
                  {active && <Check className="h-4 w-4 shrink-0 text-accent-ink" />}
                </button>
              );
            })}
          </div>,
          document.body
        )}
    </>
  );
}
