"use client";

import { Moon, Sun } from "lucide-react";
import { useT } from "@/context/LanguageContext";
import { buttonClasses } from "@/components/ui";

// ============================================================
// ТУНГИ/КУНДУЗГИ РЕЖИМ
// ------------------------------------------------------------
// Бу тугмада React ҲОЛАТИ ЙЎҚ — атайлаб.
//
// Илгари у `useState(() => document.documentElement.classList
// .contains('dark'))` дан бошланарди. Сервер уни ҳар доим `false`
// деб чизарди (`window` йўқ), клиент эса тунги режимда `true` —
// натижада сервер «ой» белгисини, клиент «қуёш» белгисини чизарди.
// Иккиси БОШҚА SVG, яъни тузилма мос келмасди ва React бутун
// саҳифани гидратация қила олмасдан клиентда ҚАЙТА чизарди.
//
// Ўлчанган (2026-08-17, браузер консоли): тунги режим ёқилган ҳар
// қандай саҳифа юкланишида «Hydration failed» хатоси чиқарди.
// `suppressHydrationWarning` буни ЯШИРМАЙДИ — у фақат элементнинг
// ЎЗ атрибути учун, ичидаги тузилма учун эмас.
//
// Ечим: иккала белги ҳам ҳар доим чизилади, қайси бири кўриниши
// эса CSS'да (`dark:` варианти) ҳал қилинади. Сервер ва клиент
// АЙНАН бир хил HTML чиқаради. Ҳолат эса ягона ҳақиқий манбада —
// `<html>` элементининг синфида — туради.
// ============================================================

export default function ThemeToggle() {
  const t = useT();

  return (
    <button
      onClick={() => {
        const next = !document.documentElement.classList.contains("dark");
        document.documentElement.classList.toggle("dark", next);
        try {
          localStorage.setItem("theme", next ? "dark" : "light");
        } catch {}
      }}
      className={buttonClasses("secondary", "md", { iconOnly: true })}
      title={t("Тунги/Кундузги режим")}
      aria-label={t("Тунги/Кундузги режим")}
    >
      <Moon className="h-4 w-4 dark:hidden" />
      <Sun className="hidden h-4 w-4 dark:block" />
    </button>
  );
}
