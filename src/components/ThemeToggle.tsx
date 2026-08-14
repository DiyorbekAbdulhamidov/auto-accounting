"use client";

import { useEffect, useState } from "react";
import { Moon, Sun } from "lucide-react";
import { useT } from "@/context/LanguageContext";

export default function ThemeToggle() {
  const t = useT();
  const [dark, setDark] = useState(
    () => typeof window !== "undefined" && document.documentElement.classList.contains("dark")
  );

  useEffect(() => {
    document.documentElement.classList.toggle("dark", dark);
    try {
      localStorage.setItem("theme", dark ? "dark" : "light");
    } catch {}
  }, [dark]);

  return (
    <button
      suppressHydrationWarning
      onClick={() => setDark((d) => !d)}
      className="p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/60 text-slate-600 dark:text-amber-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all duration-300"
      title={t("Тунги/Кундузги режим")}
    >
      {dark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
    </button>
  );
}
