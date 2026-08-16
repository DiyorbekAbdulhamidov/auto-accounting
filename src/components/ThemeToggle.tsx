"use client";

import { useEffect, useState } from "react";
import { Moon, Sun } from "lucide-react";
import { useT } from "@/context/LanguageContext";
import { buttonClasses } from "@/components/ui";

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
      className={buttonClasses("secondary", "md", { iconOnly: true })}
      title={t("Тунги/Кундузги режим")}
    >
      {dark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
    </button>
  );
}
