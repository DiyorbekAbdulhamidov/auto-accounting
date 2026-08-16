// ============================================================
// ИЛОВА ҚАТЛАМИ — кириш талаб қиладиган ҳамма саҳифа шу остида
// ------------------------------------------------------------
// Иккита нарса шу ерда БИР МАРТА қилинади:
//   1. Кириш текшируви. Илгари ҳар саҳифа ўзи текширарди —
//      биттаси унутилса, саҳифа ҳимоясиз қоларди.
//   2. Юқори қатор: логотип, қўлланма, тил, тема, чиқиш.
//
// Модуль ранги бу ерда ЙЎҚ: юқори қатор бренд, у кирим ёки чиқимга
// боғлиқ эмас. Ранг фақат сверка саҳифасининг ичида.
// ============================================================
"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import NextLink from "next/link";
import { BookOpen, LogOut } from "lucide-react";
import Logo from "@/components/Brand";
import ThemeToggle from "@/components/ThemeToggle";
import LanguageToggle from "@/components/LanguageToggle";
import { useAuth } from "@/context/AuthContext";
import { useT } from "@/context/LanguageContext";
import { Button, PageLoader, buttonClasses, layout } from "@/components/ui";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const { user, loading, logout } = useAuth();
  const router = useRouter();
  const t = useT();

  useEffect(() => {
    if (!loading && !user) router.replace("/login");
  }, [loading, user, router]);

  if (loading || !user) {
    return <PageLoader text={t("Хавфсизлик текшируви...")} />;
  }

  return (
    <div className={layout.page}>
      <header className="sticky top-0 z-40 border-b border-line bg-surface/95 backdrop-blur">
        <div className="mx-auto flex w-full max-w-[1500px] items-center justify-between gap-3 px-4 py-2.5 md:px-6">
          <NextLink href="/korxonalar" aria-label={t("Бош саҳифа")}>
            <Logo size="sm" />
          </NextLink>

          <div className="flex items-center gap-2">
            <NextLink
              href="/qollanma"
              className={buttonClasses("ghost", "sm")}
              title={t("Қўлланма")}
            >
              <BookOpen className="h-4 w-4" />
              <span className="hidden sm:inline">{t("Қўлланма")}</span>
            </NextLink>
            <LanguageToggle />
            <ThemeToggle />
            <Button
              variant="secondary"
              size="sm"
              onClick={logout}
              icon={<LogOut className="h-4 w-4" />}
              title={t("Тизимдан чиқиш")}
            >
              <span className="hidden sm:inline">{t("Чиқиш")}</span>
            </Button>
          </div>
        </div>
      </header>

      {children}
    </div>
  );
}
